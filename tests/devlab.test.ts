import { describe, it, expect } from "vitest";
import { LabController, importSnapshot } from "../src/dev/controller";
import { defaultSetup, defaultPlayer, randomLoadout } from "../src/dev/model";
import { SCENARIOS } from "../src/dev/scenarios";
import { STARTERS } from "../src/content/loadouts";
import { LEGENDS } from "../src/content/legends";
import { decisionContext, resolve } from "../src/engine/match";
import { choosePlan, inspectAI } from "../src/engine/ai";
import { clone, validateLoadout } from "../src/engine/rules";
import { aggregate } from "../src/metrics/data";
import { simulateGame } from "../src/dev/simulation";
import { validateRecord } from "../server/validation";
const finishRound = (lab: LabController) => {
  if (lab.state.phase === "CONTROL") lab.next();
  if (lab.state.phase === "ASSIGNMENT") lab.next();
  if (lab.state.phase === "LOCKED") lab.next();
  if (lab.state.phase === "REVEAL") lab.resolveCurrent();
  if (lab.state.phase === "RESOLUTION") lab.next();
};
describe("production-backed laboratory", () => {
  it("creates all scenario presets with valid engine content", () => {
    for (const scenario of SCENARIOS) {
      const c = scenario.build();
      expect(c.state.players).toHaveLength(2);
      expect(() => LabController.restore(c.snapshot())).not.toThrow();
    }
  });
  it("sets up all six Legends and reproducible random valid loadouts", () => {
    for (const l of LEGENDS) {
      const a = randomLoadout(l.id, 18);
      expect(a).toEqual(randomLoadout(l.id, 18));
      expect(() => validateLoadout(a)).not.toThrow();
      const setup = defaultSetup();
      setup.players[0] = defaultPlayer(l.id, false);
      expect(new LabController(setup).state.players[0].loadout.legend).toBe(
        l.id,
      );
    }
  });
  it("enforces restrictions unless explicitly bypassed without bypassing action rules", () => {
    const s = defaultSetup();
    s.players[0].loadout.cards[0] = STARTERS.anansi.cards[0];
    expect(() => new LabController(s)).toThrow("incompatible");
    s.ignoreRestrictions = true;
    const c = new LabController(s);
    expect(c.state.players[0].loadout.cards[0]).toBe(STARTERS.anansi.cards[0]);
    c.drafts[0] = {
      controls: [
        { slot: 0, kind: "flip" },
        { slot: 1, kind: "flip" },
      ],
      assignments: [],
    };
    expect(() => c.lock(0)).toThrow("Control");
  });
  it("rejects reducing Control below the already drafted spend without mutating state", () => {
    const lab = new LabController(defaultSetup());
    lab.control(0, { slot: 0, kind: "flip" });
    const before = clone(lab.state);
    expect(() => lab.editPlayer(0, { control: 0 })).toThrow("Control");
    expect(lab.state).toEqual(before);
    lab.setDraft(0, { controls: [], assignments: [] });
    lab.editPlayer(0, { control: 0 });
    expect(lab.state.players[0].control).toBe(0);
  });
  it("normal and spectator projections never expose hidden card IDs or enemy plans", () => {
    const c = new LabController(defaultSetup());
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
    expect(
      c
        .view("Spectator")
        .players.every((p) => p.loadout.cards.every((id) => id === null)),
    ).toBe(true);
    c.lock(1, choosePlan(decisionContext(c.state, 1)));
    expect(c.view("A").players[1].plan).toBe(null);
    expect(c.view("Omniscient").players[1].plan).not.toBe(null);
    expect("seed" in c.view("A")).toBe(false);
  });
  it("preserves known-hand memory and safely rewinds reveal", () => {
    const c = SCENARIOS.find((s) => s.id === "two")!.build();
    const before = c.snapshot();
    finishRound(c);
    expect(c.state.players[0].known).toContain(
      c.state.players[0].loadout.cards[3],
    );
    const restored = LabController.restore(before);
    expect(restored.state.players[0].known).toEqual([]);
  });
  it("consumes fixed/sequence Fate with repeat, random and stop policies", () => {
    for (const end of ["repeat", "random", "stop"] as const) {
      const s = defaultSetup();
      s.fate = {
        mode: "sequence",
        fixed: [0, 0, 0],
        sequence: [[1, 2, 3]],
        end,
      };
      s.players.forEach((p) => (p.ai = false));
      const c = new LabController(s);
      expect(c.state.fate).toEqual([1, 2, 3]);
      finishRound(c);
      c.next();
      if (end === "stop") {
        expect(() => c.next()).toThrow("exhausted");
        expect(c.state.round).toBe(1);
        c.setFate([3, 2, 1], true);
        c.next();
        expect(c.state.fate).toEqual([3, 2, 1]);
      } else {
        c.next();
        expect(c.state.round).toBe(2);
        if (end === "repeat") expect(c.state.fate).toEqual([1, 2, 3]);
      }
    }
  });
  it("uses the same result for normal resolution and primitive-by-primitive stepping", () => {
    for (const legend of LEGENDS) {
      const s = defaultSetup();
      s.players[0] = defaultPlayer(legend.id, false);
      const lab = new LabController(s);
      for (const a of [0, 1] as const) lab.acceptAI(a);
      lab.next();
      const normal = clone(lab.state);
      resolve(normal);
      lab.resolveCurrent();
      expect(lab.state.players).toEqual(normal.players);
      expect(lab.state.events).toEqual(normal.events);
      expect(lab.state.stats).toEqual(normal.stats);
    }
  });
  it("reconstructs an exact suspended resolver when restoring a snapshot", () => {
    const c = SCENARIOS.find((s) => s.id === "two")!.build();
    c.next();
    c.next();
    c.next();
    for (let i = 0; i < 4; i++) c.nextEffect();
    expect(c.resolving).toBe(true);
    const saved = c.snapshot(),
      restored = importSnapshot(JSON.stringify(saved));
    expect(restored.state.players).toEqual(c.state.players);
    c.resolveCurrent();
    restored.resolveCurrent();
    expect(restored.state.players).toEqual(c.state.players);
    expect(restored.state.events).toEqual(c.state.events);
    expect(restored.state.stats).toEqual(c.state.stats);
  });
  it("pauses primitive damage before the simultaneous health boundary", () => {
    const c = SCENARIOS.find((s) => s.id === "simultaneous")!.build();
    c.next();
    c.next();
    c.next();
    let damageSeen = false;
    while (!damageSeen) {
      c.nextEffect();
      damageSeen = c.frames.at(-1)?.effect === "DAMAGE";
    }
    expect(c.state.players.map((p) => p.hp)).toEqual([4, 4]);
    c.resolveCurrent();
    expect(c.state.players.map((p) => p.hp)).toEqual([0, 0]);
    c.next();
    expect(c.state.winner).toBe("draw");
  });
  it("forbids unsafe edits to a suspended priority snapshot", () => {
    const c = SCENARIOS.find((s) => s.id === "two")!.build();
    c.next();
    c.next();
    c.next();
    c.nextEffect();
    expect(() => c.editPlayer(0, { hp: 4 })).toThrow("suspended");
    c.rewind();
    expect(c.state.phase).toBe("REVEAL");
    expect(() => c.editPlayer(0, { hp: 4 })).not.toThrow();
  });
  it("handles safe timeout after Control and leaves a locked plan unchanged", () => {
    const c = new LabController(defaultSetup());
    c.control(0, { slot: 0, kind: "shift", direction: 1 });
    c.timeout(0);
    const plan = clone(c.state.players[0].plan);
    c.timeout(0);
    expect(c.state.players[0].plan).toEqual(plan);
    expect(plan?.assignments.every((a) => a.target === "guard")).toBe(true);
    expect(() => c.control(0, { slot: 0, kind: "flip" })).toThrow("locked");
  });
  it("freezes timers while overlay is open and honors a one-second deadline", () => {
    const s = defaultSetup();
    s.timerMs = 1000;
    const c = new LabController(s);
    c.tick(100);
    c.paused = true;
    c.tick(1100);
    expect(c.remainingMs).toBe(1000);
    c.paused = false;
    c.tick(1600);
    expect(c.remainingMs).toBe(500);
    c.tick(2100);
    expect(c.state.phase).toBe("LOCKED");
  });
  it("supports exact numbered shift boundaries and blank-to-symbol flips", () => {
    const c = SCENARIOS.find((s) => s.id === "blank")!.build();
    expect(() =>
      c.control(0, { slot: 0, kind: "shift", direction: 1 }),
    ).toThrow("numbered");
    c.control(0, { slot: 0, kind: "flip" });
    expect(c.positions(0).positions[0]).toBe(11);
    c.setFace(0, 0, 11);
    expect(() =>
      c.control(0, { slot: 0, kind: "shift", direction: 1 }),
    ).toThrow();
    expect(() => c.editPlayer(0, { control: -1 })).toThrow("Control");
  });
  it("targets card stun and clears only that card’s temporary status", () => {
    const c = SCENARIOS.find((s) => s.id === "stun")!.build();
    finishRound(c);
    expect(
      c.state.events.some(
        (e) => e.type === "fizzle" && e.text.includes("stunned"),
      ),
    ).toBe(true);
    expect(c.state.stats[0].damage[0]).toBe(0);
  });
  it("caps actual healing at max HP and expires poison through cleanup", () => {
    const c = SCENARIOS.find((s) => s.id === "heal")!.build();
    finishRound(c);
    expect(c.state.players[0].hp).toBe(20);
    const poison = SCENARIOS.find((s) => s.id === "cleanup")!.build();
    finishRound(poison);
    expect(poison.state.players[0].hp).toBe(18);
    expect(poison.state.players[0].statuses.map((s) => s.id)).toEqual([
      "power",
    ]);
  });
  it("uses configured round limit and deterministic tie handling", () => {
    const s = defaultSetup();
    s.players[1] = defaultPlayer("basajaun", false);
    s.maxRounds = 1;
    const c = new LabController(s);
    finishRound(c);
    expect(c.state.winner).toBe("draw");
  });
  it("rejects malformed and inconsistent imports without mutating a running session", () => {
    const c = new LabController(defaultSetup());
    const raw = c.snapshot();
    raw.state.players[0].faces[0] = 999;
    expect(() => LabController.restore(raw)).toThrow("Face index");
    expect(() => importSnapshot("{")).toThrow("Invalid JSON");
    const unknown = c.snapshot();
    unknown.state.players[0].loadout.cards[0] = "unknown";
    expect(() => LabController.restore(unknown)).toThrow();
  });
  it("reports actual production AI scores and never changes the chosen plan", () => {
    const c = new LabController(defaultSetup());
    const ctx = decisionContext(c.state, 1),
      d = inspectAI(ctx);
    expect(d.chosen).toEqual(choosePlan(ctx));
    expect(d.alternatives[0].plan).toEqual(d.chosen);
    expect(d.alternatives[0].score).toBe(d.alternatives[0].details.overall);
    expect(d.evaluated).toBeGreaterThan(5);
  });
  it("stores actual Control expenditure when starting above the default resource", () => {
    const c = SCENARIOS.find((s) => s.id === "five")!.build();
    c.control(0, { slot: 0, kind: "flip" });
    finishRound(c);
    expect(c.state.stats[0].control[0]).toBe(2);
  });
});
describe("metrics cohort integrity", () => {
  it("counts equipped vs used cards and paired-seat outcomes independently", () => {
    const config = {
      loadouts: [STARTERS.basajaun, STARTERS.anansi] as [
        typeof STARTERS.basajaun,
        typeof STARTERS.anansi,
      ],
      games: 2,
      difficulty: "Normal" as const,
      seed: 12000,
      paired: true,
    };
    const records = [simulateGame(config, 0), simulateGame(config, 1)],
      data = aggregate(records);
    expect(data.games).toBe(2);
    expect(data.paired).toBe(1);
    expect(data.mismatches).toBe(0);
    expect(
      Object.values(data.byCard).every((c) => c.equipped >= c.usedMatches),
    ).toBe(true);
    expect(aggregate(records, "human").byCard).toEqual({});
  });
  it("rejects forged cohort labels and removes authored names", () => {
    const c = simulateGame(
      {
        loadouts: [STARTERS.basajaun, STARTERS.anansi],
        games: 1,
        difficulty: "Training",
        seed: 2,
        paired: false,
      },
      0,
    );
    expect(() => validateRecord(c, "live")).toThrow("source");
    c.loadouts[0].name = "personal name";
    expect(validateRecord(c, "simulation").loadouts[0].name).toBe(
      "basajaun build",
    );
  });
  it("validates real IDs and faces in metric records", () => {
    const c = simulateGame(
      {
        loadouts: [STARTERS.basajaun, STARTERS.anansi],
        games: 1,
        difficulty: "Training",
        seed: 5,
        paired: false,
      },
      0,
    );
    c.stats[0].faces[0][0] = "unknown:900";
    expect(() => validateRecord(c, "simulation")).toThrow("die");
  });
});
