import { GAME } from "./config";
import { requirementText } from "./terminology";
import { ALPHA_CARDS } from "./card-pool";
import { cardCompatible } from "./affinities";
import { legendById } from "./legends";
import type { CardDef, LegendId } from "../engine/types";
export const CARDS: CardDef[] = ALPHA_CARDS.map((c) => ({
  ...c,
  mechanicalVersion: GAME.version,
  requirementLabel: requirementText(c.requirement),
}));
export const cardById = Object.assign(
  Object.create(null),
  Object.fromEntries(CARDS.map((c) => [c.id, c])),
) as Record<string, CardDef>;
/** Legal access into the same shared pool, computed only from Affinity requirements. */
export const cardsFor = (id: LegendId) =>
  CARDS.filter((c) => cardCompatible(legendById[id], c));
