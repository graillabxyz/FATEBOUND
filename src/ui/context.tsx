import { createContext, useContext } from "react";
import type { Profile, LocalProfileService } from "../services/profile";
import type { CardDef, DieDef, Legend, Loadout } from "../engine/types";
import type { Cosmetic } from "../content/economy";
import type { Difficulty } from "../engine/ai";
import type { Mode } from "../services/match-service";
export type Inspect =
  | { type: "card"; item: CardDef }
  | { type: "die"; item: DieDef }
  | { type: "legend"; item: Legend }
  | { type: "cosmetic"; item: Cosmetic };
export type AppContextValue = {
  profile: Profile;
  service: LocalProfileService;
  update: (p: Profile) => void;
  active: Loadout;
  tab: string;
  navigate: (tab: string) => void;
  inspect: (item: Inspect) => void;
  toast: (message: string) => void;
  open: (modal: string) => void;
  start: (
    mode: Mode,
    difficulty: Difficulty,
    practice?: boolean,
    opponent?: string,
  ) => void;
  resumeAvailable: boolean;
  resume: () => void;
};
export const AppContext = createContext<AppContextValue>(null!);
export const useGame = () => useContext(AppContext);
