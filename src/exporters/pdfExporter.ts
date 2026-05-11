import { boundsForDieline } from "../geometry/primitives/bounds";
import type { Dieline, Line } from "../types/geometry";

const MM_TO_PT = 72 / 25.4;

const rgb = (line: Line): string => {
  switch (line.type) {
    case "fold":
      return "0.114 0.396 0.847 RG";
    case "bleed":
      return "0.078 0.569 0.357 RG";
    case "safe":
      return "0.604 0.482 0.071 RG";
    case "perforation":
      return "0.482 0.247 0.710 RG";
    case "cut":
    default:
      return "0.851 0.137 0.137 RG";
  }
};

const dash = (line: Line): string => {
  if (line.type === "fold") return "[14 11] 0 d";
  if (line.type === "safe" || line.type === "perforation") return "[4 8] 0 d";
  return "[] 0 d";
};

const pdfLine = (line: Line, minX: number, maxY: number): string => {
  const x1 = (line.start.x - minX) * MM_TO_PT;
  const y1 = (maxY - line.start.y) * MM_TO_PT;
  const x2 = (line.end.x - minX) * MM_TO_PT;
  const y2 = (maxY - line.end.y) * MM_TO_PT;
  return `${rgb(line)}
${dash(line)}
1 w
${x1.toFixed(3)} ${y1.toFixed(3)} m
${x2.toFixed(3)} ${y2.toFixed(3)} l
S`;
};

const makePdf = (content: string, widthPt: number, heightPt: number): string => {
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${widthPt.toFixed(
      3,
    )} ${heightPt.toFixed(3)}] /Contents 4 0 R >>\nendobj`,
    `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
};

export const exportDielineToPdf = (dieline: Dieline): string => {
  const bounds = boundsForDieline(dieline, 10);
  const lines = [
    ...dieline.bleeds,
    ...dieline.safeZones,
    ...dieline.folds,
    ...dieline.cuts,
    ...dieline.perforations,
  ];
  const content = lines.map((line) => pdfLine(line, bounds.minX, bounds.maxY)).join("\n");
  return makePdf(content, bounds.width * MM_TO_PT, bounds.height * MM_TO_PT);
};

export const pdfBlob = (dieline: Dieline): Blob =>
  new Blob([exportDielineToPdf(dieline)], { type: "application/pdf" });
