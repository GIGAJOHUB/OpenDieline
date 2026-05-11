import type { ReverseTuckEndParams } from "../types/carton";
import type { Dieline, DimensionLabel, Line, Point, Polygon } from "../types/geometry";
import { line, point, polygon, polygonToLines } from "../geometry/primitives/point";

type RteLayout = {
  bodyTop: number;
  bodyBottom: number;
  effectiveLength: number;
  effectiveWidth: number;
  effectiveHeight: number;
  panelX: {
    glueLeft: number;
    sideA: number;
    front: number;
    sideB: number;
    back: number;
    right: number;
  };
};

const rect = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
): Polygon =>
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

const makeLayout = (params: ReverseTuckEndParams): RteLayout => {
  /*
   * Carton dimensions are specified crease-to-crease. Board caliper and
   * tolerance are added to the wrapped panels so the erected carton does not
   * become undersized after folding around real paperboard thickness.
   */
  const effectiveLength = params.length + params.tolerance;
  const effectiveWidth = params.width + params.boardThickness + params.tolerance;
  const effectiveHeight = params.height + params.tolerance;
  const bodyTop = params.tuckFlapDepth;
  const bodyBottom = bodyTop + effectiveHeight;
  const sideA = params.glueFlapWidth;
  const front = sideA + effectiveWidth;
  const sideB = front + effectiveLength;
  const back = sideB + effectiveWidth;
  const right = back + effectiveLength;

  return {
    bodyTop,
    bodyBottom,
    effectiveLength,
    effectiveWidth,
    effectiveHeight,
    panelX: {
      glueLeft: 0,
      sideA,
      front,
      sideB,
      back,
      right,
    },
  };
};

const tuckFlap = (
  id: string,
  x: number,
  creaseY: number,
  panelWidth: number,
  depth: number,
  tongueDepth: number,
  direction: "top" | "bottom",
  label: string,
): Polygon => {
  /*
   * A tuck flap is narrower at the free end and carries a central locking
   * tongue. The angled shoulders reduce interference with dust flaps when the
   * flap is inserted into the erected carton.
   */
  const sign = direction === "top" ? -1 : 1;
  const shoulderInset = Math.min(panelWidth * 0.16, 12);
  const tongueWidth = Math.max(panelWidth * 0.42, panelWidth - shoulderInset * 3);
  const tongueInset = (panelWidth - tongueWidth) / 2;
  const tongueY = creaseY + sign * (depth - tongueDepth);
  const tipY = creaseY + sign * depth;

  const points =
    direction === "top"
      ? [
          point(x, creaseY),
          point(x + panelWidth, creaseY),
          point(x + panelWidth - shoulderInset, tongueY),
          point(x + panelWidth - tongueInset, tongueY),
          point(x + panelWidth - tongueInset - shoulderInset * 0.35, tipY),
          point(x + tongueInset + shoulderInset * 0.35, tipY),
          point(x + tongueInset, tongueY),
          point(x + shoulderInset, tongueY),
        ]
      : [
          point(x, creaseY),
          point(x + shoulderInset, tongueY),
          point(x + tongueInset, tongueY),
          point(x + tongueInset + shoulderInset * 0.35, tipY),
          point(x + panelWidth - tongueInset - shoulderInset * 0.35, tipY),
          point(x + panelWidth - tongueInset, tongueY),
          point(x + panelWidth - shoulderInset, tongueY),
          point(x + panelWidth, creaseY),
        ];

  return polygon(id, points, label);
};

const dustFlap = (
  id: string,
  x: number,
  creaseY: number,
  panelWidth: number,
  depth: number,
  direction: "top" | "bottom",
  label: string,
): Polygon => {
  /*
   * Dust flaps on narrow side panels use chamfered free corners. This is a
   * common folding-carton convention that prevents sharp corners from binding
   * under the major tuck flap.
   */
  const sign = direction === "top" ? -1 : 1;
  const chamfer = Math.min(panelWidth * 0.28, depth * 0.35);
  const endY = creaseY + sign * depth;

  const points =
    direction === "top"
      ? [
          point(x, creaseY),
          point(x + panelWidth, creaseY),
          point(x + panelWidth - chamfer, endY),
          point(x + chamfer, endY),
        ]
      : [
          point(x, creaseY),
          point(x + chamfer, endY),
          point(x + panelWidth - chamfer, endY),
          point(x + panelWidth, creaseY),
        ];

  return polygon(id, points, label);
};

