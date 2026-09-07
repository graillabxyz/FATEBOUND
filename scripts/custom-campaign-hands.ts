import { mkdirSync, writeFileSync } from "node:fs";
import { STARTERS } from "../src/content/loadouts";
import { validateLoadout } from "../src/engine/rules";
import type { LegendId } from "../src/engine/types";
const hands: Record<LegendId, string[][]> = {
  basajaun: [
    ["branch-lash", "crush", "root-ward", "daring-feint"],
    ["moss-mantle", "barkskin", "deep-roots", "sun-lance"],
    ["windstep", "herensuge", "quick-strike", "root-ward"],
  ],
  anansi: [
    ["unravel", "read-the-thread", "silken-cut", "meditate"],
    ["hollow-sign", "windstep", "daring-feint", "web-shift"],
    ["thread-the-path", "crooked-bough", "first-wind", "hidden-meaning"],
  ],
  tengu: [
    ["gale-cut", "perfect-riposte", "precision-cut", "meditate"],
    ["web-turn", "thread-the-path", "precision-cut", "mountain-silence"],
    ["quick-strike", "silken-cut", "meditate", "counterstrike"],
  ],
  leshy: [
    ["hollow-sign", "crooked-bough", "windstep", "bramble-trap"],
    ["night-spores", "new-skin", "branch-lash", "thorn-return"],
    ["offering", "bold-wager", "wolf-shape", "root-ward"],
  ],
  quetzalcoatl: [
    ["sun-lance", "first-light", "root-ward", "meditate"],
    ["offering", "burning-crown", "quick-strike", "open-sky"],
    ["ritual", "deep-roots", "wild-bloom", "precision-cut"],
  ],
  maui: [
    ["branch-lash", "island-pull", "root-ward", "turnabout"],
    ["false-promise", "against-the-current", "web-turn", "bramble-trap"],
    ["windstep", "story-s-end", "quick-strike", "read-the-thread"],
  ],
};
const variants = Object.fromEntries(
  Object.entries(hands).map(([id, builds]) => [
    id,
    builds.map((cards, index) => {
      const build = {
        ...STARTERS[id as LegendId],
        id: `custom-${id}-${index}`,
        name: `Custom ${index + 1}`,
        cards,
      };
      validateLoadout(build);
      return build;
    }),
  ]),
);
mkdirSync("reports/campaign/custom", { recursive: true });
writeFileSync(
  "reports/campaign/custom/custom-hands.json",
  JSON.stringify(variants, null, 2),
);
console.log(
  "18 legal custom Hands; all nine Hand pairings sampled per matchup. Fixed starter Omens isolate Hand effects.",
);
