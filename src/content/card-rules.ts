import type { CardDef, Effect, Status } from "../engine/types";
export const WARD_RULE =
  "Each point of Ward absorbs 1 damage before Life, then is consumed. Unused Ward expires at the start of your next turn.";
export function cardRuleDetails(card: CardDef) {
  const effects: Effect[] = [];
  const walk = (es: Effect[]) =>
    es.forEach((e) => {
      effects.push(e);
      if (e.effects) walk(e.effects);
    });
  walk(card.effects);
  const details = [
    `Spend ${card.requirement.count} ${card.requirement.count === 1 ? "Omen" : "Omens"}${card.requirement.control ? ` and ${card.requirement.control} Focus` : ""}. All paid Omens become Spent, even if the ability is stopped.`,
    "Resolves immediately. The Card stays in your Hand and can be used again with fresh, unspent Omens. It does not place a trap, ally or other object on the table.",
    "First use permanently reveals this Card to your opponent.",
  ];
  if (card.requirement.life)
    details.push(
      `Pay ${card.requirement.life} Life when declaring this ability, before the Reaction window. This cost is not refunded if canceled. You must have at least 1 Life left.`,
    );
  if (effects.some((e) => e.type === "GUARD")) details.push(WARD_RULE);
  if (effects.some((e) => e.type === "COUNTERSTRIKE"))
    details.push(
      "Counter damage happens after this attack damages your Life. Fully blocked or canceled attacks do not trigger it. An armed counter can resolve even if the attack is lethal.",
    );
  if (effects.some((e) => e.type === "CONDITIONAL"))
    details.push(
      "Conditions are checked as this ability starts resolving, before its effects change Life or Ward. Reactions resolve before the Action.",
    );
  if (effects.some((e) => e.status === "power"))
    details.push(
      "Empowered appears beside your Legend. It adds to the next damage effect once, then disappears. If unused, it expires at the end of your next turn.",
    );
  if (effects.some((e) => e.status === "poison"))
    details.push(
      "Poison appears beside the enemy Legend. At the start of their next turn they lose the stated Life once, then Poison disappears. This is Life loss, not an attack.",
    );
  if (effects.some((e) => e.type === "REDIRECT"))
    details.push(
      "Redirect swaps this Action’s player targets, including healing. Its original user still pays its costs.",
    );
  return details;
}
export function statusExplanation(s: Status) {
  return s.id === "power"
    ? `Empowered +${s.amount}: consumed by your next damage effect; expires at the end of your next turn.`
    : s.id === "poison"
      ? `Poison ${s.amount}: lose this much Life once at your next turn start.`
      : `${s.id} ${s.amount}: expires after round ${s.expiresRound}.`;
}
