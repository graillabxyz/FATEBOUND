import { STARTERS } from "../content/loadouts";
import { AffinityLine } from "./Affinities";
import { CardBrowser } from "./CardBrowser";
import { OmenFaces } from "./OmenFaces";
import { useEffect, useState } from "react";
import type { Loadout as Build } from "../engine/types";
import { legendById } from "../content/legends";
import { cardById, cardsFor } from "../content/cards";
import { OMENS, omenById } from "../content/omens";
import { useGame } from "./context";
import {
  Omen,
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
  const [rename, setRename] = useState(false);
  const [name, setName] = useState(active.name);
  useEffect(() => {
    setDraft(structuredClone(active));
    setName(active.name);
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
      <SectionLabel>LEGEND</SectionLabel>
      <button className="loadout-legend" onClick={() => navigate("legends")}>
        <LegendArt id={l.id} />
        <span>
          <small>{l.region}</small>
          <strong>{l.name}</strong>
          <AffinityLine ids={l.affinities} />
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
      <SecondaryButton
        onClick={() => {
          setDraft({
            ...structuredClone(STARTERS[draft.legend]),
            id: draft.id,
            name: draft.name,
          });
          toast("Starter kit loaded into your draft. Save to equip it.");
        }}
      >
        Use starter kit · 1 signature + 2 numbered Omens
      </SecondaryButton>
      <div className="active-build">
        <SectionLabel right={<span>4 / 4 EQUIPPED</span>}>HAND</SectionLabel>
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
        <SectionLabel right={<span>3 / 3 EQUIPPED</span>}>OMENS</SectionLabel>
        <div className="loadout-dice">
          {draft.dice.map((id, i) => (
            <div key={i}>
              <Omen
                definition={omenById[id]}
                selected={tab === "dice" && dieSlot === i}
                skin={profile.skin}
                onClick={() => {
                  setTab("dice");
                  setDieSlot(i);
                }}
              />
              <small>{omenById[id].name}</small>
              <OmenFaces omen={omenById[id]} />
              <small>
                d{omenById[id].size} · {omenById[id].rarity} · Equipped
              </small>
              <small>{omenById[id].tags.join(" · ")}</small>
            </div>
          ))}
        </div>
      </div>
      <div className="save-build">
        <span>
          <Icon name="check" size={14} />1 Legend · 4 Cards · 3 Omens
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
          Cards <span>{cardsFor(l.id).length}</span>
        </button>
        <button
          className={tab === "dice" ? "active" : ""}
          onClick={() => setTab("dice")}
        >
          Omens
        </button>
      </div>
      {tab === "cards" ? (
        <CardBrowser
          legend={draft.legend}
          onEquip={equip}
          equipped={draft.cards}
        />
      ) : (
        <>
          <p className="helper-text">
            Choose a collectible Omen for slot {dieSlot + 1}. Every ordered face
            matters.
          </p>
          <div className="dice-catalog">
            {OMENS.filter(
              (d) =>
                l.allowedDiceSizes.includes(d.size) &&
                (d.compatibleLegendTags.includes("all") ||
                  d.compatibleLegendTags.some((t) => l.tags.includes(t))),
            ).map((d) => (
              <div
                className={`die-catalog-item ${draft.dice[dieSlot] === d.id ? "selected" : ""}`}
                key={d.id}
              >
                <Omen
                  definition={d}
                  skin={profile.skin}
                  onClick={() => {
                    if (!profile.ownedOmens.includes(d.id)) {
                      toast("Unlock this Omen with Coins in the Shop.");
                      return;
                    }
                    const dice = [...draft.dice];
                    dice[dieSlot] = d.id;
                    setDraft({ ...draft, dice });
                  }}
                />
                <strong>{d.name}</strong>
                <OmenFaces omen={d} />
                <small>
                  {d.tags.join(" · ")} ·{" "}
                  {service.ownedGameplay(profile).has(d.id)
                    ? "Owned"
                    : "Locked"}
                  {draft.dice.includes(d.id) ? " · Equipped" : ""}
                </small>
                <span>
                  {d.rarity} · D{d.size}
                </span>
                <button
                  className="text-button"
                  onClick={() => inspect({ type: "omen", item: d })}
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
