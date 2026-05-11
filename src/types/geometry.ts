export type Millimeters = number;

export type Point = {
  x: Millimeters;
  y: Millimeters;
};

export type LineType = "cut" | "fold" | "bleed" | "safe" | "perforation";

export type Line = {
  id: string;
  start: Point;
  end: Point;
  type: LineType;
  label?: string;
};

export type Polygon = {
  id: string;
  points: Point[];
  label?: string;
};

export type DimensionLabel = {
  id: string;
  start: Point;
  end: Point;
  offset: Millimeters;
  text: string;
};

export type DielineLayerName =
  | "cut"
  | "fold"
  | "bleed"
  | "safe"
  | "perforation"
  | "glue"
  | "dimensions";

export type Dieline = {
  id: string;
  name: string;
  units: "mm";
  cuts: Line[];
  folds: Line[];
  bleeds: Line[];
  safeZones: Line[];
  perforations: Line[];
  glueAreas: Polygon[];
  panels: Polygon[];
  dimensions: DimensionLabel[];
  metadata: {
    createdAt: string;
    template: string;
    manufacturingNotes: string[];
  };
};

export type Bounds = {
  minX: Millimeters;
  minY: Millimeters;
  maxX: Millimeters;
  maxY: Millimeters;
  width: Millimeters;
  height: Millimeters;
};
