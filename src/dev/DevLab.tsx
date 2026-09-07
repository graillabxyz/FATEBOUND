import { useEffect, useMemo, useRef, useState } from "react";
import { AppContext, useGame } from "../ui/context";
import Battle from "../ui/Battle";
import { Icon, Modal } from "../ui/components";
import { LabController, importSnapshot } from "./controller";
import type { LabSnapshot, LabSetup, Seat, ViewMode } from "./model";
import { defaultSetup } from "./model";
import { Button, Field, Json, NumberField, Section, Toggle } from "./controls";
import Setup from "./Setup";
import {
  AIPanel,
  AssignmentEditor,
  CardInspector,
  DieInspector,
  EffectLog,
  FateEditor,
  LegendInspector,
  PhaseControls,
} from "./inspectors";
import { SCENARIOS } from "./scenarios";
import {
  copyText,
  downloadJSON,
  saveScenario,
  savedScenarios,
  loadSnapshot,
  persistSnapshot,
} from "./storage";
import { cardById } from "../content/cards";
import { dieById } from "../content/dice";
import { recordMatch } from "../metrics/data";
import { ContentBrowser, DiceLab } from "./Content";
import SimulationPanel from "../metrics/SimulationPanel";
import { MetricsTable } from "../metrics/MetricsTable";
import { aggregate } from "../metrics/data";
import { storeLabOutcome } from "../metrics/client";
import "./dev.css";
export default function DevLab({ onExit }: { onExit: () => void }) {
  const game = useGame();
  const [page, setPage] = useState("home"),
    [setup, setSetup] = useState<LabSetup>(defaultSetup),
    [lab, setLab] = useState<LabController | null>(null);
  const [revision, refresh] = useState(0),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [overlay, setOverlay] = useState<string | null>(null),
    [actor, setActor] = useState<Seat>(0),
    [slot, setSlot] = useState(0);
  const [hidden, setHidden] = useState(false),
    [inspectTaps, setInspectTaps] = useState(false),
    [snapshot, setSnapshot] = useState<LabSnapshot | null>(loadSnapshot),
    [importText, setImportText] = useState(""),
    [scenarioName, setScenarioName] = useState("Reproduction");
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultIds = useRef(new Map<string, string>());
  const [savingResult, setSavingResult] = useState(false);
  const run = (fn: () => void) => {
    try {
      fn();
      setError("");
      refresh((v) => v + 1);
    } catch (e) {
      const text = (e as Error).message;
      setError(text);
      lab?.log("VALIDATION_ERROR", text, true);
      refresh((v) => v + 1);
    }
  };
  const open = (panel: string) => {
    setOverlay(panel);
    if (lab) lab.paused = true;
  };
  const close = () => {
    setOverlay(null);
    if (lab) lab.paused = false;
    setError("");
  };
  const start = (session: LabController) => {
    session.paused = false;
    setLab(session);
    setPage("battle");
    setOverlay(null);
    setHidden(false);
    setError("");
  };
  useEffect(() => {
    if (!lab) return;
    const timer = setInterval(() => {
      const rev = lab.state.revision;
      lab.tick(Date.now());
      if (rev !== lab.state.revision) refresh((v) => v + 1);
    }, 100);
    return () => clearInterval(timer);
  }, [lab]);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape" && hidden) setHidden(false);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [hidden]);
  const adapter = useMemo(() => lab?.adapter(), [lab, lab?.options.view]);
  const context = {
    ...game,
    update: () => {},
    profile: {
      ...game.profile,
      settings: {
        ...game.profile.settings,
        haptics: lab?.options.haptics ?? false,
        reducedMotion: lab?.options.animation === "instant",
        batterySaver: lab
          ? !lab.options.particles
          : game.profile.settings.batterySaver,
      },
    },
    toast: (m: string) => {
      setMessage(m);
      setTimeout(() => setMessage(""), 3000);
    },
  };
  const selectInspector = (panel: string, side: Seat, index = 0) => {
    setActor((lab?.options.view === "B" ? 1 - side : side) as Seat);
    setSlot(index);
    open(panel);
  };
  const snapshots = (
    <div className="dev-stack">
      <h3>Snapshot / reproduction</h3>
      <div className="dev-actions">
        <Button
          onClick={() =>
            run(() => {
              if (!lab) throw new Error("Start a match first.");
              const saved = lab.snapshot();
              persistSnapshot(saved);
              setSnapshot(saved);
              setMessage("Exact snapshot saved on this device.");
            })
          }
        >
          Save snapshot
        </Button>
        <Button
          disabled={!snapshot}
          onClick={() =>
            run(() => {
              const next = LabController.restore(snapshot!);
              next.paused = true;
              setLab(next);
            })
          }
        >
          Restore snapshot
        </Button>
      </div>
      <Field label="Scenario name">
        <input
          value={scenarioName}
          onChange={(e) => setScenarioName(e.target.value)}
        />
      </Field>
      <Button
        onClick={() =>
          run(() => {
            if (!lab) throw new Error("Start a match first.");
            saveScenario(scenarioName, lab.snapshot());
            setMessage("Scenario saved locally.");
          })
        }
      >
        Save current state as scenario
      </Button>
      {lab && (
        <>
          <div className="dev-actions">
            <Button
              onClick={() => {
                copyText(JSON.stringify(lab.report(), null, 2))
                  .then(() => setMessage("Match report copied."))
                  .catch((e) => setError(e.message));
              }}
            >
              Copy match report
            </Button>
            <Button
              onClick={() =>
                downloadJSON(
                  `fatebound-lab-${lab.state.seed}.json`,
                  lab.report(),
                )
              }
            >
              Export report
            </Button>
            <Button
              onClick={() =>
                downloadJSON("fatebound-snapshot.json", lab.snapshot())
              }
            >
              Export snapshot
            </Button>
            <Button
              onClick={() => {
                copyText(String(lab.state.seed))
                  .then(() => setMessage("Seed copied."))
                  .catch((e) => setError(e.message));
              }}
            >
              Copy seed
            </Button>
          </div>
          <NumberField
            label="Restart using seed"
            value={setup.seed}
            max={0xffffffff}
            onChange={(v) => setSetup({ ...setup, seed: v })}
          />
          <Button
            onClick={() =>
              run(() => {
                if (lab.resolving) lab.rewind();
                lab.restart(setup.seed);
              })
            }
          >
            Restart from seed
          </Button>
        </>
      )}
      <Field label="Import match state or report JSON">
        <textarea
          rows={6}
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste a Dev Lab snapshot or report"
        />
      </Field>
      <Button
        onClick={() =>
          run(() => {
            const next = importSnapshot(importText);
            next.paused = true;
            setLab(next);
            setPage("battle");
            setMessage("Snapshot imported.");
          })
        }
      >
        Import match state
      </Button>
      {savedScenarios().map((s) => (
        <Button
          key={s.id}
          onClick={() => run(() => start(LabController.restore(s.snapshot)))}
        >
          Restore {s.name} · {s.savedAt.slice(0, 16)}
        </Button>
      ))}
    </div>
  );
  const tabs = [
    "STATE",
    "FATE",
    "DICE",
    "CARDS",
    "HP",
    "STATUS",
    "PHASE",
    "AI",
    "LOG",
    "SNAPSHOT",
    "EXIT",
  ];
  return (
    <AppContext.Provider value={context}>
      <div
        className={`dev-root ${page === "battle" ? "dev-in-battle" : ""} ${lab?.options.animation === "instant" ? "reduced-motion" : ""} ${lab && !lab.options.particles ? "battery-saver" : ""} ${lab && !lab.options.camera ? "no-camera" : ""}`}
        style={
          lab
            ? ({
                "--lab-animation":
                  lab.options.animation === "4x"
                    ? "0.25"
                    : lab.options.animation === "2x"
                      ? "0.5"
                      : lab.options.animation === "instant"
                        ? "0"
                        : "1",
              } as React.CSSProperties)
            : undefined
        }
      >
        {page !== "battle" && (
          <header className="dev-header">
            <button
              onClick={() => (page === "home" ? onExit() : setPage("home"))}
              aria-label={
                page === "home" ? "Exit Dev Lab" : "Dev Lab dashboard"
              }
            >
              <Icon name="left" />
            </button>
            <div>
              <b>DEV LAB</b>
              <small>INTERNAL · PRODUCTION ENGINE</small>
            </div>
            <a href="/metrics" target="_blank" rel="noreferrer">
              Metrics ↗
            </a>
          </header>
        )}
        {error && page !== "battle" && (
          <p className="dev-error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <div className="dev-toast" role="status">
            {message}
          </div>
        )}
        {page === "home" ? (
          <div className="dev-scroll">
            <h1>
              Build a situation.
              <br />
              Inspect the consequence.
            </h1>
            <div className="dev-dashboard">
              {[
                [
                  "setup",
                  "Battle Lab",
                  "Set both hands, faces, HP and phases",
                  "attack",
                ],
                [
                  "content",
                  "Content browser",
                  "72 cards · six Legends",
                  "book",
                ],
                [
                  "dice",
                  "Dice Lab",
                  "Ordered faces and shared-position comparison",
                  "dice",
                ],
                [
                  "ai",
                  "AI Lab",
                  "Choices, alternatives and score components",
                  "target",
                ],
                [
                  "simulation",
                  "Simulation",
                  "Run paired-seat matchups",
                  "play",
                ],
                [
                  "logs",
                  "Match logs",
                  "Effects, conditions and before / after",
                  "scroll",
                ],
                [
                  "balance",
                  "Balance stats",
                  "Cards, dice, matchups and live usage",
                  "trophy",
                ],
              ].map(([id, title, desc, icon]) => (
                <button
                  key={id}
                  onClick={() => {
                    setPage(id);
                    if (id === "ai" && !lab)
                      setLab(new LabController(defaultSetup()));
                  }}
                >
                  <Icon name={icon} size={24} />
                  <span>
                    <strong>{title}</strong>
                    <small>{desc}</small>
                  </span>
                  <Icon name="right" size={16} />
                </button>
              ))}
            </div>
            {lab && (
              <Button
                primary
                onClick={() => {
                  lab.paused = false;
                  setPage("battle");
                }}
              >
                Resume lab match · Round {lab.state.round}
              </Button>
            )}
            <h2>One-tap scenarios</h2>
            <div className="dev-scenarios">
              {SCENARIOS.map((s) => (
                <button key={s.id} onClick={() => run(() => start(s.build()))}>
                  <strong>{s.name}</strong>
                  <small>{s.description}</small>
                </button>
              ))}
            </div>
            <Section title="Saved scenarios / import">{snapshots}</Section>
          </div>
        ) : page === "setup" ? (
          <div className="dev-scroll">
            <Setup
              setup={setup}
              setSetup={setSetup}
              run={run}
              start={() => run(() => start(new LabController(setup)))}
            />
          </div>
        ) : page === "content" ? (
          <div className="dev-scroll">
            <ContentBrowser />
          </div>
        ) : page === "dice" ? (
          <div className="dev-scroll">
            <DiceLab />
          </div>
        ) : page === "simulation" ? (
          <div className="dev-scroll">
            <SimulationPanel
              initialLoadouts={
                setup.players.map((p) => p.loadout) as [
                  (typeof setup.players)[0]["loadout"],
                  (typeof setup.players)[0]["loadout"],
                ]
              }
            />
          </div>
        ) : page === "ai" && lab ? (
          <div className="dev-scroll">
            <Field label="AI seat">
              <select
                value={actor}
                onChange={(e) => setActor(+e.target.value as Seat)}
              >
                <option value="0">Player A</option>
                <option value="1">Player B</option>
              </select>
            </Field>
            <AIPanel lab={lab} actor={actor} run={run} />
            <Button
              onClick={() => {
                lab.paused = false;
                setPage("battle");
              }}
            >
              Enter battlefield
            </Button>
          </div>
        ) : page === "logs" ? (
          <div className="dev-scroll">
            {lab ? (
              <EffectLog lab={lab} />
            ) : (
              <p>Start a lab match to generate production resolution logs.</p>
            )}
          </div>
        ) : page === "balance" ? (
          <div className="dev-scroll">
            <a
              className="dev-button"
              href="/metrics"
              target="_blank"
              rel="noreferrer"
            >
              Open desktop / mobile metrics dashboard ↗
            </a>
            {lab && lab.state.winner !== null ? (
              <>
                <p>
                  Outcome:{" "}
                  {lab.state.winner === "draw"
                    ? "Draw"
                    : `Player ${lab.state.winner === 0 ? "A" : "B"} wins`}{" "}
                  · Round {lab.state.round}
                </p>
                <Button
                  disabled={savingResult}
                  onClick={() => {
                    setSavingResult(true);
                    const record = recordMatch(
                      lab.state,
                      "lab",
                      "Internal",
                      null,
                      lab.setup.players.map((p) => (p.ai ? "ai" : "human")) as [
                        "human" | "ai",
                        "human" | "ai",
                      ],
                    );
                    const fingerprint = JSON.stringify([
                      lab.state.seed,
                      lab.state.players,
                      lab.state.stats,
                      lab.state.winner,
                    ]);
                    if (!resultIds.current.has(fingerprint))
                      resultIds.current.set(fingerprint, crypto.randomUUID());
                    record.id = resultIds.current.get(fingerprint)!;
                    storeLabOutcome(record)
                      .then(() =>
                        setMessage(
                          "Lab outcome saved to the separate lab dataset.",
                        ),
                      )
                      .catch((e) => setError(e.message))
                      .finally(() => setSavingResult(false));
                  }}
                >
                  {savingResult ? "Saving…" : "Save outcome to dashboard"}
                </Button>
                <MetricsTable
                  data={aggregate([
                    recordMatch(
                      lab.state,
                      "lab",
                      "Internal",
                      null,
                      lab.setup.players.map((p) => (p.ai ? "ai" : "human")) as [
                        "human" | "ai",
                        "human" | "ai",
                      ],
                    ),
                  ])}
                />
              </>
            ) : (
              <p>
                Finish a lab match or run a simulation to review metrics. Actual
                play is tracked separately in the dashboard.
              </p>
            )}
          </div>
        ) : page === "battle" && lab && adapter ? (
          <>
            <div
              className="dev-battle-surface"
              onPointerDown={(e) => {
                if (
                  hidden &&
                  e.clientY - e.currentTarget.getBoundingClientRect().top < 55
                )
                  hold.current = setTimeout(() => setHidden(false), 1100);
              }}
              onPointerUp={() => {
                if (hold.current) clearTimeout(hold.current);
              }}
              onPointerCancel={() => {
                if (hold.current) clearTimeout(hold.current);
              }}
            >
              <Battle
                service={adapter}
                onEnd={() => {}}
                onExit={() => {
                  setPage("home");
                  lab.paused = true;
                }}
                presentation={{
                  manualAdvance: true,
                  viewOnly: lab.options.view === "Spectator",
                  syncKey: lab.epoch,
                  draft: lab.drafts[lab.actor],
                  maxRounds: lab.setup.maxRounds,
                  onDraft: (p) => {
                    if (!lab.state.players[lab.actor].locked)
                      lab.drafts[lab.actor] = structuredClone(p);
                  },
                  names:
                    lab.options.view === "B"
                      ? ["Player B", "Player A"]
                      : ["Player A", "Player B"],
                  ranks:
                    lab.options.view === "B"
                      ? [lab.setup.players[1].rank, lab.setup.players[0].rank]
                      : [lab.setup.players[0].rank, lab.setup.players[1].rank],
                  inspectDie:
                    inspectTaps && !hidden
                      ? (side, i) => selectInspector("DICE", side, i)
                      : undefined,
                  inspectCard:
                    inspectTaps && !hidden
                      ? (side, i) => selectInspector("CARDS", side, i)
                      : undefined,
                  inspectLegend:
                    inspectTaps && !hidden
                      ? (side) => selectInspector("HP", side)
                      : undefined,
                }}
              />
              {!hidden && lab.options.debugLabels && (
                <pre className="dev-debug-labels">
                  {lab.state.players
                    .map(
                      (p, a) =>
                        `${a ? "B" : "A"} ${p.loadout.legend}\n${p.loadout.dice.map((id, i) => `${id}[${p.faces[i]}]→${(p.plan ?? lab.drafts[a]).assignments.find((t) => t.dice.includes(i))?.target ?? "none"}`).join("\n")}\n${p.loadout.cards.map((id) => `${id} P${cardById[id].priority}: ${cardById[id].effects.map((e) => e.type).join(",")}`).join("\n")}\n${p.statuses.map((s) => `${s.id}:${s.amount}`).join(" ")}`,
                    )
                    .join("\n")}
                </pre>
              )}
            </div>
            {!hidden && (
              <>
                <button className="dev-fab" onClick={() => open("STATE")}>
                  DEV
                </button>
                <div className="dev-phase-bar">
                  <span>
                    R{lab.state.round} · {lab.state.phase}
                    {lab.resolving ? " ⏸" : ""}
                  </span>
                  {lab.state.phase === "MATCH_END" ? (
                    <button onClick={() => setPage("balance")}>
                      Review results
                    </button>
                  ) : (
                    <>
                      <button onClick={() => run(() => lab.next())}>
                        Next phase
                      </button>
                      <button onClick={() => run(() => lab.nextEffect())}>
                        Next effect
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
            {error && !overlay && (
              <button
                className="dev-error-float"
                onClick={() => open("STATE")}
                role="alert"
              >
                {error}
              </button>
            )}
            {overlay && (
              <Modal
                title={`Dev · ${overlay.toLowerCase()}`}
                eyebrow={`PAUSED · SEED ${lab.state.seed}`}
                onClose={close}
              >
                <div className="dev-overlay">
                  <nav className="dev-tabs">
                    {tabs.map((t) => (
                      <button
                        key={t}
                        className={t === overlay ? "active" : ""}
                        onClick={() => setOverlay(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </nav>
                  {error && (
                    <p className="dev-error" role="alert">
                      {error}
                    </p>
                  )}
                  {["DICE", "CARDS", "HP", "STATUS", "AI", "STATE"].includes(
                    overlay,
                  ) && (
                    <div className="dev-grid2">
                      <Field label="Edit player">
                        <select
                          value={actor}
                          onChange={(e) => setActor(+e.target.value as Seat)}
                        >
                          <option value="0">Player A</option>
                          <option value="1">Player B</option>
                        </select>
                      </Field>
                      {["DICE", "CARDS"].includes(overlay) && (
                        <Field label="Inspect slot">
                          <select
                            value={slot}
                            onChange={(e) => setSlot(+e.target.value)}
                          >
                            {(overlay === "DICE"
                              ? lab.state.players[actor].loadout.dice
                              : lab.state.players[actor].loadout.cards
                            ).map((id, i) => (
                              <option key={i} value={i}>
                                {i + 1}.{" "}
                                {overlay === "DICE"
                                  ? dieById[id].name
                                  : cardById[id].name}
                              </option>
                            ))}
                          </select>
                        </Field>
                      )}
                    </div>
                  )}
                  {overlay === "STATE" ? (
                    <>
                      <Field label="Information view">
                        <select
                          value={lab.options.view}
                          onChange={(e) =>
                            run(() => {
                              lab.options.view = e.target.value as ViewMode;
                              lab.epoch++;
                            })
                          }
                        >
                          <option value="A">Normal Player A view</option>
                          <option value="B">Normal Player B view</option>
                          <option value="Spectator">Spectator view</option>
                          <option value="Omniscient">
                            Developer omniscient view
                          </option>
                        </select>
                      </Field>
                      <AssignmentEditor lab={lab} actor={actor} run={run} />
                      <Toggle
                        label="Inspect taps (tap cards / dice / Legends)"
                        value={inspectTaps}
                        onChange={setInspectTaps}
                      />
                      <Toggle
                        label="Show debug labels"
                        value={lab.options.debugLabels}
                        onChange={(v) =>
                          run(() => (lab.options.debugLabels = v))
                        }
                      />
                      <Field label="Animation speed">
                        <select
                          value={lab.options.animation}
                          onChange={(e) =>
                            run(
                              () =>
                                (lab.options.animation = e.target
                                  .value as typeof lab.options.animation),
                            )
                          }
                        >
                          {["normal", "2x", "4x", "instant", "step"].map(
                            (v) => (
                              <option key={v}>{v}</option>
                            ),
                          )}
                        </select>
                      </Field>
                      <Toggle
                        label="Particles"
                        value={lab.options.particles}
                        onChange={(v) => run(() => (lab.options.particles = v))}
                      />
                      <Toggle
                        label="Haptics"
                        value={lab.options.haptics}
                        onChange={(v) => run(() => (lab.options.haptics = v))}
                      />
                      <Toggle
                        label="Camera effects"
                        value={lab.options.camera}
                        onChange={(v) => run(() => (lab.options.camera = v))}
                      />
                      <Button
                        onClick={() => {
                          setHidden(true);
                          close();
                          setMessage(
                            "Dev UI hidden. Hold the battle header for 1 second or press Escape to restore.",
                          );
                        }}
                      >
                        Hide all Dev UI
                      </Button>
                      <Section title="Raw exact state">
                        <Json value={lab.state} />
                      </Section>
                    </>
                  ) : overlay === "FATE" ? (
                    <FateEditor lab={lab} run={run} />
                  ) : overlay === "DICE" ? (
                    <DieInspector
                      key={`${actor}:${Math.min(slot, 2)}`}
                      lab={lab}
                      actor={actor}
                      slot={Math.min(slot, 2)}
                      run={run}
                    />
                  ) : overlay === "CARDS" ? (
                    <CardInspector
                      key={`${actor}:${slot}`}
                      lab={lab}
                      actor={actor}
                      slot={slot}
                      run={run}
                    />
                  ) : overlay === "HP" || overlay === "STATUS" ? (
                    <LegendInspector
                      key={actor}
                      lab={lab}
                      actor={actor}
                      run={run}
                    />
                  ) : overlay === "PHASE" ? (
                    <PhaseControls lab={lab} run={run} />
                  ) : overlay === "AI" ? (
                    <AIPanel key={actor} lab={lab} actor={actor} run={run} />
                  ) : overlay === "LOG" ? (
                    <EffectLog lab={lab} />
                  ) : overlay === "SNAPSHOT" ? (
                    snapshots
                  ) : (
                    <div className="dev-stack">
                      <Button
                        onClick={() => {
                          close();
                          setPage("home");
                          lab.paused = true;
                        }}
                      >
                        Return to Dev Lab dashboard
                      </Button>
                      <Button onClick={onExit}>Exit Dev Lab</Button>
                      <p>No lab match grants player rewards.</p>
                    </div>
                  )}
                </div>
              </Modal>
            )}
          </>
        ) : (
          <div className="dev-scroll">
            <p>Select a tool from the dashboard.</p>
          </div>
        )}
        <span className="screen-reader-only">Lab revision {revision}</span>
      </div>
    </AppContext.Provider>
  );
}
