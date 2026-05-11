import type { Line, Polygon } from "../../../types/geometry";
import { line, point, polygon } from "../../primitives/point";
import type { ClosureEnd } from "../tuck/generateTuckClosure";

export type GeneratedGlueClosure = {
  panel: Polygon;
  cutPolygons: Polygon[];
  foldLines: Line[];
};

type GlueClosureInput = {
  idPrefix: string;
  x: number;
  creaseY: number;
  panelWidth: number;
  closureDepth: number;
  end: ClosureEnd;
  label: string;
};

export const generateGlueClosure = ({
  idPrefix,
  x,
  creaseY,
  panelWidth,
  closureDepth,
  end,
  label,
}: GlueClosureInput): GeneratedGlueClosure => {
  /*
   * Glued carton ends use a single major sealing panel with a straight cut free
   * edge. There is no lock tongue and therefore no secondary tongue score.
   */
  const sign = end === "top" ? -1 : 1;
  const y = creaseY + sign * closureDepth;
  const cornerRelief = Math.min(panelWidth * 0.08, 5);
  const panel = polygon(
    `${idPrefix}-glue-closure`,
    end === "top"
      ? [
          point(x, creaseY),
          point(x + panelWidth, creaseY),
          point(x + panelWidth - cornerRelief, y),
          point(x + cornerRelief, y),
        ]
      : [
          point(x, creaseY),
          point(x + cornerRelief, y),
          point(x + panelWidth - cornerRelief, y),
          point(x + panelWidth, creaseY),
        ],
    `${label} glue closure panel`,
  );

  return {
    panel,
    cutPolygons: [panel],
    foldLines: [
      line(`${idPrefix}-score`, point(x, creaseY), point(x + panelWidth, creaseY), "fold", `${label} glue closure score`),
    ],
  };
};
