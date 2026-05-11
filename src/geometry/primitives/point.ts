import type { Line, Point, Polygon } from "../../types/geometry";

export const point = (x: number, y: number): Point => ({ x, y });

export const translatePoint = (p: Point, dx: number, dy: number): Point => ({
  x: p.x + dx,
  y: p.y + dy,
});

export const line = (
  id: string,
  start: Point,
  end: Point,
  type: Line["type"],
  label?: string,
): Line => ({
  id,
  start,
  end,
  type,
  label,
});

export const polygon = (id: string, points: Point[], label?: string): Polygon => ({
  id,
  points,
  label,
});

export const polygonToLines = (
  poly: Polygon,
  type: Line["type"],
  idPrefix = poly.id,
): Line[] =>
  poly.points.map((start, index) =>
    line(
      `${idPrefix}-${index}`,
      start,
      poly.points[(index + 1) % poly.points.length],
      type,
      poly.label,
    ),
  );
