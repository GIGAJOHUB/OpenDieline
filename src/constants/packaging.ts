import type { Preset, ReverseTuckEndParams } from "../types/carton";

export const DEFAULT_RTE_PARAMS: ReverseTuckEndParams = {
  panelAWidth: 38,
  panelBWidth: 170,
  height: 48,
  boardThickness: 0.45,
  glueFlapWidth: 12,
  bleed: 3,
  safeMargin: 4,
  tuckFlapDepth: 34,
  dustFlapDepth: 26,
  lockTongueDepth: 15,
  tolerance: 0.6,
};

export const MIN_RTE_PARAMS: ReverseTuckEndParams = {
  panelAWidth: 15,
  panelBWidth: 40,
  height: 20,
  boardThickness: 0.2,
  glueFlapWidth: 8,
  bleed: 0,
  safeMargin: 1,
  tuckFlapDepth: 8,
  dustFlapDepth: 6,
  lockTongueDepth: 4,
  tolerance: 0,
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
