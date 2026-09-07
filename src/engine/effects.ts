import type {
  Assignment,
  Effect,
  MatchState,
  Plan,
  PlayerState,
  Primitive,
} from "./types";
import { cardById } from "../content/cards";
import { dieById } from "../content/dice";
import { legendById } from "../content/legends";
import {
  assignedFaces,
  assignmentValid,
  conditionMatches,
  guardValue,
  clone,
} from "./rules";
import { shiftedPosition } from "./fate";
export type EffectContext = {
  state: MatchState;
  actor: number;
  assignment: Assignment;
  plan: Plan;
  snapshot: [PlayerState, PlayerState];
  pending: { actor: number; amount: number }[];
  healing: number[];
  guardGained: number[];
  blocks: number[];
  firstGuard: boolean[];
  firstManip: boolean[];
  adapted: boolean[];
  requirementTolerance: number[];
  powerUsed: boolean[];
  lastCategory: (string | null)[];
  multiplier: number;
  bonus: number;
  bonusUsed: boolean;
  depth: number;
  priority: number;
  inspect: boolean;
};
const event = (c: EffectContext, type: string, text: string, amount?: number) =>
  c.state.events.push({
    round: c.state.round,
    actor: c.actor,
    type,
    text,
    amount,
  });
const self = (c: EffectContext) => c.state.players[c.actor];
const enemy = (c: EffectContext) => c.state.players[1 - c.actor];
const amount = (e: Effect, c: EffectContext) => (e.amount ?? 0) * c.multiplier;
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
type Handler = (e: Effect, c: EffectContext) => void | Generator<EffectFrame>;
const handlers: Record<Primitive, Handler> = {
  DAMAGE: (e, c) => {
    let value = amount(e, c);
    if (!c.bonusUsed && value > 0) {
      value += c.bonus;
      c.bonusUsed = true;
    }
    if (!c.powerUsed[c.actor] && value > 0) {
      value += self(c)
        .statuses.filter(
          (s) => s.id === "power" && s.expiresRound === c.state.round,
        )
        .reduce((n, s) => n + s.amount, 0);
      c.powerUsed[c.actor] = true;
    }
    c.pending.push({ actor: c.actor, amount: value });
  },
  HEAL: (e, c) => {
    c.healing[c.actor] += amount(e, c);
  },
  GUARD: (e, c) => {
    let n = amount(e, c);
    if (
      n > 0 &&
      !c.firstGuard[c.actor] &&
      self(c).loadout.legend === "basajaun"
    )
      n++;
    c.firstGuard[c.actor] = true;
    self(c).guard += n;
    c.guardGained[c.actor] += n;
    event(c, "guard", `+${n} Guard`, n);
  },
  STATUS: (e, c) => {
    if (!e.status) return;
    const p = e.target === "enemy" ? enemy(c) : self(c);
    p.statuses.push({
      id: e.status,
      amount: amount(e, c),
      expiresRound: c.state.round + (e.duration ?? 1),
    });
    event(c, "status", `${e.status} ${amount(e, c)}`);
  },
  GAIN_CONTROL: (e, c) => {
    self(c).control = Math.min(6, self(c).control + amount(e, c));
  },
  LOSE_CONTROL: (e, c) => {
    enemy(c).control = Math.max(0, enemy(c).control - amount(e, c));
  },
  SWAP_ASSIGNMENT: (_e, c) => {
    const assignments =
      enemy(c).plan?.assignments.filter((a) => cardById[a.target]) ?? [];
    if (assignments.length >= 2) {
      [assignments[0].dice, assignments[1].dice] = [
        assignments[1].dice,
        assignments[0].dice,
      ];
      event(c, "swap", "Enemy card dice were exchanged.");
    } else event(c, "swap", "No pair of enemy cards to exchange.");
  },
  BLOCK_EFFECT: (e, c) => {
    c.blocks[1 - c.actor] += amount(e, c);
    event(
      c,
      "block",
      `Disrupt: −${amount(e, c)} from the next enemy damage effect.`,
    );
  },
  STUN_CARD: (e, c) => {
    enemy(c).statuses.push({
      id: "stun",
      amount: Math.max(1, amount(e, c)),
      expiresRound: c.state.round,
    });
  },
  MODIFY_REQUIREMENT: (e, c) => {
    c.requirementTolerance[e.target === "enemy" ? 1 - c.actor : c.actor] +=
      Math.max(0, amount(e, c));
  },
  SHIFT_DIE: (e, c) => {
    const p = e.target === "self" ? self(c) : enemy(c);
    const slot = p.faces.findIndex(
      (f, i) =>
        shiftedPosition(dieById[p.loadout.dice[i]], f, e.direction ?? 1) !==
        null,
    );
    if (slot >= 0)
      p.faces[slot] = shiftedPosition(
        dieById[p.loadout.dice[slot]],
        p.faces[slot],
        e.direction ?? 1,
      )!;
  },
  FLIP_DIE: (e, c) => {
    const p = e.target === "self" ? self(c) : enemy(c);
    p.faces[0] = dieById[p.loadout.dice[0]].opposites[p.faces[0]];
  },
  CLEANSE: (_e, c) => {
    self(c).statuses = self(c).statuses.filter(
      (s) => !["poison", "stun"].includes(s.id),
    );
    event(c, "cleanse", "Negative statuses cleared.");
  },
  CONDITIONAL: function* (e, c) {
    const s = { ...c.snapshot[c.actor], guard: self(c).guard };
    const opponent = c.snapshot[1 - c.actor];
    if (
      conditionMatches(
        e.condition ?? "",
        { round: c.state.round, fate: c.state.fate, self: s, enemy: opponent },
        c.plan,
        enemy(c).plan,
      )
    )
      yield* effectSteps(e.effects ?? [], c);
  },
  MULTIPLIER: function* (e, c) {
    const prev = c.multiplier;
    c.multiplier *= e.amount ?? 1;
    yield* effectSteps(e.effects ?? [], c);
    c.multiplier = prev;
  },
  CONVERT: function* (e, c) {
    const p = self(c);
    const requested = amount(e, c);
    if (e.from === "hp") {
      if (c.snapshot[c.actor].hp + c.healing[c.actor] <= requested) return;
      c.healing[c.actor] -= requested;
      yield* effectSteps(e.effects ?? [], c);
    } else {
      const n = Math.min(p.guard, requested);
      p.guard -= n;
      const prev = c.multiplier;
      c.multiplier = n;
      yield* effectSteps(e.effects ?? [], c);
      c.multiplier = prev;
    }
  },
  COPY: function* (_e, c) {
    const a = enemy(c).plan?.assignments.find((a) => cardById[a.target]);
    const effects = a
      ? cardById[a.target].effects.filter(
          (e) =>
            !["COPY", "CONDITIONAL", "MULTIPLIER", "CONVERT"].includes(e.type),
        )
      : [];
    yield* effectSteps(effects, c);
  },
};
function frame(
  c: EffectContext,
  effect: string,
  before: PlayerState[] | undefined,
  kind: EffectFrame["kind"] = "effect",
  result = "Applied",
  target = "self",
  conditions = "",
): EffectFrame {
  return {
    kind,
    actor: c.actor,
    source: c.assignment.target,
    target,
    priority: c.priority,
    effect,
    conditions,
    result,
    before,
    after: c.inspect ? clone(c.state.players) : undefined,
    pending: c.inspect ? clone(c.pending) : undefined,
    healing: c.inspect ? [...c.healing] : undefined,
  };
}
export function* effectSteps(
  effects: Effect[],
  c: EffectContext,
): Generator<EffectFrame> {
  if (c.depth >= 8) throw new Error("Effect recursion limit reached.");
  c.depth++;
  for (const e of effects) {
    const before = c.inspect ? clone(c.state.players) : undefined;
    const result = handlers[e.type](e, c);
    if (result) yield* result;
    yield frame(
      c,
      e.type,
      before,
      "effect",
      e.type === "DAMAGE" || e.type === "HEAL"
        ? "Queued until priority commit"
        : e.type === "CONDITIONAL"
          ? "Condition evaluated; child steps appear only when true"
          : "Applied",
      e.target ??
        ([
          "DAMAGE",
          "BLOCK_EFFECT",
          "SWAP_ASSIGNMENT",
          "LOSE_CONTROL",
          "STUN_CARD",
        ].includes(e.type)
          ? "enemy"
          : "self"),
      e.condition ?? "",
    );
  }
  c.depth--;
}
export function runEffects(effects: Effect[], c: EffectContext) {
  for (const _step of effectSteps(effects, c)) {
    /* Drain the production iterator. */
  }
}
export const supportedPrimitives = Object.keys(handlers);
export function effectPriority(a: Assignment) {
  return a.target === "guard"
    ? 20
    : a.target === "legend"
      ? 30
      : cardById[a.target].priority;
}
export function* resolutionSteps(
  state: MatchState,
  inspect = false,
): Generator<EffectFrame, { damage: number[]; guard: number[] }> {
  const c: EffectContext = {
    state,
    actor: 0,
    assignment: { target: "guard", dice: [] },
    plan: { controls: [], assignments: [] },
    snapshot: clone(state.players),
    pending: [],
    healing: [0, 0],
    guardGained: [0, 0],
    blocks: [0, 0],
    firstGuard: [false, false],
    firstManip: [false, false],
    adapted: [false, false],
    requirementTolerance: [0, 0],
    powerUsed: [false, false],
    lastCategory: [null, null],
    multiplier: 1,
    bonus: 0,
    bonusUsed: false,
    depth: 0,
    priority: 0,
    inspect,
  };
  const startDamage = state.players.map((p) => p.damageDealt);
  // Passive Guard joins the defense bucket; no seating-dependent resolution.
  for (const level of [10, 20, 30, 40, 50]) {
    c.priority = level;
    c.snapshot = clone(state.players);
    const toleranceAtStart = [...c.requirementTolerance];
    c.pending = [];
    c.healing = [0, 0];
    for (let actor = 0; actor < 2; actor++) {
      c.actor = actor;
      const p = state.players[actor];
      const source = c.snapshot[actor];
      c.plan = source.plan!;
      if (
        level === 20 &&
        p.loadout.legend === "maui" &&
        new Set(c.plan.assignments.flatMap((a) => a.dice)).size === 2
      ) {
        c.assignment = { target: "passive:maui", dice: [] };
        yield* effectSteps([{ type: "GUARD", amount: 2 }], c);
      }
      for (const a of c.plan.assignments
        .filter((a) => effectPriority(a) === level)
        .sort(
          (a, b) =>
            p.loadout.cards.indexOf(a.target) -
            p.loadout.cards.indexOf(b.target),
        )) {
        c.assignment = a;
        let valid = assignmentValid(
          source.loadout,
          source.faces,
          a,
          toleranceAtStart[actor],
        );
        if (
          !valid &&
          p.loadout.legend === "leshy" &&
          !c.adapted[actor] &&
          assignmentValid(source.loadout, source.faces, a, 1)
        ) {
          valid = true;
          c.adapted[actor] = true;
          event(c, "adapt", "Leshy adapts the number band.");
        }
        const stunned = source.statuses.find(
          (s) =>
            s.id === "stun" &&
            s.amount > 0 &&
            (!s.cardId || s.cardId === a.target),
        );
        if (stunned && cardById[a.target]) {
          stunned.amount--;
          const actual = p.statuses.find(
            (s) =>
              s.id === "stun" &&
              s.amount > 0 &&
              (!s.cardId || s.cardId === a.target),
          );
          if (actual) actual.amount--;
          event(c, "fizzle", `${cardById[a.target].name} was stunned.`);
          yield frame(
            c,
            "STUN",
            c.inspect ? clone(c.snapshot) : undefined,
            "canceled",
            "STUNNED",
            "self",
          );
          continue;
        }
        if (!valid) {
          event(
            c,
            "fizzle",
            `${cardById[a.target]?.name ?? "Action"} no longer meets its requirement.`,
          );
          yield frame(
            c,
            "REQUIREMENT",
            c.inspect ? clone(c.snapshot) : undefined,
            "canceled",
            "Requirement failed after manipulation",
            "self",
          );
          continue;
        }
        const card = cardById[a.target];
        const category =
          card?.category ?? (a.target === "guard" ? "Guard" : "Setup");
        if (
          category === "Manipulation" &&
          p.loadout.legend === "anansi" &&
          !c.firstManip[actor]
        ) {
          yield* effectSteps([{ type: "GUARD", amount: 2 }], c);
          c.firstManip[actor] = true;
        }
        c.bonus = 0;
        c.bonusUsed = false;
        if (
          p.loadout.legend === "tengu" &&
          card?.preferred ===
            assignedFaces(source.loadout, source.faces, a.dice).reduce(
              (s, f) => s + f.value,
              0,
            )
        )
          c.bonus++;
        if (
          p.loadout.legend === "quetzalcoatl" &&
          c.lastCategory[actor] &&
          c.lastCategory[actor] !== category
        )
          c.bonus++;
        c.lastCategory[actor] = category;
        event(
          c,
          "card",
          card?.name ??
            (a.target === "guard"
              ? "Universal Guard"
              : legendById[p.loadout.legend].active.name),
        );
        const effects =
          a.target === "guard"
            ? [
                {
                  type: "GUARD" as const,
                  amount: guardValue(
                    assignedFaces(source.loadout, source.faces, a.dice)[0],
                  ),
                },
              ]
            : a.target === "legend"
              ? legendById[p.loadout.legend].active.effects
              : card.effects;
        yield* effectSteps(effects, c);
      }
    }
    const beforeCommit = inspect ? clone(state.players) : undefined;
    const damageTaken = [0, 0];
    for (const hit of c.pending) {
      const target = 1 - hit.actor;
      let n = Math.max(0, hit.amount);
      if (c.blocks[hit.actor] > 0) {
        n = Math.max(0, n - c.blocks[hit.actor]);
        c.blocks[hit.actor] = 0;
      }
      const absorbed = Math.min(state.players[target].guard, n);
      state.players[target].guard -= absorbed;
      n -= absorbed;
      damageTaken[target] += n;
      state.events.push({
        round: state.round,
        actor: hit.actor,
        type: "damage",
        text: n
          ? `${n} damage${absorbed ? ` · ${absorbed} blocked` : ""}`
          : `${absorbed} damage blocked`,
        amount: n,
      });
    }
    for (let i = 0; i < 2; i++) {
      const p = state.players[i];
      const max = legendById[p.loadout.legend].hp;
      const healedHP = Math.max(
        0,
        Math.min(max, c.snapshot[i].hp + c.healing[i]),
      );
      const effective = Math.min(healedHP, damageTaken[i]);
      p.hp = Math.max(0, healedHP - damageTaken[i]);
      state.players[1 - i].damageDealt += effective;
    }
    yield {
      kind: "commit",
      actor: -1,
      source: "priority-batch",
      target: "both",
      priority: level,
      effect: "COMMIT",
      conditions: "Simultaneous health boundary",
      result: "Damage and healing committed together",
      before: beforeCommit,
      after: inspect ? clone(state.players) : undefined,
    };
    if (state.players.some((p) => p.hp <= 0)) break;
  }
  return {
    damage: state.players.map((p, i) => p.damageDealt - startDamage[i]),
    guard: c.guardGained,
  };
}

export function resolveEffects(state: MatchState) {
  const iterator = resolutionSteps(state);
  let next = iterator.next();
  while (!next.done) next = iterator.next();
  return next.value;
}
