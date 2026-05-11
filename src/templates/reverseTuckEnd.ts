import type { ReverseTuckEndParams } from "../types/carton";
import type { Dieline, DimensionLabel, Line, Polygon } from "../types/geometry";
import { line, point, polygon, polygonToLines } from "../geometry/primitives/point";
import type { CartonFace, CartonFold, CartonTopology } from "../geometry/topology/cartonTopology";
import { makeRteDustFlap } from "../geometry/flaps/rteFlaps";
import { makeRtePanelSequence } from "../geometry/panels/panelSequence";
import { generateTuckClosure } from "../geometry/closures/tuck/generateTuckClosure";
import { generateGlueClosure } from "../geometry/closures/glue/generateGlueClosure";

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

const samePoint = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.abs(a.x - b.x) < 0.001 && Math.abs(a.y - b.y) < 0.001;

const sameSegment = (lineA: Line, lineB: Line) =>
  (samePoint(lineA.start, lineB.start) && samePoint(lineA.end, lineB.end)) ||
  (samePoint(lineA.start, lineB.end) && samePoint(lineA.end, lineB.start));

const cutLinesForPolygon = (poly: Polygon, excludedFoldSegments: Line[], idPrefix = poly.id): Line[] =>
  polygonToLines(poly, "cut", idPrefix).filter(
    (candidate) => !excludedFoldSegments.some((fold) => sameSegment(candidate, fold)),
  );

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
  const b2 = rect("panel-b-back", xB2, bodyTop, panelB, height, "Panel D back");
  const topDustA1 = makeRteDustFlap("top-dust-a-left", xA1, bodyTop, panelA, params.dustFlapDepth, "top", "Top dust flap A left");
  const topDustA2 = makeRteDustFlap("top-dust-a-right", xA2, bodyTop, panelA, params.dustFlapDepth, "top", "Top dust flap A right");
  const bottomDustA1 = makeRteDustFlap("bottom-dust-a-left", xA1, bodyBottom, panelA, params.dustFlapDepth, "bottom", "Bottom dust flap A left");
  const bottomDustA2 = makeRteDustFlap("bottom-dust-a-right", xA2, bodyBottom, panelA, params.dustFlapDepth, "bottom", "Bottom dust flap A right");
  const topClosure =
    params.topClosure === "tuck"
      ? generateTuckClosure({
          idPrefix: "top-tuck-b-front",
          x: xB1,
          creaseY: bodyTop,
          panelWidth: panelB,
          closureDepth: panelA,
          lockTongueDepth: params.lockTongueDepth,
          end: "top",
          label: "Top Panel B tuck closure",
        })
      : generateGlueClosure({
          idPrefix: "top-glue-b-front",
          x: xB1,
          creaseY: bodyTop,
          panelWidth: panelB,
          closureDepth: panelA,
          end: "top",
          label: "Top Panel B glued closure",
        });
  const bottomClosure =
    params.bottomClosure === "tuck"
      ? generateTuckClosure({
          idPrefix: "bottom-tuck-d-back",
          x: xB2,
          creaseY: bodyBottom,
          panelWidth: panelB,
          closureDepth: panelA,
          lockTongueDepth: params.lockTongueDepth,
          end: "bottom",
          label: "Bottom Panel D tuck closure",
        })
      : generateGlueClosure({
          idPrefix: "bottom-glue-d-back",
          x: xB2,
          creaseY: bodyBottom,
          panelWidth: panelB,
          closureDepth: panelA,
          end: "bottom",
          label: "Bottom Panel D glued closure",
        });

  const panels = [a1, b1, a2, b2];
  const closurePolygons =
    "mainPanel" in topClosure
      ? [topClosure.mainPanel, topClosure.tongue]
      : [topClosure.panel];
  const bottomClosurePolygons =
    "mainPanel" in bottomClosure
      ? [bottomClosure.mainPanel, bottomClosure.tongue]
      : [bottomClosure.panel];
  const flaps = [topDustA1, ...closurePolygons, topDustA2, bottomDustA1, bottomDustA2, ...bottomClosurePolygons];
  const foldCandidates = [
    foldLine("fold-glue-to-a", xA1, bodyTop, xA1, bodyBottom, "Glue flap to A score"),
    foldLine("fold-a-left-to-b-front", xB1, bodyTop, xB1, bodyBottom, "A left to B front score"),
    foldLine("fold-b-front-to-a-right", xA2, bodyTop, xA2, bodyBottom, "B front to C side score"),
    foldLine("fold-a-right-to-b-back", xB2, bodyTop, xB2, bodyBottom, "C side to D back score"),
    foldLine("fold-top-dust-a-left", xA1, bodyTop, xB1, bodyTop, "Top dust A score"),
    ...topClosure.foldLines,
    foldLine("fold-top-dust-a-right", xA2, bodyTop, xB2, bodyTop, "Top dust C score"),
    foldLine("fold-bottom-dust-a-left", xA1, bodyBottom, xB1, bodyBottom, "Bottom dust A score"),
    foldLine("fold-bottom-dust-a-right", xA2, bodyBottom, xB2, bodyBottom, "Bottom dust C score"),
    ...bottomClosure.foldLines,
  ];
  const cuts = [
    ...cutLinesForPolygon(glue, [foldCandidates[0]], "cut-glue"),
    ...flaps.flatMap((flap) => cutLinesForPolygon(flap, foldCandidates, `cut-${flap.id}`)),
    line("cut-top-d-back-open", point(xB2, bodyTop), point(xRight, bodyTop), "cut", "Panel D top straight cut"),
    line("cut-bottom-b-front-open", point(xB1, bodyBottom), point(xA2, bodyBottom), "cut", "Panel B bottom straight cut"),
    line("cut-right-body", point(xRight, bodyTop), point(xRight, bodyBottom), "cut", "Back panel outside cut"),
  ];

  const folds = foldCandidates;

  const topFold = (id: string) => folds.find((fold) => fold.id === id)!;
  const isTopTuck = "mainPanel" in topClosure;
  const isBottomTuck = "mainPanel" in bottomClosure;
  const topClosureMainId = isTopTuck ? topClosure.mainPanel.id : topClosure.panel.id;
  const bottomClosureMainId = isBottomTuck ? bottomClosure.mainPanel.id : bottomClosure.panel.id;
  const faces: CartonFace[] = [
    makeFace("glue", "Glue flap", "glue", glue, params.glueFlapWidth, height, { parentId: "panel-a-left", foldId: "fold-glue-to-a", panelRole: "glue" }),
    makeFace("panel-a-left", "Panel A left side", "body", a1, panelA, height, { parentId: "panel-b-front", foldId: "fold-a-left-to-b-front", panelRole: "A" }),
    makeFace("panel-b-front", "Panel B front", "body", b1, panelB, height, { panelRole: "B" }),
    makeFace("panel-a-right", "Panel A right side", "body", a2, panelA, height, { parentId: "panel-b-front", foldId: "fold-b-front-to-a-right", panelRole: "A" }),
    makeFace("panel-b-back", "Panel D back", "body", b2, panelB, height, { parentId: "panel-a-right", foldId: "fold-a-right-to-b-back", panelRole: "B" }),
    makeFace("top-dust-a-left", "Top dust flap A left", "dust", topDustA1, panelA, params.dustFlapDepth, { parentId: "panel-a-left", foldId: "fold-top-dust-a-left" }),
    makeFace("top-dust-a-right", "Top dust flap A right", "dust", topDustA2, panelA, params.dustFlapDepth, { parentId: "panel-a-right", foldId: "fold-top-dust-a-right" }),
    makeFace(topClosureMainId, params.topClosure === "tuck" ? "Top tuck closure B front" : "Top glue closure B front", params.topClosure === "tuck" ? "tuck" : "seal", isTopTuck ? topClosure.mainPanel : topClosure.panel, panelB, panelA, { parentId: "panel-b-front", foldId: isTopTuck ? "top-tuck-b-front-score" : "top-glue-b-front-score" }),
    ...(isTopTuck
      ? [
          makeFace(topClosure.tongue.id, "Top lock tongue B front", "tongue", topClosure.tongue, panelB, params.lockTongueDepth, {
            parentId: topClosure.mainPanel.id,
            foldId: "top-tuck-b-front-tongue-score",
          }),
        ]
      : []),
    makeFace("bottom-dust-a-left", "Bottom dust flap A left", "dust", bottomDustA1, panelA, params.dustFlapDepth, { parentId: "panel-a-left", foldId: "fold-bottom-dust-a-left" }),
    makeFace("bottom-dust-a-right", "Bottom dust flap A right", "dust", bottomDustA2, panelA, params.dustFlapDepth, { parentId: "panel-a-right", foldId: "fold-bottom-dust-a-right" }),
    makeFace(bottomClosureMainId, params.bottomClosure === "tuck" ? "Bottom tuck closure D back" : "Bottom glue closure D back", params.bottomClosure === "tuck" ? "tuck" : "seal", isBottomTuck ? bottomClosure.mainPanel : bottomClosure.panel, panelB, panelA, { parentId: "panel-b-back", foldId: isBottomTuck ? "bottom-tuck-d-back-score" : "bottom-glue-d-back-score" }),
    ...(isBottomTuck
      ? [
          makeFace(bottomClosure.tongue.id, "Bottom lock tongue D back", "tongue", bottomClosure.tongue, panelB, params.lockTongueDepth, {
            parentId: bottomClosure.mainPanel.id,
            foldId: "bottom-tuck-d-back-tongue-score",
          }),
        ]
      : []),
  ];

  const topology: CartonTopology = {
    faces,
    folds: [
      makeFold("fold-a-left-to-b-front", "A left to B front", topFold("fold-a-left-to-b-front"), "vertical-body", "panel-b-front", "panel-a-left", Math.PI / 2, 1),
      makeFold("fold-b-front-to-a-right", "B front to C side", topFold("fold-b-front-to-a-right"), "vertical-body", "panel-b-front", "panel-a-right", Math.PI / 2, -1),
      makeFold("fold-a-right-to-b-back", "C side to D back", topFold("fold-a-right-to-b-back"), "vertical-body", "panel-a-right", "panel-b-back", Math.PI / 2, -1),
      makeFold("fold-glue-to-a", "Glue to A", topFold("fold-glue-to-a"), "glue", "panel-a-left", "glue", Math.PI / 2, 1),
      makeFold("fold-top-dust-a-left", "Top dust A left", topFold("fold-top-dust-a-left"), "top-closure", "panel-a-left", "top-dust-a-left", Math.PI / 2, 1),
      makeFold("fold-top-dust-a-right", "Top dust A right", topFold("fold-top-dust-a-right"), "top-closure", "panel-a-right", "top-dust-a-right", Math.PI / 2, 1),
      makeFold(isTopTuck ? "top-tuck-b-front-score" : "top-glue-b-front-score", "Top closure B front", topFold(isTopTuck ? "top-tuck-b-front-score" : "top-glue-b-front-score"), "top-closure", "panel-b-front", topClosureMainId, Math.PI / 2, 1),
      ...(isTopTuck
        ? [
            makeFold("top-tuck-b-front-tongue-score", "Top lock tongue B front", topFold("top-tuck-b-front-tongue-score"), "top-closure", topClosure.mainPanel.id, topClosure.tongue.id, Math.PI / 2, 1),
          ]
        : []),
      makeFold("fold-bottom-dust-a-left", "Bottom dust A left", topFold("fold-bottom-dust-a-left"), "bottom-closure", "panel-a-left", "bottom-dust-a-left", Math.PI / 2, -1),
      makeFold("fold-bottom-dust-a-right", "Bottom dust A right", topFold("fold-bottom-dust-a-right"), "bottom-closure", "panel-a-right", "bottom-dust-a-right", Math.PI / 2, -1),
      makeFold(isBottomTuck ? "bottom-tuck-d-back-score" : "bottom-glue-d-back-score", "Bottom closure D back", topFold(isBottomTuck ? "bottom-tuck-d-back-score" : "bottom-glue-d-back-score"), "bottom-closure", "panel-b-back", bottomClosureMainId, Math.PI / 2, -1),
      ...(isBottomTuck
        ? [
            makeFold("bottom-tuck-d-back-tongue-score", "Bottom lock tongue D back", topFold("bottom-tuck-d-back-tongue-score"), "bottom-closure", bottomClosure.mainPanel.id, bottomClosure.tongue.id, Math.PI / 2, -1),
          ]
        : []),
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
