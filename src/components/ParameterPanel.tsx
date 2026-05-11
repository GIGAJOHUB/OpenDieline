import { Download, FileCode2, FileText, PackageCheck, RotateCcw } from "lucide-react";
import { DEFAULT_RTE_PARAMS, MAX_RTE_PARAMS, MIN_RTE_PARAMS, RTE_PRESETS } from "../constants/packaging";
import { dxfBlob } from "../exporters/dxfExporter";
import { pdfBlob } from "../exporters/pdfExporter";
import { svgBlob } from "../exporters/svgExporter";
import type { ReverseTuckEndParams } from "../types/carton";
import type { Dieline } from "../types/geometry";
import { downloadBlob } from "../utils/download";

type Props = {
  params: ReverseTuckEndParams;
  setParams: (params: ReverseTuckEndParams) => void;
  updateParam: (key: keyof ReverseTuckEndParams, value: number) => void;
  dieline: Dieline;
  issues: Array<{ severity: "warning" | "error"; message: string; field?: keyof ReverseTuckEndParams }>;
};

const fields: Array<{
  key: keyof ReverseTuckEndParams;
  label: string;
  help: string;
  step: number;
  suffix: string;
}> = [
  { key: "panelAWidth", label: "Panel A width", help: "Linked minor side panels in Glue | A | B | A | B", step: 1, suffix: "mm" },
  { key: "panelBWidth", label: "Panel B width", help: "Linked major front/back panels in Glue | A | B | A | B", step: 1, suffix: "mm" },
  { key: "height", label: "Box height", help: "Vertical body score-to-score dimension", step: 1, suffix: "mm" },
  { key: "boardThickness", label: "Board thickness", help: "Paperboard caliper used for compensation", step: 0.05, suffix: "mm" },
  { key: "glueFlapWidth", label: "Glue flap", help: "Manufacturer glue lap width", step: 0.5, suffix: "mm" },
  { key: "bleed", label: "Bleed", help: "Print bleed guide outside cutting geometry", step: 0.5, suffix: "mm" },
  { key: "safeMargin", label: "Safe margin", help: "Artwork safe zone inside panels", step: 0.5, suffix: "mm" },
  { key: "tuckFlapDepth", label: "Tuck flap", help: "Major closure flap depth including locking tongue", step: 1, suffix: "mm" },
  { key: "dustFlapDepth", label: "Dust flap", help: "Minor side flap closure depth", step: 1, suffix: "mm" },
  { key: "lockTongueDepth", label: "Lock tongue", help: "Insertion tongue depth on tuck flaps", step: 0.5, suffix: "mm" },
  { key: "tolerance", label: "Tolerance", help: "Manufacturing fit allowance", step: 0.1, suffix: "mm" },
];

const filename = (extension: string) => `opendieline-rte-carton.${extension}`;

export const ParameterPanel = ({ params, setParams, updateParam, dieline, issues }: Props) => {
  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-200 bg-white lg:w-[390px]">
      <div className="border-b border-slate-200 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-ink text-white">
            <PackageCheck size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide text-ink">OPENDIELINE</h1>
            <p className="text-xs text-steel">Parametric folding-carton CAD</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="mb-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-steel">Dimension preset</label>
          <div className="grid grid-cols-1 gap-2">
            {RTE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                className="rounded border border-slate-200 px-3 py-2 text-left hover:border-ink hover:bg-mist"
                onClick={() => setParams(preset.params)}
              >
                <span className="block text-sm font-semibold text-ink">{preset.name}</span>
                <span className="block text-xs text-steel">{preset.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {fields.map((field) => {
            const min = MIN_RTE_PARAMS[field.key];
            const max = MAX_RTE_PARAMS[field.key];
            const value = params[field.key];
            return (
              <div key={field.key} className="rounded border border-slate-200 p-3">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <label htmlFor={field.key} className="text-sm font-semibold text-ink">
                      {field.label}
                    </label>
                    <p className="text-xs leading-5 text-steel">{field.help}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded border border-slate-200 bg-mist px-2 py-1">
                    <input
                      id={field.key}
                      type="number"
                      min={min}
                      max={max}
                      step={field.step}
                      value={value}
                      onChange={(event) => updateParam(field.key, Number(event.target.value))}
                      className="w-16 bg-transparent text-right text-sm font-semibold text-ink outline-none"
                    />
                    <span className="text-xs text-steel">{field.suffix}</span>
                  </div>
                </div>
                <input
                  aria-label={field.label}
                  type="range"
                  min={min}
                  max={max}
                  step={field.step}
                  value={value}
                  onChange={(event) => updateParam(field.key, Number(event.target.value))}
                  className="w-full accent-ink"
                />
              </div>
            );
          })}
        </div>

        {issues.length > 0 && (
          <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3">
            <p className="mb-2 text-sm font-semibold text-amber-900">Manufacturing checks</p>
            <ul className="space-y-1 text-xs leading-5 text-amber-900">
              {issues.map((issue, index) => (
                <li key={`${issue.field ?? "general"}-${index}`}>{issue.message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-5">
        <div className="mb-3 grid grid-cols-3 gap-2">
          <button className="export-button" onClick={() => downloadBlob(svgBlob(dieline), filename("svg"))}>
            <FileCode2 size={16} /> SVG
          </button>
          <button className="export-button" onClick={() => downloadBlob(pdfBlob(dieline), filename("pdf"))}>
            <FileText size={16} /> PDF
          </button>
          <button className="export-button" onClick={() => downloadBlob(dxfBlob(dieline), filename("dxf"))}>
            <Download size={16} /> DXF
          </button>
        </div>
        <button className="secondary-button w-full" onClick={() => setParams(DEFAULT_RTE_PARAMS)}>
          <RotateCcw size={16} /> Reset engineering defaults
        </button>
      </div>
    </aside>
  );
};
