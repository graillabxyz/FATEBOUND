import { readdirSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";
const files = readdirSync("dist/assets").filter((n) => n.endsWith(".js"));
assert(files.length > 0, "Release bundle is missing.");
for (const file of files) {
  assert(
    !/DevLab|Dashboard|simulation\.worker/.test(file),
    `Internal chunk leaked: ${file}`,
  );
  const contents = readFileSync(`dist/assets/${file}`, "utf8");
  for (const marker of [
    "fatebound-dev-snapshot",
    "Developer · Dev Lab",
    "Developer omniscient",
    "Saved lab outcomes",
  ])
    assert(!contents.includes(marker), `Internal marker leaked: ${marker}`);
}
console.log(
  "Release gate passed: no developer routes, inspectors, dashboard or simulation worker.",
);
