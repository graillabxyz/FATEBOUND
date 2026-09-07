import { rulesLabel } from "../content/terminology";
import { useEffect, useRef, useState } from "react";
import type {
  MatchView,
  Plan,
  PlayerState,
  DecisionContext,
} from "../engine/types";
import type { LocalMatchService } from "../services/match-service";
import { GAME } from "../content/config";
import { cardById } from "../content/cards";
import { omenById } from "../content/omens";
import { legendById } from "../content/legends";
import {
  EMPTY_PLAN,
  validatePlan,
  explainAssignment,
  applyControls,
} from "../engine/rules";
import { useGame } from "./context";
import {
  CardBack,
  FocusCounter,
  Omen,
  GameplayCard,
  LifeBar,
  Icon,
  LegendArt,
  PrimaryButton,
} from "./components";
import { audioCue } from "../services/audio";
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
  reactionTimerDisabled?: boolean;
  viewOnly?: boolean;
  syncKey?: number;
  draft?: Plan;
  onDraft?: (p: Plan) => void;
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
  onEnd: (v: MatchView) => void;
  onExit: () => void;
  presentation?: BattlePresentation;
}) {
  const { profile, inspect } = useGame();
  const [view, setView] = useState(() => service.view()),
    [selection, setSelection] = useState<number[]>(
      presentation?.draft?.assignments[0]?.dice ?? [],
    ),
    [target, setTarget] = useState(
      presentation?.draft?.assignments[0]?.target ?? "",
    ),
    [draftControls, setDraftControls] = useState<Plan["controls"]>(
      presentation?.draft?.controls ?? [],
    ),
    [error, setError] = useState(""),
    [seconds, setSeconds] = useState(12),
    [showLog, setShowLog] = useState(false);
  const latest = useRef(view),
    ended = useRef(false);
  latest.current = view;
  const me = view.players[0],
    enemy = view.players[1],
    legend = legendById[me.loadout.legend],
    enemyLegend = legendById[enemy.loadout.legend];
  const choosingOmens = view.phase === "OMEN_CHOICE";
  const reaction = view.phase === "REACTION_WINDOW",
    myDecision =
      !presentation?.viewOnly &&
      (reaction
        ? view.activePlayer === 1
        : ["OMEN_CHOICE", "MAIN_ACTION"].includes(view.phase) &&
          view.activePlayer === 0);
  const ctx: DecisionContext = {
    omenRollCount: view.omenRollCount,
    round: view.round,
    fate: view.fate,
    actor: 0,
    activePlayer: view.activePlayer,
    turnInRound: view.turnInRound,
    initiative: view.initiative,
    pending: view.pending,
    phase: view.phase,
    self: me as PlayerState,
    enemy,
  };
  const plan: Plan = {
    controls: draftControls,
    assignments: target ? [{ target, dice: selection }] : [],
  };
  let positions = me.faces,
    control = me.control;
  try {
    if (myDecision && draftControls.length) {
      const preview = applyControls(
        me.loadout as PlayerState["loadout"],
        me.faces,
        draftControls,
        me.control,
      );
      positions = preview.positions;
      control = preview.control;
    }
  } catch {
    /* Validator below explains the invalid draft. */
  }
  const diagnostic = target
    ? explainAssignment(ctx, plan, plan.assignments[0])
    : null;
  const available = (slot: number) =>
    ["AVAILABLE", "HELD"].includes(me.dice[slot].state);
  const eligible = (id: string) => {
    if (!myDecision || choosingOmens) return false;
    for (let mask = 1; mask < 8; mask++) {
      try {
        validatePlan(ctx, {
          controls: draftControls,
          assignments: [
            { target: id, dice: [0, 1, 2].filter((i) => mask & (1 << i)) },
          ],
        });
        return true;
      } catch {
        /* Show only legal possibilities. */
      }
    }
    return false;
  };
  const refresh = () => setView(service.view());
  useEffect(() => {
    refresh();
    setSelection(presentation?.draft?.assignments[0]?.dice ?? []);
    setTarget(presentation?.draft?.assignments[0]?.target ?? "");
    setDraftControls(presentation?.draft?.controls ?? []);
  }, [presentation?.syncKey, service]);
  useEffect(() => {
    const timer = setInterval(() => {
      const v = service.tick(Date.now());
      if (v.revision !== latest.current.revision) setView(v);
      setSeconds(Math.max(0, Math.ceil((v.deadline - Date.now()) / 1000)));
    }, 200);
    return () => clearInterval(timer);
  }, [service]);
  useEffect(() => {
    if (presentation) return;
    setDraftControls([]);
    setSelection([]);
    setTarget("");
    setError("");
  }, [view.phase, view.turn]);

  useEffect(() => {
    if (view.phase === "MATCH_END") {
      if (!ended.current) {
        ended.current = true;
        onEnd(view);
      }
      return;
    }
    if (view.phase === "DICE_ROLL") audioCue("roll", profile.settings);
    if (view.phase === "REACTION_DECLARED")
      audioCue("reveal", profile.settings);
    if (presentation?.manualAdvance) return;
    const delay = (GAME.phaseMs as Record<string, number>)[view.phase];
    if (delay === undefined) return;
    const timer = setTimeout(
      () => {
        try {
          setView(service.advance(Date.now()));
        } catch (e) {
          setError((e as Error).message);
        }
      },
      profile.settings.reducedMotion ? 100 : delay,
    );
    return () => clearTimeout(timer);
  }, [view.phase, view.turn, service]);
  const submit = (p: Plan) => {
    try {
      setView(
        service.submit({
          matchId: view.id,
          round: view.round,
          revision: view.revision,
          sequence: service.nextSequence(),
          plan: p,
        }),
      );
      setSelection([]);
      setTarget("");
      setDraftControls([]);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const choose = (id: string) => {
    if (myDecision) {
      setTarget(id);
      presentation?.onDraft?.({
        controls: draftControls,
        assignments: [{ target: id, dice: selection }],
      });
      setError("");
    }
  };
  const dieState = (side: 0 | 1, slot: number) => {
    const p = view.players[side],
      d = p.dice[slot];
    if (d.state === "HELD") return `${reaction && view.activePlayer !== side ? "HELD · REACT" : "HELD"}${d.modified ? " · FOCUS" : ""}`;
    if (d.modified && ["AVAILABLE", "HELD"].includes(d.state))
      return "FOCUS MODIFIED";
    if (
      d.state === "AVAILABLE" &&
      omenById[p.loadout.dice[slot]].faces[p.faces[slot]].type === "symbol"
    )
      return "SIGIL";
    return d.state;
  };
  const pending = view.pending,
    source = pending
      ? (cardById[pending.assignment.target]?.name ??
        (pending.assignment.target === "guard"
          ? "Universal Ward"
          : legendById[view.players[pending.actor].loadout.legend].active.name))
      : "";
  return (
    <div className="battle-screen turn-battle">
      <header className="turn-header">
        <button aria-label="Leave battle" onClick={onExit}>
          <Icon name="exit" size={18} />
        </button>
        <span>
          ROUND {view.round || 1}
          <small> / {presentation?.maxRounds ?? GAME.maxRounds}</small>
        </span>
        <button
          onClick={() => setShowLog((v) => !v)}
          aria-label="Toggle battle log"
        >
          <Icon name="scroll" size={18} />
        </button>
      </header>
      <div className="battle-board turn-board">
        <section
          className={`turn-combatant opponent ${view.activePlayer === 1 ? "active-turn" : ""}`}
        >
          <button
            className="turn-portrait"
            onClick={() =>
              presentation?.inspectLegend
                ? presentation.inspectLegend(1)
                : inspect({ type: "legend", item: enemyLegend })
            }
          >
            <LegendArt id={enemyLegend.id} />
          </button>
          <div className="turn-vitals">
            <div>
              <strong>{enemyLegend.name}</strong>
              {view.initiative === 1 && (
                <span className="initiative-badge">
                  <Icon name="wind" size={12} /> INITIATIVE
                </span>
              )}
            </div>
            <LifeBar
              key={`${presentation?.names?.[1] ?? "opponent"}:${enemyLegend.id}`}
              hp={enemy.hp}
              max={enemyLegend.hp}
              guard={enemy.guard}
            />
            <small>
              {presentation?.names?.[1] ?? `${service.difficulty} AI`} ·{" "}
              {enemy.control} Focus
              {enemy.statuses.length
                ? ` · ${enemy.statuses.map((s) => `${s.id} ${s.amount}`).join(", ")}`
                : ""}
            </small>
          </div>
        </section>
        <div className="battle-section-label">KNOWN HAND</div>
        <div className="opponent-hand">
          {enemy.loadout.cards.map((id, i) => (
            <CardBack
              key={i}
              index={i}
              known={id ? cardById[id] : undefined}
              onClick={() =>
                presentation?.inspectCard
                  ? presentation.inspectCard(1, i)
                  : id && inspect({ type: "card", item: cardById[id] })
              }
            />
          ))}
        </div>
        <div className="turn-enemy-dice">
          {enemy.loadout.dice.map((id, i) => (
            <div
              key={i}
              className={`resource-die resource-${enemy.dice[i].state.toLowerCase()}`}
            >
              <Omen
                definition={omenById[id]}
                face={
                  ["UNROLLED", "EXPIRED"].includes(enemy.dice[i].state)
                    ? {
                        type: "blank",
                        value: 0,
                        displayIcon: "—",
                        balanceWeight: 0,
                      }
                    : omenById[id].faces[enemy.faces[i]]
                }
                small
                rolling={enemy.dice[i].state === "ROLLING"}
                onClick={() =>
                  presentation?.inspectDie
                    ? presentation.inspectDie(1, i)
                    : inspect({
                        type: "omen",
                        item: omenById[id],
                        faceIndex: enemy.faces[i],
                      })
                }
              />
              <small>{dieState(1, i)}</small>
            </div>
          ))}
        </div>
        <div
          className={`turn-announcement ${reaction ? "reaction" : ""}`}
          role="status"
        >
          <small>
            {view.phase === "DICE_ROLL" ? "ROLL OMENS" : rulesLabel(view.phase)}
          </small>
          <strong>
            {choosingOmens
              ? view.activePlayer === 0
                ? `CHOOSE ${view.omenRollCount} ${view.omenRollCount === 1 ? "OMEN" : "OMENS"}`
                : "OPPONENT CHOOSING OMENS"
              : reaction
                ? view.activePlayer === 1
                  ? "YOUR REACTION"
                  : "OPPONENT REACTION"
                : view.phase === "MAIN_ACTION"
                  ? view.activePlayer === 0
                    ? "YOUR TURN"
                    : "OPPONENT TURN"
                  : view.phase === "ROUND_START"
                    ? `${legendById[view.players[view.initiative].loadout.legend].name} leads`
                    : view.phase === "MATCH_END"
                      ? "MATCH COMPLETE"
                      : source || "Read the moment"}
          </strong>
          {pending && (
            <span>
              {legendById[view.players[pending.actor].loadout.legend].name} uses{" "}
              {source}
            </span>
          )}
          {reaction && (
            <span>
              {presentation?.reactionTimerDisabled
                ? "Timer disabled"
                : `${seconds}s`}
              {" · React once or pass"}
            </span>
          )}
        </div>
        {["MATCH_INTRO", "INITIATIVE_ROLL"].includes(view.phase) && (
          <div className="initiative-contest">
            <Icon name="wind" />
            <h2>Opening initiative</h2>
            {view.openingInitiative ? (
              <>
                <div>
                  {view.players.map((p, i) => (
                    <span key={i}>
                      <strong>{legendById[p.loadout.legend].name}</strong>
                      <b>
                        {view.openingInitiative!.rolls[i]} +{" "}
                        {view.openingInitiative!.bonuses[i]} ={" "}
                        {view.openingInitiative!.totals[i]}
                      </b>
                    </span>
                  ))}
                </div>
                <p>
                  {
                    legendById[
                      view.players[view.openingInitiative.winner].loadout.legend
                    ].name
                  }{" "}
                  takes Initiative
                </p>
              </>
            ) : (
              <p>d20 + Legend initiative bonus</p>
            )}
            <small>Initiative alternates each round.</small>
          </div>
        )}
        {showLog ? (
          <div className="turn-log">
            {view.events.slice(-30).map((e, i) => (
              <p key={i}>
                <small>
                  R{e.round} · {rulesLabel(e.type)}
                </small>
                {rulesLabel(e.text)}
              </p>
            ))}
          </div>
        ) : (
          <div className="turn-last-event">
            {rulesLabel(view.events.at(-1)?.text ?? "")}
          </div>
        )}
        <section
          className={`turn-combatant self ${view.activePlayer === 0 ? "active-turn" : ""}`}
        >
          <button
            className="turn-portrait"
            onClick={() =>
              presentation?.inspectLegend
                ? presentation.inspectLegend(0)
                : inspect({ type: "legend", item: legend })
            }
          >
            <LegendArt id={legend.id} />
          </button>
          <div className="turn-vitals">
            <div>
              <strong>{legend.name}</strong>
              {view.initiative === 0 && (
                <span className="initiative-badge">
                  <Icon name="wind" size={12} /> INITIATIVE
                </span>
              )}
            </div>
            <LifeBar
              key={`${presentation?.names?.[0] ?? "player"}:${legend.id}`}
              hp={me.hp}
              max={legend.hp}
              guard={me.guard}
            />
            <small>
              {presentation?.names?.[0] ?? "You"} · Initiative +
              {view.openingInitiative?.bonuses[0] ?? legend.initiativeBonus}
              {me.statuses.length
                ? ` · ${me.statuses.map((s) => `${s.id} ${s.amount}`).join(", ")}`
                : ""}
            </small>
          </div>
        </section>
        <div className="battle-section-label">HAND</div>
        <div className="turn-hand">
          {me.loadout.cards.map((id, i) =>
            id ? (
              <div
                className={`timed-card ${eligible(id) ? "eligible" : ""}`}
                key={i}
                data-card-state={
                  me.statuses.some(
                    (s) => s.id === "stun" && (!s.cardId || s.cardId === id),
                  )
                    ? "DISABLED_STATUS"
                    : target === id
                      ? "ACTIVE"
                      : eligible(id)
                        ? reaction
                          ? "AVAILABLE_REACTION"
                          : "AVAILABLE_ACTION"
                        : "UNAVAILABLE_REQUIREMENT"
                }
              >
                <span className="timing-label">
                  {cardById[id].timing}
                  {me.known.includes(id) ? " · REVEALED" : " · PRIVATE"}
                </span>
                <GameplayCard
                  card={cardById[id]}
                  compact
                  disabled={!eligible(id)}
                  selected={target === id}
                  assigned={
                    target === id ? selection.map((i) => String(i + 1)) : []
                  }
                  onClick={() => choose(id)}
                  onInspect={() =>
                    presentation?.inspectCard
                      ? presentation.inspectCard(0, i)
                      : inspect({ type: "card", item: cardById[id] })
                  }
                />
              </div>
            ) : (
              <CardBack index={i} key={i} />
            ),
          )}
        </div>
      </div>
      <div className="battle-controls turn-controls">
        <div className="turn-resource-heading">
          <span>
            {myDecision
              ? reaction
                ? "Available reactions"
                : choosingOmens
                  ? `Choose ${view.omenRollCount} equipped Omens`
                  : "OMENS · select → activate"
              : "Held Omens remain visible"}
          </span>
          <FocusCounter value={control} />
        </div>
        <div className="turn-dice-tray">
          {me.loadout.dice.map((id, i) => (
            <div
              key={i}
              className={`resource-die resource-${me.dice[i].state.toLowerCase()}`}
            >
              <Omen
                definition={omenById[id]}
                face={
                  ["UNROLLED", "EXPIRED"].includes(me.dice[i].state)
                    ? {
                        type: "blank",
                        value: 0,
                        displayIcon: "—",
                        balanceWeight: 0,
                      }
                    : omenById[id].faces[positions[i]]
                }
                selected={selection.includes(i)}
                rolling={me.dice[i].state === "ROLLING"}
                onClick={() => {
                  if (presentation?.inspectDie) {
                    presentation.inspectDie(0, i);
                    return;
                  }
                  if (myDecision && (choosingOmens || available(i))) {
                    const next = selection.includes(i)
                      ? selection.filter((n) => n !== i)
                      : [...selection, i];
                    setSelection(next);
                    presentation?.onDraft?.({
                      controls: draftControls,
                      assignments: target ? [{ target, dice: next }] : [],
                    });
                  }
                }}
                label={`Omen slot ${i + 1}, D${omenById[id].size}, ${dieState(0, i)}`}
              />
              <button
                className="omen-info-button"
                aria-label={`Inspect ${omenById[id].name} faces and Sigils`}
                onClick={() =>
                  inspect({
                    type: "omen",
                    item: omenById[id],
                    faceIndex: positions[i],
                  })
                }
              >
                ⓘ d{omenById[id].size}
              </button>
              <small>
                {selection.includes(i) ? "ASSIGNED" : dieState(0, i)}
              </small>
            </div>
          ))}
        </div>
        {choosingOmens && myDecision && (
          <PrimaryButton
            disabled={selection.length !== view.omenRollCount}
            onClick={() =>
              submit({ controls: [], assignments: [], omenSlots: selection })
            }
          >
            Roll {selection.length} {selection.length === 1 ? "Omen" : "Omens"}
          </PrimaryButton>
        )}
        {myDecision && !choosingOmens && (
          <>
            <div className="turn-abilities">
              <button
                className={target === "legend" ? "selected" : ""}
                onClick={() => choose("legend")}
              >
                <Icon name="star" size={14} />
                <span>
                  {legend.active.name}
                  <small>{legend.active.timing}</small>
                </span>
              </button>
              <button
                className={target === "guard" ? "selected" : ""}
                onClick={() => choose("guard")}
              >
                <Icon name="guard" size={14} />
                <span>
                  Ward<small>½ Value ↓</small>
                </span>
              </button>
            </div>
            {!reaction && selection.length === 1 && (
              <div className="turn-control-actions">
                {([-1, 1] as const).map((direction) => (
                  <button
                    key={direction}
                    onClick={() =>
                      submit({
                        controls: [
                          { slot: selection[0], kind: "shift", direction },
                        ],
                        assignments: [],
                      })
                    }
                  >
                    Shift {direction > 0 ? "+1" : "−1"} · 1 Focus
                  </button>
                ))}
                <button
                  onClick={() =>
                    submit({
                      controls: [{ slot: selection[0], kind: "flip" }],
                      assignments: [],
                    })
                  }
                >
                  Flip · 2 Focus
                </button>
              </div>
            )}
            {target && (
              <p
                className={`turn-diagnostic ${diagnostic?.valid ? "valid" : "invalid"}`}
                role="status"
              >
                {diagnostic?.message}
              </p>
            )}
            <div className="turn-submit">
              {target && (
                <PrimaryButton
                  disabled={!diagnostic?.valid}
                  onClick={() => submit(plan)}
                >
                  {reaction ? "React" : "Activate"}
                </PrimaryButton>
              )}
              <button
                className="hold-button"
                onClick={() => submit(structuredClone(EMPTY_PLAN))}
              >
                {reaction ? "Pass reaction" : "Hold Omens · End turn"}
                {!service.practice && !reaction ? ` · ${seconds}s` : ""}
              </button>
            </div>
          </>
        )}
        {!myDecision && (
          <p className="turn-waiting">
            {view.phase === "MATCH_END"
              ? "The story is written."
              : "Watch their resources. Prepare your response."}
          </p>
        )}
        {error && (
          <p className="turn-diagnostic invalid" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
