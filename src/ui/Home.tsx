import { OmenJourney } from "./OmenProgression";
import { LegendJourney } from "./LegendProgression";
import { GAME } from "../content/config";
import { LEGENDS, legendById } from "../content/legends";
import { omenById } from "../content/omens";
import { level, rankLabel, seasonLevel } from "../services/profile";
import { useGame } from "./context";
import {
  Icon,
  Sigil,
  LegendArt,
  PrimaryButton,
  RankBadge,
  Omen,
  SectionLabel,
} from "./components";
export default function Home() {
  const { profile, active, navigate, open, resumeAvailable, resume } =
    useGame();
  const l = legendById[active.legend];
  return (
    <div className="home-screen">
      <div className="wordmark">
        <span />
        <Sigil size={22} />
        <h1>{GAME.title}</h1>
        <span />
      </div>
      <div className="season-ribbon">
        <span className="live-dot" />
        {GAME.season.label}
        <i />
        THE FIRST LIGHT
        <Icon name="sun" size={14} />
      </div>
      <section className="home-hero">
        <LegendArt id={l.id} className="hero-art" />
        <div className="hero-grain" />
        <div className="hero-top">
          <span className="eyebrow">YOUR LEGEND</span>
          <button className="text-button" onClick={() => navigate("legends")}>
            Change
            <Icon name="swap" size={13} />
          </button>
        </div>
        <div className="hero-side">
          <span>
            {String(
              LEGENDS.findIndex((entry) => entry.id === l.id) + 1,
            ).padStart(2, "0")}{" "}
            / {String(LEGENDS.length).padStart(2, "0")}
          </span>
          <i />
        </div>
        <div className="hero-caption">
          <div className="hero-flourish">
            <span />
            <Icon
              name={
                l.id === "tengu"
                  ? "wind"
                  : l.id === "quetzalcoatl"
                    ? "sun"
                    : l.id === "maui"
                      ? "moon"
                      : "leaf"
              }
              size={19}
            />
            <span />
          </div>
          <p className="hero-region">{l.region}</p>
          <h2>{l.name}</h2>
          <p className="hero-subtitle">{l.subtitle}</p>
          <div className="hero-build">
            {active.dice.map((id, i) => (
              <Omen
                key={i}
                definition={omenById[id]}
                small
                skin={profile.skin}
                onClick={() => navigate("loadout")}
              />
            ))}
            <button
              className="hero-edit"
              onClick={() => navigate("loadout")}
              aria-label="Edit your loadout"
            >
              <Icon name="pencil" size={16} />
            </button>
          </div>
        </div>
      </section>
      <section className="home-play">
        {profile.matches === 0 && (
          <p className="starter-intro">
            <strong>Your collection starts here</strong>
            <br />
            {profile.ownedLegends.length} Legends · {profile.ownedCards.length}{" "}
            shared Cards · {profile.ownedOmens.length} Omens. Build your Hand
            around your Legend’s Affinities.
          </p>
        )}
        <div className="rank-line">
          <RankBadge label={rankLabel(profile)} />
          <span>4 cards · 3 Omens · Your move</span>
        </div>
        <PrimaryButton
          onClick={() => (resumeAvailable ? resume() : open("play"))}
          icon={resumeAvailable ? "arrow" : "attack"}
          className="play-button"
        >
          {resumeAvailable ? "RESUME MATCH" : "PLAY"}
        </PrimaryButton>
        <div className="play-footnote">
          <span>READ · REACT</span>
          <i />
          <span>YOUR DECISIONS</span>
          <i />
          <span>QUICK MATCHES</span>
        </div>
      </section>
      <section className="home-lower">
        <LegendJourney compact />
        <OmenJourney compact />
        <button
          className="journey-banner"
          onClick={() =>
            profile.tutorialComplete ? open("quests") : open("tutorial")
          }
        >
          <span className="journey-icon">
            <Icon
              name={profile.tutorialComplete ? "scroll" : "book"}
              size={24}
            />
          </span>
          <span>
            <small>
              {profile.tutorialComplete ? "DAILY QUESTS" : "YOUR FIRST CHAPTER"}
            </small>
            <strong>
              {profile.tutorialComplete
                ? "Your next rewards await"
                : "Learn to shape your Fate"}
            </strong>
            <span>
              {profile.tutorialComplete
                ? "Complete quests. Earn coins and XP."
                : "Practice actions, held Omens and reactions."}
            </span>
          </span>
          <Icon name="right" size={18} />
        </button>
        <SectionLabel
          right={
            <button className="text-button" onClick={() => navigate("pass")}>
              View path
              <Icon name="right" size={13} />
            </button>
          }
        >
          THE JOURNEY AHEAD
        </SectionLabel>
        <div className="home-progress">
          <div>
            <Icon name="pass" size={20} />
            <span>
              Season Path <b>Level {seasonLevel(profile)}</b>
            </span>
            <span>{profile.seasonXp % 150}/150 XP</span>
          </div>
          <div className="progress-track">
            <i
              style={{ width: `${((profile.seasonXp % 150) / 150) * 100}%` }}
            />
          </div>
        </div>
        <div className="home-note">
          <Sigil size={18} />
          <span>Six Legends. Every turn matters.</span>
          <span>Lv. {level(profile)}</span>
        </div>
      </section>
    </div>
  );
}
