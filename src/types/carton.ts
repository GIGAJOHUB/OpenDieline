import type { Millimeters } from "./geometry";

export type ReverseTuckEndParams = {
  length: Millimeters;
  width: Millimeters;
  height: Millimeters;
  boardThickness: Millimeters;
  glueFlapWidth: Millimeters;
  bleed: Millimeters;
  safeMargin: Millimeters;
  tuckFlapDepth: Millimeters;
  dustFlapDepth: Millimeters;
  lockTongueDepth: Millimeters;
  tolerance: Millimeters;
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
