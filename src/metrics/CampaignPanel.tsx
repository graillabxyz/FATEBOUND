import { cardById } from "../content/cards";
import { useState } from "react";
import results from "./campaign-results.json";
import { downloadJSON } from "../dev/storage";
import { Button, Section } from "../dev/controls";
export default function CampaignPanel() {
  const [selected, setSelected] = useState("release-starters");
  const p =
    results.passes.find((p) => p.label === selected) ?? results.passes[0];
  const pct = (n: number) => (n * 100).toFixed(1) + "%";
  const hands: Record<
    string,
    {
      legend: string;
      cards: string[];
      games: number;
      wins: number;
      draws: number;
    }
  > = {};
  for (const row of p.rows)
    if ("byHand" in row)
      for (const [hand, value] of Object.entries(
        row.byHand as Record<
          string,
          { games: number; wins: number; draws: number } | undefined
        >,
      )) {
        if (!value) continue;
        const key = row.legend + hand,
          h = (hands[key] ??= {
            legend: row.legend,
            cards: hand.split(" / "),
            games: 0,
            wins: 0,
            draws: 0,
          });
        h.games += value.games;
        h.wins += value.wins;
        h.draws += value.draws;
      }
  return (
    <Section title="Rules audit · full matchup campaigns">
      <p>
        Historical capped-combat results. Run new simulations for current
        uncapped rules.
      </p>
      <p>{results.method}</p>
      <div className="dev-actions">
        {results.passes.map((x) => (
          <Button
            key={x.label}
            primary={selected === x.label}
            onClick={() => setSelected(x.label)}
          >
            {x.label} · {x.games.toLocaleString()}
          </Button>
        ))}
        <Button
          onClick={() => downloadJSON(`omnipath-${p.label}-campaign.json`, p)}
        >
          Export selected pass
        </Button>
      </div>
      <h3>
        {p.label} · mechanical version {p.version}
      </h3>
      <p>
        Opening Initiative: <strong>{pct(p.initiativeWinRate)}</strong> of
        decisive games · 95% interval{" "}
        {p.initiativeCI.map((n) => (n * 100).toFixed(2) + "%").join("–")} ·{" "}
        {p.draws.toLocaleString()} draws · {p.mismatches} seat mismatches.
      </p>
      <p>
        {p.averageRounds.toFixed(2)} mean rounds ·{" "}
        {p.reactionsPerGame.toFixed(2)} Reactions per player/game ·{" "}
        {p.heldPerTurn.toFixed(2)} Held Omens per turn.
      </p>
      {(p.initiativeCI[0] > 0.5 || p.initiativeCI[1] < 0.5) && (
        <p className="dev-warning">
          Opening Initiative differs significantly from 50% in this AI cohort.
        </p>
      )}
      <div className="dev-table-wrap">
        <table className="metrics-table">
          <thead>
            <tr>
              <th>Legend</th>
              <th>Win rate</th>
              <th>95% interval</th>
              <th>Damage/game</th>
              <th>Ward/game</th>
            </tr>
          </thead>
          <tbody>
            {p.legends.map((l) => (
              <tr key={l.id}>
                <th>{l.name}</th>
                <td>{pct(l.winRate)}</td>
                <td>{l.ci.map(pct).join("–")}</td>
                <td>{l.damage.toFixed(1)}</td>
                <td>{l.ward.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details>
        <summary>All 36 matchups</summary>
        <p>
          Row Legend’s win rate, draws included. Mirrors may fall below 50% due
          to draws.
        </p>
        <div className="dev-table-wrap">
          <table className="metrics-table">
            <thead>
              <tr>
                <th>vs</th>
                {p.legends.map((l) => (
                  <th key={l.id}>{l.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {p.legends.map((l) => (
                <tr key={l.id}>
                  <th>{l.name}</th>
                  {p.legends.map((o) => {
                    const r = p.rows.find(
                      (r) => r.legend === l.id && r.opponent === o.id,
                    )!;
                    return <td key={o.id}>{pct(r.wins / r.games)}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      {Object.keys(hands).length > 0 && (
        <details>
          <summary>Hand-level results</summary>
          <div className="dev-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Legend</th>
                  <th>Hand</th>
                  <th>Games</th>
                  <th>Win rate</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(hands)
                  .sort((a, b) => b.wins / b.games - a.wins / a.games)
                  .map((h) => (
                    <tr key={h.legend + h.cards.join()}>
                      <th>{h.legend}</th>
                      <td>
                        {h.cards
                          .map((id) => cardById[id]?.name ?? id)
                          .join(" / ")}
                      </td>
                      <td>{h.games}</td>
                      <td>{pct(h.wins / h.games)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      <p className="dev-muted">
        Quetzalcoatl’s adjusted starter remains under target. Balanced aggregate
        Initiative does not imply balanced Legends or individual matchups.
        Custom Hands test build sensitivity; they are not an exhaustive
        competitive metagame.
      </p>
    </Section>
  );
}
