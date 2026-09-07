import { describe, it, expect } from "vitest";
import { CARDS, cardById } from "../src/content/cards";
import { DICE, dieById, SIZES, dieBudget } from "../src/content/dice";
import { LEGENDS } from "../src/content/legends";
import { STARTERS } from "../src/content/loadouts";
import { GAME } from "../src/content/config";
import {
  createMatch,
  advance as engineAdvance,
  decisionContext,
  lockPlan,
  pass,
  timeoutPlan,
  projectMatch,
  exportReplay,
  verifyReplay,
  decideWinner,
} from "../src/engine/match";
import {
  applyControls,
  validateLoadout,
  validatePlan,
  EMPTY_PLAN,
  meetsRequirement,
  guardValue,
  clone,
} from "../src/engine/rules";
import { facePosition, turnFate } from "../src/engine/fate";
import { choosePlan } from "../src/engine/ai";
import { resolutionSteps, supportedPrimitives } from "../src/engine/effects";
import { LocalMatchService } from "../src/services/match-service";
import type { Loadout, MatchState, Plan, Effect } from "../src/engine/types";
const command = (target: string, dice = [0]): Plan => ({
  controls: [],
  assignments: [{ target, dice }],
});
function until(s: MatchState, phase: string) {
  for (let i = 0; i < 100 && s.phase !== phase; i++) advance(s, 1000);
  expect(s.phase).toBe(phase);
}
function ready(
  a: Loadout = STARTERS.basajaun,
  b: Loadout = STARTERS.anansi,
  round = 1,
) {
  const s = createMatch(42, [a, b], undefined, { initiativeWinner: 0 });
  s.round = round - 1;
  until(s, "MAIN_ACTION");
  return s;
}
function face(
  s: MatchState,
  a: number,
  slot: number,
  value: number,
  held = false,
) {
  const p = s.players[a];
  p.faces[slot] = value - 1;
  p.dice[slot] = {
    state: held ? "HELD" : "AVAILABLE",
    rolledTurn: s.turn,
    modified: false,
    originalFace: value - 1,
  };
}
function exchange(s: MatchState, p: Plan, r: Plan = EMPTY_PLAN) {
  lockPlan(s, s.activePlayer, p);
  advance(s);
  lockPlan(s, 1 - s.activePlayer, r);
  until(s, "RESOLUTION");
  advance(s);
}
function finish(s: MatchState) {
  let n = 0;
  while (s.phase !== "MATCH_END" && n++ < 3000) {
    if (["MAIN_ACTION", "REACTION_WINDOW"].includes(s.phase)) {
      const a = s.phase === "MAIN_ACTION" ? s.activePlayer : 1 - s.activePlayer;
      lockPlan(s, a, choosePlan(decisionContext(s, a)));
    } else advance(s);
  }
  expect(s.phase).toBe("MATCH_END");
  return s;
}
function build(base: Loadout, card: string) {
  const l = clone(base);
  l.cards[0] = card;
  return l;
}
describe("v2 content and locked loadouts", () => {
  it("defines all six initiative bonuses and timing on every ability", () => {
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
    expect(LEGENDS.map((l) => l.initiativeBonus)).toEqual([0, 3, 4, 1, 2, 2]);
    for (const l of LEGENDS) {
      validateLoadout(STARTERS[l.id]);
      expect(l.active.timing).toMatch(/ACTION|REACTION/);
    }
    for (const c of CARDS) {
      expect(c.mechanicalVersion).toBe(GAME.version);
      expect(c.timing).toMatch(/ACTION|REACTION/);
    }
  });
  it("registers all authored effects", () => {
    const visit = (es: Effect[]) =>
      es.forEach((e) => {
        expect(supportedPrimitives).toContain(e.type);
        if (e.effects) visit(e.effects);
      });
    CARDS.forEach((c) => visit(c.effects));
    LEGENDS.forEach((l) => visit(l.active.effects));
  });
  it("keeps fixed faces and involutive opposite maps for every actual die size", () => {
    for (const d of DICE) {
      expect(d.faces).toHaveLength(d.size);
      d.opposites.forEach((op, i) => {
        expect(op).not.toBe(i);
        expect(d.opposites[op]).toBe(i);
      });
    }
    expect(SIZES).toEqual([4, 6, 8, 10, 12, 20]);
  });
  it("pays for symbols with blanks and lower numerical utility", () => {
    for (const d of DICE.filter((d) => !d.id.startsWith("standard"))) {
      expect(
        d.faces.filter((f) => f.type === "blank").length,
      ).toBeGreaterThanOrEqual(2);
      expect(dieBudget(d).mean).toBeLessThan(
        dieBudget(dieById[`standard-d${d.size}`]).mean,
      );
    }
  });
  it("supports low and high dice builds without treating size as rarity", () => {
    const l = clone(STARTERS.basajaun);
    l.dice = ["standard-d4", "standard-d20", "guardian-d6"];
    expect(() => validateLoadout(l)).not.toThrow();
  });
  it("rejects foreign cards, ownership violations and wrong piece counts", () => {
    const l = clone(STARTERS.basajaun);
    expect(() => validateLoadout(l, new Set())).toThrow("owned");
    l.cards[0] = STARTERS.anansi.cards[0];
    expect(() => validateLoadout(l)).toThrow("incompatible");
    l.cards.pop();
    expect(() => validateLoadout(l)).toThrow("four");
  });
  it("locks copies of the pre-match loadouts", () => {
    const a = clone(STARTERS.basajaun),
      s = createMatch(1, [a, STARTERS.anansi]);
    a.cards[0] = "changed";
    a.dice[0] = "changed";
    expect(s.players[0].loadout).toEqual(STARTERS.basajaun);
  });
  it("maps uniform normalized tokens to every supported size", () => {
    for (const size of SIZES) {
      const counts = Array(size).fill(0);
      for (let i = 0; i < 120; i++) counts[facePosition(i, size)]++;
      expect(new Set(counts).size).toBe(1);
    }
  });
});
describe("authoritative initiative, turns and resource lifetime", () => {
  it("uses a single d20 contest plus data-driven bonuses", () => {
    const s = createMatch(1, [STARTERS.tengu, STARTERS.basajaun], undefined, {
      initiativeRolls: [11, 13],
    });
    advance(s);
    expect(s.openingInitiative?.totals).toEqual([15, 13]);
    expect(s.openingInitiative?.winner).toBe(0);
  });
  it("keeps opening Initiative and uses 1 / 2 / 3 / 3 Omen rolls", () => {
    const s = createMatch(2, [STARTERS.basajaun, STARTERS.anansi], undefined, {
      initiativeWinner: 0,
    });
    const rolls: { round: number; actor: number; slots: number[] }[] = [];
    while (s.phase !== "MATCH_END") {
      if (s.phase === "MAIN_ACTION") {
        rolls.push({
          round: s.round,
          actor: s.activePlayer,
          slots: s.players[s.activePlayer].dice.flatMap((d, i) =>
            d.state === "AVAILABLE" ? [i] : [],
          ),
        });
        pass(s, s.activePlayer);
      } else advance(s);
    }
    for (let r = 1; r <= 7; r++) {
      const rows = rolls.filter((x) => x.round === r);
      expect(rows.map((x) => x.actor)).toEqual([0, 1]);
      for (const row of rows)
        expect(row.slots).toEqual(
          r === 1 ? [0, 1, 2].slice(0, row.actor === 0 ? 1 : 2) : [0, 1, 2],
        );
    }
    expect(s.events.filter((e) => e.type === "initiative")).toHaveLength(1);
  });
  it("holds leftover dice through turn end and round end, expiring only at owner turn start", () => {
    const s = ready();
    face(s, 0, 0, 3);
    pass(s, 0);
    expect(s.players[0].dice[0].state).toBe("HELD");
    until(s, "MAIN_ACTION");
    expect(s.activePlayer).toBe(1);
    expect(s.players[0].dice[0].state).toBe("HELD");
    face(s, 1, 0, 4);
    pass(s, 1);
    until(s, "ROUND_END");
    expect(s.players[1].dice[0].state).toBe("HELD");
    advance(s);
    expect(s.players[1].dice[0].state).toBe("HELD");
    advance(s);
    expect(s.players[0].dice[0].state).toBe("EXPIRED");
    expect(s.players[1].dice[0].state).toBe("HELD");
    until(s, "MAIN_ACTION");
    expect(s.activePlayer).toBe(0);
    expect(s.players[1].dice[0].state).toBe("HELD");
    pass(s, 0);
    until(s, "TURN_START");
    expect(s.activePlayer).toBe(1);
    expect(s.players[1].dice[0].state).toBe("EXPIRED");
  });
  it("does not reveal future opponent rolls or live seed in projections", () => {
    const s = ready();
    for (const a of [0, 1, -1]) {
      const v = projectMatch(s, a);
      expect(v).not.toHaveProperty("seed");
      expect(v).not.toHaveProperty("config");
      expect(v).not.toHaveProperty("roundFate");
      expect(v).not.toHaveProperty("replay");
      expect(v.players[1].loadout.cards.filter(Boolean).length).toBe(
        a === 1 ? 4 : 0,
      );
    }
    expect(turnFate(1, 1, 0)).not.toEqual(turnFate(1, 1, 1));
  });
  it("resets Control each round without clearing preserved resources", () => {
    const s = ready();
    s.players[0].control = 0;
    pass(s, 0);
    until(s, "MAIN_ACTION");
    pass(s, 1);
    until(s, "ROUND_END");
    advance(s);
    expect(s.players.map((p) => p.control)).toEqual([2, 2]);
    expect(s.players[0].dice[0].state).toBe("HELD");
  });
  it("refuses out-of-turn declarations and unrolled resource payments", () => {
    const s = ready();
    expect(() => lockPlan(s, 1, command("guard"))).toThrow("TIMING");
    expect(() => lockPlan(s, 0, command("guard", [1]))).toThrow("OMEN");
  });
  it("passes on timeout without spending or revealing the draft", () => {
    const s = ready();
    face(s, 0, 0, 8);
    timeoutPlan(s, 0, command("basajaun-crush"));
    expect(s.players[0].dice[0].state).toBe("HELD");
    expect(s.players[0].known).toEqual([]);
    expect(s.players[0].guard).toBe(0);
  });
});
describe("deterministic action and reaction resolution", () => {
  it("Attack → Guard Reaction pays held die and absorbs damage first", () => {
    const s = ready();
    face(s, 0, 0, 8);
    face(s, 1, 0, 6, true);
    exchange(s, command("basajaun-crush"), command("guard"));
    expect(s.players[1].hp).toBe(17);
    expect(s.events.find((e) => e.type === "damage")).toMatchObject({
      target: 1,
      wardAbsorbed: 3,
      amount: 1,
    });
    expect(s.players[1].guard).toBe(0);
    expect(s.players[1].dice[0].state).toBe("SPENT");
    expect(s.stats[0].reactions[1]).toBe(1);
  });
  it("opens a reaction window before damage and never auto-spends on timeout", () => {
    const s = ready();
    face(s, 0, 0, 8);
    lockPlan(s, 0, command("basajaun-crush"));
    expect(s.players[1].hp).toBe(18);
    advance(s, 100);
    expect(s.phase).toBe("REACTION_WINDOW");
    expect(s.deadline).toBe(5100);
    timeoutPlan(s, 1);
    advance(s);
    expect(s.players[1].hp).toBe(14);
  });
  it("Attack → Redirect returns damage to the acting Legend", () => {
    const s = ready(
      STARTERS.basajaun,
      build(STARTERS.anansi, "anansi-web-turn"),
    );
    face(s, 0, 0, 8);
    face(s, 1, 0, 6, true);
    exchange(s, command("basajaun-crush"), command("anansi-web-turn"));
    expect(s.players[0].hp).toBe(16);
    expect(s.players[1].hp).toBe(18);
    expect(s.players[1].known).toContain("anansi-web-turn");
  });
  it("Attack → Counterstrike resolves retaliation after actual damage, including lethal", () => {
    const s = ready(
      STARTERS.basajaun,
      build(STARTERS.basajaun, "basajaun-counterstrike"),
    );
    face(s, 0, 0, 8);
    face(s, 1, 0, 8, true);
    s.players[0].hp = 2;
    s.players[1].hp = 4;
    exchange(s, command("basajaun-crush"), command("basajaun-counterstrike"));
    expect(s.players.map((p) => p.hp)).toEqual([0, 0]);
    expect(s.phase).toBe("MATCH_END");
    expect(s.winner).toBe(0);
  });
  it("does not counterstrike when Guard prevents all attack damage", () => {
    const s = ready(
      STARTERS.basajaun,
      build(STARTERS.basajaun, "basajaun-counterstrike"),
    );
    face(s, 0, 0, 8);
    face(s, 1, 0, 8, true);
    s.players[1].guard = 10;
    exchange(s, command("basajaun-crush"), command("basajaun-counterstrike"));
    expect(s.players[0].hp).toBe(20);
  });
  it("Heal → disruption cancels healing while retaining paid costs and reveal", () => {
    const s = ready(
      build(STARTERS.basajaun, "basajaun-deep-roots"),
      build(STARTERS.anansi, "anansi-unravel"),
    );
    face(s, 0, 0, 3);
    face(s, 1, 0, 2, true);
    s.players[0].hp = 10;
    exchange(s, command("basajaun-deep-roots"), command("anansi-unravel"));
    expect(s.players[0].hp).toBe(10);
    expect(s.players[0].dice[0].state).toBe("SPENT");
    expect(s.players[0].known).toContain("basajaun-deep-roots");
  });
  it("rechecks paid dice after reaction manipulation and fizzles invalid attacks", () => {
    const c = cardById["anansi-unravel"],
      old = clone(c.effects);
    try {
      c.effects = [{ type: "SHIFT_DIE", direction: -1 }];
      const s = ready(STARTERS.basajaun, build(STARTERS.anansi, c.id));
      face(s, 0, 0, 7);
      face(s, 1, 0, 2, true);
      exchange(s, command("basajaun-crush"), command(c.id));
      expect(s.players[1].hp).toBe(18);
      expect(s.events.some((e) => e.type === "fizzle")).toBe(true);
    } finally {
      c.effects = old;
    }
  });
  it("allows the same permanent card again in the same round using different dice", () => {
    const s = ready(STARTERS.basajaun, STARTERS.anansi, 5);
    face(s, 0, 0, 8);
    face(s, 0, 1, 8);
    exchange(s, command("basajaun-crush"));
    exchange(s, command("basajaun-crush", [1]));
    expect(s.players[1].hp).toBe(10);
    expect(s.players[0].known).toEqual(["basajaun-crush"]);
    expect(s.stats.at(-1)!.cards[0]).toEqual([
      "basajaun-crush",
      "basajaun-crush",
    ]);
  });
  it("rejects duplicate die payment and second activation using a spent die", () => {
    const s = ready();
    face(s, 0, 0, 8);
    expect(() =>
      lockPlan(s, 0, command("basajaun-herensuge", [0, 0])),
    ).toThrow();
    exchange(s, command("basajaun-crush"));
    expect(() => lockPlan(s, 0, command("basajaun-crush"))).toThrow("spent");
  });
  it("never opens another window for the reaction", () => {
    const s = ready();
    face(s, 0, 0, 8);
    face(s, 1, 0, 6, true);
    lockPlan(s, 0, command("basajaun-crush"));
    advance(s);
    lockPlan(s, 1, command("guard"));
    expect(s.phase).toBe("REACTION_DECLARED");
    expect(() => lockPlan(s, 0, command("guard"))).toThrow("TIMING");
    advance(s);
    expect(s.phase).toBe("RESOLUTION");
  });
  it("exposes exactly the same result when stepped effect by effect", () => {
    const s = ready();
    face(s, 0, 0, 8);
    face(s, 1, 0, 6, true);
    lockPlan(s, 0, command("basajaun-crush"));
    advance(s);
    lockPlan(s, 1, command("guard"));
    advance(s);
    const copy = clone(s);
    const frames = [...resolutionSteps(s, true)];
    advance(copy);
    expect(s.players.map((p) => [p.hp, p.guard])).toEqual(
      copy.players.map((p) => [p.hp, p.guard]),
    );
    expect(frames.map((f) => f.priority)).toEqual(
      [...frames.map((f) => f.priority)].sort((a, b) => a - b),
    );
    expect(frames.some((f) => f.before && f.after)).toBe(true);
  });
  it("clamps healing to max HP and negative damage to zero", () => {
    const s = ready(build(STARTERS.basajaun, "basajaun-deep-roots"));
    face(s, 0, 0, 3);
    exchange(s, command("basajaun-deep-roots"));
    expect(s.players[0].hp).toBe(20);
    const c = cardById["basajaun-crush"],
      old = clone(c.effects);
    try {
      c.effects = [{ type: "DAMAGE", amount: -5 }];
      const t = ready();
      face(t, 0, 0, 8);
      exchange(t, command(c.id));
      expect(t.players[1].hp).toBe(18);
    } finally {
      c.effects = old;
    }
  });
});
describe("requirements, Control and deterministic verification", () => {
  it("supports exact totals, parity, relationships, sizes and symbols", () => {
    const f = (n: number) => dieById["standard-d20"].faces[n - 1];
    expect(meetsRequirement({ count: 2, exact: 10 }, [f(3), f(7)])).toBe(true);
    expect(meetsRequirement({ count: 1, parity: "odd" }, [f(6)])).toBe(false);
    expect(
      meetsRequirement({ count: 2, relationship: "equal" }, [f(2), f(3)]),
    ).toBe(false);
    expect(meetsRequirement({ count: 1, size: 4 }, [f(2)], [20])).toBe(false);
    expect(meetsRequirement({ count: 1, min: 1, max: 3 }, [f(20)])).toBe(false);
  });
  it("universal Guard is floor(n/2), symbols need an explicit conversion", () => {
    expect(
      [2, 5, 8].map((n) => guardValue(dieById["standard-d20"].faces[n - 1])),
    ).toEqual([1, 2, 4]);
    expect(guardValue(dieById["guardian-d6"].faces[5])).toBe(3);
    expect(guardValue(dieById["trickster-d8"].faces[5])).toBe(0);
  });
  it("Control changes numeric result by exactly one and respects boundaries", () => {
    const l = STARTERS.basajaun;
    expect(
      applyControls(l, [6, 0, 0], [{ slot: 0, kind: "shift", direction: 1 }], 2)
        .positions[0],
    ).toBe(7);
    expect(() =>
      applyControls(
        l,
        [11, 0, 0],
        [{ slot: 0, kind: "shift", direction: 1 }],
        2,
      ),
    ).toThrow("SHIFT");
    expect(() =>
      applyControls(l, [0, 0, 0], [{ slot: 0, kind: "flip" }], 1),
    ).toThrow("costs 2");
  });
  it("forbids Control on reaction windows and pays it before activation validation", () => {
    const s = ready();
    face(s, 0, 0, 6);
    const p = command("basajaun-crush");
    p.controls = [{ slot: 0, kind: "shift", direction: 1 }];
    lockPlan(s, 0, p);
    expect(s.players[0].control).toBe(1);
    advance(s);
    face(s, 1, 0, 2, true);
    expect(() =>
      validatePlan(decisionContext(s, 1), {
        controls: [{ slot: 0, kind: "flip" }],
        assignments: [],
      }),
    ).toThrow("own turn");
  });
  it("stun blocks a card with a clear validation error", () => {
    const s = ready();
    face(s, 0, 0, 8);
    s.players[0].statuses = [
      { id: "stun", cardId: "basajaun-crush", amount: 1, expiresRound: 1 },
    ];
    expect(() => lockPlan(s, 0, command("basajaun-crush"))).toThrow("STUNNED");
    expect(s.players[0].dice[0].state).toBe("AVAILABLE");
  });
  it("all 36 matchups finish and their command replays reproduce exact state", () => {
    for (const a of LEGENDS)
      for (const b of LEGENDS) {
        const s = finish(createMatch(131, [STARTERS[a.id], STARTERS[b.id]]));
        const replay = verifyReplay(exportReplay(s));
        expect(replay.players).toEqual(s.players);
        expect(replay.events).toEqual(s.events);
        expect(replay.stats).toEqual(s.stats);
      }
  }, 20000);
  it("swapped seats and RNG streams preserve outcomes in paired simulations", () => {
    for (const a of LEGENDS) {
      const s = finish(createMatch(44, [STARTERS[a.id], STARTERS.anansi]));
      const t = finish(
        createMatch(44, [STARTERS.anansi, STARTERS[a.id]], undefined, {
          rngSeats: [1, 0],
        }),
      );
      expect(s.players.map((p) => p.hp)).toEqual(
        t.players.map((p) => p.hp).reverse(),
      );
    }
  });
  it("AI choices cannot depend on private opponent cards", () => {
    const s = ready();
    const ctx = decisionContext(s, 0),
      a = choosePlan(ctx);
    s.players[1].loadout.cards.reverse();
    expect(choosePlan(decisionContext(s, 0))).toEqual(a);
  });
  it("rejects old replay versions instead of guessing missing turn state", () => {
    const s = finish(createMatch(42, [STARTERS.basajaun, STARTERS.anansi]));
    const r = exportReplay(s);
    r.version = 1;
    expect(() => verifyReplay(r)).toThrow("version");
  });
  it("uses HP then effective damage and deterministic draw at round cap", () => {
    const s = ready();
    s.round = 7;
    s.players.forEach((p) => {
      p.hp = 10;
      p.damageDealt = 2;
    });
    decideWinner(s, true);
    expect(s.winner).toBe("draw");
    s.players[1].damageDealt++;
    decideWinner(s, true);
    expect(s.winner).toBe(1);
  });
  it("service rejects stale decisions and idempotently acknowledges duplicates", () => {
    const state = ready(),
      svc = new LocalMatchService(state, "Normal", "Training", true);
    const v = svc.view(),
      c = {
        matchId: v.id,
        round: v.round,
        revision: v.revision,
        sequence: 1,
        plan: EMPTY_PLAN,
      };
    expect(svc.submit(c).phase).toBe("TURN_END");
    expect(() => svc.submit(c)).not.toThrow();
    expect(() => svc.submit({ ...c, sequence: 2 })).toThrow("Stale");
  });
});

// Explicit opening choices for deterministic rule fixtures, never a production fallback.
function advance(s: import("../src/engine/types").MatchState, now = 0) {
  if (s.phase === "OMEN_CHOICE")
    lockPlan(s, s.activePlayer, {
      controls: [],
      assignments: [],
      omenSlots: [0, 1, 2].slice(0, s.omenRollCount),
    });
  else engineAdvance(s, now);
}
