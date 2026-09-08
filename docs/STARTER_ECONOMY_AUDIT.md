# OMNIPATH starter and economy audit

8 September 2026 · mechanical version 7

Normal production AI, 36 directed starter cohorts × 4,000 games (2,000 independent reversed-seat RNG pairs). Six focal Legends each receive 24,000 games. Mirrors included. Raw win rates count draws in the denominator; score gives draws half credit. Confidence intervals count each reversed pair once. Access panel: 200 games per focal variant/matchup, paired same seeds; change only the focal build. Full-roll requirement probabilities enumerate fixed face layouts, excluding timing, enemy conditions, Focus and passive effects. These measure this heuristic AI and cannot establish human fun or optimal play.

144,000 starter matches + 21,600 access/numbered comparison matches. **0 seat mismatches.** Opening Initiative wins 49.2% of decisive matches (95% interval 48.8%–49.6%).

## Starter results

| Legend       | Games | Win rate | Draw-adjusted score | Rounds | Damage | Ward | Reactions |
| ------------ | ----: | -------: | ------------------: | -----: | -----: | ---: | --------: |
| Basajaun     | 24000 |    54.6% |               55.5% |   6.05 |   15.6 | 20.2 |      5.98 |
| Anansi       | 24000 |    49.1% |               49.4% |   5.23 |    9.4 |  7.0 |      4.05 |
| Tengu        | 24000 |    49.9% |               50.3% |   5.06 |   19.8 | 11.6 |      5.25 |
| Leshy        | 24000 |    54.1% |               54.2% |   4.84 |   19.5 |  7.5 |      3.54 |
| Quetzalcoatl | 24000 |    41.5% |               41.7% |   5.26 |   17.4 | 13.3 |      4.44 |
| Māui         | 24000 |    47.8% |               48.9% |   6.93 |   10.6 | 23.4 |      5.61 |

## All 36 matchups

Draw-adjusted score. Each cell is 4,000 games.

| Focal Legend | Basajaun | Anansi | Tengu | Leshy | Quetzalcoatl |  Māui |
| ------------ | -------: | -----: | ----: | ----: | -----------: | ----: |
| Basajaun     |    49.6% |  44.4% | 69.9% | 43.1% |        68.0% | 57.7% |
| Anansi       |    55.8% |  49.5% | 30.4% | 57.2% |        64.5% | 38.9% |
| Tengu        |    28.6% |  71.4% | 49.5% | 34.2% |        45.5% | 72.9% |
| Leshy        |    57.3% |  43.8% | 67.5% | 48.7% |        65.8% | 42.0% |
| Quetzalcoatl |    29.0% |  35.9% | 56.6% | 37.3% |        49.7% | 41.8% |
| Māui         |    43.2% |  61.8% | 24.9% | 54.0% |        60.9% | 48.6% |

## Entry ownership and signature Omen test

Same 100 independent seeds per matchup across variants; 1,200 games per Legend/variant. Entry assembles owned compatible Cards and Omens without granting anything else. Numbered replaces only the signature Omen with a standard of the same size; duplicate equipped definitions are legal in the current engine. Scores give draws half credit. This is a focal-build comparison against unchanged curated opponents, not a new all-numbered meta.

| Legend       | Curated score | Entry collection score | Numbered replacement score | Numbered minus curated |
| ------------ | ------------: | ---------------------: | -------------------------: | ---------------------: |
| Basajaun     |         55.8% |                  55.8% |                      71.8% |                15.9 pp |
| Anansi       |         50.2% |                  50.2% |                      72.3% |                22.1 pp |
| Tengu        |         46.7% |                  57.9% |                      59.9% |                13.2 pp |
| Leshy        |         57.1% |                  78.5% |                      66.8% |                 9.7 pp |
| Quetzalcoatl |         39.5% |                  34.8% |                      51.8% |                12.3 pp |
| Māui         |         49.1% |                  52.4% |                      48.8% |                -0.3 pp |

### Conclusions

- Quetzalcoatl’s current curated Hand underperforms the field; treat it as an outstanding starter tuning issue.
- Five signatures lose to a plain same-size Omen in this heuristic panel. The largest costs are lost numbered activations and Void frequency. The result also warrants reviewing AI handling of signature Reactions. Do not interpret a “signature” label, rarity, or price as more combat power.
- The entry Hands can outperform curated examples (especially Leshy). Starter recipes therefore need a Hand-design review, not a blanket buff to paid collectibles. The ownership-only builder is playable and does not sell access to a numerically superior kit.
- Keep these six signatures in the testing catalog, with transparent face previews. Review Card/Omen synergy and reaction valuation before treating them as finished premium collectibles. No face layouts, combat values or rules were silently changed in this economy pass.
- Māui averages 6.93 rounds against a seven-round cap, indicating a stall-heavy starter. Review its defensive efficiency and damage opportunities. First Light (0.80 uses/match), Windstep (0.21), and Gale Cut (0.38) deserve a low-usage review despite high raw eligibility; legal activation alone is not attractive play.
- Human playtests still need to assess clarity, holding decisions, satisfaction of special faces and match pacing. AI throughput is not human match duration.

