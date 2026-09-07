import type {
  Assignment,
  Declaration,
  Effect,
  MatchState,
  PlayerState,
  Primitive,
} from "./types";
import { cardById } from "../content/cards";
import { legendById } from "../content/legends";
import { omenById } from "../content/omens";
import {
  assignedFaces,
  assignmentValid,
  clone,
  conditionMatches,
  EMPTY_PLAN,
  guardValue,
} from "./rules";
import { shiftedPosition } from "./fate";
export type EffectFrame = {
  kind: "effect" | "canceled" | "commit";
  actor: number;
  source: string;
  target: string;
  priority: number;
  effect: string;
  conditions: string;
  result: string;
  before?: PlayerState[];
  after?: PlayerState[];
  pending?: { actor: number; amount: number }[];
  healing?: number[];
};
export const supportedPrimitives: Primitive[] = [
  "DAMAGE",
  "HEAL",
  "GUARD",
  "SHIFT_DIE",
  "FLIP_DIE",
  "SWAP_ASSIGNMENT",
  "BLOCK_EFFECT",
  "STUN_CARD",
  "MODIFY_REQUIREMENT",
  "GAIN_CONTROL",
  "LOSE_CONTROL",
  "STATUS",
  "CONDITIONAL",
  "MULTIPLIER",
  "CONVERT",
  "COPY",
  "CLEANSE",
  "REDIRECT",
  "COUNTERSTRIKE",
  "CANCEL",
];
export function effectPriority(a: Assignment) {
  return a.target === "guard"
    ? 20
    : a.target === "legend"
      ? 30
      : (cardById[a.target]?.priority ?? 40);
}
export function effectsFor(
  state: MatchState,
  actor: number,
  a: Assignment,
): Effect[] {
  const p = state.players[actor];
  return a.target === "guard"
    ? [
        {
          type: "GUARD",
          amount: guardValue(assignedFaces(p.loadout, p.faces, a.dice)[0]),
        },
      ]
    : a.target === "legend"
      ? clone(legendById[p.loadout.legend].active.effects)
      : clone(cardById[a.target].effects);
}
const log = (
  s: MatchState,
  actor: number,
  type: string,
  text: string,
  amount?: number,
) => s.events.push({ round: s.round, actor, type, text, amount });
export function* resolutionSteps(
  state: MatchState,
  inspect = false,
): Generator<EffectFrame, { damage: number[]; guard: number[] }> {
  if (!state.pending) throw new Error("No declared action to resolve.");
  const startDamage = state.players.map((p) => p.damageDealt),
    startGuard = state.stats.at(-1)?.guard.slice() ?? [0, 0];
  const action = state.pending,
    reaction = state.reaction;
  let reactionEffective = false;
  const conditionResults = new Map<Declaration, Map<string, boolean>>();
  const captureConditions = (d: Declaration) => {
    if (conditionResults.has(d)) return;
    const p = state.players[d.actor],
      enemy = state.players[1 - d.actor];
    const ctx = {
      round: state.round,
      fate: state.fate,
      self: p,
      enemy,
      actor: d.actor,
      initiative: state.initiative,
      pending: action,
      resolving: true,
      heldDice: d.heldDice,
    };
    const results = new Map<string, boolean>();
    const visit = (es: Effect[]) => {
      for (const e of es) {
        if (e.condition)
          results.set(
            e.condition,
            conditionMatches(
              e.condition,
              ctx,
              p.plan ?? EMPTY_PLAN,
              enemy.plan,
            ),
          );
        if (e.effects) visit(e.effects);
      }
    };
    visit(d === reaction ? [...d.effects, ...action.effects] : d.effects);
    conditionResults.set(d, results);
  };
  const counters: { decl: Declaration; effect: Effect }[] = [];
  const frame = (
    d: Declaration,
    effect: string,
    priority: number,
    before: PlayerState[],
    result: string,
    kind: EffectFrame["kind"] = "effect",
  ): EffectFrame => ({
    kind,
    actor: d.actor,
    source: d.assignment.target,
    target: d.redirected ? "self" : "declared target",
    priority,
    effect,
    conditions: "Paid costs are never refunded; one reaction window.",
    result,
    before: inspect ? before : undefined,
    after: inspect ? clone(state.players) : undefined,
  });
  function* run(
    es: Effect[],
    d: Declaration,
    priority: number,
    multiplier = 1,
    depth = 0,
  ): Generator<EffectFrame> {
    if (depth > 8) throw new Error("Effect recursion limit exceeded.");
    captureConditions(d);
    for (const e of es) {
      const before = inspect ? clone(state.players) : [],
        p = state.players[d.actor];
      const hostile = [
        "DAMAGE",
        "SHIFT_DIE",
        "FLIP_DIE",
        "SWAP_ASSIGNMENT",
        "REDIRECT",
        "BLOCK_EFFECT",
        "STUN_CARD",
        "LOSE_CONTROL",
        "CANCEL",
      ].includes(e.type);
      let target =
        e.target === "self"
          ? d.actor
          : e.target === "enemy"
            ? 1 - d.actor
            : hostile
              ? 1 - d.actor
              : d.actor;
      if (d.redirected) target = 1 - target;
      const t = state.players[target],
        stats = state.stats.at(-1)!;
      const passive = legendById[p.loadout.legend].passiveRule;
      let n = Math.max(0, (e.amount ?? 0) * multiplier),
        result = "Applied";
      if (e.scaling === "halfDieUp")
        n = Math.ceil(
          assignedFaces(p.loadout, p.faces, d.assignment.dice).reduce(
            (v, f) => v + f.value,
            0,
          ) / 2,
        );
      switch (e.type) {
        case "DAMAGE": {
          if (
            !p.passiveUsed.includes(
              `damage:${state.turn}:${p.actionsThisRound}:${d.assignment.target}`,
            )
          ) {
            if (
              passive?.trigger === "preferred" &&
              (passive.value ?? 5) ===
                assignedFaces(p.loadout, p.faces, d.assignment.dice).reduce(
                  (v, f) => v + f.value,
                  0,
                )
            )
              n += passive.amount;
            if (
              passive?.trigger === "categoryChange" &&
              p.lastCategory &&
              p.lastCategory !== d.category
            )
              n += passive.amount;
            if (n > 0) {
              const powers = p.statuses.filter(
                (s) =>
                  s.id === "power" &&
                  (s.expiresOwnerTurn !== undefined ||
                    s.expiresRound <= state.round),
              );
              n += powers.reduce((v, s) => v + s.amount, 0);
              p.statuses = p.statuses.filter((s) => !powers.includes(s));
            }
            p.passiveUsed.push(
              `damage:${state.turn}:${p.actionsThisRound}:${d.assignment.target}`,
            );
          }
          const prevented = Math.min(n, d.prevention);
          n -= prevented;
          if (d === action && prevented > 0) reactionEffective = true;
          d.prevention -= prevented;
          const ward = t.statuses
            .filter((s) => s.id === "ward")
            .reduce((v, s) => v + s.amount, 0);
          n = Math.max(0, n - ward);
          const blocked = Math.min(
            t.guard,
            Math.max(0, n - (e.guardPierce ?? 0)),
          );
          t.guard -= blocked;
          if (d === action && reaction && blocked > 0) reactionEffective = true;
          const damage = Math.min(t.hp, Math.max(0, n - blocked));
          t.hp -= damage;
          if (target !== d.actor) {
            p.damageDealt += damage;
            stats.damage[d.actor] += damage;
          }
          if (d === action && target === 1 - action.actor)
            action.damageTaken += damage;
          result = `${damage} damage; ${blocked} Ward absorbed; ${prevented} prevented`;
          log(state, d.actor, "damage", result, damage);
          Object.assign(state.events.at(-1)!, {
            target,
            wardAbsorbed: blocked,
          });
          break;
        }
        case "HEAL": {
          const heal = Math.min(
            n,
            Math.max(0, legendById[t.loadout.legend].hp - t.hp),
          );
          t.hp += heal;
          if (d === reaction && heal > 0) reactionEffective = true;
          result = `Healed ${heal}`;
          log(state, d.actor, "heal", result, heal);
          break;
        }
        case "GUARD": {
          if (
            passive?.trigger === "firstGuard" &&
            !p.passiveUsed.includes("firstGuard")
          ) {
            n += passive.amount;
            p.passiveUsed.push("firstGuard");
          }
          t.guard += n;
          stats.guard[target] += n;
          result = `+${n} Ward`;
          log(state, d.actor, "guard", result, n);
          break;
        }
        case "BLOCK_EFFECT":
          action.prevention += n;
          result = `Prevent next ${n} damage from declared action`;
          break;
        case "REDIRECT":
        case "SWAP_ASSIGNMENT":
          action.redirected = true;
          reactionEffective = true;
          result = "Declared enemy effects redirect to their source";
          break;
        case "CANCEL":
          action.canceled = true;
          reactionEffective = true;
          result = "Declared action canceled";
          break;
        case "COUNTERSTRIKE":
          counters.push({ decl: d, effect: { ...e, type: "DAMAGE" } });
          result = "Armed: retaliate after receiving actual attack damage";
          break;
        case "GAIN_CONTROL":
          t.control = Math.min(6, t.control + n);
          break;
        case "LOSE_CONTROL":
          t.control = Math.max(0, t.control - n);
          break;
        case "STATUS":
          if (e.status)
            t.statuses.push({
              id: e.status,
              amount: n,
              expiresRound: state.round + (e.duration ?? 1),
              ...(e.status === "power"
                ? { expiresOwnerTurn: t.playerTurnCount + 1 }
                : {}),
              ...(e.status === "poison"
                ? { tickOwnerTurn: t.playerTurnCount + 1 }
                : {}),
            });
          break;
        case "STUN_CARD":
          t.statuses.push({
            id: "stun",
            amount: Math.max(1, n),
            expiresRound: state.round,
          });
          if (action.actor === target) action.canceled = true;
          break;
        case "MODIFY_REQUIREMENT":
          action.canceled = true;
          reactionEffective = true;
          result = "Requirement disrupted; declared action canceled";
          break;
        case "SHIFT_DIE":
        case "FLIP_DIE": {
          const slot =
            action.actor === target && e.omenTarget !== "unspent"
              ? action.assignment.dice[0]
              : t.dice.findIndex((d) =>
                  ["AVAILABLE", "HELD"].includes(d.state),
                );
          if (slot === undefined || slot < 0) {
            result = "No eligible Omen";
            break;
          }
          const die = omenById[t.loadout.dice[slot]],
            face =
              e.type === "FLIP_DIE"
                ? die.opposites[t.faces[slot]]
                : shiftedPosition(die, t.faces[slot], e.direction ?? -1);
          if (face === null) {
            result = "No legal numerical shift";
            break;
          }
          t.faces[slot] = face;
          t.dice[slot].modified = true;
          result = `Omen ${slot + 1} changed; requirement will be checked again`;
          break;
        }
        case "CLEANSE":
          t.statuses = t.statuses.filter(
            (s) => !["poison", "stun"].includes(s.id),
          );
          break;
        case "CONDITIONAL": {
          const yes = conditionResults.get(d)?.get(e.condition ?? "") ?? false;
          result = yes ? "Condition met" : "Condition not met";
          if (yes)
            yield* run(e.effects ?? [], d, priority, multiplier, depth + 1);
          break;
        }
        case "MULTIPLIER":
          yield* run(e.effects ?? [], d, priority, multiplier * n, depth + 1);
          break;
        case "CONVERT":
          if (e.from === "hp") {
            if (p.hp > n) {
              p.hp -= n;
              yield* run(e.effects ?? [], d, priority, multiplier, depth + 1);
            } else result = "Insufficient Life to pay conversion";
          } else {
            const spent = Math.min(p.guard, n);
            p.guard -= spent;
            yield* run(e.effects ?? [], d, priority, spent, depth + 1);
          }
          break;
        case "COPY":
          if (d !== action)
            yield* run(
              action.effects.filter(
                (e) => !["COPY", "COUNTERSTRIKE", "CONVERT"].includes(e.type),
              ),
              d,
              priority,
              multiplier,
              depth + 1,
            );
          else result = "No opposing declared action to copy";
          break;
        default:
          throw new Error(`Unknown production effect: ${e.type}`);
      }
      yield frame(d, e.type, priority, before, result);
    }
  }
  if (reaction) {
    const p = state.players[reaction.actor],
      rule = legendById[p.loadout.legend].passiveRule;
    if (
      rule?.trigger === "firstManipulation" &&
      reaction.category === "Manipulation" &&
      !p.passiveUsed.includes("firstManipulation")
    ) {
      p.passiveUsed.push("firstManipulation");
      yield* run([{ type: "GUARD", amount: rule.amount }], reaction, 10);
    }
    yield* run(reaction.effects, reaction, 20);
  }
  const before = clone(state.players),
    p = state.players[action.actor];
  const valid = assignmentValid(
    p.loadout,
    p.faces,
    action.assignment,
    (action as Declaration & { tolerance?: number }).tolerance ?? 0,
  );
  yield frame(
    action,
    "TARGET_VALIDATION",
    30,
    before,
    action.canceled
      ? "Canceled by reaction"
      : valid
        ? "Target and paid Omens still valid"
        : "Requirement no longer met",
    !valid || action.canceled ? "canceled" : "effect",
  );
  if (valid && !action.canceled) yield* run(action.effects, action, 40);
  else
    log(
      state,
      action.actor,
      "fizzle",
      "Declared action canceled; costs remain spent.",
    );
  if (action.damageTaken > 0)
    for (const c of counters) yield* run([c.effect], c.decl, 50);
  for (const d of [action, reaction])
    if (d) state.players[d.actor].lastCategory = d.category;
  if (reaction) {
    const success =
      reactionEffective ||
      !valid ||
      (action.damageTaken > 0 && counters.length > 0);
    if (success) state.stats.at(-1)!.reactionSuccess[reaction.actor]++;
  }
  yield frame(
    action,
    "CLEANUP",
    60,
    clone(state.players),
    "Exchange complete; evaluate lethal after post-damage triggers",
    "commit",
  );
  return {
    damage: state.players.map((p, i) => p.damageDealt - startDamage[i]),
    guard: state.stats.at(-1)!.guard.map((v, i) => v - startGuard[i]),
  };
}
export function resolveEffects(state: MatchState) {
  const it = resolutionSteps(state);
  let n = it.next();
  while (!n.done) n = it.next();
  return n.value;
}
