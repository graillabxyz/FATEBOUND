import { openingMetrics } from "./opening";
import type { MatchRecord } from "./data";
import { percent } from "./data";
export function OpeningMetrics({ records }: { records: MatchRecord[] }) {
  const data = openingMetrics(records),
    roles = ["A · Opening Initiative", "B · Second player"];
  const bonus: Record<number, { games: number; wins: number }> = {};
  for (const record of records)
    record.openingInitiative?.bonuses.forEach((n, seat) => {
      const row = (bonus[n] ??= { games: 0, wins: 0 });
      row.games++;
      row.wins += +(record.winner === seat);
    });
  return (
    <div className="opening-metrics">
      <p>
        A is the opening Initiative winner, regardless of storage seat. Turn
        order stays A → B. Opening choices use fixed equipped Omens.
      </p>
      <div className="metrics-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Opening role</th>
              <th>Win rate</th>
              <th>Turn 1 damage</th>
              <th>Turn 2 damage</th>
              <th>Held after Turn 1</th>
              <th>Opening Reactions</th>
            </tr>
          </thead>
          <tbody>
            {data.roles.map((r, i) => (
              <tr key={i}>
                <th>{roles[i]}</th>
                <td>
                  {percent(r.wins, r.games)} ({r.games} matches)
                </td>
                <td>
                  {r.turn1Samples
                    ? (r.turn1Damage / r.turn1Samples).toFixed(2)
                    : "—"}
                </td>
                <td>
                  {r.turn2Samples
                    ? (r.turn2Damage / r.turn2Samples).toFixed(2)
                    : "—"}
                </td>
                <td>
                  {r.turn1Samples ? (r.held / r.turn1Samples).toFixed(2) : "—"}
                </td>
                <td>
                  {r.reactions} ·{" "}
                  {data.openingTurnSamples
                    ? (r.reactions / data.openingTurnSamples).toFixed(2)
                    : "—"}
                  /turn
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="dev-muted">
        Win rates include draws in the denominator. Damage is effective damage
        on that player’s own Turn. Opening Reactions cover global Turns 1–2.
        Averages use observed, completed Turns.
      </p>
      <p>
        Life difference when both have rolled their first full 3-Omen turn:{" "}
        <strong>
          {data.averageLifeDifferential === null
            ? "—"
            : data.averageLifeDifferential.toFixed(2)}
        </strong>{" "}
        (A − B; {data.fullTurnSamples} matches reached this point).
      </p>
      <details>
        <summary>Opening Omen combinations and win rates</summary>
        <div className="metrics-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Role / Loadout Legend / Omens</th>
                <th>Matches</th>
                <th>Win rate</th>
                <th>Draws</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.choices)
                .sort((a, b) => b[1].games - a[1].games)
                .map(([key, c]) => (
                  <tr key={key}>
                    <td>
                      {c.role === 0 ? "A" : "B"} · {c.name}
                    </td>
                    <td>{c.games}</td>
                    <td>{percent(c.wins, c.games)}</td>
                    <td>{c.draws}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
      <details>
        <summary>Win rate by Legend Initiative Bonus</summary>
        <div className="metrics-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Bonus</th>
                <th>Matches</th>
                <th>Win rate</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(bonus).map(([n, r]) => (
                <tr key={n}>
                  <th>+{n}</th>
                  <td>{r.games}</td>
                  <td>{percent(r.wins, r.games)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
