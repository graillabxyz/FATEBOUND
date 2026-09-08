import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  LocalProfileService,
  freshProfile,
  seasonLevel,
} from "../src/services/profile";

import { LEGENDS } from "../src/content/legends";
import { OMENS } from "../src/content/omens";
import { CARDS } from "../src/content/cards";
import { STARTERS } from "../src/content/loadouts";
import { LEGEND_JOURNEY } from "../src/content/legend-progression";
import {
  OMEN_JOURNEY,
  availableOmenMilestones,
  omenPrice,
} from "../src/content/collection-progression";
import { PACK_CONFIG, PROGRESSION_PACKS } from "../src/content/acquisition";
import { createMatch, projectMatch } from "../src/engine/match";
import { randomSource } from "../src/engine/fate";
const frozen = resolve("work/campaigns/starter-economy-20260908");
if (!existsSync(`${frozen}/src/services/profile.ts`)) {
  mkdirSync(frozen, { recursive: true });
  execFileSync("tar", [
    "-xzf",
    "reports/campaign/starter-economy-20260908/engine-content.tar.gz",
    "-C",
    frozen,
  ]);
}
const before = await import(
  pathToFileURL(`${frozen}/src/services/profile.ts`).href
);
const state = createMatch(123, [STARTERS.basajaun, STARTERS.anansi]);
state.phase = "MATCH_END";
state.winner = 0;
const view = projectMatch(state);
const signatures = OMENS.filter((o) => o.tags.includes("signature"));
const rows: any[] = [];
for (const version of ["before", "after"])
  for (const strategy of ["save-collectibles", "boosters-first", "no-spend"]) {
    const runs: any[] = [];
    for (let trial = 0; trial < 128; trial++) {
      const values = new Map<string, string>(),
        storage = {
          getItem: (k: string) => values.get(k) ?? null,
          setItem: (k: string, v: string) => {
            values.set(k, v);
          },
          removeItem: (k: string) => {
            values.delete(k);
          },
        };
      const svc: any =
        version === "before"
          ? new before.LocalProfileService(storage)
          : new LocalProfileService(storage);
      let p: any =
        version === "before" ? before.freshProfile() : freshProfile();
      svc.save(p);
      const rng = randomSource(500000 + trial),
        points: any[] = [];
      let allLegends: number | null = null,
        allSignatures: number | null = null,
        firstAdditionalOmen: number | null = null;
      for (let match = 1; match <= 100; match++) {
        p = svc.claimMatch(
          p,
          { ...view, id: `economy-model-${trial}-${match}`, winner: rng() % 2 },
          "Training",
          Date.UTC(2026, 8, 8) + Math.floor((match - 1) / 3) * 86400000,
        );
        // Activity-only quests: no invented combat achievements or Ward/Focus events.
        for (const q of [
          "daily-play",
          "weekly-play",
          "weekly-win",
          "season-mastery",
        ])
          p = svc.claimQuest(
            p,
            q,
            Date.UTC(2026, 8, 8) + Math.floor((match - 1) / 3) * 86400000,
          );
        for (let level = 1; level <= Math.min(50, seasonLevel(p)); level++)
          p = svc.claimPass(p, level, "free");
        for (const m of LEGEND_JOURNEY.milestones)
          if (match >= m && !p.legendJourneyClaims.includes(m))
            p = svc.claimLegendMilestone(
              p,
              m,
              LEGENDS.find((l) => !p.ownedLegends.includes(l.id))?.id,
            );
        if (version === "after")
          for (const m of availableOmenMilestones(p))
            p = svc.claimOmenMilestone(
              p,
              m,
              signatures.find((o) => !p.ownedOmens.includes(o.id))?.id,
            );
        if (strategy === "save-collectibles") {
          const omen = signatures.find((o) => !p.ownedOmens.includes(o.id));
          const price =
            version === "before" ? 120 : omen ? omenPrice(omen.id) : 0;
          if (omen && p.coins >= price) p = svc.purchaseOmen(p, omen.id);
          else if (!omen) {
            const l = LEGENDS.find((l) => !p.ownedLegends.includes(l.id));
            if (l && p.coins >= 800) p = svc.unlockLegend(p, l.id);
          }
        }
        while (
          p.packs > 0 ||
          (strategy === "boosters-first" &&
            p.coins >= (version === "before" ? 100 : PACK_CONFIG.price))
        ) {
          p = svc.openPack(p, rng());
          p = svc.revealPack(p, p.pendingPack.id);
          p = svc.revealPack(p, p.pendingPack.id);
          p = svc.finishPack(p, p.pendingPack.id);
        }
        if (!allLegends && p.ownedLegends.length === 6) allLegends = match;
        if (
          !allSignatures &&
          signatures.every((o) => p.ownedOmens.includes(o.id))
        )
          allSignatures = match;
        if (
          !firstAdditionalOmen &&
          signatures.filter((o) => p.ownedOmens.includes(o.id)).length > 2
        )
          firstAdditionalOmen = match;
        if ([10, 25, 50, 100].includes(match))
          points.push({
            match,
            coins: p.coins,
            cards: p.ownedCards.length,
            legends: p.ownedLegends.length,
            signatures: signatures.filter((o) => p.ownedOmens.includes(o.id))
              .length,
            packsOpened: p.packSequence,
            gems: p.gems,
          });
      }
      runs.push({ points, allLegends, allSignatures, firstAdditionalOmen });
    }
    const quant = (a: number[], q: number) =>
      [...a].sort((x, y) => x - y)[Math.floor((a.length - 1) * q)];
    rows.push({
      version,
      strategy,
      profiles: runs.length,
      allLegendsMedian: quant(
        runs.map((r) => r.allLegends ?? 101),
        0.5,
      ),
      allSignaturesMedian: quant(
        runs.map((r) => r.allSignatures ?? 101),
        0.5,
      ),
      firstAdditionalOmenMedian: quant(
        runs.map((r) => r.firstAdditionalOmen ?? 101),
        0.5,
      ),
      points: [10, 25, 50, 100].map((match) => {
        const ps = runs.flatMap((r) =>
          r.points.filter((p: any) => p.match === match),
        );
        return {
          match,
          ...Object.fromEntries(
            [
              "coins",
              "cards",
              "legends",
              "signatures",
              "packsOpened",
              "gems",
            ].map((k) => [
              k,
              {
                median: quant(
                  ps.map((p) => p[k]),
                  0.5,
                ),
                p10: quant(
                  ps.map((p) => p[k]),
                  0.1,
                ),
                p90: quant(
                  ps.map((p) => p[k]),
                  0.9,
                ),
              },
            ]),
          ),
        };
      }),
    });
    console.log(`${version} ${strategy} economy model complete`);
  }
