import { GAME } from "../content/config";
import type { DieDef, DieSize } from "./types";
export function randomSource(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
}
export function sharedFate(seed: number, round: number): number[] {
  const next = randomSource((seed ^ Math.imul(round, 0x9e3779b9)) >>> 0);
  return Array.from({ length: 3 }, () => {
    let x = next();
    const max = Math.floor(2 ** 32 / GAME.fateResolution) * GAME.fateResolution;
    while (x >= max) x = next();
    return x % GAME.fateResolution;
  });
}
export function facePosition(token: number, size: DieSize) {
  if (!Number.isInteger(token) || token < 0 || token >= GAME.fateResolution)
    throw new Error("Fate token must be an integer from 0 to 119.");
  return Math.floor((token * size) / GAME.fateResolution);
}
export function shiftedPosition(
  die: DieDef,
  position: number,
  direction: -1 | 1,
) {
  const target = position + direction;
  return die.faces[position]?.type === "number" &&
    die.faces[target]?.type === "number"
    ? target
    : null;
}
