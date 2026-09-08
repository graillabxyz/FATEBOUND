import { useState } from "react";
import { useGame } from "./context";
import { PACK_CONFIG } from "../content/acquisition";
import { cardById } from "../content/cards";
import { GameplayCard, PrimaryButton, Modal } from "./components";
export function Packs() {
  const { profile, service, update, toast } = useGame();
  const run = (f: () => typeof profile) => {
    try {
      update(f());
    } catch (e) {
      toast((e as Error).message);
    }
  };
  const receipt = profile.pendingPack;
  const [closed, setClosed] = useState(false);
  return (
    <section className="packs-panel">
      <small>FIRST LIGHT · SHARED CARD POOL</small>
      <h2>Two Cards. New possibilities.</h2>
      <p>
        Expand your Hand options. Every rarity can compete. Choose specific
        Cards with Coins from the collection, or open a two-Card booster.
      </p>
      <p>
        {profile.packs} earned boosters · {profile.coins} Coins
      </p>
      <PrimaryButton
        disabled={
          !receipt && profile.packs === 0 && profile.coins < PACK_CONFIG.price
        }
        onClick={() => {
          setClosed(false);
          run(() =>
            service.openPack(
              profile,
              crypto.getRandomValues(new Uint32Array(1))[0],
            ),
          );
        }}
      >
        {receipt
          ? "Continue opening"
          : profile.packs
            ? "Open earned booster"
            : `Open 2-Card booster · ${PACK_CONFIG.price} Coins`}
      </PrimaryButton>
      <details>
        <summary>Booster contents and odds</summary>
        <p>
          Exactly 2 Cards. Each slot has separate rarity odds; no guaranteed
          Rare.
        </p>
        {PACK_CONFIG.slots.map((weights, i) => (
          <p key={i}>
            Card {i + 1}:{" "}
            {Object.entries(weights)
              .map(([r, w]) => `${r} ${w}%`)
              .join(" · ")}
          </p>
        ))}
        <p>
          Unowned Cards are preferred within the rolled rarity. If that rarity
          is complete, a duplicate grants {PACK_CONFIG.duplicateCoins} Coins.
          The two Cards in a booster are different. Outcomes are saved before
          revealing.
        </p>
      </details>
      <p className="helper-text">
        Earn boosters with your first win, every 10 matches, each 800 Legend
        Mastery XP and the free Season Path. Device-local alpha economy; no
        real-money booster sales.
      </p>
      {receipt && !closed && (
        <Modal
          title="Your two Cards"
          eyebrow="FIRST LIGHT"
          onClose={() => setClosed(true)}
        >
          <div className="pack-reveal-row">
            {receipt.cards.map((id, i) =>
              receipt.revealed > i ? (
                <article
                  key={i}
                  className={`pack-revealed rarity-${cardById[id].rarity}`}
                >
                  <GameplayCard card={cardById[id]} />
                  <p>
                    {cardById[id].rarity} ·{" "}
                    {receipt.duplicates[i]
                      ? `Duplicate · +${PACK_CONFIG.duplicateCoins} Coins`
                      : "Added to collection"}
                  </p>
                </article>
              ) : (
                <button
                  key={i}
                  className="pack-card-back"
                  disabled={receipt.revealed !== i}
                  onClick={() =>
                    run(() => service.revealPack(profile, receipt.id))
                  }
                >
                  ◇<span>Reveal Card {i + 1}</span>
                </button>
              ),
            )}
          </div>
          {receipt.revealed === 2 && (
            <PrimaryButton
              onClick={() => run(() => service.finishPack(profile, receipt.id))}
            >
              Done
            </PrimaryButton>
          )}
        </Modal>
      )}
    </section>
  );
}
