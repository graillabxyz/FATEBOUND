import type { Difficulty } from "../engine/ai";
import type { Loadout, MatchState, Plan, Status } from "../engine/types";
import { GAME } from "../content/config";
import { STARTERS } from "../content/loadouts";
import { clone, validateLoadout } from "../engine/rules";
import { CARDS, cardById } from "../content/cards";
import { OMENS, omenById } from "../content/omens";
import { legendById } from "../content/legends";
import { randomSource } from "../engine/fate";
export type Seat = 0 | 1;
export type ViewMode = "A" | "B" | "Spectator" | "Omniscient";
export type PlayerSetup = {
  turnsTaken: number | null;
  loadout: Loadout;
  hp: number;
  guard: number;
  control: number;
  rank: string;
  ai: boolean;
  difficulty: Difficulty;
  known: string[];
  statuses: Status[];
  damageDealt: number;
  previousCard: string;
  initiativeBonus: number;
  heldFaces: (number | null)[];
};
export type LabSetup = {
  pauseOpening: boolean;
  players: [PlayerSetup, PlayerSetup];
  seed: number;
  round: number;
  maxRounds: number;
  ignoreRestrictions: boolean;
  fate: {
    mode: "random" | "fixed" | "sequence";
    fixed: number[];
    sequence: number[][];
    end: "repeat" | "random" | "stop";
  };
  timerMs: number;
  initiativeRolls: [number, number] | null;
  initiativeWinner: Seat | null;
};
export type LabOptions = {
  view: ViewMode;
  actor: Seat;
  step: boolean;
  auto: boolean;
  pauseTimer: boolean;
  animation: "normal" | "2x" | "4x" | "instant" | "step";
  particles: boolean;
  haptics: boolean;
  camera: boolean;
  debugLabels: boolean;
  pauseBeforeAI: boolean;
};
export type Audit = {
  round: number;
  phase: string;
  action: string;
  detail: unknown;
  error?: boolean;
};
export type LabSnapshot = {
  format: "fatebound-dev-snapshot";
  schema: 1;
  mechanicalVersion: number;
  setup: LabSetup;
  state: MatchState;
  initial: MatchState;
  roundStart: MatchState;
  drafts: [Plan, Plan];
  options: LabOptions;
  nextFate: number[] | null;
  remainingMs: number;
  resolution: { baseline: MatchState; steps: number } | null;
  audit: Audit[];
  memories: Record<string, string>;
  completedFrames: import("../engine/effects").EffectFrame[];
};
export function defaultPlayer(id: Loadout["legend"], ai: boolean): PlayerSetup {
  return {
    loadout: clone(STARTERS[id]),
    turnsTaken: null,
    hp: legendById[id].hp,
    guard: 0,
    control: GAME.controlPerRound,
    rank: "Stone III",
    ai,
    difficulty: "Normal",
    known: [],
    statuses: [],
    damageDealt: 0,
    previousCard: "",
    initiativeBonus: legendById[id].initiativeBonus,
    heldFaces: [null, null, null],
  };
}
export function defaultSetup(): LabSetup {
  return {
    pauseOpening: false,
    players: [defaultPlayer("basajaun", false), defaultPlayer("anansi", true)],
    seed: 31337,
    round: 1,
    maxRounds: GAME.maxRounds,
    ignoreRestrictions: false,
    timerMs: 0,
    initiativeRolls: null,
    initiativeWinner: null,
    fate: {
      mode: "fixed",
      fixed: [12, 66, 102],
      sequence: [
        [12, 66, 102],
        [95, 5, 65],
        [35, 35, 15],
      ],
      end: "repeat",
    },
  };
}
export const defaultOptions = (): LabOptions => ({
  view: "A",
  actor: 0,
  step: true,
  auto: false,
  pauseTimer: false,
  animation: "normal",
  particles: true,
  haptics: false,
  camera: true,
  debugLabels: false,
  pauseBeforeAI: true,
});
export function int(value: number, min: number, max: number, label: string) {
  if (!Number.isInteger(value) || value < min || value > max)
    throw new Error(`${label}: use an integer ${min}–${max}.`);
  return value;
}
export function validateFate(tokens: number[]) {
  if (!Array.isArray(tokens) || tokens.length !== 3)
    throw new Error("Fate requires exactly three shared positions.");
  tokens.forEach((v) => int(v, 0, 119, "Fate token"));
}
export function parseFate(text: string) {
  const values = text
    .trim()
    .split(/[\s,\/]+/)
    .map(Number)
    .map((v) => v - 1);
  validateFate(values);
  return values;
}
export const fateText = (tokens: number[]) =>
  tokens.map((v) => v + 1).join(" / ");
