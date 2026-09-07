import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import type { Settings } from "./profile";
export type AudioCue =
  | "emote"
  | "heal"
  | "wardBreak"
  | "reaction"
  | "roll"
  | "settle"
  | "symbol"
  | "shift"
  | "flip"
  | "reveal"
  | "attack"
  | "guard"
  | "status"
  | "damage"
  | "victory"
  | "defeat"
  | "matchFound"
  | "menu";
const notes: Record<AudioCue, number[]> = {
  emote: [520, 660],
  heal: [392, 523],
  wardBreak: [210, 140],
  reaction: [392, 587],
  roll: [110, 140, 100],
  settle: [180],
  symbol: [440, 660],
  shift: [330, 440],
  flip: [220, 550],
  reveal: [294, 392],
  attack: [140, 80],
  guard: [440, 330],
  status: [330],
  damage: [120],
  victory: [392, 494, 587],
  defeat: [294, 247, 196],
  matchFound: [330, 440, 660],
  menu: [520],
};
let context: AudioContext | undefined;
let ambient: OscillatorNode | undefined;
let ambientGain: GainNode | undefined;
export function audioCue(cue: AudioCue, settings: Settings) {
  if (
    settings.haptics &&
    !settings.reducedMotion &&
    ["flip", "attack", "damage", "wardBreak", "reaction", "victory"].includes(
      cue,
    )
  ) {
    if (Capacitor.isNativePlatform())
      void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    else navigator.vibrate?.(12);
  }
  if (settings.sfx <= 0) return;
  try {
    context ??= new AudioContext();
    void context.resume();
    notes[cue].forEach((frequency, i) => {
      const oscillator = context!.createOscillator(),
        gain = context!.createGain();
      oscillator.type = cue === "roll" ? "triangle" : "sine";
      oscillator.frequency.value = frequency;
      const at = context!.currentTime + i * 0.065;
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(
        (settings.sfx / 100) * 0.055,
        at + 0.008,
      );
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.12);
      oscillator.connect(gain).connect(context!.destination);
      oscillator.start(at);
      oscillator.stop(at + 0.13);
    });
  } catch {
    /* Audio is optional, including before the first user gesture. */
  }
}
export function setAmbient(settings: Settings) {
  if (!context || settings.batterySaver || settings.music === 0) {
    ambient?.stop();
    ambient = undefined;
    return;
  }
  if (!ambient) {
    ambient = context.createOscillator();
    ambient.frequency.value = 98;
    ambientGain = context.createGain();
    ambient.connect(ambientGain).connect(context.destination);
    ambient.start();
  }
  ambientGain!.gain.setTargetAtTime(
    (settings.music / 100) * 0.008,
    context.currentTime,
    0.2,
  );
}
