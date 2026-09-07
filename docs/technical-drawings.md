# 2D Technical Drawings Architecture & Projections (Phase 9)

## 1. Overview

The 2D Technical Drawing subsystem provides interactive, browser-only orthographic SVG technical drawings for the Japanese toolbox design.

All drawings are generated deterministically and directly from the authoritative domain geometry engine (`calculateToolboxGeometry()`). The drawing layer never recalculates woodworking formulas or reinvents construction rules.

## 2. Orthographic Views & Coordinate Conventions

The renderer-neutral drawing model uses standard engineering coordinates:

- **Horizontal axis:** increases to the **right**.
- **Vertical axis:** increases **upward**.
- Inversion from engineering coordinates to screen/SVG coordinate space (where SVG Y increases downward) is isolated strictly to the SVG rendering boundary (`SvgTechnicalDrawing` and `useSvgViewport`).

### View Meanings

1. **Plan View (`'plan'`) — Default Active View**
   - **Direction:** Looking downward along the **Z** axis.
   - **Horizontal axis ($X$):** Toolbox length ($0 = \text{Stop end}$, $X = \text{Locking end}$).
   - **Vertical axis ($Y$):** Toolbox width ($0 = \text{Narrow wedge face / front}$, $Y = \text{Wide wedge face / back}$).
   - **Rationale for Default:** Plan view provides the most mechanically comprehensive view of the toolbox assembly, clearly showing the carcass footprint, both fixed top battens, locked lid panel, straight lid batten, tapered locking batten, and mating locking wedge.

2. **Front Elevation (`'front'`)**
   - **Direction:** Looking across the **Y** axis (long-side elevation).
   - **Horizontal axis ($X$):** Toolbox length ($0 = \text{Stop end}$, $X = \text{Locking end}$).
   - **Vertical axis ($Z$):** Carcass height ($0 = \text{Bottom board underside}$, $Z = \text{Body height}$, $Z + T = \text{Total height with top battens}$).
   - **Captured Wedge Profile:** Shows the front-most profile at the narrow end ($Y = 2\text{ mm}$), visually demonstrating that the wedge bottom width is wider than the top width and captured by complementary undercut bevels ($\beta$).

3. **End Elevation (`'end'`)**
   - **Direction:** Looking along the **X** axis.
   - **Horizontal axis ($Y$):** Toolbox width ($0 \dots Y$).
   - **Vertical axis ($Z$):** Vertical height ($0 \dots Z + T$).
   - **Lid Fit:** Shows side wall thicknesses ($T$), facing end board, lid panel lateral position, side clearance ($C$), and top batten width.

---

## 3. Renderer-Neutral Architecture

The drawing system is strictly decoupled into three layers:

```text
CalculatedToolboxGeometry (Authoritative Domain Engine)
              │
              ▼
    TechnicalDrawingModel (Renderer-Neutral Pure Projection)
              │
       ┌──────┴──────┐
       ▼             ▼
  SVG Viewer     Future Browser PDF (Phase 13)
```

### Advantages:

1. **Separation of Concerns:** Projection mathematics (offsets, dimensions, annotations, and hidden lines) is separated from woodworking geometry.
2. **Reusability:** Phase 13 PDF generation will directly consume `createPlanDrawing()`, `createFrontDrawing()`, and `createEndDrawing()` without depending on React DOM or SVG markup.
3. **Unit Independence:** The underlying physical coordinates in `TechnicalDrawingModel` remain identical in canonical millimetres. Unit conversions (metric whole millimetres or imperial woodworking fractions) apply purely to dimension label formatting at render time via `formatDimension()`.

---

## 4. Visual & Line Conventions

The technical drawings adhere to standard engineering drawing standards with monochrome clarity:

- **Visible Edges (`kind: 'visible'`):** Solid outline strokes (`1.5px`).
- **Hidden Edges (`kind: 'hidden'`, `is-hidden-edge`):** Dashed strokes (`4 3`), showing obscured lid panel boundaries beneath walls and fixed top battens.
- **Construction / Joint Lines (`kind: 'construction'`):** Fine dashed lines (`2 2`).
- **Dimensions (`DrawingDimension`):** Thin extension lines, dimension lines with directional arrowheads, and centered numeric dimension values formatted to current display units.
- **Non-Scaling Strokes:** SVG elements specify `vector-effect="non-scaling-stroke"` so line weights remain crisp and constant across all zoom levels.

---

## 5. Viewport, Zoom, and Pan Implementation

- **ViewBox Model:** The SVG `viewBox` maps directly to engineering coordinates with bounding margins that accommodate dimensions and annotations.
- **Fit to View:** Computes the initial bounding box with margins `[minX, minY, maxX, maxY]` and resets zoom/pan whenever views switch or valid design dimensions update.
- **Pointer-Centred Wheel Zoom:** Calculates the mouse cursor's focal point in SVG drawing coordinates and zooms inward/outward smoothly without causing browser page scrolling (`touch-action: none`, active wheel listener with `preventDefault()`).
- **Pointer Drag Panning:** Uses standard Pointer Events with `setPointerCapture` and `releasePointerCapture`, adjusting viewBox origin coordinates with grab/grabbing visual feedback.
- **Safety Limits:** Prevents zero, negative, or runaway zoom levels ($0.5\times \dots 20\times$ fit scale).

---

## 6. Accessibility

- **SVG Semantics:** Drawings use `role="img"` with accessible `<title>` and `<desc>` elements associated via `aria-labelledby`.
- **Keyboard Navigation:** View tabs use `role="tablist"` and `role="tab"` with `aria-selected` attributes.
- **Unavailable State Messaging:** When draft input errors or invalid physical geometry exist, informative warning panels replace the drawing rather than rendering stale or broken SVG content.
