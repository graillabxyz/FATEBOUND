import { SIGILS } from "../content/terminology";
import { validateSavedState } from "../engine/validation";
import {
  advance,
  beginRound,
  createMatch,
  decisionContext,
  decideWinner,
  lockPlan,
  projectMatch,
  recordResolution,
  timeoutPlan,
} from "../engine/match";
import { resolutionSteps, type EffectFrame } from "../engine/effects";
import { choosePlan, inspectAI } from "../engine/ai";
import { applyControls, clone, EMPTY_PLAN, safePlan } from "../engine/rules";
import { facePosition } from "../engine/fate";
import type {
  ControlAction,
  MatchState,
  MatchView,
  Plan,
  PlayerState,
  Status,
} from "../engine/types";
import { GAME } from "../content/config";
import { STARTERS } from "../content/loadouts";
import { omenById } from "../content/omens";
import { legendById } from "../content/legends";
import {
  defaultOptions,
  int,
  validateFate,
  validateSetup,
  validateStatuses,
} from "./model";
import type {
  Audit,
  LabOptions,
  LabSetup,
  LabSnapshot,
  Seat,
  ViewMode,
} from "./model";
const freshDrafts = (): [Plan, Plan] => [clone(EMPTY_PLAN), clone(EMPTY_PLAN)];
const planningPhases = ["OMEN_CHOICE", "MAIN_ACTION", "REACTION_WINDOW"];
export class LabController {
  setup: LabSetup;
  state: MatchState;
  initial: MatchState;
  roundStart: MatchState;
  drafts = freshDrafts();
  options: LabOptions = defaultOptions();
  audit: Audit[] = [];
  frames: (EffectFrame & { round?: number })[] = [];
  memories: Record<string, string> = {};
  nextFate: number[] | null = null;
  remainingMs: number;
  paused = false;
  stopped = false;
  epoch = 0;
  private lastTick = 0;
  private lastAdvance = 0;
  private sequence = 0;
  private pendingResolution: {
    baseline: MatchState;
    steps: number;
    iterator: ReturnType<typeof resolutionSteps>;
  } | null = null;
  constructor(setup: LabSetup) {
    validateSetup(setup);
    this.setup = clone(setup);
    this.remainingMs = setup.timerMs;
    // Only setup compatibility is bypassed. Actions still go through production validation.
    this.state = createMatch(
      setup.seed,
      setup.players.map((p) => STARTERS[p.loadout.legend]) as [
        typeof STARTERS.basajaun,
        typeof STARTERS.basajaun,
      ],
      `lab-${setup.seed}`,
      {
        initiativeBonuses: setup.players.map((p) => p.initiativeBonus) as [
          number,
          number,
        ],
        initiativeRolls: setup.initiativeRolls ?? undefined,
        initiativeWinner: setup.initiativeWinner ?? undefined,
      },
    );
    this.state.players.forEach((p, i) => {
      p.loadout = clone(setup.players[i].loadout);
      p.playerTurnCount = setup.players[i].turnsTaken ?? setup.round - 1;
    });
    this.state.round = setup.round - 1;
    beginRound(this.state, 0, this.fateForRound(setup.round));
    while (
      this.state.phase !== "MAIN_ACTION" &&
      this.state.phase !== "MATCH_END"
    ) {
      if (this.state.phase === "OMEN_CHOICE") {
        if (setup.pauseOpening) break;
        const actor = this.state.activePlayer;
        lockPlan(
          this.state,
          actor,
          choosePlan(
            decisionContext(this.state, actor),
            setup.players[actor].difficulty,
          ),
        );
      } else advance(this.state, 0);
    }
    this.state.players.forEach((p, i) =>
      Object.assign(
        p,
        clone({
          hp: setup.players[i].hp,
          guard: setup.players[i].guard,
          control: setup.players[i].control,
          known: setup.players[i].known,
          statuses: setup.players[i].statuses,
          damageDealt: setup.players[i].damageDealt,
        }),
      ),
    );
    this.state.players.forEach((p, a) => {
      setup.players[a].heldFaces.forEach((face, slot) => {
        if (face !== null) {
          p.faces[slot] = face;
          p.dice[slot] = {
            state: "HELD",
            rolledTurn: Math.max(0, this.state.turn - 1),
            modified: false,
            originalFace: face,
          };
        }
      });
    });
    this.initial = clone(this.state);
    this.roundStart = clone(this.state);
    this.log("START", { setup: this.setup });
  }
  get resolving() {
    return this.pendingResolution !== null;
  }
  log(action: string, detail: unknown, error = false) {
    this.audit.push({
      round: this.state.round,
      phase: this.state.phase,
      action,
      detail,
      error,
    });
    if (this.audit.length > 4000) this.audit.shift();
  }
  private changed() {
    this.state.revision++;
    this.epoch++;
  }
  private editable() {
    if (this.resolving)
      throw new Error(
        "A priority batch is suspended. Finish resolution or return to the previous safe phase before editing state.",
      );
  }
  private planning(_actor: Seat) {
    this.editable();
    if (!planningPhases.includes(this.state.phase))
      throw new Error(
        "Edit Omens and assignments during MAIN_ACTION or REACTION_WINDOW.",
      );
  }
  fateForRound(round: number): number[] | undefined {
    if (this.nextFate) {
      const f = this.nextFate;
      this.nextFate = null;
      return f;
    }
    const f = this.setup.fate;
    if (f.mode === "random") return undefined;
    if (f.mode === "fixed") return clone(f.fixed);
    const index = round - this.setup.round;
    if (index < f.sequence.length) return clone(f.sequence[index]);
    if (f.end === "repeat") return clone(f.sequence[index % f.sequence.length]);
    if (f.end === "random") return undefined;
    this.stopped = true;
    this.options.auto = false;
    throw new Error(
      "Fate sequence exhausted. Match stopped at ROUND_END; choose random/repeat or supply Next Fate to continue.",
    );
  }
  view(mode: ViewMode = this.options.view): MatchView {
    const actor = mode === "B" ? 1 : 0;
    const v = projectMatch(this.state, mode === "Spectator" ? -1 : actor);
    if (mode === "Omniscient")
      v.players = this.state.players.map((p) =>
        clone(p),
      ) as MatchView["players"];
    if (mode === "B") {
      v.players.reverse();
      v.openingFullLife?.reverse();
      v.turnHistory = v.turnHistory.map((r) => ({
        ...r,
        actor: (1 - r.actor) as Seat,
        lifeAtStart: [...r.lifeAtStart].reverse(),
        damageAtStart: [...r.damageAtStart].reverse(),
        reactionsAtStart: [...r.reactionsAtStart].reverse(),
        damage: [...r.damage].reverse(),
        reactions: [...r.reactions].reverse(),
      }));
      v.activePlayer = v.activePlayer === 0 ? 1 : 0;
      v.initiative = v.initiative === 0 ? 1 : 0;
      if (v.pending) v.pending.actor = v.pending.actor === 0 ? 1 : 0;
      if (v.reaction) v.reaction.actor = v.reaction.actor === 0 ? 1 : 0;
      if (v.openingInitiative) {
        v.openingInitiative.rolls.reverse();
        v.openingInitiative.bonuses.reverse();
        v.openingInitiative.totals.reverse();
        v.openingInitiative.winner = v.openingInitiative.winner === 0 ? 1 : 0;
      }

      v.events = v.events.map((e) => ({
        ...e,
        actor: e.actor < 0 ? e.actor : 1 - e.actor,
        target: e.target === undefined ? undefined : 1 - e.target,
      }));
      v.stats = v.stats.map((r) => ({
        ...r,
        damage: [...r.damage].reverse(),
        guard: [...r.guard].reverse(),
        control: [...r.control].reverse(),
        cards: [...r.cards].reverse(),
        unused: [...r.unused].reverse(),
        faces: [...r.faces].reverse(),
        held: [...r.held].reverse(),
        expired: [...r.expired].reverse(),
        rolls: [...r.rolls].reverse(),
        reactions: [...r.reactions].reverse(),
        reactionWindows: [...r.reactionWindows].reverse(),
        reactionSuccess: [...r.reactionSuccess].reverse(),
        turns: [...r.turns].reverse(),
      }));
      if (typeof v.winner === "number") v.winner = v.winner === 0 ? 1 : 0;
    }
    v.deadline = Date.now() + this.remainingMs;
    return v;
  }
  get actor(): Seat {
    return this.options.view === "B" ? 1 : 0;
  }
  positions(actor: Seat) {
    const p = this.state.players[actor];
    return planningPhases.includes(this.state.phase)
      ? applyControls(
          p.loadout,
          p.faces,
          (p.plan ?? this.drafts[actor]).controls,
          p.control,
        )
      : { positions: p.faces, control: p.control };
  }
  setDraft(actor: Seat, plan: Plan) {
    this.planning(actor);
    this.drafts[actor] = clone(plan);
    this.log("SET_DRAFT", { actor, plan });
    this.changed();
  }
  assign(actor: Seat, slot: number, target: string) {
    this.planning(actor);
    int(slot, 0, 2, "Omen slot");
    if (
      target &&
      !["guard", "legend", ...this.state.players[actor].loadout.cards].includes(
        target,
      )
    )
      throw new Error("Assignment target does not exist in this loadout.");
    const plan = clone(this.drafts[actor]);
    plan.assignments = plan.assignments
      .map((a) => ({ ...a, dice: a.dice.filter((d) => d !== slot) }))
      .filter((a) => a.dice.length);
    if (target) {
      const existing =
        target === "guard"
          ? undefined
          : plan.assignments.find((a) => a.target === target);
      if (existing) existing.dice.push(slot);
      else plan.assignments.push({ target, dice: [slot] });
    }
    // Drafts may be incomplete (two-die cards); Lock always invokes the production validator.
    this.drafts[actor] = plan;
    this.log("ASSIGN", { actor, slot, target });
    this.changed();
  }
  control(actor: Seat, action: ControlAction) {
    this.planning(actor);
    const next = clone(this.drafts[actor]);
    next.controls.push(action);
    applyControls(
      this.state.players[actor].loadout,
      this.state.players[actor].faces,
      next.controls,
      this.state.players[actor].control,
    );
    if (next.controls.length > 2)
      throw new Error(
        "Production plans allow at most two Focus actions. Reset or remove a previous action.",
      );
    this.drafts[actor] = next;
    this.log("CONTROL", { actor, action });
    this.changed();
  }
  lock(actor: Seat, plan = this.drafts[actor]) {
    lockPlan(this.state, actor, plan);
    this.drafts[actor] = clone(EMPTY_PLAN);
    this.remainingMs = this.setup.timerMs;
    this.log("DECLARE", { actor, plan });
    this.changed();
  }
  unlock(actor: Seat) {
    this.planning(actor);
    this.drafts[actor] = clone(EMPTY_PLAN);
    this.changed();
  }
  timeout(actor: Seat) {
    if (!planningPhases.includes(this.state.phase))
      throw new Error("Timeout is only valid during planning / lock.");
    timeoutPlan(this.state, actor, this.drafts[actor]);
    this.log("TIMEOUT", { actor, plan: this.state.players[actor].plan });
    this.changed();
  }
  ai(actor: Seat) {
    return inspectAI(
      decisionContext(this.state, actor),
      this.setup.players[actor].difficulty,
      30,
    );
  }
  acceptAI(actor: Seat, plan?: Plan) {
    this.planning(actor);
    this.lock(
      actor,
      plan ??
        choosePlan(
          decisionContext(this.state, actor),
          this.setup.players[actor].difficulty,
        ),
    );
  }
  randomAction(actor: Seat) {
    this.planning(actor);
    const options = this.ai(actor).alternatives;
    const index =
      (this.state.seed + this.state.round + this.audit.length) % options.length;
    this.drafts[actor] = clone(options[index].plan);
    this.log("AI_ALTERNATIVE", { actor, index });
    this.changed();
  }
  next() {
    if (this.resolving) {
      this.nextEffect();
      return;
    }
    const phase = this.state.phase;
    if (phase === "MATCH_END")
      throw new Error("Match ended. Restart or restore a snapshot.");
    if (planningPhases.includes(phase)) {
      const actor = (
        phase !== "REACTION_WINDOW"
          ? this.state.activePlayer
          : 1 - this.state.activePlayer
      ) as Seat;
      this.lock(
        actor,
        this.setup.players[actor].ai
          ? choosePlan(
              decisionContext(this.state, actor),
              this.setup.players[actor].difficulty,
            )
          : this.drafts[actor],
      );
    } else if (phase === "RESOLUTION") {
      this.startResolution();
      if (!this.options.step) while (this.resolving) this.nextEffect();
    } else {
      if (phase === "ROUND_END") {
        const fate = this.fateForRound(this.state.round + 1);
        advance(this.state, 0);
        this.state.roundFate = fate ?? null;
      } else advance(this.state, 0);
      if (planningPhases.includes(this.state.phase)) {
        this.remainingMs =
          this.state.phase === "REACTION_WINDOW"
            ? this.setup.timerMs === 0
              ? 0
              : GAME.reactionMs
            : this.setup.timerMs;
        this.drafts = freshDrafts();
        if (
          this.state.phase === "MAIN_ACTION" &&
          this.state.players[this.state.activePlayer].actionsThisRound === 0
        )
          this.roundStart = clone(this.state);
      }
    }
    this.log("PHASE", { from: phase, to: this.state.phase });
    this.changed();
  }
  startResolution() {
    if (this.state.phase !== "RESOLUTION")
      throw new Error("Finish the reaction window before resolution.");
    const baseline = clone(this.state);
    this.state.phase = "RESOLUTION";
    this.pendingResolution = {
      baseline,
      steps: 0,
      iterator: resolutionSteps(this.state, true),
    };
    this.log("RESOLUTION_BEGIN", {});
    this.changed();
  }
  nextEffect() {
    if (!this.resolving) {
      if (this.state.phase === "RESOLUTION") this.startResolution();
      else
        throw new Error("Finish the reaction window before stepping effects.");
    }
    const p = this.pendingResolution!;
    const next = p.iterator.next();
    if (next.done) {
      recordResolution(this.state, next.value);
      this.pendingResolution = null;
      this.log("RESOLUTION_COMPLETE", next.value);
    } else {
      p.steps++;
      this.frames.push({ ...next.value, round: this.state.round });
      this.log("EFFECT", {
        effect: next.value.effect,
        source: next.value.source,
        priority: next.value.priority,
        result: next.value.result,
      });
    }
    this.changed();
  }
  resolveCurrent() {
    if (this.state.phase === "RESOLUTION") this.startResolution();
    if (this.resolving) {
      while (this.resolving) this.nextEffect();
    } else this.next();
  }
  resetRound() {
    this.state = clone(this.roundStart);
    this.state.phase = "MAIN_ACTION";
    this.pendingResolution = null;
    this.drafts = freshDrafts();
    this.remainingMs = this.setup.timerMs;
    this.options.auto = false;
    this.log("RESET_ROUND", {});
    this.changed();
  }
  rewind() {
    if (this.pendingResolution) {
      this.state = clone(this.pendingResolution.baseline);
      this.pendingResolution = null;
      this.frames = [];
      this.log("REWIND_TO_REVEAL", {});
    } else this.resetRound();
    this.changed();
  }
  restart(seed = this.setup.seed) {
    this.editable();
    int(seed, 0, 0xffffffff, "Seed");
    const fresh = new LabController({ ...clone(this.setup), seed });
    const options = this.options;
    Object.assign(this, fresh);
    this.options = { ...options, auto: false };
    this.changed();
  }
  setFate(tokens: number[], next = false) {
    validateFate(tokens);
    if (next) {
      this.nextFate = clone(tokens);
      this.stopped = false;
      this.log("NEXT_FATE", tokens);
      this.changed();
      return;
    }
    this.editable();
    if (!planningPhases.includes(this.state.phase))
      throw new Error("Rewind to a decision window before changing Fate.");
    this.state.fate = clone(tokens);
    this.state.roundFate = clone(tokens);
    this.state.players.forEach((p) => {
      p.faces = p.loadout.dice.map((id, i) =>
        facePosition(tokens[i], omenById[id].size),
      );
      p.plan = null;
      p.locked = false;
    });
    this.drafts = freshDrafts();

    this.log("FORCE_FATE", tokens);
    this.changed();
  }
  rerunFate() {
    this.setFate(this.state.fate);
  }
  setFace(actor: Seat, slot: number, face: number) {
    this.planning(actor);
    int(slot, 0, 2, "Slot");
    const p = this.state.players[actor];
    int(face, 0, omenById[p.loadout.dice[slot]].size - 1, "Face index");
    p.faces[slot] = face;
    this.drafts[actor].controls = [];
    this.log("FORCE_FACE", {
      actor,
      slot,
      face,
      warning: "Forced face may break Shared Fate; pending Focus cleared.",
    });
    this.changed();
  }
  resetFace(actor: Seat, slot: number) {
    const p = this.state.players[actor];
    this.setFace(actor, slot, p.dice[slot].originalFace);
  }
  forceSymbol(actor: Seat, slot: number, symbol: string) {
    const p = this.state.players[actor],
      d = omenById[p.loadout.dice[slot]];
    const face = d.faces.findIndex((f) => f.effectId === symbol);
    if (face < 0)
      throw new Error(
        `OMEN INVALID: ${d.name} has no ${SIGILS[symbol as keyof typeof SIGILS]?.name ?? symbol} face.`,
      );
    this.setFace(actor, slot, face);
  }
  setOmenValue(actor: Seat, slot: number, value: number) {
    const d = omenById[this.state.players[actor].loadout.dice[slot]];
    const index = d.faces.findIndex(
      (f) => f.type === "number" && f.value === value,
    );
    if (index < 0)
      throw new Error(
        `OMEN INVALID: ${d.name} has no Value ${value}. Fixed faces cannot be edited.`,
      );
    this.setFace(actor, slot, index);
  }
  setOmenVoid(actor: Seat, slot: number) {
    const d = omenById[this.state.players[actor].loadout.dice[slot]];
    const index = d.faces.findIndex((f) => f.type === "blank");
    if (index < 0) throw new Error(`OMEN INVALID: ${d.name} has no Void face.`);
    this.setFace(actor, slot, index);
  }
  setFocus(actor: Seat, focus: number) {
    this.editPlayer(actor, { control: focus });
  }
  setWard(actor: Seat, ward: number) {
    this.editPlayer(actor, { guard: ward });
  }
  setHeldOmen(actor: Seat, slot: number) {
    this.setResource(actor, slot, "HELD");
  }
  editPlayer(
    actor: Seat,
    patch: Partial<
      Pick<PlayerState, "hp" | "guard" | "control" | "statuses" | "damageDealt">
    >,
  ) {
    this.editable();
    const p = this.state.players[actor],
      next = { ...p, ...clone(patch) };
    int(next.hp, 0, 1000, "Life");
    int(next.guard, 0, 1000, "Ward");
    int(next.control, 0, 6, "Focus");
    int(next.damageDealt, 0, 100000, "Damage dealt");
    validateStatuses(next.statuses, p.loadout);
    if (
      patch.control !== undefined &&
      planningPhases.includes(this.state.phase)
    )
      applyControls(
        p.loadout,
        p.faces,
        (p.plan ?? this.drafts[actor]).controls,
        next.control,
      );
    Object.assign(p, next);
    this.log("EDIT_PLAYER", { actor, patch });
    this.changed();
  }
  hp(actor: Seat, value: number) {
    this.editPlayer(actor, {
      hp: Math.max(
        0,
        Math.min(
          legendById[this.state.players[actor].loadout.legend].hp,
          value,
        ),
      ),
    });
  }
  addStatus(actor: Seat, status: Status) {
    this.editPlayer(actor, {
      statuses: [...this.state.players[actor].statuses, status],
    });
  }
  memory(actor: Seat, card: string, state: string) {
    this.editable();
    const p = this.state.players[actor];
    if (!p.loadout.cards.includes(card))
      throw new Error("Card is not equipped.");
    p.known = p.known.filter((c) => c !== card);
    if (state !== "NEVER REVEALED") p.known.push(card);
    this.memories[`${actor}:${card}`] = state;
    this.log("MEMORY", { actor, card, state });
    this.changed();
  }
  stun(actor: Seat, card: string, disable = false) {
    this.addStatus(actor, {
      id: "stun",
      amount: disable ? 1000 : 1,
      expiresRound: disable ? Number.MAX_SAFE_INTEGER : this.state.round,
      cardId: card,
    });
  }
  clearCardStatus(actor: Seat, card: string) {
    this.editPlayer(actor, {
      statuses: this.state.players[actor].statuses.filter(
        (s) => s.cardId !== card,
      ),
    });
  }
  end(winner: Seat) {
    this.editable();
    this.state.players[1 - winner].hp = 0;
    this.state.players[winner].hp = Math.max(1, this.state.players[winner].hp);
    decideWinner(this.state);
    this.state.phase = "MATCH_END";
    this.options.auto = false;
    this.log("FORCE_END", { winner });
    this.changed();
  }
  setResource(
    actor: Seat,
    slot: number,
    state: "AVAILABLE" | "HELD" | "SPENT" | "UNROLLED" | "EXPIRED",
  ) {
    this.editable();
    int(slot, 0, 2, "Omen slot");
    this.state.players[actor].dice[slot].state = state;
    this.log("FORCE_RESOURCE", { actor, slot, state });
    this.changed();
  }
  tick(now: number) {
    const delta = this.lastTick
      ? Math.max(0, Math.min(2000, now - this.lastTick))
      : 0;
    this.lastTick = now;
    if (this.paused || this.stopped || this.state.phase === "MATCH_END") return;
    const phase = this.state.phase;
    if (planningPhases.includes(phase)) {
      const actor = (
        phase !== "REACTION_WINDOW"
          ? this.state.activePlayer
          : 1 - this.state.activePlayer
      ) as Seat;
      if (this.setup.timerMs > 0 && !this.options.pauseTimer) {
        this.remainingMs = Math.max(0, this.remainingMs - delta);
        if (!this.remainingMs) {
          this.timeout(actor);
          return;
        }
      }
      if (
        this.options.auto &&
        !this.options.pauseBeforeAI &&
        this.setup.players[actor].ai
      )
        this.acceptAI(actor);
      return;
    }
    const delay =
      this.options.animation === "instant"
        ? 0
        : this.options.animation === "4x"
          ? 150
          : this.options.animation === "2x"
            ? 300
            : 650;
    if (
      this.options.auto &&
      this.options.animation !== "step" &&
      now - this.lastAdvance >= delay
    ) {
      if (this.resolving && this.options.step) return;
      this.lastAdvance = now;
      try {
        this.next();
      } catch (e) {
        this.options.auto = false;
        this.log("ERROR", (e as Error).message, true);
      }
    }
  }
  adapter() {
    const owner = this;
    return {
      isMock: true,
      mode: "Training" as const,
      difficulty: this.setup.players[1 - this.actor].difficulty,
      practice: this.setup.timerMs === 0,
      view: () => owner.view(),
      tick: (_now: number, draft?: Plan) => {
        if (
          draft &&
          !owner.state.players[owner.actor].locked &&
          planningPhases.includes(owner.state.phase)
        )
          owner.drafts[owner.actor] = clone(draft);
        return owner.view();
      },
      advance: () => {
        owner.next();
        return owner.view();
      },
      nextSequence: () => ++owner.sequence,
      submit: (c: { matchId: string; round: number; plan: Plan }) => {
        if (c.matchId !== owner.state.id || c.round !== owner.state.round)
          throw new Error("Stale lab command.");
        owner.lock(owner.actor, c.plan);
        return owner.view();
      },
    };
  }
  snapshot(): LabSnapshot {
    return clone({
      format: "fatebound-dev-snapshot",
      schema: 1,
      mechanicalVersion: GAME.version,
      setup: this.setup,
      state: this.state,
      initial: this.initial,
      roundStart: this.roundStart,
      drafts: this.drafts,
      options: this.options,
      nextFate: this.nextFate,
      remainingMs: this.remainingMs,
      resolution: this.pendingResolution
        ? {
            baseline: this.pendingResolution.baseline,
            steps: this.pendingResolution.steps,
          }
        : null,
      audit: this.audit,
      memories: this.memories,
      completedFrames: this.frames,
    });
  }
  static restore(snapshot: LabSnapshot) {
    const s = validateSnapshot(snapshot);
    const lab = new LabController(s.setup);
    lab.state = clone(s.state);
    lab.initial = clone(s.initial);
    lab.roundStart = clone(s.roundStart);
    lab.drafts = clone(s.drafts);
    lab.options = { ...clone(s.options), auto: false };
    lab.nextFate = clone(s.nextFate);
    lab.remainingMs = s.remainingMs;
    lab.audit = clone(s.audit);
    lab.memories = clone(s.memories);
    lab.frames = clone(s.completedFrames);
    if (s.resolution) {
      const expected = clone(lab.state);
      lab.state = clone(s.resolution.baseline);
      lab.state.phase = "RESOLUTION";
      const iterator = resolutionSteps(lab.state, true);
      for (let i = 0; i < s.resolution.steps; i++) {
        if (iterator.next().done)
          throw new Error(
            "Snapshot resolution cursor exceeds the effect queue.",
          );
      }
      const normalize = (v: MatchState) => {
        const copy = clone(v);
        copy.revision = 0;
        return JSON.stringify(copy);
      };
      if (normalize(lab.state) !== normalize(expected))
        throw new Error(
          "Snapshot state disagrees with its suspended production resolver.",
        );
      lab.state.revision = expected.revision;
      lab.pendingResolution = { ...clone(s.resolution), iterator };
    }
    lab.log("RESTORE", {});
    lab.changed();
    return lab;
  }
  report() {
    return {
      format: "fatebound-dev-report",
      build: "0.1.0-devlab",
      timestamp: new Date().toISOString(),
      mechanicalVersion: GAME.version,
      note: "Internal state overrides are explicit; this is not a signed competitive replay.",
      seed: this.state.seed,
      loadouts: this.state.players.map((p) => p.loadout),
      startingState: this.initial,
      fatePolicy: this.setup.fate,
      actions: this.audit,
      effectResolution: this.frames,
      statistics: this.state.stats,
      finalState: this.state,
      warnings: this.audit.filter(
        (a) => a.error || a.action.startsWith("FORCE"),
      ),
      snapshot: this.snapshot(),
    };
  }
  safe(actor: Seat) {
    this.planning(actor);
    this.drafts[actor] = safePlan(
      decisionContext(this.state, actor),
      this.drafts[actor],
    );
    this.changed();
  }
}
function validateState(state: MatchState, setup: LabSetup) {
  validateSavedState(state, setup.ignoreRestrictions);
  if (
    !state ||
    state.version !== GAME.version ||
    !Array.isArray(state.players) ||
    state.players.length !== 2
  )
    throw new Error("Unsupported match state.");
  int(state.seed, 0, 0xffffffff, "Seed");
  int(state.round, 0, Number.MAX_SAFE_INTEGER, "Round");
  int(state.revision, 0, 1e9, "Revision");
  if (
    ![
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
    ].includes(state.phase)
  )
    throw new Error("Invalid phase.");
  validateFate(state.fate);
  const candidate = clone(setup);
  candidate.players = state.players.map((p, i) => ({
    ...candidate.players[i],
    ...p,
  })) as unknown as LabSetup["players"];
  validateSetup(candidate);
  state.players.forEach((p) => {
    if (p.faces.length !== 3) throw new Error("Three face indices required.");
    p.faces.forEach((f, i) =>
      int(f, 0, omenById[p.loadout.dice[i]].size - 1, "Face index"),
    );
    if (typeof p.locked !== "boolean") throw new Error("Invalid lock state.");
  });
  if (
    !Array.isArray(state.events) ||
    state.events.length > 200000 ||
    !Array.isArray(state.stats) ||
    state.stats.length > 10000 ||
    !Array.isArray(state.replay) ||
    state.replay.length > 100000
  )
    throw new Error("Invalid or excessive match history.");
  if (![0, 1, "draw", null].includes(state.winner))
    throw new Error("Invalid winner.");
}
function validateDraft(plan: Plan, p: PlayerState) {
  if (
    !plan ||
    !Array.isArray(plan.controls) ||
    plan.controls.length > 2 ||
    !Array.isArray(plan.assignments) ||
    plan.assignments.length > 3
  )
    throw new Error("Malformed plan.");
  for (const c of plan.controls) {
    int(c.slot, 0, 2, "Focus slot");
    if (
      !["flip", "shift"].includes(c.kind) ||
      (c.kind === "shift" && c.direction !== 1 && c.direction !== -1)
    )
      throw new Error("Invalid Focus action.");
  }
  if (
    plan.omenSlots &&
    (!Array.isArray(plan.omenSlots) ||
      plan.omenSlots.length > 3 ||
      new Set(plan.omenSlots).size !== plan.omenSlots.length ||
      plan.omenSlots.some((i) => !Number.isInteger(i) || i < 0 || i > 2))
  )
    throw new Error("Invalid opening Omen selection.");
  for (const a of plan.assignments) {
    if (
      !["guard", "legend", ...p.loadout.cards].includes(a.target) ||
      !Array.isArray(a.dice) ||
      a.dice.length > 3
    )
      throw new Error("Invalid assignment target.");
    a.dice.forEach((d) => int(d, 0, 2, "Assignment slot"));
  }
}
export function validateSnapshot(raw: LabSnapshot) {
  if (
    !raw ||
    raw.format !== "fatebound-dev-snapshot" ||
    raw.schema !== 1 ||
    raw.mechanicalVersion !== GAME.version
  )
    throw new Error("Unsupported snapshot format or mechanical version.");
  validateSetup(raw.setup);
  validateState(raw.state, raw.setup);
  validateState(raw.initial, raw.setup);
  validateState(raw.roundStart, raw.setup);
  if (!Array.isArray(raw.drafts) || raw.drafts.length !== 2)
    throw new Error("Two draft plans required.");
  raw.drafts.forEach((p, i) => validateDraft(p, raw.state.players[i]));
  raw.state.players.forEach((p, actor) => {
    if (p.plan) validateDraft(p.plan, p);
    if (p.locked && !p.plan)
      throw new Error("A locked player must have a plan.");
    if (planningPhases.includes(raw.state.phase))
      applyControls(
        p.loadout,
        p.faces,
        (p.plan ?? raw.drafts[actor]).controls,
        p.control,
      );
  });
  if (
    !raw.options ||
    !["A", "B", "Spectator", "Omniscient"].includes(raw.options.view) ||
    !["normal", "2x", "4x", "instant", "step"].includes(raw.options.animation)
  )
    throw new Error("Invalid view/animation option.");
  if (raw.nextFate) validateFate(raw.nextFate);
  int(raw.remainingMs, 0, 300000, "Remaining timer");
  if (raw.resolution) {
    validateState(raw.resolution.baseline, raw.setup);
    int(raw.resolution.steps, 0, 1000, "Resolution cursor");
    if (raw.resolution.baseline.phase !== "RESOLUTION")
      throw new Error("Invalid resolution baseline.");
  }
  if (
    !Array.isArray(raw.audit) ||
    raw.audit.length > 4000 ||
    !Array.isArray(raw.completedFrames) ||
    raw.completedFrames.length > 5000 ||
    !raw.memories ||
    typeof raw.memories !== "object"
  )
    throw new Error("Invalid debug history.");
  if (
    raw.audit.some(
      (a) => !a || typeof a.action !== "string" || typeof a.phase !== "string",
    )
  )
    throw new Error("Malformed audit row.");
  if (
    raw.completedFrames.some(
      (f) =>
        !f ||
        ![f.source, f.target, f.effect, f.conditions, f.result].every(
          (v) => typeof v === "string",
        ) ||
        !["effect", "canceled", "commit"].includes(f.kind) ||
        ![f.actor, f.priority].every(Number.isFinite) ||
        [f.before, f.after].some(
          (v) =>
            v !== undefined &&
            (!Array.isArray(v) ||
              v.length !== 2 ||
              v.some(
                (p) => !p || ![p.hp, p.guard, p.control].every(Number.isFinite),
              )),
        ),
    )
  )
    throw new Error("Malformed effect frame.");
  return clone(raw);
}
export function importSnapshot(text: string) {
  if (text.length > 8_000_000) throw new Error("Debug import exceeds 8 MB.");
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      "Invalid JSON. Paste an exported Dev Lab snapshot or report.",
    );
  }
  return LabController.restore(
    parsed?.format === "fatebound-dev-report" ? parsed.snapshot : parsed,
  );
}
