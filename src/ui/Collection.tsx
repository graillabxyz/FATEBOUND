import { useState } from "react";
import { LEGENDS } from "../content/legends";
import { CARDS } from "../content/cards";
import { DICE } from "../content/dice";
import { COSMETICS } from "../content/economy";
import { useGame } from "./context";
import { Die, GameplayCard, Icon, LegendCard, PageHeading } from "./components";
export default function Collection() {
  const { active, profile, inspect } = useGame();
  const [category, setCategory] = useState("Legends");
  const [filter, setFilter] = useState("all");
  const [favorite, setFavorite] = useState(false);
  return (
    <div className="page collection-page">
      <PageHeading eyebrow="STORIES WORTH COLLECTING" title="The collection">
        <span className="collection-count">
          06 <span>/ 06</span>
        </span>
      </PageHeading>
      <div className="collection-tabs">
        {["Legends", "Cards", "Dice", "Cosmetics"].map((c) => (
          <button
            key={c}
            className={category === c ? "active" : ""}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      {category === "Legends" ? (
        <>
          <p className="intro-copy">
            Different origins. Different instincts.
            <br />
            Find the Legend that thinks like you.
          </p>
          <div className="legend-grid">
            {LEGENDS.map((l) => (
              <LegendCard
                key={l.id}
                legend={l}
                selected={active.legend === l.id}
                onClick={() => inspect({ type: "legend", item: l })}
              />
            ))}
          </div>
          <p className="cultural-note">
            <Icon name="book" size={15} />
            Folklore-inspired game interpretations. Each tradition is larger
            than the story we tell here.
          </p>
        </>
      ) : category === "Cards" ? (
        <>
          <div className="filter-row">
            <select
              aria-label="Filter collection by Legend"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Legends</option>
              <optgroup label="Region / tradition">
                {LEGENDS.map((l) => (
                  <option key={l.id} value={`region:${l.id}`}>
                    {l.region}
                  </option>
                ))}
              </optgroup>
              {LEGENDS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <button
              className={favorite ? "active" : ""}
              onClick={() => setFavorite(!favorite)}
            >
              <Icon name="star" size={15} />
              Favorites
            </button>
          </div>
          <div className="collection-cards">
            {CARDS.filter(
              (c) =>
                (filter === "all" ||
                  c.legend === filter ||
                  filter === `region:${c.legend}`) &&
                (!favorite || profile.favorites.includes(c.id)),
            ).map((c) => (
              <GameplayCard
                key={c.id}
                card={c}
                onClick={() => inspect({ type: "card", item: c })}
              />
            ))}
          </div>
        </>
      ) : category === "Dice" ? (
        <>
          <p className="intro-copy">
            Ordered faces. Deliberate tradeoffs.
            <br />
            The same Fate, interpreted your way.
          </p>
          <div className="dice-catalog">
            {DICE.map((d) => (
              <button
                className="die-catalog-item"
                key={d.id}
                onClick={() => inspect({ type: "die", item: d })}
              >
                <div className="die-display">
                  <Icon name="dice" size={35} />
                  <b>D{d.size}</b>
                </div>
                <strong>{d.name}</strong>
                <span>
                  {d.rarity} · {d.faces.length} faces
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="intro-copy">
            A little more you.
            <br />
            Every cosmetic is a look. Never an advantage.
          </p>
          <div className="cosmetic-grid">
            {COSMETICS.map((c) => (
              <button
                className="cosmetic-tile"
                key={c.id}
                onClick={() => inspect({ type: "cosmetic", item: c })}
                style={{ "--cosmetic-color": c.color } as React.CSSProperties}
              >
                <div className="cosmetic-art">
                  {c.kind === "Dice skin" ? (
                    <Die definition={DICE[4]} skin={c.id} />
                  ) : (
                    <Icon name={c.icon} size={50} />
                  )}
                </div>
                <small>{c.earned ? "EARNED PRESTIGE" : c.rarity}</small>
                <strong>{c.name}</strong>
                <span>
                  {c.kind}
                  <Icon
                    name={profile.cosmetics.includes(c.id) ? "check" : "lock"}
                    size={12}
                  />
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
