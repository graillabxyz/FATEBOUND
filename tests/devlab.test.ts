import { describe, it, expect } from "vitest";
import { LabController, importSnapshot } from "../src/dev/controller";
import { defaultSetup, defaultPlayer, randomLoadout } from "../src/dev/model";
import { SCENARIOS } from "../src/dev/scenarios";
import { LEGENDS } from "../src/content/legends";
import { validateLoadout, clone, EMPTY_PLAN } from "../src/engine/rules";
import { recordMatch, aggregate } from "../src/metrics/data";
import { simulateGame } from "../src/dev/simulation";
import { STARTERS } from "../src/content/loadouts";
import { validateRecord } from "../server/validation";
function lab() {
  const setup = defaultSetup();
  setup.players[0].loadout.cards = [
    "crush",
    "root-ward",
    "barkskin",
    "herensuge",
  ];
  setup.initiativeWinner = 0;
  setup.players.forEach((p) => (p.ai = false));
  setup.fate.fixed = [80, 60, 40];
  return new LabController(setup);
}
function resolving() {
  const c = lab();
  c.assign(0, 0, "crush");
  c.lock(0);
  c.next();
  c.lock(1, EMPTY_PLAN);
  expect(c.state.phase).toBe("RESOLUTION");
  return c;
}
describe("v2 production Battle Lab", () => {
  it("builds every scenario with real content", () => {
    for (const s of SCENARIOS) expect(() => s.build()).not.toThrow();
  });
  it("configures all six Legends and reproducible random compatible builds", () => {
    for (const l of LEGENDS) {
      const s = defaultSetup();
      s.players[0].loadout.cards = [
        "crush",
        "root-ward",
        "barkskin",
        "herensuge",
      ];
      s.players[0] = defaultPlayer(l.id, false);
      expect(() => new LabController(s)).not.toThrow();
      expect(randomLoadout(l.id, 4)).toEqual(randomLoadout(l.id, 4));
      validateLoadout(randomLoadout(l.id, 4));
    }
  });
  it("applies forced opening rolls, bonus, winner and configured round", () => {
    const s = defaultSetup();
    s.players[0].initiativeBonus = 5;
    s.initiativeRolls = [20, 1];
    s.round = 6;
    const c = new LabController(s);
    expect(c.state.openingInitiative?.totals).toEqual([25, 4]);
    expect(c.state.initiative).toBe(0);
    expect(c.state.round).toBe(6);
  });
  it("keeps normal and spectator hidden information private and swaps view B authority", () => {
    const c = lab();
    expect(c.view("A").players[1].loadout.cards).toEqual([
      null,
      null,
      null,
      null,
    ]);
    expect(c.view("B").players[1].loadout.cards).toEqual([
      null,
      null,
      null,
      null,
    ]);
    expect(c.view("B").activePlayer).toBe(1);
    expect(
      c
        .view("Spectator")
        .players.flatMap((p) => p.loadout.cards)
        .every((v) => v === null),
    ).toBe(true);
    expect(c.view("Omniscient").players[1].loadout.cards).toEqual(
      c.state.players[1].loadout.cards,
    );
  });
  it("lets developers set held resources without bypassing action timing", () => {
    const c = lab();
    c.setFace(1, 0, 5);
    c.setResource(1, 0, "HELD");
    expect(c.state.players[1].dice[0].state).toBe("HELD");
    expect(() =>
      c.lock(1, {
        controls: [],
        assignments: [{ target: "guard", dice: [0] }],
      }),
    ).toThrow("TIMING");
  });
  it("can stress incompatible loadouts but still validates real action costs", () => {
    const s = defaultSetup();
    s.players[0].loadout.cards[0] = "web-turn";
    expect(() => new LabController(s)).toThrow("incompatible");
    s.ignoreRestrictions = true;
    s.initiativeWinner = 0;
    const c = new LabController(s);
    c.setResource(0, 0, "AVAILABLE");
    expect(() =>
      c.lock(0, {
        controls: [],
        assignments: [{ target: "web-turn", dice: [0] }],
      }),
    ).toThrow("TIMING");
  });
  it("steps exactly the production resolver and restores mid-effect snapshots", () => {
    const c = resolving();
    c.nextEffect();
    expect(c.resolving).toBe(true);
    const saved = c.snapshot(),
      r = LabController.restore(saved);
    c.resolveCurrent();
    r.resolveCurrent();
    expect(r.state.players).toEqual(c.state.players);
    expect(r.state.stats).toEqual(c.state.stats);
    expect(r.frames).toEqual(c.frames);
  });
  it("rejects unsafe edits while a resolver is suspended and rewinds safely", () => {
    const c = resolving();
    c.nextEffect();
    expect(() => c.hp(1, 1)).toThrow("suspended");
    c.rewind();
    expect(c.state.phase).toBe("RESOLUTION");
    expect(c.resolving).toBe(false);
  });
  it("snapshots restore held dice, reveal memory, HP, Control and seed exactly", () => {
    const c = lab();
    c.setResource(1, 0, "HELD");
    c.setFace(1, 0, 5);
    c.memory(1, c.state.players[1].loadout.cards[0], "HIDDEN BUT KNOWN");
    c.editPlayer(0, { hp: 4, control: 5 });
    const restored = importSnapshot(JSON.stringify(c.report()));
    expect(restored.state.players).toEqual(c.state.players);
    expect(restored.state.seed).toBe(c.state.seed);
  });
  it("restart uses the same initiative and Fate without retaining spent dice", () => {
    const c = lab(),
      before = clone(c.state.players);
    c.lock(0, EMPTY_PLAN);
    c.restart();
    expect(c.state.players).toEqual(before);
  });
  it("reveal memory can be explicitly reset and rewound", () => {
    const c = lab(),
      id = c.state.players[1].loadout.cards[0];
    c.memory(1, id, "CURRENTLY REVEALED");
    expect(c.view().players[1].loadout.cards[0]).toBe(id);
    c.memory(1, id, "NEVER REVEALED");
    expect(c.view().players[1].loadout.cards[0]).toBeNull();
  });
  it("overlay pause stops short timers and timeout spends nothing", () => {
    const c = lab();
    c.setup.timerMs = 1000;
    c.remainingMs = 1000;
    c.tick(100);
    c.paused = true;
    c.tick(1100);
    expect(c.remainingMs).toBe(1000);
    c.paused = false;
    c.tick(2100);
    expect(c.state.phase).toBe("TURN_END");
    expect(c.state.players[0].known).toEqual([]);
  });
  it("consumes fixed and sequence Fate with repeat, random and stop endings", () => {
    const c = lab();
    c.setup.fate.mode = "sequence";
    expect(c.fateForRound(1)).toEqual(c.setup.fate.sequence[0]);
    expect(c.fateForRound(4)).toEqual(c.setup.fate.sequence[0]);
    c.setup.fate.end = "random";
    expect(c.fateForRound(4)).toBeUndefined();
    c.setup.fate.end = "stop";
    expect(() => c.fateForRound(4)).toThrow("exhausted");
  });
  it("rejects old snapshots and malformed resource states", () => {
    const c = lab(),
      s = c.snapshot();
    s.mechanicalVersion = 1;
    expect(() => LabController.restore(s)).toThrow("version");
    expect(() => importSnapshot("{broken")).toThrow("JSON");
  });
  it("exports initiative and resource metrics from completed real engine simulations", () => {
    const cfg = {
      loadouts: [STARTERS.basajaun, STARTERS.anansi] as [
        typeof STARTERS.basajaun,
        typeof STARTERS.anansi,
      ],
      games: 2,
      difficulty: "Normal" as const,
      seed: 200,
      paired: true,
    };
    const rows = [simulateGame(cfg, 0), simulateGame(cfg, 1)];
    rows.forEach((r) =>
      expect(() => validateRecord(r, "simulation")).not.toThrow(),
    );
    const stats = aggregate(rows);
    expect(stats.games).toBe(2);
    expect(stats.mismatches).toBe(0);
    expect(stats.initiativeGames).toBe(2);
    expect(stats.rolls).toBeGreaterThan(0);
  });
  it("keeps debug metrics separate and strips authored build labels", () => {
    const c = lab();
    c.end(0);
    const r = recordMatch(c.state, "lab", "Internal", null, ["human", "ai"]);
    expect(validateRecord(r, "lab").loadouts[0].name).toBe("basajaun build");
    expect(() => validateRecord(r, "live")).toThrow();
  });
});
