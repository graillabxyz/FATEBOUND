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
export function validateLoadout(l: Loadout, owned?: Set<string>) {
  const legend = legendById[l.legend];
  if (!legend) throw new Error("Unknown Legend.");
  if (l.cards.length !== 4 || new Set(l.cards).size !== 4)
    throw new Error("Equip exactly four different cards.");
  if (l.dice.length !== 3) throw new Error("Equip exactly three dice.");
  l.cards.forEach((id) => {
    if (cardById[id]?.legend !== l.legend)
      throw new Error("Card is incompatible with this Legend.");
    if (owned && !owned.has(id)) throw new Error("Card is not owned.");
  });
  l.dice.forEach((id, i) => {
    const d = dieById[id];
    if (
      !d ||
      d.size !== legend.diceSlots[i] ||
      (!d.compatibleLegendTags.includes("all") &&
        !d.compatibleLegendTags.some((t) => legend.tags.includes(t)))
    )
      throw new Error("Die does not fit this slot.");
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
  for (const action of actions) {
    if (!Number.isInteger(action.slot) || action.slot < 0 || action.slot > 2)
      throw new Error("Invalid die slot.");
    const die = dieById[loadout.dice[action.slot]];
    if (action.kind === "flip") {
      if (left < 2) throw new Error("Flip costs 2 Control.");
      positions[action.slot] = die.opposites[positions[action.slot]];
      left -= 2;
    } else if (
      action.kind === "shift" &&
      (action.direction === -1 || action.direction === 1)
    ) {
      if (left < 1) throw new Error("No Control remaining.");
      const next = shiftedPosition(
        die,
        positions[action.slot],
        action.direction,
      );
      if (next === null)
        throw new Error("Shift requires neighboring numbered faces.");
      positions[action.slot] = next;
      left--;
    } else throw new Error("Invalid Control action.");
  }
  return { positions, control: left };
}
export function assignedFaces(
  loadout: Loadout,
  positions: number[],
  slots: number[],
): Face[] {
  return slots.map((i) => dieById[loadout.dice[i]].faces[positions[i]]);
}
export function meetsRequirement(
  r: Requirement,
  faces: Face[],
  sizes: number[] = [],
  tolerance = 0,
) {
  if (faces.length !== r.count) return false;
  if (r.size && sizes.some((s) => s !== r.size)) return false;
  if (r.any) return true;
  if (r.symbol) return faces.some((f) => f.effectId === r.symbol);
  if (faces.some((f) => f.type !== "number")) return false;
  const total = faces.reduce((s, f) => s + f.value, 0);
  return (
    (r.min === undefined || total >= r.min - tolerance) &&
    (r.max === undefined || total <= r.max + tolerance)
  );
}
export function requirementFor(loadout: Loadout, target: string): Requirement {
  if (target === "guard") return { count: 1, any: true };
  if (target === "legend") return legendById[loadout.legend].active.requirement;
  const c = cardById[target];
  if (!loadout.cards.includes(target) || !c)
    throw new Error("Card is not equipped.");
  return c.requirement;
}
export function assignmentValid(
  loadout: Loadout,
  positions: number[],
  a: Assignment,
  tolerance = 0,
) {
  if (
    a.dice.some((i) => !Number.isInteger(i) || i < 0 || i > 2) ||
    new Set(a.dice).size !== a.dice.length
  )
    return false;
  const faces = assignedFaces(loadout, positions, a.dice);
  if (a.target === "guard")
    return a.dice.length === 1 && faces[0].type !== "blank";
  return meetsRequirement(
    requirementFor(loadout, a.target),
    faces,
    a.dice.map((i) => dieById[loadout.dice[i]].size),
    tolerance,
  );
}
export function validatePlan(ctx: DecisionContext, plan: Plan) {
  if (
    !Array.isArray(plan.assignments) ||
    !Array.isArray(plan.controls) ||
    plan.assignments.length > 3 ||
    plan.controls.length > 2
  )
    throw new Error("Malformed plan.");
  const { positions, control } = applyControls(
    ctx.self.loadout,
    ctx.self.faces,
    plan.controls,
    ctx.self.control,
  );
  let left = control;
  const used = new Set<number>(),
    targets = new Set<string>();
  let adapted = false;
  for (const a of plan.assignments) {
    if (a.target !== "guard" && targets.has(a.target))
      throw new Error("An action can only be used once per round.");
    targets.add(a.target);
    for (const slot of a.dice) {
      if (used.has(slot)) throw new Error("A die cannot be assigned twice.");
      used.add(slot);
    }
    const base = assignmentValid(ctx.self.loadout, positions, a);
    if (!base) {
      if (
        ctx.self.loadout.legend !== "leshy" ||
        adapted ||
        !assignmentValid(ctx.self.loadout, positions, a, 1)
      )
        throw new Error("Dice do not meet this action’s requirement.");
      adapted = true;
    }
    const r = requirementFor(ctx.self.loadout, a.target);
    left -= r.control ?? 0;
    if (left < 0) throw new Error("Insufficient Control.");
    if (r.condition && !conditionMatches(r.condition, ctx, plan))
      throw new Error("Action condition is not met.");
  }
  return { positions, control: left };
}
export function conditionMatches(
  condition: string,
  ctx: DecisionContext,
  plan: Plan,
  enemyPlan: Plan | null = null,
) {
  const enemyActions = enemyPlan?.assignments ?? [];
  return (
    (
      {
        behind: ctx.self.hp < ctx.enemy.hp,
        guarding: ctx.self.guard > 0,
        enemyAttacking: enemyActions.some(
          (a) =>
            a.target === "legend" ||
            ["Attack", "Finisher", "Counter", "Prediction"].includes(
              cardById[a.target]?.category,
            ),
        ),
        enemyGuarding: enemyActions.some(
          (a) =>
            a.target === "guard" ||
            ["Guard", "Counter"].includes(cardById[a.target]?.category),
        ),
        unusedDie: new Set(plan.assignments.flatMap((a) => a.dice)).size < 3,
        threeActions: plan.assignments.length === 3,
        lowHP: ctx.self.hp <= 7,
        knownEnemy: ctx.enemy.known.length > 0,
      } as Record<string, boolean>
    )[condition] ?? false
  );
}
export function guardValue(face: Face) {
  return face.type === "blank"
    ? 0
    : face.effectId === "guard"
      ? 3
      : face.type === "number"
        ? Math.max(1, Math.floor(face.value / 3))
        : 1;
}
export function safePlan(
  ctx: DecisionContext,
  current: Plan = EMPTY_PLAN,
): Plan {
  let plan = clone(current);
  try {
    validatePlan(ctx, plan);
  } catch {
    plan = clone(EMPTY_PLAN);
  }
  const { positions } = applyControls(
    ctx.self.loadout,
    ctx.self.faces,
    plan.controls,
    ctx.self.control,
  );
  const used = new Set(plan.assignments.flatMap((a) => a.dice));
  [0, 1, 2].forEach((i) => {
    if (
      !used.has(i) &&
      dieById[ctx.self.loadout.dice[i]].faces[positions[i]].type !== "blank"
    )
      plan.assignments.push({ target: "guard", dice: [i] });
  });
  return plan;
}

/** Detailed diagnostics share the exact production validators. They never authorize an illegal plan. */
export function explainAssignment(
  ctx: DecisionContext,
  plan: Plan,
  a: Assignment,
) {
  try {
    const { positions, control } = applyControls(
      ctx.self.loadout,
      ctx.self.faces,
      plan.controls,
      ctx.self.control,
    );
    const r = requirementFor(ctx.self.loadout, a.target);
    const faces = assignedFaces(ctx.self.loadout, positions, a.dice);
    const sizes = a.dice.map((i) => dieById[ctx.self.loadout.dice[i]].size);
    let code = "VALID",
      message = "Activation requirements met.";
    if (
      new Set(a.dice).size !== a.dice.length ||
      plan.assignments
        .filter((x) => x !== a)
        .some((x) => x.dice.some((d) => a.dice.includes(d)))
    ) {
      code = "INVALID";
      message = "A die is assigned more than once.";
    } else if (faces.length !== r.count) {
      code = "INVALID";
      message = `Requires ${r.count} dice; currently ${faces.length}.`;
    } else if (r.size && sizes.some((s) => s !== r.size)) {
      code = "WRONG DIE";
      message = `Requires D${r.size}.`;
    } else if (r.symbol && !faces.some((f) => f.effectId === r.symbol)) {
      code = "WRONG SYMBOL";
      message = `Requires ${r.symbol}; current faces: ${faces.map((f) => f.effectId ?? f.value).join(", ")}.`;
    } else if (
      !assignmentValid(
        ctx.self.loadout,
        positions,
        a,
        ctx.self.loadout.legend === "leshy" ? 1 : 0,
      )
    ) {
      const total = faces.reduce((n, f) => n + f.value, 0);
      code =
        r.min !== undefined && total < r.min
          ? "INSUFFICIENT TOTAL"
          : "CONDITION NOT MET";
      message =
        a.target === "guard"
          ? "Guard requires one nonblank face."
          : `Requires ${r.min ?? "any"}${r.max === undefined ? "+" : `–${r.max}`}; currently ${total}${faces.some((f) => f.type !== "number") ? " with a non-number face" : ""}.`;
    } else if ((r.control ?? 0) > control) {
      code = "INSUFFICIENT CONTROL";
      message = `Requires ${r.control} Control; ${control} available.`;
    } else if (r.condition && !conditionMatches(r.condition, ctx, plan)) {
      code = "CONDITION NOT MET";
      message = `State condition ${r.condition} is false.`;
    } else if (
      ctx.self.statuses.some(
        (s) =>
          s.id === "stun" &&
          s.amount > 0 &&
          (!s.cardId || s.cardId === a.target),
      ) &&
      cardById[a.target]
    ) {
      code = "STUNNED";
      message =
        "The production resolver will consume a stun and cancel this action.";
    }
    return {
      valid: code === "VALID",
      code,
      message,
      total: faces.reduce((n, f) => n + f.value, 0),
    };
  } catch (error) {
    return {
      valid: false,
      code: "INVALID",
      message: (error as Error).message,
      total: 0,
    };
  }
}
