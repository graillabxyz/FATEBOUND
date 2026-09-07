import { GAME } from "../content/config";
import { validateSavedState } from "../engine/validation";
import { completedUsage } from "./telemetry";
import {
  createMatch,
  advance,
  decisionContext,
  lockPlan,
  projectMatch,
  timeoutPlan,
  exportReplay,
} from "../engine/match";
import { choosePlan } from "../engine/ai";
import type { Difficulty } from "../engine/ai";
import type {
  Loadout,
  MatchState,
  MatchView,
  Plan,
  Replay,
} from "../engine/types";
import type { StorageAdapter } from "./profile";
import { validateLoadout } from "../engine/rules";
import { LEGENDS } from "../content/legends";
import { CARDS } from "../content/cards";
import { OMENS } from "../content/omens";
export type MatchCommand = {
  matchId: string;
  sequence: number;
  round: number;
  revision: number;
  plan: Plan;
};
export type Mode = "Training" | "Casual" | "Ranked";
export interface MatchService {
  readonly isMock: boolean;
  view(): MatchView;
  submit(command: MatchCommand): MatchView;
  tick(now: number, draft?: Plan): MatchView;
  advance(now: number): MatchView;
  reconnect(): MatchView;
  replay(): Replay;
}
const MATCH_KEY = "fatebound.match.v2";
type Checkpoint = {
  state: MatchState;
  difficulty: Difficulty;
  mode: Mode;
  practice: boolean;
  sequences: Record<number, string>;
  startedAt?: number;
};
/** Development-only authority. Replace this entire adapter with authenticated server transport. */
export class LocalMatchService implements MatchService {
  readonly isMock = true;
  private sequences: Record<number, string> = {};
  private startedAt = Date.now();
  constructor(
    private state: MatchState,
    readonly difficulty: Difficulty,
    readonly mode: Mode,
    readonly practice: boolean,
    private storage?: StorageAdapter,
  ) {}
  static start(
    seed: number,
    loadouts: [Loadout, Loadout],
    difficulty: Difficulty,
    mode: Mode,
    practice: boolean,
    storage?: StorageAdapter,
  ) {
    const owned = new Set([
      ...LEGENDS.map((l) => l.id),
      ...CARDS.map((c) => c.id),
      ...OMENS.map((d) => d.id),
    ]);
    loadouts.forEach((l) => validateLoadout(l, owned));
    const s = new LocalMatchService(
      createMatch(seed, loadouts, `local-${seed}-${Date.now()}`),
      difficulty,
      mode,
      practice,
      storage,
    );
    s.persist();
    return s;
  }
  static restore(storage: StorageAdapter) {
    try {
      const data = JSON.parse(
        storage.getItem(MATCH_KEY) ?? "null",
      ) as Checkpoint;
      if (
        !data ||
        data.state.version !== GAME.version ||
        data.state.phase === "MATCH_END"
      )
        return null;
      validateSavedState(data.state);
      const s = new LocalMatchService(
        data.state,
        data.difficulty,
        data.mode,
        data.practice,
        storage,
      );
      s.sequences = data.sequences ?? {};
      s.startedAt = data.startedAt ?? Date.now();
      return s;
    } catch {
      return null;
    }
  }
  view() {
    return projectMatch(this.state);
  }
  private persist() {
    this.storage?.setItem(
      MATCH_KEY,
      JSON.stringify({
        state: this.state,
        difficulty: this.difficulty,
        mode: this.mode,
        practice: this.practice,
        sequences: this.sequences,
        startedAt: this.startedAt,
      }),
    );
  }
  nextSequence() {
    return Math.max(0, ...Object.keys(this.sequences).map(Number)) + 1;
  }
  submit(c: MatchCommand) {
    if (c.matchId !== this.state.id) throw new Error("Wrong match.");
    const body = JSON.stringify({
      round: c.round,
      revision: c.revision,
      plan: c.plan,
    });
    if (this.sequences[c.sequence]) {
      if (this.sequences[c.sequence] !== body)
        throw new Error("Conflicting duplicate command.");
      return this.view();
    }
    if (!Number.isInteger(c.sequence) || c.sequence !== this.nextSequence())
      throw new Error("Out-of-order command.");
    if (c.revision !== this.state.revision)
      throw new Error("Stale decision window.");
    if (c.round !== this.state.round) throw new Error("Stale round.");
    lockPlan(this.state, 0, c.plan);
    this.sequences[c.sequence] = body;
    this.persist();
    return this.view();
  }
  tick(now: number, _draft?: Plan) {
    const phase = this.state.phase;
    const decision = ["OMEN_CHOICE", "MAIN_ACTION"].includes(phase)
      ? this.state.activePlayer
      : phase === "REACTION_WINDOW"
        ? 1 - this.state.activePlayer
        : -1;
    if (decision === 1) {
      lockPlan(
        this.state,
        1,
        choosePlan(decisionContext(this.state, 1), this.difficulty),
      );
      this.persist();
    } else if (
      decision === 0 &&
      (phase === "REACTION_WINDOW" || !this.practice) &&
      now >= this.state.deadline
    ) {
      timeoutPlan(this.state, 0);
      this.persist();
    }
    return this.view();
  }
  advance(now: number) {
    advance(this.state, now);
    if (this.state.phase === "MATCH_END")
      completedUsage(this.state, Math.max(0, Date.now() - this.startedAt));
    this.persist();
    return this.view();
  }
  reconnect() {
    this.tick(Date.now());
    return this.view();
  }
  replay() {
    return exportReplay(this.state);
  }
  abandon() {
    this.storage?.removeItem(MATCH_KEY);
  }
}
