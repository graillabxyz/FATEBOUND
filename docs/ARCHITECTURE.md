# OMNIPATH authoritative combat · mechanical version 7

## Runtime and boundaries

The mobile game is a portrait React/TypeScript client with Capacitor shells. The separate internal metrics website is responsive. All battle decisions, random generation, timing permissions, costs, effects, victory and projections live in pure TypeScript under `src/engine`. The engine has no React, DOM, storage, wall clock or unseeded randomness. Services supply clock values and persistence. Dev Lab orchestrates this same engine and effect iterator.

LocalMatchService is a mock authority for human-vs-AI play. Ranked/casual labels remain local simulations. The Supabase/Vercel multiplayer API now executes this engine on the server; the game UI still uses local AI. Server rewards and matchmaking UI remain future work. Native signing, platform builds and device testing remain release work.

## Locked loadout and content

A match clones one Legend, four distinct compatible reusable cards and three fixed collectible Omens for each player. There is no deck, draw, discard, random hand, universal cooldown or normal mid-match swap command. Content compatibility, Legend class and initiative bonus, passive rules, timings, effects, requirements and Omen utility weights are data-driven. All six supported Omens sizes can be equipped where their tags are compatible. Legend diceSlots describe starter recommendations; allowedDiceSizes and compatibility tags govern restrictions. Omens faces cannot be customized by players.

Cards have ACTION, REACTION or PASSIVE timing. Current activatable content uses ACTION/REACTION; Legend passive rules are triggered by production events. Requirements support numeric ranges, exact totals, parity, Omen count/type, Sigils, equal/different values, Focus, held/unused resources, initiative, class, round bounds and contextual predicates. High values do not satisfy low ranges or exact requirements. Special faces replace numeric faces and authored Voids pay for their utility. Utility weights are estimates, not a universal power ranking.

## Initiative, rounds and turns

MATCH_INTRO → INITIATIVE_ROLL → ROUND_START → TURN_START → DICE_ROLL → MAIN_ACTION.

Each Legend rolls d20 + its data-defined initiativeBonus once. Tied totals compare raw d20, then stable RNG stream index; no reroll. The winner leads every round. Normal turn order remains A → B → A → B; Initiative does not switch or reroll. Each round contains exactly two turns. TURN_END → SECOND_TURN → TURN_START for the other player, then TURN_END → ROUND_END → next ROUND_START.

Each PlayerState tracks playerTurnCount, incremented at owner TURN_START. On owner Turn 1 the opening Initiative winner chooses one equipped Omen, and the other player chooses two. All three roll automatically from owner Turn 2 onward. The round number never determines this allowance. GAME.openingOmenCounts configures the two opening allowances; the old round-ramp configuration is removed.

OMEN_CHOICE is an authoritative decision with a 12-second timeout. Human choices begin unselected. Selected slot indices are validated and recorded in the command replay; phase advance cannot auto-select. AI and timeout fallback compare every eligible slot combination against the own Hand/Legend abilities over the Omens’ fixed face distributions. These are deterministic expected-utility estimates, not optimal-play claims. No seed or hidden opposing Hand enters selection. A timeout selects the roll only and never spends a resource or reveals a Card.

Omens expire specifically at their owner's next TURN_START, then new Omens roll and start-of-turn statuses apply. Unused available Omens become HELD at TURN_END. ROUND_END never clears Omens. The second player’s first-turn resources remain available during the opening winner’s first full three-Omen turn. No mid-match loadout swap is introduced.

Prototype Ward lasts until owner turn start, when old Ward clears with old resources. Both players reset Focus to 2 at ROUND_START; it does not bank. Start poison applies after the new roll and before MAIN_ACTION. Status lifetimes end at the configured round cleanup. Stored power becomes usable in its due round and is consumed by the next damage effect.

## Deterministic random streams

Each seat has a seeded independent stream for its owner's rolls; initiative is separately seeded. The normalized 120-token mapping remains the uniform face sampler for every supported Omen size. Future opponent Omens are not inferred from the active player's roll. No further random choice occurs in resolution. Paired simulations swap loadouts AND RNG stream identities, including opening initiative rolls and the tie fallback.

## Decisions and resolution

