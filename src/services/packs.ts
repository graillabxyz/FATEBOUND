import { CARDS } from "../content/cards";
import { PACK_CONFIG } from "../content/acquisition";
import { randomSource } from "../engine/fate";
import type { CardRarity } from "../engine/types";
export type PackReceipt = {
  id: string;
  cards: [string, string];
  duplicates: boolean[];
  coins: number;
  revealed: number;
};
/** Pure selection; the service persists this receipt before any reveal animation. */
export function rollPack(
  seed: number,
  owned: readonly string[],
  id: string,
): PackReceipt {
  const rng = randomSource(seed),
    picked: string[] = [],
    duplicates: boolean[] = [];
  for (const weights of PACK_CONFIG.slots) {
    let roll = rng() % 100,
      rarity: CardRarity = "mythic";
    for (const [r, w] of Object.entries(weights)) {
      if (roll < w) {
        rarity = r as CardRarity;
        break;
      }
      roll -= w;
    }
    const pool = CARDS.filter(
      (c) => c.rarity === rarity && !picked.includes(c.id),
    );
    const unowned = pool.filter((c) => !owned.includes(c.id)),
      options = unowned.length ? unowned : pool;
    const card = options[rng() % options.length];
    picked.push(card.id);
    duplicates.push(owned.includes(card.id));
  }
  return {
    id,
    cards: picked as [string, string],
    duplicates,
    coins: duplicates.filter(Boolean).length * PACK_CONFIG.duplicateCoins,
    revealed: 0,
  };
}
