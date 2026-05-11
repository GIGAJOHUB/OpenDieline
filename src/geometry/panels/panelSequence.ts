import type { ReverseTuckEndParams } from "../../types/carton";

export type RtePanelSequence = {
  panelA: number;
  panelB: number;
  height: number;
  bodyTop: number;
  bodyBottom: number;
  xGlue: number;
  xA1: number;
  xB1: number;
  xA2: number;
  xB2: number;
  xRight: number;
};

export const makeRtePanelSequence = (params: ReverseTuckEndParams): RtePanelSequence => {
  /*
   * A/B dimensions are crease-to-crease inputs. Caliper and tolerance are
   * applied once here so every downstream renderer and exporter uses the same
   * compensated manufacturing topology.
   */
  const panelA = params.panelAWidth + params.boardThickness + params.tolerance;
  const panelB = params.panelBWidth + params.tolerance;
  const height = params.height + params.tolerance;
  const bodyTop = params.tuckFlapDepth;
  const bodyBottom = bodyTop + height;
  const xGlue = 0;
  const xA1 = params.glueFlapWidth;
  const xB1 = xA1 + panelA;
  const xA2 = xB1 + panelB;
  const xB2 = xA2 + panelA;
  const xRight = xB2 + panelB;

  return { panelA, panelB, height, bodyTop, bodyBottom, xGlue, xA1, xB1, xA2, xB2, xRight };
};
