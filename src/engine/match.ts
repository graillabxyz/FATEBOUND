import { GAME } from "../content/config";
import { legendById } from "../content/legends";
import { cardById } from "../content/cards";
import { omenById } from "../content/omens";
import { clone, validateLoadout, validatePlan, assignmentValid } from "./rules";
import { facePosition, initiativeDice, turnFate } from "./fate";
import { effectsFor, resolveEffects } from "./effects";
import type {
  DecisionContext,
  Loadout,
  MatchConfig,
  MatchState,
  MatchView,
  Plan,
  Replay,
  RoundStats,
} from "./types";
type Seat = 0 | 1;
const other = (a: Seat): Seat => (a === 0 ? 1 : 0);
const log = (
  s: MatchState,
  actor: number,
  type: string,
  text: string,
  amount?: number,
) => s.events.push({ round: s.round, actor, type, text, amount });
export function createMatch(
  seed: number,
  loadouts: [Loadout, Loadout],
  id = `match-${seed}`,
  config: Partial<MatchConfig> = {},
): MatchState {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw new Error("Invalid seed.");
  if (!Array.isArray(loadouts) || loadouts.length !== 2)
    throw new Error("Two locked loadouts required.");
  loadouts.forEach((l) => validateLoadout(l));
  const rules: MatchConfig = {
    maxRounds: GAME.maxRounds,
    ramp: GAME.diceRamp.map((r) => [...r]),
    rngSeats: [0, 1],
    openingOmenCounts: config.ramp ? null : [...GAME.openingOmenCounts],
    ...clone(config),
  };
  if (
    !Number.isInteger(rules.maxRounds) ||
    rules.maxRounds < 1 ||
    rules.maxRounds > 99 ||
    !rules.ramp.length ||
    rules.ramp.some(
      (r) =>
        !r.length ||
        new Set(r).size !== r.length ||
        r.some((i) => !Number.isInteger(i) || i < 0 || i > 2),
    )
  )
    throw new Error("Invalid match configuration.");
  if (
    rules.openingOmenCounts !== null &&
    (!Array.isArray(rules.openingOmenCounts) ||
      rules.openingOmenCounts.length !== 2 ||
      rules.openingOmenCounts.some(
        (n) => !Number.isInteger(n) || n < 1 || n > 3,
      ))
  )
    throw new Error("Opening Omen counts must be 1–3 for both players.");
  if (
    rules.initiativeWinner !== undefined &&
    ![0, 1].includes(rules.initiativeWinner)
  )
    throw new Error("Invalid initiative winner.");
  if (
    rules.rngSeats.length !== 2 ||
    new Set(rules.rngSeats).size !== 2 ||
    rules.rngSeats.some((n) => n !== 0 && n !== 1)
  )
    throw new Error("Invalid RNG streams.");
  if (
    (rules.initiativeRolls && rules.initiativeRolls.length !== 2) ||
    (rules.initiativeBonuses && rules.initiativeBonuses.length !== 2)
  )
    throw new Error("Two initiative values required.");
  if (
    rules.initiativeRolls?.some((n) => !Number.isInteger(n) || n < 1 || n > 20)
  )
    throw new Error("Initiative rolls must be 1–20.");
  if (
    rules.initiativeBonuses?.some(
      (n) => !Number.isInteger(n) || n < 0 || n > 20,
    )
  )
    throw new Error("Initiative bonuses must be 0–20.");
  return {
    id,
    version: GAME.version,
    seed,
    config: rules,
    openingInitiative: null,
    initiative: 0,
    activePlayer: 0,
    turn: 0,
    omenRollCount: 3,
    turnInRound: 0,
    pending: null,
    reaction: null,
    roundFate: null,
    round: 0,
    phase: "MATCH_INTRO",
    fate: [0, 0, 0],
    players: loadouts.map((loadout) => ({
      loadout: clone(loadout),
      hp: legendById[loadout.legend].hp,
      guard: 0,
      control: GAME.focusPerRound,
      faces: [0, 0, 0],
      dice: [0, 1, 2].map(() => ({
        state: "UNROLLED" as const,
        rolledTurn: 0,
        modified: false,
        originalFace: 0,
      })),
      actionsThisRound: 0,
      passiveUsed: [],
      lastCategory: null,
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
export function projectMatch(s: MatchState, viewer: number = 0): MatchView {
  const {
    seed: _seed,
    config: _config,
    roundFate: _forced,
    players,
    replay: _replay,
    ...publicState
  } = clone(s);
  return {
    ...publicState,
    players: players.map((p, i) => ({
      ...p,
      statuses: p.statuses.map((st) =>
        st.cardId && i !== viewer && !p.known.includes(st.cardId)
          ? { ...st, cardId: undefined }
          : st,
      ),
      loadout: {
        ...p.loadout,
        id: i === viewer ? p.loadout.id : "locked",
        name: i === viewer ? p.loadout.name : "Private loadout",
        cards: p.loadout.cards.map((id) =>
          i === viewer || p.known.includes(id) || s.phase === "MATCH_END"
            ? id
            : null,
        ),
      },
      plan:
        p.plan && (s.pending?.actor === i || s.reaction?.actor === i)
          ? p.plan
          : null,
    })) as MatchView["players"],
  };
}
export function decisionContext(s: MatchState, actor: number): DecisionContext {
  return {
    actor,
    omenRollCount: s.omenRollCount,
    phase: s.phase,
    activePlayer: s.activePlayer,
    turnInRound: s.turnInRound,
    initiative: s.initiative,
    pending: clone(s.pending),
    round: s.round,
    fate: clone(s.fate),
    self: clone(s.players[actor]),
    enemy: projectMatch(s, actor).players[1 - actor],
  };
}
export function rollInitiative(s: MatchState) {
  if (s.openingInitiative) return;
  const random = initiativeDice(s.seed),
    rolls =
      s.config.initiativeRolls ??
      (s.config.rngSeats.map((i) => random[i]) as [number, number]);
  const bonuses =
    s.config.initiativeBonuses ??
    (s.players.map((p) => legendById[p.loadout.legend].initiativeBonus) as [
      number,
      number,
    ]);
  const totals = rolls.map((n, i) => n + bonuses[i]) as [number, number];
  // Ties: higher raw d20, then higher stable RNG stream. Never reroll initiative.
  const winner =
    s.config.initiativeWinner ??
    (totals[0] !== totals[1]
      ? totals[0] > totals[1]
        ? 0
        : 1
      : rolls[0] !== rolls[1]
        ? rolls[0] > rolls[1]
          ? 0
          : 1
        : s.config.rngSeats[0] > s.config.rngSeats[1]
          ? 0
          : 1);
  s.openingInitiative = {
    rolls: [...rolls],
    bonuses: [...bonuses],
    totals,
    winner,
  };
  s.initiative = winner;
  s.activePlayer = winner;
  log(
    s,
    winner,
    "initiative",
    `Opening initiative: ${rolls[0]} + ${bonuses[0]} = ${totals[0]} vs ${rolls[1]} + ${bonuses[1]} = ${totals[1]}. ${legendById[s.players[winner].loadout.legend].name} leads Round 1.`,
  );
}
const freshStats = (round: number): RoundStats => ({
  round,
  damage: [0, 0],
  guard: [0, 0],
  control: [0, 0],
  cards: [[], []],
  unused: [0, 0],
  faces: [[], []],
  held: [0, 0],
  expired: [0, 0],
  rolls: [0, 0],
  reactions: [0, 0],
  reactionWindows: [0, 0],
  reactionSuccess: [0, 0],
  turns: [0, 0],
});
export function beginRound(s: MatchState, _now = 0, forcedFate?: number[]) {
  if (!["MATCH_INTRO", "INITIATIVE_ROLL", "ROUND_END"].includes(s.phase))
    throw new Error("Cannot begin a round during a turn.");
  if (s.winner !== null) throw new Error("Match already ended.");
  if (
    forcedFate &&
    (forcedFate.length !== 3 ||
      forcedFate.some((n) => !Number.isInteger(n) || n < 0 || n >= 120))
  )
    throw new Error("Three valid forced Fate tokens required.");
  rollInitiative(s);
  s.round++;
  s.turnInRound = 0;
  s.initiative =
    s.round % 2
      ? s.openingInitiative!.winner
      : other(s.openingInitiative!.winner);
  s.activePlayer = s.initiative;
  s.roundFate = forcedFate ? clone(forcedFate) : null;
  s.pending = null;
  s.reaction = null;
  s.players.forEach((p) => {
    p.control = GAME.focusPerRound;
    p.actionsThisRound = 0;
    p.passiveUsed = [];
    p.lastCategory = null;
  });
  s.stats.push(freshStats(s.round));
  s.phase = "ROUND_START";
  s.revision++;
  log(
    s,
    s.initiative,
    "round",
    `Round ${s.round}: ${legendById[s.players[s.initiative].loadout.legend].name} has initiative.`,
  );
}
export function beginTurn(s: MatchState) {
  if (!["ROUND_START", "SECOND_TURN"].includes(s.phase))
    throw new Error("Turn start requires a round or second-turn boundary.");
  const p = s.players[s.activePlayer],
    stats = s.stats.at(-1)!;
  s.turn++;
  const expired = p.dice.filter((d) =>
    ["AVAILABLE", "HELD"].includes(d.state),
  ).length;
  stats.expired[s.activePlayer] += expired;
  stats.unused[s.activePlayer] += expired;
  stats.turns[s.activePlayer]++;
  if (expired)
    log(
      s,
      s.activePlayer,
      "expire",
      `${expired} unused Omens expired at owner turn start.`,
      expired,
    );
  p.dice.forEach((d) => {
    if (d.state !== "UNROLLED") d.state = "EXPIRED";
  });
  p.guard = 0;
  p.plan = null;
  p.locked = false;
  s.phase = s.winner === null ? "TURN_START" : "MATCH_END";
  s.revision++;
}
export function rollOmens(s: MatchState, selectedSlots?: number[]) {
  if (!["TURN_START", "OMEN_CHOICE"].includes(s.phase))
    throw new Error("Omens roll requires TURN_START.");
  const p = s.players[s.activePlayer],
    slots =
      selectedSlots ??
      s.config.ramp[Math.min(s.round - 1, s.config.ramp.length - 1)];
  s.fate =
    s.roundFate ?? turnFate(s.seed, s.round, s.config.rngSeats[s.activePlayer]);
  slots.forEach((slot) => {
    const d = omenById[p.loadout.dice[slot]],
      face = facePosition(s.fate[slot], d.size);
    p.faces[slot] = face;
    p.dice[slot] = {
      state: "ROLLING",
      rolledTurn: s.turn,
      modified: false,
      originalFace: face,
    };
    s.stats.at(-1)!.rolls[s.activePlayer]++;
    s.stats
      .at(-1)!
      .faces[s.activePlayer].push(
        `${d.id}:${face}:${d.faces[face].effectId ?? d.faces[face].value}`,
      );
  });
  log(
    s,
    s.activePlayer,
    "roll",
    `Slots ${slots.map((i) => i + 1).join(", ")} rolled: ${slots.map((i) => omenById[p.loadout.dice[i]].faces[p.faces[i]].displayIcon).join(" / ")}`,
  );
  // Start statuses apply after the new roll, before the main decision.
  const poison = p.statuses
    .filter((x) => x.id === "poison")
    .reduce((n, x) => n + x.amount, 0);
  if (poison) {
    const dmg = Math.min(p.hp, Math.max(0, poison));
    p.hp -= dmg;
    s.players[other(s.activePlayer)].damageDealt += dmg;
    s.stats.at(-1)!.damage[other(s.activePlayer)] += dmg;
    log(s, other(s.activePlayer), "poison", `${dmg} poison damage`, dmg);
  }
  decideWinner(s, false);
  s.phase = s.winner === null ? "DICE_ROLL" : "MATCH_END";
  s.revision++;
}
export function lockPlan(s: MatchState, actor: number, plan: Plan) {
  if (s.phase === "OMEN_CHOICE") {
    const slots = plan?.omenSlots;
    if (actor !== s.activePlayer)
      throw new Error("Only the active player can choose Omens.");
    if (
      !Array.isArray(slots) ||
      slots.length !== s.omenRollCount ||
      new Set(slots).size !== slots.length ||
      slots.some((i) => !Number.isInteger(i) || i < 0 || i > 2) ||
      !Array.isArray(plan.controls) ||
      plan.controls.length ||
      !Array.isArray(plan.assignments) ||
      plan.assignments.length
    )
      throw new Error(
        `Choose exactly ${s.omenRollCount} distinct equipped Omens, without spending resources.`,
      );
    s.replay.push({
      round: s.round,
      turn: s.turn,
      actor: actor as Seat,
      kind: "plan",
      plan: clone(plan),
    });
    rollOmens(s, slots);
    return;
  }
  if (plan?.omenSlots)
    throw new Error("Choose Omens only during the opening roll.");
  if (actor !== 0 && actor !== 1) throw new Error("Invalid actor.");
  const ctx = decisionContext(s, actor),
    paid = validatePlan(ctx, plan),
    p = s.players[actor];
  if (!plan.assignments.length && !plan.controls.length) {
    pass(s, actor);
    return;
  }
  s.replay.push({
    round: s.round,
    turn: s.turn,
    actor,
    kind: "plan",
    plan: clone(plan),
  });
  const before = p.control;
  p.faces = paid.positions;
  p.control = paid.control;
  s.stats.at(-1)!.control[actor] += before - p.control;
  for (const c of plan.controls) {
    p.dice[c.slot].modified = true;
    log(
      s,
      actor,
      "control",
      `Omen ${c.slot + 1}: ${c.kind}${c.direction ? ` ${c.direction > 0 ? "+1" : "−1"}` : ""}`,
      c.slot,
    );
  }
  if (!plan.assignments.length) {
    s.revision++;
    return;
  }
  const a = clone(plan.assignments[0]);
  const tolerance = assignmentValid(p.loadout, p.faces, a)
    ? 0
    : (legendById[p.loadout.legend].passiveRule?.amount ?? 0);
  if (tolerance) p.passiveUsed.push("adapt");
  const heldDice = a.dice.filter((i) => p.dice[i].state === "HELD").length;
  a.dice.forEach((i) => (p.dice[i].state = "SPENT"));
  p.plan = clone(plan);
  p.actionsThisRound++;
  if (cardById[a.target]) {
    if (!p.known.includes(a.target)) p.known.push(a.target);
    s.stats.at(-1)!.cards[actor].push(a.target);
  }
  const d = {
    actor: actor as Seat,
    assignment: a,
    effects: effectsFor(s, actor, a),
    category:
      cardById[a.target]?.category ??
      ((a.target === "guard" ? "Ward" : "Setup") as "Ward" | "Setup"),
    canceled: false,
    redirected: false,
    prevention: 0,
    damageTaken: 0,
    tolerance,
    heldDice,
  };
  if (s.phase === "REACTION_WINDOW") {
    s.reaction = d;
    s.stats.at(-1)!.reactions[actor]++;
    s.phase = "REACTION_DECLARED";
  } else {
    s.pending = d;
    s.reaction = null;
    s.phase = "ACTION_DECLARED";
  }
  log(
    s,
    actor,
    "declaration",
    `${s.reaction === d ? "Reaction" : "Action"}: ${cardById[a.target]?.name ?? (a.target === "guard" ? "Universal Ward" : legendById[p.loadout.legend].active.name)} · spent Omens ${a.dice.map((i) => i + 1).join(", ")}`,
  );
  s.revision++;
}
export function pass(s: MatchState, actor: number) {
  const reacting = s.phase === "REACTION_WINDOW";
  if (
    !(reacting
      ? actor === 1 - s.activePlayer
      : s.phase === "MAIN_ACTION" && actor === s.activePlayer)
  )
    throw new Error("No decision window for this player.");
  s.replay.push({
    round: s.round,
    turn: s.turn,
    actor: actor as Seat,
    kind: "pass",
  });
  log(
    s,
    actor,
    reacting ? "reaction-pass" : "hold",
    reacting
      ? "Reaction passed; no resources spent."
      : "Turn ended; remaining Omens held for reactions.",
  );
  if (reacting) s.phase = "RESOLUTION";
  else {
    const p = s.players[actor];
    p.dice.forEach((d) => {
      if (d.state === "AVAILABLE") d.state = "HELD";
    });
    const held = p.dice.filter((d) => d.state === "HELD").length;
    s.stats.at(-1)!.held[actor] += held;
    const rule = legendById[p.loadout.legend].passiveRule;
    if (rule?.trigger === "holdOne" && held === 1) {
      p.guard += rule.amount;
      s.stats.at(-1)!.guard[actor] += rule.amount;
      log(
        s,
        actor,
        "guard",
        `Held one Omen: +${rule.amount} Ward`,
        rule.amount,
      );
    }
    s.phase = "TURN_END";
  }
  s.revision++;
}
export function timeoutPlan(s: MatchState, actor: number, _draft?: Plan) {
  if (s.phase === "OMEN_CHOICE")
    lockPlan(s, actor, {
      controls: [],
      assignments: [],
      omenSlots: [0, 1, 2].slice(0, s.omenRollCount),
    });
  else pass(s, actor);
  log(s, actor, "timeout", "Timeout: pass without spending resources.");
}
export function reveal(s: MatchState) {
  if (s.phase === "ACTION_DECLARED") advance(s);
  else if (s.phase === "REACTION_DECLARED") s.phase = "RESOLUTION";
  else throw new Error("No declaration to reveal.");
}
export function resolve(s: MatchState) {
  if (s.phase !== "RESOLUTION")
    throw new Error("Wait for the reaction window before resolving.");
  const result = resolveEffects(s);
  recordResolution(s, result);
}
export function recordResolution(
  s: MatchState,
  _result: { damage: number[]; guard: number[] },
) {
  decideWinner(s, false);
  s.pending = null;
  s.reaction = null;
  s.players.forEach((p) => (p.plan = null));
  s.phase = s.winner === null ? "MAIN_ACTION" : "MATCH_END";
  s.revision++;
}
export function decideWinner(
  s: MatchState,
  atRoundLimit: boolean | number = false,
) {
  const ended =
    s.players.some((p) => p.hp <= 0) ||
    (typeof atRoundLimit === "number"
      ? s.round >= atRoundLimit
      : atRoundLimit && s.round >= s.config.maxRounds);
  if (!ended) return;
  const [a, b] = s.players;
  s.winner =
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
export function cleanup(s: MatchState, maxRounds = s.config.maxRounds) {
  if (s.phase !== "ROUND_END")
    throw new Error("Cleanup is a round-end operation.");
  s.players.forEach((p) => {
    p.statuses = p.statuses.filter((x) => x.expiresRound > s.round);
  });
  decideWinner(s, s.round >= maxRounds);
  if (s.winner !== null) s.phase = "MATCH_END";
  s.revision++;
}
export function advance(s: MatchState, now = 0) {
  switch (s.phase) {
    case "MATCH_INTRO":
      rollInitiative(s);
      s.phase = "INITIATIVE_ROLL";
      break;
    case "INITIATIVE_ROLL":
      beginRound(s);
      break;
    case "ROUND_START":
      beginTurn(s);
      break;
    case "TURN_START": {
      const counts = s.config.openingOmenCounts;
      s.omenRollCount =
        s.round === 1 && counts
          ? counts[s.activePlayer === s.openingInitiative!.winner ? 0 : 1]
          : 3;
      if (s.round === 1 && counts && s.omenRollCount < 3) {
        s.phase = "OMEN_CHOICE";
        s.deadline = now + GAME.decisionMs;
      } else rollOmens(s);
      break;
    }
    case "OMEN_CHOICE":
      // Deterministic default for simulations/manual phase advance; clients submit explicit choices.
      lockPlan(s, s.activePlayer, {
        controls: [],
        assignments: [],
        omenSlots: [0, 1, 2].slice(0, s.omenRollCount),
      });
      break;
    case "DICE_ROLL":
      s.players[s.activePlayer].dice.forEach((d) => {
        if (d.state === "ROLLING") d.state = "AVAILABLE";
      });
      s.phase = "MAIN_ACTION";
      s.deadline = now + GAME.decisionMs;
      break;
    case "ACTION_DECLARED":
      s.phase = "REACTION_WINDOW";
      s.deadline = now + GAME.reactionMs;
      s.stats.at(-1)!.reactionWindows[other(s.activePlayer)]++;
      break;
    case "REACTION_DECLARED":
      s.phase = "RESOLUTION";
      break;
    case "RESOLUTION":
      resolve(s);
      s.deadline = now + GAME.decisionMs;
      break;
    case "TURN_END":
      if (s.turnInRound === 0) {
        s.turnInRound = 1;
        s.activePlayer = other(s.initiative);
        s.phase = "SECOND_TURN";
      } else s.phase = "ROUND_END";
      break;
    case "SECOND_TURN":
      beginTurn(s);
      break;
    case "ROUND_END":
      cleanup(s);
      if (s.winner === null) beginRound(s);
      break;
    case "MAIN_ACTION":
    case "REACTION_WINDOW":
      throw new Error("A decision is required: declare an ability or pass.");
    case "MATCH_END":
      return;
  }
  s.revision++;
}
export function exportReplay(s: MatchState): Replay {
  if (s.phase !== "MATCH_END")
    throw new Error("Live seed is private until match end.");
  return {
    seed: s.seed,
    version: s.version,
    loadouts: clone(s.players.map((p) => p.loadout)) as [Loadout, Loadout],
    turns: clone(s.replay),
    config: clone(s.config),
  };
}
export function verifyReplay(r: Replay) {
  if (r.version !== GAME.version)
    throw new Error(
      "Unsupported mechanical version. Replays must match the current Omen opening rules.",
    );
  const s = createMatch(r.seed, r.loadouts, undefined, r.config);
  let cursor = 0,
    steps = 0;
  while (s.phase !== "MATCH_END" && steps++ < 3000) {
    if (["OMEN_CHOICE", "MAIN_ACTION", "REACTION_WINDOW"].includes(s.phase)) {
      const c = r.turns[cursor++];
      if (!c || c.round !== s.round || c.turn !== s.turn)
        throw new Error("Replay decision missing or out of sequence.");
      if (c.kind === "pass") pass(s, c.actor);
      else lockPlan(s, c.actor, c.plan!);
    } else advance(s);
  }
  if (s.phase !== "MATCH_END" || cursor !== r.turns.length)
    throw new Error("Incomplete or trailing replay commands.");
  return s;
}

/** Compatibility alias; new callers use rollOmens. */
export const rollDice = rollOmens;
