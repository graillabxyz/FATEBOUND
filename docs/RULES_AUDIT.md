# OMNIPATH rules and balance audit

Mechanical version 6 · 7 September 2026

## What the rules mean

- **2 Ward absorbs 2 damage; 5 Ward absorbs 5 damage.** It is consumed before Life. Any remainder expires at the start of its owner’s next turn. A 7-damage hit against 5 Ward removes 5 Ward and 2 Life.
- **Cards are reusable abilities in a permanent four-Card Hand.** Declaring one reveals it permanently. It resolves through one Reaction window, then remains in the Hand. It never creates a trap, ally or battlefield object in this alpha.
- **Bramble Trap is now Bramble Counter.** The stable content ID is retained. Spend a Value 2–4 in response to an attack: gain 2 Ward, then return 2 damage only if that attack damages your Life. Fully absorbed damage does not trigger the counter.
- **Paying two Omens spends both.** A requirement of two Values totaling 11+ accepts 5 + 6 and spends both complete Omens. There is no leftover Value or reuse, including if the Action is canceled. Another unspent Omen can still activate the same Card again.
- **Opening rolls are 1 / 2 / 3 / 3.** Choose which equipped Omens participate in the restricted opening. Unspent results become Held and remain available through the opponent’s turn, expiring at the start of your own next turn.
- **Six signature Omens, plus six numbered sizes.** Every starter has exactly one signature and two numbered Omens. Signature Omens are shared collectibles, not Legend-exclusive equipment.

## Measured results

144,000 matches per pass: six focal Legends × six opponents × 4,000 games, including mirrors. Seeds paired with reversed seats and RNG streams; each pair counts once in 95% Wilson intervals. Draws excluded only from Initiative win share. Normal heuristic AI; not an optimal-play or human-fun proof. Adjusted changes include rules, content and AI, so differences are not causal estimates for individual changes.

| Pass             |   Games | Opening Initiative decisive win share (95% CI) | Mean rounds | Reactions per focal player/game | Seat mismatches |
| ---------------- | ------: | ---------------------------------------------- | ----------: | ------------------------------: | --------------: |
| baseline         | 144,000 | 56.1% (55.7%–56.4%)                            |        3.32 |                            1.24 |               0 |
| adjusted         | 144,000 | 50.4% (50.0%–50.8%)                            |        5.44 |                            4.48 |               0 |
| custom           | 144,000 | 51.8% (51.4%–52.1%)                            |        5.42 |                            4.18 |               0 |
| release-starters | 144,000 | 49.1% (48.7%–49.4%)                            |        5.56 |                            4.81 |               0 |

Win rates below include draws in the denominator. Mirror draws therefore lower raw win rate below 50%; they do not indicate a seat advantage.

| Legend       | baseline | adjusted | custom | release-starters |
| ------------ | -------: | -------: | -----: | ---------------: |
| Basajaun     |    52.5% |    45.9% |  61.3% |            55.3% |
| Anansi       |    51.1% |    53.4% |  27.1% |            48.5% |
| Tengu        |    15.0% |    52.0% |  51.6% |            50.1% |
| Leshy        |    46.4% |    52.7% |  46.2% |            53.6% |
| Quetzalcoatl |    53.3% |    40.5% |  34.2% |            41.6% |
| Māui         |    78.8% |    51.6% |  77.4% |            47.9% |

## Implemented corrections

The final starter validation changes only Basajaun’s curated Hand to Sun Lance, Root Ward, Moss Mantle and Quick Strike. It adds a useful low-Value Action and moves the two-Omen attack to the starter collection for experimentation. The full release-starters pass validates all 36 matchups again. The custom pass intentionally retains the earlier fixed Omens and independently curated Hands.

Conditions now evaluate before an ability’s effects change Life or Ward. Life costs are paid at declaration and are not refunded by cancellation. Poison removes Life once at the target’s next turn start. Empowered adds to one damage effect, then is consumed; unused Empowered expires at the end of the owner’s next turn. Counter effects require actual attack damage to Life. Legend active categories are data-driven, and Tengu’s exact-5 passive no longer depends on hidden per-Card metadata.

Daring Feint, Unravel, Ward/counter efficiency, low-Value defense and setup effects were revised. The AI values real Held Reaction opportunities, pays actual costs and models the production passives. Every revision is frozen with its engine/content in the campaign archive. The baseline instrumentation rerun uses the same seeds and is not an additional independent sample.

## Limits and follow-up

These measurements establish reproducibility and expose imbalance; they do not prove the game is fun. Normal AI remains a heuristic. Custom Hands are curated coverage, not an exhaustive search of all Hands. Review matchup extremes, dead Card use and cancellation-heavy builds before release. Human playtests should measure whether holding a Reaction feels meaningful, whether a failed roll still offers choices, and whether players understand why an effect resolved. Mean rounds are not measured wall-clock human match duration.

The game UI still uses device-local collection/economy and human-versus-AI matches. The hosted multiplayer authority/catalog is separate; local packs are not secure server purchases. No real-money pack sales are implemented.

## Reproduction

Run `node --import tsx scripts/balance-campaign.ts --label=<new-label> --per-matchup=4000`. Existing labels reuse their frozen source; use a new label for new mechanics. The custom pass additionally uses `--custom=true` and its checked-in custom-hands.json. Run `npm run audit:cards` for all legal Legend/Card pairs and sampled complete Hands. Raw reports include opening Omen choices, damage, Ward, Focus, held/expired results and Card activations.

## Remaining Card identity and AI issues

Crush and Peak Strike duplicate Sun Lance damage with narrower activation ranges; Falling Leaf overlaps Quick Strike. Mountain Silence is unused in the sampled audit and universal Ward matches its protection at Value 10+. These remain explicit redesign/consolidation flags. The current AI does not adequately price an already-known enemy redirection Reaction before attacking. Custom Hand extremes therefore combine content interactions and policy weaknesses; do not nerf a Legend solely from those rates.

## Verification and delivery

145 unit/integration tests pass. Production, internal and Supabase Edge builds pass; the player release gate excludes Dev Lab, metrics and simulation workers from the game bundle. Browser checks cover fresh ownership, legal/incompatible Hand filtering, pack reveal/resume, battle startup, opening Omen choice, failed and successful two-Omen payment, public reveals, held resources, timeout, checkpoint restore, match end and rewards. Metrics workers complete and cancel responsively. Portrait tables scroll within their panels; a 393px viewport has no page overflow.

The Supabase catalog contains 6 enabled Legends, 60 Cards and 12 Omens, all version 6; exactly 2 Legends, 16 Cards and 6 Omens are marked starter content. Its authenticated Edge health reports version 6, and protected routes reject unauthenticated access. RLS advisories are informational for deliberately server-only tables with no client policies; unused indexes are retained for the intended workload.

For an old campaign, extract its `engine-content.tar.gz` into `work/campaigns/<label>/` before running the coordinator with that same label. This restores the exact frozen source rather than substituting the current engine. The custom Hand definitions are in `reports/campaign/custom/custom-hands.json`. Seed pairs are the unit of independence; re-running the same seeds does not create new independent evidence.