export function restrictionErrors(l: Loadout) {
  const errors: string[] = [];
  try {
    validateLoadout(l);
  } catch (e) {
    errors.push((e as Error).message);
  }
  l.cards.forEach((id, i) => {
    if (cardById[id]?.legend !== l.legend)
      errors.push(`Card ${i + 1}: ${id} is incompatible.`);
  });
  l.dice.forEach((id, i) => {
    const d = omenById[id],
      legend = legendById[l.legend];
    if (
      d &&
      (!legend.allowedDiceSizes.includes(d.size) ||
        (!d.compatibleLegendTags.includes("all") &&
          !d.compatibleLegendTags.some((t) => legend.tags.includes(t))))
    )
      errors.push(`Omen ${i + 1}: ${id} is incompatible.`);
  });
  return [...new Set(errors)];
}
export function validateSetup(s: LabSetup) {
  if (typeof s.pauseOpening !== "boolean")
    throw new Error("Opening choice pause must be enabled or disabled.");
  int(s.seed, 0, 0xffffffff, "Seed");
  int(s.round, 1, 99, "Starting round");
  int(s.maxRounds, s.round, 99, "Maximum round");
  int(s.timerMs, 0, 300000, "Timer milliseconds");
  if (s.players.length !== 2)
    throw new Error("Exactly two players are required.");
  for (const p of s.players) {
    if (!legendById[p.loadout.legend]) throw new Error("Unknown Legend.");
    if (
      p.loadout.cards.length !== 4 ||
      p.loadout.cards.some((id) => !cardById[id])
    )
      throw new Error(
        "Four existing card IDs are required, even in unrestricted mode.",
      );
    if (
      p.loadout.dice.length !== 3 ||
      p.loadout.dice.some((id) => !omenById[id])
    )
      throw new Error("Three existing Omen IDs are required.");
    // Duplicate targets are ambiguous to the real engine; stress-testing compatibility still uses unique cards.
    if (new Set(p.loadout.cards).size !== 4)
      throw new Error(
        "Duplicate card IDs cannot identify unique actions. Choose four distinct cards.",
      );
    if (!s.ignoreRestrictions) validateLoadout(p.loadout);
    int(p.initiativeBonus, 0, 20, "Initiative bonus");
    if (!Array.isArray(p.heldFaces) || p.heldFaces.length !== 3)
      throw new Error("Three held-Omen overrides required.");
    p.heldFaces.forEach((f, i) => {
      if (f !== null)
        int(f, 0, omenById[p.loadout.dice[i]].size - 1, "Held face");
    });
    if (p.turnsTaken !== null)
      int(p.turnsTaken, 0, 197, "Completed player turns");
    int(p.hp, 0, 1000, "Life");
    int(p.guard, 0, 1000, "Ward");
    int(p.control, 0, 6, "Focus");
    int(p.damageDealt, 0, 100000, "Previous damage");
    if (!["Training", "Normal"].includes(p.difficulty))
      throw new Error("Unknown AI difficulty.");
    if (p.known.some((c) => !p.loadout.cards.includes(c)))
      throw new Error("Known cards must be equipped.");
    validateStatuses(p.statuses, p.loadout);
  }
  if (
    !["random", "fixed", "sequence"].includes(s.fate.mode) ||
    !["repeat", "random", "stop"].includes(s.fate.end)
  )
    throw new Error("Unknown Fate policy.");
  validateFate(s.fate.fixed);
  if (s.fate.sequence.length < 1 || s.fate.sequence.length > 100)
    throw new Error("Use 1–100 Fate sequence rows.");
  s.fate.sequence.forEach(validateFate);
}
export function validateStatuses(statuses: Status[], loadout: Loadout) {
  if (!Array.isArray(statuses) || statuses.length > 100)
    throw new Error("Use at most 100 statuses.");
  statuses.forEach((s) => {
    if (!["power", "ward", "poison", "stun"].includes(s.id))
      throw new Error(`Unknown status: ${s.id}`);
    int(s.amount, 0, 1000, "Status amount");
    int(s.expiresRound, 0, 199, "Status expiry");
    if (s.cardId && !loadout.cards.includes(s.cardId))
      throw new Error("Status card must be equipped.");
  });
}
export function randomLoadout(
  legend: Loadout["legend"],
  seed: number,
): Loadout {
  const next = randomSource(seed);
  const pool = CARDS.filter((c) => c.legend === legend).map((c) => c.id);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = next() % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const l = legendById[legend];
  const dice = l.diceSlots.map(() => {
    const options = OMENS.filter(
      (d) =>
        l.allowedDiceSizes.includes(d.size) &&
        (d.compatibleLegendTags.includes("all") ||
          d.compatibleLegendTags.some((t) => l.tags.includes(t))),
    );
    return options[next() % options.length].id;
  });
  return {
    id: `lab-${legend}-${seed}`,
    name: "Random valid loadout",
    legend,
    cards: pool.slice(0, 4),
    dice,
  };
}
