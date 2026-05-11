import type { Polygon } from "../../types/geometry";
import { point, polygon } from "../primitives/point";

export const makeRteTuckFlap = (
  id: string,
  x: number,
  creaseY: number,
  panelWidth: number,
  depth: number,
  tongueDepth: number,
  direction: "top" | "bottom",
  label: string,
): Polygon => {
  const sign = direction === "top" ? -1 : 1;
  const shoulderInset = Math.min(panelWidth * 0.14, 12);
  const tongueInset = Math.min(panelWidth * 0.28, 22);
  const tongueY = creaseY + sign * Math.max(depth - tongueDepth, depth * 0.52);
  const tipY = creaseY + sign * depth;
  const points =
    direction === "top"
      ? [
          point(x, creaseY),
          point(x + panelWidth, creaseY),
          point(x + panelWidth - shoulderInset, tongueY),
          point(x + panelWidth - tongueInset, tongueY),
          point(x + panelWidth - tongueInset - shoulderInset * 0.25, tipY),
          point(x + tongueInset + shoulderInset * 0.25, tipY),
          point(x + tongueInset, tongueY),
          point(x + shoulderInset, tongueY),
        ]
      : [
          point(x, creaseY),
          point(x + shoulderInset, tongueY),
          point(x + tongueInset, tongueY),
          point(x + tongueInset + shoulderInset * 0.25, tipY),
          point(x + panelWidth - tongueInset - shoulderInset * 0.25, tipY),
          point(x + panelWidth - tongueInset, tongueY),
          point(x + panelWidth - shoulderInset, tongueY),
          point(x + panelWidth, creaseY),
        ];

  return polygon(id, points, label);
};

export const makeRteDustFlap = (
  id: string,
  x: number,
  creaseY: number,
  panelWidth: number,
  depth: number,
  direction: "top" | "bottom",
  label: string,
): Polygon => {
  const sign = direction === "top" ? -1 : 1;
  const chamfer = Math.min(panelWidth * 0.22, depth * 0.36);
  const endY = creaseY + sign * depth;
  const points =
    direction === "top"
      ? [point(x, creaseY), point(x + panelWidth, creaseY), point(x + panelWidth - chamfer, endY), point(x + chamfer, endY)]
      : [point(x, creaseY), point(x + chamfer, endY), point(x + panelWidth - chamfer, endY), point(x + panelWidth, creaseY)];
  return polygon(id, points, label);
};
