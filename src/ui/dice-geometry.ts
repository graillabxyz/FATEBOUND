import type { DieSize } from "../engine/types";

// Presentation geometry only. Face values, ordering and opposites stay in content.
type Vec = [number, number, number];
export type Polyhedron = { vertices: Vec[]; faces: number[][] };
const dot = (a: Vec, b: Vec) => a.reduce((n, x, i) => n + x * b[i], 0);
const sub = (a: Vec, b: Vec): Vec => a.map((x, i) => x - b[i]) as Vec;
const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = (v: Vec): Vec => v.map((x) => x / Math.hypot(...v)) as Vec;
const center = (vs: Vec[]): Vec =>
  [0, 1, 2].map(
    (axis) => vs.reduce((n, v) => n + v[axis], 0) / vs.length,
  ) as Vec;

// Group coplanar supporting planes, preserving pentagons/quads instead of
// triangulating them. All meshes are tiny, static and built once at module load.
function hull(vertices: Vec[]): Polyhedron {
  const faces = new Map<string, number[]>();
  for (let a = 0; a < vertices.length; a++)
    for (let b = a + 1; b < vertices.length; b++)
      for (let c = b + 1; c < vertices.length; c++) {
        let normal = cross(
          sub(vertices[b], vertices[a]),
          sub(vertices[c], vertices[a]),
        );
        if (Math.hypot(...normal) < 1e-7) continue;
        normal = unit(normal);
        let d = dot(normal, vertices[a]);
        const distances = vertices.map((v) => dot(normal, v) - d);
        if (distances.some((x) => x > 1e-6) && distances.some((x) => x < -1e-6))
          continue;
        if (d < 0) {
          normal = normal.map((x) => -x) as Vec;
          d = -d;
        }
        const indices = vertices.flatMap((v, i) =>
          Math.abs(dot(normal, v) - d) < 1e-6 ? [i] : [],
        );
        const key = indices.join(",");
        if (faces.has(key)) continue;
        const mid = center(indices.map((i) => vertices[i]));
        const x = unit(sub(vertices[indices[0]], mid));
        const y = cross(normal, x);
        indices.sort((i, j) => {
          const p = sub(vertices[i], mid),
            q = sub(vertices[j], mid);
          return (
            Math.atan2(dot(p, y), dot(p, x)) - Math.atan2(dot(q, y), dot(q, x))
          );
        });
        faces.set(key, indices);
      }
  return { vertices, faces: [...faces.values()] };
}
function normal(mesh: Polyhedron, face: number[]) {
  const [a, b, c] = face.map((i) => mesh.vertices[i]);
  return unit(cross(sub(b, a), sub(c, a)));
}
function dual(mesh: Polyhedron) {
  return hull(
    mesh.faces.map((face) => {
      const n = normal(mesh, face);
      const d = dot(n, mesh.vertices[face[0]]);
      return n.map((x) => x / d) as Vec;
    }),
  );
}
const phi = (1 + Math.sqrt(5)) / 2;
const ico: Vec[] = [];
for (const a of [-1, 1])
  for (const b of [-phi, phi]) ico.push([0, a, b], [a, b, 0], [b, 0, a]);
const antiprism: Vec[] = [];
for (let i = 0; i < 10; i++) {
  const angle = (i * Math.PI) / 5;
  antiprism.push([Math.cos(angle), Math.sin(angle), i % 2 ? -0.5 : 0.5]);
}
export const DIE_SHAPES: Record<DieSize, string> = {
  4: "tetrahedron",
  6: "cube",
  8: "octahedron",
  10: "pentagonal trapezohedron",
  12: "dodecahedron",
  20: "icosahedron",
};
export const DIE_MESHES: Record<DieSize, Polyhedron> = {
  4: hull([
    [1, 1, 1],
    [1, -1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
  ]),
  6: hull(
    [-1, 1].flatMap((x) =>
      [-1, 1].flatMap((y) => [-1, 1].map((z): Vec => [x, y, z])),
    ),
  ),
  8: hull([
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ]),
  10: dual(hull(antiprism)),
  12: dual(hull(ico)),
  20: hull(ico),
};
function project(mesh: Polyhedron, size: number) {
  const front = mesh.faces.reduce((best, f) =>
    normal(mesh, f)[2] > normal(mesh, best)[2] ? f : best,
  );
  const z = normal(mesh, front);
  const x = unit(
    cross(
      size === 10 ? [0, 0, 1] : Math.abs(z[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0],
      z,
    ),
  );
  const y = cross(z, x);
  const yaw = size === 4 ? 0.65 : 0.3;
  const turn = (v: Vec): Vec => {
    const a = dot(v, x),
      b = dot(v, y),
      c = dot(v, z);
    const u = a * Math.cos(yaw) + c * Math.sin(yaw);
    const w = c * Math.cos(yaw) - a * Math.sin(yaw);
    return [
      u,
      b * Math.cos(-0.2) - w * Math.sin(-0.2),
      b * Math.sin(-0.2) + w * Math.cos(-0.2),
    ];
  };
  const vertices = mesh.vertices.map(turn);
  const minX = Math.min(...vertices.map((v) => v[0])),
    maxX = Math.max(...vertices.map((v) => v[0]));
  const minY = Math.min(...vertices.map((v) => v[1])),
    maxY = Math.max(...vertices.map((v) => v[1]));
  const scale = 83 / Math.max(maxX - minX, maxY - minY);
  const screen = (v: Vec) => [
    50 + (v[0] - (minX + maxX) / 2) * scale,
    45 - (v[1] - (minY + maxY) / 2) * scale,
  ];
  const light = unit([-0.6, 0.8, 1]);
  return {
    label: screen(center(front.map((i) => vertices[i]))),
    faces: mesh.faces
      .map((face) => ({
        points: face
          .map((i) =>
            screen(vertices[i])
              .map((n) => n.toFixed(2))
              .join(","),
          )
          .join(" "),
        normal: turn(normal(mesh, face)),
        depth: center(face.map((i) => vertices[i]))[2],
        front: face === front,
      }))
      .filter((f) => f.normal[2] > 0.001)
      .sort((a, b) => a.depth - b.depth)
      .map((f) => ({
        ...f,
        light: Math.round(16 + Math.max(0, dot(f.normal, light)) * 62),
      })),
  };
}
export const DIE_PROJECTIONS = Object.fromEntries(
  Object.entries(DIE_MESHES).map(([size, mesh]) => [
    size,
    project(mesh, Number(size)),
  ]),
) as Record<DieSize, ReturnType<typeof project>>;
