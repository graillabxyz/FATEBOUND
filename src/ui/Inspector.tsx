import { useState } from "react";
import type { Inspect } from "./context";
import { useGame } from "./context";
import { STARTERS } from "../content/loadouts";
import { dieById, dieBudget } from "../content/dice";
import { legendById } from "../content/legends";
import {
  Die,
  CARD_ICONS,
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
  const { profile, update, navigate, service, toast } = useGame();
  const [face, setFace] = useState(0);
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
            {l.hp} HP
          </span>
        </div>
        <p className="rules-copy">
          <Icon name="wind" size={16} /> Initiative +{l.initiativeBonus} ·{" "}
          {l.class}
        </p>
        <p className="lore">{l.lore}</p>
        <SectionLabel>PASSIVE</SectionLabel>
        <p className="rules-copy">{l.passive}</p>
        <SectionLabel right={<span>{l.active.timing}</span>}>
          {l.active.name}
        </SectionLabel>
        <p>{l.active.text}</p>
        <div className="inspect-dice-row">
          {l.diceSlots.map((n, i) => (
            <Die key={i} definition={dieById[`standard-d${n}`]} small />
          ))}
        </div>
        <div className="tag-row">
          {l.approaches.map((a) => (
            <span key={a}>{a}</span>
          ))}
        </div>
        <PrimaryButton
          onClick={() => {
            const build =
              profile.loadouts.find((b) => b.legend === l.id) ?? STARTERS[l.id];
            update({ ...profile, activeId: build.id });
            onClose();
            navigate("loadout");
            toast(`${l.name} selected.`);
          }}
        >
          Choose {l.name}
        </PrimaryButton>
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
        eyebrow={`${legendById[c.legend].name} · ${c.timing} · ${c.category}`}
        onClose={onClose}
      >
        <LegendArt id={c.legend} className="inspect-card-art">
          <span className="inspect-card-symbol">
            <Icon name={CARD_ICONS[c.category]} size={62} />
          </span>
        </LegendArt>
        <div className="requirement-large">
          <span>ACTIVATION</span>
          <strong>{c.requirementLabel}</strong>
        </div>
        <p className="card-effect-large">{c.text}</p>
        <div className="detail-rows">
          <div>
            <span>Approach</span>
            <b>{c.archetype}</b>
          </div>
          <div>
            <span>Timing</span>
            <b>Priority {c.priority}</b>
          </div>
          <div>
            <span>Availability</span>
            <b>Reusable every round</b>
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
  if (target.type === "die") {
    const d = target.item;
    const budget = dieBudget(d);
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
          <Die
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
              className={i === face ? "selected" : ""}
              key={i}
              onClick={() => setFace(i)}
            >
              <small>{i + 1}</small>
              <strong>{f.displayIcon}</strong>
              <span>{f.type === "symbol" ? f.effectId : f.type}</span>
            </button>
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
            <span>Blank faces</span>
            <b>{Math.round(budget.blankShare * 100)}%</b>
          </div>
          <div>
            <span>Version</span>
            <b>{d.mechanicalVersion}</b>
          </div>
        </div>
        <p className="helper-text">
          Dice skins change appearance and sound only.
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
          {c.kind === "Dice skin" ? (
            <Die
              definition={dieById["standard-d12"]}
              face={dieById["standard-d12"].faces[face % 12]}
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
              if (c.kind === "Dice skin") {
                update({ ...profile, skin: c.id });
                toast(`${c.name} equipped.`);
              } else toast("This cosmetic is in your collection.");
              onClose();
            }}
          >
            {c.kind === "Dice skin" ? "Equip dice skin" : "In your collection"}
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
