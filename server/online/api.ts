import { createClient } from "@supabase/supabase-js";
import { GAME } from "../../src/content/config";
import { LEGENDS } from "../../src/content/legends";
import { recordMatch } from "../../src/metrics/data";
import { validateRecord } from "../validation";
import {
  checkedLoadout,
  startOnline,
  applyOnline,
  expireOnline,
  playerViews,
} from "./authority";
import type { MatchState, Plan } from "../../src/engine/types";
export type OnlineEnv = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
const canonical = (value: unknown): string =>
  JSON.stringify(
    value === null || typeof value !== "object"
      ? value
      : Array.isArray(value)
        ? value.map((x) => JSON.parse(canonical(x)))
        : Object.fromEntries(
            Object.entries(value)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, v]) => [k, JSON.parse(canonical(v))]),
          ),
  );
const uuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
const events = new Set([
  "tutorial_started",
  "tutorial_completed",
  "match_started",
  "match_completed",
  "match_abandoned",
  "legend_selected",
  "loadout_changed",
  "card_used",
  "control_used",
  "dice_face_result",
  "shop_viewed",
  "cosmetic_previewed",
  "purchase_started",
  "purchase_completed",
  "battle_pass_viewed",
  "battle_pass_upgraded",
  "quest_completed",
  "rank_changed",
  "session_heartbeat",
]);
type StoredMatch = {
  id: string;
  host_id: string;
  guest_id: string | null;
  host_loadout: unknown;
  state: MatchState | null;
  revision: number;
};
export async function onlineApi(
  request: Request,
  env: OnlineEnv,
): Promise<Response> {
  const url = new URL(request.url),
    path = url.pathname.replace(/^.*\/omnipath-api/, "/api");
  if (path === "/api/health")
    return json({
      ok: true,
      product: "OMNIPATH",
      mechanicalVersion: GAME.version,
      storage: "Supabase Postgres",
    });
  if (!["GET", "POST"].includes(request.method))
    return json({ error: "Method not allowed." }, 405);
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return json({ error: "Sign in required." }, 401);
  const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: identity, error: authError } = await db.auth.getUser(token);
  if (authError || !identity.user)
    return json({ error: "Invalid or expired session." }, 401);
  const user = identity.user.id;
  const run = async (name: string, args: Record<string, unknown>) => {
    const { data, error } = await db.rpc(name, args);
    if (error) throw new Error(error.message);
    return data;
  };
  try {
    let body: Record<string, unknown> = {};
    if (request.method === "POST") {
      const text = await request.text();
      if (text.length > 1_500_000)
        return json({ error: "Request too large." }, 413);
      body = JSON.parse(text);
      if (!body || typeof body !== "object" || Array.isArray(body))
        throw new Error("Invalid request.");
    }
    const requireStaff = async () => {
      const { data, error } = await db
        .from("developer_members")
        .select("role")
        .eq("user_id", user)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    };
    const owned = async () => {
      const { data, error } = await db
        .from("inventory")
        .select("content_id")
        .eq("user_id", user);
      if (error) throw error;
      return new Set((data ?? []).map((x) => x.content_id as string));
    };
    if (path === "/api/account") {
      const { data, error } = await db
        .from("profiles")
        .select("*")
        .eq("id", user)
        .single();
      if (error) throw error;
      return json({ profile: data, developer: await requireStaff() });
    }
    if (path === "/api/matches/create" && request.method === "POST") {
      const loadout = checkedLoadout(body.loadout, await owned());
      return json(
        await run("server_create_match", {
          p_user: user,
          p_loadout: loadout,
          p_version: GAME.version,
        }),
        201,
      );
    }
    if (path === "/api/matches/join" && request.method === "POST") {
      if (!uuid(body.inviteCode)) throw new Error("Invalid invite code.");
      const room = (await run("server_read_match", {
        p_user: user,
        p_code: body.inviteCode,
      })) as StoredMatch | null;
      if (!room) return json({ error: "Room unavailable or expired." }, 404);
      if (room.host_id === user) throw new Error("Join from a second account.");
      const loadout = checkedLoadout(body.loadout, await owned());
      const seed = crypto.getRandomValues(new Uint32Array(1))[0];
      const state = startOnline(
        room.id,
        seed,
        [room.host_loadout as typeof loadout, loadout],
        Date.now(),
      );
      const accepted = await run("server_join_match", {
        p_user: user,
        p_id: room.id,
        p_state: state,
        p_views: playerViews(state),
      });
      return accepted
        ? json({ matchId: room.id, seat: 1, view: playerViews(state)[1] })
        : json({ error: "Room already joined." }, 409);
    }
    if (path === "/api/matches/state" || path === "/api/matches/command") {
      const id =
        request.method === "GET" ? url.searchParams.get("id") : body.matchId;
      if (!uuid(id)) throw new Error("Invalid match ID.");
      const room = (await run("server_read_match", {
        p_user: user,
        p_id: id,
      })) as StoredMatch | null;
      if (!room) return json({ error: "Match not found." }, 404);
      if (!room.state) return json({ matchId: id, status: "waiting", seat: 0 });
      const seat = room.host_id === user ? 0 : 1;
      const commit = async (
        next: MatchState,
        commandId: string,
        command: unknown,
      ) =>
        run("server_commit_match", {
          p_user: user,
          p_id: id,
          p_expected: room.revision,
          p_command: commandId,
          p_request: command,
          p_state: next,
          p_views: playerViews(next),
          p_result:
            next.phase === "MATCH_END"
              ? recordMatch(next, "live", "Online PvP", null, [
                  "human",
                  "human",
                ])
              : null,
        });
      const expired = expireOnline(room.state, Date.now());
      if (expired.revision !== room.revision) {
        await commit(expired, crypto.randomUUID(), {
          kind: "timeout",
          revision: room.revision,
        });
        const fresh = (await run("server_read_match", {
          p_user: user,
          p_id: id,
        })) as StoredMatch;
        return request.method === "GET"
          ? json({ matchId: id, seat, view: playerViews(fresh.state!)[seat] })
          : json(
              {
                error: "Decision timed out.",
                view: playerViews(fresh.state!)[seat],
              },
              409,
            );
      }
      if (path === "/api/matches/state" && request.method === "GET")
        return json({ matchId: id, seat, view: playerViews(room.state)[seat] });
      if (path !== "/api/matches/command" || request.method !== "POST")
        return json({ error: "Method not allowed." }, 405);
      if (!uuid(body.commandId) || !Number.isInteger(body.revision))
        throw new Error("Command ID and revision required.");
      const requestBody = { revision: body.revision, plan: body.plan };
      const receipt = await run("server_command_receipt", {
        p_user: user,
        p_id: id,
        p_command: body.commandId,
      });
      if (receipt) {
        if (canonical(receipt) !== canonical(requestBody))
          throw new Error("Conflicting duplicate command.");
        return json({
          matchId: id,
          seat,
          duplicate: true,
          view: playerViews(room.state)[seat],
        });
      }
      if (body.revision !== room.revision)
        return json(
          {
            error: "Stale decision window.",
            view: playerViews(room.state)[seat],
          },
          409,
        );
      const next = applyOnline(
        room.state,
        seat,
        body.plan as Plan,
        body.revision as number,
        Date.now(),
      );
      const result = await commit(next, body.commandId, requestBody);
      if (result === "stale")
        return json(
          { error: "Another command won this revision. Refresh." },
          409,
        );
      return json({ matchId: id, seat, view: playerViews(next)[seat] });
    }
    if (
      ["/api/metrics", "/api/simulations", "/api/lab-results"].includes(path) &&
      !(await requireStaff())
    )
      return json({ error: "Developer access required." }, 403);
    if (
      path === "/api/telemetry" ||
      path === "/api/simulations" ||
      path === "/api/lab-results"
    ) {
      if (request.method !== "POST")
        return json({ error: "Method not allowed." }, 405);
      const source =
        path === "/api/simulations"
          ? "simulation"
          : path === "/api/lab-results"
            ? "lab"
            : "live";
      const rows = (source === "live" ? body.matches : body.records) ?? [];
      if (!Array.isArray(rows) || rows.length > 25)
        throw new Error("At most 25 matches per batch.");
      const records = rows.map((r) => validateRecord(r, source));
      if (records.length) {
        const { error } = await db.from("match_results").upsert(
          records.map((r) => ({
            id: `${user}:${r.id}`,
            source,
            authority: source === "live" ? "client" : source,
            user_id: user,
            mechanical_version: r.version,
            created_at: r.timestamp,
            legend_a: r.loadouts[0].legend,
            legend_b: r.loadouts[1].legend,
            payload: {
              ...r,
              id: `${user}:${r.id}`,
              pair: r.pair
                ? { ...r.pair, id: `${user}:${r.pair.id}` }
                : undefined,
            },
          })),
          { onConflict: "id", ignoreDuplicates: true },
        );
        if (error) throw error;
      }
      if (body.events !== undefined) {
        if (!Array.isArray(body.events) || body.events.length > 100)
          throw new Error("At most 100 events.");
        const rows = body.events.map(
          (e: { id: string; event: string; session: string; at: number }) => {
            if (
              !uuid(e.id) ||
              !events.has(e.event) ||
              typeof e.session !== "string" ||
              e.session.length > 100 ||
              !Number.isFinite(e.at) ||
              Math.abs(Date.now() - e.at) > 90 * 86400000
            )
              throw new Error("Invalid event.");
            return {
              id: e.id,
              user_id: user,
              event: e.event,
              session_id: e.session,
              created_at: new Date(e.at).toISOString(),
            };
          },
        );
        if (rows.length) {
          const { error } = await db
            .from("usage_events")
            .upsert(rows, { onConflict: "id", ignoreDuplicates: true });
          if (error) throw error;
        }
      }
      return json({ accepted: records.length });
    }
    if (path === "/api/metrics" && request.method === "GET") {
      const source = url.searchParams.get("source") ?? "live",
        days = Number(url.searchParams.get("days") ?? 30),
        legend = url.searchParams.get("legend") ?? "all",
        opponent = url.searchParams.get("opponent") ?? "all";
      if (
        !["live", "simulation", "lab"].includes(source) ||
        ![1, 7, 30, 90].includes(days) ||
        [legend, opponent].some(
          (x) => x !== "all" && !LEGENDS.some((l) => l.id === x),
        )
      )
        throw new Error("Invalid metric filters.");
      const since = new Date(Date.now() - days * 86400000).toISOString();
      let query = db
        .from("match_results")
        .select("payload", { count: "exact" })
        .eq("source", source)
        .eq("mechanical_version", GAME.version)
        .gte("created_at", since);
      if (legend !== "all" && opponent !== "all")
        query = query.or(
          `and(legend_a.eq.${legend},legend_b.eq.${opponent}),and(legend_a.eq.${opponent},legend_b.eq.${legend})`,
        );
      else if (legend !== "all" || opponent !== "all") {
        const id = legend === "all" ? opponent : legend;
        query = query.or(`legend_a.eq.${id},legend_b.eq.${id}`);
      }
      const [{ data, error, count }, eventResult] = await Promise.all([
        query.order("created_at", { ascending: false }).limit(2500),
        db.rpc("server_usage_summary", { p_since: since }),
      ]);
      if (error) throw error;
      if (eventResult.error) throw eventResult.error;
      return json({
        records: (data ?? []).map((x) => x.payload),
        total: count ?? 0,
        events: eventResult.data.events ?? [],
        activeSessions: eventResult.data.activeSessions ?? 0,
        updatedAt: new Date().toISOString(),
        hasMore: (count ?? 0) > (data?.length ?? 0),
      });
    }
    return json({ error: "Not found." }, 404);
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : "Request failed." },
      400,
    );
  }
}
