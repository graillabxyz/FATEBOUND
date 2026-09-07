import { statusExplanation } from "../content/card-rules";
import { AffinityLine } from "./Affinities";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { legendById } from "../content/legends";
import { rulesLabel } from "../content/terminology";
import type { LegendId, MatchView } from "../engine/types";
import { LegendArt, LifeBar, Icon, RankBadge } from "./components";
import { EmoteBubble } from "./Emotes";
export type ParticipantIdentity = {
  name: string;
  rank: string;
  title: string;
  avatar: LegendId;
  cosmetic?: string;
};
export function BattlePresence({
  player,
  identity,
  side,
  initiative,
  active,
  ability,
  reduced = false,
  onInspect,
}: {
  player: MatchView["players"][number];
  identity: ParticipantIdentity;
  side: 0 | 1;
  initiative: boolean;
  active: boolean;
  ability: boolean;
  reduced?: boolean;
  onInspect: () => void;
}) {
  const legend = legendById[player.loadout.legend],
    last = useRef({ hp: player.hp, ward: player.guard }),
    [feedback, setFeedback] = useState("");
  useEffect(() => {
    const old = last.current;
    setFeedback(
      player.hp < old.hp
        ? "hurt"
        : player.hp > old.hp
          ? "healing"
          : player.guard > old.ward
            ? "warding"
            : "",
    );
    last.current = { hp: player.hp, ward: player.guard };
    const timer = setTimeout(() => setFeedback(""), 600);
    return () => clearTimeout(timer);
  }, [player.hp, player.guard]);
  const held = player.dice.filter((d) => d.state === "HELD").length;
  return (
    <section
      className={`participant participant-${side} ${active ? "participant-active" : ""} ${feedback} ${ability ? "legend-casting" : ""} ${player.hp <= legend.hp * 0.25 ? "legend-critical" : ""}`}
      style={{ "--participant-color": legend.color } as CSSProperties}
    >
      <div className="participant-identity">
        <div className="player-avatar">
          <LegendArt id={identity.avatar} />
        </div>
        <div className="player-name">
          <strong>{identity.name}</strong>
          <small>{identity.title}</small>
        </div>
        <RankBadge small label={identity.rank} />
        <EmoteBubble side={side} />
      </div>
      <div className="legend-presence">
        <button
          className="table-legend-portrait"
          aria-label={`Inspect ${legend.name}`}
          onClick={onInspect}
        >
          <LegendArt id={legend.id} />
          {initiative && (
            <span className="portrait-initiative" title="Opening Initiative">
              <Icon name="wind" size={13} />
            </span>
          )}
        </button>
        <div className="legend-presence-copy">
          <h2>{legend.name}</h2>
          <span className="legend-class">
            {legend.class} {initiative && <b>· INITIATIVE</b>}
          </span>
          <div className="participant-affinities">
            <AffinityLine ids={legend.affinities} compact />
          </div>
          <div className="participant-statuses">
            {held > 0 && <span className="held-status">{held} HELD</span>}
            {player.statuses.map((s, i) => (
              <span key={`${s.id}-${i}`} title={statusExplanation(s)}>
                {s.id === "power" ? "Empowered" : rulesLabel(s.id)} {s.amount}
              </span>
            ))}
          </div>
        </div>
        <LifeBar
          hp={player.hp}
          max={legend.hp}
          guard={player.guard}
          reduced={reduced}
        />
      </div>
    </section>
  );
}
export function MatchIdentityIntro({
  view,
  identities,
}: {
  view: MatchView;
  identities: ParticipantIdentity[];
}) {
  return (
    <div className="match-identity-intro">
      <small>THE PATHS CONVERGE</small>
      <h2>Opening Initiative</h2>
      <div className="intro-rivals">
        {view.players.map((p, i) => (
          <div
            key={i}
            className={
              view.openingInitiative?.winner === i ? "intro-winner" : ""
            }
          >
            <div className="intro-portrait">
              <LegendArt id={p.loadout.legend} />
              <span className="intro-avatar">
                <LegendArt id={identities[i].avatar} />
              </span>
            </div>
            <span className="intro-name">{identities[i].name}</span>
            <strong>{legendById[p.loadout.legend].name}</strong>
            <RankBadge small label={identities[i].rank} />
            <small>{identities[i].title}</small>
            {identities[i].cosmetic && <small>{identities[i].cosmetic}</small>}
            {view.openingInitiative ? (
              <div className="intro-roll">
                <span>
                  d20 {view.openingInitiative.rolls[i]} +{" "}
                  {view.openingInitiative.bonuses[i]}
                </span>
                <b>{view.openingInitiative.totals[i]}</b>
              </div>
            ) : (
              <div className="intro-roll">
                <span>d20 + Legend Bonus</span>
                <b>·</b>
              </div>
            )}
          </div>
        ))}
      </div>
      <p>
        {view.openingInitiative
          ? `${legendById[view.players[view.openingInitiative.winner].loadout.legend].name} takes Initiative`
          : "Two Legends. One encounter."}
      </p>
      <small>CHOOSE 1 → CHOOSE 2 → ROLL ALL 3</small>
    </div>
  );
}
