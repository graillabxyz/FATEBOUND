import { useRef, useEffect, useState } from "react";
import type { HandAuditReport } from "../dev/affinity-balance";
import { CARDS, cardsFor } from "../content/cards";
import { LEGENDS } from "../content/legends";
import { AFFINITIES, affinityIds } from "../content/affinities";
import { Button, Field, Section } from "../dev/controls";
import { downloadJSON } from "../dev/storage";
export default function CardPoolPanel() {
  const [report, setReport] = useState<HandAuditReport | null>(null),
    [progress, setProgress] = useState(""),
    [running, setRunning] = useState(false),
    [pairs, setPairs] = useState(2),
    [seed, setSeed] = useState(24000),
    [error, setError] = useState("");
  const worker = useRef<Worker | null>(null);
  useEffect(() => () => worker.current?.terminate(), []);
  const run = () => {
    worker.current?.terminate();
    setRunning(true);
    setReport(null);
    setError("");
    setProgress("Evaluating all legal pairs and enumerating four-Card Hands…");
    const w = new Worker(
      new URL("../dev/affinity-balance.worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.current = w;
    w.onmessage = (e) => {
      if (e.data.type === "progress")
        setProgress(`${e.data.done}/${e.data.total} Hand/Omen cohorts`);
      if (e.data.type === "complete") {
        setReport(e.data.report);
        setRunning(false);
        w.terminate();
      }
      if (e.data.type === "error") {
        setError(e.data.message);
        setRunning(false);
        w.terminate();
      }
    };
    w.onerror = () => {
      setError("Audit worker failed. Reduce paired seeds and retry.");
      setRunning(false);
      w.terminate();
    };
    w.postMessage({ seed, pairs });
  };
  return (
    <Section title="Shared Card pool · Affinity and Hand audit">
      <p>
        Every legal Legend/Card pair is evaluated. Every four-Card combination
        is enumerated for ranking; sampled complete Hands use the production AI
        and match engine. No rarity power multiplier.
      </p>
      <div className="dev-row">
        {LEGENDS.map((l) => (
          <span key={l.id}>
            {l.name}: {cardsFor(l.id).length} legal
          </span>
        ))}
      </div>
      <p>
        {AFFINITIES.map(
          (a) =>
            `${a.name} ${CARDS.filter((c) => affinityIds(c.affinityRequirements).includes(a.id)).length}`,
        ).join(" · ")}{" "}
        · Unbound {CARDS.filter((c) => !c.affinityRequirements).length}
      </p>
      <div className="dev-row">
        <Field label="Paired seeds per Hand (1–10)">
          <input
            type="number"
            min={1}
            max={10}
            value={pairs}
            onChange={(e) => setPairs(+e.target.value)}
          />
        </Field>
        <Field label="Audit seed">
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(+e.target.value)}
          />
        </Field>
        <Button disabled={running} onClick={run}>
          Run Card pool audit
        </Button>
        {running && (
          <Button
            onClick={() => {
              worker.current?.terminate();
              setRunning(false);
              setProgress("Canceled");
            }}
          >
            Cancel
          </Button>
        )}
      </div>
      <p role="status">{progress}</p>
      {error && <p role="alert">{error}</p>}
      {report && (
        <>
          <p>
            {report.games} AI matches · {report.evaluation.length} legal
            Legend/Card pairs · {report.mismatches} paired mismatches
          </p>
          <p>
            Starter kits: Basajaun {report.starter.basajaunWins}/
            {report.starter.games}, Anansi {report.starter.anansiWins}/
            {report.starter.games}, ties {report.starter.draws}.
          </p>
          <Button
            onClick={() =>
              downloadJSON("omnipath-card-pool-audit.json", report)
            }
          >
            Export full Card/Hand report
          </Button>
          <p className="dev-warning">{report.method}</p>
          <details>
            <summary>Balance flags ({report.flags.length})</summary>
            {report.flags.map((f) => (
              <p key={f}>{f}</p>
            ))}
          </details>
          <details>
            <summary>Strongest sampled Hands</summary>
            {[...report.hands]
              .sort((a, b) => b.winRate - a.winRate)
              .slice(0, 20)
              .map((h, i) => (
                <p key={i}>
                  {h.legend} · {(h.winRate * 100).toFixed(0)}% over {h.games}{" "}
                  games ·{" "}
                  {h.cards
                    .map((id) => CARDS.find((c) => c.id === id)?.name)
                    .join(" / ")}{" "}
                  · {h.dice.join(" / ")}
                </p>
              ))}
          </details>
          <details>
            <summary>Per-Card use and availability</summary>
            {CARDS.map((c) => (
              <p key={c.id}>
                {c.name}: {report.usage[c.id].uses} activations /{" "}
                {report.usage[c.id].games} equipped games ·{" "}
                {report.usage[c.id].strongHands} strong sampled Hands
              </p>
            ))}
          </details>
        </>
      )}
    </Section>
  );
}
