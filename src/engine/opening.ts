import type { MatchState, PlayerState, MatchConfig } from "./types";
/** Opening allowances depend on the owner's turn count, never on the Round. */
export function rollAllowance(
  player: Pick<PlayerState, "playerTurnCount">,
  openingWinner: number,
  actor: number,
  counts: MatchConfig["openingOmenCounts"],
): number {
  return player.playerTurnCount === 1
    ? counts[actor === openingWinner ? 0 : 1]
    : 3;
}
export function finishTurnMetrics(s: MatchState) {
  const row = s.turnHistory.at(-1);
  if (!row || row.completed) return;
  row.damage = s.players.map((p, i) =>
    Math.max(0, p.damageDealt - row.damageAtStart[i]),
  );
  row.reactions = s.stats
    .at(-1)!
    .reactions.map((n, i) => Math.max(0, n - row.reactionsAtStart[i]));
  row.held = s.players[row.actor].dice.filter((d) =>
    ["AVAILABLE", "HELD"].includes(d.state),
  ).length;
  row.completed = true;
}

/** Validate and sanitize turn telemetry for checkpoints and authenticated ingestion. */
export function copyTurnHistory(value: unknown): MatchState["turnHistory"] {
  if (!Array.isArray(value) || value.length > 198)
    throw new Error("Invalid turn history.");
  const integer = (n: unknown, max: number) =>
    typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= max;
  return value.map((r) => {
    if (
      !r ||
      ![0, 1].includes(r.actor) ||
      !integer(r.turn, 198) ||
      r.turn < 1 ||
      !integer(r.round, 99) ||
      r.round < 1 ||
      !integer(r.playerTurnCount, 198) ||
      r.playerTurnCount < 1 ||
      !Array.isArray(r.slots) ||
      r.slots.length > 3 ||
      new Set(r.slots).size !== r.slots.length ||
      r.slots.some((n: unknown) => !integer(n, 2)) ||
      !integer(r.held, 3) ||
      typeof r.completed !== "boolean"
    )
      throw new Error("Invalid turn metrics.");
    for (const key of [
      "lifeAtStart",
      "damageAtStart",
      "reactionsAtStart",
      "damage",
      "reactions",
    ])
      if (
        !Array.isArray(r[key]) ||
        r[key].length !== 2 ||
        r[key].some((n: unknown) => !integer(n, 100000))
      )
        throw new Error("Invalid turn counters.");
    return {
      turn: r.turn,
      round: r.round,
      actor: r.actor,
      playerTurnCount: r.playerTurnCount,
      slots: [...r.slots],
      held: r.held,
      completed: r.completed,
      lifeAtStart: [...r.lifeAtStart],
      damageAtStart: [...r.damageAtStart],
      reactionsAtStart: [...r.reactionsAtStart],
      damage: [...r.damage],
      reactions: [...r.reactions],
    };
  });
}
