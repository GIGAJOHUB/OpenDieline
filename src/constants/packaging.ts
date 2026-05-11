import type { Preset, ReverseTuckEndParams } from "../types/carton";

export const DEFAULT_RTE_PARAMS: ReverseTuckEndParams = {
  panelAWidth: 35,
  panelBWidth: 45,
  height: 170,
  boardThickness: 0.4,
  glueFlapWidth: 15,
  bleed: 3,
  safeMargin: 3,
  tuckFlapDepth: 35,
  dustFlapDepth: 20,
  lockTongueDepth: 14,
  tolerance: 0.5,
  topClosure: "tuck",
  bottomClosure: "tuck",
};

export const MIN_RTE_PARAMS: ReverseTuckEndParams = {
  panelAWidth: 15,
  panelBWidth: 40,
  height: 20,
  boardThickness: 0,
  glueFlapWidth: 0,
  bleed: 0,
  safeMargin: 0,
  tuckFlapDepth: 0,
  dustFlapDepth: 0,
  lockTongueDepth: 0,
  tolerance: 0,
  topClosure: "tuck",
  bottomClosure: "tuck",
};

export const MAX_RTE_PARAMS: ReverseTuckEndParams = {
  panelAWidth: 120,
  panelBWidth: 320,
  height: 160,
  boardThickness: 1.2,
  glueFlapWidth: 24,
  bleed: 8,
  safeMargin: 10,
  tuckFlapDepth: 95,
  dustFlapDepth: 80,
  lockTongueDepth: 28,
  tolerance: 2,
  topClosure: "glue",
  bottomClosure: "glue",
};

export const RTE_PRESETS: Preset[] = [
  {
    id: "toothpaste",
    name: "Toothpaste carton",
    description: "Long retail tube carton with reverse tuck ends",
    params: DEFAULT_RTE_PARAMS,
  },
  {
    id: "cosmetic",
    name: "Cosmetic carton",
    description: "Compact carton for serum or boxed cosmetics",
    params: {
      ...DEFAULT_RTE_PARAMS,
      panelAWidth: 34,
      panelBWidth: 95,
      height: 34,
      tuckFlapDepth: 28,
      dustFlapDepth: 22,
      topClosure: "glue",
      bottomClosure: "tuck",
    },
  },
  {
    id: "pharma",
    name: "Pharma carton",
    description: "Small medicine carton with conservative margins",
    params: {
      ...DEFAULT_RTE_PARAMS,
      panelAWidth: 28,
      panelBWidth: 120,
      height: 42,
      safeMargin: 5,
      glueFlapWidth: 10,
      tuckFlapDepth: 24,
      dustFlapDepth: 19,
      topClosure: "tuck",
      bottomClosure: "glue",
    },
  },
];

export const LINE_STYLES = {
  cut: {
    stroke: "#d92323",
    label: "Cut",
  },
  fold: {
    stroke: "#1d65d8",
    label: "Fold / score",
  },
  bleed: {
    stroke: "#14915b",
    label: "Bleed",
  },
  safe: {
    stroke: "#9a7b12",
    label: "Safe zone",
  },
  perforation: {
    stroke: "#7b3fb5",
    label: "Perforation",
  },
} as const;
