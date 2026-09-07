import { describe, it, expect } from "vitest";
import { CARDS, cardsFor } from "../src/content/cards";
import { DICE, dieById, SIZES, dieBudget } from "../src/content/dice";
import { LEGENDS } from "../src/content/legends";
import { STARTERS } from "../src/content/loadouts";
import { GAME } from "../src/content/config";
import { facePosition, sharedFate } from "../src/engine/fate";
import {
  createMatch,
  beginRound,
  projectMatch,
  decisionContext,
  lockPlan,
  reveal,
  resolve,
  cleanup,
  verifyReplay,
  exportReplay,
  advance,
  decideWinner,
} from "../src/engine/match";
import {
  applyControls,
  validateLoadout,
  validatePlan,
  safePlan,
  EMPTY_PLAN,
} from "../src/engine/rules";
import { choosePlan } from "../src/engine/ai";
import { supportedPrimitives } from "../src/engine/effects";
import type { LegendId, Loadout, Plan, MatchState } from "../src/engine/types";
import { LocalMatchService } from "../src/services/match-service";
import {
  freshProfile,
  LocalProfileService,
  periodKey,
} from "../src/services/profile";
import type { StorageAdapter } from "../src/services/profile";
const memory = (): StorageAdapter => {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => {
      m.set(k, v);
    },
    removeItem: (k) => {
      m.delete(k);
    },
  };
};
function ready(a: LegendId = "basajaun", b: LegendId = "anansi", seed = 431) {
  const s = createMatch(seed, [STARTERS[a], STARTERS[b]]);
  beginRound(s);
  s.phase = "ASSIGNMENT";
  return s;
}
function round(s: MatchState, a: Plan, b: Plan) {
  lockPlan(s, 0, a);
  lockPlan(s, 1, b);
  reveal(s);
  resolve(s);
  cleanup(s);
}
function simulate(seed: number, a: Loadout, b: Loadout) {
  const s = createMatch(seed, [a, b]);
  for (let i = 0; i < 7 && s.winner === null; i++) {
    beginRound(s);
    s.phase = "ASSIGNMENT";
    const plans = s.players.map((_, actor) =>
      choosePlan(decisionContext(s, actor), "Normal"),
    );
    round(s, plans[0], plans[1]);
  }
  s.phase = "MATCH_END";
  return s;
}

