import type { CardRarity } from "../engine/types";
export const PACK_CONFIG = {
  id: "first-light-pair",
  name: "First Light · 2-Card booster",
  price: 160,
  duplicateCoins: 25,
  slots: [
    { common: 60, uncommon: 30, rare: 9, mythic: 1 },
    { common: 40, uncommon: 40, rare: 17, mythic: 3 },
  ] as Record<CardRarity, number>[],
};
export const CARD_COIN_PRICE: Record<CardRarity, number> = {
  common: 80,
  uncommon: 120,
  rare: 180,
  mythic: 240,
};
export const LEGEND_COIN_PRICE = 800;
export const OMEN_COIN_PRICE = 120;
export const PROGRESSION_PACKS = {
  matchesEvery: 10,
  masteryEvery: 800,
  firstWin: 1,
};
