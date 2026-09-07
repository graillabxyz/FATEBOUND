# OMNIPATH

Live game: https://omnipath-chi.vercel.app · Developer metrics: https://omnipath-chi.vercel.app/metrics

GitHub `main` automatically deploys the public game and server API to Vercel. Supabase provides accounts, asset storage and multiplayer authority. See [deployment and backend setup](docs/DEPLOYMENT.md).

A playable, portrait-first mobile strategy game foundation. Six folklore Legends. Four hidden, reusable cards. Three fixed collectible Omens. Fixed turn order and meaningful reactions.

## Run the game

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. The preview stays a single phone-shaped surface on a larger display. On a phone-sized viewport it fills the screen. Start with **Learn to shape your Fate**, or **Play → AI Training** for a timed match.

Node.js 24 recommended (required for the local metrics SQLite adapter). Dependencies and fonts are bundled locally. This repository includes its own original six-Legend artwork atlas.

## Play

1. Choose one Legend, four compatible reusable cards and three fixed collectible Omens in **Loadout**. Save before starting; the match locks all eight pieces.
2. Opening initiative is d20 + Legend bonus. The winner leads every round; turns remain A → B. The opening player chooses 1 Omen; the second chooses 2. Both roll all 3 on their subsequent Turns.
3. On your turn, select Omens, choose an ACTION or universal Ward, and Activate. Shift a numeric result ±1 for 1 Focus or Flip to the authored opposite for 2. Focus resets each round.
4. End your turn to hold unused Omens. When the opponent declares an action, spend eligible resources on one REACTION or Pass. Reaction windows last five seconds; timeout never spends resources for you.
5. Omens and Ward expire at their owner's next turn start. Cards remain reusable and permanently known after their first use. Win by reducing the enemy to zero Life, or lead on Life/effective damage at the seven-round cap.

Main decisions allow twelve seconds. Practice disables the main timer while preserving five-second reaction windows. All phases, validation and effect resolution come from the production engine. Completed local matches award mock progression exactly once.

## Native projects

Both **ios/** and **android/** are generated and configured for portrait orientation. They use the same client and rules engine. Capacitor supplies the native host, screen orientation and optional haptics; the game UI renders in the native WebView. This is not an Expo/React Native project.

```sh
npm run native:sync
npm run native:ios       # open Xcode
npm run native:android   # open Android Studio
```

- iOS: deployment target 16.0, Swift Package Manager. Choose your signing team in Xcode before building on a device.
- Android: install the Android Studio toolchain and matching SDK/JDK, then build in Android Studio. Portrait is declared in AndroidManifest.xml.
- The checked-in native shells were generated and synced. Native simulator/device compilation was **not** verified in this environment; this host has Xcode 14.2, which predates the generated Swift 5.9 package, its simulator service is unavailable, and the Android SDK is absent.
- App Store/Play signing, distribution profiles, final launch icons, production audio, and device performance QA remain release work.
- `scripts/add-ios.mjs` records a workaround for the installed Capacitor CLI's SPM option casing bug. It uses Capacitor's normal add pipeline and changes no installed dependencies. Existing projects only need `native:sync`.

[Capacitor runtime documentation](https://capacitorjs.com/docs) · [Vite development guide](https://vite.dev/guide/)

## What is implemented

- Mobile home, persistent navigation, profile, six-Legend collection, 77 cards, and 21 mechanical Omens (including d4, d6, d8, d10, d12 and d20).
- At least twelve compatible cards and three broad build approaches per Legend. All prototype gameplay content is unlocked.
- Authoritative individual turns, opening initiative, owner-turn opening Omen choices, held resources, one-window reactions, paid-cost revalidation, deterministic effect stepping, reusable reveal memory and round-cap victory.
- Training and Normal tactical AI. Opponent decisions use only the public projection, including revealed cards and archetype priors.
- Local reconnect checkpoints, command sequence/round/revision validation, duplicate-command idempotency, completed replay export and reconstruction.
- Local profile XP, Coins/Gems, mastery, rank simulation, a 50-level free/premium Season Path, daily/weekly/season quests and one daily quest replacement.
- Collection and cosmetic previews, mock cosmetic purchases, earned-prestige definitions, shop, social/recent-opponent shell, notification preferences, volume/haptic/battery/reduced-motion settings, and a bounded analytics event adapter.
- An internal **Menu → Settings → Developer · Dev Lab**: production-backed battle setup, fixed/sequenced Fate, inspectors, AI diagnostics, phase/effect stepping, hidden-information views, snapshots, report import/export and reusable local scenarios across all six Legends.
- A desktop/mobile **metrics dashboard** with persistent usage telemetry, matchup/card/Omen analysis, live activity and configurable background simulations. See [Dev Lab and metrics guide](docs/DEV_LAB.md) for access, commands and data boundaries.

## Validation

```sh
npm test                      # engine, lab, content, service and API tests
npm run typecheck
npm run build
npm run format:check
npm run simulate -- --games=1000
```

`reports/balance-v4.json` records 1,000 games with 500 reversed-seat/RNG-stream pairs and zero mismatches. Each seat won 498 times, with four draws and 3.226 mean rounds. The opening Initiative winner won 62.45% of decisive matches (95% Wilson interval 58.12–66.59%, 498 independent decisive seeds). This is a significant first-player advantage in the Normal AI/starter-Loadout cohort, not proof of human balance. The AI held no resources after the winner’s opening turn and only 0.024 Omens on average after the second player’s opening turn; there were no Reactions in global Turns 1–2. Both players reached their first full roll in all 1,000 matches; mean Life difference there was +4.864 for the opener. Opening choices, own first/second-turn damage, resources, reactions and combination outcomes are included in the report. Older rules reports remain historical and are excluded from current metrics.

Automated tests cover all 36 Legend matchups, deterministic replay, hidden projections, snapshots, costs, timers, Omen choices, vocabulary, API and geometry. Native compilation/device QA is separate.

## Boundaries of this foundation

**Player online services are mocked; internal metrics persistence is real.** Ranked and Casual are clearly labeled AI simulations; no global ranking, live matchmaking, friend messaging, push delivery, real-money payment, server ownership, anti-cheat, or cloud account is connected. The dashboard collects connected internal human-versus-AI play; a production multiplayer source is not connected. Never deploy the local authority as a competitive multiplayer server. The `MatchService`, `SocialService`, `NotificationService`, `MatchmakingService` and profile adapters mark the replacement boundaries.

**The 3–5 minute goal needs human timing data.** Simulations measure rounds and resource decisions without inventing a real-time duration. Main and reaction windows now both contribute to match length; actual internal matches record elapsed duration.

**The content is a prototype balance set.** The current paired simulation detects a starting-initiative advantage and differences between starter loadouts. The dashboard exposes those findings for tuning. Card illustrations reuse the Legend atlas; distinct production card art and final audio remain future content work.

See `docs/ARCHITECTURE.md` for the rules and authority model, `docs/ART.md` for artwork provenance/prompt, and `docs/BRIEF.txt` for the original brief. Rename the visible title in `src/content/config.ts`; regenerate static manifest/native display metadata when preparing a renamed release.
