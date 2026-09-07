import { defaultSetup, defaultPlayer } from "./model";
import type { LabSetup } from "./model";
import { LabController } from "./controller";
import { CARDS } from "../content/cards";
import { DICE } from "../content/dice";
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
    "Round 6 · flipped two-die attack",
    "Basajaun 4 HP, Anansi 2 Guard, Web Shift known, D12 flipped; Herensuge assigned.",
    (s) => {
      s.round = 6;
      s.players[0].hp = 4;
      s.players[1].guard = 2;
      s.players[1].known = [s.players[1].loadout.cards[0]];
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
    "Low HP lethal test",
    "Both at 3 HP. High numbered faces.",
    (s) => {
      s.players.forEach((p) => (p.hp = 3));
      s.fate.fixed = [105, 105, 105];
    },
  ),
  scenario(
    "guard",
    "Double Guard test",
    "Two dice assigned to universal Guard on both sides.",
    () => {},
    (c) => {
      for (const a of [0, 1] as const) {
        c.assign(a, 0, "guard");
        c.assign(a, 1, "guard");
      }
    },
  ),
  scenario(
    "two",
    "Two-dice card test",
    "Herensuge has exactly 12 total: D12 7 + D8 5.",
    (s) => {
      s.fate.fixed = [60, 60, 40];
    },
    (c) => {
      c.assign(0, 0, c.state.players[0].loadout.cards[3]);
      c.assign(0, 1, c.state.players[0].loadout.cards[3]);
    },
  ),
  scenario(
    "blank",
    "Flip blank to power face",
    "Heartwood D12 starts Blank. Flip reaches its Guard symbol.",
    (s) => {
      s.players[0].loadout.dice[0] = DICE.find(
        (d) => d.id === "basajaun-d12-0",
      )!.id;
      s.fate.fixed[0] = 0;
    },
  ),
  scenario(
    "simultaneous",
    "Simultaneous lethal",
    "Mirror Basajaun, 4 HP each, Crush on both sides.",
    (s) => {
      s.players[1] = defaultPlayer("basajaun", false);
      s.players.forEach((p) => (p.hp = 4));
      s.fate.fixed = [80, 60, 40];
    },
    (c) => {
      for (const a of [0, 1] as const)
        c.assign(a, 0, c.state.players[a].loadout.cards[0]);
    },
  ),
  scenario(
    "tie",
    "Round 7 tie",
    "Mirror health and damage; empty plans yield deterministic draw.",
    (s) => {
      s.round = 7;
      s.players[1] = defaultPlayer("basajaun", false);
    },
  ),
  scenario(
    "timeout",
    "Timeout test",
    "One-second production safe-Guard fallback.",
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
  scenario("zero", "Control 0", "Both players have no Control.", (s) => {
    s.players.forEach((p) => (p.control = 0));
  }),
  scenario(
    "five",
    "Control 5",
    "Both players start with five Control for resource edge cases.",
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
    "Healing above max HP",
    "Basajaun starts at 20 HP with Deep Roots assigned.",
    (s) => {
      s.players[0].loadout.cards[0] = CARDS.find(
        (c) => c.legend === "basajaun" && c.name === "Deep Roots",
      )!.id;
      s.fate.fixed = [20, 60, 40];
    },
    (c) => c.assign(0, 0, c.state.players[0].loadout.cards[0]),
  ),
  scenario(
    "swap",
    "Competing assignment swaps",
    "Anansi vs Leshy manipulation starters; inspect same-priority frames.",
    (s) => {
      s.players[0] = defaultPlayer("anansi", false);
      s.players[1] = defaultPlayer("leshy", false);
      s.fate.fixed = [60, 60, 60];
    },
  ),
];
