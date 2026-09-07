import { LEGENDS, legendById } from "../content/legends";
import { LEGEND_COIN_PRICE } from "../content/acquisition";
import { LEGEND_JOURNEY, legendJourney } from "../content/legend-progression";
import { STARTERS } from "../content/loadouts";
import { cardById } from "../content/cards";
import { omenById } from "../content/omens";
import type { LegendId } from "../engine/types";
import { Icon } from "./components";
import { useGame } from "./context";
import "./legend-progression.css";

export function LegendJourney({
  compact = false,
  onOpen,
}: {
  compact?: boolean;
  onOpen?: () => void;
}) {
  const { profile, navigate, service, update, toast } = useGame();
  const { available, next, remaining } = legendJourney(profile);
  const allOwned = LEGENDS.every((l) => profile.ownedLegends.includes(l.id));
  const title = available.length
    ? allOwned
      ? "Your Journey reward is ready"
      : "Choose your next Legend"
    : next
      ? `${remaining} match${remaining === 1 ? "" : "es"} to your next reward`
      : "Legend Journey complete";
  const open = onOpen ?? (() => navigate("legends"));
  return (
    <section
      className={`legend-journey ${compact ? "is-compact" : ""}`}
      aria-label="Legend Journey"
    >
      <div className="legend-journey-heading">
        <Icon name="legends" size={22} />
        <div>
          <small>LEGEND JOURNEY</small>
          <h3>{title}</h3>
        </div>
        <span>
          {profile.ownedLegends.length}/{LEGENDS.length}
          <small>OWNED</small>
        </span>
      </div>
      <div
        className="legend-journey-track"
        role="progressbar"
        aria-label="Completed matches toward next Legend reward"
        aria-valuemin={0}
        aria-valuemax={next ?? 50}
        aria-valuenow={Math.min(profile.matches, next ?? 50)}
      >
        <i
          style={{
            width: `${Math.min(100, (profile.matches / (next ?? 50)) * 100)}%`,
          }}
        />
      </div>
      {compact ? (
        <button className="legend-journey-link" onClick={open}>
          {available.length ? "View reward" : "View Legend Journey"}
          <Icon name="right" size={16} />
        </button>
      ) : (
        <>
          <p>
            Begin with Basajaun and Anansi. Every completed match counts, win or
            lose — including Training.
          </p>
          <ol className="legend-milestones">
            {LEGEND_JOURNEY.milestones.map((m) => {
              const claimed = profile.legendJourneyClaims.includes(m);
              const ready = available.includes(m);
              return (
                <li
                  key={m}
                  className={claimed ? "claimed" : ready ? "ready" : ""}
                >
                  <span>
                    <Icon
                      name={claimed ? "check" : ready ? "gift" : "lock"}
                      size={17}
                    />
                  </span>
                  <strong>{m} matches</strong>
                  <small>
                    {claimed
                      ? "Claimed"
                      : ready
                        ? "Choose reward"
                        : "Legend choice"}
                  </small>
                </li>
              );
            })}
          </ol>
          <p className="legend-journey-note">
            {profile.matches} completed ·{" "}
            {available.length
              ? `${available.length} unclaimed reward${available.length === 1 ? "" : "s"}`
              : next
                ? `Next choice at ${next} matches`
                : "All milestones claimed"}
            . Early unlocks never consume a Journey choice.
          </p>
          {available.length > 0 &&
            (allOwned ? (
              <button
                className="legend-unlock-free"
                onClick={() => {
                  try {
                    update(service.claimLegendMilestone(profile, available[0]));
                    toast(
                      `${LEGEND_JOURNEY.completeCollectionCoins} Coins claimed.`,
                    );
                  } catch (e) {
                    toast((e as Error).message);
                  }
                }}
              >
                Claim {LEGEND_JOURNEY.completeCollectionCoins} Coins ·{" "}
                {available[0]} matches
              </button>
            ) : (
              <p className="legend-choice-prompt">
                Select any locked Legend below to claim your free choice.
              </p>
            ))}
          <p className="legend-journey-note">
            Already own every Legend? Each remaining milestone grants{" "}
            {LEGEND_JOURNEY.completeCollectionCoins} Coins instead.
          </p>
        </>
      )}
    </section>
  );
}

export function LegendUnlockOptions({ id }: { id: LegendId }) {
  const { profile, service, update, toast } = useGame();
  const { available, next } = legendJourney(profile);
  const kit = STARTERS[id];
  if (profile.ownedLegends.includes(id)) return null;
  const unlock = (source: "journey" | "coins" | "gems") => {
    try {
      const nextProfile =
        source === "journey"
          ? service.claimLegendMilestone(profile, available[0], id)
          : service.unlockLegend(profile, id, source);
      update(nextProfile);
      toast(
        `${legendById[id].name} unlocked. Your Hand and three Omens are ready.`,
      );
    } catch (e) {
      toast((e as Error).message);
    }
  };
  return (
    <section
      className="legend-unlock"
      aria-label={`Unlock ${legendById[id].name}`}
    >
      <small>UNLOCK THE LEGEND + STARTER LOADOUT</small>
      <h3>A new way to play</h3>
      <p>
        Every route includes the same Legend, four shared Cards and three Omens.
        Permanent ownership.
      </p>
      <details>
        <summary>Preview the included Loadout</summary>
        <strong>HAND</strong>
        <p>{kit.cards.map((c) => cardById[c].name).join(" · ")}</p>
        <strong>OMENS</strong>
        <p>{kit.dice.map((d) => omenById[d].name).join(" · ")}</p>
        <small>
          One signature Omen + two numbered Omens. Items you already own are
          kept; no duplicates.
        </small>
      </details>
      {available.length ? (
        <button
          className="legend-unlock-free"
          onClick={() => unlock("journey")}
        >
          <Icon name="gift" size={18} />
          Claim free · {available[0]}-match reward
        </button>
      ) : (
        <div className="legend-unlock-earned">
          <Icon name="lock" size={15} />
          <span>
            {next
              ? `Free choice at ${next} completed matches · ${profile.matches}/${next}`
              : "All Journey choices claimed"}
          </span>
        </div>
      )}
      <div className="legend-unlock-prices">
        <button
          disabled={profile.coins < LEGEND_COIN_PRICE}
          onClick={() => unlock("coins")}
        >
          <strong>{LEGEND_COIN_PRICE} Coins</strong>
          <small>Earn through play</small>
        </button>
        <button
          disabled={profile.gems < LEGEND_JOURNEY.gemPrice}
          onClick={() => unlock("gems")}
        >
          <strong>{LEGEND_JOURNEY.gemPrice} Gems</strong>
          <small>Premium currency</small>
        </button>
      </div>
      <p className="legend-journey-note">
        Your wallet: {profile.coins} Coins · {profile.gems} Gems. Buying early
        preserves every play-earned choice.
      </p>
      {service.isMock && (
        <p className="legend-journey-note">
          Local progression preview. Wallets and unlocks are saved on this
          device. Real-money checkout is not connected.
        </p>
      )}
    </section>
  );
}
