import { describe, it, expect } from "vitest";
import {
  createMatch,
  advance as engineAdvance,
  lockPlan,
  pass,
  decisionContext,
  projectMatch,
  beginRound,
  beginTurn,
} from "../src/engine/match";
import { validateSavedState } from "../src/engine/validation";
import { validatePlan, conditionMatches, clone } from "../src/engine/rules";
import { LocalMatchService } from "../src/services/match-service";
import { STARTERS } from "../src/content/loadouts";
import { cardById } from "../src/content/cards";
import { defaultSetup } from "../src/dev/model";
import { LabController } from "../src/dev/controller";
import { aggregate } from "../src/metrics/data";
import { simulateGame } from "../src/dev/simulation";
const ready = () => {
  const s = createMatch(33, [STARTERS.basajaun, STARTERS.anansi], undefined, {
    initiativeWinner: 0,
  });
  while (s.phase !== "MAIN_ACTION") advance(s);
  return s;
};
describe("turn edge cases and data integrity", () => {
  it("first-action and held-die conditions remain meaningful during resolution", () => {
    const s = ready(),
      ctx = decisionContext(s, 0);
    expect(conditionMatches("firstAction", ctx)).toBe(true);
    ctx.self.actionsThisRound = 1;
    expect(conditionMatches("firstAction", { ...ctx, resolving: true })).toBe(
      true,
    );
    expect(conditionMatches("heldDie", { ...ctx, heldDice: 1 })).toBe(true);
  });
  it("does not count your own attack as an enemy attack", () => {
    const s = ready();
    s.players[0].faces[0] = 7;
    lockPlan(s, 0, {
      controls: [],
      assignments: [{ target: "basajaun-crush", dice: [0] }],
    });
    expect(conditionMatches("enemyAttacking", decisionContext(s, 0))).toBe(
      false,
    );
    expect(conditionMatches("enemyAttacking", decisionContext(s, 1))).toBe(
      true,
    );
  });
  it("does not leak hidden card IDs through card-scoped statuses", () => {
    const s = ready(),
      id = s.players[1].loadout.cards[0];
    s.players[1].statuses = [
      { id: "stun", cardId: id, amount: 1, expiresRound: 2 },
    ];
    expect(JSON.stringify(projectMatch(s, 0))).not.toContain(id);
    expect(projectMatch(s, 1).players[1].statuses[0].cardId).toBe(id);
  });
  it("only permits fresh turn and round starts at safe boundaries", () => {
    const s = ready();
    expect(() => beginRound(s)).toThrow();
    expect(() => beginTurn(s)).toThrow();
  });
  it("applies poison after the new roll and before main actions", () => {
    const s = createMatch(1, [STARTERS.basajaun, STARTERS.anansi], undefined, {
      initiativeWinner: 0,
    });
    s.players[0].statuses = [{ id: "poison", amount: 20, expiresRound: 1 }];
    while (s.phase !== "MATCH_END") advance(s);
    expect(s.stats[0].rolls[0]).toBe(1);
    expect(s.players[0].hp).toBe(0);
    expect(s.events.findIndex((e) => e.type === "roll")).toBeLessThan(
      s.events.findIndex((e) => e.type === "poison"),
    );
  });
  it("rejects zero-control flips atomically with no face mutation", () => {
    const s = ready();
    s.players[0].control = 0;
    const before = clone(s);
    expect(() =>
      lockPlan(s, 0, {
        controls: [{ slot: 0, kind: "flip" }],
        assignments: [],
      }),
    ).toThrow();
    expect(s).toEqual(before);
  });
  it("exact, initiative, round, class and held requirements use the authority context", () => {
    const s = ready(),
      c = cardById["basajaun-crush"],
      r = clone(c.requirement);
    try {
      c.requirement = {
        count: 1,
        exact: 3,
        initiative: true,
        minRound: 1,
        maxRound: 1,
        legendClass: "Guardian",
        held: true,
      };
      s.players[0].faces[0] = 2;
      const p = { controls: [], assignments: [{ target: c.id, dice: [0] }] };
      expect(() => validatePlan(decisionContext(s, 0), p)).toThrow("held");
      s.players[0].dice[0].state = "HELD";
      expect(() => validatePlan(decisionContext(s, 0), p)).not.toThrow();
    } finally {
      c.requirement = r;
    }
  });
  it("rejects malformed version-two saved resources and missing exchanges", () => {
    const s = ready();
    (s.players[0].dice[0] as { state: string }).state = "BANKED";
    expect(() => validateSavedState(s)).toThrow("resource");
    const t = ready();
    t.phase = "REACTION_WINDOW";
    expect(() => validateSavedState(t)).toThrow("lacks");
  });
  it("restores a held resource checkpoint and rejects a v1 checkpoint", () => {
    const values = new Map<string, string>(),
      storage = {
        getItem: (k: string) => values.get(k) ?? null,
        setItem: (k: string, v: string) => {
          values.set(k, v);
        },
        removeItem: (k: string) => {
          values.delete(k);
        },
      };
    const state = ready(),
      service = new LocalMatchService(
        state,
        "Normal",
        "Training",
        true,
        storage,
      ),
      v = service.view();
    service.submit({
      matchId: v.id,
      revision: v.revision,
      round: 1,
      sequence: 1,
      plan: { controls: [], assignments: [] },
    });
    expect(
      LocalMatchService.restore(storage)?.view().players[0].dice[0].state,
    ).toBe("HELD");
    const checkpoint = JSON.parse(values.get("fatebound.match.v2")!);
    checkpoint.state.version = 1;
    values.set("fatebound.match.v2", JSON.stringify(checkpoint));
    expect(LocalMatchService.restore(storage)).toBeNull();
  });
  it("practice reaction timeout auto-passes without spending a valid defensive resource", () => {
    const state = ready();
    pass(state, 0);
    while (state.phase !== "MAIN_ACTION") advance(state);
    state.players[1].faces[0] = 5;
    lockPlan(state, 1, {
      controls: [],
      assignments: [{ target: "anansi-silken-cut", dice: [0] }],
    });
    advance(state, 1000);
    const svc = new LocalMatchService(state, "Normal", "Training", true);
    svc.tick(6000);
    expect(state.phase).toBe("RESOLUTION");
    expect(state.players[0].dice[0].state).toBe("HELD");
  });
  it("rejects a stale client command from an earlier action in the same round", () => {
    const state = ready(),
      svc = new LocalMatchService(state, "Normal", "Training", true),
      v = svc.view();
    svc.submit({
      matchId: v.id,
      revision: v.revision,
      round: 1,
      sequence: 1,
      plan: { controls: [{ slot: 0, kind: "flip" }], assignments: [] },
    });
    expect(() =>
      svc.submit({
        matchId: v.id,
        revision: v.revision,
        round: 1,
        sequence: 2,
        plan: { controls: [], assignments: [] },
      }),
    ).toThrow("Stale");
  });
  it("preserves a configured two-die scenario draft and its Control preview through snapshot", () => {
    const s = defaultSetup();
    s.round = 6;
    s.initiativeWinner = 1;
    s.players.forEach((p) => (p.ai = false));
    const c = new LabController(s);
    c.control(0, { slot: 0, kind: "flip" });
    c.assign(0, 0, "basajaun-herensuge");
    c.assign(0, 1, "basajaun-herensuge");
    const r = LabController.restore(c.snapshot());
    expect(r.drafts).toEqual(c.drafts);
    expect(r.positions(0)).toEqual(c.positions(0));
  });
  it("counts paired reversal once for initiative significance and ignores old cohorts", () => {
    const config = {
      loadouts: [STARTERS.basajaun, STARTERS.anansi] as [
        typeof STARTERS.basajaun,
        typeof STARTERS.anansi,
      ],
      games: 2,
      difficulty: "Normal" as const,
      seed: 1,
      paired: true,
    };
    const rows = [simulateGame(config, 0), simulateGame(config, 1)],
      old = { ...rows[0], version: 1 };
    const a = aggregate([...rows, old]);
    expect(a.games).toBe(2);
    expect(a.independentOpeningGames).toBe(1);
    expect(a.paired).toBe(1);
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
