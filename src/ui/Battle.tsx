import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { Assignment, MatchView, Plan, PlayerState } from "../engine/types";
import type { LocalMatchService } from "../services/match-service";
import { GAME, EMOTES } from "../content/config";
import { cardById } from "../content/cards";
import { dieById } from "../content/dice";
import { legendById } from "../content/legends";
import {
  applyControls,
  EMPTY_PLAN,
  requirementFor,
  validatePlan,
} from "../engine/rules";
import { useGame } from "./context";
import {
  CardBack,
  ControlCounter,
  Die,
  GameplayCard,
  HealthBar,
  Icon,
  IconButton,
  LegendArt,
  PrimaryButton,
  RankBadge,
  Sigil,
} from "./components";
import { audioCue } from "../services/audio";
import { track } from "../services/analytics";
const phaseCopy: Record<string, string> = {
  INTRO: "A meeting of Legends",
  ROUND_START: "A new possibility",
  FATE: "Fate is shared",
  ROLLING: "The dice settle",
  CONTROL: "Shape your Fate",
  ASSIGNMENT: "Make your move",
  LOCKED: "Your choices are sealed",
  REVEAL: "Stories unfold",
  RESOLUTION: "The consequence",
  CLEANUP: "A moment of stillness",
  ROUND_END: "The next chapter",
  MATCH_END: "The story is written",
};
export type BattleDriver = Pick<
  LocalMatchService,
  | "view"
  | "submit"
  | "tick"
  | "advance"
  | "nextSequence"
  | "difficulty"
  | "mode"
  | "practice"
