# Dev Lab and metrics

The Dev Lab and responsive metrics website are internal tools. They use the same production content, validation, AI search, and effect interpreter as normal matches. There is no alternate battle system.

## Open locally

Use Node.js 24 for the included SQLite development server.

```sh
npm ci
npm run metrics:server   # terminal 1: localhost:8787, durable SQLite
npm run dev:lab          # terminal 2: localhost:5174
```

- Game and lab: `http://127.0.0.1:5174/game` → Menu → Settings → Developer · Dev Lab.
- Desktop/mobile metrics: `http://127.0.0.1:5174/metrics`.
- The local database is stored in `../../work/fatebound-metrics.sqlite`. Override with `METRICS_DB_PATH` if needed. It survives restarts; it is excluded from source control.
- The hosted `/metrics` route opens the dashboard; **Open game & Dev Lab** opens the internal `/game` build.

## Reproduce the requested example

Open **Round 6 · flipped two-Omen attack** on Dev Lab Home. This sets Basajaun to 4 Life, Anansi to 2 Ward, round six, Web Shift known, Basajaun's three faces to 2 / 5 / 3, then flips its D12 and assigns both large Omens to Herensuge's 12+ attack. Both seats are manual. Open DEV → STATE to inspect the assignments or DEV → LOG to inspect effects.

For any custom situation:

1. Battle Lab → select each Legend, four distinct cards, three Omens, Life/Ward/Focus and human/AI controller. All six Legends are supported.
2. Fixed Fate → choose exact face positions for either player. A preview shows the resulting faces on both sides. Forced policies use normalized positions 1–120 across different Omen sizes; random mode uses independent seeded owner turns.
3. Start lab match → DEV → STATE switches A, B, spectator or omniscient view. A/B/spectator use production information projections. Enable **Inspect taps** to tap cards, Omens and Legends; disable it for normal selection and assignment.
4. Declare one action, advance to the reaction window, then declare a reaction or pass. Enable Step Resolution and use Next Effect for prevention, target validation, action damage, post-damage triggers and cleanup. Before/after state appears in LOG.
5. Save Snapshot, change the situation, Restore Snapshot, or save a named local scenario. Exported snapshots and reports can be pasted into Import Match State, including snapshots taken during a suspended effect.
6. Finish normally or force a winner in PHASE. Review Results shows the outcome and match statistics. Save Outcome to Dashboard stores it in the separate lab dataset.

The floating DEV sheet pauses timers and auto-advance. **Hide all Dev UI** preserves the configured battlefield; hold the top battle header for one second or press Escape to restore controls. Frame/phase animation stepping is driven by the phase controls; this is not a native animation timeline editor.

## Controls and validation

- Setup supports default/random/mirrored/swapped loadouts, known cards, status JSON, round limits, seed, rank labels, timer durations and prior effective damage. Setup also forces initiative bonuses, opening d20 rolls/winner and held-Omen faces. Held resources survive only until owner turn start. Previous-card context is recorded in reports.
- Ignore Restrictions bypasses Legend/card/Omen compatibility only. Four distinct existing cards and three existing Omens are still required because production targets use card IDs. Planning, Focus costs and effect rules are never bypassed silently.
- Fate supports random, fixed and multiround sequences with repeat/random/stop endings. Current/next Fate, individual faces and Sigils can be changed. Sequence exhaustion stops at the round boundary with a clear message.
- Omens inspection exposes ordered face indices, values, opposites, balance weights and compatibility. Shift/Flip use production Focus rules; Set Face is an explicit audited override.
- Card inspection exposes requirement reasons, reveal memory, card-scoped stun/disable, assignment and activation. Activation pays and reveals one valid action or reaction; production timing and resource validation always apply.
- Legend inspection exposes health, Ward, Focus and statuses. Numeric state overrides are labeled separately from damage/healing effects. Clear existing Focus actions before reducing Focus below their cost.
- Current, previously known and hidden-but-known labels all map to the current production known-hand model. “Currently revealed” is an inspection flag; first declaration makes the card permanently public.
- AI diagnostics show the actual production candidate search and score components, chosen plan and alternatives. You can recalculate, accept, force an alternative or stage a deterministic random alternative. Reveal cost and held-resource opportunity have explicit heuristic weights.
- Safe rewind during suspended resolution returns to its pre-resolution RESOLUTION state; otherwise it resets the round. State edits during a suspended batch are rejected to protect its deterministic iterator state.
- Timeouts pass without activating drafts or spending Omens. Main turns end with available Omens held; a reaction timeout passes the window. Network disconnect is represented by snapshot/checkpoint restoration in the local authority; no live network failure simulator is claimed.

## Content and balance workflow

Content Browser searches cards by Legend, region, category, primitive and activation requirements, exposes raw structured definitions, and compares Legends. Omens Lab compares up to three ordered Omens, face weights, opposites, numeric averages, symbol/blank probabilities and observed frequencies over 1/10/100/1000 rolls. Its comparison uses identical normalized tokens, including differently sized Omens, for probability comparisons; live owner turns use independent seeded streams.

