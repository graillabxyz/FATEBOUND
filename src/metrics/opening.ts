import { legendById } from "../content/legends";
import type { MatchRecord } from "./data";
import { omenById } from "../content/omens";
export function openingMetrics(records: MatchRecord[]) {
  const roles = [0, 1].map(() => ({
    games: 0,
    wins: 0,
    draws: 0,
    turn1Damage: 0,
    turn2Damage: 0,
    turn1Samples: 0,
    turn2Samples: 0,
    held: 0,
    reactions: 0,
  }));
  const choices: Record<
    string,
    { role: number; name: string; games: number; wins: number; draws: number }
  > = {};
  let lifeDifferential = 0,
    fullTurnSamples = 0,
    openingTurnSamples = 0;
  for (const match of records) {
    const winner = match.openingInitiative?.winner;
    if (winner === undefined) continue;
    roles.forEach((role, index) => {
      const seat = index === 0 ? winner : 1 - winner;
      role.games++;
      role.wins += +(match.winner === seat);
      role.draws += +(match.winner === "draw");
    });
    for (const row of match.turnHistory ?? []) {
      const role = row.actor === winner ? 0 : 1,
        r = roles[role];
      if (row.playerTurnCount === 1 && row.slots.length) {
        const ids = row.slots
          .map((slot) => match.loadouts[row.actor].dice[slot])
          .sort();
        const key = JSON.stringify([
          role,
          match.loadouts[row.actor].legend,
          ids,
        ]);
        const choice = (choices[key] ??= {
          role,
          name:
            legendById[match.loadouts[row.actor].legend].name +
            " · " +
            ids.map((id) => omenById[id].name).join(" + "),
          games: 0,
          wins: 0,
          draws: 0,
        });
        choice.games++;
        choice.wins += +(match.winner === row.actor);
        choice.draws += +(match.winner === "draw");
      }
      if (!row.completed) continue;
      if (row.playerTurnCount === 1) {
        r.turn1Damage += row.damage[row.actor];
        r.turn1Samples++;
        r.held += row.held;
      }
      if (row.playerTurnCount === 2) {
        r.turn2Damage += row.damage[row.actor];
        r.turn2Samples++;
      }
      if (row.turn <= 2) {
        roles[0].reactions += row.reactions[winner];
        roles[1].reactions += row.reactions[1 - winner];
        openingTurnSamples++;
      }
    }
    if (match.openingFullLife) {
      lifeDifferential +=
        match.openingFullLife[winner] - match.openingFullLife[1 - winner];
      fullTurnSamples++;
    }
  }
  return {
    roles,
    choices,
    fullTurnSamples,
    openingTurnSamples,
    averageLifeDifferential: fullTurnSamples
      ? lifeDifferential / fullTurnSamples
      : null,
  };
}
