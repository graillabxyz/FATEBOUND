import {
  beginRound,
  cleanup,
  createMatch,
  decisionContext,
  lockPlan,
  reveal,
  resolve,
} from "../engine/match";
import { choosePlan, type Difficulty } from "../engine/ai";
import type { Loadout } from "../engine/types";
import { recordMatch, type MatchRecord } from "../metrics/data";
export type SimulationConfig = {
  loadouts: [Loadout, Loadout];
  games: number;
  difficulty: Difficulty;
  seed: number;
  paired: boolean;
};
export function simulateGame(
  config: SimulationConfig,
  index: number,
): MatchRecord {
  const reversed = config.paired && index % 2 === 1;
  const loadouts = structuredClone(config.loadouts);
  if (reversed) loadouts.reverse();
  const seed =
    (config.seed + (config.paired ? Math.floor(index / 2) : index)) >>> 0;
  const s = createMatch(seed, loadouts, `sim-${config.seed}-${index}`);
  while (s.winner === null) {
    beginRound(s);
    s.phase = "ASSIGNMENT";
    const plans = [
      choosePlan(decisionContext(s, 0), config.difficulty),
      choosePlan(decisionContext(s, 1), config.difficulty),
    ];
    lockPlan(s, 0, plans[0]);
    lockPlan(s, 1, plans[1]);
    reveal(s);
    resolve(s);
    cleanup(s);
  }
  const record = recordMatch(s, "simulation", config.difficulty, null, [
    "ai",
    "ai",
  ]);
  if (config.paired)
    record.pair = { id: `${config.seed}:${Math.floor(index / 2)}`, reversed };
  return record;
}