Edit `src/content/cards.ts`, `Omens.ts`, `legends.ts` or `config.ts` while the development server runs. Vite refreshes the module graph. Restart the lab from the same setup/seed and replay the actions before comparing results. Hot reload does not rewrite a suspended iterator or guarantee old snapshots remain compatible with changed mechanical definitions. Increment the mechanical version for incompatible content/rule releases.

## Metrics website

The website adapts to desktop and phone screens independently of the portrait-only game. It includes:

- Source, date, Legend and opponent filters; human/AI content-usage cohorts for actual play.
- Completed games, active anonymous game sessions, duration, rounds, draw rates and Legend performance.
- Card equip/use counts, win rates when equipped or used, and first reveal round; Omens equip counts, win rates, face frequencies and Focus adjustments.
- A matchup matrix, reversible-seat pair diagnostics, lethal round distribution and JSON export. Opening-initiative and class results, held Omens, reactions, expirations and Omen-size correlations use mechanical version 4. Starting-win uncertainty counts each reversed pair once.
- Simulations for 10, 100, 1,000 or 10,000 matches, custom four-card/three-Omen loadouts, deterministic seeds, two AI difficulties, mirror tests, reversed-seat pairing, background-worker progress/cancellation, and persistent run saving.
- Actual interaction event counts and automatic refresh every ten seconds while visible.

Simulation runs execute entirely through the production engine. They have no fabricated real-time duration. The current run's results cover its entire batch; the database explorer reads the latest **2,500 matching records** in the selected source/date/matchup and explicitly shows the total when the selection is larger. Narrow filters or export a run for full-batch analysis. This bounded initial explorer is not an unlimited analytics warehouse.

“Used” cards include assigned/revealed cards that later fizzle. Win rates include draws in the denominator. Card or Omen success is correlated with its whole loadout, matchup and controller; it is not causal value attribution. Ward measures generated Ward, not damage prevented. No independent per-card “value created” score is invented.

Live data consists of real interactions and completed human-vs-AI matches from connected internal game sessions. It is client-reported, not authoritative multiplayer telemetry. Actual-play data is collected only from completed internal play sessions. Simulations and forced lab outcomes never populate it. No profile name, email, custom build name or event properties are collected; a rotating page-session identifier supports the 15-minute active-session count. Match IDs make retry ingestion idempotent. Short device-local outboxes tolerate temporary connectivity loss.

## Hosting and release separation

The private website uses a Worker-compatible API and persistent D1 database. The platform requires signed-in owner access; the API also requires the platform identity header. Cross-origin writes are rejected. The development-only SQLite adapter listens on loopback and supplies its server-side LOCAL_DEV flag. Never set that flag on the hosted service.

```sh
npm ci --prefix tooling/sites
npm run build:site
```

`tooling/sites` isolates the Sites Worker build tooling from the game's Vite toolchain. `db/schema.ts` owns the schema; generated, schema-only Drizzle migrations are applied before hosting. Each statement is prepared separately, with bounded transactional inserts. Applied migrations must remain immutable.

Normal `npm run build` uses production mode. Dev Lab and dashboard are gated by development mode OR both `MODE=internal` and `VITE_ENABLE_DEV_TOOLS=true`. Setting that flag alone in a production build does not expose tools. Release bundles omit lab/dashboard/worker chunks, and native sync uses that release build. The hosted metrics site intentionally uses internal mode and private access.

Release telemetry is disabled unless `VITE_TELEMETRY_URL` is configured. A public mobile release needs an authenticated, appropriately provisioned ingestion service; the private owner-only dashboard is not a public client ingestion endpoint. Replace the local competitive authority and connect signed server outcomes before claiming global player statistics or anti-cheat guarantees.

## Automated checks

The tests cover deterministic presets, all-Legend stepped/normal equivalence, exact suspended snapshot restoration, hidden views, reveal rewind, Focus limits, sequence endings, timeout behavior, simultaneous lethal, targeted stun, poison expiry, healing caps, AI diagnostics, telemetry validation, transactional batches, retry deduplication, matchup filtering and private access. The historical 1,000-game version-two report has 500 pairs and zero seat/stream mismatches; starting-initiative imbalance remains explicitly flagged.

Browser WebMCP registration is optional and has a no-support fallback. The available browser reported no registered WebMCP tools, so that optional integration was not verified. Version-two mobile action/reaction screens receive browser checks; native device validation remains separate. The historical version-one checks in VERIFICATION.md do not establish version-two balance.

## Fixed opening tools (version 4)

Setup exposes completed owner turns independently of Round. Enable “Pause for battlefield opening Omen choice” to start directly at the restricted roll; choose one or two equipped Omens on the battlefield or Phase panel. Manual phase advance requires a valid choice. Disabling the pause uses production AI selection for quick-state scenarios. Snapshots preserve both owner counters, pending choices and measured turn history. AI diagnostics rank opening combinations using fixed-face probability and own ability utility.

The responsive Metrics overview reports first/second role win rates, damage on each player’s first and second turns, held Omens after the first turn, opening reaction frequency, opening combination outcomes, Initiative Bonus outcomes and signed Life differential after both first full rolls. Existing private live telemetry and simulation records carry the same fields; old rules cohorts remain excluded.
