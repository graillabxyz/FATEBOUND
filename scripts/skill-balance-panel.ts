import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")),
);
const root = resolve(args.root ?? ".");
const mod = (p: string) => import(pathToFileURL(resolve(root, p)).href);
const { createMatch, advance, lockPlan, decisionContext } = await mod(
  "src/engine/match.ts",
);
const { inspectAI } = await mod("src/engine/ai.ts");
const { STARTERS } = await mod("src/content/loadouts.ts");
const { LEGENDS } = await mod("src/content/legends.ts");
const { cardById } = await mod("src/content/cards.ts");
const { GAME } = await mod("src/content/config.ts");
const { validateLoadout } = await mod("src/engine/rules.ts");
const pairs = LEGENDS.flatMap((a: any, i: number) =>
  LEGENDS.slice(i).map((b: any) => [a.id, b.id]),
);
const seeds = Number(args.seeds ?? 6),
  label = args.label ?? "candidate",
  rows: any[] = [];
const variants: Record<string, string[]> = {
  basajaun: ["crush", "oakheart", "barkskin", "fell-the-axe"],
  anansi: ["read-the-thread", "false-promise", "unravel", "silken-cut"],
  tengu: ["falling-leaf", "peak-strike", "watchful-blade", "meditate"],
  leshy: ["crooked-bough", "hollow-sign", "night-spores", "lost-path"],
  quetzalcoatl: ["first-light", "horizon", "dawn-shield", "sun-lance"],
  maui: ["wavebreaker", "oakheart", "bramble-trap", "daring-feint"],
};
const total = pairs.length * seeds * 2;
let done = 0;
for (const [a, b] of pairs)
  for (let j = 0; j < seeds; j++)
    for (const reverse of [false, true]) {
      const loadouts = structuredClone([STARTERS[a], STARTERS[b]]);
      if (args.custom === "true")
        loadouts.forEach((l: any) => (l.cards = variants[l.legend]));
      loadouts.forEach((l: any) => validateLoadout(l));
      if (reverse) loadouts.reverse();
      const seed =
        Number(args.seed ?? 730000) +
        pairs.findIndex((p: any) => p[0] === a && p[1] === b) * 100 +
        j;
      const s = createMatch(seed, loadouts, undefined, {
        rngSeats: reverse ? [1, 0] : [0, 1],
      });
      let steps = 0,
        decisions = 0,
        rawDead = 0,
        focusedDead = 0,
        choiceSum = 0,
        abilities = 0,
        utility = 0,
        reactionUses = 0,
        rollChecks = 0;
      let lastTurn = -1;
      while (s.phase !== "MATCH_END" && s.round <= 100 && steps++ < 20000) {
        if (
          ["OMEN_CHOICE", "MAIN_ACTION", "REACTION_WINDOW"].includes(s.phase)
        ) {
          const actor =
            s.phase === "REACTION_WINDOW" ? 1 - s.activePlayer : s.activePlayer;
          const ctx = decisionContext(s, actor),
            ai = inspectAI(ctx, "Normal", 10000);
          const available = ai.alternatives.filter(
            (x: any) =>
              x.plan.assignments.length &&
              x.plan.assignments[0].target !== "guard",
          );
          if (s.phase === "MAIN_ACTION" && lastTurn !== s.turn) {
            lastTurn = s.turn;
            rollChecks++;
            const keys = (xs: any[]) =>
              new Set(xs.map((x) => JSON.stringify(x.plan.assignments))).size;
            rawDead += +(
              keys(available.filter((x: any) => !x.plan.controls.length)) === 0
            );
            focusedDead += +(keys(available) === 0);
            choiceSum += keys(available);
          }
          let plan = ai.chosen;
          // Compare one policy change on the same legal candidates; not a model of human skill.
          if (
            args.policy === "true" &&
            actor === (reverse ? 1 : 0) &&
            s.phase !== "OMEN_CHOICE"
          ) {
            const candidates = [...ai.alternatives].sort((x: any, y: any) => {
              const score = (z: any) =>
                z.details.expectedDamage * 2 +
                (s.phase === "REACTION_WINDOW" ? z.details.defense : 0) -
                z.details.controlSpent * 0.1;
              return (
                score(y) - score(x) ||
                JSON.stringify(x.plan).localeCompare(JSON.stringify(y.plan))
              );
            });
            plan = candidates[0]?.plan ?? plan;
          }
          if (plan.assignments.length) {
            abilities++;
            if (s.phase === "REACTION_WINDOW") reactionUses++;
            const t = plan.assignments[0].target;
            const es =
              t === "guard"
                ? [{ type: "GUARD" }]
                : t === "legend"
                  ? LEGENDS.find(
                      (l: any) => l.id === s.players[actor].loadout.legend,
                    ).active.effects
                  : cardById[t].effects;
            const hasNonDamage = (es: any[]): boolean =>
              es.some((e) =>
                e.effects
                  ? hasNonDamage(e.effects)
                  : !["DAMAGE", "COUNTERSTRIKE"].includes(e.type),
              );
            utility += +hasNonDamage(es);
          }
          decisions++;
          lockPlan(s, actor, plan);
        } else advance(s);
      }
      const stalled = s.phase !== "MATCH_END";
      rows.push({
        a,
        b,
        seed,
        reverse,
        winner: stalled ? null : s.winner,
        opening: s.openingInitiative.winner,
        rounds: Math.min(100, s.round),
        hp: s.players.map((p: any) => p.hp),
        damage: s.players.map((p: any) => p.damageDealt),
        loadouts,
        stalled,
        rollChecks,
        rawDead,
        focusedDead,
        choiceSum,
        abilities,
        utility,
        reactionUses,
        held: s.stats.reduce(
          (n: number, r: any) => n + r.held[0] + r.held[1],
          0,
        ),
        rolls: s.stats.reduce(
          (n: number, r: any) => n + r.rolls[0] + r.rolls[1],
          0,
        ),
        expired: s.stats.reduce(
          (n: number, r: any) => n + r.expired[0] + r.expired[1],
          0,
        ),
        ward: s.stats.reduce(
          (n: number, r: any) => n + r.guard[0] + r.guard[1],
          0,
        ),
        wardAbsorbed: s.events.reduce(
          (n: number, e: any) => n + (e.wardAbsorbed ?? 0),
          0,
        ),
        focus: s.stats.reduce(
          (n: number, r: any) => n + r.control[0] + r.control[1],
          0,
        ),
        maxTurnDamage: Math.max(
          0,
          ...s.turnHistory.map((t: any) => t.damage[t.actor]),
        ),
        cardUses: s.stats.flatMap((r: any) => r.cards.flat()),
      });
      done++;
      if (done % 20 === 0) console.log(label, done, total);
    }
