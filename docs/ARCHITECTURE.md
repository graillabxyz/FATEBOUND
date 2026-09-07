# Fatebound authoritative combat · mechanical version 2

## Runtime and boundaries

The mobile game is a portrait React/TypeScript client with Capacitor shells. The separate internal metrics website is responsive. All battle decisions, random generation, timing permissions, costs, effects, victory and projections live in pure TypeScript under `src/engine`. The engine has no React, DOM, storage, wall clock or unseeded randomness. Services supply clock values and persistence. Dev Lab orchestrates this same engine and effect iterator.

LocalMatchService is a mock authority for human-vs-AI play. Ranked/casual labels remain local simulations. Production multiplayer, server rewards, matchmaking and signed telemetry are not connected. Native signing, platform builds and device testing remain release work.

## Locked loadout and content

A match clones one Legend, four distinct compatible reusable cards and three fixed collectible dice for each player. There is no deck, draw, discard, random hand, universal cooldown or normal mid-match swap command. Content compatibility, Legend class and initiative bonus, passive rules, timings, effects, requirements and die utility weights are data-driven. All six supported dice sizes can be equipped where their tags are compatible. Legend diceSlots describe starter recommendations; allowedDiceSizes and compatibility tags govern restrictions. Dice faces cannot be customized by players.

Cards have ACTION, REACTION or PASSIVE timing. Current activatable content uses ACTION/REACTION; Legend passive rules are triggered by production events. Requirements support numeric ranges, exact totals, parity, die count/type, symbols, equal/different values, Control, held/unused resources, initiative, class, round bounds and contextual predicates. High values do not satisfy low ranges or exact requirements. Special faces replace numeric faces and authored blanks pay for their utility. Utility weights are estimates, not a universal power ranking.

## Initiative, rounds and turns

MATCH_INTRO → INITIATIVE_ROLL → ROUND_START → TURN_START → DICE_ROLL → MAIN_ACTION.

Each Legend rolls d20 + its data-defined initiativeBonus once. Tied totals compare raw d20, then stable RNG stream index; no reroll. The winner leads Round 1. Initiative alternates thereafter. Each round contains exactly two turns. TURN_END → SECOND_TURN → TURN_START for the other player, then TURN_END → ROUND_END → next ROUND_START.

Both players use the same configurable zero-index slot ramp: [0], [1], [0,1], [1,2], [0,1,2] for rounds 1–5; the last row repeats. Dice expire specifically at their owner's next TURN_START, then new dice roll and start-of-turn statuses apply. Unused available dice become HELD at TURN_END. ROUND_END never clears dice. Because initiative alternates, the previous second player immediately becomes next round's first player; their held dice expire before that consecutive turn. No extra carryover exception is invented.

Prototype Guard lasts until owner turn start, when old Guard clears with old resources. Both players reset Control to 2 at ROUND_START; it does not bank. Start poison applies after the new roll and before MAIN_ACTION. Status lifetimes end at the configured round cleanup. Stored power becomes usable in its due round and is consumed by the next damage effect.

## Deterministic random streams

Each seat has a seeded independent stream for its owner's rolls; initiative is separately seeded. The normalized 120-token mapping remains the uniform face sampler for every supported die size. Future opponent dice are not inferred from the active player's roll. No further random choice occurs in resolution. Paired simulations swap loadouts AND RNG stream identities, including opening initiative rolls and the tie fallback.

## Decisions and resolution

A MAIN_ACTION command may pay Control and declare one action, or pay only Control, or end the turn. Multiple sequential uses of the same card are legal when separate available dice pay each cost. SHIFT costs 1 and selects an authored numeric face exactly one value above/below the current result; missing values and boundaries fail. FLIP costs 2 and follows the authored opposite map. Only available unspent resources on the owner's turn may use Control.

Declaration validates timing, status, ownership, resource availability and requirements atomically, then pays Control/dice and permanently reveals the card. ACTION_DECLARED → REACTION_WINDOW. The defender may spend eligible held/available resources on one reaction or universal Guard, or PASS. Universal Guard spends one numbered die for floor(value/2); symbols require explicit guardValue metadata. A reaction has no reaction-time Control permission in this version.

REACTION_DECLARED or reaction PASS → RESOLUTION. The exact production iterator provides these ordered stages:

