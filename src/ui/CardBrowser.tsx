import { useState } from "react";
import { CARDS } from "../content/cards";
import {
  AFFINITIES,
  affinityIds,
  cardCompatible,
  cardCompatibilityReason,
} from "../content/affinities";
import { legendById } from "../content/legends";
import type { LegendId } from "../engine/types";
import { useGame } from "./context";
import { GameplayCard } from "./components";
export function CardBrowser({
  legend,
  onEquip,
  equipped = [],
}: {
  legend?: LegendId;
  onEquip?: (id: string) => void;
  equipped?: string[];
}) {
  const { profile, inspect } = useGame();
  const [affinity, setAffinity] = useState("all"),
    [ownership, setOwnership] = useState("all"),
    [rarity, setRarity] = useState("all"),
    [timing, setTiming] = useState("all"),
    [legalOnly, setLegalOnly] = useState(!!legend),
    [query, setQuery] = useState("");
  const cards = CARDS.filter(
    (c) =>
      (!legend || !legalOnly || cardCompatible(legendById[legend], c)) &&
      (affinity === "all" ||
        (affinity === "unbound"
          ? c.affinityRequirements === null
          : affinityIds(c.affinityRequirements).includes(affinity as any))) &&
      (ownership === "all" ||
        profile.ownedCards.includes(c.id) === (ownership === "owned")) &&
      (rarity === "all" || c.rarity === rarity) &&
      (timing === "all" || c.timing === timing) &&
      `${c.name} ${c.text} ${c.tags.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <section className="shared-card-browser">
      <p className="helper-text">
        One shared Card pool. Affinities decide compatibility; Omens pay
        activation requirements.
      </p>
      <input
        aria-label="Search Cards"
        placeholder="Find a Card or effect"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="card-filters">
        <select
          aria-label="Affinity"
          value={affinity}
          onChange={(e) => setAffinity(e.target.value)}
        >
          <option value="all">All Affinities</option>
          {AFFINITIES.map((a) => (
            <option key={a.id} value={a.id}>
              {a.symbol} {a.name}
            </option>
          ))}
          <option value="unbound">◇ Unbound</option>
        </select>
        <select
          aria-label="Card ownership"
          value={ownership}
          onChange={(e) => setOwnership(e.target.value)}
        >
          <option value="all">All ownership</option>
          <option value="owned">Owned</option>
          <option value="unowned">Unowned</option>
        </select>
        <select
          aria-label="Card rarity"
          value={rarity}
          onChange={(e) => setRarity(e.target.value)}
        >
          <option value="all">All rarities</option>
          {["common", "uncommon", "rare", "mythic"].map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <select
          aria-label="Card timing"
          value={timing}
          onChange={(e) => setTiming(e.target.value)}
        >
          <option value="all">Action + Reaction</option>
          <option>ACTION</option>
          <option>REACTION</option>
        </select>
      </div>
      {legend && (
        <label className="legal-toggle">
          <input
            type="checkbox"
            checked={legalOnly}
            onChange={(e) => setLegalOnly(e.target.checked)}
          />
          Legal for {legendById[legend].name} only
        </label>
      )}
      <p className="collection-summary">
        {cards.length} Cards · {profile.ownedCards.length}/{CARDS.length} owned
      </p>
      <div className="collection-cards">
        {cards.map((c) => {
          const owned = profile.ownedCards.includes(c.id),
            legal = !legend || cardCompatible(legendById[legend], c);
          return (
            <article key={c.id} className="collection-card-entry">
              <GameplayCard
                card={c}
                selected={equipped.includes(c.id)}
                onClick={() => inspect({ type: "card", item: c })}
              />
              <span className="card-ownership">
                {owned ? "Owned" : "Unowned"} · {c.rarity}
              </span>
              {!legal && (
                <p className="incompatible-reason">
                  {cardCompatibilityReason(legendById[legend!], c)}
                </p>
              )}
              {onEquip && (
                <button
                  disabled={!legal || !owned || equipped.includes(c.id)}
                  onClick={() => onEquip(c.id)}
                >
                  {equipped.includes(c.id)
                    ? "Equipped"
                    : !legal
                      ? "Incompatible"
                      : !owned
                        ? "Not owned"
                        : "Equip Card"}
                </button>
              )}
            </article>
          );
        })}
      </div>
      {!cards.length && <p>No Cards match these filters.</p>}
    </section>
  );
}
