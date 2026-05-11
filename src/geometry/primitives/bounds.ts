import type { Bounds, Dieline, Line, Point, Polygon } from "../../types/geometry";

const boundsFromPoints = (points: Point[]): Bounds => {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

export const boundsForLines = (lines: Line[]): Bounds =>
  boundsFromPoints(lines.flatMap((line) => [line.start, line.end]));

export const boundsForPolygon = (polygon: Polygon): Bounds =>
  boundsFromPoints(polygon.points);

export const boundsForDieline = (dieline: Dieline, padding = 0): Bounds => {
  const linePoints = [
    ...dieline.cuts,
    ...dieline.folds,
    ...dieline.bleeds,
    ...dieline.safeZones,
    ...dieline.perforations,
  ].flatMap((line) => [line.start, line.end]);
  const polygonPoints = [...dieline.glueAreas, ...dieline.panels].flatMap(
    (polygon) => polygon.points,
  );
  const bounds = boundsFromPoints([...linePoints, ...polygonPoints]);

  return {
    minX: bounds.minX - padding,
    minY: bounds.minY - padding,
    maxX: bounds.maxX + padding,
    maxY: bounds.maxY + padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
  };
};
