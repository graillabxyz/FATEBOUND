import type { LabSnapshot } from "./model";
const KEY = "fatebound.dev.scenarios.v2";
export type SavedScenario = {
  id: string;
  name: string;
  savedAt: string;
  snapshot: LabSnapshot;
};
export function savedScenarios(): SavedScenario[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value)
      ? value
          .filter(
            (v) =>
              v &&
              typeof v.id === "string" &&
              typeof v.name === "string" &&
              typeof v.savedAt === "string" &&
              v.snapshot?.format === "fatebound-dev-snapshot",
          )
          .slice(0, 15)
      : [];
  } catch {
    return [];
  }
}
export function saveScenario(name: string, snapshot: LabSnapshot) {
  if (!name.trim()) throw new Error("Enter a scenario name.");
  const list = savedScenarios();
  list.unshift({
    id: crypto.randomUUID(),
    name: name.trim().slice(0, 80),
    savedAt: new Date().toISOString(),
    snapshot,
  });
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 15)));
  } catch {
    throw new Error(
      "Scenario storage is full or unavailable. Export this snapshot instead.",
    );
  }
}
export async function copyText(text: string) {
  if (!navigator.clipboard)
    throw new Error(
      "Clipboard unavailable. Use Export or select the report text.",
    );
  await navigator.clipboard.writeText(text);
}
export function downloadJSON(name: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function loadSnapshot(): LabSnapshot | null {
  try {
    const value = JSON.parse(
      localStorage.getItem("fatebound.dev.snapshot.v2") ?? "null",
    );
    return value?.format === "fatebound-dev-snapshot" ? value : null;
  } catch {
    return null;
  }
}
export function persistSnapshot(snapshot: LabSnapshot) {
  try {
    localStorage.setItem("fatebound.dev.snapshot.v2", JSON.stringify(snapshot));
  } catch {
    throw new Error(
      "Snapshot storage is full or unavailable. Export the snapshot instead.",
    );
  }
}
