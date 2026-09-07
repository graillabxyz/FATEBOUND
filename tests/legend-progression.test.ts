import { describe, it, expect } from "vitest";
import {
  freshProfile,
  LocalProfileService,
  PROFILE_KEY,
  type StorageAdapter,
} from "../src/services/profile";
import {
  LEGEND_JOURNEY,
  legendJourney,
} from "../src/content/legend-progression";
import { LEGEND_COIN_PRICE } from "../src/content/acquisition";
import { STARTERS } from "../src/content/loadouts";
import { LEGENDS } from "../src/content/legends";
import { validateLoadout } from "../src/engine/rules";
import { createMatch, projectMatch } from "../src/engine/match";
const memory = (): StorageAdapter => {
  const values = new Map<string, string>();
  return {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => {
      values.set(k, v);
    },
    removeItem: (k) => {
      values.delete(k);
    },
  };
};
const service = () => new LocalProfileService(memory());

describe("Legend Journey and early unlocks", () => {
  it("starts with two usable Legends and gates all other Loadouts", () => {
    const svc = service(),
      p = freshProfile();
    expect(p.ownedLegends).toEqual(["basajaun", "anansi"]);
    expect(legendJourney(p)).toMatchObject({
      available: [],
      next: 5,
      remaining: 5,
    });
    for (const l of LEGENDS.filter((l) => !p.ownedLegends.includes(l.id)))
      expect(() => svc.saveLoadout(p, STARTERS[l.id])).toThrow(
        "Legend is not owned",
      );
  });
  it.each([5, 15, 30, 50])(
    "awards a choice exactly at %i completed matches",
    (milestone) => {
      const svc = service(),
        p = { ...freshProfile(), matches: milestone - 1 };
      expect(() => svc.claimLegendMilestone(p, milestone, "tengu")).toThrow(
        "required matches",
      );
      p.matches++;
      const n = svc.claimLegendMilestone(p, milestone, "tengu");
      expect(n.coins).toBe(p.coins);
      expect(n.legendUnlocks.tengu).toEqual({ source: "journey", milestone });
      expect(n.legendJourneyClaims).toContain(milestone);
      expect(() =>
        validateLoadout(STARTERS.tengu, svc.ownedGameplay(n)),
      ).not.toThrow();
      expect(svc.load().ownedLegends).toContain("tengu");
      expect(svc.claimLegendMilestone(p, milestone, "leshy")).toEqual(n);
    },
  );
  it("counts a loss toward the fifth match, without double-counting a replayed reward", () => {
    const svc = service(),
      p = { ...freshProfile(), matches: 4 };
    const match = createMatch(100, [STARTERS.basajaun, STARTERS.anansi]);
    match.phase = "MATCH_END";
    match.winner = 1;
    const view = projectMatch(match);
    const n = svc.claimMatch(p, view, "Training");
    expect(n.matches).toBe(5);
    expect(n.wins).toBe(0);
    expect(legendJourney(n).available).toEqual([5]);
    expect(svc.claimMatch(p, view, "Training")).toEqual(n);
  });
  it("Coins and Gems grant identical playable kits and preserve free choices", () => {
    const p = { ...freshProfile(), coins: 2000, gems: 1000, matches: 5 };
    const coinService = service(),
      gemService = service();
    const coins = coinService.unlockLegend(p, "maui", "coins");
    const gems = gemService.unlockLegend(p, "maui", "gems");
    expect(coins.coins).toBe(p.coins - LEGEND_COIN_PRICE);
    expect(gems.gems).toBe(p.gems - LEGEND_JOURNEY.gemPrice);
    expect(coins.ownedCards).toEqual(gems.ownedCards);
    expect(coins.ownedOmens).toEqual(gems.ownedOmens);
    expect(coins.loadouts).toEqual(gems.loadouts);
    expect(legendJourney(gems).available).toEqual([5]);
    expect(
      gemService.claimLegendMilestone(gems, 5, "leshy").ownedLegends,
    ).toContain("leshy");
  });
  it("rejects insufficient funds without mutation and never charges twice", () => {
    const svc = service(),
      p = freshProfile(),
      original = structuredClone(p);
    expect(() => svc.unlockLegend(p, "tengu", "coins")).toThrow(
      "Not enough Coins",
    );
    expect(() => svc.unlockLegend(p, "tengu", "gems")).toThrow(
      "Not enough Gems",
    );
    expect(p).toEqual(original);
    const rich = { ...p, gems: 600 };
    const n = svc.unlockLegend(rich, "tengu", "gems");
    expect(svc.unlockLegend(rich, "tengu", "gems")).toEqual(n);
    expect(() => svc.unlockLegend(rich, "leshy", "gems")).toThrow(
      "Collection changed",
    );
    expect(svc.load().gems).toBe(300);
  });
  it("keeps early-purchased Legends after a match completes with a stale profile", () => {
    const svc = service(),
      p = { ...freshProfile(), gems: 300 };
    svc.unlockLegend(p, "tengu", "gems");
    const m = createMatch(101, [STARTERS.basajaun, STARTERS.anansi]);
    m.phase = "MATCH_END";
    m.winner = 0;
    const n = svc.claimMatch(p, projectMatch(m), "Training");
    expect(n.ownedLegends).toContain("tengu");
    expect(n.gems).toBe(0);
    expect(n.matches).toBe(1);
  });
  it("rejects owned, missing and fabricated choices without consuming a reward", () => {
    const svc = service(),
      p = { ...freshProfile(), matches: 50 };
    expect(() => svc.claimLegendMilestone(p, 5, "basajaun")).toThrow(
      "Choose a Legend",
    );
    expect(() => svc.claimLegendMilestone(p, 5)).toThrow("Choose a Legend");
    expect(() => svc.claimLegendMilestone(p, 6, "leshy")).toThrow(
      "required matches",
    );
    expect(p.legendJourneyClaims).toEqual([]);
  });
  it("all four free choices unlock the full roster, with no spending", () => {
    const svc = service();
    let p = { ...freshProfile(), matches: 50 };
    const locked = LEGENDS.filter((l) => !p.ownedLegends.includes(l.id));
    LEGEND_JOURNEY.milestones.forEach((m, i) => {
      p = svc.claimLegendMilestone(p, m, locked[i].id);
    });
    expect(p.ownedLegends).toHaveLength(6);
    expect(p.coins).toBe(250);
    expect(p.gems).toBe(0);
    for (const l of p.loadouts)
      expect(() => validateLoadout(l, svc.ownedGameplay(p))).not.toThrow();
  });
  it("converts remaining choices into Coins only when the whole roster is owned", () => {
    const svc = service();
    let p = { ...freshProfile(), matches: 50, gems: 1200 };
    for (const l of LEGENDS.filter((l) => !p.ownedLegends.includes(l.id)))
      p = svc.unlockLegend(p, l.id, "gems");
    const n = svc.claimLegendMilestone(p, 5);
    expect(n.coins).toBe(p.coins + 200);
    expect(svc.claimLegendMilestone(p, 5).coins).toBe(n.coins);
    expect(n.ownedLegends).toHaveLength(6);
  });
  it("preserves explicit legacy entitlements without granting the entire roster for a missing version", () => {
    const storage = memory(),
      svc = new LocalProfileService(storage);
    storage.setItem(
      PROFILE_KEY,
      JSON.stringify({
        ...freshProfile(),
        collectionVersion: undefined,
        ownedLegends: ["basajaun", "anansi", "tengu"],
      }),
    );
    expect(svc.load().ownedLegends).toEqual(["basajaun", "anansi", "tengu"]);
    expect(svc.load().legendUnlocks.tengu?.source).toBe("legacy");
    storage.setItem(
      PROFILE_KEY,
      JSON.stringify({
        ...freshProfile(),
        collectionVersion: undefined,
        ownedLegends: undefined,
      }),
    );
    expect(svc.load().ownedLegends).toEqual(["basajaun", "anansi"]);
  });
});
