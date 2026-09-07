import CampaignPanel from "./CampaignPanel";
import CardPoolPanel from "./CardPoolPanel";
import { cardCompatible } from "../content/affinities";
import { useEffect, useRef, useState } from "react";
import type { Loadout, LegendId } from "../engine/types";
import { LEGENDS, legendById } from "../content/legends";
import { CARDS } from "../content/cards";
import { OMENS } from "../content/omens";
import { STARTERS } from "../content/loadouts";
import { validateLoadout } from "../engine/rules";
import type { MatchRecord } from "./data";
import { aggregate } from "./data";
import { Button, Field, NumberField, Section, Toggle } from "../dev/controls";
import { MetricsTable } from "./MetricsTable";
import { downloadJSON } from "../dev/storage";
import { storeSimulation } from "./client";
export default function SimulationPanel({
  initialLoadouts,
  onSaved,
}: {
  initialLoadouts?: [Loadout, Loadout];
  onSaved?: () => void;
}) {
  const [loadouts, setLoadouts] = useState<[Loadout, Loadout]>(
    initialLoadouts ?? [STARTERS.basajaun, STARTERS.anansi],
  );
  const [count, setCount] = useState(100),
    [difficulty, setDifficulty] = useState("Normal"),
    [seed, setSeed] = useState(12000),
    [paired, setPaired] = useState(true),
    [progress, setProgress] = useState(0),
    [running, setRunning] = useState(false),
    [records, setRecords] = useState<MatchRecord[]>([]),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false),
    [saved, setSaved] = useState(false);
  const worker = useRef<Worker | null>(null),
    runId = useRef("");
  useEffect(() => () => worker.current?.terminate(), []);
  const updateLoadout = (seat: number, loadout: Loadout) =>
    setLoadouts(
      (current) =>
        current.map((l, i) => (i === seat ? loadout : l)) as [Loadout, Loadout],
    );
  let invalid = "";
  try {
    loadouts.forEach((l) => validateLoadout(l));
  } catch (e) {
    invalid = (e as Error).message;
  }
  const start = () => {
    try {
      loadouts.forEach((l) => validateLoadout(l));
      if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
        throw new Error("Seed must be a whole number from 0 to 4294967295.");
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    worker.current?.terminate();
    setError("");
    setRecords([]);
    setProgress(0);
    setRunning(true);
    setSaved(false);
    runId.current = crypto.randomUUID();
    const w = new Worker(
      new URL("../dev/simulation.worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.current = w;
    w.onmessage = (e) => {
      if (e.data.type === "progress") setProgress(e.data.done);
      else if (e.data.type === "complete") {
        setRecords(e.data.records);
        setRunning(false);
        w.terminate();
      } else {
        setError(e.data.message);
        setRunning(false);
        w.terminate();
      }
    };
    w.onerror = (e) => {
      setError(e.message);
      setRunning(false);
      w.terminate();
    };
    w.postMessage({ loadouts, games: count, difficulty, seed, paired });
  };
  return (
    <div className="dev-stack">
      <h2>Run a matchup</h2>
      <CampaignPanel />
      <CardPoolPanel />
      <fieldset disabled={running || saving} className="simulation-config">
        <div className="dev-grid2">
          {loadouts.map((l, a) => (
            <Field key={a} label={`Legend ${a === 0 ? "A" : "B"}`}>
              <select
                value={l.legend}
                onChange={(e) =>
                  updateLoadout(
                    a,
                    structuredClone(STARTERS[e.target.value as LegendId]),
                  )
                }
              >
                {LEGENDS.map((l) => (
                  <option value={l.id} key={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Field>
          ))}
        </div>
        <Section title="Customize both loadouts">
          <div className="dev-grid2">
            {loadouts.map((l, a) => (
              <div className="dev-stack" key={a}>
                <strong>Player {a === 0 ? "A" : "B"}</strong>
                {l.cards.map((id, i) => (
                  <Field key={`card-${i}`} label={`Card ${i + 1}`}>
                    <select
                      value={id}
                      onChange={(e) =>
                        updateLoadout(a, {
                          ...l,
                          name: `Custom ${l.legend}`,
                          cards: l.cards.map((c, j) =>
                            j === i ? e.target.value : c,
                          ),
                        })
                      }
                    >
                      {CARDS.filter((c) =>
                        cardCompatible(legendById[l.legend], c),
                      ).map((c) => (
                        <option
                          key={c.id}
                          value={c.id}
                          disabled={c.id !== id && l.cards.includes(c.id)}
                        >
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                ))}
                {l.dice.map((id, i) => (
                  <Field key={`die-${i}`} label={`Collectible Omen ${i + 1}`}>
                    <select
                      value={id}
                      onChange={(e) =>
                        updateLoadout(a, {
                          ...l,
                          name: `Custom ${l.legend}`,
                          dice: l.dice.map((d, j) =>
                            j === i ? e.target.value : d,
                          ),
                        })
                      }
                    >
                      {OMENS.filter(
                        (d) =>
                          legendById[l.legend].allowedDiceSizes.includes(
                            d.size,
                          ) &&
                          (d.compatibleLegendTags.includes("all") ||
                            d.compatibleLegendTags.some((t) =>
                              legendById[l.legend].tags.includes(t),
                            )),
                      ).map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                ))}
                <Button
                  onClick={() =>
                    updateLoadout(a, structuredClone(STARTERS[l.legend]))
                  }
                >
                  Use default loadout
                </Button>
              </div>
            ))}
          </div>
        </Section>
        {invalid && (
          <p role="alert" className="dev-error">
            {invalid}
          </p>
        )}
        <div className="dev-grid3">
          <Field label="Matches">
            <select value={count} onChange={(e) => setCount(+e.target.value)}>
              {[10, 100, 1000, 10000].map((n) => (
                <option key={n} value={n}>
                  {n.toLocaleString()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="AI difficulty">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option>Training</option>
              <option>Normal</option>
            </select>
          </Field>
          <NumberField
            label="Seed"
            max={0xffffffff}
            value={seed}
            onChange={setSeed}
          />
        </div>
        <Toggle
          label="Pair seeds and reverse seats"
          value={paired}
          onChange={setPaired}
        />
        <div className="dev-actions">
          <Button primary disabled={!!invalid} onClick={start}>
            Run simulation
          </Button>
          <Button
            onClick={() =>
              setLoadouts([loadouts[0], structuredClone(loadouts[0])])
            }
          >
            Mirror test
          </Button>
        </div>
      </fieldset>
      {running && (
        <>
          <div role="status">
            <progress max={count} value={progress} />
            <p>
              {progress.toLocaleString()} / {count.toLocaleString()} ·
              production engine, background worker
            </p>
          </div>
          <Button
            onClick={() => {
              worker.current?.terminate();
              setRunning(false);
              setError(
                `Stopped after ${progress} matches. Run again to collect a complete batch.`,
              );
            }}
          >
            Cancel
          </Button>
        </>
      )}
      {error && (
        <p role="alert" className="dev-error">
          {error}
        </p>
      )}
      {records.length > 0 && (
        <>
          <h3>
            Results · {legendById[records[0].loadouts[0].legend].name} vs{" "}
            {legendById[records[0].loadouts[1].legend].name}
          </h3>
          <p className="dev-muted">
            {records.length.toLocaleString()} matches · {records[0].mode} AI ·
            starting seed {records[0].seed}. Changing the setup above does not
            change these completed results.
          </p>
          <div className="dev-actions">
            <Button
              onClick={() =>
                downloadJSON("omnipath-simulation.json", {
                  records,
                  metrics: aggregate(records),
                })
              }
            >
              Export results
            </Button>
            <Button
              disabled={saving || saved}
              onClick={() => {
                setSaving(true);
                storeSimulation(records, runId.current)
                  .then(() => {
                    setSaved(true);
                    onSaved?.();
                  })
                  .catch((e) => setError(e.message))
                  .finally(() => setSaving(false));
              }}
            >
              {saved
                ? "Saved to dashboard"
                : saving
                  ? "Saving…"
                  : "Save run to dashboard"}
            </Button>
          </div>
          <MetricsTable data={aggregate(records)} />
        </>
      )}
    </div>
  );
}
