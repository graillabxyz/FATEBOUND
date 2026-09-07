import { LEGENDS, legendById } from "../content/legends";
import { CARDS } from "../content/cards";
import { DICE } from "../content/dice";
import { STARTERS } from "../content/loadouts";
import { useGame } from "../ui/context";
import {
  defaultPlayer,
  defaultSetup,
  fateText,
  parseFate,
  randomLoadout,
  restrictionErrors,
} from "./model";
import type { LabSetup, Seat } from "./model";
import { Button, Field, NumberField, Section, Toggle } from "./controls";
import { FatePreview, FateFacePicker } from "./inspectors";
import type { LegendId } from "../engine/types";
export default function Setup({
  setup,
  setSetup,
  start,
  run,
}: {
  setup: LabSetup;
  setSetup: (s: LabSetup) => void;
  start: () => void;
  run: (fn: () => void) => void;
}) {
  const { profile } = useGame();
  const change = (fn: (s: LabSetup) => void) => {
    const s = structuredClone(setup);
    fn(s);
    setSetup(s);
  };
  return (
    <div className="dev-stack">
      <h2>Battle setup</h2>
      <Toggle
        label="Ignore loadout restrictions"
        value={setup.ignoreRestrictions}
        onChange={(v) => change((s) => (s.ignoreRestrictions = v))}
      />
      {setup.ignoreRestrictions && (
        <p className="dev-warning">
          Compatibility checks bypassed. Four distinct known cards and three
          existing dice are still required; all actions use production rules.
        </p>
      )}
      {([0, 1] as Seat[]).map((a) => {
        const p = setup.players[a],
          l = legendById[p.loadout.legend],
          errors = restrictionErrors(p.loadout);
        return (
          <Section
            key={a}
            title={`Player ${a === 0 ? "A" : "B"} · ${l.name}`}
            open
          >
            <Field label={`Player ${a === 0 ? "A" : "B"} Legend`}>
              <select
                value={l.id}
                onChange={(e) =>
                  change(
                    (s) =>
                      (s.players[a] = defaultPlayer(
                        e.target.value as LegendId,
                        p.ai,
                      )),
                  )
                }
              >
                {LEGENDS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={`Player ${a === 0 ? "A" : "B"} saved loadout`}>
              <select
                value={p.loadout.id}
                onChange={(e) =>
                  change((s) => {
                    s.players[a].loadout = structuredClone(
                      [...Object.values(STARTERS), ...profile.loadouts].find(
                        (l) => l.id === e.target.value,
                      )!,
                    );
                    s.players[a].known = [];
                  })
                }
              >
                <option value={p.loadout.id}>{p.loadout.name}</option>
                {[...Object.values(STARTERS), ...profile.loadouts]
                  .filter((b) => b.legend === l.id && b.id !== p.loadout.id)
                  .map((b, i) => (
                    <option key={i} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </Field>
            <div className="dev-grid2">
              {p.loadout.cards.map((id, i) => (
                <Field
                  key={i}
                  label={`Player ${a === 0 ? "A" : "B"} card ${i + 1}`}
                >
                  <select
                    className={
                      CARDS.find((c) => c.id === id)?.legend !== l.id
                        ? "invalid"
                        : ""
                    }
                    value={id}
                    onChange={(e) =>
                      change((s) => {
                        s.players[a].loadout.cards[i] = e.target.value;
                        s.players[a].known = s.players[a].known.filter((c) =>
                          s.players[a].loadout.cards.includes(c),
                        );
                      })
                    }
                  >
                    {CARDS.filter(
                      (c) => setup.ignoreRestrictions || c.legend === l.id,
                    ).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {c.requirementLabel}
                      </option>
                    ))}
                  </select>
                </Field>
              ))}
            </div>
            <div className="dev-grid3">
              {p.loadout.dice.map((id, i) => (
                <Field
                  key={i}
                  label={`Player ${a === 0 ? "A" : "B"} die ${i + 1}`}
                >
                  <select
                    value={id}
                    onChange={(e) =>
                      change(
                        (s) => (s.players[a].loadout.dice[i] = e.target.value),
                      )
                    }
                  >
                    {DICE.filter(
                      (d) =>
                        setup.ignoreRestrictions ||
                        (d.size === l.diceSlots[i] &&
                          (d.compatibleLegendTags.includes("all") ||
                            d.compatibleLegendTags.some((t) =>
                              l.tags.includes(t),
                            ))),
                    ).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} D{d.size}
                      </option>
                    ))}
                  </select>
                </Field>
              ))}
            </div>
            <div className="dev-grid3">
              <NumberField
                label={`Player ${a === 0 ? "A" : "B"} HP`}
                value={p.hp}
                onChange={(v) => change((s) => (s.players[a].hp = v))}
              />
              <NumberField
                label={`Player ${a === 0 ? "A" : "B"} Guard`}
                value={p.guard}
                onChange={(v) => change((s) => (s.players[a].guard = v))}
              />
              <NumberField
                label={`Player ${a === 0 ? "A" : "B"} Control`}
                max={6}
                value={p.control}
                onChange={(v) => change((s) => (s.players[a].control = v))}
              />
            </div>
            <div className="dev-grid2">
              <Field label={`Player ${a === 0 ? "A" : "B"} controller`}>
                <select
                  value={p.ai ? "ai" : "human"}
                  onChange={(e) =>
                    change((s) => (s.players[a].ai = e.target.value === "ai"))
                  }
                >
                  <option value="human">Human / manual</option>
                  <option value="ai">AI</option>
                </select>
              </Field>
              <Field label={`Player ${a === 0 ? "A" : "B"} AI difficulty`}>
                <select
                  value={p.difficulty}
                  onChange={(e) =>
                    change(
                      (s) =>
                        (s.players[a].difficulty = e.target
                          .value as typeof p.difficulty),
                    )
                  }
                >
                  <option>Training</option>
                  <option>Normal</option>
                </select>
              </Field>
            </div>
            <Field label={`Player ${a === 0 ? "A" : "B"} rank display`}>
              <input
                value={p.rank}
                onChange={(e) =>
                  change((s) => (s.players[a].rank = e.target.value))
                }
              />
            </Field>
            <div className="dev-actions">
              <Button
                onClick={() =>
                  change((s) => (s.players[a] = defaultPlayer(l.id, p.ai)))
                }
              >
                Use default loadout
              </Button>
              <Button
                onClick={() =>
                  change((s) => {
                    s.players[a].loadout = randomLoadout(
                      l.id,
                      crypto.getRandomValues(new Uint32Array(1))[0],
                    );
                    s.players[a].known = [];
                  })
                }
              >
                Random valid loadout
              </Button>
            </div>
            {errors.map((e) => (
              <p role="status" className="dev-warning" key={e}>
                {e}
              </p>
            ))}
            <Section title="Reveal memory, statuses & prior round">
              {p.loadout.cards.map((id, i) => (
                <Toggle
                  key={i}
                  label={`${CARDS.find((c) => c.id === id)?.name} known to opponent`}
                  value={p.known.includes(id)}
                  onChange={(v) =>
                    change(
                      (s) =>
                        (s.players[a].known = v
                          ? [...new Set([...p.known, id])]
                          : p.known.filter((c) => c !== id)),
                    )
                  }
                />
              ))}
              <NumberField
                label={`Player ${a === 0 ? "A" : "B"} previous damage dealt`}
                value={p.damageDealt}
                onChange={(v) => change((s) => (s.players[a].damageDealt = v))}
              />
              <Field label="Previous card used (report context)">
                <select
                  value={p.previousCard}
                  onChange={(e) =>
                    change((s) => (s.players[a].previousCard = e.target.value))
                  }
                >
                  <option value="">None</option>
                  {CARDS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <p className="dev-muted">
                Prior-card context is recorded. The current engine resets chain
                categories each round and has no stored-die mechanic.
              </p>
              <Field label={`Player ${a === 0 ? "A" : "B"} statuses JSON`}>
                <textarea
                  key={JSON.stringify(p.statuses)}
                  defaultValue={JSON.stringify(p.statuses)}
                  onBlur={(e) =>
                    run(() =>
                      change(
                        (s) =>
                          (s.players[a].statuses = JSON.parse(e.target.value)),
                      ),
                    )
                  }
                />
              </Field>
              <p className="dev-muted">
                Example: [&#123;"id":"poison","amount":2,"expiresRound":1&#125;]
              </p>
            </Section>
          </Section>
        );
      })}
      <div className="dev-actions">
        <Button
          onClick={() =>
            change((s) => (s.players[1] = structuredClone(s.players[0])))
          }
        >
          Mirror Player A
        </Button>
        <Button onClick={() => change((s) => s.players.reverse())}>
          Swap players
        </Button>
        <Button onClick={() => setSetup(defaultSetup())}>Reset setup</Button>
      </div>
      <Section title="Round, seed & timer" open>
        <div className="dev-grid3">
          <NumberField
            label="Starting round"
            min={1}
            max={99}
            value={setup.round}
            onChange={(v) => change((s) => (s.round = v))}
          />
          <NumberField
            label="Maximum round"
            min={1}
            max={99}
            value={setup.maxRounds}
            onChange={(v) => change((s) => (s.maxRounds = v))}
          />
          <NumberField
            label="Decision seconds (0 disables)"
            max={300}
            value={setup.timerMs / 1000}
            onChange={(v) => change((s) => (s.timerMs = v * 1000))}
          />
        </div>
        <NumberField
          label="Match seed"
          max={0xffffffff}
          value={setup.seed}
          onChange={(v) => change((s) => (s.seed = v))}
        />
      </Section>
      <Section title="Shared Fate" open>
        <Field label="Fate mode">
          <select
            value={setup.fate.mode}
            onChange={(e) =>
              change(
                (s) =>
                  (s.fate.mode = e.target.value as LabSetup["fate"]["mode"]),
              )
            }
          >
            <option value="random">Random · production seed</option>
            <option value="fixed">Fixed each round</option>
            <option value="sequence">Sequence</option>
          </select>
        </Field>
        <p className="dev-muted">
          Shared positions are 1–120, normalized across die sizes. The preview
          below shows the exact face on every equipped die.
        </p>
        <Field label="Fixed shared positions">
          <input
            key={fateText(setup.fate.fixed)}
            defaultValue={fateText(setup.fate.fixed)}
            onBlur={(e) =>
              run(() =>
                change((s) => (s.fate.fixed = parseFate(e.target.value))),
              )
            }
          />
        </Field>
        <FateFacePicker
          fate={setup.fate.fixed}
          loadouts={setup.players.map((p) => p.loadout)}
          onChange={(f) =>
            change((s) => {
              s.fate.fixed = f;
              s.fate.mode = "fixed";
            })
          }
        />
        <FatePreview
          fate={setup.fate.fixed}
          loadouts={setup.players.map((p) => p.loadout)}
        />
        {setup.fate.mode === "sequence" && (
          <>
            <Field label="Fate sequence · one round per line">
              <textarea
                rows={5}
                defaultValue={setup.fate.sequence.map(fateText).join("\n")}
                onBlur={(e) =>
                  run(() =>
                    change(
                      (s) =>
                        (s.fate.sequence = e.target.value
                          .trim()
                          .split("\n")
                          .map(parseFate)),
                    ),
                  )
                }
              />
            </Field>
            <Field label="When sequence ends">
              <select
                value={setup.fate.end}
                onChange={(e) =>
                  change(
                    (s) =>
                      (s.fate.end = e.target.value as LabSetup["fate"]["end"]),
                  )
                }
              >
                <option value="repeat">Repeat sequence</option>
                <option value="random">Switch to random</option>
                <option value="stop">Stop match</option>
              </select>
            </Field>
          </>
        )}
      </Section>
      <Button primary onClick={start}>
        Start lab match
      </Button>
    </div>
  );
}
