import {
  OMEN_JOURNEY,
  availableOmenMilestones,
  unownedSignatures,
  omenPrice,
} from "../content/collection-progression";
import { omenById } from "../content/omens";
import { legendById } from "../content/legends";
import { cardById } from "../content/cards";
import { useGame } from "./context";
import { Icon } from "./components";
export function AcquisitionNotice({ forLegend }: { forLegend?: string } = {}) {
  const { profile } = useGame();
  const receipt = profile.acquisitions.at(-1);
  if (
    !receipt ||
    (forLegend &&
      !receipt.items.some((i) => i.kind === "legend" && i.id === forLegend))
  )
    return null;
  return (
    <aside className="acquisition-notice" aria-live="polite">
      <small>
        {receipt.bonusOmen
          ? "A GIFT ALONG THE PATH"
          : "LATEST COLLECTION REWARD"}
      </small>
      <strong>
        {receipt.items
          .map((item) =>
            item.kind === "legend"
              ? `${legendById[item.id].name} · Legend`
              : item.kind === "omen"
                ? `${omenById[item.id].name} · Omen`
                : item.kind === "card"
                  ? cardById[item.id].name
                  : "2-Card booster",
          )
          .join(" + ")}
      </strong>
      {receipt.bonusOmen && (
        <p>
          {receipt.items.some((i) => i.kind === "omen")
            ? "Your earned Legend brought a signature Omen. Both are now yours."
            : "You already own the bonus Omen, so you received a 2-Card booster instead."}
        </p>
      )}
    </aside>
  );
}
export function OmenJourney({
  compact = false,
  onOpen,
}: {
  compact?: boolean;
  onOpen?: () => void;
}) {
  const { profile, service, update, toast, navigate } = useGame();
  const available = availableOmenMilestones(profile),
    next = OMEN_JOURNEY.milestones.find((m) => m > profile.matches);
  const choices = unownedSignatures(profile.ownedOmens);
  return (
    <section className="legend-journey omen-journey" aria-label="Omen Journey">
      <div className="legend-journey-heading">
        <Icon name="dice" />
        <div>
          <small>OMEN JOURNEY</small>
          <h3>
            {available.length
              ? choices.length
                ? "A signature Omen is waiting"
                : "Your booster is waiting"
              : next
                ? `Next Omen choice · ${next} matches`
                : "Omen Journey complete"}
          </h3>
        </div>
      </div>
      {!compact && (
        <>
          <p>
            Choose one signature Omen at 10, 25, 45 and 70 completed matches.
            These are shared collectibles: every Legend can equip them.
          </p>
          <ol className="legend-milestones">
            {OMEN_JOURNEY.milestones.map((m) => (
              <li
                key={m}
                className={
                  profile.omenJourneyClaims.includes(m)
                    ? "claimed"
                    : available.includes(m)
                      ? "ready"
                      : ""
                }
              >
                <strong>{m} matches</strong>
                <small>
                  {profile.omenJourneyClaims.includes(m)
                    ? "Claimed"
                    : available.includes(m)
                      ? "Ready"
                      : "Omen choice"}
                </small>
              </li>
            ))}
          </ol>
          <p className="legend-journey-note">
            Own all six signature Omens? Claim one 2-Card booster instead.
          </p>
        </>
      )}
      {available.length > 0 && !choices.length ? (
        <button
          className="legend-unlock-free"
          onClick={() => {
            try {
              update(service.claimOmenMilestone(profile, available[0]));
              toast("2-Card booster added.");
            } catch (e) {
              toast((e as Error).message);
            }
          }}
        >
          Claim 2-Card booster · {available[0]} matches
        </button>
      ) : compact ? (
        <button
          className="legend-journey-link"
          onClick={onOpen ?? (() => navigate("omens"))}
        >
          View Omens
          <Icon name="right" size={16} />
        </button>
      ) : available.length > 0 ? (
        <p className="legend-choice-prompt">
          Inspect any locked signature Omen below to claim your choice.
        </p>
      ) : null}
    </section>
  );
}
export function OmenUnlockOptions({ id }: { id: string }) {
  const { profile, service, update, toast } = useGame();
  const d = omenById[id],
    signature = d.tags.includes("signature"),
    available = availableOmenMilestones(profile);
  if (profile.ownedOmens.includes(id))
    return (
      <p className="helper-text">Owned · available in Loadout building.</p>
    );
  const run = (source: "journey" | "coins" | "gems") => {
    try {
      update(
        source === "journey"
          ? service.claimOmenMilestone(profile, available[0], id)
          : service.purchaseOmen(profile, id, source),
      );
      toast(`${d.name} added to your Omen collection.`);
    } catch (e) {
      toast((e as Error).message);
    }
  };
  return (
    <section className="legend-unlock">
      <small>{signature ? "SIGNATURE OMEN" : "NUMBERED OMEN"}</small>
      <h3>Unlock this Omen</h3>
      <p>
        One permanent collectible. Equip it on any compatible Legend. No Cards
        or Legend included.
      </p>
      {signature && available.length > 0 && (
        <button className="legend-unlock-free" onClick={() => run("journey")}>
          Claim free · {available[0]}-match Omen choice
        </button>
      )}
      <div className="legend-unlock-prices">
        <button
          disabled={profile.coins < omenPrice(id)}
          onClick={() => run("coins")}
        >
          <strong>{omenPrice(id)} Coins</strong>
          <small>Earn through play</small>
        </button>
        {signature && (
          <button
            disabled={profile.gems < OMEN_JOURNEY.signatureGems}
            onClick={() => run("gems")}
          >
            <strong>{OMEN_JOURNEY.signatureGems} Gems</strong>
            <small>Premium currency</small>
          </button>
        )}
      </div>
      <p className="legend-journey-note">
        {profile.coins} Coins · {profile.gems} Gems. Local wallet preview;
        real-money checkout is not connected.
      </p>
    </section>
  );
}
