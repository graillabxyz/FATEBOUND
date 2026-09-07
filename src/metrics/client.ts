import type { MatchRecord } from "./data";
import { cloudFetch } from "../online/client";
export class MetricsSignInRequiredError extends Error {
  constructor() {
    super("Sign in to the private dashboard.");
  }
}
export type MetricsResponse = {
  records: MatchRecord[];
  total: number;
  events: { event: string; count: number }[];
  activeSessions: number;
  updatedAt: string;
  hasMore: boolean;
};
export async function loadMetrics(
  source: string,
  days = 30,
  legend = "all",
  opponent = "all",
): Promise<MetricsResponse> {
  const response = await cloudFetch(
    `/api/metrics?source=${encodeURIComponent(source)}&days=${days}&legend=${encodeURIComponent(legend)}&opponent=${encodeURIComponent(opponent)}`,
  );
  if (response.status === 401) throw new MetricsSignInRequiredError();
  if (!response.ok)
    throw new Error(`Metrics service unavailable (${response.status}).`);
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new Error(
      "Metrics database is not connected to this preview. Run the metrics service or use the private hosted dashboard.",
    );
  return response.json();
}
export async function storeSimulation(records: MatchRecord[], runId: string) {
  // Bounded requests preserve progress; identifiers make retries idempotent.
  for (let i = 0; i < records.length; i += 25) {
    const rows = records.slice(i, i + 25).map((r) => ({
      ...r,
      id: `${runId}:${r.id}`,
      pair: r.pair ? { ...r.pair, id: `${runId}:${r.pair.id}` } : undefined,
    }));
    const response = await cloudFetch("/api/simulations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records: rows }),
    });
    if (!response.ok)
      throw new Error(
        `Saving simulation failed (${response.status}). Export results or retry saving this run.`,
      );
  }
}

export async function storeLabOutcome(record: MatchRecord) {
  const response = await cloudFetch("/api/lab-results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ records: [record] }),
  });
  if (!response.ok) {
    const value = await response.json().catch(() => ({}));
    throw new Error(
      value.error ?? `Saving lab outcome failed (${response.status}).`,
    );
  }
}
