export type Friend = {
  id: string;
  name: string;
  status: "online" | "offline" | "in-match";
  rank: string;
  legend: string;
};
export interface SocialService {
  friends(): Promise<Friend[]>;
  addFriend(code: string): Promise<{ status: "unavailable" }>;
  challenge(id: string): Promise<{ status: "unavailable" }>;
}
export const socialService: SocialService = {
  friends: async () => [],
  addFriend: async () => ({ status: "unavailable" }),
  challenge: async () => ({ status: "unavailable" }),
};
export type NotificationCategory =
  "daily" | "weekly" | "season" | "challenge" | "cosmetic" | "rewards";
export interface NotificationService {
  setPreference(
    category: NotificationCategory,
    enabled: boolean,
  ): Promise<void>;
  register(): Promise<{ status: string }>;
}
export const notifications: NotificationService = {
  setPreference: async () => {},
  register: async () => ({ status: "local-placeholder" }),
};
export interface MatchmakingService {
  enqueue(
    mode: "Casual" | "Ranked" | "Friend Challenge",
    loadoutId: string,
  ): Promise<{ ticketId: string; isMock: boolean }>;
  cancel(ticketId: string): Promise<void>;
}
export const matchmaking: MatchmakingService = {
  enqueue: async (mode, loadoutId) => ({
    ticketId: `mock-${mode}-${loadoutId}`,
    isMock: true,
  }),
  cancel: async () => {},
};
