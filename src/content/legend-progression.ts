import type { LegendId } from "../engine/types";

/** Acquisition tuning only; these values never enter the match engine. */
export const LEGEND_JOURNEY = {
  milestones: [5, 15, 30, 50],
  gemPrice: 300,
  completeCollectionCoins: 200,
} as const;
export type LegendUnlockSource =
  "starter" | "journey" | "coins" | "gems" | "legacy";
export type LegendUnlockRecord = {
  source: LegendUnlockSource;
  milestone?: number;
};
export type LegendProgress = {
  matches: number;
  legendJourneyClaims: number[];
  ownedLegends: LegendId[];
};
export function legendJourney(p: LegendProgress) {
  const available = LEGEND_JOURNEY.milestones.filter(
    (m) => p.matches >= m && !p.legendJourneyClaims.includes(m),
  );
  const next = LEGEND_JOURNEY.milestones.find((m) => p.matches < m);
  return { available, next, remaining: next ? next - p.matches : 0 };
}
