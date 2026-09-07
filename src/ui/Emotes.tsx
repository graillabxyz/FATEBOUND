import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  EMOTES,
  EMOTE_CONFIG,
  EMOTE_ACHIEVEMENTS,
  EMOTE_BUNDLES,
  emoteById,
  type EmoteDefinition,
} from "../content/emotes";
import { LocalEmoteTransport, type EmoteMessage } from "../services/emotes";
import { useGame } from "./context";
import { Icon, LegendArt, SectionLabel } from "./components";
import { audioCue } from "../services/audio";
type SocialState = {
  messages: EmoteMessage[];
  equipped: readonly (string | null)[];
  send: (id: string) => void;
  muted: boolean;
  toggleMute: () => void;
  readyAt: number;
  now: number;
};
const SocialContext = createContext<SocialState | null>(null);
export function MatchEmoteProvider({ children }: { children: ReactNode }) {
  const { profile } = useGame();
  const [transport] = useState(
    () => new LocalEmoteTransport(profile.ownedEmotes, profile.equippedEmotes),
  );
  const [messages, setMessages] = useState<EmoteMessage[]>([]),
    [muted, setMuted] = useState(!profile.settings.opponentEmotes),
    [readyAt, setReadyAt] = useState(0),
    [now, setNow] = useState(Date.now());
  const lastIds = useRef("");
  useEffect(() => {
    const t = setInterval(() => {
      const at = Date.now(),
        next = transport.read(at),
        ids = next.map((m) => m.id).join();
      setNow(at);
      if (ids !== lastIds.current) {
        lastIds.current = ids;
        setMessages(next);
      }
    }, 200);
    return () => clearInterval(t);
  }, [transport]);
  const send = (id: string) => {
    const at = Date.now();
    transport.send(id, at);
    setMessages(transport.read(at));
    setReadyAt(at + transport.cooldownMs);
    audioCue("emote", profile.settings);
  };
  return (
    <SocialContext.Provider
      value={{
        messages,
        equipped: transport.equipped,
        send,
        muted,
        toggleMute: () => setMuted((v) => !v),
        readyAt,
        now,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
}
export function EmoteGlyph({ emote }: { emote: EmoteDefinition }) {
  return (
    <span
      className={`emote-glyph emote-${emote.animation ?? "still"}`}
      aria-hidden="true"
    >
      {emote.legend ? <LegendArt id={emote.legend} /> : (emote.icon ?? "✦")}
    </span>
  );
}
export function EmoteBubble({ side }: { side: 0 | 1 }) {
  const social = useContext(SocialContext);
  if (!social || (side === 1 && social.muted)) return null;
  const message = social.messages.filter((m) => m.sender === side).at(-1);
  if (!message) return null;
  const emote = emoteById[message.emoteId];
  return (
    <div className="emote-bubble" role="status" key={message.id}>
      <EmoteGlyph emote={emote} />
      <span>{emote.text}</span>
    </div>
  );
}
export function EmoteMenu({
  urgent = false,
  end = false,
}: {
  urgent?: boolean;
  end?: boolean;
}) {
  const social = useContext(SocialContext),
    [open, setOpen] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (urgent) setOpen(false);
  }, [urgent]);
  if (!social) return null;
  const waiting = Math.max(0, Math.ceil((social.readyAt - social.now) / 1000));
  return (
    <div className={`battle-social ${end ? "social-end" : ""}`}>
      <div className="social-actions">
        <button
          aria-label="Battle emotes"
          aria-expanded={open}
          disabled={urgent}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name="social" size={17} />
          {waiting ? `${waiting}s` : end ? "Say good game" : "Emote"}
        </button>
        <button
          aria-label={
            social.muted ? "Unmute opponent emotes" : "Mute opponent emotes"
          }
          aria-pressed={social.muted}
          onClick={social.toggleMute}
        >
          <Icon name={social.muted ? "mute" : "volume"} size={16} />
          <span>{social.muted ? "Muted" : "Mute"}</span>
        </button>
      </div>
      {open && (
        <div className="emote-menu" aria-label="Equipped battle emotes">
          <div className="emote-menu-heading">
            <span>Your greetings</span>
            <button onClick={() => setOpen(false)} aria-label="Close emotes">
              ×
            </button>
          </div>
          <div className="emote-choices">
            {social.equipped.map((id, slot) =>
              id ? (
                <button
                  key={slot}
                  disabled={waiting > 0}
                  onClick={() => {
                    try {
                      social.send(id);
                      setOpen(false);
                      setError("");
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  <EmoteGlyph emote={emoteById[id]} />
                  <span>{emoteById[id].text}</span>
                </button>
              ) : (
                <span className="empty-emote" key={slot}>
                  Empty slot
                </span>
              ),
            )}
          </div>
          <small>
            AI practice partner · {EMOTE_CONFIG.cooldownMs / 1000}s cooldown
          </small>
          {error && <p role="alert">{error}</p>}
        </div>
      )}
    </div>
  );
}
export function EmoteCollection({
  shop = false,
  bundles = false,
}: {
  shop?: boolean;
  bundles?: boolean;
}) {
  const { profile, service, update, toast } = useGame();
  const [slot, setSlot] = useState(0),
    [filter, setFilter] = useState("All");
  const run = (f: () => typeof profile) => {
    try {
      update(f());
      toast("Emote collection updated.");
    } catch (e) {
      toast((e as Error).message);
    }
  };
  return (
    <section className="emote-collection">
      <SectionLabel>
        {shop ? "COSMETIC EMOTES" : "YOUR BATTLE EMOTES"}
      </SectionLabel>
      <p className="helper-text">
        Five greetings. Your own voice. No gameplay advantage.
      </p>
      {!shop && (
        <>
          <div
            className="equipped-emotes"
            aria-label="Five equipped emote slots"
          >
            {profile.equippedEmotes.map((id, i) => (
              <button
                key={i}
                aria-label={`Emote slot ${i + 1}: ${id ? emoteById[id].name : "Empty"}`}
                aria-pressed={slot === i}
                onClick={() => setSlot(i)}
              >
                <small>{i + 1}</small>
                {id ? (
                  <>
                    <EmoteGlyph emote={emoteById[id]} />
                    <span>{emoteById[id].text}</span>
                  </>
                ) : (
                  <span>+</span>
                )}
              </button>
            ))}
          </div>
          <div className="emote-slot-help">
            <span>Choose an owned emote for slot {slot + 1}.</span>
            <button
              disabled={!profile.equippedEmotes[slot]}
              onClick={() => run(() => service.equipEmote(profile, slot, null))}
            >
              Remove
            </button>
          </div>
          <div className="segmented">
            {["All", "Owned", "Locked"].map((f) => (
              <button
                key={f}
                className={filter === f ? "active" : ""}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </>
      )}
      {bundles ? (
        <div className="emote-catalog">
          {EMOTE_BUNDLES.map((b) => (
            <article className="emote-tile" key={b.id}>
              <div className="bundle-emotes">
                {b.emotes.map((id) => (
                  <EmoteGlyph key={id} emote={emoteById[id]} />
                ))}
              </div>
              <strong>{b.name}</strong>
              <p>Moon greeting + Bright path. Cosmetic only.</p>
              <button
                disabled={
                  b.emotes.every((id) => profile.ownedEmotes.includes(id)) ||
                  profile[b.currency] < b.price
                }
                onClick={() =>
                  run(() => service.purchaseEmoteBundle(profile, b.id))
                }
              >
                {b.emotes.every((id) => profile.ownedEmotes.includes(id))
                  ? "Owned"
                  : `${b.price} Coins`}
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="emote-catalog">
          {EMOTES.filter(
            (e) =>
              filter === "All" ||
              (filter === "Owned") === profile.ownedEmotes.includes(e.id),
          ).map((e) => {
            const owned = profile.ownedEmotes.includes(e.id),
              equipped = profile.equippedEmotes.includes(e.id),
              buy = shop && e.source === "shop";
            return (
              <article
                className={`emote-tile rarity-${e.rarity} ${owned ? "owned" : "locked"}`}
                key={e.id}
              >
                <EmoteGlyph emote={e} />
                <strong>{e.text}</strong>
                <small>
                  {e.rarity} · {e.type.replaceAll("_", " ").toLowerCase()}
                </small>
                <p>{e.sourceLabel}</p>
                <button
                  disabled={
                    shop
                      ? owned ||
                        !buy ||
                        profile[e.currency ?? "coins"] < (e.price ?? 0)
                      : !owned
                  }
                  onClick={() =>
                    run(() =>
                      shop
                        ? service.purchaseEmote(profile, e.id)
                        : service.equipEmote(profile, slot, e.id),
                    )
                  }
                >
                  {shop
                    ? owned
                      ? "Owned"
                      : buy
                        ? `${e.price} Coins`
                        : e.source === "bundle"
                          ? "Bundle · locked"
                          : e.source === "event"
                            ? "Event · locked"
                            : "Earnable · locked"
                    : owned
                      ? equipped
                        ? "Equipped · move here"
                        : `Equip in slot ${slot + 1}`
                      : e.source === "shop"
                        ? "Available in Shop"
                        : e.source === "bundle"
                          ? "Available in Bundles"
                          : e.source === "event"
                            ? "Event · locked"
                            : "Locked · earn through play"}
                </button>
              </article>
            );
          })}
        </div>
      )}
      {!shop && (
        <>
          <SectionLabel>ACHIEVEMENT EMOTES</SectionLabel>
          <div className="emote-achievements">
            {EMOTE_ACHIEVEMENTS.map((a) => (
              <div key={a.id}>
                <EmoteGlyph emote={emoteById[a.emoteId]} />
                <span>
                  <strong>{a.name}</strong>
                  <small>{a.text}</small>
                  <progress
                    aria-label={a.name}
                    value={Math.min(
                      a.target,
                      profile.achievementProgress[a.metric],
                    )}
                    max={a.target}
                  />
                </span>
                <b>
                  {profile.ownedEmotes.includes(a.emoteId)
                    ? "✓"
                    : `${Math.min(a.target, profile.achievementProgress[a.metric])}/${a.target}`}
                </b>
              </div>
            ))}
          </div>
          <p className="helper-text">
            Collection and progression are saved on this device. Ranked
            milestones currently use local ranked matches.
          </p>
        </>
      )}
    </section>
  );
}
