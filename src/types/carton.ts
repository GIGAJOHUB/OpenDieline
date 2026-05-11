import type { Millimeters } from "./geometry";

export type ReverseTuckEndParams = {
  panelAWidth: Millimeters;
  panelBWidth: Millimeters;
  height: Millimeters;
  boardThickness: Millimeters;
  glueFlapWidth: Millimeters;
  bleed: Millimeters;
  safeMargin: Millimeters;
  tuckFlapDepth: Millimeters;
  dustFlapDepth: Millimeters;
  lockTongueDepth: Millimeters;
  tolerance: Millimeters;
  topClosure: ClosureType;
  bottomClosure: ClosureType;
};

export type ClosureType = "tuck" | "glue";

export type CartonClosures = {
  top: ClosureType;
  bottom: ClosureType;
};

export type ValidationIssue = {
  field?: keyof ReverseTuckEndParams;
  severity: "warning" | "error";
  message: string;
};

export type Preset = {
  id: string;
  name: string;
  description: string;
  params: ReverseTuckEndParams;
};
