import { GAME } from "../content/config";
import { cardById } from "../content/cards";
import { dieById } from "../content/dice";
import { legendById } from "../content/legends";
import { shiftedPosition } from "./fate";
import type {
  Assignment,
  ControlAction,
  DecisionContext,
  Face,
  Loadout,
  Plan,
  Requirement,
} from "./types";
export const EMPTY_PLAN: Plan = { controls: [], assignments: [] };
export const clone = <T>(value: T): T => structuredClone(value);
export function dieCompatible(l: Loadout, id: string) {
  const d = dieById[id],
    legend = legendById[l.legend];
  return (
    !!d &&
    legend.allowedDiceSizes.includes(d.size) &&
    (d.compatibleLegendTags.includes("all") ||
      d.compatibleLegendTags.some((t) => legend.tags.includes(t)))
  );
}
export function validateLoadout(l: Loadout, owned?: Set<string>) {
  if (!l || !legendById[l.legend]) throw new Error("Unknown Legend.");
  if (
    !Array.isArray(l.cards) ||
    l.cards.length !== 4 ||
    new Set(l.cards).size !== 4
  )
    throw new Error("Equip exactly four different reusable cards.");
  if (!Array.isArray(l.dice) || l.dice.length !== 3)
    throw new Error("Equip exactly three fixed dice.");
  l.cards.forEach((id) => {
    if (
      !cardById[id]?.tags.some((t) =>
        legendById[l.legend].compatibleCardTags.includes(t),
      )
    )
      throw new Error("Card is incompatible with this Legend.");
    if (owned && !owned.has(id)) throw new Error("Card is not owned.");
  });
  l.dice.forEach((id) => {
    if (!dieCompatible(l, id))
      throw new Error("Die is incompatible with this Legend.");
    if (owned && !owned.has(id)) throw new Error("Die is not owned.");
  });
}
export function applyControls(
  loadout: Loadout,
  original: number[],
  actions: ControlAction[],
  control: number = GAME.controlPerRound,
) {
  const positions = [...original];
  let left = control;
  for (const a of actions) {
    if (!Number.isInteger(a.slot) || a.slot < 0 || a.slot > 2)
      throw new Error("Invalid die slot.");
    const d = dieById[loadout.dice[a.slot]];
    if (!d.faces[positions[a.slot]])
      throw new Error("Die has no valid rolled face.");
    if (a.kind === "flip") {
      if (left < 2)
        throw new Error(`CONTROL INVALID: Flip costs 2; player has ${left}.`);
      positions[a.slot] = d.opposites[positions[a.slot]];
      left -= 2;
    } else if (
      a.kind === "shift" &&
      (a.direction === 1 || a.direction === -1)
    ) {
      if (left < 1) throw new Error("CONTROL INVALID: Shift costs 1.");
      const n = shiftedPosition(d, positions[a.slot], a.direction);
      if (n === null)
        throw new Error(
          "SHIFT INVALID: no numbered face exactly ±1 from this result.",
        );
      positions[a.slot] = n;
      left--;
    } else throw new Error("Invalid Control action.");
  }
  return { positions, control: left };
}
export function assignedFaces(
  l: Loadout,
  positions: number[],
  slots: number[],
): Face[] {
  return slots.map((i) => dieById[l.dice[i]]?.faces[positions[i]]);
}
export function meetsRequirement(
  r: Requirement,
  faces: Face[],
  sizes: number[] = [],
  tolerance = 0,
) {
  if (faces.length !== r.count || faces.some((f) => !f)) return false;
  if (r.size && sizes.some((s) => s !== r.size)) return false;
  if (r.symbol && !faces.some((f) => f.effectId === r.symbol)) return false;
  if (r.any || r.symbol) return true;
  if (faces.some((f) => f.type !== "number")) return false;
  const total = faces.reduce((n, f) => n + f.value, 0);
  if (r.exact !== undefined && Math.abs(total - r.exact) > tolerance)
    return false;
  if (r.parity && total % 2 !== (r.parity === "odd" ? 1 : 0)) return false;
  if (
    r.relationship === "equal" &&
    new Set(faces.map((f) => f.value)).size !== 1
  )
    return false;
  if (
    r.relationship === "different" &&
    new Set(faces.map((f) => f.value)).size !== faces.length
  )
    return false;
  return (
    (r.min === undefined || total >= r.min - tolerance) &&
    (r.max === undefined || total <= r.max + tolerance)
  );
}
export function requirementFor(l: Loadout, target: string): Requirement {
  if (target === "guard") return { count: 1, any: true };
  if (target === "legend") return legendById[l.legend].active.requirement;
  if (!l.cards.includes(target) || !cardById[target])
    throw new Error("Card is not equipped.");
  return cardById[target].requirement;
}
export function timingFor(l: Loadout, target: string) {
  return target === "guard"
    ? "BOTH"
    : target === "legend"
      ? legendById[l.legend].active.timing
      : cardById[target]?.timing;
}
export function guardValue(face: Face) {
  return face.type === "number"
    ? Math.floor(face.value / 2)
    : (face.guardValue ?? 0);
}
export function assignmentValid(
  l: Loadout,
  positions: number[],
  a: Assignment,
  tolerance = 0,
) {
  if (
    !Array.isArray(a.dice) ||
    a.dice.some((i) => !Number.isInteger(i) || i < 0 || i > 2) ||
    new Set(a.dice).size !== a.dice.length
  )
    return false;
  const faces = assignedFaces(l, positions, a.dice);
  if (a.target === "guard")
    return (
      faces.length === 1 &&
      !!faces[0] &&
      (faces[0].type === "number" || faces[0].guardValue !== undefined)
    );
  return meetsRequirement(
    requirementFor(l, a.target),
    faces,
    a.dice.map((i) => dieById[l.dice[i]].size),
    tolerance,
  );
}
export const resourceAvailable = (ctx: DecisionContext, slot: number) =>
  ["AVAILABLE", "HELD"].includes(ctx.self.dice[slot]?.state);
