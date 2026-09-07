import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { CARDS } from "../src/content/cards";
import { LEGENDS } from "../src/content/legends";
import { affinityText, cardCompatible } from "../src/content/affinities";
import { cardRuleDetails } from "../src/content/card-rules";
const sum = (rows: any[], key: string) =>
  rows.reduce((n, r) => n + (r[key] ?? 0), 0);
const ci = (wins: number, n: number) => {
  if (!n) return [0, 1];
  const p = wins / n,
    z = 1.96,
    d = 1 + (z * z) / n,
    c = (p + (z * z) / (2 * n)) / d,
    h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [c - h, c + h];
};
const passes = ["baseline", "adjusted", "custom", "release-starters"]
  .filter((l) => existsSync(`reports/campaign/${l}/summary.json`))
  .map((label) => {
    const s = JSON.parse(
        readFileSync(`reports/campaign/${label}/summary.json`, "utf8"),
      ),
      r = s.rows,
      draws = sum(r, "draws"),
      decisive = s.games - draws,
      iw = sum(r, "initiativeWins");
    return {
      label,
      games: s.games,
      version: r[0].version,
      mismatches: s.mismatches,
      draws,
      initiativeWinRate: iw / decisive,
      initiativeCI: ci(iw / 2, decisive / 2),
      averageRounds: sum(r, "rounds") / s.games,
      heldPerTurn: sum(r, "held") / sum(r, "turns"),
      reactionsPerGame: sum(r, "reactions") / s.games,
      expiredPerTurn: sum(r, "expired") / sum(r, "turns"),
      legends: LEGENDS.map((l) => {
        const q = r.filter((x: any) => x.legend === l.id),
          games = sum(q, "games"),
          wins = sum(q, "wins"),
          draws = sum(q, "draws");
        return {
          id: l.id,
          name: l.name,
          games,
          wins,
          draws,
          winRate: wins / games,
          ci: ci(wins / 2, games / 2),
          damage: sum(q, "damage") / games,
          ward: sum(q, "ward") / games,
          reactions: sum(q, "reactions") / games,
        };
      }),
      rows: r,
    };
  });
writeFileSync(
  "src/metrics/campaign-results.json",
  JSON.stringify({
    method:
      "144,000 matches per pass: six focal Legends × six opponents × 4,000 games, including mirrors. Seeds paired with reversed seats and RNG streams; each pair counts once in 95% Wilson intervals. Draws excluded only from Initiative win share. Normal heuristic AI; not an optimal-play or human-fun proof. Adjusted changes include rules, content and AI, so differences are not causal estimates for individual changes.",
    passes,
  }),
);
const pct = (n: number) => (n * 100).toFixed(1) + "%";
let md =
  "# OMNIPATH rules and balance audit\n\nMechanical version 6 · 7 September 2026\n\n";
md +=
  "## What the rules mean\n\n- **2 Ward absorbs 2 damage; 5 Ward absorbs 5 damage.** It is consumed before Life. Any remainder expires at the start of its owner’s next turn. A 7-damage hit against 5 Ward removes 5 Ward and 2 Life.\n- **Cards are reusable abilities in a permanent four-Card Hand.** Declaring one reveals it permanently. It resolves through one Reaction window, then remains in the Hand. It never creates a trap, ally or battlefield object in this alpha.\n- **Bramble Trap is now Bramble Counter.** The stable content ID is retained. Spend a Value 2–4 in response to an attack: gain 2 Ward, then return 2 damage only if that attack damages your Life. Fully absorbed damage does not trigger the counter.\n- **Paying two Omens spends both.** A requirement of two Values totaling 11+ accepts 5 + 6 and spends both complete Omens. There is no leftover Value or reuse, including if the Action is canceled. Another unspent Omen can still activate the same Card again.\n- **Opening rolls are 1 / 2 / 3 / 3.** Choose which equipped Omens participate in the restricted opening. Unspent results become Held and remain available through the opponent’s turn, expiring at the start of your own next turn.\n- **Six signature Omens, plus six numbered sizes.** Every starter has exactly one signature and two numbered Omens. Signature Omens are shared collectibles, not Legend-exclusive equipment.\n\n";
md +=
  "## Measured results\n\n" +
  JSON.parse(readFileSync("src/metrics/campaign-results.json", "utf8")).method +
  "\n\n| Pass | Games | Opening Initiative decisive win share (95% CI) | Mean rounds | Reactions per focal player/game | Seat mismatches |\n|---|---:|---|---:|---:|---:|\n";
