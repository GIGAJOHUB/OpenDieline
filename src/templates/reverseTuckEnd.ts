import type { ReverseTuckEndParams } from "../types/carton";
import type { Dieline, DimensionLabel, Line, Polygon } from "../types/geometry";
import { line, point, polygon, polygonToLines } from "../geometry/primitives/point";
import type { CartonFace, CartonFold, CartonTopology } from "../geometry/topology/cartonTopology";
import { makeRteDustFlap, makeRteTuckFlap } from "../geometry/flaps/rteFlaps";
import { makeRtePanelSequence } from "../geometry/panels/panelSequence";

type RteGeneration = {
  dieline: Dieline;
  topology: CartonTopology;
};

const rect = (id: string, x: number, y: number, width: number, height: number, label: string): Polygon =>
  polygon(
    id,
    [
      point(x, y),
      point(x + width, y),
      point(x + width, y + height),
      point(x, y + height),
    ],
    label,
  );

const foldLine = (id: string, x1: number, y1: number, x2: number, y2: number, label: string): Line =>
  line(id, point(x1, y1), point(x2, y2), "fold", label);

const makeFace = (
  id: string,
  label: string,
  kind: CartonFace["kind"],
  polygon: Polygon,
  width: number,
  height: number,
  extras: Partial<CartonFace> = {},
): CartonFace => ({
  id,
  label,
  kind,
  polygon,
  width,
  height,
  foldProgressAngle: 0,
  ...extras,
});

const glueFlap = (x: number, topY: number, width: number, height: number): Polygon => {
  const notch = Math.min(width * 0.42, 5);
  return polygon(
    "glue-flap",
    [
      point(x + notch, topY),
      point(x + width, topY),
      point(x + width, topY + height),
      point(x + notch, topY + height),
      point(x, topY + height - notch),
      point(x, topY + notch),
    ],
    "Glue flap",
  );
};

const safeZoneForPanel = (panel: Polygon, margin: number): Line[] => {
  const xs = panel.points.map((p) => p.x);
  const ys = panel.points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const width = Math.max(...xs) - minX;
  const height = Math.max(...ys) - minY;
  if (margin * 2 >= width || margin * 2 >= height) return [];
  return polygonToLines(rect(`safe-${panel.id}`, minX + margin, minY + margin, width - margin * 2, height - margin * 2, `${panel.label} safe zone`), "safe", `safe-${panel.id}`);
};

const bleedLines = (pieces: Polygon[], bleed: number): Line[] => {
  if (bleed <= 0) return [];
  return pieces.flatMap((piece) => {
    const xs = piece.points.map((p) => p.x);
    const ys = piece.points.map((p) => p.y);
    const minX = Math.min(...xs) - bleed;
    const minY = Math.min(...ys) - bleed;
    const maxX = Math.max(...xs) + bleed;
    const maxY = Math.max(...ys) + bleed;
    return polygonToLines(rect(`bleed-${piece.id}`, minX, minY, maxX - minX, maxY - minY, `${piece.label} bleed`), "bleed", `bleed-${piece.id}`);
  });
};

const makeFold = (
  id: string,
  label: string,
  axis: Line,
  axisKind: CartonFold["axisKind"],
  parentFaceId: string,
  childFaceId: string,
  targetAngle: number,
  direction: CartonFold["direction"],
): CartonFold => ({ id, label, axis, axisKind, parentFaceId, childFaceId, targetAngle, direction });

