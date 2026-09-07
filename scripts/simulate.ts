import { GAME } from "../src/content/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { LEGENDS } from "../src/content/legends";
import { STARTERS } from "../src/content/loadouts";
import { DICE, dieBudget } from "../src/content/dice";
import { simulateGame } from "../src/dev/simulation";
import { aggregate, type MatchRecord } from "../src/metrics/data";
const count = Math.max(
  2,
  Math.min(
    100000,
    Number(
      process.argv.find((a) => a.startsWith("--games="))?.split("=")[1] ?? 600,
    ),
  ),
);
const pairs = LEGENDS.flatMap((a, i) =>
  LEGENDS.slice(i).map((b) => [a, b] as const),
);
const records: MatchRecord[] = [];
for (let index = 0; index < count; index++) {
  const pair = pairs[Math.floor(index / 2) % pairs.length],
    seed = 12000 + Math.floor(index / 2);
  records.push(
    simulateGame(
      {
        loadouts: [STARTERS[pair[0].id], STARTERS[pair[1].id]],
        games: 2,
        difficulty: "Normal",
        seed,
        paired: true,
      },
      index % 2,
    ),
  );
}
const stats = aggregate(records);
const report = {
  mechanicalVersion: GAME.version,
  generatedAt: new Date().toISOString(),
  method:
    "Normal AI; paired swapped seats AND RNG streams; all Legend matchups including mirrors. Wilson 95% opening-initiative interval; balance estimate, not a human-play claim.",
  ...stats,
  dieBudgets: DICE.map(dieBudget),
};
mkdirSync("reports", { recursive: true });
writeFileSync(
  `reports/balance-v${GAME.version}.json`,
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify(
    {
      games: stats.games,
      averageRounds: stats.averageRounds,
      initiativeWins: stats.initiativeWins,
      openingRate: stats.openingRate,
      openingConfidence: stats.openingConfidence,
      initiativeSignificant: stats.initiativeSignificant,
      seatWins: stats.seatWins,
      draws: stats.draws,
      paired: stats.paired,
      mismatches: stats.mismatches,
      held: stats.held,
      reactions: stats.reactions,
      reactionSuccess: stats.reactionSuccess,
      expired: stats.expired,
      byClass: stats.byClass,
    },
    null,
    2,
  ),
);
if (stats.mismatches) process.exitCode = 1;