for (const p of passes)
  md += `| ${p.label} | ${p.games.toLocaleString()} | ${pct(p.initiativeWinRate)} (${p.initiativeCI.map(pct).join("–")}) | ${p.averageRounds.toFixed(2)} | ${p.reactionsPerGame.toFixed(2)} | ${p.mismatches} |\n`;
md +=
  "\nWin rates below include draws in the denominator. Mirror draws therefore lower raw win rate below 50%; they do not indicate a seat advantage.\n\n| Legend | " +
  passes.map((p) => p.label).join(" | ") +
  " |\n|---|" +
  passes.map(() => "---:").join("|") +
  "|\n";
for (const l of LEGENDS)
  md += `| ${l.name} | ${passes.map((p) => pct(p.legends.find((x) => x.id === l.id)!.winRate)).join(" | ")} |\n`;
md +=
  "\n## Implemented corrections\n\nThe final starter validation changes only Basajaun’s curated Hand to Sun Lance, Root Ward, Moss Mantle and Quick Strike. It adds a useful low-Value Action and moves the two-Omen attack to the starter collection for experimentation. The full release-starters pass validates all 36 matchups again. The custom pass intentionally retains the earlier fixed Omens and independently curated Hands.\n\nConditions now evaluate before an ability’s effects change Life or Ward. Life costs are paid at declaration and are not refunded by cancellation. Poison removes Life once at the target’s next turn start. Empowered adds to one damage effect, then is consumed; unused Empowered expires at the end of the owner’s next turn. Counter effects require actual attack damage to Life. Legend active categories are data-driven, and Tengu’s exact-5 passive no longer depends on hidden per-Card metadata.\n\nDaring Feint, Unravel, Ward/counter efficiency, low-Value defense and setup effects were revised. The AI values real Held Reaction opportunities, pays actual costs and models the production passives. Every revision is frozen with its engine/content in the campaign archive. The baseline instrumentation rerun uses the same seeds and is not an additional independent sample.\n\n## Limits and follow-up\n\nThese measurements establish reproducibility and expose imbalance; they do not prove the game is fun. Normal AI remains a heuristic. Custom Hands are curated coverage, not an exhaustive search of all Hands. Review matchup extremes, dead Card use and cancellation-heavy builds before release. Human playtests should measure whether holding a Reaction feels meaningful, whether a failed roll still offers choices, and whether players understand why an effect resolved. Mean rounds are not measured wall-clock human match duration.\n\nThe game UI still uses device-local collection/economy and human-versus-AI matches. The hosted multiplayer authority/catalog is separate; local packs are not secure server purchases. No real-money pack sales are implemented.\n\n## Reproduction\n\nRun `node --import tsx scripts/balance-campaign.ts --label=<new-label> --per-matchup=4000`. Existing labels reuse their frozen source; use a new label for new mechanics. The custom pass additionally uses `--custom=true` and its checked-in custom-hands.json. Run `npm run audit:cards` for all legal Legend/Card pairs and sampled complete Hands. Raw reports include opening Omen choices, damage, Ward, Focus, held/expired results and Card activations.\n";
md +=
  "\n\n## Remaining Card identity and AI issues\n\nCrush and Peak Strike duplicate Sun Lance damage with narrower activation ranges; Falling Leaf overlaps Quick Strike. Mountain Silence is unused in the sampled audit and universal Ward matches its protection at Value 10+. These remain explicit redesign/consolidation flags. The current AI does not adequately price an already-known enemy redirection Reaction before attacking. Custom Hand extremes therefore combine content interactions and policy weaknesses; do not nerf a Legend solely from those rates.\n";
writeFileSync("docs/RULES_AUDIT.md", md);
let cards =
  "# Complete alpha Card rules audit\n\nEvery Card has persistence `none`: resolve its ability; keep the reusable Card in Hand. All requirements and effects below are read from production version 6. Affinity controls equipping, independently from effect tags.\n\n";
for (const c of CARDS)
  cards += `## ${c.collectorNumber}. ${c.name}\n\nID: ${c.id} · ${c.rarity} · ${affinityText(c.affinityRequirements)} · ${c.timing}\n\n**${c.requirementLabel}** — ${c.text}\n\nLegal Legends: ${LEGENDS.filter(
    (l) => cardCompatible(l, c),
  )
    .map((l) => l.name)
    .join(", ")}.\n\n${cardRuleDetails(c)
    .map((x) => "- " + x)
    .join("\n")}\n\nEffects: \`${JSON.stringify(c.effects)}\`\n\n`;
writeFileSync("docs/ALPHA_CARD_AUDIT.md", cards);
