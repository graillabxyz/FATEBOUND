import type {
  Loadout,
  MatchState,
  MatchView,
  RoundStats,
} from "../engine/types";
export type MatchRecord = {
  id: string;
  source: "live" | "simulation" | "lab";
  mode: string;
  version: number;
  timestamp: string;
  durationMs: number | null;
  rounds: number;
  winner: 0 | 1 | "draw";
  loadouts: [Loadout, Loadout];
  hp: number[];
  known: number[];
  stats: RoundStats[];
  controls: { actor: number; slot: number; kind: string }[];
  actors: ["human" | "ai", "human" | "ai"];
  pair?: { id: string; reversed: boolean };
  seed?: number;
};
export type EntityMetrics = {
  games: number;
  wins: number;
  draws: number;
  rounds: number;
  damage: number;
  taken: number;
  guard: number;
  control: number;
  revealed: number;
  durationMs: number;
  timedGames: number;
  cards: Record<string, number>;
  dice: Record<string, number>;
};
export type CardMetrics = {
  equipped: number;
  equippedWins: number;
  usedMatches: number;
  usedWins: number;
  uses: number;
  firstRevealRound: number;
  reveals: number;
};
export type DieMetrics = {
  equipped: number;
  wins: number;
  slots: number;
  controls: number;
  faces: Record<string, number>;
};
const entity = (): EntityMetrics => ({
  games: 0,
  wins: 0,
  draws: 0,
  rounds: 0,
  damage: 0,
  taken: 0,
  guard: 0,
  control: 0,
  revealed: 0,
  durationMs: 0,
  timedGames: 0,
  cards: {},
  dice: {},
});
export function aggregate(
  records: MatchRecord[],
  actorFilter: "all" | "human" | "ai" = "all",
) {
  const byLegend: Record<string, EntityMetrics> = {},
    byCard: Record<string, CardMetrics> = {},
    byDie: Record<string, DieMetrics> = {},
    byLoadout: Record<string, EntityMetrics> = {};
  const matchups: Record<
      string,
      { games: number; wins: number; draws: number; rounds: number }
    > = {},
    lethalRounds: Record<string, number> = {},
    daily: Record<string, number> = {};
  let rounds = 0,
    duration = 0,
    timed = 0,
    damage = 0,
    guard = 0,
    control = 0,
    draws = 0,
    unused = 0;
  const seatWins = [0, 0];
  for (const r of records) {
    rounds += r.rounds;
    if (r.durationMs !== null) {
      duration += r.durationMs;
      timed++;
    }
    if (r.winner === "draw") draws++;
    else seatWins[r.winner]++;
    daily[r.timestamp.slice(0, 10)] =
      (daily[r.timestamp.slice(0, 10)] ?? 0) + 1;
    if (r.hp.some((h) => h <= 0))
      lethalRounds[r.rounds] = (lethalRounds[r.rounds] ?? 0) + 1;
    for (const a of [0, 1] as const) {
      if (actorFilter !== "all" && r.actors[a] !== actorFilter) continue;
      const l = r.loadouts[a],
        won = r.winner === a,
        draw = r.winner === "draw";
      const d = r.stats.reduce((s, v) => s + v.damage[a], 0),
        g = r.stats.reduce((s, v) => s + v.guard[a], 0),
        c = r.stats.reduce((s, v) => s + v.control[a], 0);
      damage += d;
      guard += g;
      control += c;
      unused += r.stats.reduce((s, v) => s + v.unused[a], 0);
      for (const row of [
        (byLegend[l.legend] ??= entity()),
        (byLoadout[JSON.stringify([l.legend, l.cards, l.dice])] ??= entity()),
      ]) {
        row.games++;
        row.wins += +won;
        row.draws += +draw;
        row.rounds += r.rounds;
        row.damage += d;
        row.taken += r.stats.reduce((s, v) => s + v.damage[1 - a], 0);
        row.guard += g;
        row.control += c;
        row.revealed += r.known[a];
        if (r.durationMs !== null) {
          row.durationMs += r.durationMs;
          row.timedGames++;
        }
        r.stats.forEach((v) =>
          v.cards[a].forEach(
            (id) => (row.cards[id] = (row.cards[id] ?? 0) + 1),
          ),
        );
        l.dice.forEach((id) => (row.dice[id] = (row.dice[id] ?? 0) + 1));
      }
      const m = (matchups[`${l.legend}:${r.loadouts[1 - a].legend}`] ??= {
        games: 0,
        wins: 0,
        draws: 0,
        rounds: 0,
      });
      m.games++;
      m.wins += +won;
      m.draws += +draw;
      m.rounds += r.rounds;
      for (const id of l.cards) {
        const row = (byCard[id] ??= {
          equipped: 0,
          equippedWins: 0,
          usedMatches: 0,
          usedWins: 0,
          uses: 0,
          firstRevealRound: 0,
          reveals: 0,
        });
        row.equipped++;
        row.equippedWins += +won;
        const uses = r.stats.filter((v) => v.cards[a].includes(id));
        row.uses += uses.length;
        if (uses.length) {
          row.usedMatches++;
          row.usedWins += +won;
          row.firstRevealRound += uses[0].round;
          row.reveals++;
        }
      }
      for (const id of new Set(l.dice)) {
        const row = (byDie[id] ??= {
          equipped: 0,
          wins: 0,
          slots: 0,
          controls: 0,
          faces: {},
        });
        row.equipped++;
        row.wins += +won;
        row.slots += l.dice.filter((d) => d === id).length;
        row.controls += r.controls.filter(
          (c) => c.actor === a && l.dice[c.slot] === id,
        ).length;
        r.stats.forEach((v) =>
          v.faces[a]
            .filter((f) => f.startsWith(id + ":"))
            .forEach((f) => (row.faces[f] = (row.faces[f] ?? 0) + 1)),
        );
      }
    }
  }
  const pairs = new Map<string, MatchRecord[]>();
  records.forEach((r) => {
    if (r.pair) pairs.set(r.pair.id, [...(pairs.get(r.pair.id) ?? []), r]);
  });
  let paired = 0,
    mismatches = 0;
  for (const rows of pairs.values())
    if (rows.length === 2) {
      const [a, b] = rows;
      paired++;
      const winner = b.winner === "draw" ? "draw" : 1 - b.winner;
      if (a.winner !== winner || a.hp[0] !== b.hp[1] || a.hp[1] !== b.hp[0])
        mismatches++;
    }
  return {
    games: records.length,
    seatWins,
    draws,
    averageRounds: records.length ? rounds / records.length : 0,
    averageDurationMs: timed ? duration / timed : null,
    damage,
    guard,
    control,
    unused,
    byLegend,
    byCard,
    byDie,
    byLoadout,
    matchups,
    lethalRounds,
    daily,
    paired,
    mismatches,
  };
}
export function recordMatch(
  state: MatchState | MatchView,
  source: MatchRecord["source"],
  mode: string,
  durationMs: number | null,
  actors: MatchRecord["actors"],
): MatchRecord {
  if (state.winner === null)
    throw new Error("Only completed matches enter outcome metrics.");
  return {
    id: state.id,
    source,
    mode,
    version: state.version,
    timestamp: new Date().toISOString(),
    durationMs,
    rounds: state.round,
    winner: state.winner,
    loadouts: state.players.map((p) => structuredClone(p.loadout)) as [
      Loadout,
      Loadout,
    ],
    hp: state.players.map((p) => p.hp),
    known: state.players.map((p) => p.known.length),
    stats: structuredClone(state.stats),
    actors,
    controls:
      "replay" in state
        ? state.replay.flatMap((r) =>
            r.plans.flatMap((p, a) =>
              p.controls.map((c) => ({ actor: a, slot: c.slot, kind: c.kind })),
            ),
          )
        : [],
    seed: "seed" in state ? state.seed : undefined,
  };
}
export const percent = (n: number, d: number) =>
  d ? `${((100 * n) / d).toFixed(1)}%` : "—";
export const average = (n: number, d: number) => (d ? (n / d).toFixed(2) : "—");