const data = {
  date: "2026-09-08",
  method:
    "Economic projections, not combat or usage data. 128 synthetic profiles per policy, 100 matches each, matched seeded 50% win probability. Three matches per day. Claim available free Journey and Season rewards plus activity-only quests. Open earned boosters immediately; no money spent. Save-collectibles prioritizes unowned signature Omens then Legends; boosters-first spends spare Coins on boosters; no-spend retains Coins. 101 means not reached in 100 matches. Before uses frozen pre-audit production profile service; after uses current production service.",
  rows,
  prices: {
    before: {
      legend: 800,
      signatureOmen: 120,
      booster: 100,
      packEveryMatches: 5,
      masteryPackXp: 400,
    },
    after: {
      legend: 800,
      signatureOmen: OMEN_JOURNEY.signatureCoins,
      numberedOmen: 120,
      booster: PACK_CONFIG.price,
      packEveryMatches: PROGRESSION_PACKS.matchesEvery,
      masteryPackXp: PROGRESSION_PACKS.masteryEvery,
    },
  },
  catalog: {
    legends: LEGENDS.length,
    cards: CARDS.length,
    signatureOmens: signatures.length,
  },
};
mkdirSync("reports/economy", { recursive: true });
writeFileSync("reports/economy/20260908.json", JSON.stringify(data, null, 2));
console.log("Economy projections complete.");
