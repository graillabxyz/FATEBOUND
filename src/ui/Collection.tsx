import { OmenJourney, AcquisitionNotice } from "./OmenProgression";
import { LegendJourney } from "./LegendProgression";
import { CardBrowser } from "./CardBrowser";
import { OmenFaces } from "./OmenFaces";
import { useState } from "react";
import { LEGENDS } from "../content/legends";
import { CARDS } from "../content/cards";
import { OMENS } from "../content/omens";
import { COSMETICS } from "../content/economy";
import { useGame } from "./context";
import { Omen, Icon, LegendCard, PageHeading } from "./components";
export default function Collection() {
  const { active, profile, inspect, service, tab } = useGame();
  const [category, setCategory] = useState(
    tab === "omens" ? "Omens" : "Legends",
  );
  return (
    <div className="page collection-page">
      <PageHeading eyebrow="STORIES WORTH COLLECTING" title="The collection">
        <span className="collection-count">
          {category === "Legends"
            ? `${profile.ownedLegends.length}/${LEGENDS.length}`
            : category === "Cards"
              ? CARDS.length
              : category === "Omens"
                ? OMENS.length
                : COSMETICS.length}
          <span> {category.toUpperCase()}</span>
        </span>
      </PageHeading>
      <div className="collection-tabs">
        {["Legends", "Cards", "Omens", "Cosmetics"].map((c) => (
          <button
            key={c}
            className={category === c ? "active" : ""}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <AcquisitionNotice />
      {category === "Legends" ? (
        <>
          <LegendJourney />
          <div className="legend-grid">
            {LEGENDS.map((l) => (
              <div
                key={l.id}
                className={
                  profile.ownedLegends.includes(l.id)
                    ? ""
                    : "legend-collection-locked"
                }
              >
                <LegendCard
                  legend={l}
                  selected={active.legend === l.id}
                  onClick={() => inspect({ type: "legend", item: l })}
                />
                <small className="collection-ownership">
                  {profile.ownedLegends.includes(l.id)
                    ? "Owned"
                    : "Locked · Play, Coins or Gems"}
                </small>
              </div>
            ))}
          </div>
          <p className="cultural-note">
            <Icon name="book" size={15} />
            Folklore-inspired game interpretations. Each tradition is larger
            than the story we tell here.
          </p>
        </>
      ) : category === "Cards" ? (
        <CardBrowser />
      ) : category === "Omens" ? (
        <>
          <p className="intro-copy">
            Ordered faces. Deliberate tradeoffs.
            <br />
            Three fixed Omens. Your choice of probabilities.
          </p>
          <OmenJourney />
          <div className="dice-catalog">
            {OMENS.map((d) => (
              <button
                className="die-catalog-item"
                key={d.id}
                onClick={() => inspect({ type: "omen", item: d })}
              >
                <div className="die-display">
                  <Omen definition={d} skin={profile.skin} />
                </div>
                <strong>{d.name}</strong>
                <OmenFaces omen={d} />
                <small>{d.tags.join(" · ")}</small>
                <small>
                  {service.ownedGameplay(profile).has(d.id)
                    ? "Owned"
                    : "Locked"}
                  {active.dice.includes(d.id) ? " · Equipped" : ""}
                </small>
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
                  {c.kind === "Omen Skin" ? (
                    <Omen definition={OMENS[4]} skin={c.id} />
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
