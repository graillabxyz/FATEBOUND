import { startUsage } from "../services/telemetry";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppContext } from "./context";
import type { Inspect } from "./context";
import { LocalProfileService, level, rankLabel } from "../services/profile";
import type { Profile, StorageAdapter } from "../services/profile";
import { LocalMatchService } from "../services/match-service";
import type { Mode } from "../services/match-service";
import type { Difficulty } from "../engine/ai";
import type { LegendId, MatchView } from "../engine/types";
import { LEGENDS, legendById } from "../content/legends";
import { STARTERS } from "../content/loadouts";
import { GAME } from "../content/config";
import { track } from "../services/analytics";
import { audioCue, setAmbient } from "../services/audio";
import {
  BottomNavigation,
  CurrencyCounter,
  EmptyState,
  Icon,
  IconButton,
  LegendArt,
  Modal,
  PrimaryButton,
  RankBadge,
  RewardTile,
  SecondaryButton,
  Sigil,
} from "./components";
import Home from "./Home";
import Loadout from "./Loadout";
import Collection from "./Collection";
import Pass from "./Pass";
import Battle from "./Battle";
import Inspector from "./Inspector";
import { ENABLE_DEV_TOOLS } from "../dev/gate";
const DevLab = ENABLE_DEV_TOOLS ? lazy(() => import("../dev/DevLab")) : null;
import {
  ProfilePage,
  QuestContent,
  SettingsContent,
  ShopPage,
  SocialPage,
  TutorialContent,
  UpgradeContent,
} from "./Product";
function storageAdapter(): StorageAdapter {
  try {
    const s = window.localStorage;
    const key = "fatebound.probe";
    s.setItem(key, "1");
    s.removeItem(key);
    return s;
  } catch {
    const map = new Map<string, string>();
    return {
      getItem: (k) => map.get(k) ?? null,
      setItem: (k, v) => {
        map.set(k, v);
      },
      removeItem: (k) => {
        map.delete(k);
      },
    };
  }
}
const storage = storageAdapter();
const profileService = new LocalProfileService(storage);
export default function App() {
  useEffect(() => startUsage(), []);
  const [profile, setProfile] = useState(() => profileService.load());
  const [tab, setTab] = useState("home");
  const [modal, setModal] = useState<string | null>(null);
  const [inspectTarget, setInspect] = useState<Inspect | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [battle, setBattle] = useState<LocalMatchService | null>(null);
  const [result, setResult] = useState<MatchView | null>(null);
  const [resumeService, setResumeService] = useState(() =>
    LocalMatchService.restore(storage),
  );
  const [difficulty, setDifficulty] = useState<Difficulty>("Normal");
  const [opponentId, setOpponentId] = useState<LegendId>("anansi");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const active =
    profile.loadouts.find((l) => l.id === profile.activeId) ??
    profile.loadouts[0];
  const toast = useCallback((message: string) => {
    setToastMessage(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastMessage(""), 3600);
  }, []);
  const update = useCallback(
    (p: Profile) => {
      setProfile(p);
      try {
        profileService.save(p);
      } catch {
        toast(
          "Device storage is full. Changes are only saved for this session.",
        );
      }
    },
    [toast],
  );
  const closeModal = useCallback(() => setModal(null), []);
  const closeInspect = useCallback(() => setInspect(null), []);
  const navigate = (next: string) => {
    setTab(next);
    setModal(null);
    audioCue("menu", profile.settings);
    if (next === "pass") track("battle_pass_viewed");
    if (next === "shop") track("shop_viewed");
    scrollRef.current?.scrollTo(0, 0);
  };
  const open = (name: string) => {
    if (name === "lab" && !ENABLE_DEV_TOOLS) return;
    setModal(name);
    audioCue("menu", profile.settings);
  };
  const start = (
    mode: Mode,
    ai: Difficulty,
    practice = false,
    opponent?: string,
  ) => {
    const rival = (opponent ?? opponentId) as LegendId;
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    const service = LocalMatchService.start(
      seed,
      [active, STARTERS[rival]],
      ai,
      mode,
      practice,
      storage,
    );
    setBattle(service);
    setResult(null);
    setModal(null);
    setResumeService(null);
    track("match_started", { mode, legend: active.legend });
    if (practice) track("tutorial_started");
    audioCue("matchFound", profile.settings);
  };
  const resume = () => {
    if (resumeService) {
      resumeService.reconnect();
      setBattle(resumeService);
      setResumeService(null);
    }
  };
  const end = (view: MatchView) => {
    setResult(view);
    setProfile((p) => {
      let next = profileService.claimMatch(p, view, battle?.mode ?? "Training");
      if (battle?.practice) {
        next = { ...next, tutorialComplete: true };
        track("tutorial_completed");
      }
      profileService.save(next);
      return next;
    });
    track("match_completed", {
      winner: String(view.winner),
      rounds: view.round,
    });
    audioCue(view.winner === 0 ? "victory" : "defeat", profile.settings);
  };
  const leave = () => {
    battle?.abandon();
    setBattle(null);
    setResult(null);
    setModal(null);
    setTab("home");
  };
  useEffect(() => {
    setAmbient(profile.settings);
  }, [profile.settings]);
  useEffect(() => {
    document.title = GAME.title;
  }, []);
  const motion =
    profile.settings.reducedMotion ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const context = {
    profile,
    service: profileService,
    update,
    active,
    tab,
    navigate,
    inspect: (t: Inspect) => {
      setInspect(t);
      if (t.type === "cosmetic") track("cosmetic_previewed", { id: t.item.id });
    },
    toast,
    open,
    start,
    resumeAvailable: !!resumeService,
    resume,
  };
  const titles: Record<string, string> = {
    play: "Choose your encounter",
    tutorial: "Welcome, Wayfarer",
    quests: "Small steps. Great stories.",
    settings: "Make yourself at home",
    upgrade: "The Premium Path",
    privacy: "Your privacy",
    account: "Your account",
    friend: "A new connection",
    lab: "Battle laboratory",
    leave: "Leave this encounter?",
    help: "How to play",
    inbox: "The messenger’s satchel",
  };
  return (
    <AppContext.Provider value={context}>
      <div
        className={`app-surround ${motion ? "reduced-motion" : ""} ${profile.settings.batterySaver ? "battery-saver" : ""}`}
      >
        <div className="ambient-backdrop" />
        <main className={`phone-shell ${battle ? "in-battle" : ""}`}>
          <div className="screen-reader-only" aria-live="polite">
            {toastMessage}
          </div>
          {modal === "lab" && DevLab ? (
            <Suspense
              fallback={
                <p className="helper-text">Opening internal Dev Lab…</p>
              }
            >
              <DevLab onExit={() => setModal(null)} />
            </Suspense>
          ) : battle ? (
            <>
              {result ? (
                <div className="match-result">
                  <div className="result-art">
                    <LegendArt id={active.legend} />
                  </div>
                  <div className="result-top">
                    <span className="eyebrow">
                      {battle.mode === "Training"
                        ? "TRAINING COMPLETE"
                        : `${battle.mode.toUpperCase()} SIMULATION`}
                    </span>
                    <div className="result-emblem">
                      <Icon
                        name={
                          result.winner === 0
                            ? "trophy"
                            : result.winner === "draw"
                              ? "guard"
                              : "leaf"
                        }
                        size={55}
                      />
                    </div>
                    <p className="result-kicker">
                      {result.winner === 0
                        ? "A FATE WELL CHOSEN"
                        : result.winner === "draw"
                          ? "A BALANCE OF WILLS"
                          : "ANOTHER STORY TO TELL"}
                    </p>
                    <h1>
                      {result.winner === 0
                        ? "Victory"
                        : result.winner === "draw"
                          ? "Draw"
                          : "Defeat"}
                    </h1>
                    <p>
                      {result.winner === 0
                        ? "Your decisions made the difference."
                        : result.winner === "draw"
                          ? "Equal HP. Equal damage. An honorable draw."
                          : "Every encounter leaves you wiser."}
                    </p>
                    <RankBadge label={rankLabel(profile)} />
                  </div>
                  <div className="result-score">
                    <span>
                      {legendById[result.players[0].loadout.legend].name}
                      <b>{result.players[0].hp} HP</b>
                    </span>
                    <span>ROUND {result.round} / 7</span>
                    <span>
                      {legendById[result.players[1].loadout.legend].name}
                      <b>{result.players[1].hp} HP</b>
                    </span>
                  </div>
                  <div className="result-rewards">
                    <RewardTile
                      icon="star"
                      value={`+${GAME.rewards.xp + (result.winner === 0 ? 30 : 0)}`}
                      label="Account XP"
                    />
                    <RewardTile
                      icon="coins"
                      value={`+${GAME.rewards.coins + (result.winner === 0 ? 15 : 0)}`}
                      label="Coins"
                    />
                    <RewardTile
                      icon="leaf"
                      value={`+${GAME.rewards.mastery}`}
                      label="Mastery XP"
                    />
                    <RewardTile
                      icon="pass"
                      value={`+${GAME.rewards.season}`}
                      label="Season XP"
                    />
                  </div>
                  <p className="result-quest">
                    <Icon name="check" size={15} />
                    Rewards collected · quest progress updated
                  </p>
                  {battle.mode === "Ranked" && (
                    <p className="helper-text">
                      Local rank{" "}
                      {result.winner === 0
                        ? "+25"
                        : result.winner === "draw"
                          ? "unchanged"
                          : "−10"}{" "}
                      · online rating unaffected
                    </p>
                  )}
                  <div className="result-actions">
                    <PrimaryButton
                      icon="attack"
                      onClick={() => start(battle.mode, battle.difficulty)}
                    >
                      Play again
                    </PrimaryButton>
                    <SecondaryButton icon="home" onClick={leave}>
                      Return home
                    </SecondaryButton>
                    <button
                      className="text-button"
                      onClick={() => {
                        try {
                          const blob = new Blob(
                            [JSON.stringify(battle.replay(), null, 2)],
                            { type: "application/json" },
                          );
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `fatebound-replay-${result.id}.json`;
                          a.click();
                          setTimeout(() => URL.revokeObjectURL(url), 1000);
                          toast("Replay exported.");
                        } catch (e) {
                          toast((e as Error).message);
                        }
                      }}
                    >
                      <Icon name="scroll" size={14} />
                      Export match replay
                    </button>
                  </div>
                </div>
              ) : (
                <Battle
                  service={battle}
                  onEnd={end}
                  onExit={() => open("leave")}
                />
              )}
            </>
          ) : (
            <>
              <header className="app-header">
                <button
                  className="profile-strip"
                  onClick={() => navigate("profile")}
                  aria-label="Open player profile"
                >
                  <LegendArt id={active.legend} className="avatar" />
                  <span>
                    <strong>{profile.name}</strong>
                    <small>
                      LV. {level(profile)} <span>·</span> WAYFARER
                    </small>
                  </span>
                </button>
                <CurrencyCounter coins={profile.coins} gems={profile.gems} />
                <IconButton
                  icon="more"
                  label="Open menu"
                  onClick={() => open("menu")}
                />
              </header>
              <div className="app-scroll" ref={scrollRef}>
                {tab === "home" ? (
                  <Home />
                ) : tab === "loadout" ? (
                  <Loadout />
                ) : tab === "legends" ? (
                  <Collection />
                ) : tab === "pass" ? (
                  <Pass />
                ) : tab === "social" ? (
                  <SocialPage />
                ) : tab === "profile" ? (
                  <ProfilePage />
                ) : tab === "shop" ? (
                  <ShopPage />
                ) : (
                  <Home />
                )}
              </div>
              <BottomNavigation active={tab} onChange={navigate} />
            </>
          )}
          {toastMessage && (
            <div className="toast" role="status">
              <Icon name="sparkles" size={16} />
              {toastMessage}
            </div>
          )}
          {inspectTarget && (
            <Inspector target={inspectTarget} onClose={closeInspect} />
          )}{" "}
          {modal && modal !== "lab" && (
            <Modal
              title={titles[modal] ?? "A world of possibilities"}
              eyebrow={modal === "play" ? "THE NEXT CHAPTER" : undefined}
              onClose={closeModal}
            >
              {modal === "menu" ? (
                <div className="menu-grid">
                  {[
                    ["profile", "Player profile", "crown"],
                    ["shop", "The emporium", "gems"],
                    ["quests", "Quests", "scroll"],
                    ["inbox", "Inbox", "bell"],
                    ["settings", "Settings", "settings"],
                    ["help", "How to play", "book"],
                  ].map(([id, label, icon]) => (
                    <button
                      key={id}
                      onClick={() =>
                        id === "profile" || id === "shop"
                          ? navigate(id)
                          : open(id)
                      }
                    >
                      <Icon name={icon} size={23} />
                      <span>{label}</span>
                      <Icon name="right" size={15} />
                    </button>
                  ))}
                </div>
              ) : modal === "play" ? (
                <div className="play-menu">
                  <p className="intro-copy">
                    A few minutes. A thousand possibilities.
                  </p>
                  <label className="field-label">
                    YOUR OPPONENT
                    <select
                      value={opponentId}
                      onChange={(e) =>
                        setOpponentId(e.target.value as LegendId)
                      }
                    >
                      {LEGENDS.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="difficulty-row">
                    <span>AI DIFFICULTY</span>
                    <div className="segmented">
                      {(["Training", "Normal"] as const).map((d) => (
                        <button
                          className={difficulty === d ? "active" : ""}
                          key={d}
                          onClick={() => setDifficulty(d)}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  {(["Ranked", "Casual", "Training"] as const).map((mode) => (
                    <button
                      className={`mode-card ${mode === "Training" ? "recommended" : ""}`}
                      key={mode}
                      onClick={() => start(mode, difficulty)}
                    >
                      <span className="mode-icon">
                        <Icon
                          name={
                            mode === "Ranked"
                              ? "trophy"
                              : mode === "Casual"
                                ? "attack"
                                : "book"
                          }
                          size={25}
                        />
                      </span>
                      <span>
                        <strong>
                          {mode === "Training" ? "AI Training" : mode}
                        </strong>
                        <small>
                          {mode === "Ranked"
                            ? "Local ranked simulation · AI opponent"
                            : mode === "Casual"
                              ? "An unranked encounter · AI opponent"
                              : "Sharpen your instincts · 12-second turns"}
                        </small>
                      </span>
                      <Icon name="right" size={18} />
                    </button>
                  ))}
                  <button
                    className="practice-link"
                    onClick={() => start("Training", "Training", true)}
                  >
                    <Icon name="book" size={15} />
                    Guided practice · no timer
                  </button>
                  <p className="helper-text">
                    Online matchmaking is not connected in this build.
                  </p>
                </div>
              ) : modal === "tutorial" || modal === "help" ? (
                <TutorialContent />
              ) : modal === "quests" ? (
                <QuestContent />
              ) : modal === "settings" ? (
                <SettingsContent />
              ) : modal === "upgrade" ? (
                <UpgradeContent />
              ) : modal === "leave" ? (
                <>
                  <p>
                    Your local match stays available if you return home.
                    Abandoning ends this encounter without rewards.
                  </p>
                  <PrimaryButton
                    onClick={() => {
                      setResumeService(battle);
                      setBattle(null);
                      setModal(null);
                      setTab("home");
                    }}
                  >
                    Save and return home
                  </PrimaryButton>
                  <SecondaryButton
                    onClick={() => {
                      track("match_abandoned");
                      leave();
                    }}
                  >
                    Abandon match
                  </SecondaryButton>
                </>
              ) : modal === "privacy" ? (
                <div className="prose">
                  <Sigil size={40} />
                  <p>
                    This prototype keeps your guest profile, loadouts, settings
                    and active match in this device’s local storage.
                  </p>
                  <p>
                    Internal builds send anonymous usage events and match
                    metrics to the private dashboard when connected. No
                    advertising provider, advertising system, real payment
                    service, messaging service, or push delivery is connected.
                  </p>
                  <p>
                    A future online account will need its own privacy policy and
                    server-side account controls.
                  </p>
                </div>
              ) : modal === "account" ? (
                <EmptyState
                  icon="crown"
                  title="Playing as a guest"
                  text="Your progress is saved on this device. Account creation and cross-device sync will connect through the future account service."
                />
              ) : modal === "inbox" ? (
                <EmptyState
                  icon="bell"
                  title="A quiet moment"
                  text="Season news and account rewards will find you here. There are no messages yet."
                />
              ) : modal === "friend" ? (
                <EmptyState
                  icon="social"
                  title="A future gathering"
                  text="Friend requests and challenges need the online social service. You can find your recent AI opponents in Social."
                />
              ) : null}
            </Modal>
          )}
        </main>
        <div className="desktop-caption">
          <Sigil size={20} />
          <span>DESIGNED FOR THE PALM OF YOUR HAND</span>
          <span>PORTRAIT MOBILE PREVIEW</span>
        </div>
      </div>
    </AppContext.Provider>
  );
}
