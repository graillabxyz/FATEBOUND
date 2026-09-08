import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { LEGENDS } from "../src/content/legends";
import { STARTERS } from "../src/content/loadouts";
import { CARDS, cardById } from "../src/content/cards";
import { omenById } from "../src/content/omens";
import { signatureFor } from "../src/content/collection-progression";
import { affinityText } from "../src/content/affinities";
import { meetsRequirement } from "../src/engine/rules";
import { omenFace } from "../src/content/terminology";
const base = JSON.parse(
  readFileSync(
    "reports/campaign/starter-economy-20260908/summary.json",
    "utf8",
  ),
);
const access = JSON.parse(
  readFileSync("reports/campaign/starter-access-20260908/summary.json", "utf8"),
);
const economy = JSON.parse(
  readFileSync("reports/economy/20260908.json", "utf8"),
);
const sum = (rs: any[], k: string) => rs.reduce((n, r) => n + (r[k] ?? 0), 0),
  pct = (v: number) => (100 * v).toFixed(1) + "%";
function ci(w: number, n: number) {
  if (!n) return [0, 1];
  const p = w / n,
    z = 1.96,
    d = 1 + (z * z) / n,
    c = (p + (z * z) / 2 / n) / d,
    h = (z * Math.sqrt((p * (1 - p) + (z * z) / 4 / n) / n)) / d;
  return [c - h, c + h];
}
const legends = LEGENDS.map((l) => {
  const rows = base.rows.filter((r: any) => r.legend === l.id),
    n = sum(rows, "games"),
    recipe = STARTERS[l.id];
  const dice = recipe.dice.map((id) => omenById[id]);
  const outcomes: number[][] = [];
  for (let a = 0; a < dice[0].size; a++)
    for (let b = 0; b < dice[1].size; b++)
      for (let c = 0; c < dice[2].size; c++) outcomes.push([a, b, c]);
  const variants = Object.fromEntries(
    ["curated", "entry", "numbered"].map((v) => {
      const rs = access.rows.filter(
          (r: any) => r.legend === l.id && r.variant === v,
        ),
        games = sum(rs, "games");
      return [
        v,
        {
          games,
          score: (sum(rs, "wins") + sum(rs, "draws") / 2) / games,
          winRate: sum(rs, "wins") / games,
          loadout: rs[0].loadout,
        },
      ];
    }),
  );
  const cards = recipe.cards.map((id) => {
    const c = cardById[id];
    const subsets = Array.from({ length: 7 }, (_, i) =>
      [0, 1, 2].filter((s) => (i + 1) & (1 << s)),
    ).filter((s) => s.length === c.requirement.count);
    const raw =
      outcomes.filter((o) =>
        subsets.some((slots) =>
          meetsRequirement(
            c.requirement,
            slots.map((s) => dice[s].faces[o[s]]),
            slots.map((s) => dice[s].size),
          ),
        ),
      ).length / outcomes.length;
    return {
      id,
      name: c.name,
      timing: c.timing,
      affinity: affinityText(c.affinityRequirements),
      requirement: c.requirementLabel,
      text: c.text,
      uses: rows.reduce((s: number, r: any) => s + (r.cards[id] ?? 0), 0),
      usesPerMatch:
        rows.reduce((s: number, r: any) => s + (r.cards[id] ?? 0), 0) / n,
      rawFullRollProbability: raw,
    };
  });
  return {
    id: l.id,
    name: l.name,
    games: n,
    wins: sum(rows, "wins"),
    draws: sum(rows, "draws"),
    winRate: sum(rows, "wins") / n,
    score: (sum(rows, "wins") + sum(rows, "draws") / 2) / n,
    winCI: ci(sum(rows, "wins") / 2, n / 2),
    averageRounds: sum(rows, "rounds") / n,
    damage: sum(rows, "damage") / n,
    ward: sum(rows, "ward") / n,
    focus: sum(rows, "focus") / n,
    reactions: sum(rows, "reactions") / n,
    reactionSuccess:
      sum(rows, "reactionSuccess") / Math.max(1, sum(rows, "reactions")),
    heldPerTurn: sum(rows, "held") / sum(rows, "turns"),
    expiredPerTurn: sum(rows, "expired") / sum(rows, "turns"),
    cards,
    dice: dice.map((d) => ({
      id: d.id,
      name: d.name,
      size: d.size,
      signature: d.id === signatureFor(l.id),
      faces: d.faces.map((f) => omenFace(f).name),
      opposites: d.opposites.map((i) => i + 1),
      voidProbability:
        d.faces.filter((f) => f.type === "blank").length / d.size,
      sigilProbability:
        d.faces.filter((f) => f.type === "symbol").length / d.size,
    })),
    variants,
    matchups: rows.map((r: any) => ({
      opponent: r.opponent,
      games: r.games,
      winRate: r.wins / r.games,
      drawRate: r.draws / r.games,
      score: (r.wins + r.draws / 2) / r.games,
    })),
    openingChoices: rows.flatMap((r: any) =>
      Object.entries(r.openingChoices).map(([omens, x]: [string, any]) => ({
        opponent: r.opponent,
        omens,
        ...x,
      })),
    ),
  };
});
const decisive = base.games - sum(base.rows, "draws"),
  iw = sum(base.rows, "initiativeWins");
