export type Cosmetic = {
  id: string;
  name: string;
  kind: string;
  rarity: string;
  description: string;
  price: number;
  currency: "coins" | "gems";
  earned?: boolean;
  color: string;
  icon: string;
};
export const COSMETICS: Cosmetic[] = [
  {
    id: "carved",
    name: "Heartwood",
    kind: "Omen Skin",
    rarity: "COMMON",
    description: "Warm wood, worn by a thousand decisions.",
    price: 0,
    currency: "coins",
    color: "#af9063",
    icon: "dice",
  },
  {
    id: "obsidian",
    name: "Obsidian Fate",
    kind: "Omen Skin",
    rarity: "EPIC",
    description: "Volcanic glass. A quiet constellation within.",
    price: 350,
    currency: "gems",
    color: "#af9dd5",
    icon: "dice",
  },
  {
    id: "jade",
    name: "Jade Reverie",
    kind: "Omen Skin",
    rarity: "RARE",
    description: "Polished jade that catches the first light.",
    price: 800,
    currency: "coins",
    color: "#7fb8a6",
    icon: "dice",
  },
  {
    id: "first-light",
    name: "First Light",
    kind: "Card back",
    rarity: "SEASONAL",
    description: "The mark of those who were here at the beginning.",
    price: 150,
    currency: "gems",
    color: "#d7b674",
    icon: "sun",
  },
  {
    id: "forest-master",
    name: "Forest Eternal",
    kind: "Mastery frame",
    rarity: "EARNED PRESTIGE",
    description: "Reach Basajaun mastery 20. Earned through play.",
    price: 0,
    currency: "coins",
    earned: true,
    color: "#a3b890",
    icon: "leaf",
  },
  {
    id: "mythic",
    name: "The Unbroken",
    kind: "Rank title",
    rarity: "EARNED PRESTIGE",
    description: "Reach Mythic rank in an online season.",
    price: 0,
    currency: "coins",
    earned: true,
    color: "#dfc17d",
    icon: "crown",
  },
  {
    id: "dusk",
    name: "Dusk Sanctuary",
    kind: "Battlefield",
    rarity: "EPIC",
    description: "A still place between the last light and the stars.",
    price: 450,
    currency: "gems",
    color: "#b596b8",
    icon: "moon",
  },
  {
    id: "sunborn",
    name: "Sunborn",
    kind: "Legend palette",
    rarity: "EPIC",
    description: "Golden-hour light, woven into the guardian’s silhouette.",
    price: 600,
    currency: "gems",
    color: "#e5be78",
    icon: "sun",
  },
];
export type PathReward = {
  type: string;
  amount: number;
  label: string;
  id?: string;
};
export const PASS_REWARDS: {
  level: number;
  free: PathReward;
  premium: PathReward;
}[] = Array.from({ length: 50 }, (_, i) => ({
  level: i + 1,
  free:
    i % 10 === 4
      ? { type: "gems", amount: 20, label: "20 Gems" }
      : i % 5 === 2
        ? { type: "cosmetic", amount: 1, label: "First Light back" }
        : { type: "coins", amount: 50, label: "50 Coins" },
  premium:
    i % 5 === 4
      ? { type: "cosmetic", amount: 1, label: "Obsidian Omens" }
      : { type: "gems", amount: 25, label: "25 Gems" },
}));
export const QUESTS = [
  {
    id: "daily-play",
    period: "daily",
    name: "Answer the call",
    text: "Play 3 matches",
    metric: "matches",
    target: 3,
    xp: 75,
  },
  {
    id: "daily-guard",
    period: "daily",
    name: "Stand your ground",
    text: "Gain Ward 8 times",
    metric: "guards",
    target: 8,
    xp: 75,
  },
  {
    id: "daily-control",
    period: "daily",
    name: "Shape your fate",
    text: "Spend 6 Focus",
    metric: "control",
    target: 6,
    xp: 75,
  },
  {
    id: "daily-reveal",
    period: "daily",
    name: "Stories unfold",
    text: "Reveal 6 cards",
    metric: "reveals",
    target: 6,
    xp: 75,
  },
  {
    id: "weekly-play",
    period: "weekly",
    name: "A path well traveled",
    text: "Play 12 matches",
    metric: "matches",
    target: 12,
    xp: 300,
  },
  {
    id: "weekly-win",
    period: "weekly",
    name: "Earned, never given",
    text: "Win 6 matches",
    metric: "wins",
    target: 6,
    xp: 300,
  },
  {
    id: "weekly-reveal",
    period: "weekly",
    name: "Read between the lines",
    text: "Reveal 30 cards",
    metric: "reveals",
    target: 30,
    xp: 300,
  },
  {
    id: "season-mastery",
    period: "season",
    name: "A legend in the making",
    text: "Play 40 matches",
    metric: "matches",
    target: 40,
    xp: 1000,
  },
] as const;

for (const [level, track, id, label] of [
  [4, "free", "nice-spark", "Nice! · animated emote"],
  [12, "free", "root-nod", "Ancient approval · emote"],
  [25, "premium", "sun-salute", "Sun salute · emote"],
  [40, "free", "first-light-emote", "First Light · seasonal emote"],
] as const)
  PASS_REWARDS[level - 1][track] = { type: "emote", id, amount: 1, label };
