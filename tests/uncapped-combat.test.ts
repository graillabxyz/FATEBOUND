import { expireOnline } from "../server/online/authority";
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { advance, createMatch, lockPlan, pass } from "../src/engine/match";
import { validateSavedState } from "../src/engine/validation";
import { STARTERS } from "../src/content/loadouts";
import { cardById } from "../src/content/cards";
import { GameplayCard } from "../src/ui/components";
import { simulateGame, SimulationStalledError } from "../src/dev/simulation";

describe("uncapped combat", () => {
  it("does not reinterpret an old server battle on timeout", () => {
    const s = createMatch(3, [STARTERS.basajaun, STARTERS.anansi]);
    s.version = 7;
    expect(() => expireOnline(s, 100000)).toThrow("Unsupported battle version");
  });
  it("passes 100 rounds, preserves held Omens, and restores the longer history", () => {
    const s = createMatch(3, [STARTERS.basajaun, STARTERS.anansi]);
    for (let i = 0; s.round < 102 && i < 5000; i++) {
      if (s.phase === "OMEN_CHOICE")
        lockPlan(s, s.activePlayer, {
          controls: [],
          assignments: [],
          omenSlots: [0, 1, 2].slice(0, s.omenRollCount),
        });
      else if (s.phase === "MAIN_ACTION") pass(s, s.activePlayer);
      else advance(s);
    }
    expect(s.round).toBe(102);
    expect(s.winner).toBeNull();
    expect(s.phase).toBe("ROUND_START");
    expect(
      s.players.every((p) => p.dice.every((d) => d.state === "HELD")),
    ).toBe(true);
    expect(() => validateSavedState(structuredClone(s))).not.toThrow();
  });
  it("reports watchdog termination separately from completed match outcomes", () => {
    try {
      simulateGame(
        {
          loadouts: [STARTERS.maui, STARTERS.maui],
          games: 1,
          difficulty: "Normal",
          seed: 3,
          paired: false,
          stallRounds: 1,
        },
        0,
      );
      throw new Error("Expected watchdog");
    } catch (e) {
      expect(e).toBeInstanceOf(SimulationStalledError);
      const detail = (e as SimulationStalledError).detail;
      expect(detail.hp.every((hp) => hp > 0)).toBe(true);
      expect(detail).not.toHaveProperty("winner");
      expect(detail.seed).toBe(3);
    }
  });
  it("keeps accessible Affinity symbols without an Affinity text strip", () => {
    for (const compact of [false, true]) {
      const html = renderToStaticMarkup(
        createElement(GameplayCard, { card: cardById["root-ward"], compact }),
      );
      expect(html).not.toContain('class="card-affinity"');
      expect(html).toContain("affinity-symbols-only");
      expect(html).toContain("REACTION");
      expect(html).toContain('aria-label="Wild OR Spirit"');
    }
  });
});
