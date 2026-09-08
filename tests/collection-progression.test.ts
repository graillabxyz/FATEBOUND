import { describe, it, expect } from "vitest";
import {
  freshProfile,
  LocalProfileService,
  PROFILE_KEY,
} from "../src/services/profile";
import { LEGENDS } from "../src/content/legends";
import { STARTERS } from "../src/content/loadouts";
import {
  OMEN_JOURNEY,
  ownedLegendLoadout,
  signatureFor,
  omenPrice,
} from "../src/content/collection-progression";
import { validateLoadout } from "../src/engine/rules";
import { PACK_CONFIG } from "../src/content/acquisition";
import { PASS_REWARDS } from "../src/content/economy";
const setup = () => {
  const m = new Map<string, string>();
  const storage = {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => {
      m.set(k, v);
    },
    removeItem: (k: string) => {
      m.delete(k);
    },
  };
  return { storage, svc: new LocalProfileService(storage) };
};
describe("single-item collection economy", () => {
  it("every Legend can play with the starter collection without granting Cards or Omens", () => {
    for (const l of LEGENDS) {
      const { svc } = setup();
      const p = { ...freshProfile(), coins: 2000 };
      const n = svc.unlockLegend(p, l.id);
      expect(n.ownedCards).toEqual(p.ownedCards);
      expect(n.ownedOmens).toEqual(p.ownedOmens);
      expect(() =>
        validateLoadout(
          ownedLegendLoadout(l.id, n.ownedCards, n.ownedOmens),
          svc.ownedGameplay(n),
        ),
      ).not.toThrow();
      if (!p.ownedLegends.includes(l.id))
        expect(n.acquisitions.at(-1)?.items).toEqual([
          { kind: "legend", id: l.id },
        ]);
    }
  });
  it("normal earned Legend unlocks grant one item; the authored bonus milestone grants only one extra Omen", () => {
    const { svc } = setup();
    let p = { ...freshProfile(), matches: 15 };
    p = svc.claimLegendMilestone(p, 5, "tengu");
    expect(p.ownedOmens).toHaveLength(6);
    expect(p.ownedCards).toHaveLength(16);
    const n = svc.claimLegendMilestone(p, 15, "leshy");
    expect(n.ownedCards).toEqual(p.ownedCards);
    expect(n.ownedOmens).toEqual([...p.ownedOmens, signatureFor("leshy")]);
    expect(n.acquisitions.at(-1)?.items).toHaveLength(2);
    expect(svc.claimLegendMilestone(p, 15, "maui")).toEqual(n);
  });
  it("an already-owned earned bonus becomes one booster, never a duplicate Omen", () => {
    const { svc } = setup();
    let p = { ...freshProfile(), matches: 15, coins: 1000 };
    p = svc.purchaseOmen(p, signatureFor("leshy"));
    const n = svc.claimLegendMilestone(p, 15, "leshy");
    expect(n.ownedOmens).toEqual(p.ownedOmens);
    expect(n.packs).toBe(p.packs + 1);
    expect(n.acquisitions.at(-1)?.items).toEqual([
      { kind: "legend", id: "leshy" },
      { kind: "booster", amount: 1 },
    ]);
  });
  it.each(OMEN_JOURNEY.milestones)(
    "Omen choice at %i requires completion and grants exactly one signature",
    (m) => {
      const { svc } = setup();
      const p = { ...freshProfile(), matches: m - 1 };
      expect(() =>
        svc.claimOmenMilestone(p, m, signatureFor("tengu")),
      ).toThrow();
      p.matches++;
      expect(() => svc.claimOmenMilestone(p, m, "standard-d20")).toThrow(
        "signature",
      );
      const n = svc.claimOmenMilestone(p, m, signatureFor("tengu"));
      expect(n.ownedLegends).toEqual(p.ownedLegends);
      expect(n.ownedCards).toEqual(p.ownedCards);
      expect(n.ownedOmens.length).toBe(p.ownedOmens.length + 1);
      expect(svc.claimOmenMilestone(p, m, signatureFor("maui"))).toEqual(n);
    },
  );
  it("signature Omens have meaningful prices; size alone does not increase price", () => {
    expect(omenPrice("standard-d4")).toBe(120);
    expect(omenPrice("standard-d20")).toBe(120);
    for (const l of LEGENDS) expect(omenPrice(signatureFor(l.id))).toBe(600);
    const { svc } = setup();
    const p = { ...freshProfile(), gems: 240 };
    const n = svc.purchaseOmen(p, signatureFor("maui"), "gems");
    expect(n.gems).toBe(0);
    expect(n.ownedLegends).toEqual(p.ownedLegends);
    expect(svc.purchaseOmen(p, signatureFor("maui"), "gems")).toEqual(n);
  });
  it("a stale Card purchase cannot erase an acquired Omen", () => {
    const { svc } = setup();
    const p = { ...freshProfile(), coins: 2000 };
    svc.purchaseOmen(p, signatureFor("leshy"));
    expect(() => svc.purchaseCard(p, "ritual")).toThrow("Collection changed");
    expect(svc.load().ownedOmens).toContain(signatureFor("leshy"));
  });
  it("new acquired Legends survive reload without accidentally granting the target recipe", () => {
    const { svc, storage } = setup();
    const p = svc.unlockLegend({ ...freshProfile(), coins: 1000 }, "tengu");
    const n = svc.load();
    expect(n.ownedCards).toEqual(p.ownedCards);
    expect(n.ownedOmens).toEqual(p.ownedOmens);
    expect(n.ownedOmens).not.toContain(signatureFor("tengu"));
    const broken = {
      ...p,
      loadouts: [
        ...p.loadouts.filter((l) => l.legend !== "tengu"),
        STARTERS.tengu,
      ],
    };
    storage.setItem(PROFILE_KEY, JSON.stringify(broken));
    const fixed = svc.load();
    expect(fixed.ownedCards).toEqual(p.ownedCards);
    expect(() =>
      validateLoadout(
        fixed.loadouts.find((l) => l.legend === "tengu")!,
        svc.ownedGameplay(fixed),
      ),
    ).not.toThrow();
  });
  it("booster costs 160, gives exactly two Cards, persists one receipt and never gives a Legend or Omen", () => {
    const { svc } = setup();
    const p = freshProfile();
    svc.save(p);
    const n = svc.openPack(p, 44);
    expect(n.coins).toBe(p.coins - PACK_CONFIG.price);
    expect(n.pendingPack?.cards).toHaveLength(2);
    expect(n.acquisitions.at(-1)?.items.every((i) => i.kind === "card")).toBe(
      true,
    );
    expect(n.ownedLegends).toEqual(p.ownedLegends);
    expect(n.ownedOmens).toEqual(p.ownedOmens);
    expect(svc.openPack(p, 99)).toEqual(n);
  });
  it("Season rewards support typed single-item grants through the same ownership rules", () => {
    const original = PASS_REWARDS[0].free;
    try {
      for (const reward of [
        { type: "legend" as const, id: "tengu" },
        { type: "omen" as const, id: signatureFor("tengu") },
        { type: "card" as const, id: "ritual" },
      ]) {
        const { svc } = setup();
        const p = freshProfile();
        PASS_REWARDS[0].free = {
          ...reward,
          amount: 1,
          label: "Test earned item",
        };
        const n = svc.claimPass(p, 1, "free");
        expect(n.acquisitions.at(-1)?.items).toEqual([
          { kind: reward.type, id: reward.id },
        ]);
        expect(svc.claimPass(n, 1, "free")).toEqual(n);
      }
    } finally {
      PASS_REWARDS[0].free = original;
    }
  });
});
