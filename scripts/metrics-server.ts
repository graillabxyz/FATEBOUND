import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import worker from "../server/worker";
import type { Database, Statement } from "../server/worker";
const filename = resolve(
  process.env.METRICS_DB_PATH ?? "../../work/fatebound-metrics.sqlite",
);
mkdirSync(dirname(filename), { recursive: true });
const sqlite = new DatabaseSync(filename);
sqlite.exec(
  "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY);",
);
for (const name of readdirSync("drizzle")
  .filter((n) => n.endsWith(".sql"))
  .sort())
  if (
    !sqlite.prepare("SELECT name FROM local_migrations WHERE name=?").get(name)
  ) {
    sqlite.exec("BEGIN");
    try {
      sqlite.exec(readFileSync(`drizzle/${name}`, "utf8"));
      sqlite
        .prepare("INSERT INTO local_migrations (name) VALUES (?)")
        .run(name);
      sqlite.exec("COMMIT");
    } catch (e) {
      sqlite.exec("ROLLBACK");
      throw e;
    }
  }
const DB: Database = {
  prepare(sql: string): Statement {
    let values: unknown[] = [];
    const statement: Statement = {
      bind(...v) {
        values = v;
        return statement;
      },
      async run() {
        return sqlite.prepare(sql).run(...(values as never[]));
      },
      async all<T>() {
        return {
          results: sqlite.prepare(sql).all(...(values as never[])) as T[],
        };
      },
      async first<T>() {
        return (sqlite.prepare(sql).get(...(values as never[])) as T) ?? null;
      },
    };
    return statement;
  },
  async batch(statements) {
    sqlite.exec("BEGIN");
    try {
      const result = [];
      for (const s of statements) result.push(await s.run());
      sqlite.exec("COMMIT");
      return result;
    } catch (e) {
      sqlite.exec("ROLLBACK");
      throw e;
    }
  },
};
createServer(async (req, res) => {
  try {
    const chunks: Buffer[] = [];
    let bytes = 0;
    for await (const chunk of req) {
      bytes += chunk.length;
      if (bytes > 1_500_000) {
        res.writeHead(413);
        res.end("Request too large");
        return;
      }
      chunks.push(chunk);
    }
    const request = new Request(`http://127.0.0.1:8787${req.url}`, {
      method: req.method,
      headers: req.headers as HeadersInit,
      body:
        req.method === "GET" || req.method === "HEAD"
          ? undefined
          : Buffer.concat(chunks),
    });
    const response = await worker.fetch(request, { DB, LOCAL_DEV: "true" });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (e) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: (e as Error).message }));
  }
}).listen(8787, "127.0.0.1", () =>
  console.log(
    "Metrics API: http://127.0.0.1:8787 · persistent SQLite, local only",
  ),
);