1. Reaction prevention, Guard, redirect, cancellation and manipulation (10/20).
2. Revalidate the action's target and paid dice after manipulation (30). Invalidated actions fizzle visibly; costs remain spent.
3. Resolve action effects, healing and damage (40). Damage clamps at zero, Guard absorbs first, healing clamps to max HP, and effective damage cannot exceed remaining HP.
4. Counterstrike/post-damage effects (50), only after actual incoming attack damage. Lethal does not suppress an already armed counterstrike.
5. Cleanup and victory evaluation (60). Return to MAIN_ACTION if neither side has ended the match.

There is one reaction window per action and no recursive response stack. Redirect exchanges the action's player targets, including beneficial self-target effects; conversion costs still belong to the original caster. A round can contain multiple exchanges. Legend passives are stable actor-local rules. Composite effect frames follow their child frames and show before/after state.

Both zero HP: compare effective damage, then draw. Round cap defaults to seven: HP, then effective damage, then draw. No random match tiebreak.

## Information and client behavior

The authority owns the phase and current actor. Player projections omit seed, RNG configuration, future forced Fate, hidden card IDs and private drafts. Unknown card-scoped statuses also omit their card IDs. Declared cards become permanently known, even when canceled. Dice and held resources are public; intended private reactions are not. Spectators see only revealed cards. Omniscient projections exist only in internal tooling.

Battle renders the authoritative turn/phase, initiative contest/marker, ACTION/REACTION cards, validation messages, available/held/spent/expired resources and public event log. Tap-select dice, choose an ability, then Activate/React. Ending a turn holds the remainder. Normal main decisions allow 12 seconds; reaction windows allow 5 seconds. Practice disables the main timer, while reactions still auto-pass. Timeout never activates a draft or silently spends defensive resources. Internal timers may be disabled or controlled for debugging.

## Replay, reconnect and lab snapshots

Mechanical version 2 uses a command stream recording round, turn, actor and each paid action/pass. Seed + loadouts + versioned config + commands reproduce all rolls and outcomes. Exporting a live competitive seed is forbidden. Old simultaneous version 1 replays/checkpoints are rejected. Commands require match ID, sequence, round and revision; retries are idempotent, stale decisions fail.

Local versioned checkpoints validate resource/state shape before restoration. Dev snapshots also include setup, precise resource states, AI configuration, reveal memory, forced rolls, logs and a suspended resolver's baseline/cursor. Restoring a suspended resolver replays the same iterator and compares its state before resuming. Manual state edits require a safe rewind while an effect is suspended. Imports are bounded and validated. Local scenarios/snapshots and telemetry outboxes now use version 2 storage keys.

## AI, simulations and metrics

AI receives its own state and a production public opponent projection. It enumerates legal single actions/reactions and affordable Control choices, retaining pass as an option. Its deterministic heuristic exposes damage, defense, healing, lethal risk, prediction, resource preservation, Control cost and reveal cost. These scores are estimates for tuning, not an optimal-play guarantee.

Simulation uses the same phase loop and actions in a background worker (up to 10,000 matches per run). Paired seeds verify seat equivariance independently of opening-initiative advantage. The dashboard records opening/second-initiative wins, class and Legend outcomes, damage by round, held dice per turn, reaction frequency/success, unused expiration, card uses, die size/loadout correlations and individual die outcomes. Repeated uses within a round count separately. Wilson 95% starting-win intervals count a reversed pair once, and flag deviations from 50% after 30 independent decisive seeds. Mixed matchup/AI cohorts are not causal proofs of class or initiative power.

Hosted D1/local SQLite ingestion stores versioned summaries, filters active rules cohorts and separates actual internal human-vs-AI play, simulation and forced lab outcomes. Actual multiplayer telemetry remains unconnected. Detailed collection and private deployment boundaries are in DEV_LAB.md.

## Verification

Run `npm test`, `npm run typecheck`, `npm run build` and paired `npm run simulate -- --games=1000` after mechanical changes. Tests exercise all six Legends and all 36 matchups, deterministic replays, action/reaction order, paid-cost invalidation, held-resource lifetime, fixed content, public projections, snapshots, telemetry validation and release gating. Publication builds and normal native sync retain separate internal/player bundles.
