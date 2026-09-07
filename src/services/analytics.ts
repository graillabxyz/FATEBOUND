import { trackUsage } from "./telemetry";
export type AnalyticsEvent =
  | "tutorial_started"
  | "tutorial_completed"
  | "match_started"
  | "match_completed"
  | "match_abandoned"
  | "legend_selected"
  | "loadout_changed"
  | "card_used"
  | "control_used"
  | "dice_face_result"
  | "shop_viewed"
  | "cosmetic_previewed"
  | "purchase_started"
  | "purchase_completed"
  | "battle_pass_viewed"
  | "battle_pass_upgraded"
  | "quest_completed"
  | "rank_changed";
export type AnalyticsRecord = {
  event: AnalyticsEvent;
  at: number;
  properties: Record<string, string | number | boolean>;
};
export interface AnalyticsProvider {
  track(record: AnalyticsRecord): void;
}
class LocalAnalytics implements AnalyticsProvider {
  records: AnalyticsRecord[] = [];
  track(record: AnalyticsRecord) {
    trackUsage(record);
    this.records.push(record);
    if (this.records.length > 500) this.records.shift();
  }
}
export const analytics = new LocalAnalytics();
export const track = (
  event: AnalyticsEvent,
  properties: AnalyticsRecord["properties"] = {},
) => analytics.track({ event, at: Date.now(), properties });