## Basajaun · exact starter recipe

- **Old Root d12**: Value 1 / Value 2 / Value 3 / Value 4 / Value 5 / Value 6 / Value 7 / Value 8 / Value 9 / Value 10 / Value 11 / Value 12. Void 0.0%; Sigil 0.0%.
- **Mountain Wind d8**: Value 1 / Value 2 / Value 3 / Value 4 / Value 5 / Value 6 / Value 7 / Value 8. Void 0.0%; Sigil 0.0%.
- **Warden’s Oath d6 · signature**: Void / Value 2 / Value 3 / Value 4 / Void / Ward Sigil. Void 33.3%; Sigil 16.7%.

| Card         | Affinity                    | Timing / requirement | Raw full-roll eligibility | Uses / match |
| ------------ | --------------------------- | -------------------- | ------------------------: | -----------: |
| Sun Lance    | Might OR Spirit             | ACTION · Value 6+    |                     74.0% |         7.52 |
| Root Ward    | Wild OR Spirit              | REACTION · Value 1–3 |                     68.8% |         2.09 |
| Moss Mantle  | (Wild AND Spirit) OR Shadow | REACTION · Value 1–3 |                     68.8% |         2.12 |
| Quick Strike | Unbound                     | ACTION · Value 1–3   |                     68.8% |         0.36 |

**Sun Lance:** Deal 4 damage.

**Root Ward:** Gain 3 Ward.

**Moss Mantle:** Gain 2 Ward and heal 1 Life.

**Quick Strike:** Deal 2 damage.

## Anansi · exact starter recipe

- **Spider’s Gambit d8 · signature**: Value 1 / Value 2 / Void / Value 4 / Value 5 / Shift Sigil / Void / Value 8. Void 25.0%; Sigil 12.5%.
- **Iron Path d6**: Value 1 / Value 2 / Value 3 / Value 4 / Value 5 / Value 6. Void 0.0%; Sigil 0.0%.
- **Silent Step d4**: Value 1 / Value 2 / Value 3 / Value 4. Void 0.0%; Sigil 0.0%.

| Card           | Affinity        | Timing / requirement       | Raw full-roll eligibility | Uses / match |
| -------------- | --------------- | -------------------------- | ------------------------: | -----------: |
| Silken Cut     | Unbound         | ACTION · Value 5+          |                     50.0% |         1.60 |
| Daring Feint   | Guile OR Might  | ACTION · Value 3–5         |                     81.3% |         5.37 |
| Web Turn       | Guile OR Wisdom | REACTION · Value exactly 6 |                     16.7% |         1.71 |
| Hidden Meaning | Unbound         | REACTION · Any Omen face   |                    100.0% |         1.23 |

**Silken Cut:** Deal 3 damage.

**Daring Feint:** Deal 2 damage. If another Omen is unused, deal 1 more.

**Web Turn:** Redirect the declared enemy action back to its user.

**Hidden Meaning:** Gain 1 Ward. If this attack then damages your Life, deal 1 damage back.

## Tengu · exact starter recipe

- **Mountain Precision d6 · signature**: Value 1 / Value 2 / Value 3 / Value 5 / Value 5 / Redirect Sigil. Void 0.0%; Sigil 16.7%.
- **Mountain Wind d8**: Value 1 / Value 2 / Value 3 / Value 4 / Value 5 / Value 6 / Value 7 / Value 8. Void 0.0%; Sigil 0.0%.
- **Iron Path d6**: Value 1 / Value 2 / Value 3 / Value 4 / Value 5 / Value 6. Void 0.0%; Sigil 0.0%.

| Card            | Affinity         | Timing / requirement                     | Raw full-roll eligibility | Uses / match |
| --------------- | ---------------- | ---------------------------------------- | ------------------------: | -----------: |
| Gale Cut        | Might OR Wisdom  | ACTION · Value 4–6                       |                     79.2% |         0.38 |
| Perfect Riposte | Wisdom OR Order  | REACTION · Value 4–6 · Against an attack |                     79.2% |         4.61 |
| Precision Cut   | Might AND Wisdom | ACTION · Value exactly 5                 |                     51.4% |         2.06 |
| Quick Strike    | Unbound          | ACTION · Value 1–3                       |                     84.4% |         2.09 |

