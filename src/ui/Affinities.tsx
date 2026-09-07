import { affinityById, affinityIds, affinityText } from "../content/affinities";
import type { AffinityId, AffinityRequirement } from "../engine/types";
function requirementSymbols(r: AffinityRequirement | null): string {
  if (!r) return "◇";
  if ("affinity" in r) return affinityById[r.affinity].symbol;
  const nodes = "allOf" in r ? r.allOf : r.anyOf;
  const join = "allOf" in r ? " + " : " / ";
  return nodes
    .map((n) =>
      "affinity" in n ? requirementSymbols(n) : `(${requirementSymbols(n)})`,
    )
    .join(join);
}
export function AffinityLine({
  ids,
  requirement,
  compact = false,
}: {
  ids?: AffinityId[];
  requirement?: AffinityRequirement | null;
  compact?: boolean;
}) {
  const list = ids ?? affinityIds(requirement ?? null),
    label = ids
      ? ids.map((id) => affinityById[id].name).join(" · ")
      : affinityText(requirement ?? null);
  return (
    <span
      className={`affinity-line ${compact ? "compact-affinity" : ""}`}
      title={label}
      aria-label={label}
    >
      <span aria-hidden="true">
        {ids
          ? list.length
            ? list.map((id) => affinityById[id].symbol).join(" ")
            : "◇"
          : requirementSymbols(requirement ?? null)}
      </span>
      <span>{label}</span>
    </span>
  );
}
