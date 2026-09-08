export type AffinityId =
  | "might"
  | "guile"
  | "wisdom"
  | "wild"
  | "spirit"
  | "shadow"
  | "order"
  | "chaos";
export type AffinityRequirement =
  | { affinity: AffinityId }
  | { allOf: AffinityRequirement[] }
  | { anyOf: AffinityRequirement[] };
export type CardRarity = "common" | "uncommon" | "rare" | "mythic";
export type OmenSize = 4 | 6 | 8 | 10 | 12 | 20;
export type LegendId =
  "basajaun" | "anansi" | "tengu" | "leshy" | "quetzalcoatl" | "maui";
export type SymbolId =
  "guard" | "strike" | "swap" | "steal" | "redirect" | "smash";
export type OmenFace = {
  type: "number" | "symbol" | "blank";
  value: number;
  effectId?: SymbolId;
  displayIcon: string;
  balanceWeight: number;
  guardValue?: number;
  tags?: string[];
};
export type OmenDefinition = {
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
  | "Ward"
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
  | "knownEnemy"
  | "hasInitiative"
  | "noInitiative"
  | "heldDie"
  | "firstAction";
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
  | "CLEANSE"
  | "REDIRECT"
  | "COUNTERSTRIKE"
  | "CANCEL";
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
  guardPierce?: number;
  scaling?: "halfDieUp";
  omenTarget?: "unspent";
};
export type Requirement = {
  life?: number;
  void?: boolean;
  count: number;
  exact?: number;
  parity?: "odd" | "even";
  relationship?: "equal" | "different";
  held?: boolean;
  initiative?: boolean;
  minRound?: number;
  maxRound?: number;
  legendClass?: string;
  unused?: number;
  min?: number;
  max?: number;
  symbol?: SymbolId;
  any?: boolean;
  size?: DieSize;
  control?: number;
  condition?: Predicate;
};
export type Timing = "ACTION" | "REACTION" | "PASSIVE";
export type CardDef = {
  persistence: "none";
  timing: Timing;
  id: string;
  name: string;
  set: string;
  collectorNumber: number;
  rarity: CardRarity;
  affinityRequirements: AffinityRequirement | null;
  balanceMetadata: {
    intent: string;
    complexity: number;
    repeatability: string;
    reviewNotes: string;
  };
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
  initiativeBonus: number;
  class: string;
  allowedDiceSizes: DieSize[];
  affinities: AffinityId[];
  passiveRule?: {
    trigger:
      | "firstGuard"
      | "firstManipulation"
      | "preferred"
      | "adapt"
      | "categoryChange"
      | "holdOne";
    amount: number;
    value?: number;
  };
  passive: string;
  active: {
    category: Category;
    timing: Timing;
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
export type FocusAction = {
  slot: number;
  kind: "shift" | "flip";
  direction?: -1 | 1;
};
export type Assignment = { target: string; dice: number[] };
export type Plan = {
  omenSlots?: number[];
  controls: ControlAction[];
  assignments: Assignment[];
};
export const PHASES = [
  "MATCH_INTRO",
  "INITIATIVE_ROLL",
  "ROUND_START",
  "TURN_START",
  "OMEN_CHOICE",
  "DICE_ROLL",
  "MAIN_ACTION",
  "ACTION_DECLARED",
  "REACTION_WINDOW",
  "REACTION_DECLARED",
  "RESOLUTION",
  "TURN_END",
  "SECOND_TURN",
  "ROUND_END",
  "MATCH_END",
] as const;
export type OmenResource = {
  state:
    | "UNROLLED"
    | "ROLLING"
    | "AVAILABLE"
    | "HELD"
    | "ASSIGNED"
    | "SPENT"
    | "EXPIRED";
  rolledTurn: number;
  modified: boolean;
  originalFace: number;
};
export type Declaration = {
  actor: 0 | 1;
  assignment: Assignment;
  effects: Effect[];
  category: Category;
  canceled: boolean;
  redirected: boolean;
  prevention: number;
  damageTaken: number;
  heldDice?: number;
};
export type MatchConfig = {
  openingOmenCounts: [number, number];
  initiativeRolls?: [number, number];
  initiativeWinner?: 0 | 1;
  initiativeBonuses?: [number, number];
  rngSeats: [number, number];
};
export type Phase = (typeof PHASES)[number];
export type Status = {
  cardId?: string;
  id: "power" | "ward" | "poison" | "stun";
  amount: number;
  expiresRound: number;
  expiresOwnerTurn?: number;
  tickOwnerTurn?: number;
};
export type PlayerState = {
  playerTurnCount: number;
  loadout: Loadout;
  hp: number;
  guard: number;
  control: number;
  faces: number[];
  dice: DieResource[];
  actionsThisRound: number;
  passiveUsed: string[];
  lastCategory: string | null;
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
  held: number[];
  expired: number[];
  rolls: number[];
  reactions: number[];
  reactionWindows: number[];
  reactionSuccess: number[];
  turns: number[];
};
export type MatchEvent = {
  target?: number;
  wardAbsorbed?: number;
  round: number;
  actor: number;
  type: string;
  text: string;
  amount?: number;
};
export type ReplayTurn = {
  round: number;
  turn: number;
  actor: 0 | 1;
  kind: "plan" | "pass";
  plan?: Plan;
};
export type TurnRecord = {
  turn: number;
  round: number;
  actor: 0 | 1;
  playerTurnCount: number;
  slots: number[];
  lifeAtStart: number[];
  damageAtStart: number[];
  reactionsAtStart: number[];
  damage: number[];
  reactions: number[];
  held: number;
  completed: boolean;
};
export type MatchState = {
  turnHistory: TurnRecord[];
  openingFullLife: number[] | null;
  id: string;
  version: number;
  seed: number;
  config: MatchConfig;
  openingInitiative: {
    rolls: [number, number];
    bonuses: [number, number];
    totals: [number, number];
    winner: 0 | 1;
  } | null;
  initiative: 0 | 1;
  activePlayer: 0 | 1;
  turn: number;
  omenRollCount: number;
  turnInRound: 0 | 1;
  pending: Declaration | null;
  reaction: Declaration | null;
  roundFate: number[] | null;
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
export type MatchView = Omit<
  MatchState,
  "seed" | "players" | "replay" | "config" | "roundFate"
> & {
  players: [PublicPlayer, PublicPlayer];
};
export type DecisionContext = {
  omenRollCount?: number;
  actor?: number;
  resolving?: boolean;
  heldDice?: number;
  phase?: Phase;
  activePlayer?: number;
  turnInRound?: number;
  initiative?: number;
  pending?: Declaration | null;
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
  config: MatchConfig;
};

/** Compatibility aliases for stored v2 field names. New integrations use the canonical names. */
export type DieSize = OmenSize;
export type DieDef = OmenDefinition;
export type Face = OmenFace;
export type ControlAction = FocusAction;
export type DieResource = OmenResource;
export type Hand = [string, string, string, string];
export type OmenSkin = { id: string; name: string; appearance: string };
