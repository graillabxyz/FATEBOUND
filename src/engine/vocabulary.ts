import type { Loadout, PlayerState, OmenResource, Hand } from "./types";
/** Views over the authoritative state, not a second combat model. Stored wire keys stay stable. */
export const loadoutPieces = (loadout: Loadout) => ({
  legend: loadout.legend,
  hand: loadout.cards as Hand,
  omens: loadout.dice,
});
export const battleResources = (player: PlayerState) => ({
  life: player.hp,
  ward: player.guard,
  focus: player.control,
  omens: player.dice as OmenResource[],
  heldOmens: player.dice.flatMap((omen, slot) =>
    omen.state === "HELD" ? [slot] : [],
  ),
});
export { applyControls as applyFocus, guardValue as wardValue } from "./rules";
