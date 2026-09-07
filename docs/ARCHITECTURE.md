# Fatebound foundation

## Runtime and scope

A portrait-first React + TypeScript client, Vite development preview, and Capacitor iOS/Android shells. The UI is a single 480px maximum-width phone surface; large screens are a testing viewport for the game. The separate internal metrics website has its own responsive desktop/mobile layout. The pure TypeScript rules engine has no React, DOM, clock, storage, or network dependencies. Mobile releases still require signing, store assets, native device QA, and a production authority.

## Match loop / explicit state machine

WAITING → INTRO → ROUND_START → FATE → ROLLING → CONTROL → ASSIGNMENT → LOCKED → REVEAL → RESOLUTION → CLEANUP → ROUND_END → FATE (or MATCH_END). Both players plan concurrently. Control and assignment share a configurable 12-second deadline. Tutorial practice can pause that deadline. A lock submits a complete intent; the local authority validates it and seals it. Nothing hidden is exposed until both players have locked (AI locks internally). Timeout keeps a valid current plan and sends remaining legal dice to universal Guard. It never chooses an offensive card. Non-planning phases are driven by the match service, with short UI transitions.

## Shared Fate and different die sizes

All supported sizes (4, 6, 8, 10, 12, 20) divide 120. Each slot draws a shared integer token in [0,119] via a versioned deterministic PRNG with rejection sampling. Face index = floor(token * size / 120). Equal-size dice always land at the same position. Different sizes receive the same percentile band, uniformly over each die's ordered faces. This resolves the otherwise undefined case of a shared position exceeding a smaller die's face count. The seed creates the puzzle; there are no further random decisions in effect resolution. Shared exposure does not itself prove balanced loadouts; simulations measure that separately.

The authority alone knows the live seed and future Fate. Client projections omit seeds, unrevealed opponent card identities, pending enemy assignments, and AI planning. Completed replays contain seed, content version, loadouts, and validated intent logs. Debug forced Fate is explicitly separated from competitive services.

## Dice and Control

A mechanical die has size, ordered faces, tags, compatibility, rarity, version, and a bijective opposite-face map. Face definitions contain kind, numeric value or registered symbol, icon, and balance weight. SHIFT (1 Control) moves to the adjacent ordered numerical face only; both faces must be numbers. FLIP (2) follows the authored opposite map, including symbols and blanks. No rerolls. Each round resets Control to 2. Cosmetic skins are separate IDs and never enter rules calculations. Budget reports include mean weight, variance, blank share, and opposite-face utility, rather than pretending a single scalar proves balance.

## Content and effects

Six Legends, twelve authored cards per Legend, standard dice in all six sizes, and twelve custom dice. All defaults and rule text live under content/. Loadouts contain exactly one Legend, four distinct compatible cards, and three slot-compatible dice. All prototype gameplay content is unlocked.

Requirements compose die count, numerical interval/total, symbol, die size, Control cost, and state predicates. Effects are data interpreted by a handler registry, not card-ID switch statements. Initial content uses DAMAGE, HEAL, GUARD, STATUS, GAIN_CONTROL, LOSE_CONTROL, SWAP_ASSIGNMENT, BLOCK_EFFECT, CLEANSE, CONVERT, CONDITIONAL and MULTIPLIER. Additional typed primitive hooks are independently registered. Statuses carry explicit expiry.

Resolution priority: manipulation 10 → defense/counters 20 → recovery/setup 30 → attacks 40 → finishers 50. At each priority, both actors read the same phase snapshot and their health/guard deltas are applied as a batch, so seating does not grant a first-action advantage. Actor-local passives are applied in stable card-slot order. Swapped assignments are revalidated; invalidated actions fizzle visibly. Card identities become known on reveal even if an effect fizzles or is blocked. Cards never leave the loadout. Guard expires after the round. Death is evaluated after all actions in the current priority batch. Simultaneous lethal uses effective damage, then a deterministic draw. Round seven: HP, effective damage, then draw. No random tie breaks.

## AI and simulation

