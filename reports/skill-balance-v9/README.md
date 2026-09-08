# OMNIPATH v9: costs, synergy and counterplay

This is an implemented alpha balance pass, not a claim that competitive balance or human enjoyment has been proven. Production Cards, Legend definitions, effects, AI, starter recipes, battle explanations, Dev Lab and metrics use the revised rules.

## The improved brief

Audit all 60 Cards, six Legends and their starter Omens. Establish a frozen production-engine baseline, then test matching seeds and reversed seats, including mirrors. Make routine damage small, price larger effects through Omen commitments or paid setup, and provide useful low-Value, Void, Focus and held-resource decisions. Build six distinct starter directions from the shared Card pool. Compare starter Hands, alternate Hands and a damage-first AI policy. Report stalls and weaknesses rather than silently awarding results or calling the game balanced. Preserve the opening 1/2/3/3 rolls, locked Loadouts, reusable private Hands and owner-turn expiration.

## What changed

- A numbered Omen now converts into **1 Ward**, independent of its Value. Ward Sigils grant 2. Root Ward grants 2 on a low Value; Basajaun’s first-Ward bonus remains +1 once per round. Ward still absorbs damage point for point and expires at the owner's next turn start.
- Routine attacks deal 1; 2 usually requires a narrow Value or condition; 3 requires precision or synergy. Base 4-damage Cards spend two Omens; base 5+ Cards spend all three. Examples: Crush costs two Values totaling 6+ for 4 damage; Herensuge costs three totaling 9+ for 5. Burning Crown costs three totaling 10+ and 1 Life for 6.
- Larger single-activation totals remain possible through **previously paid Empowered**, Legend passives and explicit conditions. Damage bands are a design budget, not a hidden damage cap. Paying two setup Omens and a third attack can legitimately produce a large result.
- Read the Thread reveals the first unknown enemy Card and grants Focus. False Promise removes Ward and only deals damage if the target had Ward. Crooked Bough rewards paying with a modified Omen, and additionally costs 1 Focus. Hidden Meaning turns known information into Focus; it no longer duplicates a broadly superior counterattack.
- Web Turn now costs 1 Focus plus an exact 6. Free repeatable reflection was too efficient; the 2-Focus trial went too far. AI diagnostics now price a publicly known redirect with an eligible held Omen, encouraging cheaper bait and avoiding obvious lethal reflections. Hidden Cards and future rolls remain unavailable to AI.
- Healing, passive sustain and Ward values were reduced alongside damage. Māui no longer repeatedly heals through its basic attack. Life is now Basajaun 14, Anansi 14, Tengu 14, Leshy 13, Quetzalcoatl 14, Māui 16. These remain data-driven prototype numbers.
- No new currencies, board permanents, recursive reaction stack, draw/discard system or round limit. The Omen collection remains six signature Omens plus six numbered sizes; each starter uses one signature and two numbered Omens.

## Six starter directions

| Legend | Direction | Hand |
|---|---|---|
| Basajaun | Prepare Ward, then convert protection into pressure | Fell the Axe, Oakheart, Root Ward, Crush |
| Anansi | Information, Focus denial and selective redirection | Silken Cut, Read the Thread, False Promise, Web Turn |
| Tengu | Low Values, exact totals and committed counters | Falling Leaf, Peak Strike, Watchful Blade, Meditate |
| Leshy | Modify results, convert Voids, apply delayed pressure | Crooked Bough, Hollow Sign, Night Spores, Bramble Counter |
| Quetzalcoatl | Setup, category changes and a third-ability payoff | First Light, Horizon, Dawn Shield, Quick Strike |
| Māui | Keep an Omen held; turn prepared Ward into pressure | Wavebreaker, Oakheart, Bramble Counter, Daring Feint |

Loadout now explains each starter’s sequence and counterplay. Existing owned collections and saved Hands are retained; a balance patch does not grant all newly recommended Cards to established profiles.

## Comparative design research

Foundations' official guide illustrates same-set enabler/payoff pairs: Balmor with spell reuse, Dazzling Angel with Fiendish Panda, and counter-building creatures. The useful principle is that the enabling action should already do something understandable, while the payoff rewards timing or prior investment. These are illustrated synergy examples, not claims about tournament deck performance. [Foundations prerelease guide](https://magic.wizards.com/en/news/feature/foundations-prerelease-guide), [Balmor on Scryfall](https://scryfall.com/card/fdn/237/balmor-battlemage-captain).

