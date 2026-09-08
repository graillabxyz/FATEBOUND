import { readFileSync, writeFileSync } from "node:fs";
import { CARDS, cardsFor } from "../src/content/cards";
import { LEGENDS } from "../src/content/legends";
import { effectUtility } from "../src/dev/affinity-balance";
import { STARTERS } from "../src/content/loadouts";
import { STARTER_STRATEGIES } from "../src/content/starter-strategies";
import { affinityText } from "../src/content/affinities";
const folder = "reports/skill-balance-v9/";
const names = [
  "v8-baseline",
  "release-v9-starters",
  "release-v9-custom",
  "release-v9-policy",
];
const panels = names.map((name) =>
  JSON.parse(readFileSync(folder + name + ".json", "utf8")),
);
const wilson = (wins: number, n: number) => {
  const p = wins / n,
    z = 1.96,
    k = 1 + (z * z) / n,
    m = (p + (z * z) / (2 * n)) / k,
    h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / k;
  return [m - h, m + h];
};
const summaries = panels.map((p) => {
  const rows = p.rows.filter((r: any) => !r.reverse),
    complete = rows.filter((r: any) => !r.stalled),
    wins = complete.filter((r: any) => r.winner === r.opening).length;
  return {
    ...p,
    rows: undefined,
    uniqueSeeds: rows.length,
    openingWinRate: wins / complete.length,
    opening95CI: wilson(wins, complete.length),
    completedOnlyReactions:
      complete.reduce((n: number, r: any) => n + r.reactionUses, 0) /
      complete.length,
    completedOnlyWard:
      complete.reduce((n: number, r: any) => n + r.ward, 0) / complete.length,
    burst90: complete
      .map((r: any) => r.maxTurnDamage)
      .sort((a: number, b: number) => a - b)[Math.floor(complete.length * 0.9)],
  };
});
const base = panels[1].rows.filter((r: any) => !r.reverse),
  policy = panels[3].rows.filter((r: any) => !r.reverse);
const policyResult = {
  focalNormalWins: base.filter((r: any) => r.winner === 0).length,
  focalGreedyWins: policy.filter((r: any) => r.winner === 0).length,
  games: base.length,
  changedOutcomes: base.filter(
    (r: any, i: number) => r.winner !== policy[i].winner,
  ).length,
  note: "The first named Legend changes policy on both seat copies. Mirrors included. Same legal candidates and RNG; this is a heuristic ablation, not evidence of human skill or optimal play.",
};
const audit = CARDS.map((c) => ({
  id: c.id,
  name: c.name,
  affinity: affinityText(c.affinityRequirements),
  legalLegends: LEGENDS.filter((l) =>
    cardsFor(l.id).some((x) => x.id === c.id),
  ).map((l) => l.id),
  timing: c.timing,
  cost: c.requirementLabel,
  text: c.text,
  effects: c.effects,
  diagnosticUtility: effectUtility(c.effects),
  baseDamage: c.effects
    .filter((e) => e.type === "DAMAGE" || e.type === "COUNTERSTRIKE")
    .reduce((n, e) => n + (e.amount ?? 0), 0),
  omenCost: c.requirement.count,
}));
writeFileSync(
  folder + "summary.json",
  JSON.stringify(
    {
      version: 9,
      baselineCommit: "6f4231398a7ea7868cdae1196eeb35ccf5c30461",
      summaries,
      policyResult,
      starters: STARTERS,
      strategies: STARTER_STRATEGIES,
      audit,
    },
    null,
    2,
  ),
);
writeFileSync(
  folder + "card-audit.md",
  "# OMNIPATH v9 — all 60 Cards\n\nUtility is a rough diagnostic with conditional discounts, not a strength ranking. Compare timing, affordability, repeatability and Affinity access. Reaction effects occur in one exchange; Cards never become permanent battlefield objects.\n\n| Card | Access | Timing / cost | Revised effect | Utility |\n|---|---|---|---|---|\n" +
    audit
      .map(
        (c) =>
          `| ${c.name} | ${c.affinity} | ${c.timing} · ${c.cost} | ${c.text} | ${c.diagnosticUtility.toFixed(2)} |`,
      )
      .join("\n") +
    "\n",
);
console.log(
  JSON.stringify(
    {
      panels: summaries.map((p) => ({
        label: p.label,
        opening: p.openingWinRate,
        ci: p.opening95CI,
        burst90: p.burst90,
        rounds: p.averageRounds,
        score: p.byLegend,
      })),
      policyResult,
    },
    null,
    2,
  ),
);