export const generateReverseTuckEnd = (params: ReverseTuckEndParams): RteGeneration => {
  /*
   * Topology is explicit: Glue | A | B | A | B. A panels are the minor side
   * walls, B panels are the major front/back walls. A and B stay linked in
   * pairs while remaining independent user-controlled dimensions.
   */
  const { panelA, panelB, height, bodyTop, bodyBottom, xGlue, xA1, xB1, xA2, xB2, xRight } = makeRtePanelSequence(params);

  const glue = glueFlap(xGlue, bodyTop, params.glueFlapWidth, height);
  const a1 = rect("panel-a-left", xA1, bodyTop, panelA, height, "Panel A left side");
  const b1 = rect("panel-b-front", xB1, bodyTop, panelB, height, "Panel B front");
  const a2 = rect("panel-a-right", xA2, bodyTop, panelA, height, "Panel A right side");
  const b2 = rect("panel-b-back", xB2, bodyTop, panelB, height, "Panel B back");
  const topDustA1 = makeRteDustFlap("top-dust-a-left", xA1, bodyTop, panelA, params.dustFlapDepth, "top", "Top dust flap A left");
  const topTuckBack = makeRteTuckFlap("top-tuck-b-back", xB2, bodyTop, panelB, params.tuckFlapDepth, params.lockTongueDepth, "top", "Top reverse tuck flap");
  const topDustA2 = makeRteDustFlap("top-dust-a-right", xA2, bodyTop, panelA, params.dustFlapDepth, "top", "Top dust flap A right");
  const bottomDustA1 = makeRteDustFlap("bottom-dust-a-left", xA1, bodyBottom, panelA, params.dustFlapDepth, "bottom", "Bottom dust flap A left");
  const bottomTuckFront = makeRteTuckFlap("bottom-tuck-b-front", xB1, bodyBottom, panelB, params.tuckFlapDepth, params.lockTongueDepth, "bottom", "Bottom reverse tuck flap");
  const bottomDustA2 = makeRteDustFlap("bottom-dust-a-right", xA2, bodyBottom, panelA, params.dustFlapDepth, "bottom", "Bottom dust flap A right");

  const panels = [a1, b1, a2, b2];
  const flaps = [topDustA1, topTuckBack, topDustA2, bottomDustA1, bottomTuckFront, bottomDustA2];
  const cuts = [
    ...polygonToLines(glue, "cut", "cut-glue"),
    ...flaps.flatMap((flap) => polygonToLines(flap, "cut", `cut-${flap.id}`)),
    line("cut-top-front-open", point(xB1, bodyTop), point(xA2, bodyTop), "cut", "Top front open edge"),
    line("cut-bottom-back-open", point(xB2, bodyBottom), point(xRight, bodyBottom), "cut", "Bottom back open edge"),
    line("cut-right-body", point(xRight, bodyTop), point(xRight, bodyBottom), "cut", "Back panel outside cut"),
  ];

  const folds = [
    foldLine("fold-glue-to-a", xA1, bodyTop, xA1, bodyBottom, "Glue flap to A score"),
    foldLine("fold-a-left-to-b-front", xB1, bodyTop, xB1, bodyBottom, "A left to B front score"),
    foldLine("fold-b-front-to-a-right", xA2, bodyTop, xA2, bodyBottom, "B front to A right score"),
    foldLine("fold-a-right-to-b-back", xB2, bodyTop, xB2, bodyBottom, "A right to B back score"),
    foldLine("fold-top-dust-a-left", xA1, bodyTop, xB1, bodyTop, "Top dust A left score"),
    foldLine("fold-top-dust-a-right", xA2, bodyTop, xB2, bodyTop, "Top dust A right score"),
    foldLine("fold-top-tuck-back", xB2, bodyTop, xRight, bodyTop, "Top tuck back score"),
    foldLine("fold-bottom-dust-a-left", xA1, bodyBottom, xB1, bodyBottom, "Bottom dust A left score"),
    foldLine("fold-bottom-tuck-front", xB1, bodyBottom, xA2, bodyBottom, "Bottom tuck front score"),
    foldLine("fold-bottom-dust-a-right", xA2, bodyBottom, xB2, bodyBottom, "Bottom dust A right score"),
  ];

  const topFold = (id: string) => folds.find((fold) => fold.id === id)!;
  const faces: CartonFace[] = [
    makeFace("glue", "Glue flap", "glue", glue, params.glueFlapWidth, height, { parentId: "panel-a-left", foldId: "fold-glue-to-a", panelRole: "glue" }),
    makeFace("panel-a-left", "Panel A left side", "body", a1, panelA, height, { parentId: "panel-b-front", foldId: "fold-a-left-to-b-front", panelRole: "A" }),
    makeFace("panel-b-front", "Panel B front", "body", b1, panelB, height, { panelRole: "B" }),
    makeFace("panel-a-right", "Panel A right side", "body", a2, panelA, height, { parentId: "panel-b-front", foldId: "fold-b-front-to-a-right", panelRole: "A" }),
    makeFace("panel-b-back", "Panel B back", "body", b2, panelB, height, { parentId: "panel-a-right", foldId: "fold-a-right-to-b-back", panelRole: "B" }),
    makeFace("top-dust-a-left", "Top dust flap A left", "dust", topDustA1, panelA, params.dustFlapDepth, { parentId: "panel-a-left", foldId: "fold-top-dust-a-left" }),
    makeFace("top-dust-a-right", "Top dust flap A right", "dust", topDustA2, panelA, params.dustFlapDepth, { parentId: "panel-a-right", foldId: "fold-top-dust-a-right" }),
    makeFace("top-tuck-b-back", "Top tuck flap B back", "tuck", topTuckBack, panelB, params.tuckFlapDepth, { parentId: "panel-b-back", foldId: "fold-top-tuck-back" }),
    makeFace("bottom-dust-a-left", "Bottom dust flap A left", "dust", bottomDustA1, panelA, params.dustFlapDepth, { parentId: "panel-a-left", foldId: "fold-bottom-dust-a-left" }),
    makeFace("bottom-dust-a-right", "Bottom dust flap A right", "dust", bottomDustA2, panelA, params.dustFlapDepth, { parentId: "panel-a-right", foldId: "fold-bottom-dust-a-right" }),
    makeFace("bottom-tuck-b-front", "Bottom tuck flap B front", "tuck", bottomTuckFront, panelB, params.tuckFlapDepth, { parentId: "panel-b-front", foldId: "fold-bottom-tuck-front" }),
  ];

  const topology: CartonTopology = {
    faces,
    folds: [
      makeFold("fold-a-left-to-b-front", "A left to B front", topFold("fold-a-left-to-b-front"), "vertical-body", "panel-b-front", "panel-a-left", Math.PI / 2, 1),
      makeFold("fold-b-front-to-a-right", "B front to A right", topFold("fold-b-front-to-a-right"), "vertical-body", "panel-b-front", "panel-a-right", -Math.PI / 2, -1),
      makeFold("fold-a-right-to-b-back", "A right to B back", topFold("fold-a-right-to-b-back"), "vertical-body", "panel-a-right", "panel-b-back", -Math.PI / 2, -1),
      makeFold("fold-glue-to-a", "Glue to A", topFold("fold-glue-to-a"), "glue", "panel-a-left", "glue", Math.PI / 2, 1),
      makeFold("fold-top-dust-a-left", "Top dust A left", topFold("fold-top-dust-a-left"), "top-closure", "panel-a-left", "top-dust-a-left", Math.PI / 2, 1),
      makeFold("fold-top-dust-a-right", "Top dust A right", topFold("fold-top-dust-a-right"), "top-closure", "panel-a-right", "top-dust-a-right", Math.PI / 2, 1),
      makeFold("fold-top-tuck-back", "Top tuck B back", topFold("fold-top-tuck-back"), "top-closure", "panel-b-back", "top-tuck-b-back", Math.PI / 2, 1),
      makeFold("fold-bottom-dust-a-left", "Bottom dust A left", topFold("fold-bottom-dust-a-left"), "bottom-closure", "panel-a-left", "bottom-dust-a-left", Math.PI / 2, -1),
      makeFold("fold-bottom-dust-a-right", "Bottom dust A right", topFold("fold-bottom-dust-a-right"), "bottom-closure", "panel-a-right", "bottom-dust-a-right", Math.PI / 2, -1),
      makeFold("fold-bottom-tuck-front", "Bottom tuck B front", topFold("fold-bottom-tuck-front"), "bottom-closure", "panel-b-front", "bottom-tuck-b-front", Math.PI / 2, -1),
    ],
    bodyFaceIds: ["panel-a-left", "panel-b-front", "panel-a-right", "panel-b-back"],
    glueFaceId: "glue",
    rootFaceId: "panel-b-front",
    sequence: [
      { id: "glue", role: "glue", x: xGlue, width: params.glueFlapWidth },
      { id: "panel-a-left", role: "A", x: xA1, width: panelA },
      { id: "panel-b-front", role: "B", x: xB1, width: panelB },
      { id: "panel-a-right", role: "A", x: xA2, width: panelA },
      { id: "panel-b-back", role: "B", x: xB2, width: panelB },
    ],
    bodyTop,
    bodyBottom,
    height,
    panelAWidth: panelA,
    panelBWidth: panelB,
  };

  const dimensions: DimensionLabel[] = [
    { id: "dim-panel-a", start: point(xA1, bodyTop - params.tuckFlapDepth - 12), end: point(xB1, bodyTop - params.tuckFlapDepth - 12), offset: 0, text: `Panel A ${params.panelAWidth.toFixed(1)} mm` },
    { id: "dim-panel-b", start: point(xB1, bodyBottom + params.tuckFlapDepth + 12), end: point(xA2, bodyBottom + params.tuckFlapDepth + 12), offset: 0, text: `Panel B ${params.panelBWidth.toFixed(1)} mm` },
    { id: "dim-height", start: point(xRight + 15, bodyTop), end: point(xRight + 15, bodyBottom), offset: 0, text: `Height ${params.height.toFixed(1)} mm` },
  ];

  return {
    topology,
    dieline: {
      id: "rte-carton",
      name: "Standard Reverse Tuck End Carton",
      units: "mm",
      cuts,
      folds,
      bleeds: bleedLines([glue, ...panels, ...flaps], params.bleed),
      safeZones: panels.flatMap((panel) => safeZoneForPanel(panel, params.safeMargin)),
      perforations: [],
      glueAreas: [glue],
      panels,
      dimensions,
      metadata: {
        createdAt: new Date().toISOString(),
        template: "Topology-driven ECMA-style reverse tuck end folding carton",
        manufacturingNotes: [
          "Flat sequence is Glue | A | B | A | B with linked A and linked B panel pairs.",
          "Top and bottom tuck closures are attached to opposite B panels for reverse tuck behavior.",
          "Dust flaps are attached to A panels and fold inward before the tuck flap closes.",
          "Panel dimensions are crease-to-crease millimeters with board caliper and tolerance compensation.",
        ],
      },
    },
  };
};

export const generateReverseTuckEndDieline = (params: ReverseTuckEndParams): Dieline =>
  generateReverseTuckEnd(params).dieline;
