import type { ReverseTuckEndParams, ValidationIssue } from "../../types/carton";

export const validateReverseTuckEnd = (
  params: ReverseTuckEndParams,
): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  if (params.length <= params.width) {
    issues.push({
      field: "length",
      severity: "warning",
      message: "Length is usually greater than width for toothpaste and retail RTE cartons.",
    });
  }

  if (params.tuckFlapDepth < params.width * 0.45) {
    issues.push({
      field: "tuckFlapDepth",
      severity: "warning",
      message: "Tuck flap may be too shallow to retain product during handling.",
    });
  }

  if (params.tuckFlapDepth > params.width + params.lockTongueDepth) {
    issues.push({
      field: "tuckFlapDepth",
      severity: "warning",
      message: "Tuck flap is deep; verify it will not collide inside the carton.",
    });
  }

  if (params.glueFlapWidth < 10 || params.glueFlapWidth > 15) {
    issues.push({
      field: "glueFlapWidth",
      severity: "warning",
      message: "Common straight-line glue flaps are typically 10-15 mm.",
    });
  }

  if (params.bleed < 3) {
    issues.push({
      field: "bleed",
      severity: "warning",
      message: "Commercial print bleed is commonly 3 mm or more.",
    });
  }

  if (params.safeMargin < 2 || params.safeMargin > 6) {
    issues.push({
      field: "safeMargin",
      severity: "warning",
      message: "Safe margins are usually kept around 2-6 mm from cuts and folds.",
    });
  }

  if (params.boardThickness > params.tolerance) {
    issues.push({
      field: "tolerance",
      severity: "warning",
      message: "Tolerance is below board thickness; check fit compensation for the selected stock.",
    });
  }

  return issues;
};
