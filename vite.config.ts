import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const internal =
    command === "serve" ||
    (mode === "internal" && env.VITE_ENABLE_DEV_TOOLS === "true");
  return {
    plugins: [
      // Block dev entry modules before Vite scans them for worker/static assets.
      // Runtime gating alone is tree-shaken after workers may already be emitted.
      {
        name: "exclude-internal-tools-from-release",
        enforce: "pre" as const,
        resolveId(id: string) {
          if (
            !internal &&
            /(?:^|\/)(dev\/DevLab|metrics\/Dashboard)(?:\.tsx)?$/.test(id)
          )
            return "\0fatebound-disabled-tools";
        },
        load(id: string) {
          if (id === "\0fatebound-disabled-tools")
            return "export default function DisabledTools(){ return null; }";
        },
      },
      react(),
    ],
    server: {
      port: 5173,
      strictPort: true,
      proxy: { "/api": "http://127.0.0.1:8787" },
      watch: {
        usePolling: true,
        interval: 500,
        ignored: ["**/android/**", "**/ios/**", "**/reports/**"],
      },
    },
    build: { target: "es2022" },
    test: { include: ["tests/**/*.test.ts"] },
  };
});
