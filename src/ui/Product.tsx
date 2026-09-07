import { TutorialSteps, Glossary } from "./Help";
import { ENABLE_DEV_TOOLS } from "../dev/gate";
import { useState } from "react";
import { useGame } from "./context";
import { LEGENDS, legendById } from "../content/legends";
import { omenById } from "../content/omens";
import { COSMETICS, QUESTS } from "../content/economy";
import { GAME } from "../content/config";
import { level, masteryLevel, rankLabel, periodKey } from "../services/profile";
import {
  Omen,
  EmptyState,
  Icon,
  IconButton,
  LegendArt,
  PageHeading,
  PrimaryButton,
  RankBadge,
  RewardTile,
  SecondaryButton,
  SectionLabel,
} from "./components";
export function ProfilePage() {
  const { profile, active, update, toast, open } = useGame();
  const [name, setName] = useState(profile.name);
  const l = legendById[active.legend];
  return (
    <div className="page profile-page">
      <PageHeading eyebrow="YOUR STORY, SO FAR" title="Player profile">
        <IconButton
          icon="settings"
          label="Settings"
          onClick={() => open("settings")}
        />
      </PageHeading>
      <div className="profile-hero">
        <LegendArt id={l.id} />
        <div>
          <RankBadge label={rankLabel(profile)} />
          <h2>{profile.name}</h2>
          <p>{profile.title}</p>
          <span>ACCOUNT LEVEL {level(profile)}</span>
        </div>
      </div>
      <div className="profile-stats">
        <RewardTile
          icon="trophy"
          value={String(profile.wins)}
          label="Victories"
        />
        <RewardTile
          icon="flame"
          value={String(profile.streak)}
          label="Win streak"
        />
        <RewardTile
          icon="attack"
          value={String(profile.matches)}
          label="Matches"
        />
      </div>
      <SectionLabel>FEATURED OMEN</SectionLabel>
      <p>
        {omenById[active.dice[0]].name} · d{omenById[active.dice[0]].size} ·
        Mechanical collectible
      </p>
      <SectionLabel>FEATURED OMEN SKIN</SectionLabel>
      <p>
        {COSMETICS.find((c) => c.id === profile.skin)?.name ?? "Heartwood"} ·
        Cosmetic only
      </p>
      <label className="field-label">
        DISPLAY NAME
        <div className="inline-field">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
          />
          <button
            onClick={() => {
              if (name.trim()) {
                update({ ...profile, name: name.trim() });
                toast("Display name updated.");
              }
            }}
          >
            Save
          </button>
        </div>
      </label>
      <SectionLabel right={<span>6 LEGENDS</span>}>LEGEND MASTERY</SectionLabel>
      <div className="mastery-list">
        {LEGENDS.map((l) => (
          <div key={l.id}>
            <LegendArt id={l.id} />
            <span>
              <strong>{l.name}</strong>
              <span className="progress-track">
                <i
                  style={{
                    width: `${((profile.mastery[l.id] % 200) / 200) * 100}%`,
                  }}
                />
              </span>
              <small>{profile.mastery[l.id] % 200} / 200 XP</small>
            </span>
            <b>
              {masteryLevel(profile, l.id)}
              <small>MASTERY</small>
            </b>
          </div>
        ))}
      </div>
      <SectionLabel>PRESTIGE</SectionLabel>
      <div className="prestige-card">
        <Icon name="crown" size={28} />
        <div>
          <strong>A legacy you earn</strong>
          <p>
            Mastery cosmetics and seasonal rank titles tell the story of your
            play.
          </p>
        </div>
      </div>
      <div className="detail-rows">
        <div>
          <span>Highest local rank</span>
          <b>
            {rankLabel({ ...profile, rankPoints: profile.highestRankPoints })}
          </b>
        </div>
        <div>
          <span>Best win streak</span>
          <b>{profile.bestStreak}</b>
        </div>
        <div>
          <span>Favorite Legend</span>
          <b>{l.name}</b>
        </div>
        <div>
          <span>Season history</span>
          <b>First Light · in progress</b>
        </div>
      </div>
      <p className="helper-text">
        Local profile · online rank and seasonal results will come from the
        match server.
      </p>
    </div>
  );
}
export function SocialPage() {
  const { profile, toast, open } = useGame();
  const [tab, setTab] = useState("Friends");
  const [code, setCode] = useState("");
  return (
    <div className="page social-page">
      <PageHeading eyebrow="THE STORIES WE SHARE" title="The gathering">
        <IconButton
          icon="plus"
          label="Add friend"
          onClick={() => open("friend")}
        />
      </PageHeading>
      <div className="segmented">
        {["Friends", "Recent", "Rankings"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Friends" ? (
        <>
          <EmptyState
            icon="social"
            title="Every rival has a story"
            text="Bring a friend into yours. Friends, profiles, and direct challenges will connect here when online play arrives."
          />
          <label className="field-label">
            FRIEND CODE
            <div className="inline-field">
              <input
                placeholder="Enter a friend code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <button
                onClick={() =>
                  toast(
                    code.trim()
                      ? "Friend requests need the online service. No request was sent."
                      : "Enter a friend code first.",
                  )
                }
              >
                Add
              </button>
            </div>
          </label>
          <div className="service-note">
            <i />
            Social service · coming online later
          </div>
        </>
      ) : tab === "Recent" ? (
        profile.recent.length ? (
          <div className="recent-list">
            {profile.recent.map((r, i) => (
              <div key={i}>
                <LegendArt id={r.legend} />
                <span>
                  <strong>{legendById[r.legend].name}</strong>
                  <small>{r.name}</small>
                </span>
                <b>{r.result}</b>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="attack"
            title="Your first encounter awaits"
            text="Completed matches will appear here. Each opponent is a chance to learn."
          />
        )
      ) : (
        <EmptyState
          icon="trophy"
          title="A place among Legends"
          text="Seasonal rankings will be verified by the online service. Local AI matches are practice, with no global leaderboard position."
        />
      )}
    </div>
  );
}
export function ShopPage() {
  const { inspect, navigate } = useGame();
  const [tab, setTab] = useState("Featured");
  return (
    <div className="page shop-page">
      <PageHeading eyebrow="IDENTITY, NEVER ADVANTAGE" title="The emporium" />
      <div className="horizontal-tabs">
        {[
          "Featured",
          "Legends",
          "Omens",
          "Omen Skins",
          "Cosmetics",
          "Bundles",
        ].map((t) => (
          <button
            className={tab === t ? "active" : ""}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Legends" ? (
        <EmptyState
          icon="legends"
          title="Every Legend is yours"
          text="All six Legends and their gameplay content are unlocked for this foundation. Future unlocks will be earned through play."
        />
      ) : tab === "Omens" ? (
        <>
          <EmptyState
            icon="dice"
            title="Mechanical Omens"
            text="All gameplay Omens are unlocked in this build. Choose them in your Loadout; future unlocks will be earned through play."
          />
          <SecondaryButton onClick={() => navigate("loadout")}>
            Choose your Omens
          </SecondaryButton>
        </>
      ) : tab === "Bundles" ? (
        <EmptyState
          icon="gift"
          title="Thoughtfully gathered"
          text="Cosmetic bundles will arrive with future seasons. Nothing here will change the rules of a match."
        />
      ) : (
        <>
          <button
            className="shop-feature"
            onClick={() => inspect({ type: "cosmetic", item: COSMETICS[1] })}
          >
            <div className="obsidian-orbit">
              <Omen definition={omenById["standard-d12"]} skin="obsidian" />
            </div>
            <span className="eyebrow">FEATURED · COSMETIC ONLY</span>
            <h2>Obsidian Fate</h2>
            <p>Quiet power. No power advantage.</p>
            <span className="shop-price">
              <Icon name="gems" size={16} />
              350 <Icon name="right" size={16} />
            </span>
          </button>
          <div className="shop-grid">
            {COSMETICS.filter(
              (c) =>
                !c.earned &&
                c.price > 0 &&
                (tab !== "Omen Skins" || c.kind === "Omen Skin"),
            ).map((c) => (
              <button
                className="shop-item"
                key={c.id}
                onClick={() => inspect({ type: "cosmetic", item: c })}
              >
                <div className="shop-item-art" style={{ color: c.color }}>
                  {c.kind === "Omen Skin" ? (
                    <Omen definition={omenById["standard-d12"]} skin={c.id} />
                  ) : (
                    <Icon name={c.icon} size={32} />
                  )}
                </div>
                <strong>{c.name}</strong>
                <small>{c.kind}</small>
                <b>
                  <Icon name={c.currency} size={13} />
                  {c.price}
                </b>
              </button>
            ))}
          </div>
        </>
      )}
      <p className="cultural-note">
        <Icon name="guard" size={16} />
        Cosmetics never affect gameplay. Purchases use mock balances; real-money
        payments are disabled.
      </p>
    </div>
  );
}
export function QuestContent() {
  const { profile, service, update, toast } = useGame();
  const [tab, setTab] = useState("daily");
  const today = periodKey("daily");
  const replaced = profile.dailyReplaced.includes(today);
  return (
    <>
      <div className="segmented">
        {["daily", "weekly", "season"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="helper-text">
        Progress through good play. Daily quests refresh at 00:00 UTC.
      </p>
      <div className="quest-list">
        {QUESTS.filter(
          (q) =>
            q.period === tab &&
            (q.id !== "daily-reveal" || replaced) &&
            (q.id !== "daily-control" || !replaced),
        ).map((q) => {
          const key = periodKey(q.period);
          const count = Math.min(
            q.target,
            profile.questCounts[key]?.[q.metric] ?? 0,
          );
          const claimed = profile.claimedQuests.includes(`${key}:${q.id}`);
          return (
            <div className="quest-tile" key={q.id}>
              <span className="quest-icon">
                <Icon
                  name={
                    q.metric === "wins"
                      ? "trophy"
                      : q.metric === "control"
                        ? "control"
                        : q.metric === "guards"
                          ? "guard"
                          : "scroll"
                  }
                />
              </span>
              <div>
                <strong>{q.name}</strong>
                <p>{q.text}</p>
                <div className="progress-track">
                  <i style={{ width: `${(count / q.target) * 100}%` }} />
                </div>
                <small>
                  {count}/{q.target} · {q.xp} Season XP
                </small>
              </div>
              <button
                disabled={count < q.target || claimed}
                onClick={() => {
                  update(service.claimQuest(profile, q.id));
                  toast("Quest reward claimed.");
                }}
              >
                <Icon
                  name={claimed ? "check" : count >= q.target ? "gift" : "lock"}
                  size={18}
                />
              </button>
            </div>
          );
        })}
      </div>
      {tab === "daily" && (
        <SecondaryButton
          icon="flip"
          disabled={
            replaced || profile.claimedQuests.includes(`${today}:daily-control`)
          }
          onClick={() => {
            update(service.replaceDaily(profile));
            toast("Daily quest replaced.");
          }}
        >
          {replaced ? "Daily replacement used" : "Replace “Shape your fate”"}
        </SecondaryButton>
      )}
    </>
  );
}
export function SettingsContent() {
  const { profile, update, open, toast } = useGame();
  const change = (key: string, value: unknown) =>
    update({ ...profile, settings: { ...profile.settings, [key]: value } });
  return (
    <div className="settings-content">
      {(["music", "sfx"] as const).map((k) => (
        <label className="range-setting" key={k}>
          <span>
            {k === "music" ? "Music" : "Sound effects"}
            <b>{profile.settings[k]}%</b>
          </span>
          <input
            aria-label={k === "music" ? "Music volume" : "Sound effects volume"}
            type="range"
            min="0"
            max="100"
            value={profile.settings[k]}
            onChange={(e) => change(k, +e.target.value)}
          />
        </label>
      ))}
      {(["haptics", "reducedMotion", "batterySaver"] as const).map((k) => (
        <label className="toggle-setting" key={k}>
          <span>
            {
              {
                haptics: "Haptic feedback",
                reducedMotion: "Reduced motion",
                batterySaver: "Battery saver",
              }[k]
            }
            <small>
              {k === "reducedMotion"
                ? "Less bounce, no flourish or camera movement"
                : k === "batterySaver"
                  ? "Pause ambient effects and background sound"
                  : "A gentle response to your actions"}
            </small>
          </span>
          <input
            type="checkbox"
            checked={profile.settings[k]}
            onChange={(e) => change(k, e.target.checked)}
          />
        </label>
      ))}
      <SectionLabel>NOTIFICATIONS</SectionLabel>
      {Object.entries(profile.settings.notifications).map(([k, v]) => (
        <label className="toggle-setting compact-setting" key={k}>
          <span>
            {
              (
                {
                  daily: "Daily quests",
                  weekly: "Weekly quests",
                  season: "Season ending",
                  challenge: "Friend challenges",
                  cosmetic: "New cosmetics",
                  rewards: "Path rewards",
                } as Record<string, string>
              )[k]
            }
          </span>
          <input
            type="checkbox"
            checked={v}
            onChange={(e) =>
              change("notifications", {
                ...profile.settings.notifications,
                [k]: e.target.checked,
              })
            }
          />
        </label>
      ))}
      <p className="helper-text">
        Preferences are saved locally. Push delivery is not connected.
      </p>
      <label className="field-label">
        LANGUAGE
        <select
          value={profile.settings.language}
          onChange={(e) => change("language", e.target.value)}
        >
          <option>English</option>
        </select>
      </label>
      <div className="settings-links">
        <button onClick={() => open("privacy")}>
          Privacy
          <Icon name="right" size={16} />
        </button>
        <button
          onClick={() => {
            window.location.href = "/account";
          }}
        >
          Account
          <Icon name="right" size={16} />
        </button>
        <button
          onClick={() =>
            toast(
              "Support: include your game version 0.1.0 and steps to reproduce when reporting an issue.",
            )
          }
        >
          Support
          <Icon name="right" size={16} />
        </button>
        {ENABLE_DEV_TOOLS && (
          <button onClick={() => open("lab")}>
            Developer · Dev Lab
            <Icon name="lab" size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
export function TutorialContent() {
  const { start, profile, update } = useGame();
  const [name, setName] = useState(profile.name);
  return (
    <div className="tutorial-content">
      <TutorialSteps />
      <label className="field-label">
        WHAT SHALL WE CALL YOU?
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
        />
      </label>
      <PrimaryButton
        icon="book"
        onClick={() => {
          update({ ...profile, name: name.trim() || "Wayfarer" });
          start("Training", "Training", true);
        }}
      >
        Begin practice match
      </PrimaryButton>
      <p className="helper-text">
        No main-turn timer · Reactions pass after 5 seconds
      </p>
      <Glossary />
    </div>
  );
}
export function UpgradeContent() {
  const { profile, update, toast } = useGame();
  return (
    <div className="upgrade-content">
      <div className="empty-orbit">
        <Icon name="crown" size={42} />
      </div>
      <h3>Your journey, illuminated.</h3>
      <p>
        50 levels of cosmetic rewards. Legend palettes, Omen finishes, card
        backs, and gems.
      </p>
      <p className="helper-text">
        Local economy preview. No real-money payment is connected.
      </p>
      <PrimaryButton
        icon="gems"
        disabled={profile.premium || profile.gems < 600}
        onClick={() => {
          update({ ...profile, gems: profile.gems - 600, premium: true });
          toast("Premium Path unlocked with mock gems.");
        }}
      >
        {profile.premium ? "Already unlocked" : "Unlock · 600 Gems"}
      </PrimaryButton>
      {profile.gems < 600 && !profile.premium && (
        <p className="helper-text">
          Earn mock gems through the free Season Path.
        </p>
      )}
      <p className="cultural-note">
        All mechanical gameplay content remains available without premium.
      </p>
    </div>
  );
}
export const seasonTitle = GAME.season.name;
