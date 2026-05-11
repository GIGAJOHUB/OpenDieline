import type { Dieline } from "../types/geometry";

type Props = {
  dieline: Dieline;
};

export const StatusBar = ({ dieline }: Props) => (
  <footer className="grid gap-2 border-t border-slate-200 bg-white px-4 py-3 text-xs text-steel md:grid-cols-4">
    <span>
      <strong className="text-ink">{dieline.cuts.length}</strong> cut segments
    </span>
    <span>
      <strong className="text-ink">{dieline.folds.length}</strong> score lines
    </span>
    <span>
      <strong className="text-ink">{dieline.bleeds.length}</strong> bleed guides
    </span>
    <span>Units: real millimeters</span>
  </footer>
);
