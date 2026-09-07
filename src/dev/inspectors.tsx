import { affinityText } from "../content/affinities";
import { omenFace, SIGILS, rulesLabel } from "../content/terminology";
import { useState } from "react";
import type { LabController } from "./controller";
import type { Seat } from "./model";
import { fateText, parseFate } from "./model";
import { cardById } from "../content/cards";
import { omenById } from "../content/omens";
import { legendById } from "../content/legends";
import { facePosition } from "../engine/fate";
import { decisionContext } from "../engine/match";
import { explainAssignment, validatePlan } from "../engine/rules";
import type { Loadout, Status } from "../engine/types";
import { Button, Field, Json, NumberField, Section, Toggle } from "./controls";
import { GameplayCard } from "../ui/components";
export type Run = (fn: () => void) => void;
export function FatePreview({
  fate,
  loadouts,
}: {
  fate: number[];
  loadouts: Loadout[];
}) {
  return (
    <div className="dev-fate-preview">
      {loadouts.map((l, a) => (
        <div key={a}>
          <strong>
            {a === 0 ? "A" : "B"} · {legendById[l.legend].name}
          </strong>
          <div>
            {l.dice.map((id, i) => {
              const d = omenById[id],
                p = facePosition(fate[i], d.size),
                f = d.faces[p];
              return (
                <span key={i}>
                  D{d.size} · face {p + 1}
                  <b>{omenFace(f).name}</b>
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
export function FateFacePicker({
  fate,
  loadouts,
  onChange,
}: {
  fate: number[];
  loadouts: Loadout[];
  onChange: (f: number[]) => void;
}) {
  const [reference, setReference] = useState(0);
  return (
    <div className="dev-stack">
      <Field label="Choose exact face positions for">
        <select
          value={reference}
          onChange={(e) => setReference(+e.target.value)}
        >
          <option value={0}>Player A</option>
          <option value={1}>Player B</option>
        </select>
      </Field>
      <div className="dev-grid3">
        {loadouts[reference].dice.map((id, slot) => {
          const d = omenById[id];
          return (
            <Field key={slot} label={`Slot ${slot + 1} · D${d.size}`}>
              <select
                value={facePosition(fate[slot], d.size)}
                onChange={(e) =>
                  onChange(
                    fate.map((f, i) =>
                      i === slot ? (+e.target.value * 120) / d.size : f,
                    ),
                  )
                }
              >
                {d.faces.map((f, i) => (
                  <option key={i} value={i}>
                    Face {i + 1}: {omenFace(f).name}
                  </option>
                ))}
              </select>
            </Field>
          );
        })}
      </div>
      <p className="dev-muted">
        Shared Fate maps these positions to the other player's Omen sizes.
        Directly setting an individual Omen can override that relationship.
      </p>
    </div>
  );
}
export function FateEditor({ lab, run }: { lab: LabController; run: Run }) {
  const [current, setCurrent] = useState(fateText(lab.state.fate)),
    [next, setNext] = useState(fateText(lab.nextFate ?? lab.state.fate));
  return (
    <div className="dev-stack">
      <h3>Live Fate editor</h3>
      <p className="dev-muted">
        Editing current Fate clears both plans. Omens face overrides are
        separate from shared positions.
      </p>
      <Field label="Current shared positions (1–120)">
        <input value={current} onChange={(e) => setCurrent(e.target.value)} />
      </Field>
      <Button onClick={() => run(() => lab.setFate(parseFate(current)))}>
        Apply current Fate
      </Button>
      <FateFacePicker
        fate={lab.state.fate}
        loadouts={lab.state.players.map((p) => p.loadout)}
        onChange={(f) =>
          run(() => {
            lab.setFate(f);
            setCurrent(fateText(f));
          })
        }
      />
      <FatePreview
        fate={lab.state.fate}
        loadouts={lab.state.players.map((p) => p.loadout)}
      />
      <Field label="Next shared positions (1–120)">
        <input value={next} onChange={(e) => setNext(e.target.value)} />
      </Field>
      <Button onClick={() => run(() => lab.setFate(parseFate(next), true))}>
        Set next Fate
      </Button>
      <div className="dev-actions">
        <Button onClick={() => run(() => lab.rerunFate())}>
          Re-run current Fate
        </Button>
        <Button
          onClick={() =>
            run(() => {
              if (!["TURN_START", "DICE_ROLL"].includes(lab.state.phase))
                throw new Error("Skip is available in FATE or ROLLING.");
              while (["TURN_START", "DICE_ROLL"].includes(lab.state.phase))
                lab.next();
            })
          }
        >
          Skip Fate animation
        </Button>
      </div>
    </div>
  );
}
export function AssignmentEditor({
  lab,
  actor,
  run,
}: {
  lab: LabController;
  actor: Seat;
  run: Run;
}) {
  const p = lab.state.players[actor],
    plan = p.plan ?? lab.drafts[actor];
  let validity = "VALID";
  try {
    validatePlan(decisionContext(lab.state, actor), plan);
  } catch (e) {
    validity = (e as Error).message;
  }
  return (
    <div className="dev-stack">
      <h3>Player {actor === 0 ? "A" : "B"} assignments</h3>
      {p.loadout.dice.map((id, i) => (
        <Field
          key={i}
          label={`${actor === 0 ? "A" : "B"} Omen ${i + 1} · ${omenById[id].name}`}
        >
          <select
            value={
              plan.assignments.find((a) => a.dice.includes(i))?.target ?? ""
            }
            onChange={(e) => run(() => lab.assign(actor, i, e.target.value))}
          >
            <option value="">Unassigned</option>
            <option value="guard">Ward</option>
            <option value="legend">Legend ability</option>
            {p.loadout.cards.map((c, j) => (
              <option key={j} value={c}>
                Card {j + 1} · {cardById[c].name}
              </option>
            ))}
          </select>
        </Field>
      ))}
      {plan.assignments.map((a, i) => {
        const v = explainAssignment(decisionContext(lab.state, actor), plan, a);
        return (
          <div
            key={i}
            className={`dev-validation ${v.valid ? "valid" : "invalid"}`}
          >
            <strong>
              {cardById[a.target]?.name ?? a.target} · {v.code}
            </strong>
            <p>{v.message}</p>
          </div>
        );
      })}
      <p className={validity === "VALID" ? "dev-ok" : "dev-warning"}>
        Plan: {validity}
      </p>
      <div className="dev-actions">
        <Button onClick={() => run(() => lab.lock(actor))}>
          Declare · Player {actor === 0 ? "A" : "B"}
        </Button>
        <Button onClick={() => run(() => lab.unlock(actor))}>
          Clear draft
        </Button>
        <Button onClick={() => run(() => lab.safe(actor))}>Prepare pass</Button>
        <Button
          onClick={() =>
            run(() => {
              lab.setDraft(actor, { controls: [], assignments: [] });
            })
          }
        >
          Clear plan
        </Button>
      </div>
    </div>
  );
}
export function DieInspector({
  lab,
  actor,
  slot,
  run,
}: {
  lab: LabController;
  actor: Seat;
  slot: number;
  run: Run;
}) {
  const p = lab.state.players[actor],
    d = omenById[p.loadout.dice[slot]];
  let position = p.faces[slot];
  try {
    position = lab.positions(actor).positions[slot];
  } catch {}
  const f = d.faces[position],
    op = d.opposites[position];
  return (
    <div className="dev-stack">
      <h3>
        {d.name} · D{d.size}
      </h3>
      <code>{d.id}</code>
      <div className="dev-grid2">
        <div className="dev-stat">
          <small>Face index / position</small>
          <strong>
            {position} / {position + 1}
          </strong>
        </div>
        <div className="dev-stat">
          <small>Face value / effect</small>
          <strong>{omenFace(f).name}</strong>
        </div>
        <div className="dev-stat">
          <small>Opposite</small>
          <strong>
            {op + 1} · {omenFace(d.faces[op]).name}
          </strong>
        </div>
        <div className="dev-stat">
          <small>Weight</small>
          <strong>{f.balanceWeight}</strong>
        </div>
      </div>
      <p>
        Tags: {d.tags.join(", ")}
        <br />
        Compatibility: {d.compatibleLegendTags.join(", ")}
        <br />
        Cosmetic: lab preview only · no mechanical effect
      </p>
      <Field label="Omen resource state">
        <select
          value={p.dice[slot].state}
          onChange={(e) =>
            run(() =>
              lab.setResource(
                actor,
                slot,
                e.target.value as
                  "AVAILABLE" | "HELD" | "SPENT" | "UNROLLED" | "EXPIRED",
              ),
            )
          }
        >
          {["AVAILABLE", "HELD", "SPENT", "UNROLLED", "EXPIRED"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </Field>
      <Field label="Set Omen face">
        <select
          value={position}
          onChange={(e) =>
            run(() => lab.setFace(actor, slot, Number(e.target.value)))
          }
        >
          {d.faces.map((f, i) => (
            <option key={i} value={i}>
              Face {i + 1} · {omenFace(f).name}
            </option>
          ))}
        </select>
      </Field>
      <div className="dev-actions">
        <Button
          onClick={() =>
            run(() =>
              lab.control(actor, { slot, kind: "shift", direction: -1 }),
            )
          }
        >
          Shift −1
        </Button>
        <Button
          onClick={() =>
            run(() => lab.control(actor, { slot, kind: "shift", direction: 1 }))
          }
        >
          Shift +1
        </Button>
        <Button
          onClick={() => run(() => lab.control(actor, { slot, kind: "flip" }))}
        >
          Flip · 2 Focus
        </Button>
        <Button onClick={() => run(() => lab.resetFace(actor, slot))}>
          Reset to Fate result
        </Button>
      </div>
      <Field label="Set Value">
        <select
          value={f.type === "number" ? f.value : ""}
          onChange={(e) =>
            run(() => lab.setOmenValue(actor, slot, Number(e.target.value)))
          }
        >
          <option value="" disabled>
            Select Value
          </option>
          {d.faces
            .filter((f) => f.type === "number")
            .map((f, i) => (
              <option key={i} value={f.value}>
                {f.value}
              </option>
            ))}
        </select>
      </Field>
      <div className="dev-actions">
        <Button onClick={() => run(() => lab.setOmenVoid(actor, slot))}>
          Set Void
        </Button>
        <Button onClick={() => run(() => lab.setHeldOmen(actor, slot))}>
          Set Held Omen
        </Button>
      </div>
      <Field label="Set Sigil">
        <select
          defaultValue=""
          onChange={(e) =>
            run(() => lab.forceSymbol(actor, slot, e.target.value))
          }
        >
          <option value="" disabled>
            Select Sigil
          </option>
          {Object.values(SIGILS).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Assign this Omen">
        <select
          value={
            lab.drafts[actor].assignments.find((a) => a.dice.includes(slot))
              ?.target ?? ""
          }
          onChange={(e) => run(() => lab.assign(actor, slot, e.target.value))}
        >
          <option value="">Unassigned</option>
          <option value="legend">Legend</option>
          <option value="guard">Ward</option>
          {p.loadout.cards.map((id) => (
            <option key={id} value={id}>
              {cardById[id].name}
            </option>
          ))}
        </select>
      </Field>
      <Json value={f} />
    </div>
  );
}
export const MEMORY_STATES = [
  "NEVER REVEALED",
  "CURRENTLY REVEALED",
  "KNOWN FROM PREVIOUS ROUND",
  "HIDDEN BUT KNOWN",
];
export function CardInspector({
  lab,
  actor,
  slot,
  run,
}: {
  lab: LabController;
  actor: Seat;
  slot: number;
  run: Run;
}) {
  const p = lab.state.players[actor],
    c = cardById[p.loadout.cards[slot]],
    plan = p.plan ?? lab.drafts[actor],
    a = plan.assignments.find((a) => a.target === c.id);
  const [die, setDie] = useState(0);
  const validity = a
    ? explainAssignment(decisionContext(lab.state, actor), plan, a)
    : null;
  return (
    <div className="dev-stack">
      <div className="dev-card-preview">
        <GameplayCard card={c} />
      </div>
      <h3>{c.name}</h3>
      <code>
        {c.id} · {c.timing} · priority {c.priority}
      </code>
      <p>
        {c.tags.join(" / ")} · {affinityText(c.affinityRequirements)}
      </p>
      <div className="dev-grid2">
        <div className="dev-stat">
          <small>Known to opponent</small>
          <strong>{p.known.includes(c.id) ? "Yes" : "No"}</strong>
        </div>
        <div className="dev-stat">
          <small>Used this round</small>
          <strong>
            {lab.state.events.some(
              (e) =>
                e.round === lab.state.round &&
                e.actor === actor &&
                e.type === "declaration" &&
                e.text.includes(c.name),
            )
              ? "Yes"
              : a
                ? "Planned"
                : "No"}
          </strong>
        </div>
      </div>
      <p className={validity?.valid ? "dev-ok" : "dev-warning"}>
        {validity
          ? `${validity.code}: ${validity.message}`
          : "UNASSIGNED: Select the required Omens to evaluate activation."}
      </p>
      <Field label="Reveal memory state">
        <select
          value={
            lab.memories[`${actor}:${c.id}`] ??
            (p.known.includes(c.id) ? "HIDDEN BUT KNOWN" : "NEVER REVEALED")
          }
          onChange={(e) => run(() => lab.memory(actor, c.id, e.target.value))}
        >
          {MEMORY_STATES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <p className="dev-muted">
        All known states share production known-hand memory. “Currently
        revealed” records an inspection flag; card use reveals its identity
        immediately.
      </p>
      <div className="dev-actions">
        <Button
          onClick={() =>
            run(() => lab.memory(actor, c.id, "CURRENTLY REVEALED"))
          }
        >
          Force reveal
        </Button>
        <Button
          onClick={() => run(() => lab.memory(actor, c.id, "NEVER REVEALED"))}
        >
          Hide again
        </Button>
        <Button onClick={() => run(() => lab.stun(actor, c.id))}>Stun</Button>
        <Button onClick={() => run(() => lab.stun(actor, c.id, true))}>
          Disable
        </Button>
        <Button onClick={() => run(() => lab.clearCardStatus(actor, c.id))}>
          Clear status
        </Button>
      </div>
      <Field label="Omen to assign">
        <select value={die} onChange={(e) => setDie(+e.target.value)}>
          {p.loadout.dice.map((id, i) => (
            <option key={i} value={i}>
              Omen {i + 1} · {omenById[id].name}
            </option>
          ))}
        </select>
      </Field>
      <div className="dev-actions">
        <Button onClick={() => run(() => lab.assign(actor, die, c.id))}>
          Assign Omen
        </Button>
        <Button
          onClick={() =>
            run(() => {
              for (const slot of [...(a?.dice ?? [])])
                lab.assign(actor, slot, "");
            })
          }
        >
          Remove assignment
        </Button>
        <Button
          onClick={() =>
            run(() => {
              if (!a) throw new Error("Assign Omens before activation.");
              validatePlan(decisionContext(lab.state, actor), plan);
              lab.lock(actor, plan);
            })
          }
        >
          Declare ability
        </Button>
      </div>
      <p className="dev-muted">
        Declaration pays Omens and reveals the card. Finish the one reaction
        window, then use Next Effect to inspect resolution.
      </p>
      <Json
        value={{
          requirement: c.requirement,
          effects: c.effects,
          statuses: p.statuses.filter((s) => !s.cardId || s.cardId === c.id),
          preferred: c.preferred,
        }}
      />
    </div>
  );
}
export function LegendInspector({
  lab,
  actor,
  run,
}: {
  lab: LabController;
  actor: Seat;
  run: Run;
}) {
  const p = lab.state.players[actor],
    l = legendById[p.loadout.legend];
  const [status, setStatus] = useState<Status["id"]>("poison"),
    [amount, setAmount] = useState(1),
    [expiry, setExpiry] = useState(lab.state.round);
  return (
    <div className="dev-stack">
      <h3>
        {l.name} · {l.id}
      </h3>
      <p>{l.passive}</p>
      <p>
        {l.active.timing} · {l.active.name}: {l.active.text}
        <br />
        Initiative +
        {lab.state.openingInitiative?.bonuses[actor] ??
          l.initiativeBonus} · {l.class}
      </p>
      <p>
        Slots: {l.diceSlots.map((n) => `D${n}`).join(" / ")} ·{" "}
        {l.tags.join(", ")}
      </p>
      <p className="dev-muted">
        Mastery: 1–50; local lab matches grant no account or mastery rewards.
      </p>
      <div className="dev-grid3">
        <NumberField
          label="Set Life"
          value={p.hp}
          onChange={(v) => run(() => lab.editPlayer(actor, { hp: v }))}
        />
        <NumberField
          label="Set Ward"
          value={p.guard}
          onChange={(v) => run(() => lab.setWard(actor, v))}
        />
        <NumberField
          label="Set Focus"
          max={6}
          value={p.control}
          onChange={(v) => run(() => lab.setFocus(actor, v))}
        />
      </div>
      <div className="dev-actions">
        <Button onClick={() => run(() => lab.hp(actor, p.hp + 1))}>
          Heal +1
        </Button>
        <Button onClick={() => run(() => lab.hp(actor, p.hp - 1))}>
          Damage −1
        </Button>
        <Button onClick={() => run(() => lab.hp(actor, p.hp - 5))}>
          Damage −5
        </Button>
        <Button onClick={() => run(() => lab.hp(actor, l.hp))}>
          Full heal
        </Button>
        <Button onClick={() => run(() => lab.hp(actor, 0))}>Kill</Button>
        <Button
          onClick={() =>
            run(() => lab.editPlayer(actor, { guard: p.guard + 1 }))
          }
        >
          Add Ward
        </Button>
        <Button onClick={() => run(() => lab.editPlayer(actor, { guard: 0 }))}>
          Clear Ward
        </Button>
      </div>
      <p className="dev-muted">
        These are explicit state overrides. Normal card healing/damage still
        follows the production effect engine.
      </p>
      <Field label="Add status">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Status["id"])}
        >
          {["power", "ward", "poison", "stun"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <div className="dev-grid2">
        <NumberField
          label="Status amount"
          value={amount}
          onChange={setAmount}
        />
        <NumberField
          label="Expires after round"
          max={199}
          value={expiry}
          onChange={setExpiry}
        />
      </div>
      <div className="dev-actions">
        <Button
          onClick={() =>
            run(() =>
              lab.addStatus(actor, {
                id: status,
                amount,
                expiresRound: expiry,
              }),
            )
          }
        >
          Add status
        </Button>
        <Button
          onClick={() => run(() => lab.editPlayer(actor, { statuses: [] }))}
        >
          Clear statuses
        </Button>
      </div>
      <Json value={p.statuses} />
    </div>
  );
}
export function PhaseControls({ lab, run }: { lab: LabController; run: Run }) {
  return (
    <div className="dev-stack">
      <div className="dev-phase-heading">
        <strong>
          ROUND {lab.state.round}/{lab.setup.maxRounds}
        </strong>
        <b>
          {rulesLabel(lab.state.phase)} · Active{" "}
          {lab.state.activePlayer ? "B" : "A"} · Initiative{" "}
          {lab.state.initiative ? "B" : "A"}
          {lab.resolving ? " · SUSPENDED" : ""}
        </b>
      </div>
      <p>
        A turns: {lab.state.players[0].playerTurnCount} · B turns:{" "}
        {lab.state.players[1].playerTurnCount} · Roll allowance:{" "}
        {lab.state.omenRollCount}
      </p>
      {lab.state.phase === "OMEN_CHOICE" && (
        <div>
          <p>Choose {lab.state.omenRollCount} equipped Omens</p>
          {lab.state.players[lab.state.activePlayer].loadout.dice.map(
            (id, slot) => (
              <label className="dev-toggle" key={slot}>
                <input
                  type="checkbox"
                  checked={
                    lab.drafts[lab.state.activePlayer].omenSlots?.includes(
                      slot,
                    ) ?? false
                  }
                  onChange={() =>
                    run(() => {
                      const draft = lab.drafts[lab.state.activePlayer];
                      const slots = draft.omenSlots ?? [];
                      draft.omenSlots = slots.includes(slot)
                        ? slots.filter((i) => i !== slot)
                        : [...slots, slot];
                    })
                  }
                />
                {omenById[id].name}
              </label>
            ),
          )}
        </div>
      )}
      <div className="dev-actions">
        <Button primary onClick={() => run(() => lab.next())}>
          Next phase
        </Button>
        <Button
          onClick={() =>
            run(() =>
              lab.timeout(
                (lab.state.phase === "REACTION_WINDOW"
                  ? 1 - lab.state.activePlayer
                  : lab.state.activePlayer) as Seat,
              ),
            )
          }
        >
          Skip turn / pass reaction
        </Button>
        <Button primary onClick={() => run(() => lab.nextEffect())}>
          Next effect
        </Button>
        <Button onClick={() => run(() => lab.resolveCurrent())}>
          Resolve current phase
        </Button>
      </div>
      <Toggle
        label="Step resolution"
        value={lab.options.step}
        onChange={(v) => run(() => (lab.options.step = v))}
      />
      <Toggle
        label="Auto advance"
        value={lab.options.auto}
        onChange={(v) => run(() => (lab.options.auto = v))}
      />
      <div className="dev-actions">
        <Button onClick={() => run(() => (lab.options.auto = false))}>
          Pause auto
        </Button>
        <Button onClick={() => run(() => lab.resetRound())}>Reset round</Button>
        <Button onClick={() => run(() => lab.rewind())}>
          Previous safe phase
        </Button>
        <Button
          onClick={() =>
            run(() => {
              if (lab.resolving) lab.rewind();
              lab.restart();
            })
          }
        >
          Restart match
        </Button>
        <Button onClick={() => run(() => lab.end(0))}>End · A wins</Button>
        <Button onClick={() => run(() => lab.end(1))}>End · B wins</Button>
      </div>
      <Section title="Match timer">
        <Field label="Timer policy">
          <select
            value={
              [0, 1000, 5000, 12000].includes(lab.setup.timerMs)
                ? lab.setup.timerMs
                : "custom"
            }
            onChange={(e) =>
              run(() => {
                if (e.target.value === "custom") lab.setup.timerMs = 10000;
                else lab.setup.timerMs = +e.target.value;
                lab.remainingMs = lab.setup.timerMs;
              })
            }
          >
            <option value="0">Disabled</option>
            <option value="1000">1 second</option>
            <option value="5000">5 seconds</option>
            <option value="12000">Normal · 12 seconds</option>
            <option value="custom">Custom</option>
          </select>
        </Field>
        <NumberField
          label="Custom seconds"
          max={300}
          value={lab.setup.timerMs / 1000}
          onChange={(v) =>
            run(() => {
              if (v < 0 || v > 300)
                throw new Error("Timer must be 0–300 seconds.");
              lab.setup.timerMs = v * 1000;
              lab.remainingMs = v * 1000;
            })
          }
        />
        <Toggle
          label="Pause match timer"
          value={lab.options.pauseTimer}
          onChange={(v) => run(() => (lab.options.pauseTimer = v))}
        />
        <p>
          {Math.ceil(lab.remainingMs / 1000)} seconds remain. Overlay pauses the
          timer.
        </p>
        <div className="dev-actions">
          <Button onClick={() => run(() => lab.timeout(0))}>
            Force timeout A
          </Button>
          <Button onClick={() => run(() => lab.timeout(1))}>
            Force timeout B
          </Button>
        </div>
      </Section>
    </div>
  );
}
export function AIPanel({
  lab,
  actor,
  run,
}: {
  lab: LabController;
  actor: Seat;
  run: Run;
}) {
  const [diagnostics, setDiagnostics] = useState<ReturnType<
    LabController["ai"]
  > | null>(null);
  return (
    <div className="dev-stack">
      <h3>AI · Player {actor === 0 ? "A" : "B"}</h3>
      <p className="dev-muted">
        Production candidate search. The AI receives its own cards and the
        opponent’s public projection only.
      </p>
      <Toggle
        label={`AI controls Player ${actor === 0 ? "A" : "B"}`}
        value={lab.setup.players[actor].ai}
        onChange={(v) => run(() => (lab.setup.players[actor].ai = v))}
      />
      <Toggle
        label="Pause before AI locks"
        value={lab.options.pauseBeforeAI}
        onChange={(v) => run(() => (lab.options.pauseBeforeAI = v))}
      />
      <div className="dev-actions">
        <Button
          primary
          onClick={() => run(() => setDiagnostics(lab.ai(actor)))}
        >
          Recalculate
        </Button>
        <Button
          onClick={() => run(() => lab.acceptAI(actor, diagnostics?.chosen))}
        >
          Accept AI choice
        </Button>
        <Button onClick={() => run(() => lab.randomAction(actor))}>
          Random legal alternative
        </Button>
      </div>
      {diagnostics && (
        <>
          <p>
            {diagnostics.evaluated} candidate evaluations. Top{" "}
            {diagnostics.alternatives.length} shown. Scores are heuristic
            values, not win probabilities. Reveal-cost weight is currently zero.
          </p>
          {diagnostics.alternatives.map((v, i) => (
            <Section
              key={i}
              title={`${i + 1}. ${v.plan.omenSlots ? "Roll " + v.plan.omenSlots.map((slot) => omenById[lab.state.players[actor].loadout.dice[slot]].name).join(" + ") : v.plan.assignments.map((a) => cardById[a.target]?.name ?? rulesLabel(a.target)).join(" + ") || "Hold"} · ${v.score.toFixed(2)}`}
              open={i === 0}
            >
              <Json value={v.details} />
              <Json value={v.plan} />
              <Button onClick={() => run(() => lab.acceptAI(actor, v.plan))}>
                Force this action
              </Button>
            </Section>
          ))}
        </>
      )}
    </div>
  );
}
export function EffectLog({ lab }: { lab: LabController }) {
  const frame = lab.frames.at(-1);
  const queue = [lab.state.reaction, lab.state.pending]
    .filter((d) => d !== null)
    .map((d) => ({
      actor: d.actor,
      source: d.assignment.target,
      priority: d === lab.state.reaction ? 20 : 40,
      conditions: cardById[d.assignment.target]?.requirement ?? "Universal",
      effects: d.effects,
      canceled: d.canceled,
      redirected: d.redirected,
    }));
  return (
    <div className="dev-stack">
      <h3>Effect queue / resolution</h3>
      <p className="dev-muted">
        Next Effect applies one primitive with its before/after state. Reaction
        prevention → target validation → action damage → post-damage triggers →
        cleanup. A composite frame follows its child effects.
      </p>
      {frame && (
        <Section
          title={`Last step · ${rulesLabel(frame.effect)} · ${frame.result}`}
          open
        >
          <p>
            {frame.source} → {frame.target} · priority {frame.priority}
          </p>
          <div className="dev-grid2">
            {["before", "after"].map((key) => (
              <div key={key}>
                <strong>{key.toUpperCase()}</strong>
                <Json
                  value={(frame[key as "before" | "after"] ?? []).map((p) => ({
                    life: p.hp,
                    ward: p.guard,
                    focus: p.control,
                    faces: p.faces,
                    statuses: p.statuses,
                  }))}
                />
              </div>
            ))}
          </div>
          <Json
            value={{
              pendingDamage: frame.pending,
              pendingHealing: frame.healing,
            }}
          />
        </Section>
      )}
      <Section title="Planned effect queue">
        <Json value={queue} />
      </Section>
      {lab.frames.map((f, i) => (
        <details className="dev-log-row" key={i}>
          <summary>
            {i + 1}. R{"round" in f ? f.round : "?"} P{f.priority} ·{" "}
            {f.actor < 0 ? "Both" : f.actor === 0 ? "A" : "B"} · {f.source} /{" "}
            {rulesLabel(f.effect)} {f.kind === "canceled" ? "✕" : "✓"}
          </summary>
          <p>
            {f.conditions} · {f.result}
          </p>
          <Json value={f} />
        </details>
      ))}
      <Section title="Readable match log" open>
        <pre className="dev-json">
          {lab.audit
            .map(
              (a) =>
                `R${a.round} ${a.phase} ${a.error ? "ERROR " : ""}${a.action}\n${JSON.stringify(a.detail)}`,
            )
            .join("\n\n")}
        </pre>
      </Section>
      <Section title="Production events">
        <Json value={lab.state.events} />
      </Section>
    </div>
  );
}
