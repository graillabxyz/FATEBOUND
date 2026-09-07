# Verification record — 2026-09-07

## Current release: mechanical version 4

116 tests pass, including all opening slot combinations for either winner, fixed A → B order, owner-turn counters independent of Round, restricted-roll API rejection, held-resource expiry, probability-based AI choices, exact pending-choice snapshots, opening telemetry, all 36 matchups and deterministic replays. TypeScript, Vercel Node ESM smoke tests, production release exclusion gate, player/metrics/internal builds and Edge compilation pass. The battle polish was played through in the browser at 393 × 852 and 360 × 740, with a further 360 × 667 scrolling-layout check. Opening selection, Focus Flip, Action reveal, a Held Omen Barkskin Reaction, damage, match completion, post-match emotes and mute all worked. Profile emote remove/re-equip and settings persistence after reload were checked. No browser console errors were reported. No new native-device pass was performed.

`reports/balance-v4.json`: 1,000 Normal AI/starter games, 500 seat/RNG-stream reversal pairs, zero mismatches, 498 wins per seat and four draws. Opening Initiative won 62.45% of decisive games; Wilson 95% interval 58.12–66.59%, 498 independent decisive seeds. Mean match length was 3.226 rounds. This significant opening advantage is flagged. The policy seldom held opening resources and used no Reactions in global Turns 1–2; this limits human-balance interpretation. The complete report includes owner first/second-turn damage and opening combinations.

The catalog migration preserves all 104 collectible IDs and ownership while advancing to mechanical version 4. Version 1–3 saved matches/replays are rejected instead of being reinterpreted under different turn-order rules.

## Historical release: mechanical version 2

86 tests pass across engine/service, turn edge cases, Dev Lab, metrics API, profile and dice geometry. Coverage includes all 36 Legend matchups, deterministic replay, alternating initiative, configurable dice ramp, owner-turn resource expiration, reusable private cards, atomic costs, one reaction window, Guard/redirect/counter/disruption ordering, malformed checkpoint rejection and exact mid-effect snapshot restoration. TypeScript, formatting, player release exclusion checks and internal client/Worker builds pass.

`reports/balance-v2.json` contains 1,000 AI matches with 500 reversed-seat/RNG-stream pairs and zero mismatches. Seats win 499 each with two draws; average length is 4.39 rounds. Opening initiative wins 43.89% of decisive games (95% Wilson interval 39.60–48.27%, 499 independent decisive seeds). This is a detected balance problem, not evidence of 50% balance. Real-time human match duration remains unmeasured.

At 393 × 852, the new battle was exercised through action declaration, resource spending, permanent card reveal, alternating initiative and dice ramp. In the Lab, switching to normal Player B view preserved hidden opponent cards. Web Turn consumed Anansi's held 6, revealed the card, and stepped through the production resolver: Anansi gained 2 passive Guard, Crush redirected, and Basajaun lost 4 HP (20 → 16); Anansi remained at 18 HP. Preset assignments survive opening the battle. Native shells are synchronized from the player build; native compilation/device limits below still apply.

## Historical version-one verification

The following records describe the superseded simultaneous-round engine and are retained as history only.

## Rules and data

30 Vitest tests pass. Coverage includes all six Legends and 72 concise cards, legal default loadouts, face/opposite invariants, custom-die budget tradeoffs, uniform normalized mapping for every size, deterministic seeds, Control costs and bounds, ownership and slot validation, hidden player projections, reusable revealed-card memory, multi-die validation, Leshy's once-per-round adaptation, Guard and expiry, simultaneous lethal, deterministic ties, assignment swaps and fizzling, non-cheating AI, complete matches and replay reconstruction, reversed seats, safe timeouts, command idempotency/stale-round protection, reconnect, reward/pass idempotency, quest refresh, same-priority manipulation regression, stored strength, attainable card requirements, preserved peak rank, cosmetic reward duplicates, and quest replacement/claim validation.

TypeScript checking, production build, formatting, and Capacitor sync pass. The production dependency audit reports zero vulnerabilities.

