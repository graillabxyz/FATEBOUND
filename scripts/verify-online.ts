/** Explicit integration run against disposable QA accounts, never ordinary player accounts. */
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { STARTERS } from "../src/content/loadouts";
import { choosePlan } from "../src/engine/ai";
import type {
  MatchView,
  PlayerState,
  DecisionContext,
} from "../src/engine/types";
const url = process.env.SUPABASE_URL!,
  key = process.env.SUPABASE_PUBLISHABLE_KEY!;
if (!url || !key || !process.env.OMNIPATH_QA_ACCOUNTS)
  throw new Error(
    "Explicit Supabase configuration and disposable QA account file required.",
  );
const users = JSON.parse(
  readFileSync(process.env.OMNIPATH_QA_ACCOUNTS, "utf8"),
) as { id: string; email: string; password: string }[];
assert.equal(users.length, 2);
assert(users.every((u) => u.email.endsWith("@omnipath.invalid")));
const clients = users.map(() =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }),
);
const tokens: string[] = [];
for (let i = 0; i < 2; i++) {
  const { data, error } = await clients[i].auth.signInWithPassword(users[i]);
  if (error) throw error;
  tokens.push(data.session!.access_token);
}
const base = url + "/functions/v1/omnipath-api";
async function call(seat: number, path: string, body?: unknown) {
  const r = await fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${tokens[seat]}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  return { status: r.status, data };
}
async function ok(seat: number, path: string, body?: unknown) {
  const r = await call(seat, path, body);
  assert(r.status >= 200 && r.status < 300, JSON.stringify(r));
  return r.data;
}
assert.equal((await call(1, "/metrics")).status, 403);
assert.equal(
  (await clients[0].from("match_results").select("*")).error?.code,
  "42501",
);
assert.equal(
  (
    await clients[0]
      .from("developer_members")
      .insert({ user_id: users[1].id, role: "admin" })
  ).error?.code,
  "42501",
);
const room = await ok(0, "/matches/create", { loadout: STARTERS.basajaun });
assert.equal((await call(1, "/matches/state?id=" + room.id)).status, 404);
const joined = await ok(1, "/matches/join", {
  inviteCode: room.inviteCode,
  loadout: STARTERS.anansi,
});
assert.equal(joined.seat, 1);
assert.deepEqual(joined.view.players[0].loadout.cards, [
  null,
  null,
  null,
  null,
]);
assert.equal(
  (await clients[1].from("match_views").select("*").eq("user_id", users[0].id))
    .data?.length,
  0,
);
let changes = 0;
const channel = clients[0].channel("qa-" + room.id).on(
  "postgres_changes",
  {
    event: "UPDATE",
    schema: "public",
    table: "match_views",
    filter: `match_id=eq.${room.id}`,
  },
  ({ new: row }) => {
    assert.equal(row.user_id, users[0].id);
    assert.equal(row.view.seed, undefined);
    changes++;
  },
);
await new Promise<void>((resolve, reject) => {
  const timeout = setTimeout(
    () => reject(new Error("Realtime subscribe timed out")),
    15000,
  );
  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      clearTimeout(timeout);
      resolve();
    }
    if (status === "CHANNEL_ERROR") {
      clearTimeout(timeout);
      reject(new Error(status));
    }
  });
});
let view: MatchView = (await ok(0, "/matches/state?id=" + room.id)).view,
  steps = 0,
  duplicates = 0;
while (view.phase !== "MATCH_END" && steps++ < 250) {
  const actor = (
    view.phase === "REACTION_WINDOW" ? 1 - view.activePlayer : view.activePlayer
  ) as 0 | 1;
  view = (await ok(actor, "/matches/state?id=" + room.id)).view;
  const actual = (
    view.phase === "REACTION_WINDOW" ? 1 - view.activePlayer : view.activePlayer
  ) as 0 | 1;
  if (actual !== actor) continue;
  const context: DecisionContext = {
    actor,
    phase: view.phase,
    round: view.round,
    fate: view.fate,
    initiative: view.initiative,
    activePlayer: view.activePlayer,
    turnInRound: view.turnInRound,
    pending: view.pending,
    self: view.players[actor] as PlayerState,
    enemy: view.players[1 - actor],
  };
  const command = {
    matchId: room.id,
    commandId: crypto.randomUUID(),
    revision: view.revision,
    plan: choosePlan(context, "Normal"),
  };
  const response = await call(actor, "/matches/command", command);
  if (response.status === 409) {
    view = (await ok(actor, "/matches/state?id=" + room.id)).view;
    continue;
  }
  assert.equal(response.status, 200, JSON.stringify(response));
  view = response.data.view;
  if (duplicates < 1) {
    const duplicate = await ok(actor, "/matches/command", command);
    assert.equal(duplicate.duplicate, true);
    duplicates++;
  }
}
assert.equal(view.phase, "MATCH_END");
assert(changes > 0, "Realtime emitted no owner projections");
const metrics = await ok(0, "/metrics?source=live&days=1");
assert(metrics.records.some((r: { id: string }) => r.id === room.id));
await clients[0].removeChannel(channel);
console.log(
  JSON.stringify({
    completed: true,
    rounds: view.round,
    winner: view.winner,
    commands: steps,
    realtimeUpdates: changes,
    duplicateRetries: duplicates,
    unauthorizedAccess: "blocked",
    metricsSaved: true,
  }),
);
for (const c of clients) {
  await c.auth.signOut();
  await c.removeAllChannels();
}
