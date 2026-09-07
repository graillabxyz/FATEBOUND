import type { LegendId } from "../engine/types";
export type EmoteType =
  "TEXT" | "TEXT_ICON" | "ANIMATED" | "STICKER" | "LEGEND";
export type EmoteSource =
  | "default"
  | "season"
  | "achievement"
  | "mastery"
  | "rank"
  | "event"
  | "shop"
  | "bundle";
export type EmoteDefinition = {
  id: string;
  name: string;
  type: EmoteType;
  text: string;
  icon?: string;
  animationAsset?: string;
  animation?: "nod" | "spark" | "wave";
  rarity: "common" | "rare" | "epic" | "prestige" | "seasonal";
  source: EmoteSource;
  sourceLabel: string;
  legend?: LegendId;
  season?: string;
  sortOrder: number;
  price?: number;
  currency?: "coins" | "gems";
};
export const EMOTE_CONFIG = {
  slots: 5,
  cooldownMs: 4000,
  displayMs: 2600,
  replyDelayMs: 950,
} as const;
export const EMOTES: EmoteDefinition[] = [
  {
    id: "hey",
    name: "Hey!",
    type: "TEXT_ICON",
    text: "Hey!",
    icon: "✋",
    animation: "wave",
    rarity: "common",
    source: "default",
    sourceLabel: "Welcome collection",
    sortOrder: 0,
  },
  {
    id: "good-luck",
    name: "Good luck!",
    type: "TEXT",
    text: "Good luck!",
    rarity: "common",
    source: "default",
    sourceLabel: "Welcome collection",
    sortOrder: 1,
  },
  {
    id: "nice",
    name: "Nice!",
    type: "TEXT_ICON",
    text: "Nice!",
    icon: "✦",
    rarity: "common",
    source: "default",
    sourceLabel: "Welcome collection",
    sortOrder: 2,
  },
  {
    id: "good-game",
    name: "Good game!",
    type: "TEXT",
    text: "Good game!",
    rarity: "common",
    source: "default",
    sourceLabel: "Welcome collection",
    sortOrder: 3,
  },
  {
    id: "well-played",
    name: "Well played!",
    type: "TEXT",
    text: "Well played!",
    rarity: "common",
    source: "default",
    sourceLabel: "Welcome collection",
    sortOrder: 4,
  },
  {
    id: "nice-spark",
    name: "A little brilliance",
    type: "ANIMATED",
    text: "Nice!",
    icon: "✧",
    animation: "spark",
    rarity: "rare",
    source: "season",
    sourceLabel: "Season Path · free tier 4",
    season: "first-light",
    sortOrder: 5,
  },
  {
    id: "root-nod",
    name: "Ancient approval",
    type: "LEGEND",
    text: "Well played.",
    icon: "❧",
    animation: "nod",
    legend: "basajaun",
    rarity: "rare",
    source: "season",
    sourceLabel: "Season Path · free tier 12",
    season: "first-light",
    sortOrder: 6,
  },
  {
    id: "sun-salute",
    name: "Sun salute",
    type: "ANIMATED",
    text: "Brilliant!",
    icon: "☀",
    animation: "spark",
    rarity: "epic",
    source: "season",
    sourceLabel: "Season Path · premium tier 25",
    season: "first-light",
    sortOrder: 7,
  },
  {
    id: "first-light-emote",
    name: "First Light",
    type: "ANIMATED",
    text: "Until next time.",
    icon: "✺",
    animation: "wave",
    rarity: "seasonal",
    source: "season",
    sourceLabel: "Season Path · free tier 40",
    season: "first-light",
    sortOrder: 8,
  },
  {
    id: "first-victory",
    name: "First Blood",
    type: "TEXT_ICON",
    text: "A worthy match!",
    icon: "⚑",
    animation: "nod",
    rarity: "rare",
    source: "achievement",
    sourceLabel: "Win your first local ranked match",
    sortOrder: 9,
  },
  {
    id: "warden-emote",
    name: "Warden",
    type: "ANIMATED",
    text: "Standing strong.",
    icon: "⛨",
    animation: "spark",
    rarity: "prestige",
    source: "achievement",
    sourceLabel: "Absorb 500 damage with Ward",
    sortOrder: 10,
  },
  {
    id: "basajaun-master",
    name: "The forest remembers",
    type: "LEGEND",
    text: "You have my respect.",
    icon: "❧",
    animation: "nod",
    legend: "basajaun",
    rarity: "prestige",
    source: "achievement",
    sourceLabel: "Win 100 local ranked matches as Basajaun",
    sortOrder: 11,
  },
  {
    id: "respect",
    name: "Respect",
    type: "ANIMATED",
    text: "Respect.",
    icon: "♔",
    animation: "nod",
    rarity: "prestige",
    source: "rank",
    sourceLabel: "Reach local Mythic rank",
    sortOrder: 12,
  },
  {
    id: "old-friend",
    name: "Old friend",
    type: "LEGEND",
    text: "Welcome, old friend.",
    icon: "❦",
    animation: "wave",
    legend: "basajaun",
    rarity: "prestige",
    source: "mastery",
    sourceLabel: "Basajaun Mastery 10",
    sortOrder: 13,
  },
  {
    id: "moon-greeting",
    name: "Moon greeting",
    type: "TEXT_ICON",
    text: "A fine encounter.",
    icon: "☾",
    animation: "wave",
    rarity: "rare",
    source: "shop",
    sourceLabel: "Emporium · 150 Coins",
    price: 150,
    currency: "coins",
    sortOrder: 14,
  },
  {
    id: "bright-path",
    name: "Bright path",
    type: "ANIMATED",
    text: "Onward!",
    icon: "✵",
    animation: "spark",
    rarity: "epic",
    source: "bundle",
    sourceLabel: "Wayfarer greetings bundle · 250 Coins",
    sortOrder: 15,
  },
  {
    id: "festival",
    name: "Festival lantern",
    type: "ANIMATED",
    text: "May your path shine.",
    icon: "◈",
    animation: "spark",
    rarity: "seasonal",
    source: "event",
    sourceLabel: "Future Lantern Festival event",
    sortOrder: 16,
  },
];
export const emoteById: Record<string, EmoteDefinition> = Object.assign(
  Object.create(null),
  Object.fromEntries(EMOTES.map((e) => [e.id, e])),
);
export const DEFAULT_EMOTES = EMOTES.filter((e) => e.source === "default").map(
  (e) => e.id,
);
export const EMOTE_BUNDLES = [
  {
    id: "wayfarer-greetings",
    name: "Wayfarer greetings",
    emotes: ["moon-greeting", "bright-path"],
    price: 250,
    currency: "coins" as const,
  },
];
export const EMOTE_ACHIEVEMENTS = [
  {
    id: "first-blood",
    name: "First Blood",
    text: "Win your first local ranked match.",
    metric: "rankedWins",
    target: 1,
    emoteId: "first-victory",
  },
  {
    id: "warden",
    name: "Warden",
    text: "Absorb 500 incoming damage with Ward.",
    metric: "wardAbsorbed",
    target: 500,
    emoteId: "warden-emote",
  },
  {
    id: "basajaun-master",
    name: "Basajaun Master",
    text: "Win 100 local ranked matches as Basajaun.",
    metric: "basajaunRankedWins",
    target: 100,
    emoteId: "basajaun-master",
  },
] as const;
