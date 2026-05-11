# OPENDIELINE

OPENDIELINE is a browser-based parametric dieline generator for folding-carton packaging. The first implemented template is a standard reverse tuck end carton suitable for toothpaste, cosmetics, pharmaceutical, supplement, and retail tuck-end carton workflows.

The application is built as a lightweight CAD tool: all carton geometry is calculated in real millimeter units, rendered as precise SVG vectors, and exported through the same internal dieline model.

## Features

- Parametric reverse tuck end carton generator
- Customizable Panel A width, Panel B width, height, board thickness, glue flap, bleed, safe margin, tuck flap, dust flap, lock tongue, and manufacturing tolerance
- Real packaging conventions: 3 mm bleed default, 2-6 mm safe zones, 10-15 mm glue flap guidance, score-line semantics, and caliper/tolerance compensation
- Zoomable and pannable SVG CAD viewport
- Three.js fold preview with hinge-based fold interpolation
- Configurable top and bottom closure modes: tuck or glue
- Keyboard history: `Ctrl+Z` undo and `Ctrl+Shift+Z` redo
- Dimension labels and manufacturing validation warnings
- Export to SVG, PDF, and DXF
- Clean TypeScript architecture separating geometry, rendering, templates, exporters, and UI

## Engineering Model

All geometry is generated in millimeters. The RTE template interprets box dimensions as crease-to-crease values, then applies board-thickness and tolerance compensation to wrapped panels so the erected carton remains manufacturable.

Line semantics are preserved across renderers and exporters:

- Red solid lines: cut/knife paths
- Blue dashed lines: fold/score lines
- Green lines: bleed guides
- Yellow dotted lines: safe artwork zones

## Project Structure

```text
src/
  components/       UI controls and status display
  constants/        Packaging defaults, presets, and line styles
  exporters/        SVG, PDF, and DXF vector export pipeline
  geometry/         CAD primitives, topology, panels, flaps, folds, bounds, and constraints
  hooks/            Dieline state and generation hooks
  renderers/        SVG viewport renderer
  templates/        Parametric carton templates
  types/            Strongly typed geometry and carton models
  utils/            Browser download helpers
```

## Run Locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Current Template

### Standard Reverse Tuck End Carton

The implemented carton includes:

- Glue | A | B | A | B panel topology
- Correct RTE assignment: Panel B top tuck, Panel D bottom tuck
- Front panel
- Back panel
- Two side panels
- Glue flap
- Top reverse tuck flap
- Bottom reverse tuck flap
- Dust flaps
- Fold/score lines
- Cut lines
- Bleed guides
- Safe zones

The layout follows an ECMA-style reverse tuck structure with top and bottom tuck closures placed on opposite major panels.

The 3D fold preview derives from the same topology used for SVG/PDF/DXF output. Body panels, glue flap, dust flaps, and tuck flaps each have explicit parent-child fold relationships and hinge axes.

Closure modes are independently configurable per end. Tuck mode generates a main closure panel plus a hinged lock tongue. Glue mode generates a straight-cut sealing panel with no tongue score while preserving dust flaps.

## Roadmap

The architecture is prepared for future templates and manufacturing features:

- Additional ECMA and FEFCO carton styles
- Auto-bottom and crash-lock cartons
- Hang tabs and display cartons
- Perforations, emboss/deboss guides, and varnish layers
- True polygon-offset bleed engine
- 3D fold preview
- Sheet nesting and print layout optimization
- ArtiosCAD-style CAD workflow improvements
