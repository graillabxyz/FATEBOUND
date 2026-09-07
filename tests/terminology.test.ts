import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { OMENS, omenById } from "../src/content/omens";
import { DICE } from "../src/content/dice";
import { CARDS, cardById } from "../src/content/cards";
import { LEGENDS } from "../src/content/legends";
import { STARTERS } from "../src/content/loadouts";
import {
  GLOSSARY,
  SIGILS,
  omenFace,
  requirementText,
} from "../src/content/terminology";
import {
  createMatch,
  advance,
  lockPlan,
  timeoutPlan,
  exportReplay,
  verifyReplay,
} from "../src/engine/match";
import { validateLoadout } from "../src/engine/rules";
import { loadoutPieces, battleResources } from "../src/engine/vocabulary";
import { LabController } from "../src/dev/controller";
import { defaultSetup } from "../src/dev/model";
import { OmenFaces, FaceExplanation } from "../src/ui/OmenFaces";
import { Glossary } from "../src/ui/Help";
import { Omen, LifeBar, FocusCounter } from "../src/ui/components";
const choice = (winner: 0 | 1 = 0) => {
  const s = createMatch(74, [STARTERS.basajaun, STARTERS.anansi], undefined, {
    initiativeWinner: winner,
  });
  while (s.phase !== "OMEN_CHOICE") advance(s);
  return s;
};
describe("OMNIPATH vocabulary and compatibility", () => {
  it("keeps saved collectible IDs and routes legacy definitions to the same objects", () => {
    expect(DICE).toBe(OMENS);
    for (const l of Object.values(STARTERS))
      expect(() => validateLoadout(l)).not.toThrow();
    expect(cardById["root-ward"].name).toBe("Root Ward");
    expect(omenById["guardian-d6"].name).toBe("Warden’s Oath");
    expect(loadoutPieces(STARTERS.basajaun).hand).toHaveLength(4);
  });
  it("uses canonical content copy and a complete face glossary", () => {
    const copy = [
      ...CARDS.flatMap((c) => [c.name, c.text, c.requirementLabel, c.category]),
      ...LEGENDS.flatMap((l) => [l.passive, l.active.text]),
      ...OMENS.flatMap((o) => [o.name, o.description]),
    ].join(" ");
    expect(copy).not.toMatch(
      /\b(Fatebound|dice|die|guard|control|HP|blank|symbol)\b/i,
    );
    expect(GLOSSARY).toHaveLength(16);
    for (const omen of OMENS)
      for (const face of omen.faces) {
        const f = omenFace(face);
        expect(f.name).toBeTruthy();
        expect(f.rulesText).toBeTruthy();
        if (face.type === "symbol")
          expect(SIGILS[face.effectId!].effectId).toBeTruthy();
        if (face.type === "blank") expect(f.icon).toBe("○");
      }
    expect(requirementText({ count: 2, exact: 10 })).toBe(
      "2 Values totaling exactly 10",
    );
  });
  it("renders Value, Sigil, Void, Ward and Focus accessibly", () => {
    const omen = omenById["guardian-d6"];
    const html = renderToStaticMarkup(createElement(OmenFaces, { omen }));
    expect(html).toContain("Value 2");
    expect(html).toContain("Ward Sigil");
    expect(html).toContain("Void");
    expect(
      renderToStaticMarkup(
        createElement(FaceExplanation, { face: omen.faces[5] }),
      ),
    ).toContain("gain 3 Ward");
    expect(
      renderToStaticMarkup(
        createElement(Omen, { definition: omen, face: omen.faces[0] }),
      ),
    ).toContain("○");
    expect(
      renderToStaticMarkup(
        createElement(LifeBar, { hp: 4, max: 20, guard: 3 }),
      ),
    ).toContain("3 Ward");
    expect(
      renderToStaticMarkup(createElement(FocusCounter, { value: 2 })),
    ).toContain("FOCUS");
    expect(renderToStaticMarkup(createElement(Glossary))).not.toMatch(
      /Fatebound|Guard|Control/,
    );
  });
  it("sets existing Omen faces in the lab without changing collectible definitions", () => {
    const setup = defaultSetup();
    setup.players[0].loadout.dice[0] = "guardian-d6";
    const lab = new LabController(setup),
      before = JSON.stringify(OMENS);
    lab.setOmenValue(0, 0, 4);
    expect(
      omenById["guardian-d6"].faces[lab.state.players[0].faces[0]].value,
    ).toBe(4);
    lab.setOmenVoid(0, 0);
    expect(
      omenById["guardian-d6"].faces[lab.state.players[0].faces[0]].type,
    ).toBe("blank");
    lab.forceSymbol(0, 0, "guard");
    lab.setHeldOmen(0, 0);
    lab.setFocus(0, 5);
    lab.setWard(0, 2);
    expect(battleResources(lab.state.players[0])).toMatchObject({
      focus: 5,
      ward: 2,
      heldOmens: [0],
    });
    expect(() => lab.setOmenValue(0, 0, 20)).toThrow("Fixed faces");
    expect(JSON.stringify(OMENS)).toBe(before);
  });
});
describe("authoritative opening Omen choices", () => {
  it.each([0, 1] as const)(
    "lets Initiative winner %s choose one, the other choose two, then rolls all three",
    (winner) => {
      const s = choice(winner);
      expect(s.omenRollCount).toBe(1);
      const before = structuredClone(s);
      expect(() =>
        lockPlan(s, 1 - winner, {
          controls: [],
          assignments: [],
          omenSlots: [2],
        }),
      ).toThrow("active player");
      expect(() =>
        lockPlan(s, winner, {
          controls: [],
          assignments: [],
          omenSlots: [0, 2],
        }),
      ).toThrow("exactly 1");
      expect(s).toEqual(before);
      lockPlan(s, winner, { controls: [], assignments: [], omenSlots: [2] });
      advance(s);
      expect(s.players[winner].dice.map((d) => d.state)).toEqual([
        "UNROLLED",
        "UNROLLED",
        "AVAILABLE",
      ]);
      lockPlan(s, winner, { controls: [], assignments: [] });
      while (s.phase !== "OMEN_CHOICE") advance(s);
      expect(s.omenRollCount).toBe(2);
      expect(s.activePlayer).toBe(1 - winner);
      const second = s.activePlayer;
      expect(() =>
        lockPlan(s, second, {
          controls: [],
          assignments: [],
          omenSlots: [1, 1],
        }),
      ).toThrow("distinct");
      lockPlan(s, second, { controls: [], assignments: [], omenSlots: [1, 2] });
      advance(s);
      expect(s.players[second].dice.map((d) => d.state)).toEqual([
        "UNROLLED",
        "AVAILABLE",
        "AVAILABLE",
      ]);
      lockPlan(s, second, { controls: [], assignments: [] });
      while (String(s.phase) !== "MAIN_ACTION") advance(s);
      expect(s.round).toBe(2);
      expect(
        s.players[s.activePlayer].dice.every((d) => d.state === "AVAILABLE"),
      ).toBe(true);
      expect(
        s.players[s.activePlayer].dice.every((d) => d.rolledTurn === s.turn),
      ).toBe(true);
      while (String(s.phase) !== "MATCH_END") {
        if (String(s.phase) === "MAIN_ACTION") timeoutPlan(s, s.activePlayer);
        else advance(s);
      }
      const restored = verifyReplay(exportReplay(s));
      expect(restored.players).toEqual(s.players);
      expect(restored.stats).toEqual(s.stats);
    },
  );
  it("opening timeout chooses slots without spending or revealing Cards", () => {
    const s = choice();
    timeoutPlan(s, 0);
    expect(s.players[0].known).toEqual([]);
    expect(s.players[0].control).toBe(2);
    expect(s.players[0].dice.filter((d) => d.state === "ROLLING")).toHaveLength(
      1,
    );
  });
});
