import { GAME } from "./config";
import { requirementText } from "./terminology";
import type {
  CardDef,
  Category,
  Effect,
  LegendId,
  Requirement,
} from "../engine/types";
import { LEGENDS } from "./legends";
const LEGACY_CARD_NAMES: Record<string, string> = {
  "Feather Ward": "Feather Guard",
};
const dmg = (amount: number): Effect => ({ type: "DAMAGE", amount });
const guard = (amount: number): Effect => ({ type: "GUARD", amount });
const heal = (amount: number): Effect => ({ type: "HEAL", amount });
const power = (amount: number): Effect => ({
  type: "STATUS",
  status: "power",
  amount,
  duration: 1,
});
const when = (
  condition: Effect["condition"],
  ...effects: Effect[]
): Effect => ({ type: "CONDITIONAL", condition, effects });
const req = (min: number, max?: number): Requirement => ({
  count: 1,
  min,
  max,
});
const any: Requirement = { count: 1, any: true };
const two = (min: number): Requirement => ({ count: 2, min });
export const CARDS: CardDef[] = [];
function add(
  legend: LegendId,
  name: string,
  category: Category,
  requirement: Requirement,
  text: string,
  effects: Effect[],
  approach = 0,
  preferred?: number,
) {
  const l = LEGENDS.find((x) => x.id === legend)!;
  const label = requirementText(requirement);
  CARDS.push({
    id: `${legend}-${(LEGACY_CARD_NAMES[name] ?? name).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name,
    legend,
    category,
    timing: ["Ward", "Counter", "Manipulation"].includes(category)
      ? "REACTION"
      : "ACTION",
    requirement,
    requirementLabel: label,
    text,
    effects,
    priority: ["Ward", "Counter", "Manipulation"].includes(category) ? 20 : 40,
    preferred,
    archetype: l.approaches[approach],
    artIndex: l.artIndex,
    tags: [`legend:${legend}`, ...l.tags, category.toLowerCase()],
    mechanicalVersion: GAME.version,
  });
}
// Basajaun: shelter, retaliation, then stored force.
add("basajaun", "Crush", "Attack", req(7), "Deal 4 damage.", [dmg(4)], 2);
add("basajaun", "Ancient Root", "Ward", req(1, 3), "Gain 4 Ward.", [guard(4)]);
add(
  "basajaun",
  "Barkskin",
  "Counter",
  req(4, 6),
  "Gain 2 Ward. If the enemy attacks, deal 2 damage.",
  [guard(2), when("enemyAttacking", dmg(2))],
  1,
);
add(
  "basajaun",
  "Herensuge",
  "Finisher",
  two(12),
  "Deal 7 damage.",
  [dmg(7)],
  2,
);
add("basajaun", "Deep Roots", "Recovery", req(2, 4), "Heal 3 Life.", [heal(3)]);
add(
  "basajaun",
  "Oakheart",
  "Setup",
  req(4),
  "Gain 2 Ward. Store +2 damage for next round.",
  [guard(2), power(2)],
  2,
);
add(
  "basajaun",
  "Thorn Return",
  "Counter",
  req(3, 5),
  "If the enemy attacks, gain 2 Ward and deal 3 damage.",
  [when("enemyAttacking", guard(2), dmg(3))],
  1,
);
add(
  "basajaun",
  "Fell the Axe",
  "Attack",
  req(5),
  "Deal 3 damage. If guarding, deal 1 more.",
  [dmg(3), when("guarding", dmg(1))],
  1,
);
add(
  "basajaun",
  "Sanctuary",
  "Ward",
  { count: 1, symbol: "guard" },
  "Gain 6 Ward and cleanse all negative statuses.",
  [guard(6), { type: "CLEANSE" }],
);
add(
  "basajaun",
  "Mountain Weight",
  "Finisher",
  req(10),
  "Deal 6 damage.",
  [dmg(6)],
  2,
);
add("basajaun", "Quiet Grove", "Recovery", any, "Heal 1 Life. Gain 1 Ward.", [
  heal(1),
  guard(1),
]);
add(
  "basajaun",
  "Last Stand",
  "Attack",
  req(6),
  "Deal 3 damage. If behind in Life, deal 2 more.",
  [dmg(3), when("behind", dmg(2))],
  1,
);
// Anansi: readable predictions and assignment disruption.
add("anansi", "Silken Cut", "Attack", req(5), "Deal 3 damage.", [dmg(3)], 2);
add("anansi", "Web Shelter", "Ward", req(1, 3), "Gain 3 Ward.", [guard(3)]);
add(
  "anansi",
  "Read the Thread",
  "Prediction",
  req(4),
  "Deal 2 damage. If the enemy attacks, deal 2 more.",
  [dmg(2), when("enemyAttacking", dmg(2))],
  1,
);
add(
  "anansi",
  "Web Shift",
  "Manipulation",
  { count: 1, symbol: "swap" },
  "Swap the Omens on the first two enemy card assignments.",
  [{ type: "SWAP_ASSIGNMENT" }],
);
add(
  "anansi",
  "False Promise",
  "Prediction",
  req(3, 5),
  "If the enemy guards, deal 5 damage; otherwise deal 1.",
  [dmg(1), when("enemyGuarding", dmg(4))],
  1,
);
add(
  "anansi",
  "Unravel",
  "Manipulation",
  req(2, 3),
  "Cancel the declared enemy action, including healing.",
  [{ type: "CANCEL" }],
);
add(
  "anansi",
  "Borrowed Time",
  "Setup",
  req(2, 4),
  "Gain 2 Ward. Store +1 damage for next round.",
  [guard(2), power(1)],
  2,
);
add(
  "anansi",
  "Spider’s Patience",
  "Recovery",
  req(1, 2),
  "Heal 3 Life.",
  [heal(3)],
  1,
);
add(
  "anansi",
  "Tangled Path",
  "Manipulation",
  two(8),
  "Swap the Omens on the first two enemy card assignments.",
  [{ type: "SWAP_ASSIGNMENT" }],
);
add(
  "anansi",
  "Story’s End",
  "Finisher",
  two(11),
  "Deal 6 damage. Deal 1 more if an enemy card is known.",
  [dmg(6), when("knownEnemy", dmg(1))],
  1,
);
add("anansi", "Needle Truth", "Attack", req(7), "Deal 4 damage.", [dmg(4)], 2);
add(
  "anansi",
  "Hidden Meaning",
  "Counter",
  any,
  "Gain 1 Ward. If the enemy attacks, deal 1 damage.",
  [guard(1), when("enemyAttacking", dmg(1))],
);
// Tengu: authored preferred values reward precision.
add(
  "tengu",
  "Gale Cut",
  "Attack",
  req(5),
  "Deal 3 damage. Exact 5: +1 damage.",
  [dmg(3)],
  0,
  5,
);
add("tengu", "Feather Ward", "Ward", req(1, 3), "Gain 3 Ward.", [guard(3)], 1);
add(
  "tengu",
  "Perfect Riposte",
  "Counter",
  req(4, 6),
  "Gain 2 Ward. If attacked, deal 2 damage. Exact 5: +1.",
  [guard(2), when("enemyAttacking", dmg(2))],
  1,
  5,
);
add(
  "tengu",
  "Sky Sever",
  "Finisher",
  two(11),
  "Deal 6 damage. Exact total 12: +1 damage.",
  [dmg(6)],
  0,
  12,
);
add(
  "tengu",
  "First Wind",
  "Attack",
  req(2, 4),
  "Deal 2 damage. Exact 3: +1 damage.",
  [dmg(2)],
  2,
  3,
);
add(
  "tengu",
  "Still Mind",
  "Recovery",
  req(2, 3),
  "Heal 2 Life and cleanse negative statuses.",
  [heal(2), { type: "CLEANSE" }],
  1,
);
add(
  "tengu",
  "Raven Wing",
  "Manipulation",
  { count: 1, symbol: "redirect" },
  "Reduce the first enemy damage effect by 4.",
  [{ type: "BLOCK_EFFECT", amount: 4 }],
  1,
);
add(
  "tengu",
  "Peak Strike",
  "Attack",
  req(7),
  "Deal 4 damage. Exact 7: +1 damage.",
  [dmg(4)],
  0,
  7,
);
add(
  "tengu",
  "Windstep",
  "Setup",
  any,
  "Gain 1 Ward. Store +1 damage for next round.",
  [guard(1), power(1)],
  2,
);
add(
  "tengu",
  "Watchful Blade",
  "Prediction",
  req(5, 7),
  "If the enemy attacks, deal 5 damage.",
  [when("enemyAttacking", dmg(5))],
  1,
  6,
);
add("tengu", "Mountain Silence", "Ward", req(8), "Gain 5 Ward.", [guard(5)], 1);
add(
  "tengu",
  "Falling Leaf",
  "Attack",
  req(1, 2),
  "Deal 2 damage. Exact 1: +1 damage.",
  [dmg(2)],
  2,
  1,
);
// Leshy: broad, flexible bands with a single once-per-round tolerance.
add("leshy", "Branch Lash", "Attack", req(5, 8), "Deal 4 damage.", [dmg(4)]);
add(
  "leshy",
  "Moss Mantle",
  "Ward",
  req(1, 3),
  "Gain 3 Ward and heal 1 Life.",
  [guard(3), heal(1)],
  1,
);
add(
  "leshy",
  "Wolf Shape",
  "Attack",
  req(7),
  "Deal 3 damage. If behind in Life, deal 2 more.",
  [dmg(3), when("behind", dmg(2))],
  1,
);
add(
  "leshy",
  "Lost Path",
  "Manipulation",
  req(4, 6),
  "Reduce the first enemy damage effect by 3.",
  [{ type: "BLOCK_EFFECT", amount: 3 }],
  2,
);
add(
  "leshy",
  "New Skin",
  "Recovery",
  req(3, 5),
  "Heal 3 Life and cleanse negative statuses.",
  [heal(3), { type: "CLEANSE" }],
  1,
);
add("leshy", "Elk Shape", "Ward", req(7, 9), "Gain 5 Ward.", [guard(5)], 1);
add(
  "leshy",
  "Bramble Trap",
  "Counter",
  req(2, 4),
  "If the enemy attacks, gain 2 Ward and deal 2 damage.",
  [when("enemyAttacking", guard(2), dmg(2))],
  2,
);
add(
  "leshy",
  "Forest Echo",
  "Setup",
  any,
  "Gain 1 Ward. Store +1 damage for next round.",
  [guard(1), power(1)],
);
add(
  "leshy",
  "Deepwood",
  "Finisher",
  two(10),
  "Deal 6 damage and heal 1 Life.",
  [dmg(6), heal(1)],
);
add(
  "leshy",
  "Wild Bloom",
  "Recovery",
  { count: 1, symbol: "guard" },
  "Heal 4 Life and gain 2 Ward.",
  [heal(4), guard(2)],
  1,
);
add("leshy", "Crooked Bough", "Attack", req(3, 4), "Deal 3 damage.", [dmg(3)]);
add(
  "leshy",
  "Night Spores",
  "Setup",
  req(6),
  "Enemy takes 2 damage next round. Gain 1 Ward.",
  [
    {
      type: "STATUS",
      status: "poison",
      target: "enemy",
      amount: 2,
      duration: 1,
    },
    guard(1),
  ],
  2,
);
// Quetzalcoatl: category chains and explicit conversion costs.
add("quetzalcoatl", "Sun Lance", "Attack", req(6), "Deal 4 damage.", [dmg(4)]);
add("quetzalcoatl", "Feather Aegis", "Ward", req(1, 3), "Gain 3 Ward.", [
  guard(3),
]);
add(
  "quetzalcoatl",
  "First Light",
  "Setup",
  req(2, 5),
  "Heal 1 Life. Store +1 damage for next round.",
  [heal(1), power(1)],
  1,
);
add(
  "quetzalcoatl",
  "Solar Ascent",
  "Finisher",
  two(12),
  "Deal 7 damage.",
  [dmg(7)],
  2,
);
add("quetzalcoatl", "Jade Breath", "Recovery", req(3, 5), "Heal 3 Life.", [
  heal(3),
]);
add("quetzalcoatl", "Skyfire", "Attack", req(9), "Deal 5 damage.", [dmg(5)], 1);
add(
  "quetzalcoatl",
  "Offering",
  "Setup",
  any,
  "Spend 2 Life. Store +3 damage for next round.",
  [{ type: "CONVERT", from: "hp", amount: 2, effects: [power(3)] }],
  2,
);
add(
  "quetzalcoatl",
  "Dawn Shield",
  "Counter",
  req(4),
  "Gain 2 Ward. If the enemy attacks, deal 1 damage.",
  [guard(2), when("enemyAttacking", dmg(1))],
);
add(
  "quetzalcoatl",
  "Radiant Coil",
  "Attack",
  { count: 1, symbol: "strike" },
  "Deal 5 damage and heal 1 Life.",
  [dmg(5), heal(1)],
  1,
);
add(
  "quetzalcoatl",
  "Open Sky",
  "Manipulation",
  req(5, 7),
  "Reduce the first enemy damage effect by 2. Gain 1 Ward.",
  [{ type: "BLOCK_EFFECT", amount: 2 }, guard(1)],
);
add(
  "quetzalcoatl",
  "Burning Crown",
  "Finisher",
  req(10),
  "Spend 2 Life to deal 7 damage.",
  [{ type: "CONVERT", from: "hp", amount: 2, effects: [dmg(7)] }],
  2,
);
add(
  "quetzalcoatl",
  "Horizon",
  "Prediction",
  req(5),
  "Deal 2 damage. With three actions, deal 2 more.",
  [dmg(2), when("threeActions", dmg(2))],
  1,
);
// Māui: unused-die gambits and visible comeback conditions.
add(
  "maui",
  "Hook Strike",
  "Attack",
  req(5),
  "Deal 3 damage. If behind in Life, deal 1 more.",
  [dmg(3), when("behind", dmg(1))],
);
add("maui", "Ocean Shelter", "Ward", req(1, 3), "Gain 3 Ward.", [guard(3)], 2);
add(
  "maui",
  "Daring Feint",
  "Attack",
  req(4, 7),
  "Deal 3 damage. With an unused Omen, deal 2 more.",
  [dmg(3), when("unusedDie", dmg(2))],
  1,
);
add(
  "maui",
  "Snare the Sun",
  "Finisher",
  two(12),
  "Deal 7 damage.",
  [dmg(7)],
  1,
);
add(
  "maui",
  "Turnabout",
  "Counter",
  req(3, 5),
  "Gain 2 Ward. If behind in Life, deal 3 damage.",
  [guard(2), when("behind", dmg(3))],
  2,
);
add(
  "maui",
  "Rising Tide",
  "Recovery",
  req(2, 4),
  "Heal 2 Life. If behind in Life, heal 1 more.",
  [heal(2), when("behind", heal(1))],
  2,
);
add(
  "maui",
  "Stolen Tempo",
  "Manipulation",
  { count: 1, symbol: "steal" },
  "Reduce the first enemy damage effect by 3. Gain 2 Ward.",
  [{ type: "BLOCK_EFFECT", amount: 3 }, guard(2)],
);
add("maui", "Island Pull", "Attack", req(8), "Deal 5 damage.", [dmg(5)], 1);
add(
  "maui",
  "Rope Trick",
  "Manipulation",
  req(6),
  "Swap the Omens on the first two enemy card assignments.",
  [{ type: "SWAP_ASSIGNMENT" }],
);
add(
  "maui",
  "Bold Wager",
  "Setup",
  any,
  "Spend 1 Life. Store +2 damage for next round.",
  [{ type: "CONVERT", from: "hp", amount: 1, effects: [power(2)] }],
  1,
);
add(
  "maui",
  "Wavebreaker",
  "Attack",
  req(5, 6),
  "Convert up to 3 Ward into damage, then deal 2 damage.",
  [
    {
      type: "CONVERT",
      from: "guard",
      amount: 3,
      effects: [{ type: "DAMAGE", amount: 1 }],
    },
    dmg(2),
  ],
);
add(
  "maui",
  "Against the Current",
  "Prediction",
  req(4),
  "Deal 2 damage. If the enemy guards, deal 2 more.",
  [dmg(2), when("enemyGuarding", dmg(2))],
  2,
);
// Turn-rule content migration: defensive counters resolve after actual attack damage;
// assignment exchanges now redirect the one declared action.
const migrate = (effects: Effect[]): Effect[] =>
  effects.map((e) => ({
    ...e,
    type: e.type === "SWAP_ASSIGNMENT" ? "REDIRECT" : e.type,
    effects: e.effects ? migrate(e.effects) : undefined,
  }));
for (const card of CARDS) {
  // Predictions about an incoming attack need an actual opposing declaration.
  if (
    card.category === "Prediction" &&
    card.effects.some((e) => e.condition === "enemyAttacking")
  )
    card.timing = "REACTION";
  card.priority = card.timing === "REACTION" ? 20 : 40;
  card.effects = migrate(card.effects);
  if (card.category === "Counter") {
    const counter = (es: Effect[]): Effect[] =>
      es.map((e) => ({
        ...e,
        type: e.type === "DAMAGE" ? "COUNTERSTRIKE" : e.type,
        effects: e.effects ? counter(e.effects) : undefined,
      }));
    card.effects = counter(card.effects);
    card.text += " Counter damage occurs after you receive attack damage.";
  }
  if (card.effects.some((e) => e.type === "REDIRECT"))
    card.text = "Redirect the declared enemy action back to its user.";
}
add("basajaun", "Quick Strike", "Attack", req(1, 3), "Deal 2 damage.", [
  dmg(2),
]);
add(
  "anansi",
  "Web Turn",
  "Manipulation",
  req(6, 6),
  "Redirect the declared enemy action back to its user.",
  [{ type: "REDIRECT" }],
);
add(
  "tengu",
  "Precision Cut",
  "Attack",
  req(5, 5),
  "Deal 3 damage; ignore 1 Ward.",
  [{ type: "DAMAGE", amount: 3, guardPierce: 1 }],
);
add(
  "basajaun",
  "Counterstrike",
  "Counter",
  req(8),
  "After receiving attack damage, deal 2 damage back.",
  [{ type: "COUNTERSTRIKE", amount: 2 }],
);

add(
  "quetzalcoatl",
  "Ritual",
  "Setup",
  { count: 2, exact: 10, min: 10, max: 10 },
  "Two Omens totaling exactly 10: heal 4 and gain 2 Ward.",
  [heal(4), guard(2)],
);
export const cardById = Object.fromEntries(
  CARDS.map((c) => [c.id, c]),
) as Record<string, CardDef>;
export const cardsFor = (id: LegendId) => CARDS.filter((c) => c.legend === id);
