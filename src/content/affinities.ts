import type {
  AffinityId,
  AffinityRequirement,
  CardDef,
  Legend,
} from "../engine/types";
export const AFFINITIES: {
  id: AffinityId;
  name: string;
  symbol: string;
  description: string;
}[] = [
  {
    id: "might",
    name: "Might",
    symbol: "⚔",
    description: "Force, courage, pressure and breaking Ward.",
  },
  {
    id: "guile",
    name: "Guile",
    symbol: "⌁",
    description: "Bluffing, redirection and opportunism.",
  },
  {
    id: "wisdom",
    name: "Wisdom",
    symbol: "◉",
    description: "Foresight, precision, Focus and Omen planning.",
  },
  {
    id: "wild",
    name: "Wild",
    symbol: "♧",
    description: "Growth, beasts, adaptation and resilience.",
  },
  {
    id: "spirit",
    name: "Spirit",
    symbol: "✧",
    description: "Protection, ancestors, healing and persistence.",
  },
  {
    id: "shadow",
    name: "Shadow",
    symbol: "◐",
    description: "Curses, sacrifice, decay and Life exchanges.",
  },
  {
    id: "order",
    name: "Order",
    symbol: "▥",
    description: "Discipline, stable defense and controlled responses.",
  },
  {
    id: "chaos",
    name: "Chaos",
    symbol: "⤨",
    description: "Volatility, Sigils, Voids and risk conversion.",
  },
];
export const affinityById = Object.fromEntries(
  AFFINITIES.map((a) => [a.id, a]),
) as Record<AffinityId, (typeof AFFINITIES)[number]>;
export function meetsAffinity(
  owned: readonly AffinityId[],
  r: AffinityRequirement | null,
): boolean {
  if (r === null) return true;
  if ("affinity" in r) return owned.includes(r.affinity);
  if ("allOf" in r)
    return r.allOf.length > 0 && r.allOf.every((x) => meetsAffinity(owned, x));
  return r.anyOf.length > 0 && r.anyOf.some((x) => meetsAffinity(owned, x));
}
export function affinityText(r: AffinityRequirement | null): string {
  if (!r) return "Unbound";
  if ("affinity" in r) return affinityById[r.affinity].name;
  const op = "allOf" in r ? " AND " : " OR ",
    nodes = "allOf" in r ? r.allOf : r.anyOf;
  return nodes
    .map((x) => ("affinity" in x ? affinityText(x) : `(${affinityText(x)})`))
    .join(op);
}
export function affinityIds(r: AffinityRequirement | null): AffinityId[] {
  return !r
    ? []
    : "affinity" in r
      ? [r.affinity]
      : [...new Set(("allOf" in r ? r.allOf : r.anyOf).flatMap(affinityIds))];
}
export const cardCompatible = (legend: Legend, card: CardDef) =>
  meetsAffinity(legend.affinities, card.affinityRequirements);
export const cardCompatibilityReason = (legend: Legend, card: CardDef) =>
  cardCompatible(legend, card)
    ? "Compatible"
    : `Card incompatible. Requires ${affinityText(card.affinityRequirements)}. Your Legend: ${legend.affinities.map((id) => affinityById[id].name).join(" / ")}.`;
