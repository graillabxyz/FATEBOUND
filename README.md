# Fatebound

A playable, portrait-first mobile strategy game foundation. Six folklore Legends. Four hidden, reusable cards. Three customizable dice. One shared Fate.

## Run the game

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. The preview stays a single phone-shaped surface on a larger display. On a phone-sized viewport it fills the screen. Start with **Learn to shape your Fate**, or **Play → AI Training** for a timed match.

Node.js 24 recommended (required for the local metrics SQLite adapter). Dependencies and fonts are bundled locally. This repository includes its own original six-Legend artwork atlas.

## Play

1. Choose a Legend in **Legends**. Use **Loadout** to equip four compatible cards and three slot-compatible dice; save, duplicate, or rename your build.
2. Fate gives both players the same three normalized positions. Different die sizes interpret the same positions through their ordered faces.
3. Tap a die, then a card, Guard, or Legend ability. Select two dice for a two-die requirement. Dragging a die to an action also works.
4. Spend Control to Shift a numbered face (1) or Flip to its designed opposite (2). Lock the plan. Reveal is simultaneous.
5. Revealed cards stay known and remain reusable. Guard expires each round. Reduce the opposing Legend to zero HP, or lead on HP after round seven. Ties use effective damage, then a draw.

Regular decisions have a configurable 12-second window. Guided practice has no timer. A timed-out unlocked plan retains its valid assignments and sends remaining legal dice to Guard. A completed match awards local XP, Coins, Legend mastery, and Season XP exactly once.

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

- Mobile home, persistent navigation, profile, six-Legend collection, all 72 cards, and 18 mechanical dice (including d4, d6, d8, d10, d12 and d20).
- Twelve compatible cards and three broad build approaches per Legend. All prototype gameplay content is unlocked.
- Complete deterministic battle state machine; uniform Shared Fate; validated Control; secret assignments; simultaneous reveal; priority resolution; permanent known-card memory; seven-round win condition; result screen.
- Training and Normal tactical AI. Opponent decisions use only the public projection, including revealed cards and archetype priors.
- Local reconnect checkpoints, command sequence/round validation, duplicate-command idempotency, completed replay export and reconstruction.
- Local profile XP, Coins/Gems, mastery, rank simulation, a 50-level free/premium Season Path, daily/weekly/season quests and one daily quest replacement.
- Collection and cosmetic previews, mock cosmetic purchases, earned-prestige definitions, shop, social/recent-opponent shell, notification preferences, volume/haptic/battery/reduced-motion settings, and a bounded analytics event adapter.
- An internal **Menu → Settings → Developer · Dev Lab**: production-backed battle setup, fixed/sequenced Fate, inspectors, AI diagnostics, phase/effect stepping, hidden-information views, snapshots, report import/export and reusable local scenarios across all six Legends.
- A desktop/mobile **metrics dashboard** with persistent usage telemetry, matchup/card/die analysis, live activity and configurable background simulations. See [Dev Lab and metrics guide](docs/DEV_LAB.md) for access, commands and data boundaries.

## Validation

```sh
npm test                      # engine, lab, content, service and API tests
npm run typecheck
npm run build
npm run format:check
npm run simulate -- --games=1200
```

`reports/balance.json` contains a 1,200-game run across default-loadout matchups and mirror matches, with paired seeds and reversed seats. The final run has **zero seating mismatches**, **423 wins in each seat**, and **4.34 average rounds**. Mirror matches between identical deterministic AIs naturally contribute many draws; these aggregate rates are not human ranked win rates. Per-round damage/Guard/Control, card usage, face frequency, loadout win rates, reveals and unused dice are included.

Manual browser verification at 393 × 852 covered a complete Basajaun–Anansi match, Shift/Flip, tap/drag assignment, a two-die finisher, reveal memory, refresh/reconnect, victory, reward claims, build duplication/renaming/saving, collections and cosmetic/pass previews. A 360 × 780 production check covered compatible custom-die editing and persisted reduced-motion settings. See `docs/VERIFICATION.md` for the final checks and limits.

## Boundaries of this foundation

**Player online services are mocked; internal metrics persistence is real.** Ranked and Casual are clearly labeled AI simulations; no global ranking, live matchmaking, friend messaging, push delivery, real-money payment, server ownership, anti-cheat, or cloud account is connected. The dashboard collects connected internal human-versus-AI play; a production multiplayer source is not connected. Never deploy the local authority as a competitive multiplayer server. The `MatchService`, `SocialService`, `NotificationService`, `MatchmakingService` and profile adapters mark the replacement boundaries.

**The 3–5 minute goal needs timing calibration.** With seven rounds and twelve-second decisions, the maximum ordinary decision time is 84 seconds plus transitions; simulations average 4.34 rounds. The current build prioritizes the requested fast decision window. Human sessions, tutorial pauses, mobile readability, and a deliberate adjustment of decision/round pacing are needed before claiming a 3–5 minute average.

**The content is an initial balance set.** Simulations improved Māui's starter to demonstrate its unused-die/tempo identity, and found/fixed a simultaneous manipulation seating bug. They do not establish a solved competitive meta. Card illustrations reuse the Legend atlas with category treatments; distinct production card art remains future content work. Shop previews and synthesized audio are intentional placeholders. Social and notification adapters are shells.

See `docs/ARCHITECTURE.md` for the rules and authority model, `docs/ART.md` for artwork provenance/prompt, and `docs/BRIEF.txt` for the original brief. Rename the visible title in `src/content/config.ts`; regenerate static manifest/native display metadata when preparing a renamed release.
