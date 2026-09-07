import { useState } from "react";
import { LEGENDS } from "../content/legends";
import { cardById } from "../content/cards";
import { dieById } from "../content/dice";
import { aggregate, average, percent } from "./data";
import { Field, Section } from "../dev/controls";
export function MetricsTable({
  data,
  initialTab = "Legends",
}: {
  data: ReturnType<typeof aggregate>;
  initialTab?: string;
}) {
  const [tab, setTab] = useState(initialTab),
    [sort, setSort] = useState("popularity"),
    [minimum, setMinimum] = useState(1);
  const top = (r: Record<string, number>) =>
    Object.entries(r).sort((a, b) => b[1] - a[1])[0]?.[0];
  return (
    <div className="dev-stack">
      <div className="dev-grid2">
        <div className="dev-stat">
          <small>Matches</small>
          <strong>{data.games.toLocaleString()}</strong>
        </div>
        <div className="dev-stat">
          <small>Mean rounds</small>
          <strong>{data.averageRounds.toFixed(2)}</strong>
        </div>
        <div className="dev-stat">
          <small>A / B / draws</small>
          <strong>
            {data.seatWins[0]} / {data.seatWins[1]} / {data.draws}
          </strong>
        </div>
        <div className="dev-stat">
          <small>Paired-seat mismatches</small>
          <strong>
            {data.mismatches} / {data.paired}
          </strong>
        </div>
      </div>
      {data.mismatches > 0 && (
        <p className="dev-error" role="alert">
          SEATING ASYMMETRY: {data.mismatches} reversed-seed pairs ended
          differently. Inspect the paired matches before trusting balance
          conclusions.
        </p>
      )}
      <div className="dev-tabs">
        {["Legends", "Cards", "Dice", "Matchups"].map((t) => (
          <button
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
            key={t}
          >
            {t}
          </button>
        ))}
      </div>
      {["Cards", "Dice"].includes(tab) && (
        <div className="dev-grid2">
          <Field label="Rank by">
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="popularity">Popularity / use count</option>
              <option value="success">Win rate when equipped</option>
            </select>
          </Field>
          <Field label="Minimum equipped matches">
            <input
              min={1}
              type="number"
              value={minimum}
              onChange={(e) => setMinimum(Math.max(1, +e.target.value))}
            />
          </Field>
        </div>
      )}
      <div className="dev-table-wrap">
        <table>
          {tab === "Legends" ? (
            <>
              <thead>
                <tr>
                  <th>Legend</th>
                  <th>Matches</th>
                  <th>Wins</th>
                  <th>Win rate</th>
                  <th>Rounds</th>
                  <th>Damage</th>
                  <th>Taken</th>
                  <th>Guard</th>
                  <th>Control</th>
                  <th>Known</th>
                  <th>Most used card</th>
                  <th>Most equipped die</th>
                </tr>
              </thead>
              <tbody>
                {LEGENDS.map((l) => {
                  const r = data.byLegend[l.id];
                  return (
                    <tr key={l.id}>
                      <th>{l.name}</th>
                      <td>{r?.games ?? 0}</td>
                      <td>{r?.wins ?? 0}</td>
                      <td>{r ? percent(r.wins, r.games) : "—"}</td>
                      <td>{r ? average(r.rounds, r.games) : "—"}</td>
                      <td>{r ? average(r.damage, r.games) : "—"}</td>
                      <td>{r ? average(r.taken, r.games) : "—"}</td>
                      <td>{r ? average(r.guard, r.games) : "—"}</td>
                      <td>{r ? average(r.control, r.games) : "—"}</td>
                      <td>{r ? average(r.revealed, r.games) : "—"}</td>
                      <td>{r ? (cardById[top(r.cards)]?.name ?? "—") : "—"}</td>
                      <td>{r ? (dieById[top(r.dice)]?.name ?? "—") : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </>
          ) : tab === "Cards" ? (
            <>
              <thead>
                <tr>
                  <th>Card</th>
                  <th>Equipped</th>
                  <th>Used</th>
                  <th>Assignments</th>
                  <th>Win / equipped</th>
                  <th>Win / used</th>
                  <th>First reveal</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.byCard)
                  .filter(([, r]) => r.equipped >= minimum)
                  .sort((a, b) =>
                    sort === "success"
                      ? b[1].equippedWins / b[1].equipped -
                        a[1].equippedWins / a[1].equipped
                      : b[1].uses - a[1].uses,
                  )
                  .map(([id, r]) => (
                    <tr key={id}>
                      <th>{cardById[id]?.name ?? id}</th>
                      <td>{r.equipped}</td>
                      <td>{r.usedMatches}</td>
                      <td>{r.uses}</td>
                      <td>{percent(r.equippedWins, r.equipped)}</td>
                      <td>{percent(r.usedWins, r.usedMatches)}</td>
                      <td>{average(r.firstRevealRound, r.reveals)}</td>
                    </tr>
                  ))}
              </tbody>
            </>
          ) : tab === "Dice" ? (
            <>
              <thead>
                <tr>
                  <th>Die</th>
                  <th>Equipped matches</th>
                  <th>Slots</th>
                  <th>Win rate</th>
                  <th>Control adjustments</th>
                  <th>Resolved face frequencies</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.byDie)
                  .filter(([, r]) => r.equipped >= minimum)
                  .sort((a, b) =>
                    sort === "success"
                      ? b[1].wins / b[1].equipped - a[1].wins / a[1].equipped
                      : b[1].equipped - a[1].equipped,
                  )
                  .map(([id, r]) => (
                    <tr key={id}>
                      <th>{dieById[id]?.name ?? id}</th>
                      <td>{r.equipped}</td>
                      <td>{r.slots}</td>
                      <td>{percent(r.wins, r.equipped)}</td>
                      <td>{r.controls}</td>
                      <td>
                        {Object.entries(r.faces)
                          .map(([f, n]) => `${+f.split(":").at(-1)! + 1}: ${n}`)
                          .join(" · ")}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </>
          ) : (
            <>
              <thead>
                <tr>
                  <th>Row vs column</th>
                  {LEGENDS.map((l) => (
                    <th key={l.id}>{l.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LEGENDS.map((a) => (
                  <tr key={a.id}>
                    <th>{a.name}</th>
                    {LEGENDS.map((b) => {
                      const m = data.matchups[`${a.id}:${b.id}`];
                      return (
                        <td
                          key={b.id}
                          style={
                            m
                              ? {
                                  background: `rgba(73,183,158,${0.05 + (0.3 * m.wins) / m.games})`,
                                }
                              : undefined
                          }
                        >
                          {m ? percent(m.wins, m.games) : "—"}
                          <small>n={m?.games ?? 0}</small>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </table>
      </div>
      <p className="dev-muted">
        Win rates include draws in the denominator. A card “used” means
        revealed/assigned, including fizzles. Success is correlation within its
        loadout and matchup, not proof of independent card strength.
        Damage/Guard/Control columns are per match.
      </p>
      <Section title="Lethal rounds and usage totals">
        <p>
          Damage {data.damage} · Guard {data.guard} · Control spent{" "}
          {data.control} · unused dice {data.unused}
        </p>
        <p>
          {Object.entries(data.lethalRounds)
            .map(([r, n]) => `Round ${r}: ${n}`)
            .join(" · ") || "No lethal outcomes yet."}
        </p>
        <p>
          Actual mean duration:{" "}
          {data.averageDurationMs === null
            ? "Not measured (simulations have no player thinking time)"
            : `${(data.averageDurationMs / 1000).toFixed(1)} seconds`}
        </p>
      </Section>
    </div>
  );
}