export function conditionMatches(
  condition: string,
  ctx: DecisionContext,
  plan: Plan = EMPTY_PLAN,
  enemyPlan: Plan | null = null,
) {
  const enemyActions =
    ctx.pending?.actor !== ctx.actor && ctx.pending
      ? [ctx.pending.assignment]
      : (enemyPlan?.assignments ?? []);
  return (
    (
      {
        behind: ctx.self.hp < ctx.enemy.hp,
        guarding: ctx.self.guard > 0,
        enemyAttacking:
          (!!ctx.pending &&
            ctx.pending.actor !== ctx.actor &&
            ctx.pending.effects.some((e) =>
              ["DAMAGE", "CONVERT", "MULTIPLIER"].includes(e.type),
            )) ||
          enemyActions.some((a) =>
            ["Attack", "Finisher", "Counter", "Prediction"].includes(
              cardById[a.target]?.category,
            ),
          ),
        enemyGuarding:
          ctx.enemy.guard > 0 || enemyActions.some((a) => a.target === "guard"),
        unusedDie: ctx.self.dice.some(
          (_, i) =>
            resourceAvailable(ctx, i) &&
            !plan.assignments.some((a) => a.dice.includes(i)),
        ),
        threeActions: ctx.self.actionsThisRound >= 3,
        lowHP: ctx.self.hp <= 7,
        knownEnemy: ctx.enemy.known.length > 0,
        hasInitiative: ctx.initiative === ctx.actor,
        noInitiative: ctx.initiative !== ctx.actor,
        heldDie:
          !!ctx.heldDice || ctx.self.dice.some((d) => d.state === "HELD"),
        firstAction: ctx.self.actionsThisRound === (ctx.resolving ? 1 : 0),
      } as Record<string, boolean>
    )[condition] ?? false
  );
}
export function validatePlan(ctx: DecisionContext, plan: Plan) {
  if (
    !plan ||
    !Array.isArray(plan.assignments) ||
    !Array.isArray(plan.controls) ||
    plan.assignments.length > 1 ||
    plan.controls.length > 2
  )
    throw new Error(
      "Declare one action at a time. Cards may be reused with fresh dice.",
    );
  const reacting = ctx.phase === "REACTION_WINDOW";
  if (
    ctx.phase &&
    !(reacting
      ? ctx.activePlayer !== ctx.actor
      : ctx.phase === "MAIN_ACTION" && ctx.activePlayer === ctx.actor)
  )
    throw new Error("TIMING INVALID: this player has no decision window.");
  if (reacting && plan.controls.length)
    throw new Error(
      "CONTROL INVALID: Control is available only on your own turn.",
    );
  for (const c of plan.controls)
    if (!resourceAvailable(ctx, c.slot))
      throw new Error(
        "DIE INVALID: Control requires an available, unspent die.",
      );
  const result = applyControls(
    ctx.self.loadout,
    ctx.self.faces,
    plan.controls,
    ctx.self.control,
  );
  for (const a of plan.assignments) {
    if (a.dice.some((i) => !resourceAvailable(ctx, i)))
      throw new Error(
        "DIE INVALID: unrolled, spent or expired dice cannot pay a cost.",
      );
    const timing = timingFor(ctx.self.loadout, a.target);
    if (timing !== "BOTH" && timing !== (reacting ? "REACTION" : "ACTION"))
      throw new Error(
        `TIMING INVALID: ${timing ?? "unknown"} ability cannot be used in this window.`,
      );
    if (
      ctx.self.statuses.some(
        (s) =>
          s.id === "stun" &&
          s.amount > 0 &&
          (!s.cardId || s.cardId === a.target),
      )
    )
      throw new Error("STUNNED: clear or wait for this status to expire.");
    const passive = legendById[ctx.self.loadout.legend].passiveRule;
    const tolerance =
      passive?.trigger === "adapt" && !ctx.self.passiveUsed.includes("adapt")
        ? passive.amount
        : 0;
    if (!assignmentValid(ctx.self.loadout, result.positions, a, tolerance)) {
      const r = requirementFor(ctx.self.loadout, a.target),
        total = assignedFaces(
          ctx.self.loadout,
          result.positions,
          a.dice,
        ).reduce((n, f) => n + (f?.value ?? 0), 0);
      throw new Error(
        `CARD INVALID: requires ${r.count} die/dice ${r.symbol ?? (r.exact !== undefined ? `exactly ${r.exact}` : `${r.min ?? 0}–${r.max ?? "∞"}`)}; currently ${total}.`,
      );
    }
    const r = requirementFor(ctx.self.loadout, a.target);
    if (r.control && result.control < r.control)
      throw new Error(
        "CONTROL INVALID: insufficient Control for this ability.",
      );
    if (r.condition && !conditionMatches(r.condition, ctx, plan))
      throw new Error(`CONDITION NOT MET: ${r.condition}.`);
    if (
      r.initiative !== undefined &&
      r.initiative !== (ctx.actor === ctx.initiative)
    )
      throw new Error("CONDITION NOT MET: initiative.");
    if (
      (r.minRound && ctx.round < r.minRound) ||
      (r.maxRound && ctx.round > r.maxRound)
    )
      throw new Error("CONDITION NOT MET: round.");
    if (r.held && !a.dice.every((i) => ctx.self.dice[i].state === "HELD"))
      throw new Error("CONDITION NOT MET: requires held dice.");
    if (
      r.legendClass &&
      legendById[ctx.self.loadout.legend].class !== r.legendClass
    )
      throw new Error("CONDITION NOT MET: Legend class.");
    if (
      r.unused &&
      ctx.self.dice.filter(
        (_, i) => resourceAvailable(ctx, i) && !a.dice.includes(i),
      ).length < r.unused
    )
      throw new Error("CONDITION NOT MET: unused dice.");
    result.control -= r.control ?? 0;
  }
  return result;
}
// A timeout never silently spends a player's defensive resources.
export function safePlan(
  _ctx: DecisionContext,
  _current: Plan = EMPTY_PLAN,
): Plan {
  return clone(EMPTY_PLAN);
}
export function explainAssignment(
  ctx: DecisionContext,
  plan: Plan,
  a: Assignment,
) {
  const total = a.dice.reduce(
    (n, i) =>
      n +
      (dieById[ctx.self.loadout.dice[i]]?.faces[ctx.self.faces[i]]?.value ?? 0),
    0,
  );
  try {
    validatePlan(ctx, { ...plan, assignments: [a] });
    return {
      valid: true,
      code: "VALID",
      message: "Timing, resources and activation requirements met.",
      total,
    };
  } catch (e) {
    const message = (e as Error).message;
    return { valid: false, code: message.split(":")[0], message, total };
  }
}
