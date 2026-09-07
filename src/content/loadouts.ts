import type { Loadout, LegendId } from "../engine/types";
/** Curated examples drawn from the shared pool; not separate content pools. */
export const STARTERS: Record<LegendId, Loadout> = {
  basajaun: {
    id: "starter-basajaun",
    name: "The Quiet Guardian",
    legend: "basajaun",
    cards: ["sun-lance", "root-ward", "moss-mantle", "quick-strike"],
    dice: ["standard-d12", "standard-d8", "guardian-d6"],
  },
  anansi: {
    id: "starter-anansi",
    name: "Threads of Fate",
    legend: "anansi",
    cards: ["silken-cut", "daring-feint", "web-turn", "hidden-meaning"],
    dice: ["trickster-d8", "standard-d6", "standard-d4"],
  },
  tengu: {
    id: "starter-tengu",
    name: "Edge of the Wind",
    legend: "tengu",
    cards: ["gale-cut", "perfect-riposte", "precision-cut", "quick-strike"],
    dice: ["tengu-d6-0", "standard-d8", "standard-d6"],
  },
  leshy: {
    id: "starter-leshy",
    name: "Into the Wild",
    legend: "leshy",
    cards: ["branch-lash", "moss-mantle", "wolf-shape", "windstep"],
    dice: ["leshy-d8-0", "standard-d8", "standard-d6"],
  },
  quetzalcoatl: {
    id: "starter-quetzalcoatl",
    name: "Dawn Ascending",
    legend: "quetzalcoatl",
    cards: ["sun-lance", "root-ward", "first-light", "quick-strike"],
    dice: ["quetzalcoatl-d10-0", "standard-d8", "standard-d6"],
  },
  maui: {
    id: "starter-maui",
    name: "Against the Tide",
    legend: "maui",
    cards: ["silken-cut", "root-ward", "daring-feint", "turnabout"],
    dice: ["maui-d10-0", "standard-d8", "standard-d6"],
  },
};
export const STARTER_LEGENDS: LegendId[] = ["basajaun", "anansi"];
export const STARTER_CARDS = [
  ...new Set([
    ...STARTERS.basajaun.cards,
    ...STARTERS.anansi.cards,
    "crush",
    "barkskin",
    "meditate",
    "deep-roots",
    "web-shift",
    "herensuge",
    "counterstrike",
    "read-the-thread",
  ]),
];
export const STARTER_OMENS = [
  "standard-d4",
  "standard-d6",
  "standard-d8",
  "standard-d12",
  "guardian-d6",
  "trickster-d8",
];
export const STARTER_CONTENT = [
  ...STARTER_LEGENDS,
  ...STARTER_CARDS,
  ...STARTER_OMENS,
];
