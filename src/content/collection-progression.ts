import { OMENS, omenById } from "./omens";
import { STARTERS } from "./loadouts";
import { LEGENDS } from "./legends";
import { cardsFor } from "./cards";
import { dieCompatible, validateLoadout } from "../engine/rules";
import type { LegendId, Loadout } from "../engine/types";

export const OMEN_JOURNEY = {
  milestones: [10, 25, 45, 70],
  signatureCoins: 600,
  signatureGems: 240,
  numberedCoins: 120,
} as const;
/** Authored earned surprise, never a random incentive attached to a purchase. */
export const LEGEND_BONUS_MILESTONES: readonly number[] = [15];
export const signatureFor = (legend: LegendId) =>
  STARTERS[legend].dice.find((id) => omenById[id].tags.includes("signature"))!;
export const omenPrice = (id: string) =>
  omenById[id]?.tags.includes("signature")
    ? OMEN_JOURNEY.signatureCoins
    : OMEN_JOURNEY.numberedCoins;
export type CollectionItem =
  | { kind: "legend"; id: LegendId }
  | { kind: "omen" | "card"; id: string }
  | { kind: "booster"; amount: 1 };
export type AcquisitionReceipt = {
  id: string;
  source: string;
  items: CollectionItem[];
  bonusOmen?: string;
  currency?: "coins" | "gems";
  cost?: number;
};
export const availableOmenMilestones = (p: {
  matches: number;
  omenJourneyClaims: number[];
}) =>
  OMEN_JOURNEY.milestones.filter(
    (m) => p.matches >= m && !p.omenJourneyClaims.includes(m),
  );
export const unownedSignatures = (owned: string[]) =>
  OMENS.filter((d) => d.tags.includes("signature") && !owned.includes(d.id));

/** Build using existing entitlements only. Curated starter recipes are aspirational. */
export function ownedLegendLoadout(
  legend: LegendId,
  ownedCards: string[],
  ownedOmens: string[],
): Loadout {
  const recipe = STARTERS[legend];
  const legal = cardsFor(legend).filter((c) => ownedCards.includes(c.id));
  const cards = [
    ...new Set([
      ...recipe.cards.filter((id) => legal.some((c) => c.id === id)),
      ...legal.map((c) => c.id),
    ]),
  ].slice(0, 4);
  const candidates = OMENS.filter(
    (d) => ownedOmens.includes(d.id) && dieCompatible(recipe, d.id),
  );
  const dice: string[] = [];
  for (const desired of recipe.dice) {
    const choice =
      candidates.find((d) => d.id === desired && !dice.includes(d.id)) ??
      candidates.find(
        (d) =>
          d.tags.includes("standard") &&
          d.size === omenById[desired].size &&
          !dice.includes(d.id),
      ) ??
      candidates
        .filter((d) => !dice.includes(d.id))
        .sort(
          (a, b) =>
            +b.tags.includes("standard") - +a.tags.includes("standard") ||
            Math.abs(a.size - omenById[desired].size) -
              Math.abs(b.size - omenById[desired].size),
        )[0];
    if (choice) dice.push(choice.id);
  }
  const loadout = {
    ...recipe,
    name: `${LEGENDS.find((l) => l.id === legend)!.name} · Your collection`,
    cards,
    dice,
  };
  validateLoadout(loadout, new Set([legend, ...ownedCards, ...ownedOmens]));
  return loadout;
}
