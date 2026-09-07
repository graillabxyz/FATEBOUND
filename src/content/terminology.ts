import type { Face, Requirement, SymbolId } from "../engine/types";

/** Canonical game vocabulary. Wire-format IDs are translated here, never shown as rules text. */
export const GLOSSARY = [
  [
    "Legend",
    "Your main character. Always public and in play for the entire Match.",
  ],
  [
    "Hand",
    "Your four private Cards, selected before battle and reusable throughout the Match.",
  ],
  [
    "Card",
    "A reusable ability. Its identity becomes permanently known when first played.",
  ],
  [
    "Omen",
    "One of three fixed collectible dice in your Loadout. Its size and faces cannot be customized.",
  ],
  [
    "Value",
    "A numerical Omen result. Low, exact, or combined Values can matter as much as high Values.",
  ],
  [
    "Sigil",
    "A special ability face fixed to an Omen. Tap its icon to read its rules.",
  ],
  [
    "Void",
    "A blank face, shown as ○. Normally produces no Value; specific abilities may use it.",
  ],
  [
    "Focus",
    "Spend Focus to manipulate rolled Omens: Shift costs 1, Flip costs 2. Resets to 2 each Round.",
  ],
  [
    "Ward",
    "Temporary protection that absorbs damage before Life. Clears at the start of your next Turn.",
  ],
  [
    "Initiative",
    "Opening d20 + Legend Bonus determines who leads Round 1. Initiative alternates each Round.",
  ],
  ["Action", "An ability normally used during your own Turn."],
  [
    "Reaction",
    "An ability used in response to an opponent Action with eligible available or Held Omens.",
  ],
  [
    "Held Omen",
    "An unused rolled Omen kept for Reactions. Expires when its owner’s next Turn begins.",
  ],
  [
    "Loadout",
    "One Legend, a Hand of four Cards, and three Omens. Locked when the Match begins.",
  ],
] as const;
export type SigilDefinition = {
  id: SymbolId;
  name: string;
  icon: string;
  shortEffect: string;
  rulesText: string;
  effectId: string;
};
export const SIGILS: Record<SymbolId, SigilDefinition> = {
  guard: {
    id: "guard",
    name: "Ward Sigil",
    icon: "◇",
    shortEffect: "Convert this Omen into Ward.",
    rulesText:
      "Spends this Omen to gain its defined Ward amount. Can also satisfy an ability requiring a Ward Sigil.",
    effectId: "GUARD",
  },
  swap: {
    id: "swap",
    name: "Shift Sigil",
    icon: "⇄",
    shortEffect: "Powers eligible manipulation abilities.",
    rulesText:
      "Satisfies a Shift Sigil requirement, including Anansi’s Web Shift Reaction. The activated ability defines the redirect or movement; rolling the Sigil alone does not move an assignment.",
    effectId: "SWAP_ASSIGNMENT",
  },
  redirect: {
    id: "redirect",
    name: "Redirect Sigil",
    icon: "↪",
    shortEffect: "Powers eligible redirect abilities.",
    rulesText:
      "Use with an ability that accepts a Redirect Sigil or any face. The ability defines the target change; this face does not automatically redirect an Action.",
    effectId: "REDIRECT",
  },
  strike: {
    id: "strike",
    name: "Strike Sigil",
    icon: "✦",
    shortEffect: "Powers eligible attack abilities.",
    rulesText:
      "Satisfies a Strike Sigil requirement or any-face requirement. Damage comes from the activated ability.",
    effectId: "DAMAGE",
  },
  steal: {
    id: "steal",
    name: "Steal Sigil",
    icon: "↗",
    shortEffect: "Powers eligible resource abilities.",
    rulesText:
      "Satisfies a Steal Sigil requirement or any-face requirement. The activated ability determines what changes.",
    effectId: "LOSE_CONTROL",
  },
  smash: {
    id: "smash",
    name: "Smash Sigil",
    icon: "✹",
    shortEffect: "Powers eligible heavy attacks.",
    rulesText:
      "Satisfies a Smash Sigil requirement or any-face requirement. It is not a numerical Value.",
    effectId: "DAMAGE",
  },
};
export type OmenFaceKind = "VALUE" | "SIGIL" | "VOID";
export function omenFace(face: Face) {
  const sigil = face.effectId ? SIGILS[face.effectId] : undefined;
  return face.type === "number"
    ? {
        kind: "VALUE" as const,
        name: `Value ${face.value}`,
        icon: String(face.value),
        rulesText: "Use this Value to satisfy an ability requirement.",
      }
    : face.type === "blank"
      ? {
          kind: "VOID" as const,
          name: "Void",
          icon: "○",
          rulesText:
            "No Value. Cannot satisfy a standard numbered requirement.",
        }
      : {
          kind: "SIGIL" as const,
          name: sigil?.name ?? "Sigil",
          icon: sigil?.icon ?? "✦",
          rulesText:
            face.guardValue !== undefined
              ? `Spend this Omen to gain ${face.guardValue} Ward. ${sigil?.rulesText ?? ""}`
              : (sigil?.rulesText ?? ""),
        };
}
export function requirementText(r: Requirement): string {
  const base = r.symbol
    ? SIGILS[r.symbol].name
    : r.any
      ? `${r.count === 1 ? "Any Omen face" : `${r.count} Omen faces`}`
      : `${r.count > 1 ? `${r.count} Values totaling ` : "Value "}${r.exact !== undefined ? `exactly ${r.exact}` : r.min === r.max && r.min !== undefined ? `exactly ${r.min}` : r.max !== undefined ? `${r.min ?? 0}–${r.max}` : r.min !== undefined ? `${r.min}+` : "any number"}`;
  return [
    base,
    r.parity,
    r.size && `d${r.size}`,
    r.relationship && `${r.relationship} Values`,
    r.held && "Held Omens",
    r.initiative !== undefined &&
      (r.initiative ? "with Initiative" : "without Initiative"),
    r.control && `${r.control} Focus`,
  ]
    .filter(Boolean)
    .join(" · ");
}
/** Presentation adapter for legacy event/status/metric/phase identifiers. */
export function rulesLabel(id: string): string {
  return id
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\bDICE\b/gi, "Omens")
    .replace(/\bDIE\b/gi, "Omen")
    .replace(/\bGUARD\b/gi, "Ward")
    .replace(/\bCONTROL\b/gi, "Focus")
    .replace(/\bHP\b/g, "Life")
    .replace(/\bblank\b/gi, "Void")
    .replace(/\bsymbol\b/gi, "Sigil");
}
