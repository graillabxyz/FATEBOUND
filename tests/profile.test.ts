import { describe, it, expect } from "vitest";
import {
  freshProfile,
  LocalProfileService,
  periodKey,
} from "../src/services/profile";
import type { StorageAdapter } from "../src/services/profile";
import { createMatch, projectMatch } from "../src/engine/match";
import { STARTERS } from "../src/content/loadouts";
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
const ready = () => createMatch(431, [STARTERS.basajaun, STARTERS.anansi]);
describe("economy and profile regressions", () => {
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

  it("UTC quest refresh is deterministic", () => {
    expect(periodKey("daily", Date.parse("2026-09-07T23:59:59Z"))).toBe(
      "2026-09-07",
    );
    expect(periodKey("daily", Date.parse("2026-09-08T00:00:00Z"))).toBe(
      "2026-09-08",
    );
  });
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