A MAIN_ACTION command may pay Focus and declare one action, or pay only Focus, or end the turn. Multiple sequential uses of the same card are legal when separate available Omens pay each cost. SHIFT costs 1 and selects an authored numeric face exactly one value above/below the current result; missing values and boundaries fail. FLIP costs 2 and follows the authored opposite map. Only available unspent resources on the owner's turn may use Focus.

Declaration validates timing, status, ownership, resource availability and requirements atomically, then pays Focus/Omens and permanently reveals the card. ACTION_DECLARED → REACTION_WINDOW. The defender may spend eligible held/available resources on one reaction or universal Ward, or PASS. Universal Ward spends one numbered Omen for floor(value/2); Sigils require explicit guardValue metadata. A reaction has no reaction-time Focus permission in this version.

REACTION_DECLARED or reaction PASS → RESOLUTION. The exact production iterator provides these ordered stages:

1. Reaction prevention, Ward, redirect, cancellation and manipulation (10/20).
2. Revalidate the action's target and paid Omens after manipulation (30). Invalidated actions fizzle visibly; costs remain spent.
3. Resolve action effects, healing and damage (40). Damage clamps at zero, Ward absorbs first, healing clamps to max Life, and effective damage cannot exceed remaining Life.
4. Counterstrike/post-damage effects (50), only after actual incoming attack damage. Lethal does not suppress an already armed counterstrike.
5. Cleanup and victory evaluation (60). Return to MAIN_ACTION if neither side has ended the match.

There is one reaction window per action and no recursive response stack. Redirect exchanges the action's player targets, including beneficial self-target effects; conversion costs still belong to the original caster. A round can contain multiple exchanges. Legend passives are stable actor-local rules. Composite effect frames follow their child frames and show before/after state.

Both zero Life: compare effective damage, then draw. Round cap defaults to seven: Life, then effective damage, then draw. No random match tiebreak.

## Information and client behavior

The authority owns the phase and current actor. Player projections omit seed, RNG configuration, future forced Fate, hidden card IDs and private drafts. Unknown card-scoped statuses also omit their card IDs. Declared cards become permanently known, even when canceled. Omens and held resources are public; intended private reactions are not. Spectators see only revealed cards. Omniscient projections exist only in internal tooling.

Battle renders the authoritative turn/phase, initiative contest/marker, ACTION/REACTION cards, validation messages, available/held/spent/expired resources and public event log. Tap-select Omens, choose an ability, then Activate/React. Ending a turn holds the remainder. Normal main decisions allow 12 seconds; reaction windows allow 5 seconds. Practice disables the main timer, while reactions still auto-pass. Timeout never activates a draft or silently spends defensive resources. Internal timers may be disabled or controlled for debugging.

## Replay, reconnect and lab snapshots

Mechanical version 4 uses a command stream recording round, turn, actor and each paid action/pass. Seed + loadouts + versioned config + commands reproduce all rolls and outcomes. Exporting a live competitive seed is forbidden. Versions 1–3 replays/checkpoints are rejected rather than reinterpreted. Commands require match ID, sequence, round and revision; retries are idempotent, stale decisions fail.

Local versioned checkpoints validate resource/state shape before restoration. Dev snapshots also include setup, precise resource states, AI configuration, reveal memory, forced rolls, logs and a suspended resolver's baseline/cursor. Restoring a suspended resolver replays the same iterator and compares its state before resuming. Manual state edits require a safe rewind while an effect is suspended. Imports are bounded and validated. Local profile, Loadout and snapshot container keys remain compatible; embedded mechanical versions are validated. Version 6 telemetry uses a separate outbox.

## AI, simulations and metrics

AI receives its own state and a production public opponent projection. It enumerates legal single actions/reactions and affordable Focus choices, retaining pass as an option. Its deterministic heuristic exposes damage, defense, healing, lethal risk, prediction, resource preservation, Focus cost and reveal cost. These scores are estimates for tuning, not an optimal-play guarantee.

Simulation uses the same phase loop and actions in a background worker (up to 10,000 matches per run). Paired seeds verify seat equivariance independently of opening-initiative advantage. Turn history records each actor’s owner-turn count, selected slots, effective damage, opening reaction counts and held resources. Life differential is sampled after both players have rolled their first full three-Omen turn, before the second player acts on that turn; early-ended matches are excluded from this sample. Opening metrics group choices by opening role, Legend and collectible IDs and distinguish each player’s own first/second turn.