## Simulation

`reports/balance.json`: 1,200 games; paired seeds with seats reversed; default loadouts including mirrors; Normal AI. Zero seating mismatches. Seat wins 423 / 423, draws 354, mean 4.34 rounds. Basajaun, Anansi, Tengu, Leshy, Quetzalcoatl and Māui all complete matches. Mirror matches deliberately use identical deterministic policies; a high mirror draw rate is expected. No claim of human balance or a measured real-time match-duration average.

The broad run found a seating-dependent manipulation bug. Resolution now snapshots both players' assignments at each priority so a swap cannot retroactively cancel an equal-priority action. A focused regression asserts identical results when seats reverse.

## Browser playthrough

At 393 × 852:

- Home and fixed five-item navigation render with local artwork and fonts.
- All six Legend portraits, card collection, mechanical dice and cosmetic previews render.
- Basajaun vs Anansi guided practice completed in four rounds (5 HP vs 0 HP).
- Flip changed D12 face 4 → 9 at exactly 2 Control; Shift changed 6 → 7 at 1 Control.
- Tap assignment, actual pointer drag, and selecting two dice for Herensuge succeeded.
- Locked dice retain their manipulated faces before reveal.
- Revealed opponent cards persisted into later rounds, including after a browser reload.
- Resume restored round 3, both HP totals and three known opponent cards.
- Victory granted +120 account XP, +50 Coins, +40 mastery XP and +75 Season XP.
- Build duplication, renaming to “Forest Watch,” replacing a card, and saving succeeded.
- Obsidian cosmetic preview showed no gameplay benefit and correctly disabled an unaffordable mock purchase.
- Free Season Path reward claimed once; premium rewards remained locked.
- No browser console errors or warnings during the completed flow.

The production preview was also checked at 360 × 780. Home and the active loadout fit without horizontal overflow; the custom Heartwood D12 could replace its compatible slot and save. Reduced-motion preferences survived a reload. The final default-size preview and production browser console were clean.

A drag-followed-by-tap test caught suppression of the next independent tap. Pointer click suppression now expires at the end of the drag event.

## Native and release limits

Generated and synced Capacitor Android and iOS (SPM) shells. Portrait declared natively and enforced through the orientation adapter. Native compilation, physical-device frame rate, battery use, screen readers, store packaging, signed production replays, live reconnection, cross-device accounts, and real purchases are not verified here. The host has Xcode 14.2 (older than the Swift 5.9 package requirement); CoreSimulator could not initialize, and the Android SDK is absent. These are explicit next release gates, not functioning online features.

## Dev Lab and metrics extension

The expanded suite passes **59 tests**: 30 foundation engine/service tests, 23 lab/cohort tests and 6 persistent API tests. These exercise the real production resolver and AI, including all-six-Legend stepped/normal equivalence, exact mid-effect snapshot restoration, privacy projections, Fate policies, timer fallback, targeted statuses, Control overrides, metric cohort integrity, private identity checks, CSRF rejection, transaction validation, retry idempotency and both-direction matchup filtering. SQLite tests execute the generated migration and real API SQL against an in-memory database; index selection is checked.

After the resolver refactor, the 1,200-game paired-seat simulation again reports **423 / 423 wins, 354 draws, zero seating mismatches and 4.34 mean rounds**. The production dependency audit reports zero vulnerabilities. Sites-specific build tools are isolated from shipped runtime dependencies.

The new dashboard and Dev Lab were checked by TypeScript, production/internal builds and automated rules/API checks. These checks do not constitute a full visual/browser interaction pass of the new tools. Browser WebMCP discovery was attempted after registration and one reload; the browser exposed no WebMCP tools, so that optional contract remains unverified.

The final release was built with `VITE_ENABLE_DEV_TOOLS=true` deliberately set. Its build-time exclusion check confirms no Dev Lab/dashboard entry modules, inspection markers or simulation worker assets are emitted. Both native projects were then synced from that release. The private internal client and Worker builds and formatting check also pass. Native compilation limits above still apply.
