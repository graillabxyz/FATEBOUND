import type { DecisionContext, Effect, Plan, ControlAction } from "./types";
import { cardById } from "../content/cards";
import { legendById } from "../content/legends";
import {
  clone,
  EMPTY_PLAN,
  applyControls,
  guardValue,
  meetsRequirement,
  resourceAvailable,
  validatePlan,
} from "./rules";
import { omenById } from "../content/omens";
export type Difficulty = "Training" | "Normal";
function values(es: Effect[]): {
  damage: number;
  guard: number;
  heal: number;
  disrupt: number;
} {
  const result = { damage: 0, guard: 0, heal: 0, disrupt: 0 };
  for (const e of es) {
    const n = Math.max(0, e.amount ?? 0);
    if (["DAMAGE", "COUNTERSTRIKE"].includes(e.type)) result.damage += n;
    if (e.type === "GUARD") result.guard += n || 1;
    if (e.type === "HEAL") result.heal += n;
    if (["CANCEL", "REDIRECT"].includes(e.type)) result.disrupt += 4;
    if (e.type === "BLOCK_EFFECT") result.disrupt += n;
    if (["SHIFT_DIE", "FLIP_DIE"].includes(e.type)) result.disrupt += 1;
    if (e.effects) {
      const v = values(e.effects);
      for (const k of Object.keys(result) as (keyof typeof result)[])
        result[k] += v[k] * (e.type === "CONDITIONAL" ? 0.6 : 1);
    }
  }
  return result;
}
export function scorePlanDetails(ctx: DecisionContext, plan: Plan) {
  const reacting = ctx.phase === "REACTION_WINDOW",
    incoming = ctx.pending ? values(ctx.pending.effects).damage : 0;
  const positions = applyControls(
    ctx.self.loadout,
    ctx.self.faces,
    plan.controls,
    ctx.self.control,
  ).positions;
  let expectedDamage = 0,
    expectedDefense = 0,
    expectedHealing = 0,
    predictionValue = 0;
  for (const a of plan.assignments) {
    const v =
      a.target === "guard"
        ? {
            damage: 0,
            guard: guardValue(
              omenById[ctx.self.loadout.dice[a.dice[0]]].faces[
                positions[a.dice[0]]
              ],
            ),
            heal: 0,
            disrupt: 0,
          }
        : values(
            a.target === "legend"
              ? legendById[ctx.self.loadout.legend].active.effects
              : cardById[a.target].effects,
          );
    expectedDamage += v.damage;
    expectedDefense += v.guard;
    expectedHealing += Math.min(
      v.heal,
      Math.max(0, legendById[ctx.self.loadout.legend].hp - ctx.self.hp),
    );
    predictionValue += reacting ? v.disrupt : 0;
  }
  const controlSpent = plan.controls.reduce(
      (n, c) => n + (c.kind === "flip" ? 2 : 1),
      0,
    ),
    cardRevealCost =
      plan.assignments.filter(
        (a) => cardById[a.target] && !ctx.self.known.includes(a.target),
      ).length * 0.12;
  const lethalPotential =
    expectedDamage >= ctx.enemy.hp + ctx.enemy.guard ? 8 : 0;
  const blocked = reacting
    ? Math.min(expectedDefense, Math.max(0, incoming - ctx.self.guard))
    : 0;
  const opponentLethalRisk =
    reacting &&
    incoming > ctx.self.guard &&
    incoming - ctx.self.guard >= ctx.self.hp
      ? 5
      : 0;
  const used = new Set(plan.assignments.flatMap((a) => a.dice));
  const reactionAbilities = [
    legendById[ctx.self.loadout.legend].active,
    ...ctx.self.loadout.cards.map((id) => cardById[id]),
  ].filter((a) => a.timing === "REACTION");
  const resourceValue = ctx.self.dice.reduce((total, _, slot) => {
    if (!resourceAvailable(ctx, slot) || used.has(slot)) return total;
    if (reacting) return total + 0.18;
    // The second player goes first next round: their held dice expire immediately.
    if (ctx.turnInRound === 1) return total;
    const die = omenById[ctx.self.loadout.dice[slot]],
      face = die.faces[positions[slot]];
    let response = Math.min(3, guardValue(face));
    for (const ability of reactionAbilities)
      if (meetsRequirement(ability.requirement, [face], [die.size])) {
        const v = values(ability.effects);
        response = Math.max(
          response,
          Math.min(3, v.guard) + v.damage * 0.7 + v.disrupt * 0.6,
        );
      }
    return total + response * 0.85;
  }, 0);
  // Holding has a concrete opportunity value. Guard on an empty incoming action has low value.
  let overall =
    expectedDamage * (reacting ? 1.2 : 1.65) +
    expectedHealing * 0.8 +
    (reacting ? blocked * 1.4 : expectedDefense * 0.35) +
    predictionValue * 1.3 +
    lethalPotential +
    resourceValue -
    controlSpent * 0.3 -
    cardRevealCost;
  if (reacting && plan.assignments.length) {
    overall -= 0.5;
    if (opponentLethalRisk && blocked + predictionValue > 0) overall += 5;
  }
  return {
    expectedDamage,
    expectedDefense,
    expectedHealing,
    offense: expectedDamage,
    defense: blocked,
    recovery: expectedHealing,
    predictionValue,
    lethalPotential,
    opponentThreat: incoming,
    opponentLethalRisk,
    survival: blocked,
    controlSpent,
    resourceValue,
    cardRevealCost,
    overall,
  };
}
export function inspectAI(
  ctx: DecisionContext,
  difficulty: Difficulty = "Normal",
  limit = 20,
) {
  if (ctx.phase === "OMEN_CHOICE") {
    const ranked = scoreOpeningChoices(ctx),
      alternatives = ranked.slice(0, limit);
    return {
      chosen: clone(ranked[0]?.plan ?? EMPTY_PLAN),
      evaluated: ranked.length,
      alternatives,
    };
  }

  const alternatives: {
    plan: Plan;
    score: number;
    details: ReturnType<typeof scorePlanDetails>;
  }[] = [];
  if (
    ctx.phase &&
    !(
      (ctx.phase === "MAIN_ACTION" && ctx.activePlayer === ctx.actor) ||
      (ctx.phase === "REACTION_WINDOW" && ctx.activePlayer !== ctx.actor)
    )
  )
    return { chosen: clone(EMPTY_PLAN), evaluated: 0, alternatives: [] };
  const slots = [0, 1, 2].filter((i) => resourceAvailable(ctx, i));
  const controls: ControlAction[][] = [[]];
  if (ctx.phase !== "REACTION_WINDOW") {
    const singles = slots.flatMap(
      (slot) =>
        [
          { slot, kind: "shift", direction: -1 },
          { slot, kind: "shift", direction: 1 },
          { slot, kind: "flip" },
        ] as ControlAction[],
    );
    controls.push(...singles.map((c) => [c]));
    if (difficulty === "Normal")
      for (const a of singles.filter((c) => c.kind === "shift"))
        for (const b of singles.filter((c) => c.kind === "shift"))
          controls.push([a, b]);
  }
  const targets = ["guard", "legend", ...ctx.self.loadout.cards];
  const add = (plan: Plan) => {
    try {
      validatePlan(ctx, plan);
      const details = scorePlanDetails(ctx, plan);
      alternatives.push({ plan, score: details.overall, details });
    } catch {
      /* Invalid candidates never reach authority. */
    }
  };
  add(clone(EMPTY_PLAN));
  const seen = new Set<string>();
  for (const cs of controls) {
    let positions: number[], left: number;
    try {
      const p = applyControls(
        ctx.self.loadout,
        ctx.self.faces,
        cs,
        ctx.self.control,
      );
      positions = p.positions;
      left = p.control;
    } catch {
      continue;
    }
    const key = positions.join(",") + ":" + left;
    if (seen.has(key)) continue;
    seen.add(key);
    for (const target of targets)
      for (let mask = 1; mask < 1 << slots.length; mask++) {
        const dice = slots.filter((_, i) => mask & (1 << i));
        add({ controls: cs, assignments: [{ target, dice }] });
      }
  }
  alternatives.sort(
    (a, b) =>
      b.score - a.score ||
      a.plan.controls.length - b.plan.controls.length ||
      JSON.stringify(a.plan).localeCompare(JSON.stringify(b.plan)),
  );
  return {
    chosen: clone(alternatives[0]?.plan ?? EMPTY_PLAN),
    evaluated: alternatives.length,
    alternatives: alternatives.slice(0, limit),
  };
}
export function choosePlan(
  ctx: DecisionContext,
  difficulty: Difficulty = "Normal",
) {
  return inspectAI(ctx, difficulty, 1).chosen;
}

