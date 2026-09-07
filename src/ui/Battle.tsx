import { BattlePresence, MatchIdentityIntro } from "./BattlePresence";
import { EmoteMenu } from "./Emotes";
import { COSMETICS } from "../content/economy";
import { rankLabel } from "../services/profile";
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
  Icon,
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
      presentation?.draft?.omenSlots ??
        presentation?.draft?.assignments[0]?.dice ??
        [],
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
  const [omenMotion, setOmenMotion] = useState<{
    slot: number;
    kind: string;
    key: number;
  } | null>(null);
  useEffect(() => {
    if (!omenMotion) return;
    const timer = setTimeout(() => setOmenMotion(null), 480);
    return () => clearTimeout(timer);
  }, [omenMotion?.key]);
  const lastFeedback = useRef(view);
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
  const canFocus = (action: Plan["controls"][number]) => {
    try {
      validatePlan(ctx, { controls: [action], assignments: [] });
      return true;
    } catch {
      return false;
    }
  };
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
    setSelection(
      presentation?.draft?.omenSlots ??
        presentation?.draft?.assignments[0]?.dice ??
        [],
    );
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
        const timer = setTimeout(
          () => {
            ended.current = true;
            onEnd(view);
          },
          profile.settings.reducedMotion ? 0 : 650,
        );
        return () => clearTimeout(timer);
      }
      return;
    }
    if (view.phase === "DICE_ROLL") audioCue("roll", profile.settings);
    if (view.phase === "REACTION_DECLARED")
      audioCue("reveal", profile.settings);
    if (presentation?.manualAdvance) return;
    const delay =
      view.phase === "MATCH_INTRO"
        ? 1100
        : view.phase === "INITIATIVE_ROLL"
          ? 1200
          : (GAME.phaseMs as Record<string, number>)[view.phase];
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
      if (p.controls.length) {
        setOmenMotion({
          slot: p.controls[0].slot,
          kind: p.controls[0].kind,
          key: Date.now(),
        });
        audioCue(
          p.controls[0].kind === "flip" ? "flip" : "shift",
          profile.settings,
        );
      }
      if (
        p.assignments.some((a) =>
          a.dice.some(
            (slot) =>
              omenById[me.loadout.dice[slot]].faces[positions[slot]].type ===
              "symbol",
          ),
        )
      )
        audioCue("symbol", profile.settings);
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
    if (d.state === "HELD")
      return `${reaction && view.activePlayer !== side ? "HELD · REACT" : "HELD"}${d.modified ? " · FOCUS" : ""}`;
    if (d.modified && ["AVAILABLE", "HELD"].includes(d.state))
      return "FOCUS MODIFIED";
    if (
      d.state === "AVAILABLE" &&
      omenById[p.loadout.dice[slot]].faces[p.faces[slot]].type === "symbol"
    )
      return "SIGIL";
    return d.state;
  };
  const identities = [
    {
      name: presentation?.names?.[0] ?? profile.name,
      rank: presentation?.ranks?.[0] ?? rankLabel(profile),
      title: profile.title,
      cosmetic:
        (COSMETICS.find((c) => c.id === profile.skin)?.name ?? "Heartwood") +
        " Omens",
      avatar: profile.avatar,
    },
    {
      name: presentation?.names?.[1] ?? "Training partner",
      rank: presentation?.ranks?.[1] ?? `${service.difficulty} AI`,
      title: "The other side of the table",
      avatar: enemy.loadout.legend,
    },
  ];
  const reactionReady =
    reaction &&
    myDecision &&
    [
      ...me.loadout.cards.filter((id): id is string => !!id),
      "legend",
      "guard",
    ].some(eligible);
  useEffect(() => {
    const prev = lastFeedback.current;
    lastFeedback.current = view;
    if (prev.id !== view.id || view.turn < prev.turn) return;
    const wardBreak =
      view.players.some(
        (p, i) => p.guard < prev.players[i].guard && p.hp <= prev.players[i].hp,
      ) &&
      view.events.slice(prev.events.length).some((e) => e.type === "damage");
    if (wardBreak) audioCue("wardBreak", profile.settings);
    if (view.players.some((p, i) => p.hp < prev.players[i].hp))
      audioCue("damage", profile.settings);
    else if (view.players.some((p, i) => p.hp > prev.players[i].hp))
      audioCue("heal", profile.settings);
    if (
      view.phase === "REACTION_WINDOW" &&
      prev.phase !== "REACTION_WINDOW" &&
      view.activePlayer === 1
    )
      audioCue("reaction", profile.settings);
    if (view.phase === "ACTION_DECLARED" && prev.phase !== "ACTION_DECLARED")
      audioCue("reveal", profile.settings);
    if (view.phase === "MAIN_ACTION" && prev.phase === "DICE_ROLL")
      audioCue("settle", profile.settings);
  }, [view.revision]);
  const declaredCard =
    view.reaction?.assignment.target ?? view.pending?.assignment.target;
  const declaringActor = view.reaction?.actor ?? view.pending?.actor;
  const pending = view.pending,
    source = pending
      ? (cardById[pending.assignment.target]?.name ??
        (pending.assignment.target === "guard"
          ? "Universal Ward"
          : legendById[view.players[pending.actor].loadout.legend].active.name))
      : "";
  return (
    <div
      className={`battle-screen turn-battle premium-table ${reactionReady ? "table-reaction-ready" : myDecision ? "table-own-turn" : "table-opponent-turn"}`}
      data-phase={view.phase}
    >
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
        <BattlePresence
          player={enemy}
          identity={identities[1]}
          side={1}
          initiative={view.initiative === 1}
          active={view.activePlayer === 1}
          ability={declaringActor === 1 && declaredCard === "legend"}
          reduced={profile.settings.reducedMotion}
          onInspect={() =>
            presentation?.inspectLegend
              ? presentation.inspectLegend(1)
              : inspect({ type: "legend", item: enemyLegend })
          }
        />
        <div className="opponent-kit">
          <div className="opponent-known">
            <div className="battle-section-label">KNOWN HAND</div>
            <div className="opponent-hand">
              {enemy.loadout.cards.map((id, i) => (
                <CardBack
                  key={`${i}-${id ?? "private"}`}
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
        </div>
      </div>
      <div className="table-center-and-self">
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
                  ? reactionReady
                    ? "REACTION AVAILABLE"
                    : "REACTION · PASS"
                  : "OPPONENT REACTION"
                : view.phase === "MAIN_ACTION"
                  ? view.activePlayer === 0
                    ? "YOUR TURN"
                    : "OPPONENT TURN"
                  : view.phase === "ROUND_START"
                    ? `${legendById[view.players[view.initiative].loadout.legend].name} leads`
                    : view.phase === "MATCH_END"
                      ? "MATCH COMPLETE"
                      : view.phase === "RESOLUTION"
                        ? "RESOLVING"
                        : view.phase === "ACTION_DECLARED" ||
                            view.phase === "REACTION_DECLARED"
                          ? "LOCKED"
                          : source || "NEXT TURN"}
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
          <MatchIdentityIntro view={view} identities={identities} />
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
        <BattlePresence
          player={me}
          identity={identities[0]}
          side={0}
          initiative={view.initiative === 0}
          active={view.activePlayer === 0}
          ability={declaringActor === 0 && declaredCard === "legend"}
          reduced={profile.settings.reducedMotion}
          onInspect={() =>
            presentation?.inspectLegend
              ? presentation.inspectLegend(0)
              : inspect({ type: "legend", item: legend })
          }
        />
        <EmoteMenu urgent={reaction && myDecision} />
      </div>
      <div className="table-hand-zone">
        <div className="battle-section-label">
          HAND · HOLD A CARD TO INSPECT
        </div>
        <div className="turn-hand">
          {me.loadout.cards.map((id, i) =>
            id ? (
              <div
                className={`timed-card ${eligible(id) ? "eligible" : ""} ${declaredCard === id && declaringActor === 0 ? "card-declaring" : ""} ${reaction && eligible(id) ? "reaction-card" : ""}`}
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
        <div className="battle-section-label">
          TURN {view.turn} · {view.omenRollCount} OMEN
          {view.omenRollCount !== 1 ? "S" : ""} THIS ROLL
        </div>
        <div className="turn-resource-heading">
          <span>
            {myDecision
              ? reaction
                ? "Available reactions"
                : choosingOmens
                  ? `Choose ${view.omenRollCount} equipped ${view.omenRollCount === 1 ? "Omen" : "Omens"}`
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
                skin={profile.skin}
                motion={omenMotion?.slot === i ? omenMotion.kind : ""}
                key={omenMotion?.slot === i ? omenMotion.key : i}
                selected={selection.includes(i)}
                rolling={me.dice[i].state === "ROLLING"}
                onClick={() => {
                  if (presentation?.inspectDie && !choosingOmens) {
                    presentation.inspectDie(0, i);
                    return;
                  }
                  if (myDecision && (choosingOmens || available(i))) {
                    const next = selection.includes(i)
                      ? selection.filter((n) => n !== i)
                      : [...selection, i];
                    setSelection(next);
                    presentation?.onDraft?.({
                      ...(choosingOmens ? { omenSlots: next } : {}),
                      controls: draftControls,
                      assignments: target ? [{ target, dice: next }] : [],
                    });
                  }
                }}
                label={`Omen slot ${i + 1}, D${omenById[id].size}, ${dieState(0, i)}`}
              />
              <span className="resource-name">{omenById[id].name}</span>
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
                {selection.includes(i)
                  ? choosingOmens
                    ? "SELECTED"
                    : "ASSIGNED"
                  : dieState(0, i)}
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
            {!target &&
              me.dice.some((d) => ["AVAILABLE", "HELD"].includes(d.state)) && (
                <div className="turn-abilities">
                  <button
                    className={target === "legend" ? "selected" : ""}
                    disabled={!eligible("legend")}
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
                    disabled={!eligible("guard")}
                    onClick={() => choose("guard")}
                  >
                    <Icon name="guard" size={14} />
                    <span>
                      Ward<small>½ Value ↓</small>
                    </span>
                  </button>
                </div>
              )}
            {!reaction && !target && selection.length === 1 && (
              <div className="turn-control-actions">
                {([-1, 1] as const).map((direction) => (
                  <button
                    key={direction}
                    disabled={
                      !canFocus({
                        slot: selection[0],
                        kind: "shift",
                        direction,
                      })
                    }
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
                  disabled={!canFocus({ slot: selection[0], kind: "flip" })}
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
                <button
                  aria-label="Clear selected ability"
                  onClick={() => setTarget("")}
                >
                  ×
                </button>
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