**Gale Cut:** Deal 3 damage.

**Perfect Riposte:** Against an attack: gain 2 Ward and deal 2 damage before it resolves.

**Precision Cut:** Deal 3 damage; ignore 1 Ward.

**Quick Strike:** Deal 2 damage.

## Leshy · exact starter recipe

- **Shifting Bark d8 · signature**: Void / Value 2 / Value 3 / Value 4 / Value 5 / Value 6 / Void / Value 8. Void 25.0%; Sigil 0.0%.
- **Mountain Wind d8**: Value 1 / Value 2 / Value 3 / Value 4 / Value 5 / Value 6 / Value 7 / Value 8. Void 0.0%; Sigil 0.0%.
- **Iron Path d6**: Value 1 / Value 2 / Value 3 / Value 4 / Value 5 / Value 6. Void 0.0%; Sigil 0.0%.

| Card        | Affinity                    | Timing / requirement   | Raw full-roll eligibility | Uses / match |
| ----------- | --------------------------- | ---------------------- | ------------------------: | -----------: |
| Branch Lash | Wild                        | ACTION · Value 6–8     |                     60.9% |         4.90 |
| Moss Mantle | (Wild AND Spirit) OR Shadow | REACTION · Value 1–3   |                     76.6% |         3.10 |
| Wolf Shape  | Wild OR Shadow              | ACTION · Value 7+      |                     34.4% |         2.78 |
| Windstep    | Unbound                     | ACTION · Any Omen face |                    100.0% |         0.21 |

**Branch Lash:** Deal 4 damage.

**Moss Mantle:** Gain 2 Ward and heal 1 Life.

**Wolf Shape:** Deal 3 damage. If you were behind in Life, deal 2 more.

**Windstep:** Gain 1 Ward. Empower your next damage effect by 1. Expires at the end of your next turn.

## Quetzalcoatl · exact starter recipe

- **Dawn Coil d10 · signature**: Void / Value 2 / Value 3 / Value 4 / Value 5 / Value 6 / Value 7 / Value 8 / Void / Ward Sigil. Void 20.0%; Sigil 10.0%.
- **Mountain Wind d8**: Value 1 / Value 2 / Value 3 / Value 4 / Value 5 / Value 6 / Value 7 / Value 8. Void 0.0%; Sigil 0.0%.
- **Iron Path d6**: Value 1 / Value 2 / Value 3 / Value 4 / Value 5 / Value 6. Void 0.0%; Sigil 0.0%.

| Card         | Affinity         | Timing / requirement | Raw full-roll eligibility | Uses / match |
| ------------ | ---------------- | -------------------- | ------------------------: | -----------: |
| Sun Lance    | Might OR Spirit  | ACTION · Value 6+    |                     63.5% |         6.44 |
| Root Ward    | Wild OR Spirit   | REACTION · Value 1–3 |                     75.0% |         3.42 |
| First Light  | Spirit OR Wisdom | ACTION · Value 2–5   |                     90.0% |         0.80 |
| Quick Strike | Unbound          | ACTION · Value 1–3   |                     75.0% |         0.65 |

**Sun Lance:** Deal 4 damage.

**Root Ward:** Gain 3 Ward.

**First Light:** Heal 1 Life. Empower your next damage effect by 2. Expires at the end of your next turn.

**Quick Strike:** Deal 2 damage.

## Māui · exact starter recipe

- **Voyager’s Knot d10 · signature**: Value 1 / Value 2 / Value 3 / Value 4 / Value 5 / Value 6 / Value 7 / Value 8 / Value 4 / Value 5. Void 0.0%; Sigil 0.0%.
- **Mountain Wind d8**: Value 1 / Value 2 / Value 3 / Value 4 / Value 5 / Value 6 / Value 7 / Value 8. Void 0.0%; Sigil 0.0%.
- **Iron Path d6**: Value 1 / Value 2 / Value 3 / Value 4 / Value 5 / Value 6. Void 0.0%; Sigil 0.0%.

| Card         | Affinity        | Timing / requirement | Raw full-roll eligibility | Uses / match |
| ------------ | --------------- | -------------------- | ------------------------: | -----------: |
| Silken Cut   | Unbound         | ACTION · Value 5+    |                     83.3% |         2.75 |
| Root Ward    | Wild OR Spirit  | REACTION · Value 1–3 |                     78.1% |         2.09 |
| Daring Feint | Guile OR Might  | ACTION · Value 3–5   |                     84.4% |         2.14 |
| Turnabout    | Guile OR Shadow | REACTION · Value 3–5 |                     84.4% |         1.11 |

