import { defaultSetup, defaultPlayer } from "./model";
import type { LabSetup } from "./model";
import { LabController } from "./controller";
import { CARDS } from "../content/cards";
import { OMENS } from "../content/omens";
export type Scenario = {
  id: string;
  name: string;
  description: string;
  build: () => LabController;
};
function scenario(
  id: string,
  name: string,
  description: string,
  edit: (s: LabSetup) => void = () => {},
  live?: (c: LabController) => void,
): Scenario {
  return {
    id,
    name,
    description,
    build: () => {
      const s = defaultSetup();
      s.players.forEach((p) => (p.ai = false));
      s.initiativeWinner = 0;
      if (["question", "two", "simultaneous", "redirect"].includes(id))
        s.players[0].loadout.cards = [
          "crush",
          "root-ward",
          "barkskin",
          "herensuge",
        ];
      edit(s);
      const c = new LabController(s);
      live?.(c);
      c.initial = structuredClone(c.state);
      c.roundStart = structuredClone(c.state);
      return c;
    },
  };
}
export const SCENARIOS: Scenario[] = [
  scenario(
    "default",
    "Basajaun vs Anansi default",
    "Both default hands. Manual seats, no timer.",
  ),
  scenario(
    "question",
    "Round 6 · flipped two-Omen attack",
    "Basajaun 4 Life, Anansi 2 Ward, Web Shift known, D12 flipped; Herensuge assigned.",
    (s) => {
      s.round = 6;
      s.initiativeWinner = 1;
      s.players[0].hp = 4;
      s.players[1].guard = 2;
      s.players[1].loadout.cards[2] = "web-shift";
      s.players[1].known = ["web-shift"];
      s.fate.fixed = [10, 60, 40];
    },
    (c) => {
      c.control(0, { slot: 0, kind: "flip" });
      c.assign(0, 0, c.state.players[0].loadout.cards[3]);
      c.assign(0, 1, c.state.players[0].loadout.cards[3]);
    },
  ),
  scenario(
    "lethal",
    "Low Life lethal test",
    "Both at 3 Life. High numbered faces.",
    (s) => {
      s.players.forEach((p) => (p.hp = 3));
      s.fate.fixed = [105, 105, 105];
    },
  ),
  scenario(
    "guard",
    "Double Ward test",
    "Round 3: use two Ward activations with separate Omens.",
    (s) => {
      s.round = 3;
    },
    (c) => {
      for (const a of [0, 1] as const) {
        c.assign(a, 0, "guard");
      }
    },
  ),
  scenario(
    "two",
    "Two-Omens card test",
    "Herensuge has exactly 12 total: D12 7 + D8 5.",
    (s) => {
      s.round = 3;
      s.fate.fixed = [60, 60, 40];
    },
    (c) => {
      c.assign(0, 0, c.state.players[0].loadout.cards[3]);
      c.assign(0, 1, c.state.players[0].loadout.cards[3]);
    },
  ),
  scenario(
    "blank",
    "Flip Void to power face",
    "Warden’s Oath starts Void. Flip reaches its Ward Sigil.",
    (s) => {
      s.players[0].loadout.dice[0] = OMENS.find(
        (d) => d.id === "guardian-d6",
      )!.id;
      s.fate.fixed[0] = 0;
    },
  ),
  scenario(
    "simultaneous",
    "Attack → lethal Counterstrike",
    "Both can reach zero in one exchange; retaliation resolves after damage.",
    (s) => {
      s.players[1] = defaultPlayer("basajaun", false);
      s.players[0].hp = 2;
      s.players[1].hp = 4;
      s.players[1].loadout.cards[0] = "counterstrike";
      s.players[1].heldFaces[0] = 7;
      s.fate.fixed[0] = 80;
    },
    (c) => c.assign(0, 0, "crush"),
  ),
  scenario(
    "reaction",
    "Hold → attack → Ancient Ward",
    "Basajaun begins with a held 3, ready to react to Anansi.",
    (s) => {
      s.initiativeWinner = 1;
      s.players[0].heldFaces[0] = 2;
    },
  ),
  scenario(
    "redirect",
    "Attack → Web Turn",
    "Anansi holds an exact 6; redirect Crush back to Basajaun.",
    (s) => {
      s.players[1].loadout.cards[2] = "web-turn";
      s.players[1].heldFaces[0] = 5;
      s.fate.fixed[0] = 80;
    },
    (c) => c.assign(0, 0, "crush"),
  ),
  scenario(
    "tie",
    "Round 7 continues",
    "Equal Life and damage. Pass both turns: the match continues into Round 8.",
    (s) => {
      s.round = 7;
      s.players[1] = defaultPlayer("basajaun", false);
    },
  ),
  scenario(
    "timeout",
    "Timeout test",
    "One-second timeout passes without spending Omens.",
    (s) => {
      s.timerMs = 1000;
    },
  ),
  scenario(
    "known",
    "All four opponent cards known",
    "Production projection shows the whole opponent hand.",
    (s) => {
      s.players[1].known = [...s.players[1].loadout.cards];
    },
  ),
  scenario(
    "hidden",
    "No cards revealed",
    "Production projection hides four cards on either side.",
  ),
  scenario("zero", "Focus 0", "Both players have no Focus.", (s) => {
    s.players.forEach((p) => (p.control = 0));
  }),
  scenario(
    "five",
    "Focus 5",
    "Both players start with five Focus for resource edge cases.",
    (s) => {
      s.players.forEach((p) => (p.control = 5));
    },
  ),
  scenario(
    "stun",
    "Card stun test",
    "Crush specifically stunned; other cards remain usable.",
    (s) => {
      s.fate.fixed = [80, 60, 40];
      s.players[0].statuses = [
        {
          id: "stun",
          amount: 1,
          expiresRound: 1,
          cardId: s.players[0].loadout.cards[0],
        },
      ];
    },
    (c) => c.assign(0, 0, c.state.players[0].loadout.cards[0]),
  ),
  scenario(
    "cleanup",
    "Status cleanup test",
    "Poison due this round; power due next round.",
    (s) => {
      s.players[0].statuses = [
        { id: "poison", amount: 2, expiresRound: 1 },
        { id: "power", amount: 2, expiresRound: 2 },
      ];
    },
  ),
  scenario(
    "heal",
    "Healing above max Life",
    "Basajaun starts at 20 Life with Deep Roots assigned.",
    (s) => {
      s.players[0].loadout.cards[0] = CARDS.find(
        (c) => c.id === "deep-roots",
      )!.id;
      s.fate.fixed = [20, 60, 40];
    },
    (c) => c.assign(0, 0, c.state.players[0].loadout.cards[0]),
  ),
  scenario(
    "swap",
    "Single reaction window",
    "Anansi vs Leshy: one reaction only, deterministic prevention then action.",
    (s) => {
      s.players[0] = defaultPlayer("anansi", false);
      s.players[1] = defaultPlayer("leshy", false);
      s.fate.fixed = [60, 60, 60];
    },
  ),
];
