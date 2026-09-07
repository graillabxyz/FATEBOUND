import { affinityById, affinityIds, affinityText } from "../content/affinities";
import type { AffinityId, AffinityRequirement } from "../engine/types";
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
        {list.length
          ? list.map((id) => affinityById[id].symbol).join(" ")
          : "◇"}
      </span>
      <span>{label}</span>
    </span>
  );
}
