# Responsive Layout & Workspace Architecture

This document describes the responsive layout strategy, CSS grid architecture, and visual polish implemented in Phase 14 for the Japanese Toolbox Designer.

---

## 1. Overview & Fluid Design Philosophy

Traditional fixed-width content containers (e.g. `960px`) artificially constrain technical CAD and parametric woodworking tools on modern desktop displays.

Japanese Toolbox Designer employs a **fluid CAD workstation architecture**:

- The application shell uses nearly all available browser viewport width without imposing artificial page maximums.
- Form controls and numeric inputs are constrained to fixed/bounded rails to preserve typography and scanning readability.
- The central visualization canvas (2D technical drawings and 3D interactive model) dynamically absorbs available screen space.
- The Workshop section (Cut List and Process Plan) sits beneath the workspace columns and spans the full application width.

---

## 2. Breakpoint System

The application uses three primary responsive viewport tiers:

| Breakpoint Tier              | Viewport Width   | Layout Structure                                                                                                                         |
| :--------------------------- | :--------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| **Wide Desktop Workstation** | `>= 1500px`      | **3-Column CAD Workstation**: `[Inputs (340–400px)] [Visualizer (1fr, >600px)] [Calculated (340–430px)]` with full-width Workshop below. |
| **Normal Desktop / Laptop**  | `980px – 1499px` | **2-Column Layout**: `[Inputs (320–380px)] [Visualizer (1fr)]` with Calculated Design positioned below the visualizer.                   |
| **Tablet / Narrow Window**   | `720px – 979px`  | **Stacked Clean Flow**: Adaptive single-column flow with full visualizer access and legible form controls.                               |
| **Mobile**                   | `< 720px`        | **Single-Column Flow**: Strict DOM and visual sequence with contained scrolling and wrapped action toolbars.                             |

---

## 3. Workspace Grid Architecture

### Wide Desktop (3 Columns)

On viewports `>= 1500px`, `.editor-workspace-grid` activates CSS Grid with three distinct areas:

```css
.editor-workspace-grid {
  display: grid;
  grid-template-columns: minmax(340px, 400px) minmax(600px, 1fr) minmax(340px, 430px);
  grid-template-areas: 'inputs visualization calculated';
  gap: 1.25rem;
  align-items: start;
}
```

- **Inputs Rail (`editor-inputs-column`)**: Compact 340–400px width with 2-field rows for basic dimensions, expandable disclosures for carcass/lid parameters, and compact material selector.
- **Visualization Column (`editor-visualization-column`)**: Dominant central region occupying 45–60%+ of usable workspace width. Sticky positioning keeps the design canvas in view during parameter exploration.
- **Calculated Rail (`editor-calculated-column`)**: 340–430px column displaying authoritative internal dimensions, carcass details, and lid mechanism calculations.

### Normal Desktop / Laptop (2 Columns)

On viewports `980px – 1499px`:

```css
.editor-workspace-grid {
  display: grid;
  grid-template-columns: minmax(320px, 380px) minmax(0, 1fr);
  grid-template-areas:
    'inputs visualization'
    'inputs calculated';
  gap: 1.25rem;
  align-items: start;
}
```

### Mobile & Tablet (Single Column)

On viewports `< 980px`, the grid falls back to natural vertical flex flow:

1. Design Manager (name, status badge, action toolbars)
2. Editor context bar (active units, wood species, unit toggle)
3. Form inputs (basic dimensions, carcass & handles, lid & locking, material)
4. Visualization (2D technical drawings / 3D model)
5. Calculated design panel
6. Workshop (Cut List / Process Plan)
7. Footer

---

## 4. Visualizer Sizing & 2D/3D Stability

To prevent abrupt layout jumps when toggling between 2D Technical Drawings and the 3D Interactive Model:

- Both `.technical-drawing-viewer` and `.toolbox-3d-canvas-wrapper` share unified responsive height tokens:
  - **Wide Desktop (`>= 1500px`)**: `clamp(560px, 62vh, 760px)`
  - **Laptop (`980px – 1499px`)**: `clamp(480px, 54vh, 600px)`
  - **Tablet (`720px – 979px`)**: `440px`
  - **Mobile (`< 720px`)**: `350px`
- SVG viewports retain automatic viewBox scaling and coordinate tracking across window resize.
- 3D Canvas resizes naturally through React Three Fiber with camera aspect preservation.

---

## 5. Workshop Layout

The Workshop section spans the full width of the application shell:

- **Cut List Table**:
  - On wide desktops, columns use proportional widths (`col-part: 22%`, `col-qty: 6%`, `col-dim: 12%`, `col-notes: 36%`), giving the Notes column ample space and substantially reducing row wrapping.
  - On mobile, the table is housed inside an overflow-contained container (`.workshop-cutlist-table-container`), preventing page-level horizontal overflow.
- **Process Plan Sequence**:
  - On large desktop screens (`>= 1200px`), process steps are displayed in an accessible 2-column CSS Grid (`repeat(2, minmax(0, 1fr))`).
  - On narrower viewports, steps stack in a single column.
  - DOM order remains sequential (`Step 1`, `Step 2`, `Step 3`...) for screen-reader and keyboard navigation consistency.

---

## 6. Design Management & Context Compaction

- **Design Manager**:
  - On wide viewports (`>= 1280px`), header title, status badge, saved design selector, and action buttons are arranged compactly along horizontal regions.
  - Action buttons are logically grouped into Lifecycle (`New`, `Save`, `Rename`, `Duplicate`), Danger (`Delete`), and Interchange (`Export JSON`, `Export PDF`, `Import JSON`).
- **Editor Top Bar**:
  - Eliminates redundant duplication of the design name.
  - Displays active unit system, selected wood species, unit selector radio toggle, and precision hint compactly.

---

## 7. Accessibility & Visual Polish

- **Focus States**: High-contrast `:focus-visible` outlines applied across all interactive elements (buttons, inputs, selects, tabs, disclosures).
- **Semantic Hierarchy**: Logical heading structure (`h1` for application title, `h2` for primary workspace cards, `h3` for calculation/workshop groups, `h4` for sub-sections).
- **Horizontal Overflow Guard**: `min-width: 0;` applied across all grid and flex items to eliminate page-level horizontal scroll across all device widths.
