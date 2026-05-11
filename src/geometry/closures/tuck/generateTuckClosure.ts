import type { Line, Polygon } from "../../../types/geometry";
import { line, point, polygon } from "../../primitives/point";

export type ClosureEnd = "top" | "bottom";

export type GeneratedTuckClosure = {
  mainPanel: Polygon;
  tongue: Polygon;
  cutPolygons: Polygon[];
  foldLines: Line[];
};

type TuckClosureInput = {
  idPrefix: string;
  x: number;
  creaseY: number;
  panelWidth: number;
  closureDepth: number;
  lockTongueDepth: number;
  end: ClosureEnd;
  label: string;
};

export const generateTuckClosure = ({
  idPrefix,
  x,
  creaseY,
  panelWidth,
  closureDepth,
  lockTongueDepth,
  end,
  label,
}: TuckClosureInput): GeneratedTuckClosure => {
  /*
   * The closure panel depth equals the carton depth (Panel A). The tongue fold
   * is exactly one Panel-A depth away from the main panel score line; the lock
   * tongue is a second hinged face and never part of the main closure panel.
   */
  const sign = end === "top" ? -1 : 1;
  const closureY = creaseY + sign * closureDepth;
  const tongueY = closureY + sign * lockTongueDepth;
  const shoulderInset = Math.min(panelWidth * 0.14, 10);
  const tongueInset = Math.min(panelWidth * 0.22, 18);

  const mainPanel = polygon(
    `${idPrefix}-main`,
    end === "top"
      ? [
          point(x, creaseY),
          point(x + panelWidth, creaseY),
          point(x + panelWidth - shoulderInset, closureY),
          point(x + shoulderInset, closureY),
        ]
      : [
          point(x, creaseY),
          point(x + shoulderInset, closureY),
          point(x + panelWidth - shoulderInset, closureY),
          point(x + panelWidth, creaseY),
        ],
    `${label} main closure panel`,
  );

  const tongue = polygon(
    `${idPrefix}-tongue`,
    end === "top"
      ? [
          point(x + shoulderInset, closureY),
          point(x + panelWidth - shoulderInset, closureY),
          point(x + panelWidth - tongueInset, tongueY),
          point(x + tongueInset, tongueY),
        ]
      : [
          point(x + shoulderInset, closureY),
          point(x + tongueInset, tongueY),
          point(x + panelWidth - tongueInset, tongueY),
          point(x + panelWidth - shoulderInset, closureY),
        ],
    `${label} lock tongue`,
  );

  return {
    mainPanel,
    tongue,
    cutPolygons: [mainPanel, tongue],
    foldLines: [
      line(`${idPrefix}-score`, point(x, creaseY), point(x + panelWidth, creaseY), "fold", `${label} panel score`),
      line(
        `${idPrefix}-tongue-score`,
        point(x + shoulderInset, closureY),
        point(x + panelWidth - shoulderInset, closureY),
        "fold",
        `${label} tongue score`,
      ),
    ],
  };
};
