import audit from "../../reports/skill-balance-v9/summary.json";
import { legendById } from "../content/legends";
import type { LegendId } from "../engine/types";
import { downloadJSON } from "../dev/storage";
export default function RulesAudit() {
  const baseline = audit.summaries[0],
    current = audit.summaries[1],
    custom = audit.summaries[2];
  const pct = (n: number) => (n * 100).toFixed(1) + "%";
  return (
    <section className="metrics-panel rules-audit">
      <p className="metrics-eyebrow">
        FROZEN AI AUDIT · MECHANICAL VERSION {audit.version}
      </p>
      <h2>Decisions, costs and counterplay</h2>
      <p>
        These are reproducible test runs, separate from live usage. Reversed
        seats check determinism and are not independent statistical samples.
      </p>
      <button
        className="dev-button"
        onClick={() => downloadJSON("omnipath-v9-rules-audit.json", audit)}
      >
        Export audit and all Card definitions
      </button>
      <div style={{ overflowX: "auto" }}>
        <table className="metrics-table">
          <thead>
            <tr>
              <th>Measure</th>
              <th>v8 baseline</th>
              <th>v9 starters</th>
              <th>Alternate Hands</th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "Attempts",
                baseline.attempted,
                current.attempted,
                custom.attempted,
              ],
              ["Stalled", baseline.stalled, current.stalled, custom.stalled],
              [
                "Average rounds · completed",
                baseline.averageRounds.toFixed(2),
                current.averageRounds.toFixed(2),
                custom.averageRounds.toFixed(2),
              ],
              [
                "No main ability before Focus",
                pct(baseline.rawDeadRate),
                pct(current.rawDeadRate),
                pct(custom.rawDeadRate),
              ],
              [
                "Choices per roll",
                baseline.choicesPerRoll.toFixed(1),
                current.choicesPerRoll.toFixed(1),
                custom.choicesPerRoll.toFixed(1),
              ],
              [
                "Utility ability share",
                pct(baseline.utilityShare),
                pct(current.utilityShare),
                pct(custom.utilityShare),
              ],
              [
                "Held / rolled",
                pct(baseline.heldShare),
                pct(current.heldShare),
                pct(custom.heldShare),
              ],
              [
                "Opening player wins",
                pct(baseline.openingWinRate),
                pct(current.openingWinRate),
                pct(custom.openingWinRate),
              ],
            ].map((row) => (
              <tr key={row[0]}>
                {row.map((cell, i) =>
                  i === 0 ? <th key={i}>{cell}</th> : <td key={i}>{cell}</td>,
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Opening-player estimate: {pct(current.openingWinRate)}; approximate 95%
        interval {current.opening95CI.map(pct).join("–")}, using{" "}
        {current.uniqueSeeds} unique pair seeds. Some seeds informed tuning;
        this is a screening estimate, not competitive certification.
      </p>
      <p className="dev-error">
        Still flagged: opening tempo, Leshy’s dependency on Focus, uneven
        Basajaun/Anansi starter matchup, and slow defensive custom Hands. Zero
        stalls in these selected panels does not establish that every legal Hand
        terminates.
      </p>
      <h3>Starter directions</h3>
      {current.byLegend.map((row) => {
        const id = row.legend as LegendId;
        return (
          <details key={id}>
            <summary>
              {legendById[id].name} · {pct(row.score)} draw-adjusted score ·{" "}
              {audit.strategies[id].name}
            </summary>
            <p>{audit.strategies[id].sequence}</p>
            <p>Counterplay: {audit.strategies[id].counterplay}</p>
          </details>
        );
      })}
      <h3>Policy comparison</h3>
      <p>
        On identical seeds, the focal side won{" "}
        {audit.policyResult.focalNormalWins}/{audit.policyResult.games} with the
        tactical policy and {audit.policyResult.focalGreedyWins}/
        {audit.policyResult.games} after switching to damage-first scoring.{" "}
        {audit.policyResult.changedOutcomes} outcomes changed. This tests one
        heuristic, not human skill.
      </p>
      <p>
        Higher Values are no longer universally better Ward. A numbered Omen
        gives 1 Ward; stronger defense needs a Card, Sigil or Passive. Four base
        damage costs at least two Omens; five or more costs all three. Paid
        Empowered and conditional bonuses remain explicit exceptions.
      </p>
    </section>
  );
}
