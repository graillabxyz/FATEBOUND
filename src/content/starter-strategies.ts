import type { LegendId } from "../engine/types";
/** Shared-pool recipes teach a direction; they never restrict future Hands. */
export const STARTER_STRATEGIES: Record<
  LegendId,
  { name: string; sequence: string; counterplay: string }
> = {
  basajaun: {
    name: "Ward into pressure",
    sequence:
      "Oakheart prepares Ward and Empowered. Fell the Axe rewards keeping Ward; Crush commits two Omens. Hold a low Value for Root Ward.",
    counterplay:
      "Strip Ward before the payoff, or redirect the committed attack.",
  },
  anansi: {
    name: "Information and disruption",
    sequence:
      "Read the Thread exposes an unknown Card and restores Focus. Silken Cut pressures enemy Focus; False Promise breaks Ward. Reserve an exact 6 and 1 Focus for Web Turn. Your signature Swap Sigil offers another route through your Legend.",
    counterplay:
      "Use small attacks to bait the held response before committing multiple Omens.",
  },
  tengu: {
    name: "Precision and counters",
    sequence:
      "Meditate restores Focus. Low Values power Falling Leaf; combine Omens for Peak Strike or hold two for Watchful Blade. Shift toward a total of 5 for your Passive.",
    counterplay:
      "Pressure Focus and avoid committing your biggest attack into a held counter.",
  },
  leshy: {
    name: "Change the result",
    sequence:
      "Shift or Flip an Omen before paying Crooked Bough for its bonus. Hollow Sign converts a Void into a Flip and Focus. Hold a low Value for Bramble Counter.",
    counterplay:
      "Deny Focus or stop the modified-Omen payoff. Cleanse Poison before it ticks.",
  },
  quetzalcoatl: {
    name: "Sequence and momentum",
    sequence:
      "First Light prepares Empowered. Change ability categories for your Passive, then use Horizon as your third ability of the round. Dawn Shield keeps a response available.",
    counterplay:
      "Interrupt the prepared payoff; each setup spends an Omen that cannot defend.",
  },
  maui: {
    name: "Pressure while holding",
    sequence:
      "Daring Feint rewards leaving an Omen unused. Oakheart prepares Ward; Wavebreaker spends that protection for pressure. End with one held Omen for 2 Ward, and respond with Bramble Counter.",
    counterplay:
      "Break the Ward or pass a small attack to make the held resource expire.",
  },
};