For an actual set-contained build, the author’s MH3 GBu 3–0 sealed example uses Cursed Wombat and multiple Expanding Oozes to reward modified creatures. Its URw energy example uses generators and spenders to create choices about when to commit a resource. We adapted the investment/payoff relationship into existing Focus, modified Omens and paid Empowered, without adding an energy system. [Builder’s MH3 sealed examples](https://draftsim.com/mtg-mh3-draft-guide/), [official modified mechanics](https://magic.wizards.com/en/news/feature/modern-horizons-3-mechanics), [Expanding Ooze on Scryfall](https://scryfall.com/card/mh3/184/expanding-ooze).

OMNIPATH always offers all four reusable Cards. Consequently, efficient MTG one-shot removal, prevention, recursion or card advantage cannot be transferred at face value. The core adaptation is to make the player spend current Omens, Focus, Life or a prior setup action—and give the opponent a visible response opportunity.

## Final matched panel

| Measure | Frozen v8 | v9 starters | Alternate Hands |
|---|---:|---:|---:|
| Attempts | 1,260 | 1,260 | 504 |
| Completed | 1,200 | 1,260 | 504 |
| Stalled at 100-round harness watchdog | 60 | 0 | 0 |
| Reversed-seat mismatches | 0 | 0 | 0 |
| Average rounds, completed only | 7.87 | 6.70 | 9.26 |
| Rolls without a main ability before Focus | 2.93% | 0% | 0% |
| Distinct main-ability assignments per roll | 7.23 | 9.03 | 8.54 |
| Utility/hybrid ability share | 53.3% | 62.7% | 69.3% |
| Held / rolled Omens | 51.4% | 37.6% | 40.6% |
| Opening player win rate, completed | 49.5% | 54.3% | 58.7% |
| 90th percentile of each match's largest turn damage | 10 | 7 | 7 |

The main panel has 21 unordered Legend pairs × 30 seeds × two seat copies, including mirrors. Seat/RNG reversal is a determinism check, not another independent sample. Opening-player intervals use 630 unique pairs for the starter panel: approximately **50.4–58.1%**. This remains a warning, not proof of a 50/50 game. Some seeds informed iterative tuning; the last ten per matchup were added to the final panel. This is an exploratory audit, not a preregistered experiment.

The raw dead-roll measure excludes universal Ward and only tests main-action ability availability; it does not measure whether an option is strategically good. The old engine also reached 0% dead rolls after Focus. The improvement is reduced dependence on spending Focus just to do anything, not elimination of RNG. Utility includes hybrid damage/utility Cards. Baseline stall-heavy totals distort per-game averages, so completed-only length is explicitly labeled; the raw JSON retains unfinished attempts.

## Does policy matter?

With the same final seed/Loadout set and legal candidate generator, the focal side won **342/630 (54.3%)** using the tactical policy and **179/630 (28.4%)** after switching to damage-first scoring. **215 outcomes changed.** This supports keeping setup, defense, held resources and response evaluation meaningful in this harness. It is not a measurement of human skill, optimal play, or the fraction of outcomes caused by luck. The focal Legend is the first named Legend of each unordered pair, so policy-by-Legend exposure is uneven.

## Remaining balance flags

| Legend | Starter draw-adjusted score | Alternate-Hand score |
|---|---:|---:|
| Basajaun | 57.1% | 65.5% |
| Anansi | 51.0% | 57.1% |
| Tengu | 50.2% | 52.4% |
| Leshy | 40.5% | 25.0% |
| Quetzalcoatl | 56.4% | 50.0% |
| Māui | 44.8% | 50.0% |

These are recipe results, not intrinsic Legend ratings. Basajaun vs Anansi is still a lopsided counter-match in this panel (Basajaun 7/30 independent seeds). Leshy is too sensitive to its Focus budget, particularly the alternative Hand lacking a reliable counter-damage option. Defensive alternative Hands last materially longer. Do not call the starter experience evenly balanced yet. The full-pool run completed 2,650 games and recorded 22 additional stalled attempts across 1,236 Hand/Omen cohorts plus a 200-game starter check. It recorded zero seat mismatches. Its starter check gave Basajaun 21% against Anansi, confirming that counter-match problem. Sanctuary, Ritual and Thread the Path had no sampled activations. The full-pool coverage report separately records those stalled builds; zero stalls in the selected panel does not imply every legal Hand terminates.

The next human playtest should test whether players understand paying for setup, intentionally bait known reactions, and enjoy the low-Value/held decisions. Measure wall-clock length and player frustration; engine rounds alone cannot establish a 3–5 minute or fun experience.

## Reproduce and inspect

- `reports/skill-balance-v9/summary.json`: final metrics, strategies and full Card audit.
- `reports/skill-balance-v9/card-audit.md`: readable review of all 60 costs/effects.
- `reports/card-pool-v9.json`: every legal Legend/Card evaluation plus sampled complete Hands, activation usage, stalls and flags.
- Metrics website → **Rules audit**: frozen comparison, separate from live usage, with JSON export.
- `npm test`, `npm run typecheck`, `npm run build:vercel`, `npm run build:edge` verify rules and release bundles.

Baseline source is commit `6f4231398a7ea7868cdae1196eeb35ccf5c30461`. Extract its `src` and `server` into `work/skill-balance-v9/baseline`, then run:

```sh
node --import tsx scripts/skill-balance-panel.ts --root=work/skill-balance-v9/baseline --label=v8-baseline --seeds=30 --seed=1000000
node --import tsx scripts/skill-balance-panel.ts --label=release-v9-starters --seeds=30 --seed=1000000
node --import tsx scripts/skill-balance-panel.ts --label=release-v9-custom --seeds=12 --seed=1000000 --custom=true
node --import tsx scripts/skill-balance-panel.ts --label=release-v9-policy --seeds=30 --seed=1000000 --policy=true
node --import tsx scripts/skill-balance-summary.ts
npm run audit:cards -- --pairs=1
```

The full-pool audit enumerates all legal four-Card Hands but simulates representative cohorts, not every possible Hand × Omen × opponent combination. Its one paired seed per cohort is coverage screening, not enough to rank a specific Card competitively.