**Silken Cut:** Deal 3 damage.

**Root Ward:** Gain 3 Ward.

**Daring Feint:** Deal 2 damage. If another Omen is unused, deal 1 more.

**Turnabout:** Gain 2 Ward. If you were behind in Life and this attack damages your Life, deal 3 damage back.

## Economy audit and implemented acquisition

- The opening onboarding grant remains two Legends, sixteen shared Cards and six Omens so a new player can play and experiment. After that, a normal unlock grants one Legend, one Omen, one Card, or one two-Card booster. A Legend is not a Hand Card.
- Ordinary Legend unlocks no longer grant a four-Card Hand or three Omens. They construct a legal Loadout from current ownership; the curated recipe is shown as a future build goal with separately acquired items.
- Legends: 800 Coins / 300 Gems, or choices at 5, 15, 30 and 50 completed matches.
- Signature Omens: 600 Coins / 240 Gems, or choices at 10, 25, 45 and 70 completed matches. Numbered Omens remain 120 Coins regardless of size. Six signatures remain globally equippable.
- The earned 15-match Legend choice carries an authored signature gift. If that signature is owned, grant one booster. This is not a randomized paid outcome. Ordinary purchases never include an undisclosed random bonus.
- If all signatures are owned, an Omen milestone grants one booster. If all Legends are owned, a Legend milestone grants the existing 200-Coin alternative. Existing entitlements and already-claimed rewards are preserved.
- Boosters contain exactly two different Cards and cost 160 Coins (was 100). Earn one on the first win, every 10 completed matches (was 5), each 800 Mastery XP (was 400), and existing free Season Path tiers. Within-rarity unowned preference and 25-Coin duplicate compensation remain. No new paid booster route.
- Direct Card costs stay 80/120/180/240 Coins. Rarity represents complexity/specialization, not a combat multiplier.
- Receipt records identify source and exact items. Duplicate/stale unlock actions do not double-charge; typed Season rewards can grant single Legends, Omens or Cards using the same ownership rules. Unlocks do not auto-equip a newly received Omen.

## Economy projections

Economic projections, not combat or usage data. 128 synthetic profiles per policy, 100 matches each, matched seeded 50% win probability. Three matches per day. Claim available free Journey and Season rewards plus activity-only quests. Open earned boosters immediately; no money spent. Save-collectibles prioritizes unowned signature Omens then Legends; boosters-first spends spare Coins on boosters; no-spend retains Coins. 101 means not reached in 100 matches. Before uses frozen pre-audit production profile service; after uses current production service.

| Version | Spending policy   | First new signature | All six signatures | All six Legends | Cards at match 50 (median) | Cards at 100 |
| ------- | ----------------- | ------------------: | -----------------: | --------------: | -------------------------: | -----------: |
| before  | save-collectibles |                   1 |                  5 |              27 |                         54 |           57 |
| before  | boosters-first    |                   5 |                 50 |              50 |                         60 |           60 |
| before  | no-spend          |                   5 |                 50 |              50 |                         54 |           57 |
| after   | save-collectibles |                   8 |                 24 |              33 |                         50 |           55 |
| after   | boosters-first    |                  10 |                 45 |              50 |                         57 |           59 |
| after   | no-spend          |                  10 |                 45 |              50 |                         46 |           54 |

The previous 120-Coin signature price let a saving player complete all signatures by median match 5. The new model moves this to match 24; the no-spend earned route completes them at match 45. This creates collectible milestones without requiring premium spending. Free booster output now leaves more room for discovery: the no-spend median is 46/60 Cards at match 50 instead of 54/60. Booster-focused players still approach a complete alpha pool by 100 matches. That is intentional for a small alpha: long-term progression should come from new content and prestige, rather than making core competitive tools prohibitively scarce.

At three matches per day, the guarantee of all six Legends at 50 matches is about 17 play-days; all signatures by 45 matches with the authored gift is about 15. These are pacing assumptions, not observed retention. Do not assign real currency exchange rates from this projection alone.

## Delivery boundaries

This remains the explicitly local alpha profile/economy service. Real-money checkout and account-backed purchase entitlements are not connected. Before accepting payments, move claims and purchases into authenticated server transactions with verified receipts; never trust a client wallet or match count. Existing server match rules and content catalogs are unchanged.

Reproduce: `node --import tsx scripts/balance-campaign.ts --label=starter-economy-20260908 --per-matchup=4000 --seed=920000`, `node --import tsx scripts/starter-access-panel.ts`, `node --import tsx scripts/audit-economy.ts`, then `node --import tsx scripts/report-starter-economy.ts`. The campaign archive freezes the pre-audit code used by the before-economy model.