let mismatches = 0;
for (let i = 0; i < rows.length; i += 2) {
  const a = rows[i],
    b = rows[i + 1];
  if (
    a.stalled !== b.stalled ||
    a.hp[0] !== b.hp[1] ||
    a.hp[1] !== b.hp[0] ||
    (a.winner !== null &&
      a.winner !== (b.winner === "draw" ? "draw" : 1 - b.winner))
  )
    mismatches++;
}
const completed = rows.filter((r) => !r.stalled),
  sum = (key: string) => rows.reduce((n, r) => n + r[key], 0);
const report = {
  label,
  version: GAME.version,
  root: args.root ?? ".",
  policy: args.policy === "true",
  seedBase: Number(args.seed ?? 730000),
  seeds,
  attempted: rows.length,
  completed: completed.length,
  stalled: rows.length - completed.length,
  mismatches: args.policy === "true" ? null : mismatches,
  averageRounds:
    completed.reduce((n, r) => n + r.rounds, 0) / Math.max(1, completed.length),
  rawDeadRate: sum("rawDead") / sum("rollChecks"),
  focusedDeadRate: sum("focusedDead") / sum("rollChecks"),
  choicesPerRoll: sum("choiceSum") / sum("rollChecks"),
  utilityShare: sum("utility") / sum("abilities"),
  reactionsPerGame: sum("reactionUses") / rows.length,
  wardPerGame: sum("ward") / rows.length,
  absorbedPerGame: sum("wardAbsorbed") / rows.length,
  damagePerGame:
    rows.reduce((n, r) => n + r.damage[0] + r.damage[1], 0) / rows.length,
  focusPerGame: sum("focus") / rows.length,
  heldShare: sum("held") / sum("rolls"),
  expiredShare: sum("expired") / sum("rolls"),
  byLegend: LEGENDS.map((l: any) => {
    const entries = completed.flatMap((r) =>
      r.loadouts.flatMap((x: any, i: number) =>
        x.legend === l.id
          ? [{ win: r.winner === i, draw: r.winner === "draw" }]
          : [],
      ),
    );
    return {
      legend: l.id,
      games: entries.length,
      score:
        entries.reduce((n: any, r: any) => n + +r.win + +r.draw * 0.5, 0) /
        Math.max(1, entries.length),
    };
  }),
  rows,
};
mkdirSync("reports/skill-balance-v9", { recursive: true });
writeFileSync(
  `reports/skill-balance-v9/${label}.json`,
  JSON.stringify(report),
);
console.log(JSON.stringify({ ...report, rows: undefined }, null, 2));
