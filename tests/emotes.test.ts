import { GAME } from "../src/content/config";
import { describe, it, expect } from "vitest";
import { EMOTES, DEFAULT_EMOTES, EMOTE_CONFIG } from "../src/content/emotes";
import { LocalEmoteTransport } from "../src/services/emotes";
import {
  freshProfile,
  LocalProfileService,
  PROFILE_KEY,
} from "../src/services/profile";
import { createMatch, projectMatch } from "../src/engine/match";
import { STARTERS } from "../src/content/loadouts";
const setup = () => {
  const map = new Map<string, string>(),
    storage = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => {
        map.set(k, v);
      },
      removeItem: (k: string) => {
        map.delete(k);
      },
    };
  return { storage, svc: new LocalProfileService(storage) };
};
describe("collectible cosmetic emotes", () => {
  it("migrates old profiles without changing mechanics and sanitizes equipped ownership", () => {
    const { storage, svc } = setup();
    const p = freshProfile();
    const old = {
      ...p,
      ownedEmotes: undefined,
      equippedEmotes: undefined,
      avatar: undefined,
      achievementProgress: undefined,
    };
    storage.setItem(PROFILE_KEY, JSON.stringify(old));
    const migrated = svc.load();
    expect(migrated.ownedEmotes).toEqual(DEFAULT_EMOTES);
    expect(migrated.equippedEmotes).toHaveLength(5);
    expect(migrated.loadouts).toEqual(p.loadouts);
    storage.setItem(
      PROFILE_KEY,
      JSON.stringify({
        ...p,
        equippedEmotes: ["respect", "hey", "hey", "unknown", "good-game"],
      }),
    );
    expect(svc.load().equippedEmotes).toEqual([
      null,
      "hey",
      null,
      null,
      "good-game",
    ]);
  });
  it("migrates already claimed pass rewards into the emote collection once", () => {
    const { storage, svc } = setup();
    storage.setItem(
      PROFILE_KEY,
      JSON.stringify({
        ...freshProfile(),
        claimedPass: [`${GAME.season.id}:4:free`],
      }),
    );
    const p = svc.load();
    expect(p.ownedEmotes.filter((id) => id === "nice-spark")).toHaveLength(1);
    svc.save(p);
    expect(
      svc.load().ownedEmotes.filter((id) => id === "nice-spark"),
    ).toHaveLength(1);
  });
  it("separates ownership from five equipped slots and refuses unowned emotes", () => {
    const { svc } = setup(),
      p = freshProfile();
    expect(() => svc.equipEmote(p, 0, "respect")).toThrow("earned");
    expect(() => svc.equipEmote(p, 5, "hey")).toThrow("five");
    const moved = svc.equipEmote(p, 4, "hey");
    expect(moved.equippedEmotes).toEqual([
      null,
      "good-luck",
      "nice",
      "good-game",
      "hey",
    ]);
    expect(svc.equipEmote(moved, 4, null).ownedEmotes).toEqual(p.ownedEmotes);
  });
  it("grants free and premium pass emotes once and never changes combat loadouts", () => {
    const { svc } = setup(),
      p = { ...freshProfile(), seasonXp: 6000 };
    let n = svc.claimPass(p, 4, "free");
    expect(n.ownedEmotes).toContain("nice-spark");
    expect(svc.claimPass(n, 4, "free")).toBe(n);
    expect(svc.claimPass(n, 25, "premium")).toBe(n);
    n = svc.claimPass({ ...n, premium: true }, 25, "premium");
    expect(n.ownedEmotes).toContain("sun-salute");
    expect(n.loadouts).toEqual(p.loadouts);
    expect(n.equippedEmotes).toEqual(DEFAULT_EMOTES);
  });
  it("allows only the listed shop and bundle purchases with idempotent ownership", () => {
    const { svc } = setup(),
      p = { ...freshProfile(), coins: 1000 };
    const bought = svc.purchaseEmote(p, "moon-greeting");
    expect(bought.coins).toBe(850);
    expect(svc.purchaseEmote(bought, "moon-greeting")).toBe(bought);
    expect(() => svc.purchaseEmote(p, "respect")).toThrow("earned");
    expect(() =>
      svc.purchaseEmote({ ...p, coins: 0 }, "moon-greeting"),
    ).toThrow("Not enough");
    const bundle = svc.purchaseEmoteBundle(p, "wayfarer-greetings");
    expect(bundle.ownedEmotes).toContain("bright-path");
    expect(bundle.coins).toBe(750);
    expect(svc.purchaseEmoteBundle(bundle, "wayfarer-greetings")).toBe(bundle);
    expect(bundle.loadouts).toEqual(p.loadouts);
  });
  it("grants measured achievement, rank, and mastery rewards without replaying match rewards", () => {
    const { svc } = setup(),
      p = freshProfile(),
      s = createMatch(6, [STARTERS.basajaun, STARTERS.anansi]);
    s.phase = "MATCH_END";
    s.winner = 0;
    s.events.push({
      round: 1,
      actor: 1,
      type: "damage",
      text: "Blocked",
      amount: 0,
      target: 0,
      wardAbsorbed: 5,
    });
    p.achievementProgress = {
      rankedWins: 99,
      basajaunRankedWins: 99,
      wardAbsorbed: 495,
    };
    p.rankPoints = 875;
    p.mastery.basajaun = 1760;
    const n = svc.claimMatch(p, projectMatch(s), "Ranked");
    expect(n.ownedEmotes).toEqual(
      expect.arrayContaining([
        "first-victory",
        "warden-emote",
        "basajaun-master",
        "respect",
        "old-friend",
      ]),
    );
    expect(n.achievementProgress.wardAbsorbed).toBe(500);
    expect(svc.claimMatch(n, projectMatch(s), "Ranked")).toBe(n);
  });
  it("rejects arbitrary text, enforces cooldown, locks equipped set and expires bubbles", () => {
    const owned = [...DEFAULT_EMOTES],
      equipped = [...DEFAULT_EMOTES],
      t = new LocalEmoteTransport(owned, equipped);
    equipped[0] = "respect";
    expect(() => t.send("respect", 0)).toThrow("Equip");
    expect(() => t.send("arbitrary chat", 0)).toThrow("Equip");
    t.send("hey", 0);
    expect(() => t.send("nice", 1)).toThrow("moment");
    expect(t.read(0)).toHaveLength(1);
    expect(t.read(1000).map((m) => m.sender)).toEqual([0, 1]);
    expect(t.read(3700)).toHaveLength(0);
    expect(() => t.send("nice", EMOTE_CONFIG.cooldownMs)).not.toThrow();
  });
  it("keeps source definitions unique and prestige emotes unpurchasable", () => {
    expect(new Set(EMOTES.map((e) => e.id)).size).toBe(EMOTES.length);
    expect(DEFAULT_EMOTES).toHaveLength(5);
    expect(
      EMOTES.filter((e) => e.rarity === "prestige").every(
        (e) => e.price === undefined,
      ),
    ).toBe(true);
  });
});
