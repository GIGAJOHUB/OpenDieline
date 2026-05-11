import type { Line, Point, Polygon } from "../../types/geometry";

export type CartonFaceKind = "body" | "glue" | "tuck" | "tongue" | "seal" | "dust";

export type FoldAxisKind = "vertical-body" | "top-closure" | "bottom-closure" | "glue";

export type FoldDirection = 1 | -1;

export type CartonFace = {
  id: string;
  label: string;
  kind: CartonFaceKind;
  polygon: Polygon;
  parentId?: string;
  foldId?: string;
  foldProgressAngle: number;
  width: number;
  height: number;
  panelRole?: "A" | "B" | "glue";
};

export type CartonFold = {
  id: string;
  label: string;
  axis: Line;
  axisKind: FoldAxisKind;
  parentFaceId: string;
  childFaceId: string;
  targetAngle: number;
  direction: FoldDirection;
};

export type CartonTopology = {
  faces: CartonFace[];
  folds: CartonFold[];
  bodyFaceIds: string[];
  glueFaceId: string;
  rootFaceId: string;
  sequence: Array<{
    id: string;
    role: "glue" | "A" | "B";
    x: number;
    width: number;
  }>;
  bodyTop: number;
  bodyBottom: number;
  height: number;
  panelAWidth: number;
  panelBWidth: number;
};

export const pointOnLine = (line: Line, point: Point): boolean => {
  const cross =
    (point.y - line.start.y) * (line.end.x - line.start.x) -
    (point.x - line.start.x) * (line.end.y - line.start.y);
  return Math.abs(cross) < 0.001;
};
