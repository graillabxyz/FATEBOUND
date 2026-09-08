import { useState } from "react";
import report from "./starter-economy-results.json";
import { Button, Section } from "../dev/controls";
import { downloadJSON } from "../dev/storage";
const pct = (v: number) => (v * 100).toFixed(1) + "%";
export default function StarterEconomyPanel() {
  const [tab, setTab] = useState("Matchups");
  return (
    <Section title="Latest starter + economy audit · 8 Sep 2026" open>
      <p>
        <strong>
          {(report.games + report.accessGames).toLocaleString()}{" "}
          production-engine games
        </strong>{" "}
        · {report.seatMismatches} reversed-seat mismatches · mechanical version{" "}
        {report.mechanicalVersion}.
      </p>
      <div className="dev-actions">
        {["Matchups", "Cards & Omens", "Economy"].map((t) => (
          <Button key={t} primary={tab === t} onClick={() => setTab(t)}>
            {t}
          </Button>
        ))}
        <Button
          onClick={() =>
            downloadJSON("omnipath-starter-economy-20260908.json", report)
          }
        >
          Export full audit
        </Button>
      </div>
      {tab === "Matchups" ? (
        <>
          <p>
            Opening Initiative decisive win share:{" "}
            <strong>{pct(report.initiativeWinRate)}</strong> · 95% interval{" "}
            {report.initiativeCI.map(pct).join("–")}.
          </p>
          <p className="dev-warning">
            Quetzalcoatl trails the field. Five signature Omens underperform
            their same-size numbered replacement in the smaller matched-seed
            panel. These starter recipes are not yet balanced for release.
          </p>
          <div className="dev-table-wrap">
            <table className="metrics-table">
              <thead>
                <tr>
                  <th>Legend</th>
                  <th>Games</th>
                  <th>Win rate</th>
                  <th>Draw-adjusted score</th>
                  <th>Rounds</th>
                  <th>Damage</th>
                  <th>Ward</th>
                  <th>Reactions</th>
                </tr>
              </thead>
              <tbody>
                {report.legends.map((l) => (
                  <tr key={l.id}>
                    <th>{l.name}</th>
                    <td>{l.games.toLocaleString()}</td>
                    <td>{pct(l.winRate)}</td>
                    <td>{pct(l.score)}</td>
                    <td>{l.averageRounds.toFixed(2)}</td>
                    <td>{l.damage.toFixed(1)}</td>
                    <td>{l.ward.toFixed(1)}</td>
                    <td>{l.reactions.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Section title="All 36 matchups">
            <p>
              Draw-adjusted score; 4,000 matches per cell. Each pair of reversed
              seats counts once for confidence intervals.
            </p>
            <div className="dev-table-wrap">
              <table className="metrics-table">
                <thead>
                  <tr>
                    <th>Focal / opponent</th>
                    {report.legends.map((l) => (
                      <th key={l.id}>{l.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.legends.map((l) => (
                    <tr key={l.id}>
                      <th>{l.name}</th>
                      {report.legends.map((o) => (
                        <td key={o.id}>
                          {pct(
                            l.matchups.find((m) => m.opponent === o.id)!.score,
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
          <Section title="Ownership-only entry and signature comparison">
            <p>
              Change only the focal build. Same 100 independent seeds per
              matchup; 1,200 games per Legend/variant. Score gives draws half
              credit. This smaller comparison is exploratory.
            </p>
            <div className="dev-table-wrap">
              <table className="metrics-table">
                <thead>
                  <tr>
                    <th>Legend</th>
                    <th>Curated</th>
                    <th>Owned-item entry</th>
                    <th>Numbered replacement</th>
                  </tr>
                </thead>
                <tbody>
                  {report.legends.map((l) => (
                    <tr key={l.id}>
                      <th>{l.name}</th>
                      <td>{pct(l.variants.curated.score)}</td>
                      <td>{pct(l.variants.entry.score)}</td>
                      <td>{pct(l.variants.numbered.score)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
          <details>
            <summary>Method and limitations</summary>
            <p>{report.method}</p>
          </details>
        </>
      ) : tab === "Cards & Omens" ? (
        <>
          <p>
            Exact curated recipes. A normal Legend unlock grants only the
            Legend; these Cards and Omens are collected separately. Raw
            eligibility enumerates all three rolled Omens, without Focus,
            passive bonuses, timing or enemy conditions.
          </p>
          {report.legends.map((l) => (
            <Section key={l.id} title={l.name}>
              <div className="dev-table-wrap">
                <table className="metrics-table">
                  <thead>
                    <tr>
                      <th>Card</th>
                      <th>Affinity</th>
                      <th>Requirement</th>
                      <th>Raw eligibility</th>
                      <th>Uses/game</th>
                    </tr>
                  </thead>
                  <tbody>
                    {l.cards.map((c) => (
                      <tr key={c.id}>
                        <th>
                          {c.name}
                          <small style={{ display: "block" }}>{c.timing}</small>
                        </th>
                        <td>{c.affinity}</td>
                        <td>{c.requirement}</td>
                        <td>{pct(c.rawFullRollProbability)}</td>
                        <td>{c.usesPerMatch.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {l.cards.map((c) => (
                <p key={c.id}>
                  <strong>{c.name}:</strong> {c.text}
                </p>
              ))}
              {l.dice.map((d) => (
                <article key={d.id}>
                  <h4>
                    {d.name} · d{d.size}{" "}
                    {d.signature ? "· Signature" : "· Numbered"}
                  </h4>
                  <p>{d.faces.map((f, i) => `${i + 1}: ${f}`).join(" / ")}</p>
                  <p>
                    Void {pct(d.voidProbability)} · Sigil{" "}
                    {pct(d.sigilProbability)}
                  </p>
                </article>
              ))}
            </Section>
          ))}
        </>
      ) : (
        <>
          <p>
            Single-item acquisition: one Legend, one Omen, one Card, or a
            two-Card booster. The 15-match earned Legend milestone can bring one
            authored signature gift. Direct purchases have no random bonus.
          </p>
          <div className="dev-table-wrap">
            <table className="metrics-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Coins</th>
                  <th>Gems</th>
                  <th>Play-earned route</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Legend</th>
                  <td>800</td>
                  <td>300</td>
                  <td>5 / 15 / 30 / 50 matches</td>
                </tr>
                <tr>
                  <th>Signature Omen</th>
                  <td>600</td>
                  <td>240</td>
                  <td>10 / 25 / 45 / 70 matches</td>
                </tr>
                <tr>
                  <th>Numbered Omen</th>
                  <td>120</td>
                  <td>—</td>
                  <td>Earned Coins</td>
                </tr>
                <tr>
                  <th>2-Card booster</th>
                  <td>160</td>
                  <td>—</td>
                  <td>
                    First win; every 10 matches; 800 Mastery XP; free Season
                    Path
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="dev-warning">
            Projection data, not player analytics. Local wallet preview;
            real-money checkout and account-backed entitlements remain
            unconnected.
          </p>
          <div className="dev-table-wrap">
            <table className="metrics-table">
              <thead>
                <tr>
                  <th>Version / policy</th>
                  <th>First new signature</th>
                  <th>All signatures</th>
                  <th>All Legends</th>
                  <th>Cards at 50</th>
                  <th>Cards at 100</th>
                </tr>
              </thead>
              <tbody>
                {report.economy.rows.map((r) => (
                  <tr key={r.version + r.strategy}>
                    <th>
                      {r.version} · {r.strategy}
                    </th>
                    <td>{r.firstAdditionalOmenMedian}</td>
                    <td>{r.allSignaturesMedian}</td>
                    <td>{r.allLegendsMedian}</td>
                    <td>{r.points[2].cards.median}</td>
                    <td>{r.points[3].cards.median}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Median match numbers and Card counts across 128 modeled profiles per
            row.
          </p>
          <details>
            <summary>Projection assumptions</summary>
            <p>{report.economy.method}</p>
          </details>
        </>
      )}
    </Section>
  );
}
