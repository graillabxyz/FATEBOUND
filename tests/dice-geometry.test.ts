import { describe, expect, it } from "vitest";
import { DIE_MESHES, DIE_PROJECTIONS } from "../src/ui/dice-geometry";
import type { DieSize } from "../src/engine/types";

describe("physical die geometry", () => {
  const cases: [DieSize, number, number][] = [
    [4, 4, 3],
    [6, 8, 4],
    [8, 6, 3],
    [10, 12, 4],
    [12, 20, 5],
    [20, 12, 3],
  ];
  it.each(cases)(
    "d%i is a closed solid with the correct faces",
    (size, vertices, sides) => {
      const mesh = DIE_MESHES[size];
      expect(mesh.vertices).toHaveLength(vertices);
      expect(mesh.faces).toHaveLength(size);
      const edges = new Map<string, number>();
      for (const face of mesh.faces) {
        expect(face).toHaveLength(sides);
        for (let i = 0; i < face.length; i++) {
          const key = [face[i], face[(i + 1) % face.length]]
            .sort((a, b) => a - b)
            .join(",");
          edges.set(key, (edges.get(key) ?? 0) + 1);
        }
      }
      expect([...edges.values()].every((count) => count === 2)).toBe(true);
      expect(mesh.vertices.length - edges.size + mesh.faces.length).toBe(2);
    },
  );
  it("keeps visible facets and the result label inside the die viewport", () => {
    for (const projection of Object.values(DIE_PROJECTIONS)) {
      expect(projection.faces.filter((face) => face.front)).toHaveLength(1);
      expect(projection.faces.length).toBeGreaterThan(1);
      for (const face of projection.faces) {
        const points = face.points
          .split(" ")
          .flatMap((point) => point.split(",").map(Number));
        expect(
          points.every(
            (value) => Number.isFinite(value) && value >= 0 && value <= 100,
          ),
        ).toBe(true);
      }
      expect(projection.label.every((value) => value > 10 && value < 90)).toBe(
        true,
      );
    }
  });
});
