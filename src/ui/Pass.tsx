import { GAME } from "../content/config";
import { PASS_REWARDS } from "../content/economy";
import { seasonLevel } from "../services/profile";
import { useGame } from "./context";
import { Icon, LegendArt, PageHeading, PrimaryButton } from "./components";
import { track } from "../services/analytics";
export default function Pass() {
  const { profile, service, update, toast, open } = useGame();
  const current = seasonLevel(profile);
  const claim = (lvl: number, track: "free" | "premium") => {
    const p = service.claimPass(profile, lvl, track);
    update(p);
    if (p !== profile) toast("Reward claimed.");
  };
  const claimAll = () => {
    let p = profile;
    for (let i = 1; i <= current; i++) {
      p = service.claimPass(p, i, "free");
      if (p.premium) p = service.claimPass(p, i, "premium");
    }
    update(p);
    toast(
      p !== profile ? "Your rewards are ready." : "No rewards to claim yet.",
    );
  };
  return (
    <div className="page pass-page">
      <PageHeading eyebrow="SEASON 01" title="Season Path">
        <button className="text-button" onClick={() => open("quests")}>
          Quests
          <Icon name="right" size={14} />
        </button>
      </PageHeading>
      <div className="season-hero">
        <LegendArt id="quetzalcoatl" />
        <div>
          <span className="eyebrow">THE FIRST CHAPTER</span>
          <h2>The First Light</h2>
          <p>Every match leaves a mark.</p>
          <span className="season-countdown">
            <Icon name="timer" size={13} />
            {Math.max(
              0,
              Math.ceil(
                (Date.parse(GAME.season.endsAt) - Date.now()) / 86400000,
              ),
            )}{" "}
            days remaining
          </span>
        </div>
      </div>
      <div className="season-progress">
        <span className="path-level">{current}</span>
        <div>
          <span>
            SEASON LEVEL <b>{profile.seasonXp % 150} / 150 XP</b>
          </span>
          <div className="progress-track">
            <i
              style={{ width: `${((profile.seasonXp % 150) / 150) * 100}%` }}
            />
          </div>
        </div>
        <button className="text-button" onClick={claimAll}>
          Claim all
        </button>
      </div>
      <button className="premium-banner" onClick={() => open("upgrade")}>
        <Icon name="crown" size={24} />
        <span>
          <strong>
            {profile.premium
              ? "Premium Path unlocked"
              : "A more personal journey"}
          </strong>
          <small>Legend looks, dice skins & more. Cosmetic rewards.</small>
        </span>
        <Icon name="right" size={18} />
      </button>
      <div className="ladder-label">
        <span>FREE PATH</span>
        <Icon name="sun" size={18} />
        <span>PREMIUM PATH</span>
      </div>
      <div className="pass-ladder">
        {PASS_REWARDS.map((r) => (
          <div
            className={`pass-node ${r.level === current ? "current" : ""} ${r.level < current ? "past" : ""}`}
            key={r.level}
          >
            {(["free", "premium"] as const).map((t) => (
              <button
                key={t}
                className={`path-reward ${t}`}
                disabled={
                  r.level > current ||
                  profile.claimedPass.includes(
                    `${GAME.season.id}:${r.level}:${t}`,
                  ) ||
                  (t === "premium" && !profile.premium)
                }
                onClick={() => claim(r.level, t)}
              >
                <Icon
                  name={
                    r[t].type === "coins"
                      ? "coins"
                      : r[t].type === "gems"
                        ? "gems"
                        : t === "free"
                          ? "loadout"
                          : "dice"
                  }
                  size={25}
                />
                <strong>
                  {r[t].type === "cosmetic" &&
                  profile.cosmetics.includes(
                    t === "free" ? "first-light" : "obsidian",
                  ) &&
                  !profile.claimedPass.includes(
                    `${GAME.season.id}:${r.level}:${t}`,
                  )
                    ? "50 Coins · duplicate"
                    : r[t].label}
                </strong>
                <small>
                  {profile.claimedPass.includes(
                    `${GAME.season.id}:${r.level}:${t}`,
                  )
                    ? "CLAIMED"
                    : r.level <= current && (t === "free" || profile.premium)
                      ? "CLAIM"
                      : t === "premium"
                        ? "PREMIUM"
                        : "LOCKED"}
                </small>
              </button>
            ))}
            <div className="path-marker">
              <span>{r.level}</span>
            </div>
          </div>
        ))}
      </div>
      <PrimaryButton
        onClick={() => {
          track("battle_pass_viewed");
          open("play");
        }}
      >
        Continue your journey
      </PrimaryButton>
    </div>
  );
}
