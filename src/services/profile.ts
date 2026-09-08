import {
  OMEN_JOURNEY,
  LEGEND_BONUS_MILESTONES,
  signatureFor,
  omenPrice,
  ownedLegendLoadout,
  availableOmenMilestones,
  unownedSignatures,
  type AcquisitionReceipt,
} from "../content/collection-progression";
import {
  LEGEND_JOURNEY,
  legendJourney,
  type LegendUnlockRecord,
} from "../content/legend-progression";
import { migrateCardId, LEGACY_CARD_IDS } from "../content/card-migration";
import { legendById } from "../content/legends";
import {
  PACK_CONFIG,
  CARD_COIN_PRICE,
  LEGEND_COIN_PRICE,
  PROGRESSION_PACKS,
} from "../content/acquisition";
import { rollPack, type PackReceipt } from "./packs";
import {
  DEFAULT_EMOTES,
  EMOTE_CONFIG,
  EMOTE_ACHIEVEMENTS,
  EMOTE_BUNDLES,
  emoteById,
} from "../content/emotes";
import { GAME } from "../content/config";
import {
  STARTERS,
  STARTER_CARDS,
  STARTER_LEGENDS,
  STARTER_OMENS,
} from "../content/loadouts";
import { LEGENDS } from "../content/legends";
import { cardById, cardsFor } from "../content/cards";
import { OMENS } from "../content/omens";
import { COSMETICS, PASS_REWARDS, QUESTS } from "../content/economy";
import { validateLoadout } from "../engine/rules";
import type { LegendId, Loadout, MatchView } from "../engine/types";
export type Settings = {
  opponentEmotes: boolean;
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
  collectionVersion: 1;
  ownedCards: string[];
  ownedLegends: LegendId[];
  legendJourneyClaims: number[];
  omenJourneyClaims: number[];
  acquisitionSequence: number;
  acquisitions: AcquisitionReceipt[];
  legendUnlockRevision: number;
  legendUnlocks: Partial<Record<LegendId, LegendUnlockRecord>>;
  ownedOmens: string[];
  packs: number;
  packSequence: number;
  pendingPack: PackReceipt | null;

  ownedEmotes: string[];
  equippedEmotes: (string | null)[];
  avatar: LegendId;
  achievementProgress: {
    rankedWins: number;
    wardAbsorbed: number;
    basajaunRankedWins: number;
  };
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
    collectionVersion: 1,
    ownedCards: [...STARTER_CARDS],
    ownedLegends: [...STARTER_LEGENDS],
    legendJourneyClaims: [],
    omenJourneyClaims: [],
    acquisitionSequence: 0,
    acquisitions: [],
    legendUnlockRevision: 0,
    legendUnlocks: {
      basajaun: { source: "starter" },
      anansi: { source: "starter" },
    },
    ownedOmens: [...STARTER_OMENS],
    packs: 0,
    packSequence: 0,
    pendingPack: null,

    ownedEmotes: [...DEFAULT_EMOTES],
    equippedEmotes: [...DEFAULT_EMOTES],
    avatar: "basajaun",
    achievementProgress: {
      rankedWins: 0,
      wardAbsorbed: 0,
      basajaunRankedWins: 0,
    },
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
    loadouts: structuredClone(STARTER_LEGENDS.map((id) => STARTERS[id])),
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
      opponentEmotes: true,
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
      if (
        !Array.isArray(p.loadouts) ||
        !Number.isFinite(p.coins) ||
        !Number.isFinite(p.xp)
      )
        return freshProfile();
      const owned = [
        ...new Set([
          ...DEFAULT_EMOTES,
          ...(Array.isArray(p.ownedEmotes) ? p.ownedEmotes : []),
        ]),
      ].filter((id) => emoteById[id]);
      for (const reward of PASS_REWARDS)
        for (const track of ["free", "premium"] as const) {
          const r = reward[track];
          if (
            r.type === "emote" &&
            r.id &&
            p.claimedPass?.includes(
              `${GAME.season.id}:${reward.level}:${track}`,
            ) &&
            !owned.includes(r.id)
          )
            owned.push(r.id);
        }
      const progress = freshProfile().achievementProgress;
      for (const key of Object.keys(progress) as (keyof typeof progress)[]) {
        const value = p.achievementProgress?.[key];
        progress[key] =
          typeof value === "number" && Number.isFinite(value) && value >= 0
            ? Math.floor(value)
            : 0;
      }
      const equipped = Array.isArray(p.equippedEmotes)
        ? p.equippedEmotes
        : DEFAULT_EMOTES;
      const seen = new Set<string>();
      const legacy = p.collectionVersion !== 1;
      const ownedCards = [
        ...new Set(
          [
            ...(legacy ? Object.values(LEGACY_CARD_IDS) : (p.ownedCards ?? [])),
            ...STARTER_CARDS,
          ].map(migrateCardId),
        ),
      ].filter((id) => !!cardById[id]);
      const ownedLegends = [
        ...new Set([
          ...(Array.isArray(p.ownedLegends) ? p.ownedLegends : []),
          ...STARTER_LEGENDS,
        ]),
      ].filter((id) => !!legendById[id]);
      const ownedOmens = [
        ...new Set([
          ...(legacy ? OMENS.map((d) => d.id) : (p.ownedOmens ?? [])),
          ...STARTER_OMENS,
        ]),
      ].filter((id) => OMENS.some((d) => d.id === id));
      const loadouts = (p.loadouts ?? freshProfile().loadouts)
        .filter((l) => ownedLegends.includes(l.legend))
        .map((l) => {
          const legal = cardsFor(l.legend).filter((c) =>
            ownedCards.includes(c.id),
          );
          const ids = [...new Set((l.cards ?? []).map(migrateCardId))].filter(
            (id) => legal.some((c) => c.id === id),
          );
          for (const c of legal)
            if (ids.length < 4 && !ids.includes(c.id)) ids.push(c.id);
          const draft = { ...l, cards: ids.slice(0, 4) };
          try {
            validateLoadout(
              draft,
              new Set([...ownedCards, ...ownedLegends, ...ownedOmens]),
            );
            return draft;
          } catch {
            return ownedLegendLoadout(l.legend, ownedCards, ownedOmens);
          }
        });
      for (const id of ownedLegends)
        if (!loadouts.some((l) => l.legend === id))
          loadouts.push(ownedLegendLoadout(id, ownedCards, ownedOmens));
      return {
        ...freshProfile(),
        ...p,
        collectionVersion: 1,
        ownedCards,
        ownedLegends,
        legendJourneyClaims: [
          ...new Set(
            (Array.isArray(p.legendJourneyClaims)
              ? p.legendJourneyClaims
              : []
            ).filter((m) => LEGEND_JOURNEY.milestones.some((v) => v === m)),
          ),
        ],
        omenJourneyClaims: [
          ...new Set(
            (Array.isArray(p.omenJourneyClaims)
              ? p.omenJourneyClaims
              : []
            ).filter((m) => OMEN_JOURNEY.milestones.some((v) => v === m)),
          ),
        ],
        acquisitionSequence:
          Number.isSafeInteger(p.acquisitionSequence) &&
          p.acquisitionSequence >= 0
            ? p.acquisitionSequence
            : 0,
        acquisitions: Array.isArray(p.acquisitions)
          ? p.acquisitions.slice(-100)
          : [],
        legendUnlockRevision:
          Number.isSafeInteger(p.legendUnlockRevision) &&
          p.legendUnlockRevision >= 0
            ? p.legendUnlockRevision
            : 0,
        legendUnlocks: Object.fromEntries(
          ownedLegends.map((id) => [
            id,
            p.legendUnlocks?.[id] ?? {
              source: STARTER_LEGENDS.includes(id) ? "starter" : "legacy",
            },
          ]),
        ),
        ownedOmens,
        loadouts,
        activeId: loadouts.some((l) => l.id === p.activeId)
          ? p.activeId
          : loadouts[0].id,
        favorites: (p.favorites ?? [])
          .map(migrateCardId)
          .filter((id) => !!cardById[id]),
        packs: Number.isInteger(p.packs) && p.packs >= 0 ? p.packs : 0,
        packSequence:
          Number.isInteger(p.packSequence) && p.packSequence >= 0
            ? p.packSequence
            : 0,
        pendingPack:
          p.pendingPack?.cards?.length === 2 &&
          p.pendingPack.cards.every((id) => !!cardById[id])
            ? p.pendingPack
            : null,
        ownedEmotes: owned,
        equippedEmotes: Array.from({ length: EMOTE_CONFIG.slots }, (_, i) => {
          const id = equipped[i];
          if (!id || !owned.includes(id) || seen.has(id)) return null;
          seen.add(id);
          return id;
        }),
        avatar: LEGENDS.some((l) => l.id === p.avatar) ? p.avatar : "basajaun",
        achievementProgress: progress,
        settings: { ...freshProfile().settings, ...p.settings },
      };
    } catch {
      return freshProfile();
    }
  }
  save(p: Profile) {
    this.storage.setItem(PROFILE_KEY, JSON.stringify(p));
  }
  ownedGameplay(p: Profile = this.load()) {
    return new Set([...p.ownedLegends, ...p.ownedCards, ...p.ownedOmens]);
  }
  saveLoadout(p: Profile, loadout: Loadout) {
    validateLoadout(loadout, this.ownedGameplay(p));
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
    const saved = this.load();
    if (saved.claimedMatches.includes(view.id))
      return p.claimedMatches.includes(view.id) &&
        saved.legendUnlockRevision <= p.legendUnlockRevision
        ? p
        : saved;
    p = this.currentLegendProfile(p);
    if (p.claimedMatches.includes(view.id)) return p;
    const n = structuredClone(p);
    const win = view.winner === 0;
    n.claimedMatches.push(view.id);
    n.xp += GAME.rewards.xp + (win ? 30 : 0);
    n.coins += GAME.rewards.coins + (win ? 15 : 0);
    n.seasonXp += GAME.rewards.season;
    n.mastery[view.players[0].loadout.legend] += GAME.rewards.mastery;
    n.matches++;
    if (n.matches % PROGRESSION_PACKS.matchesEvery === 0) n.packs++;
    if (win && p.wins === 0) n.packs += PROGRESSION_PACKS.firstWin;
    const played = view.players[0].loadout.legend;
    if (
      Math.floor(n.mastery[played] / PROGRESSION_PACKS.masteryEvery) >
      Math.floor(p.mastery[played] / PROGRESSION_PACKS.masteryEvery)
    )
      n.packs++;

    if (win) n.wins++;
    n.streak = win ? n.streak + 1 : 0;
    n.bestStreak = Math.max(n.bestStreak, n.streak);
    if (mode === "Ranked")
      n.rankPoints = Math.max(
        0,
        n.rankPoints + (win ? 25 : view.winner === "draw" ? 0 : -10),
      );
    n.achievementProgress.rankedWins += +(win && mode === "Ranked");
    n.achievementProgress.basajaunRankedWins += +(
      win &&
      mode === "Ranked" &&
      view.players[0].loadout.legend === "basajaun"
    );
    n.achievementProgress.wardAbsorbed += view.events.reduce(
      (sum, e) =>
        sum +
        (e.type === "damage" && e.target === 0
          ? Number.isFinite(e.wardAbsorbed)
            ? Math.max(0, e.wardAbsorbed!)
            : 0
          : 0),
      0,
    );
    for (const achievement of EMOTE_ACHIEVEMENTS)
      if (n.achievementProgress[achievement.metric] >= achievement.target)
        this.grantEmote(n, achievement.emoteId);
    if (n.rankPoints >= 900) this.grantEmote(n, "respect");
    if (n.mastery.basajaun >= 1800) this.grantEmote(n, "old-friend");
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
    const stored = this.load();
    if (stored.claimedPass.includes(id))
      return p.claimedPass.includes(id) &&
        stored.legendUnlockRevision <= p.legendUnlockRevision
        ? p
        : stored;
    p = this.currentLegendProfile(p);
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
    else if (reward.type === "pack") n.packs += reward.amount;
    else if (
      reward.type === "legend" ||
      reward.type === "omen" ||
      reward.type === "card"
    ) {
      if (reward.amount !== 1 || !reward.id)
        throw new Error("Collection rewards must identify exactly one item.");
      const items: AcquisitionReceipt["items"] = [];
      if (reward.type === "legend") {
        if (!legendById[reward.id as LegendId])
          throw new Error("Unknown Legend reward.");
        if (!n.ownedLegends.includes(reward.id as LegendId))
          this.grantLegend(n, reward.id as LegendId, { source: "journey" });
        else n.packs++;
        items.push(
          p.ownedLegends.includes(reward.id as LegendId)
            ? { kind: "booster", amount: 1 }
            : { kind: "legend", id: reward.id as LegendId },
        );
      } else if (reward.type === "omen") {
        if (!OMENS.some((d) => d.id === reward.id))
          throw new Error("Unknown Omen reward.");
        if (!n.ownedOmens.includes(reward.id)) n.ownedOmens.push(reward.id);
        else n.packs++;
        items.push(
          p.ownedOmens.includes(reward.id)
            ? { kind: "booster", amount: 1 }
            : { kind: "omen", id: reward.id },
        );
      } else {
        if (!cardById[reward.id]) throw new Error("Unknown Card reward.");
        if (!n.ownedCards.includes(reward.id)) n.ownedCards.push(reward.id);
        else n.coins += PACK_CONFIG.duplicateCoins;
        items.push({ kind: "card", id: reward.id });
      }
      this.receipt(n, `season:${id}`, items);
      n.legendUnlockRevision++;
    } else if (reward.type === "emote" && reward.id)
      this.grantEmote(n, reward.id);
    else {
      const cosmetic = track === "free" ? "first-light" : "obsidian";
      if (!n.cosmetics.includes(cosmetic)) n.cosmetics.push(cosmetic);
      else n.coins += 50;
    }
    if (!["legend", "omen", "card"].includes(reward.type))
      n.legendUnlockRevision++;
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
  purchaseCard(p: Profile, id: string) {
    const card = cardById[id];
    if (!card) throw new Error("Unknown Card.");
    const current = this.currentLegendProfile(p);
    if (current.ownedCards.includes(id)) return current;
    if (current !== p) throw new Error("Collection changed. Reopen the Card.");
    const cost = CARD_COIN_PRICE[card.rarity];
    if (p.coins < cost) throw new Error("Not enough Coins.");
    const n = structuredClone(p);
    n.coins -= cost;
    n.ownedCards.push(id);
    this.receipt(n, "purchase", [{ kind: "card", id }], {
      currency: "coins",
      cost,
    });
    n.legendUnlockRevision++;
    this.save(n);
    return n;
  }
  private currentLegendProfile(p: Profile): Profile {
    const stored = this.load();
    return stored.legendUnlockRevision > p.legendUnlockRevision ? stored : p;
  }
  private grantLegend(p: Profile, id: LegendId, record: LegendUnlockRecord) {
    p.ownedLegends = [...new Set([...p.ownedLegends, id])];
    p.legendUnlocks[id] = record;
    const build = ownedLegendLoadout(id, p.ownedCards, p.ownedOmens);
    if (!p.loadouts.some((l) => l.id === build.id)) p.loadouts.push(build);
  }
  private receipt(
    p: Profile,
    source: string,
    items: AcquisitionReceipt["items"],
    extra: Partial<AcquisitionReceipt> = {},
  ) {
    p.acquisitions.push({
      ...extra,
      id: `acquisition-${++p.acquisitionSequence}`,
      source,
      items,
    });
    p.acquisitions = p.acquisitions.slice(-100);
  }
  unlockLegend(p: Profile, id: LegendId, currency: "coins" | "gems" = "coins") {
    if (!legendById[id]) throw new Error("Unknown Legend.");
    if (currency !== "coins" && currency !== "gems")
      throw new Error("Invalid currency.");
    const current = this.currentLegendProfile(p);
    if (current.ownedLegends.includes(id)) return current;
    if (current !== p)
      throw new Error(
        "Collection changed. Reopen this Legend before purchasing.",
      );
    const cost =
      currency === "coins" ? LEGEND_COIN_PRICE : LEGEND_JOURNEY.gemPrice;
    if (!Number.isFinite(p[currency]) || p[currency] < cost)
      throw new Error(`Not enough ${currency === "coins" ? "Coins" : "Gems"}.`);
    const n = structuredClone(p);
    n[currency] -= cost;
    this.grantLegend(n, id, { source: currency });
    this.receipt(n, "purchase", [{ kind: "legend", id }], { currency, cost });
    n.legendUnlockRevision++;
    this.save(n);
    return n;
  }
  claimLegendMilestone(p: Profile, milestone: number, id?: LegendId) {
    const current = this.currentLegendProfile(p);
    if (current.legendJourneyClaims.includes(milestone)) return current;
    if (current !== p)
      throw new Error("Collection changed. Reopen the Legend Journey.");
    if (!legendJourney(p).available.some((m) => m === milestone))
      throw new Error("Complete the required matches to claim this milestone.");
    const allOwned = LEGENDS.every((l) => p.ownedLegends.includes(l.id));
    if (!allOwned && (!id || !legendById[id] || p.ownedLegends.includes(id)))
      throw new Error("Choose a Legend you have not unlocked yet.");
    const n = structuredClone(p);
    if (allOwned) n.coins += LEGEND_JOURNEY.completeCollectionCoins;
    else {
      this.grantLegend(n, id!, { source: "journey", milestone });
      const bonus = LEGEND_BONUS_MILESTONES.includes(milestone)
        ? signatureFor(id!)
        : undefined;
      const items: AcquisitionReceipt["items"] = [{ kind: "legend", id: id! }];
      if (bonus && !n.ownedOmens.includes(bonus)) {
        n.ownedOmens.push(bonus);
        items.push({ kind: "omen", id: bonus });
      } else if (bonus) {
        n.packs++;
        items.push({ kind: "booster", amount: 1 });
      }
      this.receipt(n, `legend-journey:${milestone}`, items, {
        bonusOmen: bonus,
      });
    }
    n.legendJourneyClaims.push(milestone);
    n.legendUnlockRevision++;
    this.save(n);
    return n;
  }
  purchaseOmen(p: Profile, id: string, currency: "coins" | "gems" = "coins") {
    const omen = OMENS.find((d) => d.id === id);
    if (!omen) throw new Error("Unknown Omen.");
    if (currency !== "coins" && currency !== "gems")
      throw new Error("Invalid currency.");
    if (currency === "gems" && !omen.tags.includes("signature"))
      throw new Error("Numbered Omens use Coins.");
    const current = this.currentLegendProfile(p);
    if (current.ownedOmens.includes(id)) return current;
    if (current !== p) throw new Error("Collection changed. Reopen the Omen.");
    const cost =
      currency === "coins" ? omenPrice(id) : OMEN_JOURNEY.signatureGems;
    if (!Number.isFinite(p[currency]) || p[currency] < cost)
      throw new Error(`Not enough ${currency === "coins" ? "Coins" : "Gems"}.`);
    const n = structuredClone(p);
    n[currency] -= cost;
    n.ownedOmens.push(id);
    this.receipt(n, "purchase", [{ kind: "omen", id }], { currency, cost });
    n.legendUnlockRevision++;
    this.save(n);
    return n;
  }
  claimOmenMilestone(p: Profile, milestone: number, id?: string) {
    const current = this.currentLegendProfile(p);
    if (current.omenJourneyClaims.includes(milestone)) return current;
    if (current !== p)
      throw new Error("Collection changed. Reopen the Omen Journey.");
    if (!availableOmenMilestones(p).some((m) => m === milestone))
      throw new Error("Complete the required matches first.");
    const choices = unownedSignatures(p.ownedOmens);
    if (choices.length && !choices.some((d) => d.id === id))
      throw new Error("Choose an unowned signature Omen.");
    const n = structuredClone(p);
    const items: AcquisitionReceipt["items"] = [];
    if (choices.length) {
      n.ownedOmens.push(id!);
      items.push({ kind: "omen", id: id! });
    } else {
      n.packs++;
      items.push({ kind: "booster", amount: 1 });
    }
    this.receipt(n, `omen-journey:${milestone}`, items);
    n.omenJourneyClaims.push(milestone);
    n.legendUnlockRevision++;
    this.save(n);
    return n;
  }
  openPack(p: Profile, seed: number) {
    // Reading current persisted receipt makes double clicks/reloads idempotent.
    const current = this.load();
    if (current.pendingPack) return current;
    if (p.packSequence !== current.packSequence)
      throw new Error("Collection changed. Reopen the pack screen.");
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
      throw new Error("Invalid pack seed.");
    const n = structuredClone(current);
    if (n.packs > 0) n.packs--;
    else {
      if (n.coins < PACK_CONFIG.price) throw new Error("Not enough Coins.");
      n.coins -= PACK_CONFIG.price;
    }
    const receipt = rollPack(seed, n.ownedCards, `pack-${++n.packSequence}`);
    n.ownedCards = [...new Set([...n.ownedCards, ...receipt.cards])];
    n.coins += receipt.coins;
    n.pendingPack = receipt;
    this.receipt(
      n,
      `booster:${receipt.id}`,
      receipt.cards.map((id) => ({ kind: "card", id })),
    );
    n.legendUnlockRevision++;
    this.save(n);
    return n;
  }
  revealPack(_p: Profile, id: string) {
    const n = structuredClone(this.load());
    if (n.pendingPack?.id !== id) throw new Error("Pack receipt changed.");
    n.pendingPack.revealed = Math.min(2, n.pendingPack.revealed + 1);
    this.save(n);
    return n;
  }
  finishPack(_p: Profile, id: string) {
    const n = structuredClone(this.load());
    if (n.pendingPack?.id !== id || n.pendingPack.revealed !== 2)
      throw new Error("Reveal both Cards first.");
    n.pendingPack = null;
    this.save(n);
    return n;
  }
  private grantEmote(p: Profile, id: string) {
    if (emoteById[id] && !p.ownedEmotes.includes(id)) p.ownedEmotes.push(id);
  }
  equipEmote(p: Profile, slot: number, id: string | null) {
    if (!Number.isInteger(slot) || slot < 0 || slot >= EMOTE_CONFIG.slots)
      throw new Error("Choose one of five emote slots.");
    if (id && (!p.ownedEmotes.includes(id) || !emoteById[id]))
      throw new Error("This emote has not been earned.");
    const n = structuredClone(p);
    n.equippedEmotes = n.equippedEmotes.map((e) => (e === id ? null : e));
    n.equippedEmotes[slot] = id;
    this.save(n);
    return n;
  }
  purchaseEmote(p: Profile, id: string) {
    const e = emoteById[id];
    if (!e || e.source !== "shop" || e.price === undefined || !e.currency)
      throw new Error("This emote must be earned from its listed source.");
    if (p.ownedEmotes.includes(id)) return p;
    if (p[e.currency] < e.price)
      throw new Error("Not enough " + e.currency + ".");
    const n = structuredClone(p);
    n[e.currency] -= e.price;
    this.grantEmote(n, id);
    this.save(n);
    return n;
  }
  purchaseEmoteBundle(p: Profile, id: string) {
    const bundle = EMOTE_BUNDLES.find((b) => b.id === id);
    if (!bundle) throw new Error("Unknown bundle.");
    if (bundle.emotes.every((e) => p.ownedEmotes.includes(e))) return p;
    if (p[bundle.currency] < bundle.price)
      throw new Error("Not enough " + bundle.currency + ".");
    const n = structuredClone(p);
    n[bundle.currency] -= bundle.price;
    bundle.emotes.forEach((id) => this.grantEmote(n, id));
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
