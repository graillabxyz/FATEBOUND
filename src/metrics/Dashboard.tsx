import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../ui/components";
import { LEGENDS } from "../content/legends";
import { aggregate, percent } from "./data";
import type { MetricsResponse } from "./client";
import { loadMetrics, MetricsSignInRequiredError } from "./client";
import { registerMetricsTools } from "./webmcp";
import { MetricsTable } from "./MetricsTable";
import SimulationPanel from "./SimulationPanel";
import { Button, Field } from "../dev/controls";
import { downloadJSON } from "../dev/storage";
import "../dev/dev.css";
import "./metrics.css";
export default function Dashboard() {
  const [page, setPage] = useState("Overview"),
    [source, setSource] = useState("live"),
    [days, setDays] = useState(30),
    [actor, setActor] = useState<"all" | "human" | "ai">("human"),
    [legend, setLegend] = useState("all"),
    [opponent, setOpponent] = useState("all");
  const [response, setResponse] = useState<MetricsResponse | null>(null),
    [error, setError] = useState(""),
    [needsSignIn, setNeedsSignIn] = useState(false),
    [loading, setLoading] = useState(true);
  const requestId = useRef(0);
  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const r = await loadMetrics(source, days, legend, opponent);
      if (id === requestId.current) {
        setResponse(r);
        setError("");
        setNeedsSignIn(false);
      }
    } catch (e) {
      if (id === requestId.current) {
        setError((e as Error).message);
        setNeedsSignIn(e instanceof MetricsSignInRequiredError);
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [source, days, legend, opponent]);
  useEffect(() => {
    setLoading(true);
    setResponse(null);
    void refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 10000);
    return () => clearInterval(timer);
  }, [refresh]);
  useEffect(() => {
    document.title = "Fatebound · Developer metrics";
  }, []);
  const records = useMemo(
    () =>
      (response?.records ?? []).filter(
        (r) =>
          r.version === 2 &&
          r.loadouts.some(
            (l, a) =>
              (legend === "all" || l.legend === legend) &&
              (opponent === "all" || r.loadouts[1 - a].legend === opponent),
          ),
      ),
    [response, legend, opponent],
  );
  const data = useMemo(
    () => aggregate(records, source === "live" ? actor : "all"),
    [records, actor, source],
  );
  const totalWins = data.seatWins[0] + data.seatWins[1];
  useEffect(
    () =>
      registerMetricsTools(
        () => ({
          filters: { source, days, legend, opponent },
          response,
          metrics: data,
        }),
        async (f) => {
          const next = await loadMetrics(
            f.source,
            f.days,
            f.legend,
            f.opponent,
          );
          setSource(f.source);
          setDays(f.days);
          setLegend(f.legend);
          setOpponent(f.opponent);
          setResponse(next);
          return next;
        },
      ),
    [source, days, legend, opponent, response, data],
  );
  return (
    <div className="metrics-root dev-root">
      <aside className="metrics-sidebar">
        <a className="metrics-brand" href="/metrics">
          <Icon name="dice" size={30} />
          <span>
            FATEBOUND<small>DEVELOPER METRICS</small>
          </span>
        </a>
        <nav>
          {[
            ["Overview", "home"],
            ["Matchups", "attack"],
            ["Content performance", "loadout"],
            ["Simulation", "target"],
            ["Live activity", "sparkles"],
          ].map(([name, icon]) => (
            <button
              className={page === name ? "active" : ""}
              key={name}
              onClick={() => setPage(name)}
            >
              <Icon name={icon} size={19} />
              {name}
            </button>
          ))}
        </nav>
        <a className="metrics-lab-link" href="/game">
          Open game & Dev Lab <Icon name="right" size={17} />
        </a>
        <div className="metrics-private">
          <Icon name="lock" size={16} />
          <span>
            Internal workspace
            <br />
            <small>Private · no player access</small>
          </span>
        </div>
      </aside>
      <main className="metrics-main">
        <header className="metrics-heading">
          <div>
            <span className="metrics-eyebrow">INTERNAL ANALYTICS</span>
            <h1>{page === "Overview" ? "Match and content metrics" : page}</h1>
          </div>
          <span className={`metrics-live ${error ? "offline" : ""}`}>
            <i />
            {needsSignIn
              ? "Sign-in required"
              : error
                ? "Service offline"
                : loading
                  ? "Connecting"
                  : "Updates every 10s"}
          </span>
        </header>
        {page === "Simulation" ? (
          <section className="metrics-panel">
            <SimulationPanel onSaved={() => void refresh()} />
          </section>
        ) : (
          <>
            <div className="metrics-filters">
              <Field label="Data source">
                <select
                  value={source}
                  onChange={(e) => {
                    setSource(e.target.value);
                    setResponse(null);
                  }}
                >
                  <option value="live">Actual play · human vs AI</option>
                  <option value="simulation">AI simulations</option>
                  <option value="lab">Saved lab outcomes</option>
                </select>
              </Field>
              <Field label="Window">
                <select value={days} onChange={(e) => setDays(+e.target.value)}>
                  <option value={1}>Last 24 hours</option>
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                </select>
              </Field>
              <Field label="Legend">
                <select
                  value={legend}
                  onChange={(e) => setLegend(e.target.value)}
                >
                  <option value="all">All Legends</option>
                  {LEGENDS.map((l) => (
                    <option value={l.id} key={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Opponent">
                <select
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                >
                  <option value="all">All opponents</option>
                  {LEGENDS.map((l) => (
                    <option value={l.id} key={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </Field>
              {source === "live" && (
                <Field label="Content usage by">
                  <select
                    value={actor}
                    onChange={(e) => setActor(e.target.value as typeof actor)}
                  >
                    <option value="human">Human players</option>
                    <option value="ai">AI opponents</option>
                    <option value="all">Both sides</option>
                  </select>
                </Field>
              )}
              <Button onClick={() => void refresh()}>Refresh</Button>
            </div>
            {error && (
              <p role="alert" className="dev-error">
                {error} Simulation remains available offline.
                {needsSignIn && (
                  <>
                    {" "}
                    <a href="/signin-with-chatgpt" target="_top">
                      Sign in with ChatGPT
                    </a>
                  </>
                )}
              </p>
            )}
            <div className="metrics-kpis">
              {[
                [
                  "Completed matches",
                  data.games.toLocaleString(),
                  response?.hasMore
                    ? `Latest ${records.length.toLocaleString()} of ${response.total.toLocaleString()}`
                    : "Selected source and window",
                ],
                [
                  "Active sessions",
                  String(response?.activeSessions ?? 0),
                  "Seen in the last 15 minutes",
                ],
                [
                  "Mean match length",
                  data.averageDurationMs === null
                    ? "—"
                    : `${Math.round(data.averageDurationMs / 1000)}s`,
                  `${data.averageRounds.toFixed(2)} rounds on average`,
                ],
                [
                  "Draw rate",
                  percent(data.draws, data.games),
                  `${totalWins.toLocaleString()} decisive outcomes`,
                ],
              ].map(([label, value, sub]) => (
                <article key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <small>{sub}</small>
                </article>
              ))}
            </div>
            {page === "Overview" && (
              <section className="metrics-panel" style={{ marginBottom: 16 }}>
                <h2>Initiative & reaction balance</h2>
                <p
                  className={
                    data.initiativeSignificant ? "dev-warning" : "dev-muted"
                  }
                >
                  {data.initiativeSignificant
                    ? "Starting initiative deviates significantly from 50% in this sample."
                    : "No significant starting-initiative deviation detected in this sample."}{" "}
                  Wilson 95% interval; at least 30 independent decisive seeds
                  required. Paired seat reversals count once for uncertainty.
                </p>
                <div className="metrics-kpis">
                  {[
                    [
                      "Opening initiative wins",
                      percent(
                        data.initiativeWins[0],
                        data.initiativeWins[0] + data.initiativeWins[1],
                      ),
                      `${data.initiativeWins[0]} first / ${data.initiativeWins[1]} second`,
                    ],
                    [
                      "Held dice / turn",
                      (data.held / Math.max(1, data.turns)).toFixed(2),
                      `${data.held} dice held`,
                    ],
                    [
                      "Reaction frequency",
                      percent(data.reactions, data.reactionWindows),
                      `${data.reactions} / ${data.reactionWindows} windows`,
                    ],
                    [
                      "Reaction success",
                      percent(data.reactionSuccess, data.reactions),
                      "Resolved useful responses",
                    ],
                    [
                      "Unused expiration",
                      percent(data.expired, data.rolls),
                      `${data.expired} expired / ${data.rolls} rolled`,
                    ],
                    [
                      "95% opening interval",
                      data.initiativeGames
                        ? data.openingConfidence
                            .map((v) => (100 * v).toFixed(1) + "%")
                            .join("–")
                        : "—",
                      "Decisive matches only",
                    ],
                  ].map(([label, value, sub]) => (
                    <article key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                      <small>{sub}</small>
                    </article>
                  ))}
                </div>
                <div className="dev-grid2">
                  <div>
                    <h3>Class performance</h3>
                    {Object.entries(data.byClass).map(([id, r]) => (
                      <p key={id}>
                        {id}: {percent(r.wins, r.games)} · {r.games} appearances
                      </p>
                    ))}
                  </div>
                  <div>
                    <h3>Damage by round</h3>
                    {Object.entries(data.damageByRound).map(([id, r]) => (
                      <p key={id}>
                        Round {id}:{" "}
                        {(r.damage / Math.max(1, r.games)).toFixed(2)} damage /
                        match
                      </p>
                    ))}
                  </div>
                </div>
                <h3>Initiative bonus</h3>
                {Object.entries(data.byInitiativeBonus).map(([id, r]) => (
                  <p key={id}>
                    +{id}: opening {percent(r.openings, r.games)} · match wins{" "}
                    {percent(r.wins, r.games)} · {r.games} appearances
                  </p>
                ))}
              </section>
            )}
            {page === "Overview" && (
              <div className="metrics-overview-grid">
                <section className="metrics-panel">
                  <div className="metrics-panel-title">
                    <h2>Legend performance</h2>
                    <span>
                      {source === "live"
                        ? `${actor === "all" ? "Both seats" : actor === "human" ? "Human players" : "AI opponents"}`
                        : "Both seats"}{" "}
                      · win rate
                    </span>
                  </div>
                  {LEGENDS.map((l) => {
                    const r = data.byLegend[l.id];
                    return (
                      <div className="metrics-legend-row" key={l.id}>
                        <span>{l.name}</span>
                        <div>
                          <i
                            style={{
                              width: `${r?.games ? (100 * r.wins) / r.games : 0}%`,
                            }}
                          />
                        </div>
                        <b>{r ? percent(r.wins, r.games) : "—"}</b>
                        <small>{r?.games ?? 0} matches</small>
                      </div>
                    );
                  })}
                </section>
                <section className="metrics-panel">
                  <div className="metrics-panel-title">
                    <h2>Resolution fairness</h2>
                    <Icon name="guard" size={21} />
                  </div>
                  <div className="metrics-fairness">
                    <strong>{data.mismatches}</strong>
                    <p>mismatched reversed-seat pairs</p>
                  </div>
                  <p className="dev-muted">
                    {data.paired} complete paired seeds. Raw A/B wins alone do
                    not measure first-player advantage across different
                    loadouts.
                  </p>
                  <div className="metrics-seat">
                    <span>
                      A wins <b>{data.seatWins[0]}</b>
                    </span>
                    <span>
                      B wins <b>{data.seatWins[1]}</b>
                    </span>
                  </div>
                  <Button onClick={() => setPage("Simulation")}>
                    Run a mirror test
                  </Button>
                </section>
              </div>
            )}
            {page === "Live activity" ? (
              <section className="metrics-panel">
                <h2>Actual usage events</h2>
                <p className="dev-muted">
                  Counted from real interactions in connected internal game
                  sessions. Events and match summaries are client-reported;
                  authoritative multiplayer ingestion is not connected.
                </p>
                <div className="dev-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(response?.events ?? []).map((e) => (
                        <tr key={e.event}>
                          <th>{e.event.replaceAll("_", " ")}</th>
                          <td>{e.count.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!response?.events.length && (
                  <p className="metrics-empty">
                    No usage events in this window. Open the game and play a
                    match to begin collecting activity.
                  </p>
                )}
              </section>
            ) : (
              <section className="metrics-panel">
                <div className="metrics-panel-title">
                  <h2>
                    {page === "Matchups"
                      ? "Matchup and outcome explorer"
                      : "Content and outcome metrics"}
                  </h2>
                  <Button
                    onClick={() =>
                      downloadJSON("fatebound-metrics.json", {
                        source,
                        days,
                        actor,
                        records,
                        metrics: data,
                      })
                    }
                  >
                    Export JSON
                  </Button>
                </div>
                {!records.length && (
                  <div className="metrics-empty">
                    <Icon name="dice" size={30} />
                    <strong>
                      {loading
                        ? "Loading metrics…"
                        : "No matches in this selection yet."}
                    </strong>
                    <p>
                      {source === "simulation"
                        ? "Run a matchup and save it to populate this dataset."
                        : "Actual play is collected when a connected game session completes a match. Lab and simulation results stay separate."}
                    </p>
                    <Button onClick={() => setPage("Simulation")}>
                      Run a simulation
                    </Button>
                  </div>
                )}
                <MetricsTable
                  key={page}
                  data={data}
                  initialTab={
                    page === "Matchups"
                      ? "Matchups"
                      : page === "Content performance"
                        ? "Cards"
                        : "Legends"
                  }
                />
              </section>
            )}
            <footer className="metrics-footnote">
              Mechanical version 2 · Updated{" "}
              {response
                ? new Date(response.updatedAt).toLocaleTimeString()
                : "—"}
              <span>
                Popularity ≠ power. Filter matchups and inspect sample sizes
                before balancing.
              </span>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
