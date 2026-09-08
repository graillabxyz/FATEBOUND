import { CARDS, cardsFor, cardById } from "../content/cards";
import { LEGENDS, legendById } from "../content/legends";
import { AFFINITIES, affinityIds, cardCompatible } from "../content/affinities";
import { OMENS, omenById } from "../content/omens";
import { STARTERS } from "../content/loadouts";
import { GAME } from "../content/config";
import {
  meetsRequirement,
  dieCompatible,
  applyControls,
} from "../engine/rules";
import { randomSource } from "../engine/fate";
import {
  SimulationStalledError,
  type StalledSimulation,
  simulateGame,
} from "./simulation";
import { aggregate, type MatchRecord } from "../metrics/data";
import type { CardDef, Effect, LegendId, Loadout } from "../engine/types";
/** Diagnostic weights, deliberately independent of rarity. */
export const UTILITY_WEIGHTS = {
  damage: 1,
  ward: 0.7,
  healing: 0.8,
  focus: 0.65,
  shift: 0.8,
  flip: 1,
  sigil: 1,
  voidConversion: 0.8,
  heldPreservation: 0.7,
  reactionDenial: 2.5,
  redirect: 2.6,
  initiative: 1,
  resourceDenial: 0.65,
};
export function effectUtility(es: Effect[]): number {
  return es.reduce((sum, e) => {
    const n = e.amount ?? 0;
    let v = 0;
    switch (e.type) {
      case "DAMAGE":
      case "COUNTERSTRIKE":
        v = n;
        break;
      case "GUARD":
        v = n * 0.7;
        break;
      case "REMOVE_WARD":
        v = n * 0.5;
        break;
      case "REVEAL_CARD":
        v = 0.8;
        break;
      case "HEAL":
        v = n * 0.8;
        break;
      case "GAIN_CONTROL":
      case "LOSE_CONTROL":
        v = n * 0.65;
        break;
      case "SHIFT_DIE":
        v = 0.8;
        break;
      case "FLIP_DIE":
        v = 1;
        break;
      case "REDIRECT":
      case "SWAP_ASSIGNMENT":
        v = 2.6;
        break;
      case "CANCEL":
      case "STUN_CARD":
      case "MODIFY_REQUIREMENT":
        v = 2.5;
        break;
      case "BLOCK_EFFECT":
        v = n * 0.7;
        break;
      case "STATUS":
        v = e.status === "poison" ? n * 0.9 : n * 0.8;
        break;
      case "CLEANSE":
        v = 0.6;
        break;
      case "COPY":
        v = 2;
        break;
    }
    if (e.effects)
      v +=
        effectUtility(e.effects) *
        (e.type === "CONDITIONAL" ? 0.5 : e.type === "CONVERT" ? 0.8 : 1);
    if (e.type === "CONVERT") v -= (e.from === "hp" ? 1 : 0.7) * n;
    return sum + v;
  }, 0);
}
function combos(n: number, k: number): number[][] {
  const out: number[][] = [];
  const walk = (start: number, row: number[]) => {
    if (row.length === k) {
      out.push(row);
      return;
    }
    for (let i = start; i < n; i++) walk(i + 1, [...row, i]);
  };
  walk(0, []);
  return out;
}
export function representativeOmens(id: LegendId) {
  const base = STARTERS[id];
  return [
    base.dice,
    ["standard-d4", "standard-d6", "standard-d8"],
    ["standard-d8", "standard-d12", "standard-d20"],
    ["guardian-d6", "trickster-d8", "tengu-d6-0"],
  ].filter((ids) => ids.every((d) => dieCompatible({ ...base, dice: ids }, d)));
}
export function activationProfile(
  card: CardDef,
  legend: LegendId,
  dice: string[],
) {
  const defs = dice.map((id) => omenById[id]),
    slots = combos(3, card.requirement.count),
    loadout = { ...STARTERS[legend], dice };
  let raw = 0,
    focused = 0,
    total = 0;
  const tolerance = legendById[legend].passiveRule?.trigger === "adapt" ? 1 : 0;
  const test = (positions: number[]) =>
    slots.some((ss) =>
      meetsRequirement(
        card.requirement,
        ss.map((i) => defs[i].faces[positions[i]]),
        ss.map((i) => defs[i].size),
        tolerance,
      ),
    );
  for (let a = 0; a < defs[0].size; a++)
    for (let b = 0; b < defs[1].size; b++)
      for (let c = 0; c < defs[2].size; c++) {
        const pos = [a, b, c];
        total++;
        if (test(pos)) {
          raw++;
          focused++;
          continue;
        }
        let possible = false;
        for (let i = 0; i < 3 && !possible; i++)
          for (const action of [
            { slot: i, kind: "flip" as const },
            { slot: i, kind: "shift" as const, direction: 1 as const },
            { slot: i, kind: "shift" as const, direction: -1 as const },
          ]) {
            try {
              if (
                test(
                  applyControls(
                    loadout,
                    pos,
                    [action],
                    Math.max(0, 2 - (card.requirement.control ?? 0)),
                  ).positions,
                )
              ) {
                possible = true;
                break;
              }
            } catch {
              /* Illegal Focus move is not probability access. */
            }
          }
        if (possible) focused++;
      }
  return {
    raw: raw / total,
    oneFocusMove: focused / total,
    facesEvaluated: total,
  };
}
export function evaluatePool() {
  const rows = [];
  for (const l of LEGENDS)
    for (const c of cardsFor(l.id)) {
      const profiles = representativeOmens(l.id).map((dice) => ({
        dice,
        ...activationProfile(c, l.id, dice),
      }));
      let synergy = 0;
      const flat = (es: Effect[]): Effect[] =>
        es.flatMap((e) => [e, ...flat(e.effects ?? [])]);
      const effects = flat(c.effects);
      if (
        l.passiveRule?.trigger === "firstGuard" &&
        effects.some((e) => e.type === "GUARD")
      )
        synergy = 0.7;
      if (
        l.passiveRule?.trigger === "firstManipulation" &&
        c.category === "Manipulation"
      )
        synergy = 1.4;
      if (
        l.passiveRule?.trigger === "preferred" &&
        effects.some((e) => e.type === "DAMAGE")
      )
        synergy = 0.35;
      if (
        l.passiveRule?.trigger === "categoryChange" &&
        effects.some((e) => e.type === "DAMAGE")
      )
        synergy = 0.3;
      const base =
          effectUtility(c.effects) -
          (c.requirement.life ?? 0) -
          (c.requirement.control ?? 0) * UTILITY_WEIGHTS.focus,
        probability = profiles.reduce((n, p) => n + p.raw, 0) / profiles.length,
        utility = Math.max(0, base + synergy);
      rows.push({
        legend: l.id,
        card: c.id,
        rarity: c.rarity,
        unbound: c.affinityRequirements === null,
        profiles,
        activationProbability: probability,
        utility,
        synergy,
        powerScore:
          (utility *
            (0.45 + 0.55 * probability) *
            (c.timing === "REACTION" ? 1.05 : 1)) /
          Math.sqrt(c.requirement.count),
        legalLegendCount: LEGENDS.filter((l) =>
          cardsFor(l.id).some((x) => x.id === c.id),
        ).length,
      });
    }
  return rows;
}
export type PoolEvaluation = ReturnType<typeof evaluatePool>;
export function* legalHands(legend: LegendId): Generator<string[]> {
  const ids = cardsFor(legend).map((c) => c.id);
  for (const ss of combos(ids.length, 4)) yield ss.map((i) => ids[i]);
}
export function candidateHands(
  legend: LegendId,
  evaluation: PoolEvaluation,
  seed: number,
) {
  const ranked = evaluation
      .filter((r) => r.legend === legend)
      .sort(
        (a, b) => b.powerScore - a.powerScore || a.card.localeCompare(b.card),
      )
      .map((r) => r.card),
    all = cardsFor(legend).map((c) => c.id),
    hands = new Map<string, string[]>();
  const add = (ids: string[]) => {
    const unique = [...new Set(ids)];
    if (unique.length === 4) hands.set([...unique].sort().join("|"), unique);
  };
  add(STARTERS[legend].cards);
  // Every legal Card is probed in a complete Hand. Include several complements, not isolated effects.
  for (const probe of all) {
    const reactions = ranked.filter((id) => cardById[id].timing === "REACTION"),
      actions = ranked.filter((id) => cardById[id].timing === "ACTION");
    add(
      [
        probe,
        ...[actions[0], reactions[0], ...ranked].filter((id) => id !== probe),
      ]
        .filter((id, i, arr) => arr.indexOf(id) === i)
        .slice(0, 4),
    );
  }
  // Exhaustively enumerate legal Hands; retain the best twelve by a modest coverage-aware score.
  const top: { hand: string[]; score: number }[] = [];
  const scores = new Map(
    evaluation
      .filter((r) => r.legend === legend)
      .map((r) => [r.card, r.powerScore]),
  );
  for (const hand of legalHands(legend)) {
    const reactions = hand.filter(
      (id) => cardById[id].timing === "REACTION",
    ).length;
    const bands = new Set(
      hand.map((id) => {
        const r = cardById[id].requirement;
        return r.void
          ? "void"
          : r.symbol
            ? "sigil"
            : r.count > 1
              ? "combined"
              : r.exact !== undefined
                ? "exact"
                : (r.max ?? 99) <= 4
                  ? "low"
                  : "range";
      }),
    );
    const score =
      hand.reduce((n, id) => n + scores.get(id)!, 0) +
      bands.size * 0.2 +
      (reactions > 0 && reactions < 4 ? 0.5 : -1);
    if (top.length < 12 || score > top[top.length - 1].score) {
      top.push({ hand, score });
      top.sort((a, b) => b.score - a.score);
      top.length = Math.min(12, top.length);
    }
  }
  top.forEach((x) => add(x.hand));
  const rng = randomSource(seed);
  for (let i = 0; i < 12; i++) {
    const shuffled = [...all];
    for (let j = shuffled.length - 1; j > 0; j--) {
      const k = rng() % (j + 1);
      [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
    }
    add(shuffled.slice(0, 4));
  }
  return [...hands.values()];
}
export type HandAuditConfig = { seed: number; pairs: number };
export type AuditJob = {
  legend: LegendId;
  loadout: Loadout;
  opponent: Loadout;
  seed: number;
};
export function prepareHandAudit(config: HandAuditConfig) {
  if (
    !Number.isInteger(config.pairs) ||
    config.pairs < 1 ||
    config.pairs > 10 ||
    !Number.isInteger(config.seed)
  )
    throw new Error("Choose 1–10 paired seeds per Hand.");
  const evaluation = evaluatePool(),
    jobs: AuditJob[] = [];
  for (const l of LEGENDS) {
    const hands = candidateHands(l.id, evaluation, config.seed);
    hands.forEach((cards, i) =>
      representativeOmens(l.id).forEach((dice, j) => {
        const opponent = STARTERS[LEGENDS[(i + j) % LEGENDS.length].id];
        jobs.push({
          legend: l.id,
          loadout: {
            ...STARTERS[l.id],
            id: `audit-${l.id}-${i}-${j}`,
            name: "Sampled shared-pool Hand",
            cards,
            dice,
          },
          opponent,
          seed: config.seed + i * 41 + j * 7,
        });
      }),
    );
  }
  return { evaluation, jobs };
}
export function evaluateHand(job: AuditJob, pairs: number) {
  const records: MatchRecord[] = [];
  const stalled: StalledSimulation[] = [];
  for (let i = 0; i < pairs * 2; i++) {
    try {
      records.push(
        simulateGame(
          {
            loadouts: [job.loadout, job.opponent],
            seed: job.seed,
            games: pairs * 2,
            paired: true,
            difficulty: "Normal",
          },
          i,
        ),
      );
    } catch (e) {
      if (e instanceof SimulationStalledError) stalled.push(e.detail);
      else throw e;
    }
  }
  const summary = aggregate(records);
  const candidateWins = records.filter(
    (r) => r.winner === (r.pair?.reversed ? 1 : 0),
  ).length;
  const used: Record<string, number> = {};
  for (const r of records)
    for (const stats of r.stats)
      for (const id of stats.cards[r.pair?.reversed ? 1 : 0])
        used[id] = (used[id] ?? 0) + 1;
  return {
    legend: job.legend,
    cards: job.loadout.cards,
    dice: job.loadout.dice,
    opponent: job.opponent.legend,
    games: records.length,
    stalled,
    wins: candidateWins,
    draws: summary.draws,
    winRate: records.length ? candidateWins / records.length : 0,
    uses: used,
    damage: summary.damage,
    ward: summary.guard,
    focus: summary.control,
    held: summary.held,
    reactions: summary.reactions,
    rounds: summary.averageRounds,
    openingRate: summary.openingRate,
    mismatches: summary.mismatches,
  };
}
export type HandAuditRow = ReturnType<typeof evaluateHand>;
/** Conservative same-effect comparison; a design-review flag, not an optimal-play proof. */
export function structuralCardFlags() {
  const flags: string[] = [];
  const simple = (c: CardDef) =>
    Object.keys(c.requirement).every((k) =>
      ["count", "min", "max"].includes(k),
    ) && c.requirement.count === 1;
  for (const c of CARDS.filter(simple))
    for (const other of CARDS.filter(simple)) {
      if (
        c.id === other.id ||
        c.timing !== other.timing ||
        c.category !== other.category ||
        c.priority !== other.priority ||
        JSON.stringify(c.effects) !== JSON.stringify(other.effects)
      )
        continue;
      const lo = c.requirement.min ?? 1,
        hi = c.requirement.max ?? 20,
        olo = other.requirement.min ?? 1,
        ohi = other.requirement.max ?? 20;
      if (
        olo <= lo &&
        ohi >= hi &&
        (olo < lo || ohi > hi) &&
        LEGENDS.filter((l) => cardCompatible(l, c)).every((l) =>
          cardCompatible(l, other),
        )
      )
        flags.push(
          `${c.name}: ${other.name} offers the same effect over a broader Value range and at least the same Affinity access. Differentiate or consolidate before release.`,
        );
    }
  for (const c of CARDS)
    if (
      c.effects.length === 1 &&
      c.effects[0].type === "GUARD" &&
      c.requirement.count === 1 &&
      c.requirement.min &&
      !c.requirement.max
    ) {
      const n = c.effects[0].amount ?? 0;
      if (n <= GAME.universalWard)
        flags.push(
          `${c.name}: universal Ward grants ${GAME.universalWard} per numbered Omen and matches or exceeds this effect. Review the useful activation band and opportunity cost of a Hand slot.`,
        );
    }
  return flags;
}
export function finishHandAudit(
  config: HandAuditConfig,
  evaluation: PoolEvaluation,
  hands: HandAuditRow[],
) {
  const usage = Object.fromEntries(
    CARDS.map((c) => [
      c.id,
      { hands: 0, games: 0, wins: 0, uses: 0, strongHands: 0 },
    ]),
  );
  let strong = 0;
  for (const h of hands) {
    if (h.winRate >= 0.6) strong++;
    for (const id of h.cards) {
      const u = usage[id];
      u.hands++;
      u.games += h.games;
      u.wins += h.wins;
      u.uses += h.uses[id] ?? 0;
      if (h.winRate >= 0.6) u.strongHands++;
    }
  }
  const flags: string[] = structuralCardFlags();
  const stalledCount = hands.reduce((n, h) => n + h.stalled.length, 0);
  if (stalledCount)
    flags.push(
      `${stalledCount} sampled games stalled: excluded from outcome rates. Completed-game win rates may be biased; inspect stalled seeds before ranking these Hands.`,
    );
  for (const c of CARDS) {
    const u = usage[c.id];
    if (!u.uses)
      flags.push(
        `${c.name}: no activations in sampled Hands; inspect requirements and AI policy.`,
      );
    if (
      c.affinityRequirements === null &&
      strong >= 20 &&
      u.strongHands / strong > 0.5
    )
      flags.push(
        `${c.name}: Unbound in ${((100 * u.strongHands) / strong).toFixed(1)}% of strong sampled Hands; possible automatic inclusion.`,
      );
  }
  const starter = [];
  const starterStalls: StalledSimulation[] = [];
  for (let i = 0; i < 200; i++) {
    try {
      starter.push(
        simulateGame(
          {
            loadouts: [STARTERS.basajaun, STARTERS.anansi],
            seed: config.seed,
            games: 200,
            paired: true,
            difficulty: "Normal",
          },
          i,
        ),
      );
    } catch (e) {
      if (e instanceof SimulationStalledError) starterStalls.push(e.detail);
      else throw e;
    }
  }
  if (starterStalls.length)
    flags.push(
      `${starterStalls.length} starter games stalled; unfinished games excluded.`,
    );
  const starterStats = aggregate(starter),
    basajaunWins = starter.filter(
      (r) => r.winner === (r.pair?.reversed ? 1 : 0),
    ).length;
  if (Math.abs(basajaunWins / Math.max(1, starter.length) - 0.5) > 0.08)
    flags.push(
      `Starter mismatch: Basajaun ${((100 * basajaunWins) / Math.max(1, starter.length)).toFixed(1)}% wins; do not claim even starter balance.`,
    );
  return {
    version: GAME.version,
    config,
    method:
      "All legal Legend/Card pairs evaluated; every legal four-Card combination enumerated for ranking. Deterministic top, diverse and per-Card coverage Hands simulated against rotating starter opponents with paired seats/RNG streams. Four representative Omen profiles. This is a heuristic screening cohort, not exhaustive competitive play or causal Card win rates.",
    probabilityNotes:
      "Full three-Omen roll probability; optional one affordable Shift/Flip. Context requirements and once-per-round passive availability require playtesting; no rarity multiplier. Held value and repeatability are resource opportunity costs, not free extra casts.",
    content: {
      legends: LEGENDS.length,
      cards: CARDS.length,
      omens: OMENS.length,
      rarities: Object.fromEntries(
        ["common", "uncommon", "rare", "mythic"].map((r) => [
          r,
          CARDS.filter((c) => c.rarity === r).length,
        ]),
      ),
      access: LEGENDS.map((l) => ({
        legend: l.id,
        cards: cardsFor(l.id).length,
        hands: combos(cardsFor(l.id).length, 4).length,
      })),
      affinities: AFFINITIES.map((a) => ({
        id: a.id,
        cards: CARDS.filter((c) =>
          affinityIds(c.affinityRequirements).includes(a.id),
        ).length,
      })),
    },
    utilityWeights: UTILITY_WEIGHTS,
    evaluation,
    hands,
    usage,
    flags,
    starter: {
      games: starter.length,
      attempted: 200,
      stalled: starterStalls,
      basajaunWins,
      anansiWins: starter.length - basajaunWins - starterStats.draws,
      draws: starterStats.draws,
      openingRate: starterStats.openingRate,
      mismatches: starterStats.mismatches,
    },
    games: hands.reduce((n, h) => n + h.games, starter.length),
    mismatches: hands.reduce(
      (n, h) => n + h.mismatches,
      starterStats.mismatches,
    ),
  };
}
export type HandAuditReport = ReturnType<typeof finishHandAudit>;
