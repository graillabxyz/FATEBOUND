import type { AnalyticsRecord } from "./analytics";
import { recordMatch, type MatchRecord } from "../metrics/data";
import type { MatchState } from "../engine/types";
import { cloudFetch } from "../online/client";
const endpoint =
  import.meta.env.VITE_TELEMETRY_URL ||
  (import.meta.env.DEV || import.meta.env.MODE === "internal"
    ? "/api/telemetry"
    : "");
const outboxKey = "omnipath.telemetry.outbox.v3";
type Event = { id: string; event: string; session: string; at: number };
type Queue = { events: Event[]; matches: MatchRecord[] };
let queue: Queue = { events: [], matches: [] },
  flushing = false;
const session = crypto.randomUUID();
try {
  const raw = JSON.parse(localStorage.getItem(outboxKey) ?? "null");
  if (raw && Array.isArray(raw.events) && Array.isArray(raw.matches))
    queue = { events: raw.events.slice(-100), matches: raw.matches.slice(-10) };
} catch {
  /* Outbox is best-effort transport, never metrics authority. */
}
function persist() {
  try {
    localStorage.setItem(outboxKey, JSON.stringify(queue));
  } catch {
    /* The server remains the source of truth. */
  }
}
export function trackUsage(record: AnalyticsRecord) {
  if (!endpoint) return;
  queue.events.push({
    id: crypto.randomUUID(),
    event: record.event,
    session,
    at: record.at,
  });
  queue.events = queue.events.slice(-100);
  persist();
}
export function completedUsage(state: MatchState, durationMs: number) {
  if (!endpoint || state.winner === null) return;
  const r = recordMatch(state, "live", "Human vs AI", durationMs, [
    "human",
    "ai",
  ]);
  if (!queue.matches.some((m) => m.id === r.id)) queue.matches.push(r);
  queue.matches = queue.matches.slice(-10);
  persist();
  void flushUsage();
}
export async function flushUsage() {
  if (!endpoint || flushing || (!queue.events.length && !queue.matches.length))
    return;
  flushing = true;
  const batch = structuredClone(queue);
  try {
    const response = await cloudFetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch),
    });
    if (
      response.ok &&
      response.headers.get("content-type")?.includes("application/json")
    ) {
      const events = new Set(batch.events.map((e) => e.id)),
        matches = new Set(batch.matches.map((m) => m.id));
      queue.events = queue.events.filter((e) => !events.has(e.id));
      queue.matches = queue.matches.filter((m) => !matches.has(m.id));
      persist();
    }
  } catch {
    /* Retry on the next interval; never interrupt gameplay. */
  } finally {
    flushing = false;
  }
}
export function startUsage() {
  if (!endpoint) return () => {};
  const heartbeat = () => {
    if (document.visibilityState === "visible") {
      queue.events.push({
        id: crypto.randomUUID(),
        event: "session_heartbeat",
        session,
        at: Date.now(),
      });
      queue.events = queue.events.slice(-100);
      void flushUsage();
    }
  };
  heartbeat();
  const timer = setInterval(heartbeat, 15000);
  const flush = setInterval(() => void flushUsage(), 5000);
  return () => {
    clearInterval(timer);
    clearInterval(flush);
  };
}
