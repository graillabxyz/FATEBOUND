import { LEGENDS } from "../src/content/legends";
import { validateRecord } from "./validation";
import type { MatchRecord } from "../src/metrics/data";
export interface Statement {
  bind(...values: unknown[]): Statement;
  run(): Promise<unknown>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
}
export interface Database {
  prepare(sql: string): Statement;
  batch(statements: Statement[]): Promise<unknown[]>;
}
export interface Env {
  DB: Database;
  ASSETS?: { fetch(request: Request): Promise<Response> };
  LOCAL_DEV?: string;
}
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
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
async function body(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 1_500_000)
    throw new Error("Request too large.");
  const text = await request.text();
  if (text.length > 1_500_000) throw new Error("Request too large.");
  return JSON.parse(text);
}
async function saveRecords(
  env: Env,
  records: MatchRecord[],
  source: MatchRecord["source"],
) {
  if (!Array.isArray(records) || records.length < 1 || records.length > 25)
    throw new Error("Send 1–25 records per batch.");
  const clean = records.map((record) => validateRecord(record, source));
  await env.DB.batch(
    clean.map((r) =>
      env.DB.prepare(
        "INSERT INTO matches (id, source, mechanical_version, created_at, legend_a, legend_b, payload) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING",
      ).bind(
        r.id,
        r.source,
        r.version,
        r.timestamp,
        r.loadouts[0].legend,
        r.loadouts[1].legend,
        JSON.stringify(r),
      ),
    ),
  );
  return clean.length;
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) {
      if (url.pathname === "/")
        return Response.redirect(new URL("/metrics", url), 302);
      if (!env.ASSETS)
        return new Response("Static assets unavailable.", { status: 503 });
      const result = await env.ASSETS.fetch(request);
      if (
        result.status === 404 &&
        !url.pathname.split("/").at(-1)?.includes(".")
      )
        return env.ASSETS.fetch(
          // Asset hosts canonicalize /index.html with a redirect to /. Fetch
          // the root document directly so SPA routes retain their pathname.
          new Request(new URL("/", url), request),
        );
      return result;
    }
    // Private Sites validate identity at the dispatcher. This check also fails closed on missing identity.
    if (
      env.LOCAL_DEV !== "true" &&
      !request.headers.get("oai-authenticated-user-id")
    )
      return json({ error: "Authentication required." }, 401);
    if (request.method === "POST") {
      const origin = request.headers.get("origin");
      if (
        origin &&
        origin !== url.origin &&
        !(
          env.LOCAL_DEV === "true" &&
          /^http:\/\/(127\.0\.0\.1|localhost):517[0-9]$/.test(origin)
        )
      )
        return json({ error: "Origin rejected." }, 403);
    }
    try {
      if (url.pathname === "/api/health")
        return json({ ok: true, storage: "D1/SQLite", mechanicalVersion: 1 });
      if (url.pathname === "/api/telemetry" && request.method === "POST") {
        const value = await body(request);
        let count = 0;
        if (value.matches?.length)
          count = await saveRecords(env, value.matches, "live");
        if (value.events !== undefined) {
          if (!Array.isArray(value.events) || value.events.length > 100)
            throw new Error("At most 100 events per batch.");
          const rows = value.events.map(
            (e: { id: string; event: string; session: string; at: number }) => {
              if (
                !e ||
                !events.has(e.event) ||
                typeof e.id !== "string" ||
                e.id.length > 120 ||
                !Number.isFinite(e.at) ||
                Math.abs(Date.now() - e.at) > 90 * 86400000 ||
                typeof e.session !== "string" ||
                e.session.length > 100
              )
                throw new Error("Invalid event.");
              return env.DB.prepare(
                "INSERT INTO usage_events (id, event, session_id, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO NOTHING",
              ).bind(e.id, e.event, e.session, new Date(e.at).toISOString());
            },
          );
          if (rows.length) await env.DB.batch(rows);
        }
        return json({ accepted: count });
      }
      if (url.pathname === "/api/simulations" && request.method === "POST") {
        const value = await body(request);
        return json({
          accepted: await saveRecords(env, value.records, "simulation"),
        });
      }
      if (url.pathname === "/api/lab-results" && request.method === "POST") {
        const value = await body(request);
        return json({ accepted: await saveRecords(env, value.records, "lab") });
      }
      if (url.pathname === "/api/metrics" && request.method === "GET") {
        const source = url.searchParams.get("source") ?? "live";
        if (!["live", "simulation", "lab"].includes(source))
          throw new Error("Invalid source.");
        const days = Number(url.searchParams.get("days") ?? 30);
        if (![1, 7, 30, 90].includes(days))
          throw new Error("Invalid date range.");
        const since = new Date(Date.now() - days * 86400000).toISOString();
        const legend = url.searchParams.get("legend") ?? "all",
          opponent = url.searchParams.get("opponent") ?? "all";
        if (
          [legend, opponent].some(
            (id) => id !== "all" && !LEGENDS.some((l) => l.id === id),
          )
        )
          throw new Error("Invalid matchup filter.");
        const values: unknown[] = [source, since];
        let where = "source = ? AND created_at >= ?";
        if (legend !== "all" && opponent !== "all") {
          where +=
            " AND ((legend_a = ? AND legend_b = ?) OR (legend_a = ? AND legend_b = ?))";
          values.push(legend, opponent, opponent, legend);
        } else if (legend !== "all" || opponent !== "all") {
          const id = legend === "all" ? opponent : legend;
          where += " AND (legend_a = ? OR legend_b = ?)";
          values.push(id, id);
        }

        const [records, total, counts, active] = await Promise.all([
          env.DB.prepare(
            `SELECT payload FROM matches WHERE ${where} ORDER BY created_at DESC, id DESC LIMIT 2500`,
          )
            .bind(...values)
            .all<{ payload: string }>(),
          env.DB.prepare(`SELECT COUNT(*) AS n FROM matches WHERE ${where}`)
            .bind(...values)
            .first<{ n: number }>(),
          env.DB.prepare(
            "SELECT event, COUNT(*) AS count FROM usage_events WHERE created_at >= ? AND event != 'session_heartbeat' GROUP BY event ORDER BY count DESC",
          )
            .bind(since)
            .all(),
          env.DB.prepare(
            "SELECT COUNT(DISTINCT session_id) AS n FROM usage_events WHERE created_at >= ?",
          )
            .bind(new Date(Date.now() - 15 * 60000).toISOString())
            .first<{ n: number }>(),
        ]);
        return json({
          records: records.results.map((r) => JSON.parse(r.payload)),
          total: total?.n ?? 0,
          events: counts.results,
          activeSessions: active?.n ?? 0,
          updatedAt: new Date().toISOString(),
          hasMore: (total?.n ?? 0) > 2500,
        });
      }
      return json({ error: "Not found." }, 404);
    } catch (error) {
      return json({ error: (error as Error).message }, 400);
    }
  },
};
