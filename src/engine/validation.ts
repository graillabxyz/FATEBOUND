import { GAME } from "../content/config";
import { cardById } from "../content/cards";
import { dieById } from "../content/dice";
import { legendById } from "../content/legends";
import { PHASES, type MatchState, type Effect } from "./types";
import { validateLoadout } from "./rules";
import { supportedPrimitives } from "./effects";
/** Structural validation for versioned local checkpoints and internal snapshots. */
export function validateSavedState(s: MatchState, allowIncompatible = false) {
  const integer = (n: number, min: number, max: number, label: string) => {
    if (!Number.isInteger(n) || n < min || n > max)
      throw new Error(`Invalid saved ${label}.`);
  };
  if (
    !s ||
    s.version !== GAME.version ||
    !PHASES.includes(s.phase) ||
    !Array.isArray(s.players) ||
    s.players.length !== 2
  )
    throw new Error("Unsupported saved battle version or phase.");
  integer(s.seed, 0, 0xffffffff, "seed");
  integer(s.round, 0, 99, "round");
  integer(s.turn, 0, 198, "turn");
  integer(s.activePlayer, 0, 1, "active player");
  integer(s.initiative, 0, 1, "initiative");
  integer(s.turnInRound, 0, 1, "turn order");
  if (
    !s.config ||
    !Array.isArray(s.config.ramp) ||
    !s.config.ramp.length ||
    s.config.ramp.length > 99
  )
    throw new Error("Missing battle rules configuration.");
  integer(s.config.maxRounds, 1, 99, "round cap");
  for (const slots of s.config.ramp) {
    if (
      !Array.isArray(slots) ||
      !slots.length ||
      slots.length > 3 ||
      new Set(slots).size !== slots.length
    )
      throw new Error("Invalid saved dice ramp.");
    slots.forEach((i) => integer(i, 0, 2, "ramp slot"));
  }
  if (
    !Array.isArray(s.config.rngSeats) ||
    s.config.rngSeats.length !== 2 ||
    new Set(s.config.rngSeats).size !== 2 ||
    s.config.rngSeats.some((i) => i !== 0 && i !== 1)
  )
    throw new Error("Invalid saved random streams.");
  s.players.forEach((p) => {
    if (
      !p ||
      !legendById[p.loadout?.legend] ||
      !Array.isArray(p.loadout.cards) ||
      p.loadout.cards.length !== 4 ||
      new Set(p.loadout.cards).size !== 4 ||
      p.loadout.cards.some((id) => !cardById[id]) ||
      !Array.isArray(p.loadout.dice) ||
      p.loadout.dice.length !== 3 ||
      p.loadout.dice.some((id) => !dieById[id])
    )
      throw new Error("Invalid saved loadout.");
    if (!allowIncompatible) validateLoadout(p.loadout);
    integer(p.hp, 0, 1000, "HP");
    integer(p.guard, 0, 1000, "Guard");
    integer(p.control, 0, 6, "Control");
    integer(p.actionsThisRound, 0, 30, "action count");
    integer(p.damageDealt, 0, 100000, "damage");
    if (
      !Array.isArray(p.faces) ||
      p.faces.length !== 3 ||
      !Array.isArray(p.dice) ||
      p.dice.length !== 3
    )
      throw new Error("Three saved die resources required.");
    p.dice.forEach((d, i) => {
      if (
        !d ||
        ![
          "UNROLLED",
          "ROLLING",
          "AVAILABLE",
          "HELD",
          "ASSIGNED",
          "SPENT",
          "EXPIRED",
        ].includes(d.state) ||
        typeof d.modified !== "boolean"
      )
        throw new Error("Invalid saved die resource.");
      integer(d.rolledTurn, 0, 198, "roll turn");
      integer(
        d.originalFace,
        0,
        dieById[p.loadout.dice[i]].size - 1,
        "original face",
      );
      integer(p.faces[i], 0, dieById[p.loadout.dice[i]].size - 1, "face");
    });
    if (
      !Array.isArray(p.known) ||
      p.known.some((id) => !p.loadout.cards.includes(id)) ||
      new Set(p.known).size !== p.known.length ||
      !Array.isArray(p.passiveUsed)
    )
      throw new Error("Invalid reveal/passive memory.");
    if (!Array.isArray(p.statuses) || p.statuses.length > 100)
      throw new Error("Invalid saved statuses.");
    p.statuses.forEach((st) => {
      if (
        !["power", "ward", "poison", "stun"].includes(st.id) ||
        (st.cardId && !p.loadout.cards.includes(st.cardId))
      )
        throw new Error("Invalid saved status.");
      integer(st.amount, 0, 1000, "status value");
      integer(st.expiresRound, 0, 199, "status expiry");
    });
  });
  const effects = (es: Effect[], depth = 0) => {
    if (!Array.isArray(es) || es.length > 100 || depth > 8)
      throw new Error("Invalid saved effects.");
    for (const e of es) {
      if (!supportedPrimitives.includes(e.type))
        throw new Error("Unknown saved effect.");
      if (e.amount !== undefined && !Number.isFinite(e.amount))
        throw new Error("Invalid saved effect value.");
      if (e.effects) effects(e.effects, depth + 1);
    }
  };
  for (const d of [s.pending, s.reaction])
    if (d) {
      integer(d.actor, 0, 1, "declaring player");
      if (
        !d.assignment ||
        !["guard", "legend", ...s.players[d.actor].loadout.cards].includes(
          d.assignment.target,
        ) ||
        !Array.isArray(d.assignment.dice) ||
        d.assignment.dice.length < 1 ||
        d.assignment.dice.length > 3
      )
        throw new Error("Invalid saved declaration.");
      d.assignment.dice.forEach((i) => integer(i, 0, 2, "declared slot"));
      effects(d.effects);
    }
  if (
    [
      "ACTION_DECLARED",
      "REACTION_WINDOW",
      "REACTION_DECLARED",
      "RESOLUTION",
    ].includes(s.phase) &&
    !s.pending
  )
    throw new Error("Saved exchange lacks its action.");
  if (
    (s.pending && s.pending.actor !== s.activePlayer) ||
    (s.reaction && s.reaction.actor === s.activePlayer)
  )
    throw new Error("Saved exchange actor disagrees with turn.");
  if (
    !Array.isArray(s.stats) ||
    s.stats.length > 99 ||
    !Array.isArray(s.replay) ||
    s.replay.length > 3000 ||
    !Array.isArray(s.events) ||
    s.events.length > 10000
  )
    throw new Error("Invalid saved history.");
  for (const st of s.stats)
    for (const key of [
      "damage",
      "guard",
      "control",
      "held",
      "expired",
      "rolls",
      "reactions",
      "reactionWindows",
      "reactionSuccess",
      "turns",
      "unused",
    ] as const) {
      if (!Array.isArray(st[key]) || st[key].length !== 2)
        throw new Error("Invalid saved metrics.");
      st[key].forEach((n) => integer(n, 0, 100000, "metric"));
    }
  return s;
}
