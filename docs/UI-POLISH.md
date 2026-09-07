# Player UI polish, pass 1

The player app retains one portrait phone layout. The desktop/mobile internal metrics site keeps its existing separate layout.

## Delivered

- Framed Legend home, bronze play button, clearer equipped build and reward entry points.
- Shared stone materials, category-colored cards, larger rules, consistent category symbols in card inspectors, stronger selected/assigned states.
- Actual physical dice meshes for all six sizes throughout home, loadout, collection, battle, inspectors, cosmetics and Dev Lab. Current result appears on the front face; the die size is separately labeled. Numeric content, symbols, ordered faces and Flip opposites still come from production definitions.
- Arena background, distinct HP/Guard plates, low-health color, damage/healing feedback, shared Fate tray, reveal transition, anchored dice and action dock. Short phones condense opponent dice into the opponent plate; long card rules use a three-line preview with full text in the inspector.
- Match intro, keyboard-accessible begin control, victory/draw/defeat presentation, reward tiles, collection, season, profile, shop and modal styling.
- Existing reduced-motion and battery-saving modes suppress added motion. The generated textures are local compressed WebP assets.

## Verification

66 tests pass, including seven geometry checks covering correct face/vertex counts, closed edges, Euler characteristic and bounded projections. TypeScript, formatting, production build and developer-feature exclusion checks pass. The release web assets synchronize into the iOS and Android projects. No engine, AI or balance definitions were changed.

Browser review uses the actual local application at 393 × 852 and 360 × 780. The action dock remains visible on small phones. Selection, Flip, two-die assignment, inspector opening, reveal memory, round progression and match completion are exercised through the normal player interface. Native assets are synchronized; native platform compilation and physical-device rendering remain separate release checks.

## Maintenance

`src/ui/polish.css` is the presentation layer after the baseline stylesheet. `src/ui/dice-geometry.ts` supplies static projected meshes only. Shared components continue to be used in both real matches and the internal tools. Art prompts and provenance are recorded in `docs/ART.md`.
