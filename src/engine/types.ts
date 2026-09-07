export type DieSize = 4 | 6 | 8 | 10 | 12 | 20;
export type LegendId =
  "basajaun" | "anansi" | "tengu" | "leshy" | "quetzalcoatl" | "maui";
export type SymbolId = "guard" | "strike" | "swap" | "steal" | "redirect";
export type Face = {
  type: "number" | "symbol" | "blank";
  value: number;
  effectId?: SymbolId;
  displayIcon: string;
  balanceWeight: number;
};
export type DieDef = {
  id: string;
  name: string;
  size: DieSize;
  faceCount: number;
  faces: Face[];
  opposites: number[];
  tags: string[];
  compatibleLegendTags: string[];
  rarity: "common" | "rare";
  mechanicalVersion: number;
  description: string;
};
export type Category =
  | "Attack"
  | "Guard"
  | "Counter"
  | "Recovery"
  | "Manipulation"
  | "Setup"
  | "Finisher"
  | "Prediction";
export type Predicate =
  | "behind"
  | "guarding"
  | "enemyAttacking"
  | "enemyGuarding"
  | "unusedDie"
  | "threeActions"
  | "lowHP"
  | "knownEnemy";
export type Primitive =
  | "DAMAGE"
  | "HEAL"
  | "GUARD"
  | "SHIFT_DIE"
  | "FLIP_DIE"
  | "SWAP_ASSIGNMENT"
  | "BLOCK_EFFECT"
  | "STUN_CARD"
  | "MODIFY_REQUIREMENT"
  | "GAIN_CONTROL"
  | "LOSE_CONTROL"
  | "STATUS"
  | "CONDITIONAL"
  | "MULTIPLIER"
  | "CONVERT"
  | "COPY"
  | "CLEANSE";
export type Effect = {
  type: Primitive;
  amount?: number;
  status?: "power" | "ward" | "poison" | "stun";
  target?: "self" | "enemy";
  condition?: Predicate;
  effects?: Effect[];
  duration?: number;
  from?: "guard" | "hp";
  direction?: -1 | 1;
};
export type Requirement = {
  count: number;
  min?: number;
  max?: number;
  symbol?: SymbolId;
  any?: boolean;
  size?: DieSize;
  control?: number;
  condition?: Predicate;
};
export type CardDef = {
  id: string;
  name: string;
  legend: LegendId;
  category: Category;
  archetype: string;
  requirement: Requirement;
  requirementLabel: string;
  text: string;
  effects: Effect[];
  priority: number;
  preferred?: number;
  artIndex: number;
  tags: string[];
  mechanicalVersion: number;
};
export type Legend = {
  id: LegendId;
  name: string;
  region: string;
  archetype: string;
  subtitle: string;
  lore: string;
  hp: number;
  passive: string;
  active: {
    name: string;
    text: string;
    requirement: Requirement;
    effects: Effect[];
  };
  diceSlots: DieSize[];
  tags: string[];
  color: string;
  artIndex: number;
  animationProfile: string;
  approaches: string[];
};
export type Loadout = {
  id: string;
  name: string;
  legend: LegendId;
  cards: string[];
  dice: string[];
};
export type ControlAction = {
  slot: number;
  kind: "shift" | "flip";
  direction?: -1 | 1;
};
export type Assignment = { target: string; dice: number[] };
export type Plan = { controls: ControlAction[]; assignments: Assignment[] };
export const PHASES = [
  "WAITING",
  "INTRO",
  "ROUND_START",
  "FATE",
  "ROLLING",
  "CONTROL",
  "ASSIGNMENT",
  "LOCKED",
  "REVEAL",
  "RESOLUTION",
  "CLEANUP",
  "ROUND_END",
  "MATCH_END",
] as const;
export type Phase = (typeof PHASES)[number];
export type Status = {
  cardId?: string;
  id: "power" | "ward" | "poison" | "stun";
  amount: number;
  expiresRound: number;
};
export type PlayerState = {
  loadout: Loadout;
  hp: number;
  guard: number;
  control: number;
  faces: number[];
  known: string[];
  statuses: Status[];
  damageDealt: number;
  locked: boolean;
  plan: Plan | null;
};
export type RoundStats = {
  round: number;
  damage: number[];
  guard: number[];
  control: number[];
  cards: string[][];
  unused: number[];
  faces: string[][];
};
export type MatchEvent = {
  round: number;
  actor: number;
  type: string;
  text: string;
  amount?: number;
};
export type ReplayTurn = { round: number; plans: [Plan, Plan] };
export type MatchState = {
  id: string;
  version: number;
  seed: number;
  round: number;
  phase: Phase;
  fate: number[];
  players: [PlayerState, PlayerState];
  events: MatchEvent[];
  stats: RoundStats[];
  replay: ReplayTurn[];
  winner: 0 | 1 | "draw" | null;
  deadline: number;
  revision: number;
};
export type PublicPlayer = Omit<PlayerState, "loadout" | "plan"> & {
  loadout: Omit<Loadout, "cards"> & { cards: (string | null)[] };
  plan: Plan | null;
};
export type MatchView = Omit<MatchState, "seed" | "players" | "replay"> & {
  players: [PublicPlayer, PublicPlayer];
};
export type DecisionContext = {
  round: number;
  fate: number[];
  self: PlayerState;
  enemy: PublicPlayer;
};
export type Replay = {
  seed: number;
  version: number;
  loadouts: [Loadout, Loadout];
  turns: ReplayTurn[];
};
