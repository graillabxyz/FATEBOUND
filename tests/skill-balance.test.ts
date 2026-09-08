import { scorePlanDetails } from "../src/engine/ai";
import { describe, it, expect } from "vitest";
import {
  createMatch,
  advance,
  lockPlan,
  projectMatch,
} from "../src/engine/match";
import { EMPTY_PLAN, conditionMatches } from "../src/engine/rules";
import { decisionContext } from "../src/engine/match";
import { STARTERS } from "../src/content/loadouts";
import { STARTER_STRATEGIES } from "../src/content/starter-strategies";
import { CARDS } from "../src/content/cards";
import type { MatchState, Effect } from "../src/engine/types";
function ready(cards: string[]) {
  const s = createMatch(
    9,
    [
      {
        ...STARTERS.anansi,
        cards,
        dice: ["standard-d6", "standard-d6", "standard-d6"],
      },
      STARTERS.basajaun,
    ],
    undefined,
    { initiativeWinner: 0 },
  );
  while (s.phase !== "MAIN_ACTION") {
    if (s.phase === "OMEN_CHOICE")
      lockPlan(s, 0, { ...EMPTY_PLAN, omenSlots: [0] });
    else advance(s);
  }
  s.players[0].dice.forEach((d) => (d.state = "AVAILABLE"));
  s.players[0].faces = [2, 2, 2];
  return s;
}
function use(s: MatchState, id: string, slot = 0) {
  lockPlan(s, 0, { controls: [], assignments: [{ target: id, dice: [slot] }] });
  advance(s);
  lockPlan(s, 1, EMPTY_PLAN);
  while (s.phase !== "MAIN_ACTION" && s.phase !== "MATCH_END") advance(s);
}
describe("v9 tactical costs and interactions", () => {
  it("reveals one unknown enemy Card permanently without consuming it", () => {
    const s = ready(STARTERS.anansi.cards);
    const cards = [...s.players[1].loadout.cards];
    expect(
      projectMatch(s, 0).players[1].loadout.cards.every((c) => c === null),
    ).toBe(true);
    use(s, "read-the-thread");
    expect(s.players[1].known).toEqual([cards[0]]);
    use(s, "read-the-thread", 1);
    expect(s.players[1].known).toEqual(cards.slice(0, 2));
    expect(s.players[1].loadout.cards).toEqual(cards);
    expect(projectMatch(s, 0).players[1].loadout.cards[0]).toBe(cards[0]);
  });
  it("removes Ward before damage but does not turn excess removal into damage", () => {
    for (const ward of [0, 1, 2, 3]) {
      const s = ready(STARTERS.anansi.cards);
      s.players[1].guard = ward;
      const hp = s.players[1].hp;
      use(s, "false-promise");
      expect(s.players[1].hp).toBe(hp - (ward > 0 && ward <= 2 ? 1 : 0));
      expect(s.players[1].guard).toBe(0);
    }
  });
  it("limits Silken Cut Focus denial to the first ability in the round", () => {
    const s = ready(STARTERS.anansi.cards);
    s.players[1].control = 2;
    use(s, "silken-cut");
    expect(s.players[1].control).toBe(1);
    use(s, "silken-cut", 1);
    expect(s.players[1].control).toBe(1);
  });
  it("requires the paid Omen itself to be modified", () => {
    const s = ready(STARTERS.anansi.cards);
    const plan = {
      controls: [],
      assignments: [{ target: "silken-cut", dice: [0] }],
    };
    s.players[0].dice[1].modified = true;
    expect(conditionMatches("modifiedOmen", decisionContext(s, 0), plan)).toBe(
      false,
    );
    s.players[0].dice[0].modified = true;
    expect(conditionMatches("modifiedOmen", decisionContext(s, 0), plan)).toBe(
      true,
    );
  });
  it("ties unconditional large damage to multi-Omen costs across all Cards", () => {
    for (const c of CARDS) {
      const immediate = c.effects
        .filter((e) => e.type === "DAMAGE" || e.type === "COUNTERSTRIKE")
        .reduce((n, e) => n + (e.amount ?? 0), 0);
      if (immediate >= 4)
        expect(c.requirement.count, c.id).toBeGreaterThanOrEqual(2);
      if (immediate >= 5) expect(c.requirement.count, c.id).toBe(3);
      // This checks base effects. Paid Empowered, conditional bonuses, and Legend passives remain explicit synergies.
      const visit = (es: Effect[]) =>
        es.forEach((e) => {
          if (e.amount !== undefined)
            expect(e.amount, c.id).toBeGreaterThanOrEqual(0);
          if (e.effects) visit(e.effects);
        });
      visit(c.effects);
    }
    expect(Object.keys(STARTER_STRATEGIES)).toHaveLength(6);
  });
});

it("AI prices publicly known redirects but cannot read an unrevealed Hand", () => {
  const s = ready(STARTERS.anansi.cards);
  s.players[0].loadout = {
    ...STARTERS.basajaun,
    cards: ["crush", "root-ward", "barkskin", "herensuge"],
    dice: ["standard-d6", "standard-d6", "standard-d6"],
  };
  s.players[0].faces = [2, 2, 2];
  s.players[1].loadout = structuredClone(STARTERS.anansi);
  s.players[1].loadout.cards[3] = "web-turn";
  s.players[1].loadout.dice = ["standard-d6", "standard-d6", "standard-d6"];
  s.players[1].faces = [5, 0, 0];
  s.players[1].dice[0].state = "HELD";
  s.players[1].control = 2;
  const plan = {
    controls: [],
    assignments: [{ target: "crush", dice: [0, 1] }],
  };
  const hidden = scorePlanDetails(decisionContext(s, 0), plan);
  expect(hidden.knownReactionRisk).toBe(0);
  s.players[1].known = ["web-turn"];
  const known = scorePlanDetails(decisionContext(s, 0), plan);
  expect(known.knownReactionRisk).toBeGreaterThan(0);
  expect(known.overall).toBeLessThan(hidden.overall);
  s.players[1].control = 0;
  expect(scorePlanDetails(decisionContext(s, 0), plan).knownReactionRisk).toBe(
    0,
  );
});
