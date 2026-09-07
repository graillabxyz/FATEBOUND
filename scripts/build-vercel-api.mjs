import { build } from "esbuild";
await build({
  entryPoints: ["server/online/vercel.ts"],
  outfile: "server/online/generated.mjs",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  packages: "external",
});
console.log("Bundled shared authority for Vercel Node ESM.");
