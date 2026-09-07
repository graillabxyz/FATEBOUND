import { GAME } from "../content/config";
import { omenById } from "../content/omens";
import { legendById } from "../content/legends";
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
  turnHistory: MatchState["turnHistory"];
  openingFullLife: number[] | null;
  controls: { actor: number; slot: number; kind: string }[];
  actors: ["human" | "ai", "human" | "ai"];
  pair?: { id: string; reversed: boolean };
  seed?: number;
  openingInitiative?: {
    winner: 0 | 1;
    rolls: [number, number];
    bonuses: [number, number];
    totals: [number, number];
  };
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
  records = records.filter((r) => r.version === GAME.version);
  const byDiceSize: Record<string, { games: number; wins: number }> = {};
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
  const seatWins = [0, 0],
    initiativeWins = [0, 0];
  const byClass: Record<string, { games: number; wins: number }> = {};
  const byInitiativeBonus: Record<
    string,
    { games: number; openings: number; wins: number }
  > = {};
  const damageByRound: Record<number, { games: number; damage: number }> = {};
  let held = 0,
    expired = 0,
    rolls = 0,
    reactions = 0,
    reactionWindows = 0,
    reactionSuccess = 0,
    turns = 0,
    initiativeGames = 0;

  for (const r of records) {
    if (r.version !== GAME.version) continue;
    if (r.openingInitiative) {
      initiativeGames++;
      if (r.winner !== "draw")
        initiativeWins[r.winner === r.openingInitiative.winner ? 0 : 1]++;
    }
    for (const [a, l] of r.loadouts.entries()) {
      const cls = legendById[l.legend].class,
        row = (byClass[cls] ??= { games: 0, wins: 0 });
      row.games++;
      row.wins += +(r.winner === a);
      const bonus =
          r.openingInitiative?.bonuses[a] ??
          legendById[l.legend].initiativeBonus,
        br = (byInitiativeBonus[bonus] ??= { games: 0, openings: 0, wins: 0 });
      br.games++;
      br.openings += +(r.openingInitiative?.winner === a);
      br.wins += +(r.winner === a);
    }
    for (const st of r.stats) {
      const sum = (v: number[] | undefined) =>
        (v ?? []).reduce((a, b) => a + b, 0);
      held += sum(st.held);
      expired += sum(st.expired);
      rolls += sum(st.rolls);
      reactions += sum(st.reactions);
      reactionWindows += sum(st.reactionWindows);
      reactionSuccess += sum(st.reactionSuccess);
      turns += sum(st.turns);
      const row = (damageByRound[st.round] ??= { games: 0, damage: 0 });
      row.games++;
      row.damage += sum(st.damage);
    }

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
        row.uses += r.stats.reduce(
          (n, v) => n + v.cards[a].filter((c) => c === id).length,
          0,
        );
        if (uses.length) {
          row.usedMatches++;
          row.usedWins += +won;
          row.firstRevealRound += uses[0].round;
          row.reveals++;
        }
      }
      for (const size of new Set(l.dice.map((id) => omenById[id].size))) {
        const row = (byDiceSize[size] ??= { games: 0, wins: 0 });
        row.games++;
        row.wins += +won;
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
  // Paired reversals share all random draws: count each pair once for uncertainty.
  const independent = new Map<string, MatchRecord>();
  for (const r of records)
    if (r.openingInitiative && r.winner !== "draw")
      independent.set(r.pair?.id ?? r.id, r);
  const independentWins = [...independent.values()].filter(
    (r) => r.winner === r.openingInitiative!.winner,
  ).length;
  const decisive = independent.size;
  const openingRate = decisive ? independentWins / decisive : 0.5;
  const z = 1.96,
    den = 1 + (z * z) / Math.max(1, decisive),
    center = (openingRate + (z * z) / (2 * Math.max(1, decisive))) / den,
    margin =
      (z *
        Math.sqrt(
          (openingRate * (1 - openingRate) +
            (z * z) / (4 * Math.max(1, decisive))) /
            Math.max(1, decisive),
        )) /
      den;
  return {
    byDiceSize,
    independentOpeningGames: decisive,
    initiativeWins,
    initiativeGames,
    openingRate,
    openingConfidence: [center - margin, center + margin],
    initiativeSignificant:
      decisive >= 30 && (center - margin > 0.5 || center + margin < 0.5),
    held,
    expired,
    rolls,
    reactions,
    reactionWindows,
    reactionSuccess,
    turns,
    byClass,
    byInitiativeBonus,
    damageByRound,
    games: records.filter((r) => r.version === GAME.version).length,
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
    turnHistory: structuredClone(state.turnHistory),
    openingFullLife: state.openingFullLife ? [...state.openingFullLife] : null,
    actors,
    controls:
      "replay" in state
        ? state.replay.flatMap((r) =>
            (r.plan?.controls ?? []).map((c) => ({
              actor: r.actor,
              slot: c.slot,
              kind: c.kind,
            })),
          )
        : state.events
            .filter((e) => e.type === "control")
            .map((e) => ({
              actor: e.actor,
              slot: e.amount ?? 0,
              kind: e.text.includes("flip") ? "flip" : "shift",
            })),
    openingInitiative: state.openingInitiative ?? undefined,
    seed: "seed" in state ? state.seed : undefined,
  };
}
export const percent = (n: number, d: number) =>
  d ? `${((100 * n) / d).toFixed(1)}%` : "—";
export const average = (n: number, d: number) => (d ? (n / d).toFixed(2) : "—");
