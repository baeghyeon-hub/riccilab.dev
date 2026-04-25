export type Point = { x: number; y: number };

export type LaidOutEdge = {
  from: number;
  to: number;
  label: string;
  points: Point[];
};

export function pointsToPath(pts: Point[]): string {
  if (pts.length === 0) return "";
  const [first, ...rest] = pts;
  return (
    `M ${first.x} ${first.y} ` +
    rest.map((point) => `L ${point.x} ${point.y}`).join(" ")
  );
}

export function midpoint(pts: Point[]): Point {
  if (pts.length === 0) return { x: 0, y: 0 };
  return pts[Math.floor(pts.length / 2)];
}
