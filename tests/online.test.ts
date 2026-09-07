import { describe, it, expect } from "vitest";
import {
  startOnline,
  applyOnline,
  expireOnline,
  playerViews,
  checkedLoadout,
} from "../server/online/authority";
import { STARTERS } from "../src/content/loadouts";
import { CARDS } from "../src/content/cards";
import { DICE } from "../src/content/dice";
import { LEGENDS } from "../src/content/legends";
import { choosePlan } from "../src/engine/ai";
import {
  decisionContext,
  verifyReplay,
  exportReplay,
} from "../src/engine/match";
import { onlineApi } from "../server/online/api";
const owned = new Set([...CARDS, ...DICE, ...LEGENDS].map((x) => x.id));
describe("Server authority", () => {
  it("locks validated owned content", () => {
    expect(() => checkedLoadout(STARTERS.basajaun, new Set())).toThrow(
      "not owned",
    );
    expect(() =>
      checkedLoadout(
        { ...STARTERS.basajaun, cards: STARTERS.anansi.cards },
        owned,
      ),
    ).toThrow("incompatible");
    const l = checkedLoadout(STARTERS.basajaun, owned);
    l.cards.reverse();
    expect(l.cards).not.toEqual(STARTERS.basajaun.cards);
  });
  it("sends seat-specific private hands without seed or future rolls", () => {
    const s = startOnline(
        "match",
        34,
        [STARTERS.basajaun, STARTERS.anansi],
        1000,
      ),
      views = playerViews(s);
    expect(views[0].players[1].loadout.cards).toEqual([null, null, null, null]);
    expect(views[1].players[0].loadout.cards).toEqual([null, null, null, null]);
    expect(views[0]).not.toHaveProperty("seed");
    expect(views[0]).not.toHaveProperty("config");
  });
  it("rejects wrong actors, stale revisions and late actions without mutating authority", () => {
    const s = startOnline(
        "match",
        34,
        [STARTERS.basajaun, STARTERS.anansi],
        1000,
      ),
      old = structuredClone(s),
      empty = { assignments: [], controls: [] };
    expect(() =>
      applyOnline(s, (1 - s.activePlayer) as 0 | 1, empty, s.revision, 1001),
    ).toThrow();
    expect(() =>
      applyOnline(s, s.activePlayer, empty, s.revision - 1, 1001),
    ).toThrow("Stale");
    expect(() =>
      applyOnline(s, s.activePlayer, empty, s.revision, s.deadline),
    ).toThrow("timed out");
    expect(s).toEqual(old);
  });
  it("expires an idle decision through the production fallback", () => {
    const s = startOnline(
        "match",
        42,
        [STARTERS.basajaun, STARTERS.anansi],
        1000,
      ),
      next = expireOnline(s, s.deadline);
    expect(next.revision).toBeGreaterThan(s.revision);
    expect(next.activePlayer).not.toBe(s.activePlayer);
    expect(s.phase).toBe("MAIN_ACTION");
  });
  it("completes a real online command exchange and verifies its replay", () => {
    let s = startOnline(
      "match",
      239,
      [STARTERS.basajaun, STARTERS.anansi],
      1000,
    );
    let time = 1000,
      steps = 0;
    while (s.phase !== "MATCH_END" && steps++ < 400) {
      const actor =
        s.phase === "REACTION_WINDOW"
          ? ((1 - s.activePlayer) as 0 | 1)
          : s.activePlayer;
      s = applyOnline(
        s,
        actor,
        choosePlan(decisionContext(s, actor), "Normal"),
        s.revision,
        ++time,
      );
    }
    expect(s.phase).toBe("MATCH_END");
    expect(verifyReplay(exportReplay(s)).winner).toBe(s.winner);
  });
  it("fails closed before any database call when auth is missing", async () => {
    const env = {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "unused",
    };
    for (const path of ["metrics", "matches/state", "simulations"])
      expect(
        (await onlineApi(new Request(`https://example.com/api/${path}`), env))
          .status,
      ).toBe(401);
    const h = await onlineApi(
      new Request("https://example.com/api/health"),
      env,
    );
    expect(await h.json()).toMatchObject({
      product: "OMNIPATH",
      mechanicalVersion: 2,
    });
  });
});
