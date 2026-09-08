import { openingMetrics } from "../src/metrics/opening";
import { GAME } from "../src/content/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { LEGENDS } from "../src/content/legends";
import { STARTERS } from "../src/content/loadouts";
import { DICE, dieBudget } from "../src/content/dice";
import {
  SimulationStalledError,
  type StalledSimulation,
  simulateGame,
} from "../src/dev/simulation";
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
const stalled: StalledSimulation[] = [];
for (let index = 0; index < count; index++) {
  const pair = pairs[Math.floor(index / 2) % pairs.length],
    seed = 12000 + Math.floor(index / 2);
  try {
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
  } catch (e) {
    if (e instanceof SimulationStalledError) stalled.push(e.detail);
    else throw e;
  }
}
const stats = aggregate(records);
// Stalls must also preserve seat symmetry; they never enter outcome metrics.
const stalledSeatMismatches = stalled.filter((s) => {
  const partner = stalled.find((t) => t.seed === s.seed && t.index !== s.index);
  return !partner || s.hp[0] !== partner.hp[1] || s.hp[1] !== partner.hp[0];
}).length;
const report = {
  mechanicalVersion: GAME.version,
  generatedAt: new Date().toISOString(),
  method:
    "Normal AI; paired swapped seats AND RNG streams; all Legend matchups including mirrors. Wilson 95% opening-initiative interval; balance estimate, not a human-play claim.",
  ...stats,
  stalledSeatMismatches,
  attempted: count,
  stalled,
  opening: openingMetrics(records),
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
      attempted: count,
      stalled: stalled.length,
      opening: report.opening,
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
if (stats.mismatches || stalledSeatMismatches) process.exitCode = 1;
