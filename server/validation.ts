import { GAME } from "../src/content/config";
import type { MatchRecord } from "../src/metrics/data";
import { validateLoadout } from "../src/engine/rules";
import { dieById } from "../src/content/dice";
import { legendById } from "../src/content/legends";
import { cardById } from "../src/content/cards";
const number = (n: number, min = 0, max = 1e7) => {
  if (!Number.isFinite(n) || n < min || n > max)
    throw new Error("Metric value outside valid range.");
};
export function validateRecord(
  raw: MatchRecord,
  source: MatchRecord["source"],
): MatchRecord {
  if (
    !raw ||
    typeof raw.id !== "string" ||
    raw.id.length > 180 ||
    raw.version !== GAME.version ||
    !["live", "simulation", "lab"].includes(source) ||
    raw.source !== source
  )
    throw new Error("Invalid record identity/source/version.");
  if (
    ![0, 1, "draw"].includes(raw.winner) ||
    !Number.isInteger(raw.rounds) ||
    raw.rounds < 1 ||
    raw.rounds > 99
  )
    throw new Error("Invalid result.");
  const timestamp = Date.parse(raw.timestamp);
  if (
    !Number.isFinite(timestamp) ||
    Math.abs(Date.now() - timestamp) > 90 * 86400000
  )
    throw new Error("Metric timestamp must be within 90 days.");
  if (
    !Array.isArray(raw.loadouts) ||
    raw.loadouts.length !== 2 ||
    !Array.isArray(raw.hp) ||
    raw.hp.length !== 2 ||
    !Array.isArray(raw.known) ||
    raw.known.length !== 2
  )
    throw new Error("Two players required.");
  raw.loadouts.forEach((l) => {
    if (source !== "lab") validateLoadout(l);
    else if (
      !legendById[l.legend] ||
      !Array.isArray(l.cards) ||
      l.cards.length !== 4 ||
      new Set(l.cards).size !== 4 ||
      l.cards.some((id) => !cardById[id]) ||
      !Array.isArray(l.dice) ||
      l.dice.length !== 3 ||
      l.dice.some((id) => !dieById[id])
    )
      throw new Error("Invalid lab loadout.");
  });
  raw.hp.forEach((n) => number(n, 0, 1000));
  raw.known.forEach((n) => number(n, 0, 4));
  if (raw.durationMs !== null) number(raw.durationMs, 0, 86400000);
  if (
    !Array.isArray(raw.actors) ||
    raw.actors.length !== 2 ||
    raw.actors.some((a) => !["human", "ai"].includes(a))
  )
    throw new Error("Invalid actor kinds.");
  if (source === "simulation" && raw.actors.some((a) => a !== "ai"))
    throw new Error("Simulation actors must be AI.");
  if (!Array.isArray(raw.stats) || raw.stats.length > 99)
    throw new Error("Invalid round metrics.");
  raw.stats.forEach((r) => {
    number(r.round, 1, 99);
    for (const key of [
      "damage",
      "guard",
      "control",
      "unused",
      "held",
      "expired",
      "rolls",
      "reactions",
      "reactionWindows",
      "reactionSuccess",
      "turns",
    ] as const) {
      if (!Array.isArray(r[key]) || r[key].length !== 2)
        throw new Error("Invalid per-seat metric.");
      r[key].forEach((n) => number(n));
    }
    if (
      !Array.isArray(r.cards) ||
      r.cards.length !== 2 ||
      !Array.isArray(r.faces) ||
      r.faces.length !== 2
    )
      throw new Error("Invalid card/face metrics.");
    r.cards.forEach((ids, a) => {
      if (
        ids.length > 12 ||
        ids.some((id) => !cardById[id] || !raw.loadouts[a].cards.includes(id))
      )
        throw new Error("Metric uses an unequipped card.");
    });
    r.faces.forEach((faces, a) => {
      if (faces.length > 3)
        throw new Error("At most three Omen observations per turn.");
      faces.forEach((f) => {
        const [id, index] = f.split(":");
        if (!raw.loadouts[a].dice.includes(id) || !dieById[id])
          throw new Error("Invalid Omen ID.");
        number(+index, 0, dieById[id].size - 1);
        if (!Number.isInteger(+index))
          throw new Error("Face index must be an integer.");
      });
    });
  });
  if (!Array.isArray(raw.controls) || raw.controls.length > 600)
    throw new Error("Invalid Focus metrics.");
  raw.controls.forEach((c) => {
    number(c.actor, 0, 1);
    number(c.slot, 0, 2);
    if (!Number.isInteger(c.actor) || !Number.isInteger(c.slot))
      throw new Error("Actor and slot must be integers.");
    if (!["shift", "flip"].includes(c.kind))
      throw new Error("Invalid Focus kind.");
  });
  if (!raw.openingInitiative || ![0, 1].includes(raw.openingInitiative.winner))
    throw new Error("Opening initiative metrics required.");
  for (const key of ["rolls", "bonuses", "totals"] as const) {
    const values = raw.openingInitiative[key];
    if (!Array.isArray(values) || values.length !== 2)
      throw new Error("Invalid initiative metrics.");
    values.forEach((v) =>
      number(v, key === "rolls" ? 1 : 0, key === "rolls" ? 20 : 40),
    );
  }
  // Only anonymous content identifiers and numeric outcomes are persisted; no profile or authored build names.
  return {
    id: raw.id,
    source,
    mode: String(raw.mode).slice(0, 40),
    version: GAME.version,
    timestamp: new Date(timestamp).toISOString(),
    durationMs: raw.durationMs,
    rounds: raw.rounds,
    winner: raw.winner,
    loadouts: raw.loadouts.map((l) => ({
      legend: l.legend,
      cards: [...l.cards],
      dice: [...l.dice],
      id: `${l.legend}-build`,
      name: `${l.legend} build`,
    })) as MatchRecord["loadouts"],
    hp: raw.hp,
    known: raw.known,
    stats: raw.stats.map((r) => ({
      round: r.round,
      damage: [...r.damage],
      guard: [...r.guard],
      control: [...r.control],
      unused: [...r.unused],
      held: [...r.held],
      expired: [...r.expired],
      rolls: [...r.rolls],
      reactions: [...r.reactions],
      reactionWindows: [...r.reactionWindows],
      reactionSuccess: [...r.reactionSuccess],
      turns: [...r.turns],
      cards: r.cards.map((c) => [...c]),
      faces: r.faces.map((f) => [...f]),
    })),
    controls: raw.controls.map((c) => ({
      actor: c.actor,
      slot: c.slot,
      kind: c.kind,
    })),
    actors: [...raw.actors],
    pair:
      raw.pair && typeof raw.pair.id === "string" && raw.pair.id.length < 180
        ? { id: raw.pair.id, reversed: !!raw.pair.reversed }
        : undefined,
    openingInitiative: structuredClone(raw.openingInitiative),
    seed: typeof raw.seed === "number" ? raw.seed : undefined,
  };
}
