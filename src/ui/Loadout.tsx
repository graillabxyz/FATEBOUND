import { useEffect, useState } from "react";
import type { Loadout as Build } from "../engine/types";
import { legendById } from "../content/legends";
import { CARDS, cardById, cardsFor } from "../content/cards";
import { DICE, dieById } from "../content/dice";
import { useGame } from "./context";
import {
  Die,
  GameplayCard,
  Icon,
  IconButton,
  LegendArt,
  PageHeading,
  PrimaryButton,
  SectionLabel,
  Modal,
  SecondaryButton,
} from "./components";
import { track } from "../services/analytics";
export default function Loadout() {
  const { active, profile, service, update, navigate, inspect, toast } =
    useGame();
  const [draft, setDraft] = useState<Build>(structuredClone(active));
  const [tab, setTab] = useState("cards");
  const [slot, setSlot] = useState(0);
  const [dieSlot, setDieSlot] = useState(0);
  const [filter, setFilter] = useState("All");
  const [favorite, setFavorite] = useState(false);
  const [rename, setRename] = useState(false);
  const [name, setName] = useState(active.name);
  useEffect(() => {
    setDraft(structuredClone(active));
    setName(active.name);
    setFilter("All");
  }, [active.id]);
  const l = legendById[draft.legend];
  const changed = JSON.stringify(draft) !== JSON.stringify(active);
  const equip = (id: string) => {
    if (draft.cards.includes(id)) {
      setSlot(draft.cards.indexOf(id));
      return;
    }
    const cards = [...draft.cards];
    cards[slot] = id;
    setDraft({ ...draft, cards });
    setSlot((slot + 1) % 4);
  };
  const save = () => {
    try {
      update(service.saveLoadout(profile, draft));
      track("loadout_changed", { legend: draft.legend });
      toast("Loadout saved. Ready when you are.");
    } catch (e) {
      toast((e as Error).message);
    }
  };
  return (
    <div className="page loadout-page">
      <PageHeading eyebrow="MAKE FATE YOUR OWN" title="Your loadout">
        <IconButton
          icon="copy"
          label="Duplicate loadout"
          onClick={() => {
            const copy = {
              ...structuredClone(draft),
              id: `build-${Date.now()}`,
              name: `${draft.name} II`,
            };
            update(service.saveLoadout(profile, copy));
            setDraft(copy);
            toast("Build duplicated.");
          }}
        />
      </PageHeading>
      <button className="loadout-legend" onClick={() => navigate("legends")}>
        <LegendArt id={l.id} />
        <span>
          <small>{l.region}</small>
          <strong>{l.name}</strong>
          <span>{l.archetype}</span>
        </span>
        <Icon name="swap" size={18} />
      </button>
      <div className="build-name">
        <select
          aria-label="Saved loadout"
          value={active.id}
          onChange={(e) => update({ ...profile, activeId: e.target.value })}
        >
          {profile.loadouts
            .filter((b) => b.legend === draft.legend)
            .map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
        </select>
        <IconButton
          icon="pencil"
          label="Rename loadout"
          onClick={() => {
            setName(draft.name);
            setRename(true);
          }}
        />
      </div>
      <div className="active-build">
        <SectionLabel right={<span>4 / 4 EQUIPPED</span>}>
          CARD HAND
        </SectionLabel>
        <div className="active-hand">
          {draft.cards.map((id, i) => (
            <GameplayCard
              key={i}
              card={cardById[id]}
              compact
              selected={tab === "cards" && slot === i}
              onClick={() => {
                setTab("cards");
                setSlot(i);
              }}
              onInspect={() => inspect({ type: "card", item: cardById[id] })}
            />
          ))}
        </div>
        <SectionLabel right={<span>3 / 3 EQUIPPED</span>}>DICE</SectionLabel>
        <div className="loadout-dice">
          {draft.dice.map((id, i) => (
            <div key={i}>
              <Die
                definition={dieById[id]}
                selected={tab === "dice" && dieSlot === i}
                skin={profile.skin}
                onClick={() => {
                  setTab("dice");
                  setDieSlot(i);
                }}
              />
              <small>{dieById[id].name}</small>
            </div>
          ))}
        </div>
      </div>
      <div className="save-build">
        <span>
          <Icon name="check" size={14} />1 Legend · 4 cards · 3 dice
        </span>
        <button onClick={save} className={changed ? "gold-text" : ""}>
          <Icon name="save" size={16} />
          {changed ? "Save changes" : "Saved"}
        </button>
      </div>
      <div className="segmented">
        <button
          className={tab === "cards" ? "active" : ""}
          onClick={() => setTab("cards")}
        >
          Cards <span>12</span>
        </button>
        <button
          className={tab === "dice" ? "active" : ""}
          onClick={() => setTab("dice")}
        >
          Dice
        </button>
      </div>
      {tab === "cards" ? (
        <>
          <div className="filter-row">
            <select
              aria-label="Filter cards by category or approach"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option>All</option>
              <optgroup label="Build approach">
                {l.approaches.map((a) => (
                  <option key={a} value={`approach:${a}`}>
                    {a}
                  </option>
                ))}
              </optgroup>
              {[...new Set(cardsFor(draft.legend).map((c) => c.category))].map(
                (x) => (
                  <option key={x}>{x}</option>
                ),
              )}
            </select>
            <button
              className={favorite ? "active" : ""}
              onClick={() => setFavorite(!favorite)}
            >
              <Icon name="star" size={15} />
              Favorites
            </button>
            <span>Owned · Compatible</span>
          </div>
          <p className="helper-text">
            Choose a card to replace slot {slot + 1}. Tap the lens to inspect.
          </p>
          <div className="collection-cards">
            {CARDS.filter(
              (c) =>
                c.legend === draft.legend &&
                (filter === "All" ||
                  c.category === filter ||
                  filter === `approach:${c.archetype}`) &&
                (!favorite || profile.favorites.includes(c.id)),
            ).map((c) => (
              <GameplayCard
                key={c.id}
                card={c}
                selected={draft.cards.includes(c.id)}
                onClick={() => equip(c.id)}
                onInspect={() => inspect({ type: "card", item: c })}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="helper-text">
            Choose a D{l.diceSlots[dieSlot]} for slot {dieSlot + 1}. Every
            ordered face matters.
          </p>
          <div className="dice-catalog">
            {DICE.filter(
              (d) =>
                d.size === l.diceSlots[dieSlot] &&
                (d.compatibleLegendTags.includes("all") ||
                  d.compatibleLegendTags.some((t) => l.tags.includes(t))),
            ).map((d) => (
              <div
                className={`die-catalog-item ${draft.dice[dieSlot] === d.id ? "selected" : ""}`}
                key={d.id}
              >
                <Die
                  definition={d}
                  skin={profile.skin}
                  onClick={() => {
                    const dice = [...draft.dice];
                    dice[dieSlot] = d.id;
                    setDraft({ ...draft, dice });
                  }}
                />
                <strong>{d.name}</strong>
                <span>
                  {d.rarity} · D{d.size}
                </span>
                <button
                  className="text-button"
                  onClick={() => inspect({ type: "die", item: d })}
                >
                  Inspect faces
                  <Icon name="right" size={12} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      {changed && (
        <div className="sticky-save">
          <PrimaryButton onClick={save} icon="save">
            Save loadout
          </PrimaryButton>
        </div>
      )}
      {rename && (
        <Modal title="Name your build" onClose={() => setRename(false)}>
          <label className="field-label">
            LOADOUT NAME
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={32}
              autoFocus
            />
          </label>
          <SecondaryButton
            icon="check"
            onClick={() => {
              const next = { ...draft, name: name.trim() || draft.name };
              setDraft(next);
              update(service.saveLoadout(profile, next));
              setRename(false);
            }}
          >
            Save name
          </SecondaryButton>
        </Modal>
      )}
    </div>
  );
}
