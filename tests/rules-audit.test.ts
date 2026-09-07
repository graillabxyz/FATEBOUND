import { describe, it, expect } from "vitest";
import { createMatch, advance, lockPlan, pass } from "../src/engine/match";
import { STARTERS } from "../src/content/loadouts";
import { CARDS } from "../src/content/cards";
import { OMENS, SIGNATURE_OMEN_IDS } from "../src/content/omens";
import { cardRuleDetails } from "../src/content/card-rules";
import { EMPTY_PLAN } from "../src/engine/rules";
import type { LegendId, MatchState, Loadout } from "../src/engine/types";
const build = (legend: LegendId, card?: string): Loadout => ({
  ...STARTERS[legend],
  dice: ["standard-d12", "standard-d8", "standard-d6"],
  cards: card
    ? [card, ...STARTERS[legend].cards.filter((id) => id !== card).slice(0, 3)]
    : legend === "basajaun"
      ? ["crush", "root-ward", "barkskin", "herensuge"]
      : STARTERS[legend].cards,
});
function reach(s: MatchState, actor: number, turn: number) {
  for (let i = 0; i < 200; i++) {
    if (
      s.phase === "MAIN_ACTION" &&
      s.activePlayer === actor &&
      s.players[actor].playerTurnCount === turn
    )
      return;
    if (s.phase === "OMEN_CHOICE")
      lockPlan(s, s.activePlayer, {
        ...EMPTY_PLAN,
        omenSlots: Array.from({ length: s.omenRollCount }, (_, i) => i),
      });
    else if (s.phase === "MAIN_ACTION") pass(s, s.activePlayer);
    else advance(s);
  }
  throw Error("Could not reach owner turn");
}
const value = (s: MatchState, a: number, i: number, v: number) => {
  s.players[a].faces[i] = v - 1;
  s.players[a].dice[i].state = s.activePlayer === a ? "AVAILABLE" : "HELD";
};
function use(s: MatchState, id: string, dice = [0], reaction?: string) {
  const a = s.activePlayer;
  lockPlan(s, a, { controls: [], assignments: [{ target: id, dice }] });
  advance(s);
  lockPlan(
    s,
    1 - a,
    reaction
      ? { controls: [], assignments: [{ target: reaction, dice: [0] }] }
      : EMPTY_PLAN,
  );
  while (s.phase !== "MAIN_ACTION" && s.phase !== "MATCH_END") advance(s);
}
describe("explicit OMNIPATH Card and resource semantics", () => {
  it("has six signature Omens and one per curated kit", () => {
    expect(SIGNATURE_OMEN_IDS).toHaveLength(6);
    expect(OMENS).toHaveLength(12);
    for (const l of Object.values(STARTERS)) {
      expect(
        l.dice.filter((id) => SIGNATURE_OMEN_IDS.includes(id)),
      ).toHaveLength(1);
      expect(l.dice.filter((id) => id.startsWith("standard-"))).toHaveLength(2);
    }
  });
  it("gives every Card an explicit immediate resolution and readable payment explanation", () => {
    for (const c of CARDS) {
      expect(c.persistence).toBe("none");
      expect(cardRuleDetails(c).join(" ")).toContain("does not place a trap");
      expect(cardRuleDetails(c)[0]).toContain(`Spend ${c.requirement.count}`);
    }
  });
  it("spends both Omens for a combined requirement and keeps the Card reusable and revealed", () => {
    const s = createMatch(1, [build("basajaun"), build("anansi")], undefined, {
      initiativeWinner: 0,
    });
    reach(s, 0, 1);
    value(s, 0, 0, 7);
    value(s, 0, 1, 5);
    use(s, "herensuge", [0, 1]);
    expect(s.players[0].dice.slice(0, 2).map((d) => d.state)).toEqual([
      "SPENT",
      "SPENT",
    ]);
    expect(s.players[0].known).toContain("herensuge");
    expect(s.players[0].loadout.cards).toContain("herensuge");
    expect(() =>
      lockPlan(s, 0, {
        controls: [],
        assignments: [{ target: "crush", dice: [0] }],
      }),
    ).toThrow("spent");
  });
  it("retains Ward through the opponent turn, then clears it only at owner turn start", () => {
    const s = createMatch(2, [build("anansi"), build("basajaun")], undefined, {
      initiativeWinner: 0,
    });
    reach(s, 0, 1);
    value(s, 0, 0, 4);
    use(s, "guard");
    expect(s.players[0].guard).toBe(2);
    pass(s, 0);
    reach(s, 1, 1);
    expect(s.players[0].guard).toBe(2);
    pass(s, 1);
    reach(s, 0, 2);
    expect(s.players[0].guard).toBe(0);
  });
  it.each([false, true])(
    "Bramble Counter is one immediate exchange, fully blocked = %s",
    (blocked) => {
      const s = createMatch(
        3,
        [build("basajaun"), build("maui", "bramble-trap")],
        undefined,
        { initiativeWinner: 0 },
      );
      reach(s, 0, 1);
      value(s, 0, 0, 8);
      value(s, 1, 0, 3);
      if (blocked) s.players[1].guard = 2;
      use(s, "crush", [0], "bramble-trap");
      expect(s.players[1].hp).toBe(blocked ? 20 : 18);
      expect(s.players[0].hp).toBe(blocked ? 21 : 19);
      expect(s.players[1].statuses).toEqual([]);
      expect(s.players[1].loadout.cards).toContain("bramble-trap");
      expect(s.players[1].known).toContain("bramble-trap");
    },
  );
  it("checks a behind-in-Life condition before the first damage changes the comparison", () => {
    const s = createMatch(
      4,
      [build("leshy", "wolf-shape"), build("anansi")],
      undefined,
      { initiativeWinner: 0 },
    );
    reach(s, 0, 1);
    s.players[0].hp = 10;
    s.players[1].hp = 11;
    value(s, 0, 0, 7);
    use(s, "wolf-shape");
    expect(s.players[1].hp).toBe(6);
  });
  it.each([0, 1])(
    "Poison ticks exactly once at the next owner turn, with caster seat %i",
    (caster) => {
      const builds: [Loadout, Loadout] =
        caster === 0
          ? [build("leshy", "night-spores"), build("basajaun")]
          : [build("basajaun"), build("leshy", "night-spores")];
      const s = createMatch(5, builds, undefined, { initiativeWinner: 0 });
      reach(s, caster, 1);
      const target = 1 - caster,
        before = s.players[target].hp,
        next = s.players[target].playerTurnCount + 1;
      value(s, caster, 0, 6);
      use(s, "night-spores");
      expect(s.players[target].hp).toBe(before);
      pass(s, caster);
      reach(s, target, next);
      expect(s.players[target].hp).toBe(before - 2);
      expect(
        s.players[target].statuses.filter((x) => x.id === "poison"),
      ).toHaveLength(0);
      pass(s, target);
      reach(s, target, next + 1);
      expect(s.players[target].hp).toBe(before - 2);
    },
  );
  it("consumes Empowered on the next damage effect and expires unused at next owner-turn end", () => {
    const s = createMatch(
      6,
      [build("tengu", "windstep"), build("anansi")],
      undefined,
      { initiativeWinner: 0 },
    );
    reach(s, 0, 1);
    value(s, 0, 0, 1);
    use(s, "windstep");
    expect(s.players[0].statuses[0].expiresOwnerTurn).toBe(2);
    value(s, 0, 1, 4);
    use(s, "gale-cut", [1]);
    expect(s.players[1].hp).toBe(14);
    expect(s.players[0].statuses).toHaveLength(0);
    value(s, 0, 2, 1);
    use(s, "windstep", [2]);
    pass(s, 0);
    reach(s, 0, 2);
    expect(s.players[0].statuses).toHaveLength(1);
    pass(s, 0);
    expect(s.players[0].statuses).toHaveLength(0);
  });
  it("pays Life at declaration, never refunds a canceled ability, and refuses lethal cost", () => {
    const s = createMatch(
      7,
      [build("quetzalcoatl", "burning-crown"), build("anansi", "unravel")],
      undefined,
      { initiativeWinner: 0 },
    );
    reach(s, 0, 1);
    value(s, 0, 0, 10);
    value(s, 1, 0, 3);
    lockPlan(s, 0, {
      controls: [],
      assignments: [{ target: "burning-crown", dice: [0] }],
    });
    expect(s.players[0].hp).toBe(18);
    advance(s);
    lockPlan(s, 1, {
      controls: [],
      assignments: [{ target: "unravel", dice: [0] }],
    });
    advance(s);
    advance(s);
    expect(s.players[0].hp).toBe(18);
    expect(s.players[1].hp).toBe(18);
    expect(s.players[1].control).toBe(1);
    s.players[0].hp = 2;
    value(s, 0, 0, 10);
    expect(() =>
      lockPlan(s, 0, {
        controls: [],
        assignments: [{ target: "burning-crown", dice: [0] }],
      }),
    ).toThrow("LIFE INVALID");
    expect(s.players[0].dice[0].state).toBe("AVAILABLE");
  });
});
