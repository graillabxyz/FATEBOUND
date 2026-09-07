import { GAME } from "../content/config";
import { STARTERS } from "../content/loadouts";
import { LEGENDS } from "../content/legends";
import { CARDS } from "../content/cards";
import { OMENS } from "../content/omens";
import { COSMETICS, PASS_REWARDS, QUESTS } from "../content/economy";
import { validateLoadout } from "../engine/rules";
import type { LegendId, Loadout, MatchView } from "../engine/types";
export type Settings = {
  music: number;
  sfx: number;
  haptics: boolean;
  batterySaver: boolean;
  reducedMotion: boolean;
  notifications: Record<string, boolean>;
  language: string;
  muted: boolean;
};
export type Profile = {
  version: 1;
  name: string;
  title: string;
  xp: number;
  coins: number;
  gems: number;
  seasonXp: number;
  mastery: Record<LegendId, number>;
  wins: number;
  matches: number;
  streak: number;
  bestStreak: number;
  rankPoints: number;
  highestRankPoints: number;
  loadouts: Loadout[];
  activeId: string;
  favorites: string[];
  cosmetics: string[];
  skin: string;
  claimedMatches: string[];
  claimedPass: string[];
  claimedQuests: string[];
  premium: boolean;
  tutorialComplete: boolean;
  settings: Settings;
  questCounts: Record<string, Record<string, number>>;
  dailyReplaced: string[];
  recent: { name: string; legend: LegendId; result: string }[];
};
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export function freshProfile(): Profile {
  return {
    version: 1,
    name: "Wayfarer",
    title: "The story begins",
    xp: 0,
    coins: 250,
    gems: 0,
    seasonXp: 0,
    mastery: Object.fromEntries(LEGENDS.map((l) => [l.id, 0])) as Record<
      LegendId,
      number
    >,
    wins: 0,
    matches: 0,
    streak: 0,
    bestStreak: 0,
    rankPoints: 0,
    highestRankPoints: 0,
    loadouts: structuredClone(Object.values(STARTERS)),
    activeId: STARTERS.basajaun.id,
    favorites: [],
    cosmetics: ["carved"],
    skin: "carved",
    claimedMatches: [],
    claimedPass: [],
    claimedQuests: [],
    premium: false,
    tutorialComplete: false,
    settings: {
      music: 25,
      sfx: 40,
      haptics: true,
      batterySaver: false,
      reducedMotion: false,
      notifications: {
        daily: false,
        weekly: false,
        season: false,
        challenge: false,
        cosmetic: false,
        rewards: false,
      },
      language: "English",
      muted: false,
    },
    questCounts: {},
    dailyReplaced: [],
    recent: [],
  };
}
export const PROFILE_KEY = "fatebound.profile.v1";
export class LocalProfileService {
  readonly isMock = true;
  constructor(private storage: StorageAdapter) {}
  load(): Profile {
    try {
      const p = JSON.parse(
        this.storage.getItem(PROFILE_KEY) ?? "null",
      ) as Profile;
      if (!p || p.version !== 1) return freshProfile();
      p.loadouts.forEach((l) => validateLoadout(l));
      if (
        !p.loadouts.some((l) => l.id === p.activeId) ||
        !Number.isFinite(p.coins) ||
        !Number.isFinite(p.xp)
      )
        return freshProfile();
      return {
        ...freshProfile(),
        ...p,
        settings: { ...freshProfile().settings, ...p.settings },
      };
    } catch {
      return freshProfile();
    }
  }
  save(p: Profile) {
    this.storage.setItem(PROFILE_KEY, JSON.stringify(p));
  }
  ownedGameplay() {
    return new Set([
      ...LEGENDS.map((l) => l.id),
      ...CARDS.map((c) => c.id),
      ...OMENS.map((d) => d.id),
    ]);
  }
  saveLoadout(p: Profile, loadout: Loadout) {
    validateLoadout(loadout, this.ownedGameplay());
    const next = structuredClone(p);
    const i = next.loadouts.findIndex((l) => l.id === loadout.id);
    if (i < 0) next.loadouts.push(loadout);
    else next.loadouts[i] = loadout;
    next.activeId = loadout.id;
    this.save(next);
    return next;
  }
  claimMatch(p: Profile, view: MatchView, mode: string, now = Date.now()) {
    if (view.phase !== "MATCH_END" || view.winner === null)
      throw new Error("Only completed matches grant rewards.");
    if (p.claimedMatches.includes(view.id)) return p;
    const n = structuredClone(p);
    const win = view.winner === 0;
    n.claimedMatches.push(view.id);
    n.xp += GAME.rewards.xp + (win ? 30 : 0);
    n.coins += GAME.rewards.coins + (win ? 15 : 0);
    n.seasonXp += GAME.rewards.season;
    n.mastery[view.players[0].loadout.legend] += GAME.rewards.mastery;
    n.matches++;
    if (win) n.wins++;
    n.streak = win ? n.streak + 1 : 0;
    n.bestStreak = Math.max(n.bestStreak, n.streak);
    if (mode === "Ranked")
      n.rankPoints = Math.max(
        0,
        n.rankPoints + (win ? 25 : view.winner === "draw" ? 0 : -10),
      );
    n.highestRankPoints = Math.max(n.highestRankPoints, n.rankPoints);
    const metrics = {
      matches: 1,
      wins: win ? 1 : 0,
      guards: view.events.filter((e) => e.actor === 0 && e.type === "guard")
        .length,
      control: view.stats.reduce((s, r) => s + r.control[0], 0),
      reveals: view.players[0].known.length,
    };
    for (const period of ["daily", "weekly", "season"]) {
      const key = periodKey(period, now);
      n.questCounts[key] ??= {};
      for (const [metric, value] of Object.entries(metrics))
        n.questCounts[key][metric] = (n.questCounts[key][metric] ?? 0) + value;
    }
    n.recent.unshift({
      name: "Training partner",
      legend: view.players[1].loadout.legend,
      result: win ? "Victory" : view.winner === "draw" ? "Draw" : "Defeat",
    });
    n.recent = n.recent.slice(0, 12);
    if (
      n.mastery.basajaun >= 19 * 200 &&
      !n.cosmetics.includes("forest-master")
    )
      n.cosmetics.push("forest-master");
    this.save(n);
    return n;
  }
  claimPass(p: Profile, level: number, track: "free" | "premium") {
    const id = `${GAME.season.id}:${level}:${track}`;
    if (
      p.claimedPass.includes(id) ||
      level > seasonLevel(p) ||
      level < 1 ||
      level > 50 ||
      (track === "premium" && !p.premium)
    )
      return p;
    const reward = PASS_REWARDS[level - 1][track];
    const n = structuredClone(p);
    n.claimedPass.push(id);
    if (reward.type === "coins") n.coins += reward.amount;
    else if (reward.type === "gems") n.gems += reward.amount;
    else {
      const cosmetic = track === "free" ? "first-light" : "obsidian";
      if (!n.cosmetics.includes(cosmetic)) n.cosmetics.push(cosmetic);
      else n.coins += 50;
    }
    this.save(n);
    return n;
  }
  claimQuest(p: Profile, id: string, now = Date.now()) {
    const q = QUESTS.find((q) => q.id === id);
    if (!q) return p;
    const key = periodKey(q.period, now),
      claim = `${key}:${q.id}`;
    const replaced = p.dailyReplaced.includes(key);
    if (
      (id === "daily-reveal" && !replaced) ||
      (id === "daily-control" && replaced)
    )
      return p;
    if (
      p.claimedQuests.includes(claim) ||
      (p.questCounts[key]?.[q.metric] ?? 0) < q.target
    )
      return p;
    const n = structuredClone(p);
    n.claimedQuests.push(claim);
    n.seasonXp += q.xp;
    this.save(n);
    return n;
  }
  replaceDaily(p: Profile, now = Date.now()) {
    const key = periodKey("daily", now);
    if (
      p.dailyReplaced.includes(key) ||
      p.claimedQuests.includes(`${key}:daily-control`)
    )
      return p;
    const n = { ...p, dailyReplaced: [...p.dailyReplaced, key] };
    this.save(n);
    return n;
  }
  purchaseCosmetic(p: Profile, id: string) {
    const cosmetic = COSMETICS.find((c) => c.id === id);
    if (!cosmetic || cosmetic.earned)
      throw new Error("This cosmetic must be earned.");
    if (p.cosmetics.includes(id)) return p;
    if (p[cosmetic.currency] < cosmetic.price)
      throw new Error(`Not enough ${cosmetic.currency}.`);
    const n = structuredClone(p);
    n[cosmetic.currency] -= cosmetic.price;
    n.cosmetics.push(id);
    this.save(n);
    return n;
  }
}
export const level = (p: Profile) => 1 + Math.floor(p.xp / 300);
export const masteryLevel = (p: Profile, l: LegendId) =>
  Math.min(50, 1 + Math.floor(p.mastery[l] / 200));
export const seasonLevel = (p: Profile) =>
  Math.min(50, Math.floor(p.seasonXp / GAME.season.xpPerLevel) + 1);
export const rankLabel = (p: Profile) =>
  ["Stone", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Mythic"][
    Math.min(6, Math.floor(p.rankPoints / 150))
  ] + (p.rankPoints >= 900 ? "" : " III");
export function periodKey(period: string, now = Date.now()) {
  const date = new Date(now);
  if (period === "season") return GAME.season.id;
  if (period === "daily") return date.toISOString().slice(0, 10);
  return `week-${Math.floor((now - 345600000) / 604800000)}`;
}