const glueFlap = (params: ReverseTuckEndParams, layout: RteLayout): Polygon => {
  const notch = Math.min(params.glueFlapWidth * 0.42, 5);
  return polygon(
    "glue-flap-cut",
    [
      point(layout.panelX.glueLeft + notch, layout.bodyTop),
      point(layout.panelX.sideA, layout.bodyTop),
      point(layout.panelX.sideA, layout.bodyBottom),
      point(layout.panelX.glueLeft + notch, layout.bodyBottom),
      point(layout.panelX.glueLeft, layout.bodyBottom - notch),
      point(layout.panelX.glueLeft, layout.bodyTop + notch),
    ],
    "Glue flap",
  );
};

const foldLine = (
  id: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label: string,
): Line => line(id, point(x1, y1), point(x2, y2), "fold", label);

const safeZoneForPanel = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  margin: number,
  label: string,
): Line[] => {
  if (margin * 2 >= width || margin * 2 >= height) return [];
  return polygonToLines(
    rect(id, x + margin, y + margin, width - margin * 2, height - margin * 2, label),
    "safe",
    id,
  );
};

const bleedLines = (pieces: Polygon[], bleed: number): Line[] => {
  /*
   * For the first template we produce panel/flap-level bleed rectangles.
   * This keeps print bleed explicit and editable while preserving the true
   * cut geometry for manufacturing. Later curved/compound templates can swap
   * this for a full polygon offsetter without changing exporters.
   */
  if (bleed <= 0) return [];

  return pieces.flatMap((piece) => {
    const xs = piece.points.map((p) => p.x);
    const ys = piece.points.map((p) => p.y);
    const minX = Math.min(...xs) - bleed;
    const minY = Math.min(...ys) - bleed;
    const maxX = Math.max(...xs) + bleed;
    const maxY = Math.max(...ys) + bleed;
    return polygonToLines(
      rect(`bleed-${piece.id}`, minX, minY, maxX - minX, maxY - minY, `${piece.label} bleed`),
      "bleed",
      `bleed-${piece.id}`,
    );
  });
};

const dimensionLabels = (params: ReverseTuckEndParams, layout: RteLayout): DimensionLabel[] => [
  {
    id: "dim-length",
    start: point(layout.panelX.front, layout.bodyBottom + params.tuckFlapDepth + 13),
    end: point(layout.panelX.sideB, layout.bodyBottom + params.tuckFlapDepth + 13),
    offset: 0,
    text: `Length ${params.length.toFixed(1)} mm`,
  },
  {
    id: "dim-width",
    start: point(layout.panelX.sideA, layout.bodyTop - params.tuckFlapDepth - 13),
    end: point(layout.panelX.front, layout.bodyTop - params.tuckFlapDepth - 13),
    offset: 0,
    text: `Width ${params.width.toFixed(1)} mm`,
  },
  {
    id: "dim-height",
    start: point(layout.panelX.right + 15, layout.bodyTop),
    end: point(layout.panelX.right + 15, layout.bodyBottom),
    offset: 0,
    text: `Height ${params.height.toFixed(1)} mm`,
  },
];