The dashboard records opening/second-initiative wins, class and Legend outcomes, damage by round, held Omens per turn, reaction frequency/success, unused expiration, card uses, Omen size/loadout correlations and individual Omen outcomes. Repeated uses within a round count separately. Wilson 95% starting-win intervals count a reversed pair once, and flag deviations from 50% after 30 independent decisive seeds. Mixed matchup/AI cohorts are not causal proofs of class or initiative power.

Hosted D1/local SQLite ingestion stores versioned summaries, filters active rules cohorts and separates actual internal human-vs-AI play, simulation and forced lab outcomes. The Vercel API records server-authoritative multiplayer results separately from client-reported local use. Detailed collection and private deployment boundaries are in DEV_LAB.md.

## Verification

Run `npm test`, `npm run typecheck`, `npm run build` and paired `npm run simulate -- --games=1000` after mechanical changes. Tests exercise all six Legends and all 36 matchups, deterministic replays, action/reaction order, paid-cost invalidation, held-resource lifetime, fixed content, public projections, snapshots, telemetry validation and release gating. Publication builds and normal native sync retain separate internal/player bundles.

## Canonical vocabulary and stable IDs

`src/content/terminology.ts` owns the glossary, Sigil definitions, face presentation and activation labels. `src/content/omens.ts` owns fixed collectible Omens; the old module re-exports those exact objects. `OmenDefinition`, `OmenSize`, `OmenResource`, `FocusAction` and `Hand` are canonical types. `src/engine/vocabulary.ts` exposes Life, Ward, Focus, Hand and Omen views over authoritative state. Existing wire fields (`hp`, `guard`, `control`, `dice`, `cards`), primitive IDs, SQL kinds and native identifiers remain compatible. They are not a second rules system. New visible labels use the canonical adapters. Card display-name changes preserve their previous IDs through an explicit mapping.

Sigils do not fire an independent effect merely by being rolled: they pay eligible ability requirements. Ward Sigils also have an explicit per-face universal Ward conversion. Tooltips read this data rather than promising unimplemented powers. Omen Skins are appearance only. Debug Set Value / Set Sigil / Set Void select an existing authored face and reject missing faces; they never edit collectible definitions.

## Shared alpha pool and rules audit

Version 6 uses one global 60-Card pool, recursive data-driven Affinity requirements and independent mechanical tags. Six Legends access 29–39 legal Cards each. Current content has six numbered Omen sizes and six signature Omens; each starter equips one signature plus two numbered Omens. All Cards explicitly have persistence none: the reusable Card stays in Hand while its ability resolves. Owner-turn Poison/Empowered expiry, upfront Life costs and pre-effect condition capture are authoritative. See RULES_AUDIT.md and ALPHA_CARD_AUDIT.md for exact behavior and campaign results.

Fresh local profiles receive two Legends, sixteen Cards and six Omens. Ownership is separate from equipped Loadouts. Two-Card packs use persisted idempotent receipts, weighted rarity outcomes and duplicate Coins; all Cards can also be acquired directly with earned Coins. This remains a device-local alpha economy. Supabase catalog/save validation uses the same Affinity definitions, with migration adapters retaining legacy entitlements and stable content history.

## Card art and specialization · version 7

Each Card has a distinct cosmetic illustration in `src/content/card-art.ts`, shared by collection, Hand, pack, battle and inspectors. Art has no effect on match rules. Three specialist Cards now require all three listed Affinities (Wild Bloom, Unravel, Night Spores); Sanctuary, Watchful Blade and Island Pull now require two. These remain global Cards evaluated by the recursive Affinity validator, not Legend-specific pools. Costs, effects and starter Hands are unchanged. Version 7 rejects earlier command replays because loadout legality changed. Local profile migration keeps ownership and repairs incompatible equipped Hands using owned legal Cards.

## Collection acquisition · 8 September 2026

Legend purchases/choices grant one Legend and create a legal Loadout using existing ownership. They no longer bundle four Cards and three Omens. Typed acquisition receipts record individual Legend, Omen, Card or two-Card booster grants. Signature Omens have an independent earned choice path; an authored earned Legend milestone may include one bonus signature. Existing entitlements remain owned. See STARTER_ECONOMY_AUDIT.md for economy rates and testing. These changes do not alter mechanical version 7.
