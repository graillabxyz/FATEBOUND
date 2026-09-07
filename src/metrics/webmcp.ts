import type { MetricsResponse } from "./client";
import { aggregate } from "./data";
type Registry = {
  registerTool: (
    tool: {
      name: string;
      description: string;
      inputSchema: object;
      annotations: object;
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ) => Promise<void> | void;
};
export type Filters = {
  source: string;
  days: number;
  legend: string;
  opponent: string;
};
export function registerMetricsTools(
  read: () => {
    filters: Filters;
    response: MetricsResponse | null;
    metrics: ReturnType<typeof aggregate>;
  },
  configure: (f: Filters) => Promise<MetricsResponse>,
) {
  const context = (document as Document & { modelContext?: Registry })
    .modelContext;
  if (!context) return () => {};
  const lifecycle = new AbortController();
  const register = (tool: Parameters<Registry["registerTool"]>[0]) => {
    try {
      void Promise.resolve(
        context.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {
      /* Optional browser capability. */
    }
  };
  register({
    name: "get_omnipath_metrics",
    description:
      "Read metrics for the dashboard’s current source and time window. Does not run or save simulations.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute: () => {
      const { filters, response, metrics } = read();
      return {
        filters,
        connected: !!response,
        metrics,
        activeSessions: response?.activeSessions ?? 0,
      };
    },
  });
  register({
    name: "configure_omnipath_metrics",
    description:
      "Set the visible metrics source, time window, Legend and opponent; fetch the matching dataset. Does not change or fabricate stored records.",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string", enum: ["live", "simulation", "lab"] },
        days: { type: "number", enum: [1, 7, 30, 90] },
        legend: { type: "string" },
        opponent: { type: "string" },
      },
      required: ["source", "days"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: async (input) => {
      const f = input as Partial<Filters>;
      const legends = [
        "all",
        "basajaun",
        "anansi",
        "tengu",
        "leshy",
        "quetzalcoatl",
        "maui",
      ];
      if (
        !f ||
        !["live", "simulation", "lab"].includes(f.source ?? "") ||
        ![1, 7, 30, 90].includes(f.days ?? 0) ||
        !legends.includes(f.legend ?? "all") ||
        !legends.includes(f.opponent ?? "all")
      )
        throw new Error("Invalid source, time window or Legend.");
      const filters = {
        source: f.source!,
        days: f.days!,
        legend: f.legend ?? "all",
        opponent: f.opponent ?? "all",
      };
      const response = await configure(filters);
      return {
        filters,
        loadedMatches: response.records.length,
        totalMatches: response.total,
      };
    },
  });
  return () => lifecycle.abort();
}
