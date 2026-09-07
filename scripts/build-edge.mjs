import { build } from "esbuild";
import { writeFileSync } from "node:fs";
const result = await build({
  entryPoints: ["server/online/api.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "neutral",
  target: "es2022",
  external: ["@supabase/supabase-js"],
});
const code = result.outputFiles[0].text.replace(
  'from "@supabase/supabase-js"',
  'from "npm:@supabase/supabase-js@2.115.0"',
);
writeFileSync(
  "supabase/functions/omnipath-api/index.ts",
  code +
    '\nDeno.serve((request) => onlineApi(request, {SUPABASE_URL:Deno.env.get("SUPABASE_URL"),SUPABASE_SERVICE_ROLE_KEY:Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}));\n',
);
console.log("Bundled production match engine and authenticated Supabase API.");
