import { GAME } from "./config";
import { SIGILS } from "./terminology";
import type { OmenDefinition, OmenSize, Face, SymbolId } from "../engine/types";
import { LEGENDS } from "./legends";
export const SIZES: OmenSize[] = [4, 6, 8, 10, 12, 20];
const numeric = (n: number): Face => ({
  type: "number",
  value: n,
  displayIcon: String(n),
  balanceWeight: n / 2,
});
const symbol = (id: SymbolId, weight: number): Face => ({
  type: "symbol",
  value: 0,
  effectId: id,
  displayIcon: {
    guard: "◇",
    strike: "✦",
    swap: "⇄",
    steal: "↗",
    redirect: "↪",
    smash: "✦",
  }[id],
  balanceWeight: weight,
  guardValue: id === "guard" ? 3 : undefined,
  tags: [id === "guard" ? "Ward" : SIGILS[id].name],
});
const blank: Face = {
  type: "blank",
  value: 0,
  displayIcon: "○",
  balanceWeight: 0,
};
export const OMENS: OmenDefinition[] = SIZES.map((size) => ({
  id: `standard-d${size}`,
  name: (
    {
      4: "Silent Step",
      6: "Iron Path",
      8: "Mountain Wind",
      10: "Sun Coil",
      12: "Old Root",
      20: "Star Pilgrim",
    } as const
  )[size],
  size,
  faceCount: size,
  faces: Array.from({ length: size }, (_, i) => numeric(i + 1)),
  opposites: Array.from({ length: size }, (_, i) => size - 1 - i),
  tags: ["standard"],
  compatibleLegendTags: ["all"],
  rarity: "common",
  mechanicalVersion: GAME.version,
  description:
    "Fixed Values. A clear probability profile for precise Loadout choices.",
}));
LEGENDS.forEach((l) => {
  const first = l.diceSlots[0],
    second = l.diceSlots[1];
  [first, second].forEach((size, j) => {
    const faces = Array.from({ length: size }, (_, i) => numeric(i + 1));
    const effect: SymbolId =
      l.id === "anansi"
        ? "swap"
        : l.id === "tengu"
          ? "redirect"
          : l.id === "maui"
            ? "steal"
            : j === 0
              ? "guard"
              : "strike";
    faces[0] = { ...blank };
    faces[size - 1] = symbol(effect, 3);
    faces[size - 2] = { ...blank };
    OMENS.push({
      id: `${l.id}-d${size}-${j}`,
      name: [
        ["Heartwood", "Rootstone"],
        ["Webspinner", "Storyweaver"],
        ["Gale-forged", "Ravenbone"],
        ["Shifting Bark", "Mistwood"],
        ["Sunstone", "Jade Feather"],
        ["Tidecarved", "Sunhook"],
      ][l.artIndex][j],
      size,
      faceCount: size,
      faces,
      opposites: Array.from({ length: size }, (_, i) => size - 1 - i),
      tags: [...l.tags, "utility"],
      compatibleLegendTags: l.tags,
      rarity: "rare",
      mechanicalVersion: GAME.version,
      description: `Trade two numbered faces for Voids and a third for ${SIGILS[effect].name}. Flip the Void to reach the Sigil.`,
    });
  });
});
const fixed = (
  id: string,
  name: string,
  size: OmenSize,
  faces: Face[],
  tags: string[],
) =>
  OMENS.push({
    id,
    name,
    size,
    faceCount: size,
    faces,
    opposites: Array.from({ length: size }, (_, i) => size - 1 - i),
    tags,
    compatibleLegendTags: ["all"],
    rarity: "rare",
    mechanicalVersion: GAME.version,
    description:
      "Fixed collectible faces. Sigils replace numbers; Voids pay for utility.",
  });
fixed(
  "guardian-d6",
  "Warden’s Oath",
  6,
  [
    { ...blank },
    numeric(2),
    numeric(3),
    numeric(4),
    { ...blank },
    symbol("guard", 3),
  ],
  ["Ward", "Defense"],
);
fixed(
  "trickster-d8",
  "Spider’s Gambit",
  8,
  [
    numeric(1),
    numeric(2),
    { ...blank },
    numeric(4),
    numeric(5),
    symbol("swap", 3),
    { ...blank },
    symbol("redirect", 3),
  ],
  ["trickster"],
);
fixed(
  "giant-d12",
  "Mountain Heart",
  12,
  [
    { ...blank },
    { ...blank },
    ...Array.from({ length: 8 }, (_, i) => numeric(i + 3)),
    { ...blank },
    symbol("smash", 4),
  ],
  ["giant"],
);
export const omenById = Object.fromEntries(
  OMENS.map((d) => [d.id, d]),
) as Record<string, OmenDefinition>;
export function omenBudget(d: OmenDefinition) {
  const mean = d.faces.reduce((s, f) => s + f.balanceWeight, 0) / d.size;
  return {
    id: d.id,
    mean,
    variance:
      d.faces.reduce((s, f) => s + (f.balanceWeight - mean) ** 2, 0) / d.size,
    blankShare: d.faces.filter((f) => f.type === "blank").length / d.size,
    oppositeGain: Math.max(
      ...d.faces.map(
        (f, i) => d.faces[d.opposites[i]].balanceWeight - f.balanceWeight,
      ),
    ),
  };
}
