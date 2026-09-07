import { writeFileSync, mkdirSync } from "node:fs";
import {
  prepareHandAudit,
  evaluateHand,
  finishHandAudit,
} from "../src/dev/affinity-balance";
const config = {
  seed: 24000,
  pairs: Number(
    process.argv.find((a) => a.startsWith("--pairs="))?.split("=")[1] ?? 2,
  ),
};
console.log(
  "Evaluating every legal Legend/Card pair and enumerating legal Hands…",
);
const { evaluation, jobs } = prepareHandAudit(config),
  rows = [];
console.log(
  `${evaluation.length} legal pairs; ${jobs.length} complete Hand/Omen cohorts.`,
);
for (const [i, job] of jobs.entries()) {
  rows.push(evaluateHand(job, config.pairs));
  if (i % 100 === 0) console.log(`${i + 1}/${jobs.length} Hand cohorts`);
}
const report = finishHandAudit(config, evaluation, rows);
mkdirSync("reports", { recursive: true });
writeFileSync(
  `reports/card-pool-v${report.version}.json`,
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify(
    {
      games: report.games,
      starter: report.starter,
      mismatches: report.mismatches,
      flags: report.flags,
      content: report.content,
    },
    null,
    2,
  ),
);
if (report.mismatches) process.exitCode = 1;
