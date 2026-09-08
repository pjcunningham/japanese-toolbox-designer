# Workshop PDF Export Architecture (Phase 13)

## Overview

The Japanese Toolbox Designer provides offline, browser-local PDF export generating a comprehensive workshop document for construction of the traditional Japanese toolbox.

All document generation is performed client-side using `pdf-lib` with standard built-in PDF fonts (Helvetica, Helvetica-Bold, Helvetica-Oblique). No backend server, external API, web service, or font/image download is required or utilized.

---

## Authoritative Model Pipeline

PDF export strictly adheres to the core architecture rule:

> There is exactly one authoritative implementation of toolbox geometry.

```text
ToolboxDesign
      │
      ▼
CalculatedToolboxGeometry
      │
      ├── TechnicalDrawingModel (Front, Plan, End)
      ├── CutList
      └── ProcessPlan
               │
               ▼
        WorkshopPdfData (Pure Aggregator)
               │
               ▼
         Workshop PDF
```

The PDF generator receives `WorkshopPdfData` produced by `createWorkshopPdfData(design, geometry)`. It does not recalculate woodworking mathematics or duplicate formulas.

---

## Document Structure & Layout

The workshop PDF uses standard A4 paper size with 36 pt (0.5 inch / ~12.7 mm) print margins and dynamic orientation per page:

### 1. Page 1: Design Summary (Portrait A4)

- **Header & Identity**: Title, Design Name, Wood Species (with fallback support for unlisted species), Overall Dimensions ($L \times W \times H$), Active Unit System, and Injected Generation Date.
- **Carcass Specification Card**: Main stock thickness, bottom thickness, end-wall inset/handle depth, handle height, housing dado depth, end-cap width, pocket depth, and internal cavity dimensions.
- **Lid Construction & Kinematics Card**: Lid thickness, panel size, side clearance per side, stop-end locked overlap, locking-end locked overlap, total locked overlap, available lid travel, and release travel margin.
- **Locking Mechanism Specification Card**: Plan taper angle ($\alpha$), retaining bevel angle ($\beta$), locking travel clearance, wedge narrow width, wedge wide width, working taper length, and recommended wedge blank length, accompanied by the note:
  > The locking wedge is tapered in plan and bevelled vertically so the profile is captured rather than relying on gravity.
- **Nominal Dimensions Workshop Note**: Advises that displayed numbers reflect the selected display resolution and that the locking wedge should be final-fitted to the assembled box.

### 2. Pages 2–4: Technical Drawings (Landscape A4)

- **Page 2**: Plan View — principal mechanical drawing showing inset end walls, handle bays, end caps, straight batten, tapered locking lid batten, wedge orientation, housing dados, overlap/pocket dimensions, and movement directions.
- **Page 3**: Front Elevation — long side board, bottom board, top battens, hidden inset end walls, grab handle boundaries, and captured wedge section.
- **Page 4**: End Elevation — side walls, bottom board, grab handle, recessed end-wall relationship, lid, end cap, and handle height.

### 3. Page 5: Cut List (Landscape A4)

- **Header & Summary**: Design name, wood species, active unit system, and line item / stock blank / finished part counts directly from `cutList.summary`.
- **Structured Table**: Columns for Part Name, Quantity, Length, Width, Thickness, and Notes.
- **Deterministic Row Height**: Row heights expand dynamically based on wrapped text measurements so no notes or part names are clipped or overlapping.
- **Combined Blank Details**: Explicitly shows starting blanks (such as the combined locking batten + wedge blank) with notes explaining yielding parts and fitting allowances.

### 4. Pages 6+: Construction Process Plan (Portrait A4)

- **Deterministic Sequence**: All 23 construction steps rendered in sequential order.
- **Hierarchy**: Bold step headers, bulleted instructions, structured measurements formatted by kind (linear, angle, text, boolean), and notes.
- **Print-Safe Pagination**: Height budgeting ensures step headers remain paired with instructions and no content is drawn below the printable margin.

---

## Vector Technical Drawing Rendering

Technical drawings are rendered directly into native PDF vector graphics (lines, rectangles, polygons, extension lines, dimension lines, and arrowheads). Drawings are **never** rasterized into PNG/JPEG screenshots, ensuring:

1. Razor-sharp vector print output at any zoom or physical print resolution.
2. Lightweight PDF file sizes (~15–20 kB total for an 8-page document).
3. Exact preservation of engineering coordinate conventions ($Y$ increases upward, matching PDF coordinate space).
4. **Vertical Dimension Layout (`axis === 'y'`)**: Rendered vertically along the vertical dimension line with +90 degrees rotation (`rotate: degrees(90)` in PDF coordinates), reading bottom-to-top, centered along the dimension span.
5. **Annotation & Secondary Text Parity**: Multi-line annotations with `secondaryText` (such as captured wedge bevel details) and multi-row annotation spacing prevent text collisions.

Aspect-ratio preserving scale and translation are computed by `fitDrawingBoundsToRect(bounds, targetRect)`.

---

## PDF-Safe Standard-Font Typography

Built-in standard PDF fonts use the WinAnsi encoding repertoire. The `toPdfSafeText(text)` helper sanitizes characters prior to PDF embedding:

- Greek letters: $\alpha \to \text{alpha}$, $\beta \to \text{beta}$.
- Unicode math operators: $\times \to \text{x}$, $\div \to \text{/}$, $\ge \to \text{>=}$, $\le \to \text{<=}$, $\pm \to \text{+/-}$.
- Arrows: $\to \to \text{->}$, $\leftarrow \to \text{<-}$, $\uparrow \to \text{^}$, $\downarrow \to \text{v}$.
- Degrees: $2^\circ \to 2\text{ deg}$, $10^\circ \to 10\text{ deg}$.
- Typography: Smart quotes converted to ASCII quotes, en/em dashes converted to hyphens.

---

## Working Design Export & State Semantics

- **Export of Working Draft**: PDF export always uses the **current valid working design** in memory, including unsaved modifications.
- **No Side-Effect Saving**: Generating or downloading a PDF does **not** persist the design to `localStorage` or alter dirty/persistence state.
- **Validation Gating**: PDF export is disabled when editor inputs contain parse errors or when physical geometry constraints fail.
- **Code Splitting**: The PDF generation module and `pdf-lib` are dynamically loaded (`import('../pdf')`) only when export is requested, keeping the initial application bundle lean.
