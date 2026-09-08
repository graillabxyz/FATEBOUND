import { describe, expect, it } from "vitest";
import {
  createMatch,
  advance,
  lockPlan,
  pass,
  rollOmens,
  decisionContext,
} from "../src/engine/match";
import { choosePlan } from "../src/engine/ai";
import { STARTERS } from "../src/content/loadouts";
import { LabController } from "../src/dev/controller";
import { defaultSetup } from "../src/dev/model";
import { openingMetrics } from "../src/metrics/opening";
import { recordMatch } from "../src/metrics/data";
import { validateSavedState } from "../src/engine/validation";
import type { MatchState, Phase } from "../src/engine/types";
function until(s: MatchState, phase: Phase) {
  for (let i = 0; s.phase !== phase && i < 30; i++) advance(s);
  expect(s.phase).toBe(phase);
}
function start(winner: 0 | 1 = 0) {
  const s = createMatch(74, [STARTERS.basajaun, STARTERS.anansi], undefined, {
    initiativeWinner: winner,
  });
  until(s, "OMEN_CHOICE");
  return s;
}
function choose(s: MatchState, slots: number[]) {
  lockPlan(s, s.activePlayer, {
    omenSlots: slots,
    controls: [],
    assignments: [],
  });
  until(s, "MAIN_ACTION");
}
function hold(s: MatchState) {
  pass(s, s.activePlayer);
}
describe("fixed opening order and owner-turn roll allowance", () => {
  it.each([0, 1] as const)(
    "supports every equipped opening combination with winner seat %i",
    (winner) => {
      for (const first of [0, 1, 2])
        for (const second of [
          [0, 1],
          [0, 2],
          [1, 2],
        ]) {
          const s = start(winner),
            loadouts = structuredClone(s.players.map((p) => p.loadout));
          choose(s, [first]);
          hold(s);
          until(s, "OMEN_CHOICE");
          expect(s.activePlayer).toBe(1 - winner);
          expect(s.omenRollCount).toBe(2);
          choose(s, second);
          hold(s);
          until(s, "MAIN_ACTION");
          expect(s.activePlayer).toBe(winner);
          expect(s.omenRollCount).toBe(3);
          expect(s.openingFullLife).toBeNull();
          hold(s);
          until(s, "MAIN_ACTION");
          expect(s.activePlayer).toBe(1 - winner);
          expect(s.openingFullLife).toEqual(s.players.map((p) => p.hp));
          expect(
            s.turnHistory.map((t) => [
              t.actor,
              t.playerTurnCount,
              t.slots.length,
            ]),
          ).toEqual([
            [winner, 1, 1],
            [1 - winner, 1, 2],
            [winner, 2, 3],
            [1 - winner, 2, 3],
          ]);
          hold(s);
          until(s, "MAIN_ACTION");
          expect(s.activePlayer).toBe(winner);
          expect(s.players.map((p) => p.loadout)).toEqual(loadouts);
        }
    },
  );
  it("cannot silently advance or bypass opening selection through the roll API", () => {
    const s = start(),
      before = structuredClone(s);
    expect(() => advance(s)).toThrow("Choose");
    expect(() => rollOmens(s)).toThrow("Choose");
    expect(() => rollOmens(s, [0, 1, 2])).toThrow("Choose");
    expect(() => rollOmens(s, [3])).toThrow("Choose");
    expect(s).toEqual(before);
  });
  it("uses owner turn counters even in late-round lab starts and restores pending choices", () => {
    const setup = defaultSetup();
    setup.round = 6;
    setup.pauseOpening = true;
    setup.initiativeWinner = 1;
    setup.players.forEach((p) => {
      p.turnsTaken = 0;
      p.ai = false;
    });
    const lab = new LabController(setup);
    expect(lab.state.phase).toBe("OMEN_CHOICE");
    expect(lab.state.omenRollCount).toBe(1);
    expect(lab.state.players[1].playerTurnCount).toBe(1);
    lab.drafts[1] = { controls: [], assignments: [], omenSlots: [2] };
    const restored = LabController.restore(lab.snapshot());
    restored.next();
    expect(restored.state.turnHistory[0].slots).toEqual([2]);
    expect(restored.view("B").turnHistory[0].actor).toBe(0);
  });
  it("does not replay the opening allowance for experienced players in Round 1", () => {
    const setup = defaultSetup();
    setup.pauseOpening = true;
    setup.initiativeWinner = 0;
    setup.players.forEach((p) => (p.turnsTaken = 1));
    const lab = new LabController(setup);
    expect(lab.state.phase).toBe("MAIN_ACTION");
    expect(lab.state.omenRollCount).toBe(3);
    expect(lab.state.players[0].playerTurnCount).toBe(2);
  });
  it("AI chooses by probability and hand utility, independent of slot order or hidden enemy cards", () => {
    const s = start();
    const before = choosePlan(decisionContext(s, 0));
    const chosenId = s.players[0].loadout.dice[before.omenSlots![0]];
    s.players[0].loadout.dice.reverse();
    const p = choosePlan(decisionContext(s, 0));
    expect(s.players[0].loadout.dice[p.omenSlots![0]]).toBe(chosenId);
    s.players[1].loadout.cards.reverse();
    s.seed = 900;
    expect(choosePlan(decisionContext(s, 0))).toEqual(p);
    const anansi = createMatch(
      2,
      [STARTERS.anansi, STARTERS.basajaun],
      undefined,
      { initiativeWinner: 0 },
    );
    until(anansi, "OMEN_CHOICE");
    const selected = choosePlan(decisionContext(anansi, 0)).omenSlots!;
    expect(selected).toHaveLength(1);
    const omenId = anansi.players[0].loadout.dice[selected[0]];
    anansi.players[0].loadout.dice.reverse();
    const reversed = choosePlan(decisionContext(anansi, 0)).omenSlots!;
    expect(anansi.players[0].loadout.dice[reversed[0]]).toBe(omenId);
  });
  it("records actual opening resources, groups choices by opening role and omits unreached Life samples", () => {
    const s = start(1);
    choose(s, [2]);
    hold(s);
    until(s, "OMEN_CHOICE");
    choose(s, [0, 2]);
    hold(s);
    s.winner = 0;
    s.phase = "MATCH_END";
    const record = recordMatch(s, "lab", "Manual", null, ["human", "human"]),
      metrics = openingMetrics([record]);
    expect(metrics.roles.map((r) => r.held)).toEqual([1, 2]);
    expect(metrics.fullTurnSamples).toBe(0);
    expect(
      Object.values(metrics.choices).map((c) => [c.role, c.games, c.wins]),
    ).toEqual([
      [0, 1, 0],
      [1, 1, 1],
    ]);
    expect(metrics.openingTurnSamples).toBe(2);
  });
  it("uses measured damage and signed Life differential with separate observed-turn denominators", () => {
    const s = start(1);
    choose(s, [2]);
    hold(s);
    until(s, "OMEN_CHOICE");
    choose(s, [0, 2]);
    hold(s);
    until(s, "MAIN_ACTION");
    hold(s);
    until(s, "MAIN_ACTION");
    s.winner = 1;
    s.phase = "MATCH_END";
    const r = recordMatch(s, "lab", "Manual", null, ["human", "human"]);
    r.turnHistory[0].damage = [0, 3];
    r.turnHistory[1].damage = [4, 2];
    r.turnHistory[1].reactions = [0, 1];
    r.openingFullLife = [10, 13];
    const m = openingMetrics([r]);
    expect(m.roles[0].turn1Damage).toBe(3);
    expect(m.roles[1].turn1Damage).toBe(4);
    expect(m.roles[0].reactions).toBe(1);
    expect(m.averageLifeDifferential).toBe(3);
    expect(m.roles[1].turn2Samples).toBe(0);
  });
  it("rejects corrupt counters or turn history on restore", () => {
    const s = start();
    s.players[0].playerTurnCount = -1;
    expect(() => validateSavedState(s)).toThrow("player turn count");
    s.players[0].playerTurnCount = 1;
    s.turnHistory[0].slots = [0, 0];
    expect(() => validateSavedState(s)).toThrow("turn metrics");
  });
});
