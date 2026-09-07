import { writeFileSync, mkdirSync } from "node:fs";
import { LEGENDS } from "../src/content/legends";
import { STARTERS } from "../src/content/loadouts";
import { DICE, dieBudget } from "../src/content/dice";
import {
  createMatch,
  beginRound,
  decisionContext,
  lockPlan,
  reveal,
  resolve,
  cleanup,
} from "../src/engine/match";
import { choosePlan } from "../src/engine/ai";
const arg = process.argv.find((a) => a.startsWith("--games="));
const games = Math.max(2, Math.min(100000, Number(arg?.split("=")[1] ?? 600)));
const perLegend: Record<
  string,
  {
    games: number;
    wins: number;
    draws: number;
    damage: number;
    guard: number;
    rounds: number;
  }
> = {};
const cardUsage: Record<string, number> = {},
  faceFrequency: Record<string, number> = {};
const perLoadout: Record<string, { games: number; wins: number }> = {};
let totalRounds = 0,
  seatWins = [0, 0],
  draws = 0,
  unused = 0,
  controls = 0,
  revealed = 0,
  seatMismatch = 0;
const pairs = LEGENDS.flatMap((a, i) =>
  LEGENDS.slice(i).map((b) => [a, b] as const),
);
const roundMetrics: Record<
  number,
  { count: number; damage: number; guard: number; control: number }
> = {};
let previousHP: number[] = [];
for (let game = 0; game < games; game++) {
  const pairing = pairs[Math.floor(game / 2) % pairs.length];
  const [a, b] = game % 2 ? [pairing[1], pairing[0]] : pairing;
  const seed =
    12000 +
    Math.floor(game / (pairs.length * 2)) * 379 +
    (Math.floor(game / 2) % pairs.length);
  const state = createMatch(seed, [STARTERS[a.id], STARTERS[b.id]]);
  while (state.winner === null) {
    beginRound(state);
    state.phase = "ASSIGNMENT";
    const plans = [
      choosePlan(decisionContext(state, 0)),
      choosePlan(decisionContext(state, 1)),
    ];
    lockPlan(state, 0, plans[0]);
    lockPlan(state, 1, plans[1]);
    reveal(state);
    resolve(state);
    cleanup(state);
  }
  if (game % 2 === 0) previousHP = state.players.map((p) => p.hp);
  else if (
    JSON.stringify(previousHP) !==
    JSON.stringify(state.players.map((p) => p.hp).reverse())
  )
    seatMismatch++;
  totalRounds += state.round;
  if (state.winner === "draw") draws++;
  else seatWins[state.winner!]++;
  state.players.forEach((p, i) => {
    const row = (perLegend[p.loadout.legend] ??= {
      games: 0,
      wins: 0,
      draws: 0,
      damage: 0,
      guard: 0,
      rounds: 0,
    });
    row.games++;
    if (state.winner === i) row.wins++;
    if (state.winner === "draw") row.draws++;
    row.damage += p.damageDealt;
    row.guard += state.stats.reduce((s, r) => s + r.guard[i], 0);
    row.rounds += state.round;
    revealed += p.known.length;
    const build = (perLoadout[p.loadout.id] ??= { games: 0, wins: 0 });
    build.games++;
    if (state.winner === i) build.wins++;
  });
  state.stats.forEach((r) => {
    controls += r.control.reduce((a, b) => a + b, 0);
    unused += r.unused.reduce((a, b) => a + b, 0);
    r.cards.flat().forEach((id) => (cardUsage[id] = (cardUsage[id] ?? 0) + 1));
    r.faces
      .flat()
      .forEach((id) => (faceFrequency[id] = (faceFrequency[id] ?? 0) + 1));
    const row = (roundMetrics[r.round] ??= {
      count: 0,
      damage: 0,
      guard: 0,
      control: 0,
    });
    row.count++;
    row.damage += r.damage[0] + r.damage[1];
    row.guard += r.guard[0] + r.guard[1];
    row.control += r.control[0] + r.control[1];
  });
}
const report = {
  mechanicalVersion: 1,
  generatedAt: new Date().toISOString(),
  method:
    "Normal AI, default loadouts, paired seeds with seats reversed. Includes mirror matches. Heuristic play, not a proof of human balance.",
  games,
  averageRounds: totalRounds / games,
  seatWins,
  draws,
  seatMismatches: seatMismatch,
  controlPerPlayerRound: controls / (totalRounds * 2),
  unusedDicePerPlayerRound: unused / (totalRounds * 2),
  cardsRevealedPerPlayerMatch: revealed / (games * 2),
  byLegend: Object.fromEntries(
    Object.entries(perLegend).map(([id, r]) => [
      id,
      {
        ...r,
        winRate: r.wins / r.games,
        damagePerRound: r.damage / r.rounds,
        guardPerRound: r.guard / r.rounds,
      },
    ]),
  ),
  byLoadout: perLoadout,
  perRound: roundMetrics,
  cardUsage,
  faceFrequency,
  dieBudgets: DICE.map(dieBudget),
};
mkdirSync("reports", { recursive: true });
writeFileSync("reports/balance.json", JSON.stringify(report, null, 2));
console.log(
  JSON.stringify(
    {
      ...report,
      cardUsage: undefined,
      faceFrequency: undefined,
      dieBudgets: undefined,
      perRound: undefined,
    },
    null,
    2,
  ),
);
