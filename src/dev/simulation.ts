import {
  advance,
  createMatch,
  decisionContext,
  lockPlan,
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
  /** Harness watchdog only; never a combat victory condition. */
  stallRounds?: number;
};
export type StalledSimulation = {
  seed: number;
  index: number;
  rounds: number;
  hp: number[];
  loadouts: [Loadout, Loadout];
  reason: string;
};
export class SimulationStalledError extends Error {
  constructor(public readonly detail: StalledSimulation) {
    super(
      `Simulation stalled after ${detail.rounds} rounds (seed ${detail.seed}). No win or draw awarded.`,
    );
  }
}
export function simulateGame(
  config: SimulationConfig,
  index: number,
): MatchRecord {
  const reversed = config.paired && index % 2 === 1;
  const loadouts = structuredClone(config.loadouts);
  if (reversed) loadouts.reverse();
  const seed =
    (config.seed + (config.paired ? Math.floor(index / 2) : index)) >>> 0;
  const s = createMatch(seed, loadouts, `sim-${config.seed}-${index}`, {
    rngSeats: reversed ? [1, 0] : [0, 1],
  });
  const stallRounds = config.stallRounds ?? 100;
  if (!Number.isInteger(stallRounds) || stallRounds < 1 || stallRounds > 1000)
    throw new Error("Simulation watchdog must be 1–1,000 rounds.");
  let steps = 0;
  while (s.phase !== "MATCH_END" && steps++ < stallRounds * 200) {
    if (s.round > stallRounds) break;
    if (["OMEN_CHOICE", "MAIN_ACTION", "REACTION_WINDOW"].includes(s.phase)) {
      const actor =
        s.phase !== "REACTION_WINDOW" ? s.activePlayer : 1 - s.activePlayer;
      lockPlan(
        s,
        actor,
        choosePlan(decisionContext(s, actor), config.difficulty),
      );
    } else advance(s);
  }
  if (s.phase !== "MATCH_END")
    throw new SimulationStalledError({
      seed,
      index,
      rounds: Math.min(s.round, stallRounds),
      hp: s.players.map((p) => p.hp),
      loadouts,
      reason: s.round > stallRounds ? "round-watchdog" : "transition-watchdog",
    });
  const record = recordMatch(s, "simulation", config.difficulty, null, [
    "ai",
    "ai",
  ]);
  if (config.paired)
    record.pair = { id: `${config.seed}:${Math.floor(index / 2)}`, reversed };
  return record;
}
