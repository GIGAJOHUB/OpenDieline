import type { Dieline, Line } from "../types/geometry";

const layerForLine = (line: Line): string => {
  switch (line.type) {
    case "fold":
      return "FOLD_SCORE_BLUE_DASHED";
    case "bleed":
      return "BLEED_GREEN";
    case "safe":
      return "SAFE_ZONE";
    case "perforation":
      return "PERFORATION_DOTTED";
    case "cut":
    default:
      return "CUT_RED";
  }
};

const colorForLine = (line: Line): number => {
  switch (line.type) {
    case "fold":
      return 5;
    case "bleed":
      return 3;
    case "safe":
      return 2;
    case "perforation":
      return 6;
    case "cut":
    default:
      return 1;
  }
};

const dxfLine = (line: Line): string => `0
LINE
8
${layerForLine(line)}
62
${colorForLine(line)}
10
${line.start.x}
20
${line.start.y}
30
0
11
${line.end.x}
21
${line.end.y}
31
0`;

export const exportDielineToDxf = (dieline: Dieline): string => {
  const lines = [
    ...dieline.cuts,
    ...dieline.folds,
    ...dieline.bleeds,
    ...dieline.safeZones,
    ...dieline.perforations,
  ];

  return `0
SECTION
2
HEADER
9
$INSUNITS
70
4
0
ENDSEC
0
SECTION
2
ENTITIES
${lines.map(dxfLine).join("\n")}
0
ENDSEC
0
EOF`;
};

export const dxfBlob = (dieline: Dieline): Blob =>
  new Blob([exportDielineToDxf(dieline)], { type: "application/dxf;charset=utf-8" });
