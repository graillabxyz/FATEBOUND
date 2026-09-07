import { cardCompatible } from "../content/affinities";
import { omenFace } from "../content/terminology";
import { useState } from "react";
import { CARDS } from "../content/cards";
import { LEGENDS, legendById } from "../content/legends";
import { OMENS, omenBudget } from "../content/omens";
import { STARTERS } from "../content/loadouts";
import { facePosition, sharedFate } from "../engine/fate";
import { GameplayCard, LegendArt } from "../ui/components";
import { Button, Field, Json, Section } from "./controls";
import type { Effect } from "../engine/types";
const allEffects = (list: Effect[]): string[] =>
  list.flatMap((e) => [e.type, ...allEffects(e.effects ?? [])]);
export function ContentBrowser() {
  const [kind, setKind] = useState("cards"),
    [search, setSearch] = useState(""),
    [legend, setLegend] = useState("all"),
    [category, setCategory] = useState("all"),
    [effect, setEffect] = useState("all"),
    [requirement, setRequirement] = useState("all"),
    [selected, setSelected] = useState(CARDS[0].id),
    [compare, setCompare] = useState(["basajaun", "anansi"]);
  const filtered = CARDS.filter(
    (c) =>
      (legend === "all" ||
        cardCompatible(legendById[legend as keyof typeof legendById], c)) &&
      (category === "all" || c.category === category) &&
      (effect === "all" || allEffects(c.effects).includes(effect)) &&
      (requirement === "all" ||
        (requirement === "multi" && c.requirement.count > 1) ||
        (requirement === "symbol" && !!c.requirement.symbol) ||
        (requirement === "control" && !!c.requirement.control) ||
        (requirement === "condition" && !!c.requirement.condition) ||
        (requirement === "number" && c.requirement.min !== undefined)) &&
      `${c.name} ${c.id} ${c.timing} ${c.text} ${c.tags.join(" ")} ${c.archetype} ${c.requirementLabel}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const card = CARDS.find((c) => c.id === selected)!;
  return (
    <div className="dev-stack">
      <h2>Production content</h2>
      <div className="dev-tabs">
        <button
          className={kind === "cards" ? "active" : ""}
          onClick={() => setKind("cards")}
        >
          Cards · {CARDS.length}
        </button>
        <button
          className={kind === "legends" ? "active" : ""}
          onClick={() => setKind("legends")}
        >
          Compare Legends
        </button>
      </div>
      {kind === "cards" ? (
        <>
          <Field label="Search cards, tags, archetypes or requirements">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Damage, Ward, prediction…"
            />
          </Field>
          <div className="dev-grid2">
            <Field label="Legend / region">
              <select
                value={legend}
                onChange={(e) => setLegend(e.target.value)}
              >
                <option value="all">All Legends / regions</option>
                {LEGENDS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} · {l.region}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Effect category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="all">All categories</option>
                {[...new Set(CARDS.map((c) => c.category))].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Effect primitive">
              <select
                value={effect}
                onChange={(e) => setEffect(e.target.value)}
              >
                <option value="all">All effects</option>
                {[...new Set(CARDS.flatMap((c) => allEffects(c.effects)))]
                  .sort()
                  .map((e) => (
                    <option key={e}>{e}</option>
                  ))}
              </select>
            </Field>
            <Field label="Activation requirement">
              <select
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
              >
                <option value="all">All requirements</option>
                <option value="number">Numeric</option>
                <option value="multi">Two Omens</option>
                <option value="symbol">Sigil</option>
                <option value="control">Focus cost</option>
                <option value="condition">State condition</option>
              </select>
            </Field>
          </div>
          <p className="dev-muted">
            {filtered.length} matches. Every card is hidden until revealed and
            remains known after use.
          </p>
          <div className="dev-content-list">
            {filtered.map((c) => (
              <button
                key={c.id}
                className={c.id === selected ? "active" : ""}
                onClick={() => setSelected(c.id)}
              >
                <strong>{c.name}</strong>
                <span>
                  {c.requirementLabel} · P{c.priority}
                </span>
                <small>{c.text}</small>
              </button>
            ))}
          </div>
          <div className="dev-card-preview">
            <GameplayCard card={card} />
          </div>
          <Section title="Raw card and balance metadata" open>
            <Json value={card} />
          </Section>
          <p className="dev-muted">
            Use the metrics dashboard for observed usage and win rates. Per-card
            value attribution is not inferred from team damage.
          </p>
        </>
      ) : (
        <>
          <div className="dev-grid2">
            {compare.map((id, i) => (
              <Field key={i} label={`Legend ${i + 1}`}>
                <select
                  value={id}
                  onChange={(e) =>
                    setCompare(
                      compare.map((v, j) => (i === j ? e.target.value : v)),
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
            ))}
          </div>
          <div className="dev-grid2">
            {compare.map((id, i) => {
              const l = LEGENDS.find((l) => l.id === id)!;
              return (
                <div className="dev-legend-column" key={i}>
                  <LegendArt id={l.id} />
                  <h3>{l.name}</h3>
                  <p>
                    {l.hp} Life · Initiative +{l.initiativeBonus} ·{" "}
                    {l.diceSlots.map((s) => `D${s}`).join("/")}
                  </p>
                  <p>{l.passive}</p>
                  <p>{l.approaches.join(" · ")}</p>
                  <Section title="Default loadout">
                    <Json value={STARTERS[l.id]} />
                  </Section>
                  <Section title="Card pool">
                    {CARDS.filter((c) =>
                      cardCompatible(
                        legendById[id as keyof typeof legendById],
                        c,
                      ),
                    ).map((c) => (
                      <p key={c.id}>
                        {c.name} · {c.requirementLabel}
                      </p>
                    ))}
                  </Section>
                  <p className="dev-muted">
                    Observed win/damage/Ward metrics appear after a simulation
                    or play session.
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
export function DiceLab() {
  const [ids, setIds] = useState([OMENS[2].id, OMENS[3].id]),
    [rolls, setRolls] = useState(0),
    [freq, setFreq] = useState<Record<string, number>>({}),
    [seed, setSeed] = useState(12345);
  const dice = ids.map((id) => OMENS.find((d) => d.id === id)!);
  const primary = dice[0],
    budget = omenBudget(primary);
  const roll = (count: number) => {
    const next = { ...freq };
    for (let i = rolls; i < rolls + count; i++) {
      const f = sharedFate(seed, i + 1)[0];
      dice.forEach((d) => {
        const k = `${d.id}:${facePosition(f, d.size)}`;
        next[k] = (next[k] ?? 0) + 1;
      });
    }
    setFreq(next);
    setRolls(rolls + count);
  };
  const pairs = Array.from({ length: 120 }, (_, token) =>
    dice.map((d) => facePosition(token, d.size)).join("/"),
  );
  const unique = [...new Set(pairs)];
  return (
    <div className="dev-stack">
      <h2>Omen Lab</h2>
      <p className="dev-muted">
        Ordered faces, opposites and the same production Fate tokens. Changing
        an Omen resets the sample.
      </p>
      {ids.map((id, i) => (
        <Field key={i} label={`Compare Omen ${i + 1}`}>
          <select
            value={id}
            onChange={(e) => {
              setIds(ids.map((v, j) => (i === j ? e.target.value : v)));
              setFreq({});
              setRolls(0);
            }}
          >
            {OMENS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} · D{d.size}
              </option>
            ))}
          </select>
        </Field>
      ))}
      <Button
        onClick={() => {
          setIds(ids.length === 2 ? [...ids, OMENS[4].id] : ids.slice(0, 2));
          setFreq({});
          setRolls(0);
        }}
      >
        {ids.length === 2 ? "Add third Omen" : "Remove third Omen"}
      </Button>
      <div className="dev-grid2">
        <div className="dev-stat">
          <small>Mean raw numeric value</small>
          <strong>
            {(
              primary.faces.reduce(
                (n, f) => n + (f.type === "number" ? f.value : 0),
                0,
              ) / primary.size
            ).toFixed(2)}
          </strong>
        </div>
        <div className="dev-stat">
          <small>Mean budget weight</small>
          <strong>{budget.mean.toFixed(2)}</strong>
        </div>
        <div className="dev-stat">
          <small>Void probability</small>
          <strong>{(budget.blankShare * 100).toFixed(1)}%</strong>
        </div>
        <div className="dev-stat">
          <small>Sigil probability</small>
          <strong>
            {(
              (primary.faces.filter((f) => f.type === "symbol").length /
                primary.size) *
              100
            ).toFixed(1)}
            %
          </strong>
        </div>
      </div>
      <Field label="Roll seed">
        <input
          type="number"
          value={seed}
          onChange={(e) => {
            setSeed(+e.target.value >>> 0);
            setFreq({});
            setRolls(0);
          }}
        />
      </Field>
      <div className="dev-actions">
        {[1, 10, 100, 1000].map((n) => (
          <Button key={n} onClick={() => roll(n)}>
            Roll ×{n}
          </Button>
        ))}
      </div>
      <p>
        {rolls} shared rolls. Utility weights are authored estimates, not
        observed win probabilities.
      </p>
      <div className="dev-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Face</th>
              {dice.map((d, i) => (
                <th key={i}>{d.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from(
              { length: Math.max(...dice.map((d) => d.size)) },
              (_, i) => (
                <tr key={i}>
                  <th>{i + 1}</th>
                  {dice.map((d, j) => {
                    const f = d.faces[i];
                    return (
                      <td key={j}>
                        {f ? (
                          <>
                            <strong>{omenFace(f).name}</strong>
                            <small>
                              ↔ {d.opposites[i] + 1} · weight {f.balanceWeight}
                              <br />
                              {freq[`${d.id}:${i}`] ?? 0} rolls
                              <br />
                              {omenFace(f).kind}
                            </small>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    );
                  })}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
      <Section title="Exact shared-position comparison">
        <p>
          Mixed-size Omens map the same position to different face indices. All
          120 bands are represented.
        </p>
        <div className="dev-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tokens (1–120)</th>
                {dice.map((d, i) => (
                  <th key={i}>D{d.size}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {unique.map((pair) => {
                const indices = pairs
                  .map((p, i) => (p === pair ? i + 1 : 0))
                  .filter(Boolean);
                return (
                  <tr key={pair}>
                    <td>
                      {indices[0]}–{indices.at(-1)}
                    </td>
                    {pair.split("/").map((p, j) => (
                      <td key={j}>
                        Face {+p + 1} · {omenFace(dice[j].faces[+p]).name}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="Balance totals">
        <Json
          value={dice.map((d) => ({
            ...omenBudget(d),
            totalWeight: d.faces.reduce((n, f) => n + f.balanceWeight, 0),
            tags: d.tags,
            compatibility: d.compatibleLegendTags,
          }))}
        />
      </Section>
    </div>
  );
}
