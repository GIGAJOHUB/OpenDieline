import type { CartonTopology } from "../topology/cartonTopology";

export type FoldValidationIssue = {
  severity: "warning" | "error";
  message: string;
};

export const validateFoldTopology = (topology: CartonTopology): FoldValidationIssue[] => {
  const issues: FoldValidationIssue[] = [];
  const faceIds = new Set(topology.faces.map((face) => face.id));
  const foldChildren = new Set(topology.folds.map((fold) => fold.childFaceId));

  for (const fold of topology.folds) {
    if (!faceIds.has(fold.parentFaceId) || !faceIds.has(fold.childFaceId)) {
      issues.push({
        severity: "error",
        message: `Fold ${fold.label} references a missing face.`,
      });
    }

    if (Math.abs(fold.targetAngle) > Math.PI) {
      issues.push({
        severity: "error",
        message: `Fold ${fold.label} exceeds a physically useful 180 degree target.`,
      });
    }
  }

  for (const face of topology.faces) {
    if (face.id !== topology.rootFaceId && face.id !== topology.glueFaceId && !foldChildren.has(face.id)) {
      issues.push({
        severity: "error",
        message: `${face.label} is not connected into the fold hierarchy.`,
      });
    }
  }

  if (topology.panelAWidth <= 0 || topology.panelBWidth <= 0 || topology.height <= 0) {
    issues.push({
      severity: "error",
      message: "Panel dimensions must be positive for a foldable carton.",
    });
  }

  if (Math.abs(topology.panelAWidth - topology.panelBWidth) / Math.max(topology.panelAWidth, topology.panelBWidth) > 0.85) {
    issues.push({
      severity: "warning",
      message: "A/B panel ratio is extreme; closure flaps may collide or look unstable.",
    });
  }

  return issues;
};
