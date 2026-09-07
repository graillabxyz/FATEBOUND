import { execFileSync } from "node:child_process";
import { fork } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { resolve } from "node:path";
const arg = (n: string, d: string) =>
  process.argv.find((a) => a.startsWith(`--${n}=`))?.split("=")[1] ?? d;
const label = arg("label", "baseline"),
  count = Number(arg("per-matchup", "4000")),
  seed = Number(arg("seed", "810000"));
if (count % 2 || count < 2) throw Error("Use an even paired match count.");
const dir = resolve("work/campaigns", label),
  out = resolve("reports/campaign", label);
mkdirSync(dir, { recursive: true });
mkdirSync(out, { recursive: true });
if (!existsSync(`${dir}/src`)) cpSync("src", `${dir}/src`, { recursive: true });
cpSync("scripts/balance-campaign-worker.template", `${dir}/worker.ts`);
execFileSync("tar", ["-czf", `${out}/engine-content.tar.gz`, "-C", dir, "src"]);
writeFileSync(
  `${out}/manifest.json`,
  JSON.stringify(
    {
      label,
      perMatchup: count,
      games: count * 36,
      seed,
      method:
        "Six focal Legends × six opponents × paired reversed seats and RNG streams. 36 directed cohorts; mirror matches included. Same seeds reused in adjusted pass. Independent sampled RNG pairs are half the game count. Engine/content frozen per pass.",
    },
    null,
    2,
  ),
);
const ids = ["basajaun", "anansi", "tengu", "leshy", "quetzalcoatl", "maui"];
await Promise.all(
  ids.map(
    (id, i) =>
      new Promise<void>((resolve, reject) => {
        const p = fork(
          `${dir}/worker.ts`,
          [
            id,
            String(i),
            String(count),
            String(seed),
            out,
            arg("custom", "false"),
          ],
          { execArgv: ["--import", "tsx"], stdio: "inherit" },
        );
        p.on("exit", (c) =>
          c === 0 ? resolve() : reject(Error(`${id} worker exited ${c}`)),
        );
      }),
  ),
);
const rows = ids.flatMap((id) =>
  JSON.parse(readFileSync(`${out}/${id}.json`, "utf8")),
);
writeFileSync(
  `${out}/summary.json`,
  JSON.stringify(
    {
      label,
      games: rows.reduce((n, r) => n + r.games, 0),
      mismatches: rows.reduce((n, r) => n + r.mismatches, 0),
      rows,
    },
    null,
    2,
  ),
);
console.log(`COMPLETE ${label}: ${rows.length} cohorts, ${count * 36} games`);
