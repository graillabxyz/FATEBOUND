# Project instructions

This is a portrait-only iOS/Android game with a local browser development preview. Preserve a single phone layout for the game. The separate internal metrics website is intentionally responsive on desktop and mobile. Read docs/ARCHITECTURE.md before changing rules.

- Rules are pure TypeScript under src/engine; no DOM, React, storage, wall clock or unseeded randomness there.
- Content and tuning belong under src/content, never in UI card-ID conditionals.
- Both seats share normalized Fate; priority batches must be invariant to seating.
- Never pass hidden enemy cards, plans or future RNG to clients or AI.
- Preserve exactly four reusable cards and three compatible dice per build.
- Cosmetic definitions and purchases must not change mechanical state.
- Local authority, economy and social adapters are explicitly mocks. Do not represent simulations as live multiplayer.
- Use npm test, npm run typecheck and npm run build for rules or application changes. Run paired-seat simulations when changing resolution/AI/balance.
- Update the rules documentation and mechanical version before releasing incompatible replay changes.
