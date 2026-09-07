import type { Loadout, LegendId } from "../engine/types";
import { LEGENDS } from "./legends";
import { cardsFor } from "./cards";
export const STARTERS: Record<LegendId, Loadout> = Object.fromEntries(
  LEGENDS.map((l) => [
    l.id,
    {
      id: `starter-${l.id}`,
      name: [
        "The Quiet Guardian",
        "Threads of Fate",
        "Edge of the Wind",
        "Into the Wild",
        "Dawn Ascending",
        "Against the Tide",
      ][l.artIndex],
      legend: l.id,
      cards: (l.id === "maui"
        ? [0, 1, 2, 4].map((i) => cardsFor(l.id)[i])
        : cardsFor(l.id).slice(0, 4)
      ).map((c) => c.id),
      dice: l.diceSlots.map((n, i) =>
        l.id === "anansi" && i === 0 ? "anansi-d8-0" : `standard-d${n}`,
      ),
    },
  ]),
) as Record<LegendId, Loadout>;
