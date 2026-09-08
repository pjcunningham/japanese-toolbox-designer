# Japanese Toolbox Designer

Parametric Japanese toolbox design in your browser.

Japanese Toolbox Designer is a browser-only web application for woodworkers to design, visualize, and plan the construction of traditional Japanese toolboxes (_bako_) featuring sliding lids, captured wedge-locking battens, inset housed end walls, and integrated grab handles.

**Live Application:** [https://pjcunningham.github.io/japanese-toolbox-designer/](https://pjcunningham.github.io/japanese-toolbox-designer/)  
**Source Repository:** [https://github.com/pjcunningham/japanese-toolbox-designer](https://github.com/pjcunningham/japanese-toolbox-designer)

---

## Features

- **Authoritative Parametric Geometry:** Single authoritative domain calculation engine drives all dimensions, physical validations, 2D drawings, 3D meshes, cut lists, process plans, and PDF export without duplicated formulas.
- **Traditional Inset-End Construction:** Inset housed end walls seated in shallow side-board dados ($G = 3\text{ mm}$), integral end grab handles, independent bottom board, sliding lid panel, fixed end caps, and captured tapered locking wedge.
- **Kinematic Sliding Lid & Locking Wedge:** Rigid non-flexing lid sliding mechanics with deterministic release travel, locking batten clearance, $2^\circ$ plan taper, and $10^\circ$ vertical retention bevel.
- **Metric & Imperial Woodworking Units:** Full floating-point canonical millimetre precision internally; seamless display formatting between whole millimetres and fractional woodworking inches ($1/16\text{ in}$ resolution).
- **Interactive 2D Technical Drawings:** Clean orthographic Plan, Front, and End SVG drawings with dimension lines, annotation callouts, pointer-centered zoom, pan, and fit-to-view.
- **Interactive 3D Model:** WebGL Three.js interactive model with 13 distinct semantic woodworking parts, compound dadoed side boards, wood species materials, standard camera projections, and orbit/zoom/pan controls.
- **Bundled Wood Species Catalogue:** 9 built-in species definitions (Hinoki, Japanese Cedar, Pine, Douglas Fir, Paulownia, Ash, Oak, Beech, Custom) with zero external network downloads.
- **Workshop Cut List:** Accurate nominal stock blank bill of materials (8 line items, 12 blanks, 13 finished physical parts, 1 combined locking set blank).
- **23-Step Construction Process Plan:** Step-by-step joinery sequence from stock preparation, dado cutting, and carcass assembly to compound wedge machining, lid verification, and final tuning.
- **Browser-Generated Workshop PDF:** Multi-page A4 PDF export generated entirely in the browser using `pdf-lib` featuring summary specifications, vector technical drawings, cut list table, and paginated process plan.
- **Local Persistence & JSON Interchange:** Browser `localStorage` multi-design management (New, Save, Open, Rename, Duplicate, Delete) and portable single-file JSON backup/sharing with legacy Schema V1 automatic migration.
- **Fluid CAD Workstation Shell:** Responsive layout adapting across ultra-wide desktop displays (1920px, 2560px+), 2-column laptop layouts, tablets, and single-column mobile viewports without page-level horizontal overflow.

---

## Technology Stack

- **Framework & UI:** React 19, TypeScript
- **3D Visualization:** Three.js, React Three Fiber, `@react-three/drei`
- **PDF Generation:** `pdf-lib` (client-side, vector drawings, standard fonts)
- **Validation & Schema:** Zod
- **Build Tool:** Vite
- **Package Manager:** pnpm
- **Unit & Component Testing:** Vitest, React Testing Library, `@testing-library/jest-dom`
- **End-to-End Testing:** Playwright (Chromium, Firefox, WebKit)
- **Linting & Formatting:** ESLint (flat config), Prettier
- **Deployment:** GitHub Pages (static client-only build)

---

## Prerequisites

- **Node.js:** `>=20.0.0` (Node.js 20 LTS or 22 LTS recommended)
- **pnpm:** `>=10.0.0` (configured via `packageManager` in `package.json`)

---

## Getting Started

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/pjcunningham/japanese-toolbox-designer.git
cd japanese-toolbox-designer
pnpm install --frozen-lockfile
```

### 2. Start Development Server

```bash
pnpm dev
```

Open `http://localhost:5173/` in your browser.

---

## Available Scripts

### Development & Production

- `pnpm dev`: Start the local Vite development server.
- `pnpm build`: Typecheck with `tsc -b` and compile static production assets into `dist/`.
- `pnpm preview`: Start a local HTTP server to preview the production build.

### Code Quality & Verification

- `pnpm typecheck`: Run strict TypeScript checks without emitting output.
- `pnpm lint`: Run ESLint checks across all project files.
- `pnpm format`: Format source files using Prettier.
- `pnpm format:check`: Verify all files adhere to Prettier formatting rules.
- `pnpm check`: Run all verification steps in sequence (`format:check`, `lint`, `typecheck`, `test:run`).

### Automated Testing

- `pnpm test`: Run Vitest in interactive watch mode.
- `pnpm test:run`: Run Vitest unit/component suite once and exit.
- `pnpm test:e2e`: Run Playwright end-to-end browser test suite.

---

## Architecture & Design Principles

### 1. Browser-Only, Zero API Dependencies

The application executes entirely client-side. Once the static bundle is loaded, normal design operations, calculations, persistence, rendering, and export require no backend server, database, or external network requests.

### 2. Single Authoritative Geometry Engine

There is exactly one authoritative implementation of toolbox geometry (`src/domain/geometry.ts`). Validation rules, calculated dimensions, 2D technical drawings, 3D meshes, cut lists, construction plans, and PDF exports all consume `CalculatedToolboxGeometry`.

### 3. Canonical Precision & Units

Dimensions are stored internally as finite positive numbers in millimetres (`1 in = 25.4 mm` exact). Switching between Metric and Imperial changes display representation only and never mutates canonical design state or introduces rounding errors.

### 4. Code Splitting & Lazy Loading

Heavy modules (Three.js 3D viewer and `pdf-lib` document export) are loaded dynamically on demand via `React.lazy()` and dynamic `import()`, keeping the initial application bundle lightweight (~392 kB minified).

---

## Carcass & Mechanism Geometry (V2 Inset-End Construction)

### Coordinate System

- **$X$ Axis (Length):** Parallel to sliding lid motion ($0 = \text{Stop End}$, $X = \text{Locking End}$).
- **$Y$ Axis (Width):** Across long side boards ($0 = \text{Front / narrow wedge}$, $Y = \text{Back / wide wedge}$).
- **$Z$ Axis (Height):** Vertical ($0 = \text{Bottom board underside}$, $Z = \text{Body height}$, $Z + T = \text{Total height with top battens}$).

### Core Relationships

- **Internal Cavity:**
  $$\text{internalLength} = X - 2(I + T)$$
  $$\text{internalWidth} = Y - 2T$$
  $$\text{internalHeight} = Z - T_b$$
- **Housed End Walls:**
  $$\text{endWallLength} = Y - 2T + 2G$$
- **Lid Pocket Depth:**
  $$\text{pocketDepth} = R - I - T$$
- **Kinematic Release Condition:**
  $$2O < \text{pocketDepth}$$
  $$\text{availableLidTravel} = \text{pocketDepth} - O$$
  $$\text{releaseTravelMargin} = \text{availableLidTravel} - O > 0$$
- **Captured Wedge Profile:**
  $$W_{\min} = \text{availableLidTravel} + Q$$
  $$\text{bottomNarrowWidth} = W_{\min}$$
  $$\text{bottomWideWidth} = W_{\min} + L \tan(\alpha)$$
  $$\text{topWidth} = \text{bottomWidth} - 2 T \tan(\beta)$$

---

## V1 Limitations

- **Single Construction Style:** V1 specifically models the traditional Japanese toolbox with inset housed end walls, grab handles, and sliding wedge lid. Alternative carcass joints (e.g. through dovetails, finger joints, flush ends) are not supported.
- **Local Browser Storage:** Saved designs reside in the browser's `localStorage`. Clearing browser site data removes locally saved designs.
- **Portable Interchange:** JSON export/import serves as the primary backup and sharing mechanism.
- **No CAD/Nesting Tools:** No arbitrary freehand CAD sketching, automatic nesting, stock optimization, or weight/cost calculation.
- **Static Rendered Materials:** 3D wood materials use approximate tone and roughness without photographic texture maps or procedural grain shaders.
- **Static Output:** Technical drawings and 3D models depict the design in its locked assembled configuration; interactive lid sliding animation is not included in V1.

---

## Future Roadmap (V2 Candidates)

- Photographic and procedural wood grain shaders.
- Alternative joinery styles and modular internal tool trays.
- Interactive lid slide and wedge removal animations.
- Exploded assembly view.
- Stock cutting layout optimization and kerf planning.
- Weight and board-foot lumber cost calculation.
- Vector DXF and 3D STL/OBJ/GLTF export.
- Shareable URL design encoding.
- Progressive Web App (PWA) offline installation manifests.

---

## License

MIT License. See `LICENSE` for details.
