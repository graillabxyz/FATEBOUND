import { createElement } from "react";
import { describe, it, expect } from "vitest";
import { CARDS, cardById, cardsFor } from "../src/content/cards";
import {
  AFFINITIES,
  meetsAffinity,
  cardCompatible,
  affinityText,
} from "../src/content/affinities";
import { LEGENDS, legendById } from "../src/content/legends";
import {
  STARTERS,
  STARTER_CARDS,
  STARTER_OMENS,
} from "../src/content/loadouts";
import { OMENS, omenById } from "../src/content/omens";
import {
  createMatch,
  lockPlan,
  advance,
  decisionContext,
} from "../src/engine/match";
import {
  validateLoadout,
  meetsRequirement,
  EMPTY_PLAN,
} from "../src/engine/rules";
import {
  freshProfile,
  LocalProfileService,
  PROFILE_KEY,
} from "../src/services/profile";
import { rollPack } from "../src/services/packs";
import { PACK_CONFIG } from "../src/content/acquisition";
import { GAME } from "../src/content/config";
import {
  legalHands,
  activationProfile,
  effectUtility,
} from "../src/dev/affinity-balance";
import { renderToStaticMarkup } from "react-dom/server";
import { AffinityLine } from "../src/ui/Affinities";
const storage = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
};
describe("global alpha pool and Affinity authority", () => {
  it("defines one unique 60-Card set and a viable complexity rarity distribution", () => {
    expect(CARDS).toHaveLength(60);
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(60);
    expect(new Set(CARDS.map((c) => c.collectorNumber)).size).toBe(60);
    expect(
      CARDS.every(
        (c) =>
          !("legend" in c) &&
          !c.tags.some((t) => t.startsWith("legend:")) &&
          c.set === "first-light",
      ),
    ).toBe(true);
    expect(
      ["common", "uncommon", "rare", "mythic"].map(
        (r) => CARDS.filter((c) => c.rarity === r).length,
      ),
    ).toEqual([29, 18, 9, 4]);
    expect(OMENS).toHaveLength(12);
    expect(OMENS.filter((d) => d.tags.includes("signature"))).toHaveLength(6);
  });
  it("evaluates nested AND/OR and Unbound without using effect tags", () => {
    const r = {
      allOf: [
        { affinity: "might" as const },
        {
          anyOf: [
            { affinity: "wild" as const },
            { affinity: "wisdom" as const },
          ],
        },
      ],
    };
    expect(meetsAffinity(["might", "wild"], r)).toBe(true);
    expect(meetsAffinity(["wild"], r)).toBe(false);
    expect(meetsAffinity([], null)).toBe(true);
    expect(meetsAffinity([], { allOf: [] })).toBe(false);
    expect(meetsAffinity([], { anyOf: [] })).toBe(false);
    expect(affinityText(r)).toBe("Might AND (Wild OR Wisdom)");
    expect(
      cardCompatible(legendById.anansi, { ...cardById.crush, tags: ["guile"] }),
    ).toBe(false);
  });
  it("offers 25–40 legal Cards per Legend and validates every legal pairing with production match creation", () => {
    let pairs = 0;
    for (const l of LEGENDS) {
      const legal = cardsFor(l.id);
      expect(legal.length).toBeGreaterThanOrEqual(25);
      expect(legal.length).toBeLessThanOrEqual(40);
      for (const card of CARDS) {
        const cards = [
          card.id,
          ...legal
            .filter((c) => c.id !== card.id)
            .slice(0, 3)
            .map((c) => c.id),
        ];
        const build = { ...STARTERS[l.id], cards };
        if (cardCompatible(l, card)) {
          expect(() =>
            createMatch(5, [build, STARTERS.basajaun]),
          ).not.toThrow();
          pairs++;
        } else expect(() => validateLoadout(build)).toThrow("Requires");
      }
    }
    expect(pairs).toBe(201);
  });
  it("shares Root Ward across compatible Legends and keeps exact dual Affinity constraints", () => {
    expect(cardsFor("basajaun")).toContain(cardById["root-ward"]);
    expect(cardsFor("maui")).toContain(cardById["root-ward"]);
    expect(cardsFor("anansi")).not.toContain(cardById["root-ward"]);
    expect(cardsFor("tengu")).toContain(cardById["precision-cut"]);
    expect(cardsFor("anansi")).not.toContain(cardById["precision-cut"]);
  });
  it("requires every Affinity on specialist Cards, including all three of a triad", () => {
    const triad = cardById["wild-bloom"].affinityRequirements;
    expect(affinityText(triad)).toBe("Wild AND Might AND Spirit");
    expect(meetsAffinity(["wild", "might", "spirit"], triad)).toBe(true);
    for (const pair of [
      ["wild", "might"],
      ["wild", "spirit"],
      ["might", "spirit"],
    ] as const)
      expect(meetsAffinity(pair, triad)).toBe(false);
    expect(cardsFor("basajaun")).toContain(cardById["wild-bloom"]);
    expect(cardsFor("maui")).not.toContain(cardById["wild-bloom"]);
    expect(cardsFor("quetzalcoatl")).not.toContain(cardById["wild-bloom"]);
    expect(cardsFor("anansi")).toContain(cardById.unravel);
    expect(cardsFor("leshy")).toContain(cardById["night-spores"]);
    expect(affinityText(cardById.sanctuary.affinityRequirements)).toBe(
      "Spirit AND Wisdom",
    );
    expect(cardsFor("basajaun")).not.toContain(cardById.sanctuary);
    expect(cardsFor("quetzalcoatl")).toContain(cardById.sanctuary);
  });
  it("enumerates all unique four-Card Hands rather than four isolated pools", () => {
    const count = cardsFor("leshy").length,
      hands = [...legalHands("leshy")];
    expect(hands.length).toBe(
      (count * (count - 1) * (count - 2) * (count - 3)) / 24,
    );
    expect(new Set(hands.map((h) => h.join("|"))).size).toBe(hands.length);
  });
  it("evaluates exact Omen probabilities without rarity bonuses", () => {
    const p = activationProfile(cardById["quick-strike"], "anansi", [
      "standard-d4",
      "standard-d4",
      "standard-d4",
    ]);
    expect(p.raw).toBeCloseTo(1 - 1 / 64);
    expect(effectUtility([{ type: "DAMAGE", amount: 3 }])).toBe(3);
    expect(
      meetsRequirement({ count: 1, void: true }, [
        omenById["guardian-d6"].faces[0],
      ]),
    ).toBe(true);
    expect(
      meetsRequirement(
        { count: 1, void: true },
        [omenById["standard-d6"].faces[0]],
        [],
        1,
      ),
    ).toBe(false);
  });
  it("gives all eight Affinities distinct non-color symbols and renders logical requirements", () => {
    expect(AFFINITIES).toHaveLength(8);
    expect(new Set(AFFINITIES.map((a) => a.symbol)).size).toBe(8);
    const markup = renderToStaticMarkup(
      createElement(AffinityLine, {
        requirement: { allOf: [{ affinity: "might" }, { affinity: "wisdom" }] },
      }),
    );
    expect(markup).toContain("Might AND Wisdom");
  });
});
describe("two-Legend starter collection and acquisition", () => {
  it("grants two Legends, sixteen shared Cards and four numbered and two signature Omen types", () => {
    const p = freshProfile();
    expect(p.ownedLegends).toEqual(["basajaun", "anansi"]);
    expect(p.ownedCards).toHaveLength(16);
    expect(p.ownedOmens).toEqual(STARTER_OMENS);
    expect(p.loadouts).toHaveLength(2);
    for (const l of p.loadouts)
      expect(() =>
        validateLoadout(
          l,
          new Set([...p.ownedLegends, ...p.ownedCards, ...p.ownedOmens]),
        ),
      ).not.toThrow();
    expect(
      STARTER_CARDS.every((id) =>
        ["common", "uncommon"].includes(cardById[id].rarity),
      ),
    ).toBe(true);
  });
  it("rejects unowned but compatible Cards at the service and authority boundary", () => {
    const svc = new LocalProfileService(storage()),
      p = freshProfile(),
      l = {
        ...p.loadouts[0],
        cards: ["wild-bloom", ...p.loadouts[0].cards.slice(1)],
      };
    expect(() => svc.saveLoadout(p, l)).toThrow("owned");
    expect(() => validateLoadout(STARTERS.tengu, svc.ownedGameplay(p))).toThrow(
      "Legend is not owned",
    );
  });
  it("migrates old IDs, preserves acquired content and repairs Hand legality without erasing currency", () => {
    const st = storage(),
      svc = new LocalProfileService(st),
      p = {
        ...freshProfile(),
        collectionVersion: undefined,
        coins: 999,
        loadouts: [
          {
            ...STARTERS.basajaun,
            cards: [
              "basajaun-crush",
              "basajaun-ancient-root",
              "basajaun-barkskin",
              "basajaun-herensuge",
            ],
          },
        ],
      };
    st.setItem(PROFILE_KEY, JSON.stringify(p));
    const next = svc.load();
    expect(next.coins).toBe(999);
    expect(next.ownedLegends).toEqual(["basajaun", "anansi"]);
    expect(next.loadouts[0].cards).toEqual([
      "crush",
      "root-ward",
      "barkskin",
      "herensuge",
    ]);
    next.loadouts.forEach((l) =>
      expect(() => validateLoadout(l, svc.ownedGameplay(next))).not.toThrow(),
    );
  });
  it("repairs a newly incompatible saved Hand without removing acquired specialist Cards", () => {
    const st = storage(),
      svc = new LocalProfileService(st),
      p = freshProfile();
    p.ownedLegends.push("maui");
    p.ownedCards.push("wild-bloom", ...STARTERS.maui.cards);
    p.ownedOmens.push(...STARTERS.maui.dice);
    p.loadouts.push({
      ...STARTERS.maui,
      cards: ["wild-bloom", ...STARTERS.maui.cards.slice(0, 3)],
    });
    st.setItem(PROFILE_KEY, JSON.stringify(p));
    const migrated = svc.load();
    expect(migrated.ownedCards).toContain("wild-bloom");
    const hand = migrated.loadouts.find((l) => l.legend === "maui")!;
    expect(hand.cards).not.toContain("wild-bloom");
    expect(hand.cards).toHaveLength(4);
    expect(() =>
      validateLoadout(hand, svc.ownedGameplay(migrated)),
    ).not.toThrow();
  });
  it("opens exactly two distinct Cards deterministically and respects rarity ownership protection", () => {
    for (let seed = 0; seed < 200; seed++) {
      const p = rollPack(seed, [], "test");
      expect(p.cards).toHaveLength(2);
      expect(new Set(p.cards).size).toBe(2);
      expect(rollPack(seed, [], "test")).toEqual(p);
      expect(p.duplicates).toEqual([false, false]);
      const all = rollPack(
        seed,
        CARDS.map((c) => c.id),
        "test",
      );
      expect(all.coins).toBe(PACK_CONFIG.duplicateCoins * 2);
    }
  });
  it("pays once, persists before reveal, resumes the same pack and requires two reveals", () => {
    const svc = new LocalProfileService(storage()),
      p = freshProfile();
    svc.save(p);
    const n = svc.openPack(p, 42);
    expect(n.coins).toBe(150);
    expect(n.pendingPack?.cards).toHaveLength(2);
    expect(svc.openPack(n, 99).pendingPack).toEqual(n.pendingPack);
    const id = n.pendingPack!.id;
    expect(() => svc.finishPack(n, id)).toThrow("Reveal both");
    const one = svc.revealPack(n, id),
      two = svc.revealPack(one, id);
    expect(svc.finishPack(two, id).pendingPack).toBeNull();
    expect(svc.load().ownedCards).toEqual(n.ownedCards);
  });
  it("allows earned packs without Coins and grants free pass packs idempotently", () => {
    const svc = new LocalProfileService(storage()),
      p = { ...freshProfile(), coins: 0, packs: 1, seasonXp: 150 };
    svc.save(p);
    const n = svc.openPack(p, 1);
    expect(n.coins).toBeGreaterThanOrEqual(0);
    expect(n.packs).toBe(0);
    const reward = svc.claimPass(n, 2, "free");
    expect(reward.packs).toBe(1);
    expect(svc.claimPass(reward, 2, "free")).toBe(reward);
    expect(reward.claimedPass).toContain(`${GAME.season.id}:2:free`);
  });
  it("lets Coins unlock any rarity, readable Legend kits and Omens without premium", () => {
    const svc = new LocalProfileService(storage()),
      p = { ...freshProfile(), coins: 2000 };
    const n = svc.purchaseCard(p, "ritual");
    expect(n.ownedCards).toContain("ritual");
    expect(n.premium).toBe(false);
    const l = svc.unlockLegend(n, "leshy");
    expect(l.ownedLegends).toContain("leshy");
    expect(() =>
      validateLoadout(STARTERS.leshy, svc.ownedGameplay(l)),
    ).not.toThrow();
    expect(svc.purchaseOmen(l, "guardian-d6").ownedOmens).toContain(
      "guardian-d6",
    );
  });
});
describe("shared-pool Omen interactions use production resolution", () => {
  const start = (s: ReturnType<typeof createMatch>) => {
    while (s.phase !== "MAIN_ACTION") {
      if (s.phase === "OMEN_CHOICE") {
        lockPlan(s, s.activePlayer, {
          ...EMPTY_PLAN,
          omenSlots: Array.from({ length: s.omenRollCount }, (_, i) => i),
        });
      } else advance(s);
    }
    return s;
  };
  const ready = (cards: string[], legend: "leshy" | "anansi" = "leshy") => {
    const s = createMatch(
      5,
      [
        {
          ...STARTERS[legend],
          cards,
          dice: ["guardian-d6", "standard-d6", "standard-d8"],
        },
        STARTERS.basajaun,
      ],
      undefined,
      { initiativeWinner: 0 },
    );
    start(s);
    for (const p of s.players) p.dice.forEach((d) => (d.state = "AVAILABLE"));
    return s;
  };
  it("Hollow Sign consumes a Void and flips another unspent Omen, never itself", () => {
    const s = ready(["hollow-sign", "branch-lash", "moss-mantle", "lost-path"]);
    s.players[0].faces = [0, 1, 0];
    lockPlan(s, 0, {
      controls: [],
      assignments: [{ target: "hollow-sign", dice: [0] }],
    });
    advance(s);
    lockPlan(s, 1, EMPTY_PLAN);
    advance(s);
    expect(s.players[0].faces[0]).toBe(0);
    expect(s.players[0].dice[0].state).toBe("SPENT");
    expect(s.players[0].faces[1]).toBe(4);
  });
  it("rejects Void conversion without another resource", () => {
    const s = ready(["hollow-sign", "branch-lash", "moss-mantle", "lost-path"]);
    s.players[0].faces[0] = 0;
    s.players[0].dice[1].state = "SPENT";
    s.players[0].dice[2].state = "SPENT";
    expect(() =>
      lockPlan(s, 0, {
        controls: [],
        assignments: [{ target: "hollow-sign", dice: [0] }],
      }),
    ).toThrow("unused");
  });
  it("Thread the Path rechecks paid Action requirements after shifting", () => {
    const s = createMatch(
      4,
      [
        {
          ...STARTERS.basajaun,
          cards: ["crush", "root-ward", "barkskin", "herensuge"],
        },
        {
          ...STARTERS.anansi,
          cards: [
            "thread-the-path",
            "silken-cut",
            "read-the-thread",
            "hidden-meaning",
          ],
        },
      ],
      undefined,
      { initiativeWinner: 0 },
    );
    start(s);
    s.players[0].faces[0] = 6;
    s.players[0].dice[0].state = "AVAILABLE";
    s.players[1].faces[0] = 4;
    s.players[1].dice[0].state = "HELD";
    lockPlan(s, 0, {
      controls: [],
      assignments: [{ target: "crush", dice: [0] }],
    });
    advance(s);
    expect(decisionContext(s, 1).phase).toBe("REACTION_WINDOW");
    lockPlan(s, 1, {
      controls: [],
      assignments: [{ target: "thread-the-path", dice: [0] }],
    });
    advance(s);
    advance(s);
    expect(s.players[0].faces[0]).toBe(5);
    expect(s.players[1].hp).toBe(18);
    expect(s.players[0].dice[0].state).toBe("SPENT");
  });
});
