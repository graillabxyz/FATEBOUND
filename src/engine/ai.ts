import type {
  Assignment,
  ControlAction,
  DecisionContext,
  Effect,
  Plan,
} from "./types";
import { cardById } from "../content/cards";
import { dieById } from "../content/dice";
import { legendById } from "../content/legends";
import {
  applyControls,
  assignmentValid,
  assignedFaces,
  guardValue,
  validatePlan,
} from "./rules";
export type Difficulty = "Training" | "Normal";
export function controlCandidates(
  ctx: DecisionContext,
  difficulty: Difficulty,
) {
  const all: ControlAction[][] = [[]];
  const actions: ControlAction[] = [0, 1, 2].flatMap((slot) => [
    { slot, kind: "shift" as const, direction: -1 as const },
    { slot, kind: "shift" as const, direction: 1 as const },
    { slot, kind: "flip" as const },
  ]);
  for (const a of actions) {
    try {
      applyControls(ctx.self.loadout, ctx.self.faces, [a], ctx.self.control);
      all.push([a]);
      if (difficulty === "Normal" && a.kind === "shift")
        for (const b of actions.filter((b) => b.kind === "shift")) {
          try {
            applyControls(
              ctx.self.loadout,
              ctx.self.faces,
              [a, b],
              ctx.self.control,
            );
            all.push([a, b]);
          } catch {
            /* Invalid control candidate. */
          }
        }
    } catch {
      /* Invalid control candidate. */
    }
  }
  const seen = new Set<string>();
  return all.filter((c) => {
    const p = applyControls(
      ctx.self.loadout,
      ctx.self.faces,
      c,
      ctx.self.control,
    );
    const key = `${p.positions}:${p.control}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function conditionWeight(
  condition: string | undefined,
  ctx: DecisionContext,
  assignments: Assignment[],
) {
  const known = ctx.enemy.loadout.cards
    .filter((c): c is string => !!c)
    .map((c) => cardById[c]);
  const attack = known.filter((c) =>
    ["Attack", "Finisher", "Counter"].includes(c.category),
  ).length;
  const guard = known.filter((c) =>
    ["Guard", "Counter"].includes(c.category),
  ).length;
  return (
    (
      {
        behind: ctx.self.hp < ctx.enemy.hp ? 1 : 0,
        guarding: assignments.some(
          (a) =>
            a.target === "guard" ||
            ["Guard", "Counter"].includes(cardById[a.target]?.category),
        )
          ? 1
          : 0,
        enemyAttacking: Math.min(0.95, 0.55 + attack * 0.12),
        enemyGuarding: Math.min(0.85, 0.32 + guard * 0.13),
        unusedDie: new Set(assignments.flatMap((a) => a.dice)).size < 3 ? 1 : 0,
        threeActions: assignments.length === 3 ? 1 : 0,
        knownEnemy: ctx.enemy.known.length > 0 ? 1 : 0,
        lowHP: ctx.self.hp <= 7 ? 1 : 0,
      } as Record<string, number>
    )[condition ?? ""] ?? 1
  );
}
type Value = { damage: number; guard: number; heal: number; setup: number };
function effectValue(
  effects: Effect[],
  ctx: DecisionContext,
  assignments: Assignment[],
  weight = 1,
): Value {
  const v: Value = { damage: 0, guard: 0, heal: 0, setup: 0 };
  for (const e of effects) {
    const n = (e.amount ?? 0) * weight;
    const children = () =>
      effectValue(
        e.effects ?? [],
        ctx,
        assignments,
        weight *
          (e.type === "CONDITIONAL"
            ? conditionWeight(e.condition, ctx, assignments)
            : e.type === "MULTIPLIER"
              ? (e.amount ?? 1)
              : 1),
      );
    if (e.type === "DAMAGE") v.damage += n;
    else if (e.type === "GUARD") v.guard += n;
    else if (e.type === "HEAL") v.heal += n;
    else if (e.type === "STATUS") v.setup += n * (ctx.round < 7 ? 0.8 : 0.05);
    else if (e.type === "BLOCK_EFFECT") v.guard += n * 0.7;
    else if (e.type === "SWAP_ASSIGNMENT") v.setup += 1.5 * weight;
    else if (e.type === "CLEANSE")
      v.heal += ctx.self.statuses
        .filter((s) => s.id === "poison")
        .reduce((s, x) => s + x.amount, 0);
    else if (["CONDITIONAL", "MULTIPLIER", "CONVERT"].includes(e.type)) {
      const child = children();
      if (e.type === "CONVERT" && e.from === "hp") {
        if (ctx.self.hp <= n) continue;
        child.heal -= n;
      }
      if (e.type === "CONVERT" && e.from === "guard")
        child.damage *= Math.min(3, v.guard + 2);
      for (const k of Object.keys(v) as (keyof Value)[]) v[k] += child[k];
    }
  }
  return v;
}
export function scorePlanDetails(ctx: DecisionContext, plan: Plan) {
  const { positions, control } = applyControls(
    ctx.self.loadout,
    ctx.self.faces,
    plan.controls,
    ctx.self.control,
  );
  const value: Value = { damage: 0, guard: 0, heal: 0, setup: 0 };
  let last = "";
  for (const a of [...plan.assignments].sort(
    (a, b) =>
      (cardById[a.target]?.priority ?? 20) -
      (cardById[b.target]?.priority ?? 20),
  )) {
    const c = cardById[a.target];
    const effects =
      a.target === "guard"
        ? [
            {
              type: "GUARD" as const,
              amount: guardValue(
                dieById[ctx.self.loadout.dice[a.dice[0]]].faces[
                  positions[a.dice[0]]
                ],
              ),
            },
          ]
        : a.target === "legend"
          ? legendById[ctx.self.loadout.legend].active.effects
          : c.effects;
    const v = effectValue(effects, ctx, plan.assignments);
    if (
      ctx.self.loadout.legend === "tengu" &&
      c?.preferred ===
        assignedFaces(ctx.self.loadout, positions, a.dice).reduce(
          (s, f) => s + f.value,
          0,
        ) &&
      v.damage > 0
    )
      v.damage++;
    const category = c?.category ?? "Guard";
    if (
      ctx.self.loadout.legend === "quetzalcoatl" &&
      last &&
      last !== category &&
      v.damage > 0
    )
      v.damage++;
    last = category;
    for (const k of Object.keys(value) as (keyof Value)[]) value[k] += v[k];
  }
  if (ctx.self.loadout.legend === "basajaun" && value.guard > 0) value.guard++;
  if (
    ctx.self.loadout.legend === "anansi" &&
    plan.assignments.some(
      (a) => cardById[a.target]?.category === "Manipulation",
    )
  )
    value.guard += 2;
  if (
    ctx.self.loadout.legend === "maui" &&
    new Set(plan.assignments.flatMap((a) => a.dice)).size === 2
  )
    value.guard += 2;
  const knownAttack = ctx.enemy.loadout.cards
    .filter((id): id is string => !!id)
    .filter((id) =>
      ["Attack", "Finisher"].includes(cardById[id].category),
    ).length;
  const threat = 3 + knownAttack * 1.5 + (ctx.round >= 5 ? 1 : 0);
  const danger = ctx.self.hp <= threat;
  const missing = legendById[ctx.self.loadout.legend].hp - ctx.self.hp;
  const offense =
    value.damage * (ctx.round === 7 && ctx.self.hp < ctx.enemy.hp ? 1.3 : 1.12);
  const defense =
    Math.min(value.guard, threat) * (danger ? 1.4 : 0.67) +
    Math.max(0, value.guard - threat) * 0.04;
  const recovery =
    Math.min(missing, Math.max(0, value.heal)) * (danger ? 1.5 : 0.95) +
    Math.min(0, value.heal) * 1.1;
  const lethalPotential = value.damage >= ctx.enemy.hp + 2 ? 12 : 0;
  const survival = danger && value.guard + value.heal >= threat ? 2 : 0;
  const resourceValue = control * 0.055;
  return {
    expectedDamage: value.damage,
    expectedDefense: value.guard,
    expectedHealing: value.heal,
    offense,
    defense,
    recovery,
    predictionValue: value.setup,
    lethalPotential,
    opponentThreat: threat,
    opponentLethalRisk: danger,
    survival,
    controlSpent: ctx.self.control - control,
    resourceValue,
    cardRevealCost: 0, // No explicit reveal penalty in the current production heuristic.
    overall:
      offense +
      defense +
      recovery +
      value.setup +
      lethalPotential +
      survival +
      resourceValue,
  };
}
export function scorePlan(ctx: DecisionContext, plan: Plan) {
  return scorePlanDetails(ctx, plan).overall;
}
export function choosePlan(
  ctx: DecisionContext,
  difficulty: Difficulty = "Normal",
  observe?: (plan: Plan, score: number) => void,
): Plan {
  let best: Plan = { controls: [], assignments: [] };
  let bestScore = -Infinity;
  for (const controls of controlCandidates(ctx, difficulty)) {
    const { positions } = applyControls(
      ctx.self.loadout,
      ctx.self.faces,
      controls,
      ctx.self.control,
    );
    const targets = ["guard", "legend", ...ctx.self.loadout.cards];
    const visit = (remaining: number[], assignments: Assignment[]) => {
      if (remaining.length === 0) {
        const plan = { controls, assignments };
        try {
          validatePlan(ctx, plan);
          const score = scorePlan(ctx, plan);
          observe?.(plan, score);
          if (score > bestScore) {
            bestScore = score;
            best = structuredClone(plan);
          }
        } catch {
          /* A second Leshy adaptation is not legal. */
        }
        return;
      }
      const [slot, ...rest] = remaining;
      visit(rest, assignments);
      for (const target of targets) {
        if (target !== "guard" && assignments.some((a) => a.target === target))
          continue;
        const count =
          target === "guard" || target === "legend"
            ? 1
            : cardById[target].requirement.count;
        const combos = count === 1 ? [[slot]] : rest.map((j) => [slot, j]);
        for (const dice of combos) {
          const a = { target, dice };
          if (
            assignmentValid(
              ctx.self.loadout,
              positions,
              a,
              ctx.self.loadout.legend === "leshy" ? 1 : 0,
            )
          )
            visit(
              rest.filter((i) => !dice.includes(i)),
              [...assignments, a],
            );
        }
      }
    };
    visit([0, 1, 2], []);
  }
  return best;
}

export function inspectAI(
  ctx: DecisionContext,
  difficulty: Difficulty = "Normal",
  limit = 20,
) {
  const candidates: { plan: Plan; score: number }[] = [];
  const seen = new Set<string>();
  let evaluated = 0;
  const chosen = choosePlan(ctx, difficulty, (plan, score) => {
    evaluated++;
    const key = JSON.stringify(plan);
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ plan: structuredClone(plan), score });
  });
  candidates.sort((a, b) => b.score - a.score);
  return {
    chosen,
    evaluated,
    alternatives: candidates
      .slice(0, limit)
      .map((c) => ({ ...c, details: scorePlanDetails(ctx, c.plan) })),
  };
}