export const generateReverseTuckEndDieline = (
  params: ReverseTuckEndParams,
): Dieline => {
  const layout = makeLayout(params);
  const { panelX } = layout;
  const topY = layout.bodyTop;
  const bottomY = layout.bodyBottom;

  const panels = [
    rect("panel-side-a", panelX.sideA, topY, layout.effectiveWidth, layout.effectiveHeight, "Side panel A"),
    rect("panel-front", panelX.front, topY, layout.effectiveLength, layout.effectiveHeight, "Front panel"),
    rect("panel-side-b", panelX.sideB, topY, layout.effectiveWidth, layout.effectiveHeight, "Side panel B"),
    rect("panel-back", panelX.back, topY, layout.effectiveLength, layout.effectiveHeight, "Back panel"),
  ];

  const glue = glueFlap(params, layout);
  const flaps = [
    dustFlap(
      "top-dust-side-a",
      panelX.sideA,
      topY,
      layout.effectiveWidth,
      params.dustFlapDepth,
      "top",
      "Top dust flap A",
    ),
    dustFlap(
      "top-dust-side-b",
      panelX.sideB,
      topY,
      layout.effectiveWidth,
      params.dustFlapDepth,
      "top",
      "Top dust flap B",
    ),
    tuckFlap(
      "top-tuck-back",
      panelX.back,
      topY,
      layout.effectiveLength,
      params.tuckFlapDepth,
      params.lockTongueDepth,
      "top",
      "Top reverse tuck flap",
    ),
    tuckFlap(
      "bottom-tuck-front",
      panelX.front,
      bottomY,
      layout.effectiveLength,
      params.tuckFlapDepth,
      params.lockTongueDepth,
      "bottom",
      "Bottom reverse tuck flap",
    ),
    dustFlap(
      "bottom-dust-side-a",
      panelX.sideA,
      bottomY,
      layout.effectiveWidth,
      params.dustFlapDepth,
      "bottom",
      "Bottom dust flap A",
    ),
    dustFlap(
      "bottom-dust-side-b",
      panelX.sideB,
      bottomY,
      layout.effectiveWidth,
      params.dustFlapDepth,
      "bottom",
      "Bottom dust flap B",
    ),
  ];

  const cutPieces = [glue, ...flaps];
  const cuts = [
    ...polygonToLines(glue, "cut", "cut-glue"),
    ...flaps.flatMap((flap) => polygonToLines(flap, "cut", `cut-${flap.id}`)),
    line("cut-top-front", point(panelX.front, topY), point(panelX.sideB, topY), "cut", "Top front cut"),
    line("cut-bottom-back", point(panelX.back, bottomY), point(panelX.right, bottomY), "cut", "Bottom back cut"),
    line("cut-right-body", point(panelX.right, topY), point(panelX.right, bottomY), "cut", "Right side cut"),
  ];

  const folds = [
    foldLine("fold-glue", panelX.sideA, topY, panelX.sideA, bottomY, "Glue flap score"),
    foldLine("fold-side-a-front", panelX.front, topY, panelX.front, bottomY, "Side A to front score"),
    foldLine("fold-front-side-b", panelX.sideB, topY, panelX.sideB, bottomY, "Front to side B score"),
    foldLine("fold-side-b-back", panelX.back, topY, panelX.back, bottomY, "Side B to back score"),
    foldLine("fold-top-dust-a", panelX.sideA, topY, panelX.front, topY, "Top dust score A"),
    foldLine("fold-top-dust-b", panelX.sideB, topY, panelX.back, topY, "Top dust score B"),
    foldLine("fold-top-tuck", panelX.back, topY, panelX.right, topY, "Top tuck score"),
    foldLine("fold-bottom-dust-a", panelX.sideA, bottomY, panelX.front, bottomY, "Bottom dust score A"),
    foldLine("fold-bottom-tuck", panelX.front, bottomY, panelX.sideB, bottomY, "Bottom tuck score"),
    foldLine("fold-bottom-dust-b", panelX.sideB, bottomY, panelX.back, bottomY, "Bottom dust score B"),
  ];

  const safeZones = panels.flatMap((panel) => {
    const xs = panel.points.map((p) => p.x);
    const ys = panel.points.map((p) => p.y);
    return safeZoneForPanel(
      `safe-${panel.id}`,
      Math.min(...xs),
      Math.min(...ys),
      Math.max(...xs) - Math.min(...xs),
      Math.max(...ys) - Math.min(...ys),
      params.safeMargin,
      `${panel.label} safe zone`,
    );
  });

  return {
    id: "rte-carton",
    name: "Standard Reverse Tuck End Carton",
    units: "mm",
    cuts,
    folds,
    bleeds: bleedLines([...panels, ...cutPieces], params.bleed),
    safeZones,
    perforations: [],
    glueAreas: [glue],
    panels,
    dimensions: dimensionLabels(params, layout),
    metadata: {
      createdAt: new Date().toISOString(),
      template: "ECMA-style reverse tuck end folding carton",
      manufacturingNotes: [
        "Dimensions are interpreted as internal crease-to-crease millimeters.",
        "Minor panels include board caliper and tolerance compensation.",
        "Red lines are knife cuts, blue dashed lines are scores/folds, green lines are print bleed.",
        "Top and bottom tuck flaps are placed on opposite major panels for reverse tuck opening.",
      ],
    },
  };
};
