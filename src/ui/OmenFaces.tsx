import type { OmenDefinition, Face } from "../engine/types";
import { omenFace } from "../content/terminology";
export function OmenFaces({ omen }: { omen: OmenDefinition }) {
  return (
    <div
      className="omen-face-strip"
      aria-label={`${omen.name}: fixed face layout`}
    >
      {omen.faces.map((face, i) => {
        const f = omenFace(face);
        return (
          <span
            className={`omen-face-token face-${f.kind.toLowerCase()}`}
            key={i}
            title={`${i + 1}: ${f.name}. ${f.rulesText}`}
            aria-label={`Face ${i + 1}: ${f.name}`}
          >
            {f.icon}
          </span>
        );
      })}
    </div>
  );
}
export function FaceExplanation({ face }: { face: Face }) {
  const f = omenFace(face);
  return (
    <div
      className={`omen-explanation face-${f.kind.toLowerCase()}`}
      role="status"
    >
      <strong>
        {f.icon} {f.name}
      </strong>
      <p>{f.rulesText}</p>
    </div>
  );
}
