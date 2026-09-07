import type { CapacitorConfig } from "@capacitor/cli";
import { GAME } from "./src/content/config";
const config: CapacitorConfig = {
  appId: "game.fatebound.mobile",
  appName: GAME.title,
  webDir: "dist",
  backgroundColor: "#0c1416",
  ios: { contentInset: "never" },
  android: { backgroundColor: "#0c1416" },
};
export default config;
