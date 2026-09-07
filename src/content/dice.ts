import type { DieDef, DieSize, Face, SymbolId } from "../engine/types";
import { LEGENDS } from "./legends";
export const SIZES: DieSize[] = [4, 6, 8, 10, 12, 20];
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
  }[id],
  balanceWeight: weight,
});
const blank: Face = {
  type: "blank",
  value: 0,
  displayIcon: "—",
  balanceWeight: 0,
};
export const DICE: DieDef[] = SIZES.map((size) => ({
  id: `standard-d${size}`,
  name: `Carved D${size}`,
  size,
  faceCount: size,
  faces: Array.from({ length: size }, (_, i) => numeric(i + 1)),
  opposites: Array.from({ length: size }, (_, i) => size - 1 - i),
  tags: ["standard"],
  compatibleLegendTags: ["all"],
  rarity: "common",
  mechanicalVersion: 1,
  description: "Ordered numbers. Dependable, adaptable, yours to shape.",
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
    faces[Math.floor(size / 2) - 1] = numeric(1);
    DICE.push({
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
      mechanicalVersion: 1,
      description: `Trade a blank and lower numbers for ${effect}. Flip the blank to reach the symbol.`,
    });
  });
});
export const dieById = Object.fromEntries(DICE.map((d) => [d.id, d])) as Record<
  string,
  DieDef
>;
export function dieBudget(d: DieDef) {
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
