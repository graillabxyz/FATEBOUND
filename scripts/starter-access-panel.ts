import { fork } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { LEGENDS } from "../src/content/legends";
import {
  STARTERS,
  STARTER_CARDS,
  STARTER_OMENS,
} from "../src/content/loadouts";
import { omenById } from "../src/content/omens";
import { ownedLegendLoadout } from "../src/content/collection-progression";
import { simulateGame } from "../src/dev/simulation";
import type { Loadout } from "../src/engine/types";
const out = resolve("reports/campaign/starter-access-20260908");
mkdirSync(out, { recursive: true });
const worker = process.argv
  .find((a) => a.startsWith("--legend="))
  ?.split("=")[1];
if (!worker) {
  await Promise.all(
    LEGENDS.map(
      (l) =>
        new Promise<void>((ok, no) => {
          const p = fork(new URL(import.meta.url), [`--legend=${l.id}`], {
            execArgv: ["--import", "tsx"],
            stdio: "inherit",
          });
          p.on("exit", (c) => (c === 0 ? ok() : no(Error(l.id))));
        }),
    ),
  );
  const rows = LEGENDS.flatMap((l) =>
    JSON.parse(readFileSync(`${out}/${l.id}.json`, "utf8")),
  );
  writeFileSync(
    `${out}/summary.json`,
    JSON.stringify(
      {
        games: rows.reduce((n, r) => n + r.games, 0),
        method:
          "200 games per directed matchup and variant; 100 independent reversed-seat pairs. Change only focal player build. Identical seeds across curated, entry and numbered variants; exploratory AI comparisons.",
        rows,
      },
      null,
      2,
    ),
  );
} else {
  const l = LEGENDS.find((l) => l.id === worker)!;
  const idx = LEGENDS.indexOf(l),
    rows: any[] = [];
  const variants: Record<string, Loadout> = {
    curated: STARTERS[l.id],
    entry: ownedLegendLoadout(l.id, STARTER_CARDS, STARTER_OMENS),
    numbered: {
      ...STARTERS[l.id],
      dice: STARTERS[l.id].dice.map((id) =>
        omenById[id].tags.includes("signature")
          ? `standard-d${omenById[id].size}`
          : id,
      ),
    },
  };
  for (const [variant, build] of Object.entries(variants))
    for (const [j, o] of LEGENDS.entries()) {
      const r = {
        legend: l.id,
        opponent: o.id,
        variant,
        loadout: build,
        games: 0,
        wins: 0,
        draws: 0,
        mismatches: 0,
        rounds: 0,
        damage: 0,
      };
      let previous = "";
      for (let i = 0; i < 200; i++) {
        const m = simulateGame(
          {
            loadouts: [build, STARTERS[o.id]],
            games: 200,
            seed: 920000 + (idx * 6 + j) * 10000,
            paired: true,
            difficulty: "Normal",
          },
          i,
        );
        const seat = i % 2;
        r.games++;
        r.wins += +(m.winner === seat);
        r.draws += +(m.winner === "draw");
        r.rounds += m.rounds;
        for (const s of m.stats) r.damage += s.damage[seat];
        const normalized = JSON.stringify({
          winner:
            m.winner === "draw"
              ? "draw"
              : m.winner === seat
                ? "focal"
                : "opponent",
          hp: [m.hp[seat], m.hp[1 - seat]],
          rounds: m.rounds,
        });
        if (i % 2 === 0) previous = normalized;
        else r.mismatches += +(normalized !== previous);
      }
      rows.push(r);
    }
  writeFileSync(`${out}/${l.id}.json`, JSON.stringify(rows, null, 2));
  console.log(`Access panel complete: ${l.id}`);
}