>;
export type BattlePresentation = {
  manualAdvance?: boolean;
  viewOnly?: boolean;
  syncKey?: number;
  draft?: Plan;
  onDraft?: (plan: Plan) => void;
  maxRounds?: number;
  names?: [string, string];
  ranks?: [string, string];
  inspectDie?: (side: 0 | 1, slot: number) => void;
  inspectCard?: (side: 0 | 1, slot: number) => void;
  inspectLegend?: (side: 0 | 1) => void;
};
export default function Battle({
  service,
  onEnd,
  onExit,
  presentation,
}: {
  service: BattleDriver;
  presentation?: BattlePresentation;
  onEnd: (v: MatchView) => void;
  onExit: () => void;
}) {
  const { profile, inspect, toast, update } = useGame();
  const [view, setView] = useState(() => service.view());
  const [plan, setPlan] = useState<Plan>(
    structuredClone(presentation?.draft ?? EMPTY_PLAN),
  );
  const [selection, setSelection] = useState<number[]>([]);
  const [seconds, setSeconds] = useState(12);
  const [emotes, setEmotes] = useState(false);
  const [sentEmote, setSentEmote] = useState("");
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dragging, setDragging] = useState<{
    x: number;
    y: number;
    slot: number;
  } | null>(null);
  const planRef = useRef(plan);
  planRef.current = plan;
  const viewRef = useRef(view);
  viewRef.current = view;
  const pointerStart = useRef<{ x: number; y: number; slot: number } | null>(
    null,
  );
  const skipClick = useRef(false);
  const ended = useRef(false);
  const me = view.players[0],
    opponent = view.players[1],
    legend = legendById[me.loadout.legend],
    enemy = legendById[opponent.loadout.legend];
  const planning =
    !presentation?.viewOnly &&
    ["CONTROL", "ASSIGNMENT"].includes(view.phase) &&
    !me.locked;
  const positioned =
    planning || view.phase === "LOCKED"
      ? applyControls(
          me.loadout as PlayerState["loadout"],
          me.faces,
          plan.controls,
          me.control,
        )
      : { positions: me.faces, control: me.control };
  const used = plan.assignments.flatMap((a) => a.dice);
  const maxRounds = presentation?.maxRounds ?? GAME.maxRounds;
  useEffect(() => {
    if (presentation) {
      setView(service.view());
      setPlan(structuredClone(presentation.draft ?? EMPTY_PLAN));
      setSelection([]);
    }
  }, [presentation?.syncKey, service]);
  useEffect(() => {
    presentation?.onDraft?.(plan);
  }, [plan]);
  useEffect(() => {
    const interval = setInterval(() => {
      const next = service.tick(Date.now(), planRef.current);
      if (next.revision !== viewRef.current.revision) setView(next);
      setSeconds(Math.max(0, Math.ceil((next.deadline - Date.now()) / 1000)));
    }, 200);
    return () => clearInterval(interval);
  }, [service]);
  useEffect(() => {
    setPlan(structuredClone(presentation?.draft ?? EMPTY_PLAN));
    setSelection([]);
  }, [view.round]);
  useEffect(() => {
    if (view.phase === "MATCH_END") {
      if (!ended.current) {
        ended.current = true;
        onEnd(view);
      }
      return;
    }
    const cue = (
      {
        FATE: "roll",
        ROLLING: "settle",
        REVEAL: "reveal",
        RESOLUTION: "attack",
      } as Record<string, string>
    )[view.phase] as "roll" | "settle" | "reveal" | "attack" | undefined;
    if (cue) audioCue(cue, profile.settings);
    if (presentation?.manualAdvance) return;
    if (view.phase === "CONTROL") {
      const t = setTimeout(() => setView(service.advance(Date.now())), 250);
      return () => clearTimeout(t);
    }
    const delay =
      view.phase === "INTRO"
        ? GAME.introMs
        : (GAME.phaseMs as Record<string, number>)[view.phase];
    if (delay !== undefined) {
      const t = setTimeout(
        () => setView(service.advance(Date.now())),
        profile.settings.reducedMotion ? Math.min(delay, 200) : delay,
      );
      return () => clearTimeout(t);
    }
  }, [view.phase, view.round, service]);
  const validate = (next: Plan) =>
    validatePlan(
      {
        round: view.round,
        fate: view.fate,
        self: me as PlayerState,
        enemy: opponent,
      },
      next,
    );
  const assign = (target: string, slots = selection) => {
    if (!planning || slots.length === 0) {
      toast("Tap a die first, then choose an action.");
      return;
    }
    const a: Assignment = { target, dice: slots };
    try {
      const req = requirementFor(me.loadout as PlayerState["loadout"], target);
      if (slots.length !== req.count) {
        toast(
          `Select ${req.count} ${req.count === 1 ? "die" : "dice"} for this action.`,
        );
        return;
      }
      const assignments = plan.assignments.filter(
        (a) =>
          !a.dice.some((i) => slots.includes(i)) &&
          (target === "guard" || a.target !== target),
      );
      const next = { ...plan, assignments: [...assignments, a] };
      validate(next);
      setPlan(next);
      setSelection([]);
      audioCue("menu", profile.settings);
      if (tutorialStep === 0) setTutorialStep(1);
    } catch (e) {
      toast((e as Error).message);
    }
  };
  const selectDie = (slot: number) => {
    if (skipClick.current) {
      skipClick.current = false;
      return;
    }
    if (!planning) return;
    if (used.includes(slot)) {
      setPlan({
        ...plan,
        assignments: plan.assignments.filter((a) => !a.dice.includes(slot)),
      });
      setSelection([slot]);
    } else
      setSelection(
        selection.includes(slot)
          ? selection.filter((i) => i !== slot)
          : [...selection, slot].slice(-2),
      );
  };
  const control = (kind: "shift" | "flip", direction?: -1 | 1) => {
    if (!planning || selection.length !== 1) {
      toast("Select one die to use Control.");
      return;
    }
    const next = {
      ...plan,
      controls: [...plan.controls, { slot: selection[0], kind, direction }],
    };
    try {
      validate(next);
      setPlan(next);
      audioCue(kind, profile.settings);
      if (!presentation) track("control_used", { kind });
    } catch (e) {
      toast((e as Error).message);
    }
  };
  const lock = () => {
    try {
      const next = service.submit({
        matchId: view.id,
        sequence: service.nextSequence(),
        round: view.round,
        plan,
      });
      setView(next);
      setSelection([]);
      audioCue("reveal", profile.settings);
      plan.assignments.forEach((a) => {
        if (!presentation && cardById[a.target])
          track("card_used", { card: a.target });
      });
    } catch (e) {
      toast((e as Error).message);
    }
  };
  const dragStart = (e: PointerEvent, slot: number) => {
    if (!planning) return;
    pointerStart.current = { x: e.clientX, y: e.clientY, slot };
  };
  const dragMove = (e: PointerEvent) => {
    const start = pointerStart.current;
    if (!start) return;
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging({ x: e.clientX, y: e.clientY, slot: start.slot });
    }
  };
  const dragEnd = (e: PointerEvent) => {
    if (dragging) {
      skipClick.current = true;
      setTimeout(() => {
        skipClick.current = false;
      }, 0);
      const target = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest("[data-card-target]")
        ?.getAttribute("data-card-target");
      if (target) assign(target, [dragging.slot]);
      else toast("Drop on a card, Guard, or your Legend ability.");
    }
    setDragging(null);
    pointerStart.current = null;
  };
  const roundEvents = view.events
    .filter((e) => e.round === view.round)
    .slice(-5);
  const revealed = ["REVEAL", "RESOLUTION", "CLEANUP", "ROUND_END"].includes(
    view.phase,
  );
  if (view.phase === "INTRO")
    return (
      <div
        className="match-intro"
        role="button"
        tabIndex={0}
        aria-label={`Begin match: ${legend.name} versus ${enemy.name}`}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setView(service.advance(Date.now()));
          }
        }}
        onClick={() => setView(service.advance(Date.now()))}
      >
        <div className="intro-art">
          <LegendArt id={enemy.id} />
          <div>
            <span className="eyebrow">
              {service.difficulty.toUpperCase()} AI
            </span>
            <h2>{enemy.name}</h2>
            <RankBadge label={presentation?.ranks?.[1] ?? "Training partner"} />
          </div>
        </div>
        <div className="versus">
          <span />
          <Sigil size={35} />
          <strong>VS</strong>
          <span />
        </div>
        <div className="intro-art player">
          <LegendArt id={legend.id} />
          <div>
            <span className="eyebrow">{profile.name}</span>
            <h2>{legend.name}</h2>
            <RankBadge />
          </div>
        </div>
        <p>
          Tap to begin ·{" "}
          {service.mode === "Training"
            ? "Training"
            : `${service.mode} simulation`}
        </p>
      </div>
    );
  return (
    <div className={`battle-screen phase-${view.phase.toLowerCase()}`}>
      <div className="battle-board">
        <header className="battle-header">
          <IconButton icon="exit" label="Leave match" onClick={onExit} />
          <span>
            {service.mode === "Training"
              ? "TRAINING"
              : `${service.mode.toUpperCase()} · AI SIMULATION`}
          </span>
          <IconButton
            icon={profile.settings.muted ? "mute" : "volume"}
            label="Mute opponent emotes"
            onClick={() =>
              update({
                ...profile,
                settings: {
                  ...profile.settings,
                  muted: !profile.settings.muted,
                },
              })
            }
          />
        </header>
        <section
          className="opponent-panel"
          onClick={
            presentation?.inspectLegend
              ? () => presentation.inspectLegend!(1)
              : undefined
          }
        >
          <LegendArt id={enemy.id} />
          <div className="opponent-copy">
            <div>
              <span>
                {presentation?.names?.[1] ?? `${service.difficulty} AI`}
              </span>
              <RankBadge
                small
                label={presentation?.ranks?.[1] ?? "Stone III"}
              />
            </div>
            <h2>{enemy.name}</h2>
            <HealthBar hp={opponent.hp} max={enemy.hp} guard={opponent.guard} />
          </div>
        </section>
        <div className="known-hand-label">
          <span>
            <Icon name="eye" size={11} />
            OPPONENT’S KNOWN CARDS
          </span>
          <span>{opponent.known.length} / 4</span>
        </div>
        <div className="known-hand">
          {opponent.loadout.cards.map((id, i) => (
            <CardBack
              key={i}
              index={i}
              known={id ? cardById[id] : undefined}
              onClick={() =>
                presentation?.inspectCard
                  ? presentation.inspectCard(1, i)
                  : id
                    ? inspect({ type: "card", item: cardById[id] })
                    : toast(
                        "Unrevealed. This card becomes known when first played.",
                      )
              }
            />
          ))}
        </div>
        <div className="opponent-dice">
          {opponent.loadout.dice.map((id, i) => (
            <Die
              key={i}
              definition={dieById[id]}
              face={dieById[id].faces[opponent.faces[i]]}
              small
              rolling={view.phase === "ROLLING"}
              onClick={
                presentation?.inspectDie
                  ? () => presentation.inspectDie!(1, i)
                  : undefined
              }
            />
          ))}
        </div>
        <section className="fate-arena">
          <div className="round-dots">
            {Array.from({ length: maxRounds }, (_, i) => (
              <i key={i} className={i < view.round ? "active" : ""} />
            ))}
          </div>
          <div className="round-phase">
            <span className="round-count">
              ROUND <b>{view.round}</b>
              <small>/ {maxRounds}</small>
            </span>
            <div>
              <span className="eyebrow">
                {view.phase === "ASSIGNMENT" ? "SECRET ASSIGNMENT" : view.phase}
              </span>
              <h3>{phaseCopy[view.phase]}</h3>
            </div>
            <span
              className={`decision-timer ${seconds <= 4 && !service.practice ? "urgent" : ""}`}
            >
              <Icon name="timer" size={14} />
              {planning ? (service.practice ? "∞" : seconds) : "—"}
            </span>
          </div>
          <div className="fate-tokens">
            <span>SHARED FATE</span>
            {view.fate.map((n, i) => (
              <b key={i}>{String(n + 1).padStart(3, "0")}</b>
            ))}
            <button
              aria-label="Explain Shared Fate"
              onClick={() =>
                toast(
                  "Both players use these same 1–120 positions. Each die maps them to its ordered faces.",
                )
              }
            >
              <Icon name="help" size={14} />
            </button>
          </div>
          {revealed && (
            <div className="resolution-overlay" aria-live="polite">
              {view.phase === "REVEAL" ? (
                <>
                  <Icon name="eye" size={22} />
                  <strong>
                    {opponent.plan?.assignments
                      .map(
                        (a) =>
                          cardById[a.target]?.name ??
                          (a.target === "guard" ? "Guard" : enemy.active.name),
                      )
                      .join(" · ") || "Opponent holds"}
                  </strong>
                </>
              ) : (
                <>
                  {roundEvents
                    .filter(
                      (e) =>
                        e.type === "damage" ||
                        e.type === "guard" ||
                        e.type === "fizzle",
                    )
                    .slice(-3)
                    .map((e, i) => (
                      <p key={i} className={e.actor === 0 ? "own-event" : ""}>
                        <Icon
                          name={
                            e.type === "guard"
                              ? "guard"
                              : e.type === "damage"
                                ? "attack"
                                : "swap"
                          }
                          size={14}
                        />
                        {e.actor === 0 ? "You" : "Rival"} · {e.text}
                      </p>
                    ))}
                </>
              )}
            </div>
          )}
        </section>
        <section
          className="player-panel"
          onClick={
            presentation?.inspectLegend
              ? () => presentation.inspectLegend!(0)
              : undefined
          }
        >
          <LegendArt id={legend.id} />
          <div>
            <div>
              <h3>{legend.name}</h3>
              <span>{presentation?.names?.[0] ?? profile.name}</span>
            </div>
            <HealthBar hp={me.hp} max={legend.hp} guard={me.guard} />
          </div>
          {me.statuses.length > 0 && (
            <span className="status-label">
              <Icon name="flame" size={13} />
              {me.statuses.map((s) => `${s.id} ${s.amount}`).join(" · ")}
            </span>
          )}
        </section>
        {service.practice && planning ? (
          <div className="tutorial-tip">
            <Icon name="book" size={15} />
            <span>
              {view.round === 1
                ? tutorialStep === 0
                  ? "Tap a die, then a card. Select two dice for a two-die card."
                  : "Your cards return every round. Assign more dice, or lock your choices."
                : view.round === 2
                  ? "Select a die. Shift costs 1 Control; Flip costs 2. No rerolls."
                  : view.round === 3
                    ? "Played enemy cards stay known. Read their options before committing."
                    : "Guard expires each round. Reduce your opponent to 0 HP, or lead after round 7."}
            </span>
          </div>
        ) : (
          <div className="hand-label">
            <span>YOUR REUSABLE HAND</span>
            <span>
              {planning
                ? selection.length
                  ? `${selection.length} selected · choose an action`
                  : "Tap a die → tap a card"
                : "Choices sealed"}
            </span>
          </div>
        )}
        <div className="battle-hand">
          {me.loadout.cards.map((id, i) => {
            if (!id)
              return (
                <CardBack
                  key={i}
                  index={i}
                  onClick={() =>
                    toast(
                      "Unrevealed card. Spectator visibility follows the production projection.",
                    )
                  }
                />
              );
            const c = cardById[id!];
            const a = plan.assignments.find((a) => a.target === id);
            return (
              <GameplayCard
                key={i}
                card={c}
                compact
                selected={!!a}
                assigned={
                  a
                    ? a.dice.map(
                        (slot) =>
                          dieById[me.loadout.dice[slot]].faces[
                            positioned.positions[slot]
                          ].displayIcon,
                      )
                    : []
                }
                onClick={() =>
                  presentation?.inspectCard
                    ? presentation.inspectCard(0, i)
                    : planning
                      ? selection.length
                        ? assign(id!)
                        : inspect({ type: "card", item: c })
                      : inspect({ type: "card", item: c })
                }
                onInspect={() =>
                  presentation?.inspectCard
                    ? presentation.inspectCard(0, i)
                    : inspect({ type: "card", item: c })
                }
              />
            );
          })}
        </div>
        <div className="universal-actions">
          <button data-card-target="guard" onClick={() => assign("guard")}>
            <Icon name="guard" size={17} />
            <span>
              Guard<small>Any nonblank face</small>
            </span>
            {plan.assignments.filter((a) => a.target === "guard").length >
              0 && (
              <b>
                {plan.assignments.filter((a) => a.target === "guard").length}
              </b>
            )}
          </button>
          <button data-card-target="legend" onClick={() => assign("legend")}>
            <Icon name="leaf" size={17} />
            <span>
              {legend.active.name}
              <small>{legend.active.requirement.min}+ · Legend ability</small>
            </span>
            {plan.assignments.some((a) => a.target === "legend") && (
              <Icon name="check" size={14} />
            )}
          </button>
          <IconButton
            icon="help"
            label="Legend ability rules"
            onClick={() =>
              toast(`${legend.active.text} Passive: ${legend.passive}`)
            }
          />
        </div>
      </div>
      <footer className="battle-controls">
        <div className="control-bar">
          <ControlCounter value={positioned.control} />
          <button
            className="text-button"
            onClick={() => {
              if (planning) {
                setPlan(structuredClone(EMPTY_PLAN));
                setSelection([]);
              }
            }}
          >
            <Icon name="flip" size={13} />
            Reset
          </button>
        </div>
        <div className="dice-dock">
          {me.loadout.dice.map((id, i) => (
            <div
              className="die-touch"
              key={i}
              onPointerDown={(e) => dragStart(e, i)}
              onPointerMove={dragMove}
              onPointerUp={dragEnd}
              onPointerCancel={() => {
                setDragging(null);
                pointerStart.current = null;
              }}
            >
              <Die
                definition={dieById[id]}
                face={dieById[id].faces[positioned.positions[i]]}
                selected={selection.includes(i)}
                assigned={planning && used.includes(i)}
                rolling={view.phase === "ROLLING"}
                skin={profile.skin}
                onClick={() =>
                  presentation?.inspectDie
                    ? presentation.inspectDie(0, i)
                    : selectDie(i)
                }
              />
            </div>
          ))}
          <div className="control-actions">
            <button
              disabled={
                !planning || selection.length !== 1 || positioned.control < 1
              }
              onClick={() => control("shift", -1)}
              aria-label="Shift die down"
            >
              <Icon name="minus" size={15} />
              <span>1</span>
            </button>
            <button
              disabled={
                !planning || selection.length !== 1 || positioned.control < 1
              }
              onClick={() => control("shift", 1)}
              aria-label="Shift die up"
            >
              <Icon name="plus" size={15} />
              <span>1</span>
            </button>
            <button
              disabled={
                !planning || selection.length !== 1 || positioned.control < 2
              }
              onClick={() => control("flip")}
              aria-label="Flip die"
            >
              <Icon name="flip" size={15} />
              <span>2</span>
            </button>
          </div>
        </div>
        <div className="lock-row">
          <IconButton
            icon="social"
            label="Emotes"
            onClick={() => setEmotes(!emotes)}
          />
          <PrimaryButton
            onClick={lock}
            disabled={!planning}
            icon={planning ? "lock" : "check"}
          >
            {planning
              ? "LOCK IN"
              : view.phase === "LOCKED"
                ? "LOCKED"
                : view.phase === "REVEAL"
                  ? "REVEAL"
                  : "RESOLVING"}
          </PrimaryButton>
        </div>
        <p className="battle-footnote">
          {planning
            ? service.practice
              ? "Practice · take your time"
              : "At timeout, unused legal dice become Guard."
            : "Both players reveal together."}
        </p>
      </footer>
      {emotes && (
        <div className="emote-picker">
          {EMOTES.map((e) => (
            <button
              key={e}
              onClick={() => {
                setSentEmote(e);
                setEmotes(false);
                setTimeout(() => setSentEmote(""), 2200);
              }}
            >
              {e}
            </button>
          ))}
        </div>
      )}
      {sentEmote && <div className="emote-bubble">{sentEmote}</div>}
      {dragging && (
        <div
          className="drag-ghost"
          style={{ left: dragging.x, top: dragging.y }}
        >
          <Die
            definition={dieById[me.loadout.dice[dragging.slot]]}
            face={
              dieById[me.loadout.dice[dragging.slot]].faces[
                positioned.positions[dragging.slot]
              ]
            }
            skin={profile.skin}
            selected
          />
        </div>
      )}
    </div>
  );
}