AI sees only a public opponent projection, its own loadout, and current Fate. It enumerates affordable deterministic Control choices and all legal assignments, scores candidate effects against HP, likely opposing offense/defense, known cards, archetype priors, lethal opportunities, and round pressure. Training uses fewer candidate controls; Normal searches the full two-Control horizon. Ties use stable enumeration. Simulation exports wins by Legend/loadout, seating symmetry, rounds, per-round damage/guard, Control use, card use, face frequencies, reveals and unused dice.

## Authority and reconnection

MatchService is the transport boundary. LocalMatchService is explicitly a MOCK authority, used for training and labeled ranked/casual simulations. Commands carry match ID, sequence and expected round; duplicate sequence is idempotent, stale/conflicting commands fail. The service validates ownership, slots, Control and assignments. The local checkpoint persists enough authority state to resume a training match after refresh; this is not a security boundary. A production adapter must move all authoritative state, RNG, timeouts, rewards, currency, ownership, MMR and replay signing to the server, authenticate players, enforce reconnect grace and prevent concurrent claims. Never expose this local service as a ranked backend.

## Economy and product services

Only Coins and Gems. Mock progression claims are idempotent by match ID and pass reward ID, stored in a versioned local profile. Account XP, Legend mastery, season XP and rank are separate. Premium rewards contain cosmetics/currency only; no paid mechanical advantage. Cosmetic-only shop previews have no real billing. Rank changes are simulation-only. Quests rotate on deterministic UTC day/week keys. Social and notification adapters are local shells; no messages or pushes are sent.

## Accessibility / presentation

Touch targets ≥44px, icon + label status cues, no color-only requirements. Tap-select then tap-target and pointer drag use the same assignment validator. Four reusable cards remain available; full readable card inspection is available in a sheet. Persistent five-tab navigation. Reduced motion removes rolling/bounce/flourish; battery saver suppresses ambient animation. Local fonts and artwork remove runtime network dependencies. Audio is a capped-volume event bus with synthesized placeholder cues and material metadata; native haptics are optional.

## Verification

Engine invariant and integration tests cover content, all die sizes, fairness, manipulations, legal plans, hidden projections, reusable reveal memory, simultaneous resolution, timers, replay determinism, idempotent rewards and complete matches. AI round-robin simulations detect seat asymmetry and content balance concerns. Browser flows exercise loadout editing, battle, results, progression, and mobile layout. Native packaging and live multiplayer are separate release gates.

## Internal Dev Lab

Dev Lab is lazy-loaded only in development or an explicitly enabled `internal` build. Release builds remove the entry and Dev Lab chunks. It owns an isolated in-memory authority and `fatebound.dev.*` storage, never profile rewards, competitive services, or player checkpoints.

The production effect resolver exposes a generator of primitive and priority-commit frames. Normal matches drain that iterator; the laboratory calls the same iterator one step at a time. All health commits retain simultaneous priority semantics. Mid-resolution snapshots include the exact pre-resolution state and number of consumed frames; restore deterministically rebuilds the suspended iterator. Editing a suspended priority snapshot requires rewinding first. Card-scoped stun uses the production status model. Negative damage is clamped to zero at the damage commit boundary.

Fate uses the production normalized 120-position model. Lab fields are explicit one-based shared positions (1–120); a preview shows each die's resulting face. Individual face overrides are separate and visibly break shared Fate for edge-case tests. Sequence handling, timers, overrides, AI inspection and view switching belong to the internal orchestrator. Normal A/B and spectator projections always call the production projection; omniscience is available only to internal tooling.

## Durable internal analytics

The internal Worker API uses a D1 database with generated Drizzle migrations, prepared statements and idempotent inserts. Its loopback-only development adapter uses SQLite. Anonymous interaction events and completed internal human-vs-AI matches use a bounded transport outbox; database records remain the source of truth. Simulation and forced lab records use distinct validated endpoints and cohorts. Released clients default to no telemetry endpoint. Actual multiplayer authority remains an integration boundary. See DEV_LAB.md for collection semantics and the bounded metrics query window.
