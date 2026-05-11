import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Maximize2, Minus, Plus } from "lucide-react";
import { LINE_STYLES } from "../../constants/packaging";
import { boundsForDieline } from "../../geometry/primitives/bounds";
import type { Dieline, Line, Point, Polygon } from "../../types/geometry";

type Props = {
  dieline: Dieline;
  onToggle3d: () => void;
  is3dOpen: boolean;
};

type ViewBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const renderPolygonPoints = (polygon: Polygon): string =>
  polygon.points.map((point) => `${point.x},${point.y}`).join(" ");

const lineProps = (line: Line) => {
  const style = LINE_STYLES[line.type as keyof typeof LINE_STYLES] ?? LINE_STYLES.cut;
  return {
    stroke: style.stroke,
    strokeDasharray:
      line.type === "fold" ? "5 4" : line.type === "safe" || line.type === "perforation" ? "1.3 3" : undefined,
  };
};

const Dimension = ({ start, end, text }: { start: Point; end: Point; text: string }) => {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const isVertical = Math.abs(start.x - end.x) < Math.abs(start.y - end.y);

  return (
    <g className="pointer-events-none">
      <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="stroke-ink/60" strokeWidth={0.25} />
      <circle cx={start.x} cy={start.y} r={1.2} className="fill-ink/60" />
      <circle cx={end.x} cy={end.y} r={1.2} className="fill-ink/60" />
      <text
        x={midX}
        y={midY - 2}
        transform={isVertical ? `rotate(-90 ${midX} ${midY})` : undefined}
        textAnchor="middle"
        className="fill-ink text-[4px] font-semibold"
      >
        {text}
      </text>
    </g>
  );
};

export const DielineCanvas = ({ dieline, onToggle3d, is3dOpen }: Props) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const natural = useMemo(() => boundsForDieline(dieline, 18), [dieline]);
  const naturalViewBox = useMemo(
    () => ({ x: natural.minX, y: natural.minY, width: natural.width, height: natural.height }),
    [natural],
  );
  const [viewBox, setViewBox] = useState<ViewBox>(naturalViewBox);
  const [dragStart, setDragStart] = useState<{ clientX: number; clientY: number; viewBox: ViewBox } | null>(null);

  useEffect(() => setViewBox(naturalViewBox), [naturalViewBox]);

  const zoom = (factor: number) => {
    setViewBox((current) => {
      const centerX = current.x + current.width / 2;
      const centerY = current.y + current.height / 2;
      const width = current.width * factor;
      const height = current.height * factor;
      return { x: centerX - width / 2, y: centerY - height / 2, width, height };
    });
  };

  const handleWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    zoom(event.deltaY > 0 ? 1.08 : 0.92);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragStart || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const dx = ((event.clientX - dragStart.clientX) / rect.width) * dragStart.viewBox.width;
    const dy = ((event.clientY - dragStart.clientY) / rect.height) * dragStart.viewBox.height;
    setViewBox({
      ...dragStart.viewBox,
      x: dragStart.viewBox.x - dx,
      y: dragStart.viewBox.y - dy,
    });
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#eef3f5]">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-ink">RTE toothpaste carton dieline</p>
          <p className="text-xs text-steel">Millimeter model • vector SVG viewport • pan and zoom</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="tool-button" onClick={() => zoom(0.85)} title="Zoom in" aria-label="Zoom in">
            <Plus size={16} />
          </button>
          <button className="tool-button" onClick={() => zoom(1.15)} title="Zoom out" aria-label="Zoom out">
            <Minus size={16} />
          </button>
          <button className="tool-button" onClick={() => setViewBox(naturalViewBox)} title="Fit to view" aria-label="Fit to view">
            <Maximize2 size={16} />
          </button>
          <button className="tool-button" onClick={onToggle3d} title="Toggle 3D preview" aria-label="Toggle 3D preview">
            <Box size={16} className={is3dOpen ? "text-fold" : undefined} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 p-4">
        <svg
          ref={svgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          className="h-full w-full cursor-grab rounded border border-slate-200 bg-white active:cursor-grabbing"
          onWheel={handleWheel}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragStart({ clientX: event.clientX, clientY: event.clientY, viewBox });
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={() => setDragStart(null)}
          onPointerCancel={() => setDragStart(null)}
        >
          <defs>
            <pattern id="mm-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#d7e0e5" strokeWidth="0.18" />
            </pattern>
          </defs>
          <rect x={viewBox.x} y={viewBox.y} width={viewBox.width} height={viewBox.height} fill="url(#mm-grid)" />

          <g id="panels" opacity={0.95}>
            {dieline.panels.map((panel) => (
              <polygon key={panel.id} points={renderPolygonPoints(panel)} fill="#f8fafb" stroke="#c8d3d9" strokeWidth={0.25} />
            ))}
          </g>

          <g id="glue-areas">
            {dieline.glueAreas.map((area) => (
              <polygon key={area.id} points={renderPolygonPoints(area)} fill="#ffc85733" stroke="#d29d21" strokeWidth={0.25} />
            ))}
          </g>

          <g id="bleed-lines">
            {dieline.bleeds.map((line) => (
              <line key={line.id} x1={line.start.x} y1={line.start.y} x2={line.end.x} y2={line.end.y} strokeWidth={0.3} {...lineProps(line)} />
            ))}
          </g>
          <g id="safe-zones">
            {dieline.safeZones.map((line) => (
              <line key={line.id} x1={line.start.x} y1={line.start.y} x2={line.end.x} y2={line.end.y} strokeWidth={0.28} {...lineProps(line)} />
            ))}
          </g>
          <g id="fold-lines">
            {dieline.folds.map((line) => (
              <line key={line.id} x1={line.start.x} y1={line.start.y} x2={line.end.x} y2={line.end.y} strokeWidth={0.48} {...lineProps(line)} />
            ))}
          </g>
          <g id="cut-lines">
            {dieline.cuts.map((line) => (
              <line key={line.id} x1={line.start.x} y1={line.start.y} x2={line.end.x} y2={line.end.y} strokeWidth={0.55} {...lineProps(line)} />
            ))}
          </g>
          <g id="dimension-labels">
            {dieline.dimensions.map((dimension) => (
              <Dimension key={dimension.id} start={dimension.start} end={dimension.end} text={dimension.text} />
            ))}
          </g>
        </svg>
      </div>
    </section>
  );
};
