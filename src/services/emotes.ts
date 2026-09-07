import { DEFAULT_EMOTES, EMOTE_CONFIG, emoteById } from "../content/emotes";
export type EmoteMessage = {
  id: number;
  emoteId: string;
  sender: 0 | 1;
  at: number;
};
/** Cosmetic transport boundary. A network adapter must authorize ownership/cooldown on its server. */
export interface EmoteTransport {
  send(id: string, now: number): void;
  read(now: number): EmoteMessage[];
}
/** Local AI encounter transport; never represented as a human or a multiplayer delivery. */
export class LocalEmoteTransport implements EmoteTransport {
  private nextId = 0;
  private lastSent = -Infinity;
  private lastReply = -Infinity;
  private messages: EmoteMessage[] = [];
  private pending: { id: string; at: number } | null = null;
  readonly equipped: readonly (string | null)[];
  constructor(
    owned: string[],
    equipped: (string | null)[],
    readonly cooldownMs: number = EMOTE_CONFIG.cooldownMs,
  ) {
    this.equipped = Object.freeze(
      equipped
        .slice(0, EMOTE_CONFIG.slots)
        .map((id) => (id && owned.includes(id) && emoteById[id] ? id : null)),
    );
  }
  send(id: string, now: number) {
    if (!Number.isFinite(now) || !this.equipped.includes(id) || !emoteById[id])
      throw new Error("Equip an owned emote before the match.");
    if (now - this.lastSent < this.cooldownMs)
      throw new Error("Give your greeting a moment.");
    this.lastSent = now;
    this.messages.push({ id: ++this.nextId, emoteId: id, sender: 0, at: now });
    if (now - this.lastReply >= this.cooldownMs) {
      const reply = DEFAULT_EMOTES.includes(id) ? id : "well-played";
      this.pending = { id: reply, at: now + EMOTE_CONFIG.replyDelayMs };
    }
  }
  read(now: number) {
    if (this.pending && now >= this.pending.at) {
      this.lastReply = now;
      this.messages.push({
        id: ++this.nextId,
        emoteId: this.pending.id,
        sender: 1,
        at: now,
      });
      this.pending = null;
    }
    this.messages = this.messages.filter(
      (m) => now - m.at < EMOTE_CONFIG.displayMs,
    );
    return this.messages.map((m) => ({ ...m }));
  }
}