describe("authored content invariants", () => {
  it("contains six complete Legends and 72 concise cards", () => {
    expect(LEGENDS).toHaveLength(6);
    expect(CARDS).toHaveLength(72);
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(72);
    for (const l of LEGENDS) {
      expect(cardsFor(l.id)).toHaveLength(12);
      expect(() => validateLoadout(STARTERS[l.id])).not.toThrow();
      expect(new Set(cardsFor(l.id).map((c) => c.archetype)).size).toBe(3);
    }
    for (const c of CARDS)
      expect(c.text.split(/\s+/).length).toBeLessThanOrEqual(25);
  });
  it("all effects are registered and every die has a valid involutive opposite map", () => {
    const visit = (effects: (typeof CARDS)[0]["effects"]) =>
      effects.forEach((e) => {
        expect(supportedPrimitives).toContain(e.type);
        if (e.effects) visit(e.effects);
      });
    CARDS.forEach((c) => visit(c.effects));
    for (const d of DICE) {
      expect(d.faces).toHaveLength(d.size);
      expect(d.faceCount).toBe(d.size);
      expect(new Set(d.opposites).size).toBe(d.size);
      d.opposites.forEach((j, i) => {
        expect(j).not.toBe(i);
        expect(d.opposites[j]).toBe(i);
      });
      expect(Number.isFinite(dieBudget(d).variance)).toBe(true);
    }
  });
  it("custom utility dice have lower mean budgets than their standard counterpart", () => {
    for (const d of DICE.filter((d) => d.rarity === "rare"))
      expect(dieBudget(d).mean).toBeLessThan(
        dieBudget(dieById[`standard-d${d.size}`]).mean,
      );
  });
  it("rejects illegal ownership, duplicate cards, incompatible sizes and foreign cards", () => {
    expect(() =>
      validateLoadout({
        ...STARTERS.basajaun,
        cards: Array(4).fill(STARTERS.basajaun.cards[0]),
      }),
    ).toThrow();
    expect(() =>
      validateLoadout({
        ...STARTERS.basajaun,
        dice: ["standard-d20", "standard-d8", "standard-d6"],
      }),
    ).toThrow();
    expect(() => validateLoadout(STARTERS.basajaun, new Set())).toThrow();
    expect(() =>
      validateLoadout({ ...STARTERS.basajaun, cards: STARTERS.anansi.cards }),
    ).toThrow();
  });
});
describe("Shared Fate and deterministic Control", () => {
  it("maps the same normalized event uniformly to every supported die size", () => {
    for (const size of SIZES) {
      const counts = Array(size).fill(0);
      for (let token = 0; token < 120; token++)
        counts[facePosition(token, size)]++;
      expect(counts.every((n) => n === 120 / size)).toBe(true);
    }
    expect(() => facePosition(120, 6)).toThrow();
    expect(() => facePosition(-1, 6)).toThrow();
    expect(() => facePosition(0.5, 6)).toThrow();
  });
  it("is reproducible and equal for identical loadouts in every slot", () => {
    for (let seed = 0; seed < 100; seed++) {
      expect(sharedFate(seed, 3)).toEqual(sharedFate(seed, 3));
      const s = ready("tengu", "tengu", seed);
      expect(s.players[0].faces).toEqual(s.players[1].faces);
    }
    expect(sharedFate(4, 2)).not.toEqual(sharedFate(4, 3));
  });
  it("enforces exact Control cost, numbered SHIFT bounds and designed symbol FLIP", () => {
    expect(
      applyControls(
        STARTERS.basajaun,
        [4, 2, 1],
        [{ slot: 0, kind: "shift", direction: 1 }],
      ),
    ).toEqual({ positions: [5, 2, 1], control: 1 });
    expect(() =>
      applyControls(
        STARTERS.basajaun,
        [0, 2, 1],
        [{ slot: 0, kind: "shift", direction: -1 }],
      ),
    ).toThrow();
    expect(() =>
      applyControls(
        STARTERS.basajaun,
        [4, 2, 1],
        [
          { slot: 0, kind: "flip" },
          { slot: 1, kind: "shift", direction: 1 },
        ],
      ),
    ).toThrow();
    const l = {
      ...STARTERS.basajaun,
      dice: ["basajaun-d12-0", "standard-d8", "standard-d6"],
    };
    expect(
      applyControls(l, [0, 0, 0], [{ slot: 0, kind: "flip" }]).positions[0],
    ).toBe(11);
    expect(dieById[l.dice[0]].faces[11].effectId).toBe("guard");
    expect(() =>
      applyControls(l, [0, 0, 0], [{ slot: 0, kind: "shift", direction: 1 }]),
    ).toThrow();
  });
});
describe("hidden information and reusable cards", () => {
  it("projection seals seed, future Fate, hidden cards and assignments from both players", () => {
    const s = ready();
    const v = projectMatch(s);
    expect("seed" in v).toBe(false);
    expect("replay" in v).toBe(false);
    expect(v.players[1].loadout.cards).toEqual([null, null, null, null]);
    expect(v.players[1].plan).toBe(null);
    const ai = decisionContext(s, 1);
    expect(ai.enemy.loadout.cards).toEqual([null, null, null, null]);
    expect(ai.enemy.plan).toBe(null);
  });
  it("reveals both plans together and permanently remembers cards without consuming them", () => {
    const s = ready();
    s.players[0].faces = [8, 2, 1];
    s.players[1].faces = [2, 2, 2];
    const a = {
      controls: [],
      assignments: [{ target: STARTERS.basajaun.cards[0], dice: [0] }],
    };
    const b = {
      controls: [],
      assignments: [{ target: STARTERS.anansi.cards[1], dice: [1] }],
    };
    lockPlan(s, 0, a);
    expect(projectMatch(s, 1).players[0].plan).toBe(null);
    lockPlan(s, 1, b);
    reveal(s);
    expect(projectMatch(s).players[1].loadout.cards[1]).toBe(
      b.assignments[0].target,
    );
    resolve(s);
    cleanup(s);
    beginRound(s);
    expect(s.players[0].loadout.cards).toEqual(STARTERS.basajaun.cards);
    expect(projectMatch(s).players[1].loadout.cards[1]).toBe(
      b.assignments[0].target,
    );
    expect(s.players[0].control).toBe(2);
    expect(s.players[0].guard).toBe(0);
  });
  it("rejects reused dice and duplicate actions, accepts a two-die finisher", () => {
    const s = ready();
    s.players[0].faces = [10, 6, 5];
    const ctx = decisionContext(s, 0);
    expect(() =>
      validatePlan(ctx, {
        controls: [],
        assignments: [
          { target: "guard", dice: [0] },
          { target: STARTERS.basajaun.cards[0], dice: [0] },
        ],
      }),
    ).toThrow();
    expect(() =>
      validatePlan(ctx, {
        controls: [],
        assignments: [
          { target: STARTERS.basajaun.cards[0], dice: [0] },
          { target: STARTERS.basajaun.cards[0], dice: [1] },
        ],
      }),
    ).toThrow();
    expect(() =>
      validatePlan(ctx, {
        controls: [],
        assignments: [{ target: STARTERS.basajaun.cards[3], dice: [0, 1] }],
      }),
    ).not.toThrow();
  });
  it("Leshy permits only one off-by-one adaptation per round", () => {
    const s = ready("leshy");
    s.players[0].faces = [3, 3, 1];
    const c = STARTERS.leshy.cards;
    expect(() =>
      validatePlan(decisionContext(s, 0), {
        controls: [],
        assignments: [
          { target: c[0], dice: [0] },
          { target: c[1], dice: [1] },
        ],
      }),
    ).toThrow();
  });
});
describe("deterministic resolution and end states", () => {
  it("Guard absorbs damage, Basajaun receives first-Guard bonus, and Guard expires", () => {
    const s = ready();
    s.players[0].faces = [0, 0, 0];
    s.players[1].faces = [6, 0, 0];
    round(
      s,
      {
        controls: [],
        assignments: [{ target: STARTERS.basajaun.cards[1], dice: [0] }],
      },
      {
        controls: [],
        assignments: [{ target: STARTERS.anansi.cards[0], dice: [0] }],
      },
    );
    expect(s.players[0].hp).toBe(20);
    expect(s.stats[0].guard[0]).toBe(5);
    expect(s.players[0].guard).toBe(0);
  });
  it("resolves same-priority lethal simultaneously", () => {
    const s = ready("basajaun", "basajaun");
    s.players.forEach((p) => {
      p.hp = 4;
      p.faces = [7, 0, 0];
    });
    const plan = {
      controls: [],
      assignments: [{ target: STARTERS.basajaun.cards[0], dice: [0] }],
    };
    round(s, plan, plan);
    expect(s.players.map((p) => p.hp)).toEqual([0, 0]);
    expect(s.winner).toBe("draw");
  });
  it("uses HP, then effective damage, then a draw at the round limit", () => {
    const s = ready();
    s.players[0].hp = s.players[1].hp = 5;
    s.players[0].damageDealt = 10;
    s.players[1].damageDealt = 9;
    decideWinner(s, true);
    expect(s.winner).toBe(0);
    s.players[1].damageDealt = 10;
    decideWinner(s, true);
    expect(s.winner).toBe("draw");
  });
  it("assignment swapping can invalidate requirements while retaining known-card memory", () => {
    const s = ready("anansi", "basajaun");
    s.players[0].faces = [7, 0, 0];
    s.players[1].faces = [8, 1, 1];
    round(
      s,
      {
        controls: [],
        assignments: [{ target: STARTERS.anansi.cards[3], dice: [0] }],
      },
      {
        controls: [],
        assignments: [
          { target: STARTERS.basajaun.cards[0], dice: [0] },
          { target: STARTERS.basajaun.cards[1], dice: [1] },
        ],
      },
    );
    expect(s.events.filter((e) => e.type === "fizzle")).toHaveLength(2);
    expect(s.players[1].known).toHaveLength(2);
    expect(s.stats[0].guard[0]).toBe(2);
  });
  it("AI never relies on hidden loadout cards or pending intent", () => {
    const s = ready();
    const before = choosePlan(decisionContext(s, 1));
    s.players[0].loadout.cards = cardsFor("basajaun")
      .slice(8)
      .map((c) => c.id);
    s.players[0].plan = {
      controls: [],
      assignments: [{ target: "guard", dice: [0] }],
    };
    expect(choosePlan(decisionContext(s, 1))).toEqual(before);
  });
  it("completes every Legend matchup and replays deterministically", () => {
    for (const l of LEGENDS) {
      const s = simulate(928, STARTERS[l.id], STARTERS.anansi);
      expect(s.winner).not.toBe(null);
      expect(s.round).toBeLessThanOrEqual(7);
      expect(s.players.every((p) => p.hp >= 0)).toBe(true);
      const replay = verifyReplay(exportReplay(s));
      expect(
        replay.players.map((p) => ({
          hp: p.hp,
          damage: p.damageDealt,
          known: p.known,
        })),
      ).toEqual(
        s.players.map((p) => ({
          hp: p.hp,
          damage: p.damageDealt,
          known: p.known,
        })),
      );
      expect(replay.winner).toBe(s.winner);
    }
  }, 30000);
  it("swapping seats preserves outcome for deterministic AIs", () => {
    const s = simulate(45, STARTERS.basajaun, STARTERS.tengu),
      t = simulate(45, STARTERS.tengu, STARTERS.basajaun);
    expect(s.players.map((p) => p.hp)).toEqual(
      t.players.map((p) => p.hp).reverse(),
    );
    expect(s.stats.map((r) => r.damage)).toEqual(
      t.stats.map((r) => [...r.damage].reverse()),
    );
  }, 30000);
});
describe("mock service authority and progression", () => {
  it("timeout converts unassigned legal dice to Guard and never invents an attack", () => {
    const s = ready("anansi");
    s.players[0].faces = [0, 1, 2];
    const safe = safePlan(decisionContext(s, 0));
    expect(safe.assignments.every((a) => a.target === "guard")).toBe(true);
    expect(safe.assignments.flatMap((a) => a.dice)).toEqual([1, 2]);
  });
  it("timeout preserves valid drafted offensive actions and guards the remainder", () => {
    const s = ready();
    s.players[0].faces = [9, 0, 0];
    const plan = {
      controls: [],
      assignments: [{ target: STARTERS.basajaun.cards[0], dice: [0] }],
    };
    const safe = safePlan(decisionContext(s, 0), plan);
    expect(safe.assignments[0]).toEqual(plan.assignments[0]);
    expect(safe.assignments).toHaveLength(3);
  });
  it("validates command sequence, round, duplicates, reconnect checkpoint and timer expiry", () => {
    const store = memory();
    const svc = LocalMatchService.start(
      1,
      [STARTERS.basajaun, STARTERS.anansi],
      "Training",
      "Training",
      false,
      store,
    );
    while (svc.view().phase !== "CONTROL") svc.advance(100);
    const view = svc.view();
    expect(() =>
      svc.submit({ matchId: view.id, sequence: 1, round: 2, plan: EMPTY_PLAN }),
    ).toThrow("Stale round");
    const cmd = { matchId: view.id, sequence: 1, round: 1, plan: EMPTY_PLAN };
    const locked = svc.submit(cmd);
    expect(svc.submit(cmd)).toEqual(locked);
    expect(() =>
      svc.submit({
        ...cmd,
        plan: { controls: [], assignments: [{ target: "guard", dice: [0] }] },
      }),
    ).toThrow("Conflicting");
    const restored = LocalMatchService.restore(store)!;
    expect(restored.view()).toEqual(svc.view());
    const expired = LocalMatchService.start(
      2,
      [STARTERS.basajaun, STARTERS.anansi],
      "Training",
      "Training",
      false,
    );
    while (expired.view().phase !== "CONTROL") expired.advance(100);
    expired.tick(100 + GAME.decisionMs + 1);
    expect(expired.view().phase).toBe("LOCKED");
  });
  it("rewards are idempotent and premium cosmetics never change mechanical loadouts", () => {
    const store = memory();
    const svc = new LocalProfileService(store);
    const p = freshProfile();
    const s = ready();
    s.phase = "MATCH_END";
    s.winner = 0;
    const v = projectMatch(s);
    const n = svc.claimMatch(p, v, "Training");
    expect(n.xp).toBe(120);
    expect(n.coins).toBe(300);
    expect(n.mastery.basajaun).toBe(40);
    expect(svc.claimMatch(n, v, "Training")).toBe(n);
    const rich = { ...n, gems: 1000 };
    const bought = svc.purchaseCosmetic(rich, "obsidian");
    expect(bought.loadouts).toEqual(rich.loadouts);
    expect(bought.cosmetics).toContain("obsidian");
    expect(() => svc.purchaseCosmetic(rich, "mythic")).toThrow();
  });
  it("pass claims cannot repeat or claim locked premium levels", () => {
    const svc = new LocalProfileService(memory()),
      p = freshProfile();
    const n = svc.claimPass(p, 1, "free");
    expect(n.coins).toBe(p.coins + 50);
    expect(svc.claimPass(n, 1, "free")).toBe(n);
    expect(svc.claimPass(p, 2, "free")).toBe(p);
    expect(svc.claimPass(p, 1, "premium")).toBe(p);
  });
  it("has explicit phase transitions and refuses premature reveal", () => {
    const s = createMatch(7, [STARTERS.basajaun, STARTERS.anansi]);
    expect(() => reveal(s)).toThrow();
    advance(s, 0);
    expect(s.phase).toBe("ROUND_START");
    advance(s, 0);
    expect(s.phase).toBe("FATE");
    advance(s, 0);
    expect(s.phase).toBe("ROLLING");
    advance(s, 200);
    expect(s.deadline).toBe(200 + GAME.decisionMs);
  });
  it("UTC quest refresh is deterministic", () => {
    expect(periodKey("daily", Date.parse("2026-09-07T23:59:59Z"))).toBe(
      "2026-09-07",
    );
    expect(periodKey("daily", Date.parse("2026-09-08T00:00:00Z"))).toBe(
      "2026-09-08",
    );
  });
});
describe("regressions from simulation", () => {
  it("simultaneous manipulation validates both cards before either swap changes their dice", () => {
    const a = STARTERS.anansi,
      b = STARTERS.leshy;
    const aPlan: Plan = {
      controls: [],
      assignments: [
        { target: a.cards[3], dice: [0] },
        { target: a.cards[0], dice: [1] },
      ],
    };
    const bPlan: Plan = {
      controls: [],
      assignments: [
        { target: b.cards[3], dice: [0] },
        { target: b.cards[0], dice: [1] },
      ],
    };
    const play = (swapped: boolean) => {
      const s = createMatch(1, swapped ? [b, a] : [a, b]);
      beginRound(s);
      s.phase = "ASSIGNMENT";
      s.players[swapped ? 1 : 0].faces = [7, 5, 0];
      s.players[swapped ? 0 : 1].faces = [4, 7, 0];
      round(s, swapped ? bPlan : aPlan, swapped ? aPlan : bPlan);
      return s;
    };
    const s = play(false),
      t = play(true);
    expect(s.players.map((p) => p.hp)).toEqual([16, 21]);
    expect(t.players.map((p) => p.hp)).toEqual([21, 16]);
    expect(s.events.some((e) => e.type === "block")).toBe(true);
  });
  it("stored strength starts next round and expires after that round", () => {
    const s = ready();
    s.players[0].loadout.cards[2] = cardsFor("basajaun")[5].id;
    s.players[0].faces = [4, 0, 0];
    round(
      s,
      {
        controls: [],
        assignments: [{ target: s.players[0].loadout.cards[2], dice: [0] }],
      },
      EMPTY_PLAN,
    );
    expect(s.players[0].statuses[0].id).toBe("power");
    beginRound(s);
    s.phase = "ASSIGNMENT";
    s.players[0].faces = [7, 0, 0];
    round(
      s,
      {
        controls: [],
        assignments: [{ target: s.players[0].loadout.cards[0], dice: [0] }],
      },
      EMPTY_PLAN,
    );
    expect(s.stats[1].damage[0]).toBe(6);
    expect(s.players[0].statuses).toHaveLength(0);
  });
  it("all authored cards have an attainable requirement on a compatible build", () => {
    for (const card of CARDS) {
      const l = LEGENDS.find((l) => l.id === card.legend)!;
      const dice = l.diceSlots.flatMap((size) =>
        DICE.filter(
          (d) =>
            d.size === size &&
            (d.compatibleLegendTags.includes("all") ||
              d.compatibleLegendTags.some((t) => l.tags.includes(t))),
        ),
      );
      const faces = dice.flatMap((d) => d.faces);
      const r = card.requirement;
      let reachable = false;
      if (r.any) reachable = true;
      else if (r.symbol) reachable = faces.some((f) => f.effectId === r.symbol);
      else if (r.count === 1)
        reachable = faces.some(
          (f) =>
            f.type === "number" &&
            f.value >= (r.min ?? 0) &&
            f.value <= (r.max ?? Infinity),
        );
      else
        reachable = l.diceSlots.some((size, i) =>
          l.diceSlots.some(
            (other, j) => i !== j && size + other >= (r.min ?? 0),
          ),
        );
      expect(reachable, card.name).toBe(true);
    }
  });
});
describe("progression edge cases", () => {
  it("replaces only an unclaimed daily quest and rejects inactive or repeated claims", () => {
    const service = new LocalProfileService(memory());
    const now = Date.parse("2026-09-07T12:00:00Z"),
      key = periodKey("daily", now);
    const p = freshProfile();
    p.questCounts[key] = { control: 6, reveals: 6 };
    expect(service.claimQuest(p, "daily-reveal", now)).toBe(p);
    const replaced = service.replaceDaily(p, now);
    expect(service.replaceDaily(replaced, now)).toBe(replaced);
    expect(service.claimQuest(replaced, "daily-control", now)).toBe(replaced);
    const claimed = service.claimQuest(replaced, "daily-reveal", now);
    expect(claimed.seasonXp).toBe(75);
    expect(service.claimQuest(claimed, "daily-reveal", now)).toBe(claimed);
    const originallyClaimed = service.claimQuest(p, "daily-control", now);
    expect(service.replaceDaily(originallyClaimed, now)).toBe(
      originallyClaimed,
    );
  });
  it("converts repeated pass cosmetics to an explicit Coin reward", () => {
    const service = new LocalProfileService(memory());
    const p = { ...freshProfile(), seasonXp: 1200 };
    const first = service.claimPass(p, 3, "free");
    expect(first.cosmetics).toContain("first-light");
    const duplicate = service.claimPass(first, 8, "free");
    expect(duplicate.coins).toBe(first.coins + 50);
    expect(service.claimPass(duplicate, 8, "free")).toBe(duplicate);
  });
});
