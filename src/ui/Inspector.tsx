import { LegendUnlockOptions } from "./LegendProgression";
import { cardRuleDetails } from "../content/card-rules";
import { AffinityLine } from "./Affinities";
import { cardCompatibilityReason } from "../content/affinities";
import { LEGENDS } from "../content/legends";
import { CARD_COIN_PRICE } from "../content/acquisition";
import { FaceExplanation } from "./OmenFaces";
import { omenFace, requirementText } from "../content/terminology";
import { cardsFor } from "../content/cards";
import { useState } from "react";
import type { Inspect } from "./context";
import { useGame } from "./context";
import { STARTERS } from "../content/loadouts";
import { omenById, omenBudget } from "../content/omens";
import { legendById } from "../content/legends";
import {
  Omen,
  CardArt,
  Icon,
  LegendArt,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SectionLabel,
} from "./components";
import { DIE_SHAPES } from "./dice-geometry";
import { audioCue } from "../services/audio";
export default function Inspector({
  target,
  onClose,
}: {
  target: Inspect;
  onClose: () => void;
}) {
  const { profile, active, update, navigate, service, toast } = useGame();
  const [face, setFace] = useState(
    target.type === "omen" ? (target.faceIndex ?? 0) : 0,
  );
  const [rolling, setRolling] = useState(false);
  const item = target.item;
  if (target.type === "legend") {
    const l = target.item;
    return (
      <Modal
        title={l.name}
        eyebrow={l.region}
        onClose={onClose}
        className="legend-inspector"
      >
        <LegendArt id={l.id} className="inspect-portrait" />
        <div className="inspect-legend-meta">
          <span>{l.archetype}</span>
          <span>
            <Icon name="heart" size={14} />
            {l.hp} Life
          </span>
        </div>
        <p className="rules-copy">
          <Icon name="wind" size={16} /> Initiative +{l.initiativeBonus} ·{" "}
          {l.class}
        </p>
        <AffinityLine ids={l.affinities} />
        <p className="lore">{l.lore}</p>
        <LegendUnlockOptions id={l.id} />
        <SectionLabel>PASSIVE</SectionLabel>
        <p className="rules-copy">{l.passive}</p>
        <SectionLabel right={<span>{l.active.timing}</span>}>
          {l.active.name}
        </SectionLabel>
        <p>
          {requirementText(l.active.requirement)} · {l.active.text}
        </p>
        <SectionLabel>MASTERY</SectionLabel>
        <p>{profile.mastery[l.id] ?? 0} Mastery XP</p>
        <SectionLabel>RECOMMENDED OMENS</SectionLabel>
        <div className="inspect-dice-row">
          {l.diceSlots.map((n, i) => (
            <Omen key={i} definition={omenById[`standard-d${n}`]} small />
          ))}
        </div>
        <SectionLabel>COMPATIBLE CARDS</SectionLabel>
        <p>
          {cardsFor(l.id)
            .map((c) => c.name)
            .join(" · ")}
        </p>
        <div className="tag-row">
          {l.approaches.map((a) => (
            <span key={a}>{a}</span>
          ))}
        </div>
        {profile.ownedLegends.includes(l.id) && (
          <PrimaryButton
            onClick={() => {
              const build =
                profile.loadouts.find((b) => b.legend === l.id) ??
                STARTERS[l.id];
              update({ ...profile, activeId: build.id });
              onClose();
              navigate("loadout");
              toast(`${l.name} selected.`);
            }}
          >
            Choose {l.name}
          </PrimaryButton>
        )}
        <p className="cultural-note">
          Creative game interpretation of folklore.
        </p>
      </Modal>
    );
  }
  if (target.type === "card") {
    const c = target.item;
    const starred = profile.favorites.includes(c.id);
    return (
      <Modal
        title={c.name}
        eyebrow={`${c.set} #${String(c.collectorNumber).padStart(3, "0")} · ${c.rarity} · ${c.timing}`}
        onClose={onClose}
      >
        <AffinityLine requirement={c.affinityRequirements} />
        <CardArt card={c} className="inspect-card-art" />
        <div className="requirement-large">
          <span>ACTIVATION</span>
          <strong>{c.requirementLabel}</strong>
        </div>
        <p className="card-effect-large">{c.text}</p>
        <details className="card-function" open>
          <summary>What happens when I play this?</summary>
          {cardRuleDetails(c).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </details>
        <p className="helper-text">
          {cardCompatibilityReason(legendById[active.legend], c)}
        </p>
        <p className="helper-text">
          Compatible:{" "}
          {LEGENDS.filter((l) =>
            cardsFor(l.id).some((card) => card.id === c.id),
          )
            .map((l) => l.name)
            .join(" · ")}
        </p>
        {!profile.ownedCards.includes(c.id) && (
          <PrimaryButton
            onClick={() => {
              try {
                update(service.purchaseCard(profile, c.id));
                toast("Card added to your collection.");
              } catch (e) {
                toast((e as Error).message);
              }
            }}
          >
            Unlock with {CARD_COIN_PRICE[c.rarity]} Coins
          </PrimaryButton>
        )}
        <div className="detail-rows">
          <div>
            <span>Approach</span>
            <b>{c.category}</b>
          </div>
          <div>
            <span>Timing</span>
            <b>Priority {c.priority}</b>
          </div>
          <div>
            <span>Availability</span>
            <b>Reusable throughout the Match</b>
          </div>
        </div>
        <SecondaryButton
          icon="star"
          onClick={() =>
            update({
              ...profile,
              favorites: starred
                ? profile.favorites.filter((id) => id !== c.id)
                : [...profile.favorites, c.id],
            })
          }
        >
          {starred ? "Remove favorite" : "Add to favorites"}
        </SecondaryButton>
      </Modal>
    );
  }
  if (target.type === "omen") {
    const d = target.item;
    const budget = omenBudget(d);
    return (
      <Modal
        title={d.name}
        eyebrow={`D${d.size} · ${d.rarity}`}
        onClose={onClose}
      >
        <p className="die-shape-label">
          {DIE_SHAPES[d.size]} · {d.size} faces
        </p>
        <div className="die-inspect-display">
          <Omen
            definition={d}
            face={d.faces[face]}
            skin={profile.skin}
            rolling={rolling}
            onClick={() => {
              setRolling(true);
              setFace((face + 1) % d.size);
              setTimeout(() => setRolling(false), 400);
              audioCue("roll", profile.settings);
            }}
          />
        </div>
        <p>{d.description}</p>
        <SectionLabel right={<span>POSITION {face + 1}</span>}>
          ORDERED FACES
        </SectionLabel>
        <div className="face-grid">
          {d.faces.map((f, i) => (
            <button
              className={`face-${omenFace(f).kind.toLowerCase()} ${i === face ? "selected" : ""}`}
              aria-label={omenFace(f).name}
              key={i}
              onClick={() => setFace(i)}
            >
              <small>{i + 1}</small>
              <strong>{omenFace(f).icon}</strong>
              <span>{omenFace(f).name}</span>
            </button>
          ))}
        </div>
        <FaceExplanation face={d.faces[face]} />
        <div className="tag-row">
          {d.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <div className="detail-rows">
          <div>
            <span>Flip opposite</span>
            <b>
              {face + 1} ↔ {d.opposites[face] + 1}
            </b>
          </div>
          <div>
            <span>Face budget · mean</span>
            <b>{budget.mean.toFixed(2)}</b>
          </div>
          <div>
            <span>Void faces</span>
            <b>{Math.round(budget.blankShare * 100)}%</b>
          </div>
          <div>
            <span>Version</span>
            <b>{d.mechanicalVersion}</b>
          </div>
        </div>
        <p className="helper-text">
          Omen Skins change appearance and sound only.
        </p>
      </Modal>
    );
  }
  if (target.type === "cosmetic") {
    const c = target.item;
    const owned = profile.cosmetics.includes(c.id);
    return (
      <Modal
        title={c.name}
        eyebrow={`${c.kind} · ${c.rarity}`}
        onClose={onClose}
      >
        <div
          className="cosmetic-preview"
          style={{ "--cosmetic-color": c.color } as React.CSSProperties}
        >
          {c.kind === "Omen Skin" ? (
            <Omen
              definition={omenById["standard-d12"]}
              face={omenById["standard-d12"].faces[face % 12]}
              skin={c.id}
              rolling={rolling}
              onClick={() => {
                setFace((face + 3) % 12);
                setRolling(true);
                audioCue("roll", profile.settings);
                setTimeout(() => setRolling(false), 500);
              }}
            />
          ) : (
            <Icon name={c.icon} size={95} />
          )}
        </div>
        <span className="cosmetic-only">
          <Icon name="guard" size={14} />
          COSMETIC ONLY · NO GAMEPLAY ADVANTAGE
        </span>
        <p className="lore">{c.description}</p>
        {c.earned && !owned ? (
          <SecondaryButton icon="lock" disabled onClick={() => {}}>
            Earned through achievement
          </SecondaryButton>
        ) : owned ? (
          <PrimaryButton
            icon="check"
            onClick={() => {
              if (c.kind === "Omen Skin") {
                update({ ...profile, skin: c.id });
                toast(`${c.name} equipped.`);
              } else toast("This cosmetic is in your collection.");
              onClose();
            }}
          >
            {c.kind === "Omen Skin" ? "Equip Omen Skin" : "In your collection"}
          </PrimaryButton>
        ) : (
          <PrimaryButton
            icon={c.currency}
            disabled={profile[c.currency] < c.price}
            onClick={() => {
              try {
                update(service.purchaseCosmetic(profile, c.id));
                toast("Cosmetic added to your collection.");
              } catch (e) {
                toast((e as Error).message);
              }
            }}
          >
            Unlock · {c.price} {c.currency}
          </PrimaryButton>
        )}
        {!owned && !c.earned && profile[c.currency] < c.price && (
          <p className="helper-text">
            Not enough {c.currency}. Keep playing to earn local rewards.
          </p>
        )}
        <p className="helper-text">
          Preview uses a local mock economy. No real payment.
        </p>
      </Modal>
    );
  }
  return (
    <Modal title={item.name} onClose={onClose}>
      {null}
    </Modal>
  );
}
