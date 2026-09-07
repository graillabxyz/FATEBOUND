import { describe, it, expect } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import worker from "../server/worker";
import type { Database, Statement, Env } from "../server/worker";
import { simulateGame } from "../src/dev/simulation";
import { STARTERS } from "../src/content/loadouts";
function database() {
  const db = new DatabaseSync(":memory:");
  for (const file of readdirSync("drizzle").filter((n) => n.endsWith(".sql")))
    db.exec(readFileSync(`drizzle/${file}`, "utf8"));
  const DB: Database = {
    prepare(sql) {
      let values: unknown[] = [];
      const statement: Statement = {
        bind(...v) {
          values = v;
          return statement;
        },
        async run() {
          return db.prepare(sql).run(...(values as never[]));
        },
        async all<T>() {
          return {
            results: db.prepare(sql).all(...(values as never[])) as T[],
          };
        },
        async first<T>() {
          return (db.prepare(sql).get(...(values as never[])) as T) ?? null;
        },
      };
      return statement;
    },
    async batch(statements) {
      db.exec("BEGIN");
      try {
        const result = [];
        for (const s of statements) result.push(await s.run());
        db.exec("COMMIT");
        return result;
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    },
  };
  return { db, DB };
}
const request = (
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
) =>
  new Request("https://private.example" + path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
describe("durable private telemetry API", () => {
  it("serves SPA routes without the asset host redirecting them to home", async () => {
    const { DB } = database();
    const paths: string[] = [];
    const response = await worker.fetch(request("/metrics"), {
      DB,
      ASSETS: {
        async fetch(req) {
          const path = new URL(req.url).pathname;
          paths.push(path);
          if (path === "/index.html")
            return Response.redirect("https://private.example/", 308);
          return new Response(
            path === "/" ? "<html>Dashboard</html>" : "Not found",
            {
              status: path === "/" ? 200 : 404,
            },
          );
        },
      },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(paths).toEqual(["/metrics", "/"]);
  });
  it("requires identity in hosted mode and rejects cross-origin writes", async () => {
    const { DB } = database();
    expect((await worker.fetch(request("/api/metrics"), { DB })).status).toBe(
      401,
    );
    expect(
      (
        await worker.fetch(
          request(
            "/api/simulations",
            { records: [] },
            {
              origin: "https://attacker.example",
              "oai-authenticated-user-id": "owner",
            },
          ),
          { DB },
        )
      ).status,
    ).toBe(403);
  });
  it("idempotently stores simulation batches and keeps live metrics separate", async () => {
    const { DB, db } = database(),
      env: Env = { DB, LOCAL_DEV: "true" };
    const record = simulateGame(
      {
        loadouts: [STARTERS.basajaun, STARTERS.anansi],
        games: 1,
        difficulty: "Training",
        seed: 10,
        paired: false,
      },
      0,
    );
    for (let i = 0; i < 2; i++)
      expect(
        (
          await worker.fetch(
            request("/api/simulations", { records: [record] }),
            env,
          )
        ).status,
      ).toBe(200);
    const data = await (
      await worker.fetch(request("/api/metrics?source=simulation&days=30"), env)
    ).json();
    expect(data.total).toBe(1);
    expect(data.records).toHaveLength(1);
    const live = await (
      await worker.fetch(request("/api/metrics?source=live&days=30"), env)
    ).json();
    expect(live.total).toBe(0);
    const plan = db
      .prepare(
        "EXPLAIN QUERY PLAN SELECT payload FROM matches WHERE source=? AND created_at>=? ORDER BY created_at DESC LIMIT 2500",
      )
      .all("simulation", "2026");
    expect(JSON.stringify(plan)).toContain("idx_matches_source_created_at");
  });
  it("filters both matchup directions in storage and keeps mirror pairs precise", async () => {
    const { DB } = database(),
      env = { DB, LOCAL_DEV: "true" };
    const records = [
      simulateGame(
        {
          loadouts: [STARTERS.basajaun, STARTERS.anansi],
          games: 2,
          difficulty: "Training",
          seed: 200,
          paired: true,
        },
        0,
      ),
      simulateGame(
        {
          loadouts: [STARTERS.basajaun, STARTERS.anansi],
          games: 2,
          difficulty: "Training",
          seed: 200,
          paired: true,
        },
        1,
      ),
    ];
    await worker.fetch(request("/api/simulations", { records }), env);
    const matchup = await (
      await worker.fetch(
        request(
          "/api/metrics?source=simulation&legend=anansi&opponent=basajaun",
        ),
        env,
      )
    ).json();
    expect(matchup.total).toBe(2);
    const mirror = await (
      await worker.fetch(
        request("/api/metrics?source=simulation&legend=anansi&opponent=anansi"),
        env,
      )
    ).json();
    expect(mirror.total).toBe(0);
    expect(
      (await worker.fetch(request("/api/metrics?legend=invalid"), env)).status,
    ).toBe(400);
  });
  it("saves stressed lab loadouts separately and strips unrelated authored fields", async () => {
    const { DB } = database(),
      env = { DB, LOCAL_DEV: "true" };
    const record = simulateGame(
      {
        loadouts: [STARTERS.basajaun, STARTERS.anansi],
        games: 1,
        difficulty: "Training",
        seed: 201,
        paired: false,
      },
      0,
    );
    record.source = "lab";
    record.loadouts[0].cards[3] = "web-turn";
    record.stats = [];
    Object.assign(record.loadouts[0], { privateNote: "not telemetry" });
    expect(
      (
        await worker.fetch(
          request("/api/lab-results", { records: [record] }),
          env,
        )
      ).status,
    ).toBe(200);
    const rows = await (
      await worker.fetch(request("/api/metrics?source=lab"), env)
    ).json();
    expect(rows.total).toBe(1);
    expect(JSON.stringify(rows)).not.toContain("privateNote");
    expect(
      (
        await worker.fetch(
          request("/api/telemetry", {
            matches: [{ ...record, source: "live" }],
          }),
          env,
        )
      ).status,
    ).toBe(400);
  });
  it("rejects malformed mixed batches before any writes", async () => {
    const { DB, db } = database(),
      env = { DB, LOCAL_DEV: "true" };
    const record = simulateGame(
      {
        loadouts: [STARTERS.basajaun, STARTERS.anansi],
        games: 1,
        difficulty: "Training",
        seed: 11,
        paired: false,
      },
      0,
    );
    const bad = { ...record, id: "bad", winner: 9 };
    expect(
      (
        await worker.fetch(
          request("/api/simulations", { records: [record, bad] }),
          env,
        )
      ).status,
    ).toBe(400);
    expect(db.prepare("SELECT COUNT(*) AS n FROM matches").get()?.n).toBe(0);
  });
  it("tracks anonymous real usage and deduplicates retries", async () => {
    const { DB } = database(),
      env = { DB, LOCAL_DEV: "true" },
      event = {
        id: "event-1",
        session: "anonymous-test-session",
        event: "card_used",
        at: Date.now(),
      };
    for (let i = 0; i < 2; i++)
      expect(
        (
          await worker.fetch(
            request("/api/telemetry", { events: [event] }),
            env,
          )
        ).status,
      ).toBe(200);
    const data = await (
      await worker.fetch(request("/api/metrics?source=live&days=1"), env)
    ).json();
    expect(data.events).toEqual([{ event: "card_used", count: 1 }]);
    expect(data.activeSessions).toBe(1);
  });
});
