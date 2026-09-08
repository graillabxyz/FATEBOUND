import {
  SimulationStalledError,
  type StalledSimulation,
  simulateGame,
  type SimulationConfig,
} from "./simulation";
self.onmessage = async (event: MessageEvent<SimulationConfig>) => {
  const config = event.data;
  const records = [];
  const stalled: StalledSimulation[] = [];
  try {
    if (
      !Number.isInteger(config.games) ||
      config.games < 1 ||
      config.games > 10000
    )
      throw new Error("Choose 1–10,000 matches.");
    for (let i = 0; i < config.games; i++) {
      try {
        records.push(simulateGame(config, i));
      } catch (e) {
        if (e instanceof SimulationStalledError) stalled.push(e.detail);
        else throw e;
      }
      if ((i + 1) % 5 === 0 || i + 1 === config.games) {
        self.postMessage({
          type: "progress",
          done: i + 1,
          total: config.games,
        });
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    self.postMessage({ type: "complete", records, stalled });
  } catch (e) {
    self.postMessage({ type: "error", message: (e as Error).message });
  }
};