const data = {
  date: "2026-09-08",
  mechanicalVersion: 7,
  starterCardCoverage: {
    uniqueCards: new Set(Object.values(STARTERS).flatMap((l) => l.cards)).size,
    globalCards: CARDS.length,
  },
  games: base.games,
  accessGames: access.games,
  seatMismatches: base.mismatches + sum(access.rows, "mismatches"),
  initiativeWinRate: iw / decisive,
  initiativeCI: ci(iw / 2, decisive / 2),
  method:
    "Normal production AI, 36 directed starter cohorts × 4,000 games (2,000 independent reversed-seat RNG pairs). Six focal Legends each receive 24,000 games. Mirrors included. Raw win rates count draws in the denominator; score gives draws half credit. Confidence intervals count each reversed pair once. Access panel: 200 games per focal variant/matchup, paired same seeds; change only the focal build. Full-roll requirement probabilities enumerate fixed face layouts, excluding timing, enemy conditions, Focus and passive effects. These measure this heuristic AI and cannot establish human fun or optimal play.",
  legends,
  economy,
};
mkdirSync("reports/economy", { recursive: true });
writeFileSync(
  "reports/economy/starter-panel-20260908.json",
  JSON.stringify(data, null, 2),
);
writeFileSync("src/metrics/starter-economy-results.json", JSON.stringify(data));
let md = `# OMNIPATH starter and economy audit\n\n8 September 2026 · mechanical version 7\n\n${data.method}\n\n${base.games.toLocaleString()} starter matches + ${access.games.toLocaleString()} access/numbered comparison matches. **${data.seatMismatches} seat mismatches.** Opening Initiative wins ${pct(data.initiativeWinRate)} of decisive matches (95% interval ${data.initiativeCI.map(pct).join("–")}).\n\n## Starter results\n\n| Legend | Games | Win rate | Draw-adjusted score | Rounds | Damage | Ward | Reactions |\n|---|---:|---:|---:|---:|---:|---:|---:|\n`;
for (const l of legends)
  md += `| ${l.name} | ${l.games} | ${pct(l.winRate)} | ${pct(l.score)} | ${l.averageRounds.toFixed(2)} | ${l.damage.toFixed(1)} | ${l.ward.toFixed(1)} | ${l.reactions.toFixed(2)} |\n`;
md +=
  "\n## All 36 matchups\n\nDraw-adjusted score. Each cell is 4,000 games.\n\n| Focal Legend | " +
  legends.map((l) => l.name).join(" | ") +
  " |\n|---|" +
  legends.map(() => "---:").join("|") +
  "|\n";
for (const l of legends)
  md +=
    `| ${l.name} | ` +
    legends
      .map((o) => pct(l.matchups.find((r: any) => r.opponent === o.id).score))
      .join(" | ") +
    " |\n";
md +=
  "\n## Entry ownership and signature Omen test\n\nSame 100 independent seeds per matchup across variants; 1,200 games per Legend/variant. Entry assembles owned compatible Cards and Omens without granting anything else. Numbered replaces only the signature Omen with a standard of the same size; duplicate equipped definitions are legal in the current engine. Scores give draws half credit. This is a focal-build comparison against unchanged curated opponents, not a new all-numbered meta.\n\n| Legend | Curated score | Entry collection score | Numbered replacement score | Numbered minus curated |\n|---|---:|---:|---:|---:|\n";
for (const l of legends)
  md += `| ${l.name} | ${pct(l.variants.curated.score)} | ${pct(l.variants.entry.score)} | ${pct(l.variants.numbered.score)} | ${((l.variants.numbered.score - l.variants.curated.score) * 100).toFixed(1)} pp |\n`;
md +=
  "\n### Conclusions\n\n- Quetzalcoatl’s current curated Hand underperforms the field; treat it as an outstanding starter tuning issue.\n- Five signatures lose to a plain same-size Omen in this heuristic panel. The largest costs are lost numbered activations and Void frequency. The result also warrants reviewing AI handling of signature Reactions. Do not interpret a “signature” label, rarity, or price as more combat power.\n- The entry Hands can outperform curated examples (especially Leshy). Starter recipes therefore need a Hand-design review, not a blanket buff to paid collectibles. The ownership-only builder is playable and does not sell access to a numerically superior kit.\n- Keep these six signatures in the testing catalog, with transparent face previews. Review Card/Omen synergy and reaction valuation before treating them as finished premium collectibles. No face layouts, combat values or rules were silently changed in this economy pass.\n- Māui averages 6.93 rounds against a seven-round cap, indicating a stall-heavy starter. Review its defensive efficiency and damage opportunities. First Light (0.80 uses/match), Windstep (0.21), and Gale Cut (0.38) deserve a low-usage review despite high raw eligibility; legal activation alone is not attractive play.\n- Human playtests still need to assess clarity, holding decisions, satisfaction of special faces and match pacing. AI throughput is not human match duration.\n";
