import {
  prepareHandAudit,
  evaluateHand,
  finishHandAudit,
  type HandAuditConfig,
} from "./affinity-balance";
self.onmessage = async (event: MessageEvent<HandAuditConfig>) => {
  try {
    const config = event.data,
      { evaluation, jobs } = prepareHandAudit(config),
      rows = [];
    for (const [i, job] of jobs.entries()) {
      rows.push(evaluateHand(job, config.pairs));
      if (i % 5 === 0) {
        self.postMessage({ type: "progress", done: i + 1, total: jobs.length });
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    self.postMessage({
      type: "complete",
      report: finishHandAudit(config, evaluation, rows),
    });
  } catch (e) {
    self.postMessage({ type: "error", message: (e as Error).message });
  }
};
