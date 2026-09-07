import {
  advance,
  createMatch,
  lockPlan,
  projectMatch,
  timeoutPlan,
} from "../../src/engine/match";
import { validateLoadout } from "../../src/engine/rules";
import { GAME } from "../../src/content/config";
import type { Loadout, MatchState, Plan } from "../../src/engine/types";

export function checkedLoadout(raw: unknown, owned: Set<string>): Loadout {
  const l = raw as Loadout;
  if (
    !l ||
    typeof l.id !== "string" ||
    typeof l.name !== "string" ||
    l.name.length > 60 ||
    !Array.isArray(l.cards) ||
    !Array.isArray(l.dice)
  )
    throw new Error("Invalid loadout.");
  if (!owned.has(l.legend)) throw new Error("Legend not owned.");
  validateLoadout(l, owned);
  return structuredClone(l);
}
export function settle(state: MatchState, now: number) {
  for (let steps = 0; steps < 40; steps++) {
    if (
      ["OMEN_CHOICE", "MAIN_ACTION", "REACTION_WINDOW", "MATCH_END"].includes(
        state.phase,
      )
    )
      return state;
    advance(state, now);
  }
  throw new Error("Phase transition limit exceeded.");
}
export function startOnline(
  id: string,
  seed: number,
  loadouts: [Loadout, Loadout],
  now: number,
) {
  return settle(createMatch(seed, loadouts, id), now);
}
export function applyOnline(
  state: MatchState,
  actor: 0 | 1,
  plan: Plan,
  expected: number,
  now: number,
) {
  if (state.version !== GAME.version || state.revision !== expected)
    throw new Error("Stale decision window.");
  if (state.phase === "MATCH_END") throw new Error("Match finished.");
  if (now >= state.deadline)
    throw new Error("Decision timed out. Refresh the match.");
  const next = structuredClone(state);
  lockPlan(next, actor, plan);
  return settle(next, now);
}
export function expireOnline(state: MatchState, now: number) {
  const next = structuredClone(state);
  if (
    ["OMEN_CHOICE", "MAIN_ACTION", "REACTION_WINDOW"].includes(next.phase) &&
    now >= next.deadline
  ) {
    timeoutPlan(
      next,
      next.phase !== "REACTION_WINDOW"
        ? next.activePlayer
        : ((1 - next.activePlayer) as 0 | 1),
    );
    settle(next, now);
  }
  return next;
}
export function playerViews(state: MatchState) {
  return [projectMatch(state, 0), projectMatch(state, 1)];
}
