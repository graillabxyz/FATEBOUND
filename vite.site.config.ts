import { defineConfig } from "./tooling/sites/node_modules/vite/dist/node/index.js";
import { sites } from "./tooling/sites/node_modules/@openai/sites-vite-plugin/dist/index.js";
export default defineConfig({
  plugins: [sites()],
  publicDir: false,
  build: {
    ssr: "server/worker.ts",
    outDir: "dist/server",
    emptyOutDir: true,
    target: "es2022",
    minify: true,
    rollupOptions: { output: { entryFileNames: "index.js", format: "es" } },
  },
});
