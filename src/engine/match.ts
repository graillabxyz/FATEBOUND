import type {
  Loadout,
  MatchState,
  MatchView,
  Plan,
  PublicPlayer,
  DecisionContext,
  Replay,
} from "./types";
import { GAME } from "../content/config";
import { legendById } from "../content/legends";
import { dieById } from "../content/dice";
import { sharedFate, facePosition } from "./fate";
import {
  clone,
  validateLoadout,
  validatePlan,
  safePlan,
  requirementFor,
} from "./rules";
import { resolveEffects } from "./effects";
export function createMatch(
  seed: number,
  loadouts: [Loadout, Loadout],
  id = `local-${seed}`,
): MatchState {
  loadouts.forEach((l) => validateLoadout(l));
  return {
    id,
    version: GAME.version,
    seed: seed >>> 0,
    round: 0,
    phase: "INTRO",
    fate: [],
    players: loadouts.map((l) => ({
      loadout: clone(l),
      hp: legendById[l.legend].hp,
      guard: 0,
      control: GAME.controlPerRound,
      faces: [0, 0, 0],
      known: [],
      statuses: [],
      damageDealt: 0,
      locked: false,
      plan: null,
    })) as unknown as MatchState["players"],
    events: [],
    stats: [],
    replay: [],
    winner: null,
    deadline: 0,
    revision: 0,
  };
}
export function projectMatch(state: MatchState, viewer = 0): MatchView {
  const { seed: _seed, replay: _replay, players, ...rest } = clone(state);
  const revealed = [
    "REVEAL",
    "RESOLUTION",
    "CLEANUP",
    "ROUND_END",
    "MATCH_END",
  ].includes(state.phase);
  const projected = players.map((p, i) => ({
    ...p,
    loadout: {
      ...p.loadout,
      cards: p.loadout.cards.map((c) =>
        i === viewer || p.known.includes(c) || state.phase === "MATCH_END"
          ? c
          : null,
      ),
    },
    plan: i === viewer || revealed ? p.plan : null,
  })) as [PublicPlayer, PublicPlayer];
  return { ...rest, players: projected };
}
export function decisionContext(
  state: MatchState,
  actor: number,
): DecisionContext {
  return {
    round: state.round,
    fate: [...state.fate],
    self: clone(state.players[actor]),
    enemy: projectMatch(state, actor).players[1 - actor],
  };
}
export function beginRound(state: MatchState, now = 0, forced?: number[]) {
  if (state.winner !== null) throw new Error("Match has ended.");
  state.round++;
  state.phase = "FATE";
  state.fate = forced ?? sharedFate(state.seed, state.round);
  if (state.fate.length !== 3) throw new Error("Fate has three slots.");
  for (const p of state.players) {
    p.control = GAME.controlPerRound;
    p.guard = 0;
    p.locked = false;
    p.plan = null;
    p.faces = p.loadout.dice.map((id, i) =>
      facePosition(state.fate[i], dieById[id].size),
    );
  }
  state.deadline = now + GAME.decisionMs;
  state.revision++;
}
export function lockPlan(state: MatchState, actor: number, plan: Plan) {
  if (!["CONTROL", "ASSIGNMENT", "LOCKED"].includes(state.phase))
    throw new Error("Planning is closed.");
  const p = state.players[actor];
  if (p.locked) throw new Error("Plan already locked.");
  validatePlan(decisionContext(state, actor), plan);
  p.plan = clone(plan);
  p.locked = true;
  state.revision++;
  if (state.players.every((p) => p.locked)) state.phase = "LOCKED";
}
export function timeoutPlan(state: MatchState, actor: number, draft?: Plan) {
  if (!state.players[actor].locked)
    lockPlan(state, actor, safePlan(decisionContext(state, actor), draft));
}
export function reveal(state: MatchState) {
  if (!state.players.every((p) => p.locked))
    throw new Error("Both plans must be locked.");
  if (state.phase !== "LOCKED") throw new Error("Invalid reveal transition.");
  state.replay.push({
    round: state.round,
    plans: state.players.map((p) => clone(p.plan!)) as [Plan, Plan],
  });
  for (let i = 0; i < 2; i++) {
    const p = state.players[i];
    const result = validatePlan(decisionContext(state, i), p.plan!);
    p.faces = result.positions;
    p.control = result.control;
    for (const a of p.plan!.assignments)
      if (p.loadout.cards.includes(a.target) && !p.known.includes(a.target))
        p.known.push(a.target);
  }
  state.phase = "REVEAL";
  state.revision++;
}
export function resolve(state: MatchState) {
  if (state.phase !== "REVEAL") throw new Error("Reveal before resolution.");
  state.phase = "RESOLUTION";
  recordResolution(state, resolveEffects(state));
}
export function recordResolution(
  state: MatchState,
  { damage, guard }: { damage: number[]; guard: number[] },
) {
  state.stats.push({
    round: state.round,
    damage,
    guard,
    control: (
      state.replay.at(-1)?.plans ?? state.players.map((p) => p.plan!)
    ).map(
      (plan, actor) =>
        plan.controls.reduce((n, c) => n + (c.kind === "flip" ? 2 : 1), 0) +
        plan.assignments.reduce(
          (n, a) =>
            n +
            (requirementFor(state.players[actor].loadout, a.target).control ??
              0),
          0,
        ),
    ),
    cards: state.players.map((p) =>
      p
        .plan!.assignments.filter((a) => p.loadout.cards.includes(a.target))
        .map((a) => a.target),
    ),
    unused: state.players.map(
      (p) => 3 - new Set(p.plan!.assignments.flatMap((a) => a.dice)).size,
    ),
    faces: state.players.map((p) =>
      p.faces.map((f, i) => `${p.loadout.dice[i]}:${f}`),
    ),
  });
  state.revision++;
}
export function decideWinner(state: MatchState, roundLimit = false) {
  const [a, b] = state.players;
  if (a.hp > 0 && b.hp > 0 && !roundLimit) return;
  state.winner =
    a.hp !== b.hp
      ? a.hp > b.hp
        ? 0
        : 1
      : a.damageDealt !== b.damageDealt
        ? a.damageDealt > b.damageDealt
          ? 0
          : 1
        : "draw";
}
export function cleanup(state: MatchState, maxRounds: number = GAME.maxRounds) {
  if (state.phase !== "RESOLUTION") throw new Error("Resolve before cleanup.");
  for (let i = 0; i < 2; i++) {
    const p = state.players[i];
    const poison = p.statuses
      .filter((s) => s.id === "poison" && s.expiresRound === state.round)
      .reduce((n, s) => n + s.amount, 0);
    const damage = Math.min(p.hp, poison);
    if (damage) {
      p.hp -= damage;
      state.players[1 - i].damageDealt += damage;
      state.stats.at(-1)!.damage[1 - i] += damage;
      state.events.push({
        round: state.round,
        actor: 1 - i,
        type: "poison",
        text: `${damage} poison damage`,
        amount: damage,
      });
    }
    p.statuses = p.statuses.filter(
      (s) => s.expiresRound > state.round && s.amount > 0,
    );
    p.guard = 0;
  }
  decideWinner(state, state.round >= maxRounds);
  state.phase = "CLEANUP";
  state.revision++;
}
export function advance(state: MatchState, now: number) {
  const phase = state.phase;
  if (phase === "INTRO") {
    state.phase = "ROUND_START";
  } else if (
    phase === "ROUND_START" ||
    (phase === "ROUND_END" && state.winner === null)
  ) {
    beginRound(state, now);
  } else if (phase === "FATE") {
    state.phase = "ROLLING";
  } else if (phase === "ROLLING") {
    state.phase = "CONTROL";
    state.deadline = now + GAME.decisionMs;
  } else if (phase === "CONTROL") {
    state.phase = "ASSIGNMENT";
  } else if (phase === "LOCKED") {
    reveal(state);
  } else if (phase === "REVEAL") {
    resolve(state);
  } else if (phase === "RESOLUTION") {
    cleanup(state);
  } else if (phase === "CLEANUP") {
    state.phase = "ROUND_END";
  } else if (phase === "ROUND_END") {
    state.phase = "MATCH_END";
  } else throw new Error(`Cannot advance ${phase}.`);
  state.revision++;
}
export function exportReplay(state: MatchState): Replay {
  if (state.phase !== "MATCH_END")
    throw new Error("Replay seed is sealed until the match ends.");
  return {
    seed: state.seed,
    version: state.version,
    loadouts: state.players.map((p) => clone(p.loadout)) as [Loadout, Loadout],
    turns: clone(state.replay),
  };
}
export function verifyReplay(replay: Replay): MatchState {
  if (replay.version !== GAME.version)
    throw new Error("Unsupported mechanical version.");
  const s = createMatch(replay.seed, replay.loadouts);
  for (const turn of replay.turns) {
    if (s.winner !== null)
      throw new Error("Replay contains actions after match end.");
    beginRound(s);
    if (turn.round !== s.round) throw new Error("Invalid replay round.");
    s.phase = "ASSIGNMENT";
    lockPlan(s, 0, turn.plans[0]);
    lockPlan(s, 1, turn.plans[1]);
    reveal(s);
    resolve(s);
    cleanup(s);
  }
  s.phase = s.winner === null ? "ROUND_END" : "MATCH_END";
  return s;
}
