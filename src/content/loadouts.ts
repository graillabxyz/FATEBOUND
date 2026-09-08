import type { Loadout, LegendId } from "../engine/types";
/** Curated examples drawn from the shared pool; not separate content pools. */
export const STARTERS: Record<LegendId, Loadout> = {
  basajaun: {
    id: "starter-basajaun",
    name: "The Quiet Guardian",
    legend: "basajaun",
    cards: ["fell-the-axe", "oakheart", "root-ward", "crush"],
    dice: ["standard-d12", "standard-d8", "guardian-d6"],
  },
  anansi: {
    id: "starter-anansi",
    name: "Threads of Fate",
    legend: "anansi",
    cards: ["silken-cut", "read-the-thread", "false-promise", "web-turn"],
    dice: ["trickster-d8", "standard-d6", "standard-d4"],
  },
  tengu: {
    id: "starter-tengu",
    name: "Edge of the Wind",
    legend: "tengu",
    cards: ["falling-leaf", "peak-strike", "watchful-blade", "meditate"],
    dice: ["tengu-d6-0", "standard-d8", "standard-d6"],
  },
  leshy: {
    id: "starter-leshy",
    name: "Into the Wild",
    legend: "leshy",
    cards: ["crooked-bough", "hollow-sign", "night-spores", "bramble-trap"],
    dice: ["leshy-d8-0", "standard-d8", "standard-d6"],
  },
  quetzalcoatl: {
    id: "starter-quetzalcoatl",
    name: "Dawn Ascending",
    legend: "quetzalcoatl",
    cards: ["first-light", "horizon", "dawn-shield", "quick-strike"],
    dice: ["quetzalcoatl-d10-0", "standard-d8", "standard-d6"],
  },
  maui: {
    id: "starter-maui",
    name: "Against the Tide",
    legend: "maui",
    cards: ["wavebreaker", "oakheart", "bramble-trap", "daring-feint"],
    dice: ["maui-d10-0", "standard-d8", "standard-d6"],
  },
};
export const STARTER_LEGENDS: LegendId[] = ["basajaun", "anansi"];
export const STARTER_CARDS = [
  ...new Set([
    ...STARTERS.basajaun.cards,
    ...STARTERS.anansi.cards,
    "quick-strike",
    "barkskin",
    "meditate",
    "deep-roots",
    "web-shift",
    "herensuge",
    "counterstrike",
    "hidden-meaning",
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