for (const l of legends) {
  md += `\n## ${l.name} · exact starter recipe\n\n`;
  for (const d of l.dice)
    md += `- **${d.name} d${d.size}${d.signature ? " · signature" : ""}**: ${d.faces.join(" / ")}. Void ${pct(d.voidProbability)}; Sigil ${pct(d.sigilProbability)}.\n`;
  md +=
    "\n| Card | Affinity | Timing / requirement | Raw full-roll eligibility | Uses / match |\n|---|---|---|---:|---:|\n";
  for (const c of l.cards)
    md += `| ${c.name} | ${c.affinity} | ${c.timing} · ${c.requirement} | ${pct(c.rawFullRollProbability)} | ${c.usesPerMatch.toFixed(2)} |\n`;
  for (const c of l.cards) md += `\n**${c.name}:** ${c.text}\n`;
}
md +=
  "\n## Economy audit and implemented acquisition\n\n- The opening onboarding grant remains two Legends, sixteen shared Cards and six Omens so a new player can play and experiment. After that, a normal unlock grants one Legend, one Omen, one Card, or one two-Card booster. A Legend is not a Hand Card.\n- Ordinary Legend unlocks no longer grant a four-Card Hand or three Omens. They construct a legal Loadout from current ownership; the curated recipe is shown as a future build goal with separately acquired items.\n- Legends: 800 Coins / 300 Gems, or choices at 5, 15, 30 and 50 completed matches.\n- Signature Omens: 600 Coins / 240 Gems, or choices at 10, 25, 45 and 70 completed matches. Numbered Omens remain 120 Coins regardless of size. Six signatures remain globally equippable.\n- The earned 15-match Legend choice carries an authored signature gift. If that signature is owned, grant one booster. This is not a randomized paid outcome. Ordinary purchases never include an undisclosed random bonus.\n- If all signatures are owned, an Omen milestone grants one booster. If all Legends are owned, a Legend milestone grants the existing 200-Coin alternative. Existing entitlements and already-claimed rewards are preserved.\n- Boosters contain exactly two different Cards and cost 160 Coins (was 100). Earn one on the first win, every 10 completed matches (was 5), each 800 Mastery XP (was 400), and existing free Season Path tiers. Within-rarity unowned preference and 25-Coin duplicate compensation remain. No new paid booster route.\n- Direct Card costs stay 80/120/180/240 Coins. Rarity represents complexity/specialization, not a combat multiplier.\n- Receipt records identify source and exact items. Duplicate/stale unlock actions do not double-charge; typed Season rewards can grant single Legends, Omens or Cards using the same ownership rules. Unlocks do not auto-equip a newly received Omen.\n\n## Economy projections\n\n" +
  economy.method +
  "\n\n| Version | Spending policy | First new signature | All six signatures | All six Legends | Cards at match 50 (median) | Cards at 100 |\n|---|---|---:|---:|---:|---:|---:|\n";
for (const r of economy.rows)
  md += `| ${r.version} | ${r.strategy} | ${r.firstAdditionalOmenMedian} | ${r.allSignaturesMedian} | ${r.allLegendsMedian} | ${r.points[2].cards.median} | ${r.points[3].cards.median} |\n`;
md +=
  "\nThe previous 120-Coin signature price let a saving player complete all signatures by median match 5. The new model moves this to match 24; the no-spend earned route completes them at match 45. This creates collectible milestones without requiring premium spending. Free booster output now leaves more room for discovery: the no-spend median is 46/60 Cards at match 50 instead of 54/60. Booster-focused players still approach a complete alpha pool by 100 matches. That is intentional for a small alpha: long-term progression should come from new content and prestige, rather than making core competitive tools prohibitively scarce.\n\nAt three matches per day, the guarantee of all six Legends at 50 matches is about 17 play-days; all signatures by 45 matches with the authored gift is about 15. These are pacing assumptions, not observed retention. Do not assign real currency exchange rates from this projection alone.\n\n## Delivery boundaries\n\nThis remains the explicitly local alpha profile/economy service. Real-money checkout and account-backed purchase entitlements are not connected. Before accepting payments, move claims and purchases into authenticated server transactions with verified receipts; never trust a client wallet or match count. Existing server match rules and content catalogs are unchanged.\n\nReproduce: `node --import tsx scripts/balance-campaign.ts --label=starter-economy-20260908 --per-matchup=4000 --seed=920000`, `node --import tsx scripts/starter-access-panel.ts`, `node --import tsx scripts/audit-economy.ts`, then `node --import tsx scripts/report-starter-economy.ts`. The campaign archive freezes the pre-audit code used by the before-economy model.\n";
writeFileSync("docs/STARTER_ECONOMY_AUDIT.md", md);
console.log(
  `Report: ${base.games + access.games} games; ${data.seatMismatches} mismatches`,
);