/** Expected ability utility over fixed face distributions. Never reads a seed or hidden enemy Hand. */
export function scoreOpeningChoices(ctx: DecisionContext) {
  const count = ctx.omenRollCount ?? 1;
  const abilities = [
    ...ctx.self.loadout.cards.map((id) => cardById[id]),
    legendById[ctx.self.loadout.legend].active,
  ];
  const choices = [1, 2, 3, 4, 5, 6, 7].filter(
    (mask) => [0, 1, 2].filter((i) => mask & (1 << i)).length === count,
  );
  return choices
    .map((mask) => {
      const slots = [0, 1, 2].filter((i) => mask & (1 << i));
      const omens = slots.map((i) => omenById[ctx.self.loadout.dice[i]]);
      let utility = 0,
        observations = 0;
      const sample: import("./types").Face[] = [];
      const visit = (index: number) => {
        if (index < omens.length) {
          for (const face of omens[index].faces) {
            sample[index] = face;
            visit(index + 1);
          }
          return;
        }
        const best = Array(1 << count).fill(0) as number[];
        for (let subset = 1; subset < best.length; subset++) {
          const indices = slots
            .map((_, i) => i)
            .filter((i) => subset & (1 << i));
          const faces = indices.map((i) => sample[i]),
            sizes = indices.map((i) => omens[i].size);
          if (indices.length === 1) best[subset] = guardValue(faces[0]) * 0.45;
          for (const ability of abilities) {
            const r = ability.requirement;
            if (
              (r.minRound && ctx.round < r.minRound) ||
              (r.maxRound && ctx.round > r.maxRound) ||
              (r.control && ctx.self.control < r.control) ||
              (r.initiative !== undefined &&
                r.initiative !== (ctx.actor === ctx.initiative))
            )
              continue;
            if (!meetsRequirement(r, faces, sizes)) continue;
            const v = values(ability.effects);
            const score =
              v.damage * 1.5 +
              v.guard * 0.75 +
              v.disrupt * 0.9 +
              Math.min(
                v.heal,
                Math.max(
                  0,
                  legendById[ctx.self.loadout.legend].hp - ctx.self.hp,
                ),
              ) *
                0.8;
            best[subset] = Math.max(
              best[subset],
              score * (ability.timing === "REACTION" ? 0.9 : 1),
            );
          }
          for (
            let split = (subset - 1) & subset;
            split;
            split = (split - 1) & subset
          )
            best[subset] = Math.max(
              best[subset],
              best[split] + best[subset ^ split],
            );
        }
        utility += best.at(-1)!;
        observations++;
      };
      visit(0);
      const score = utility / observations;
      const plan: Plan = { controls: [], assignments: [], omenSlots: slots };
      const details = {
        ...scorePlanDetails(ctx, plan),
        resourceValue: score,
        overall: score,
      };
      return { plan, score, details };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.plan
          .omenSlots!.map((i) => ctx.self.loadout.dice[i])
          .join("|")
          .localeCompare(
            b.plan.omenSlots!.map((i) => ctx.self.loadout.dice[i]).join("|"),
          ),
    );
}
