# Japanese Toolbox Designer

Parametric Japanese toolbox design in your browser.

Japanese Toolbox Designer is a browser-only web application designed for woodworkers to simplify the design and layout of traditional Japanese toolboxes with sliding lids and wedge-locking battens.

## Current Status

**Phase 8 Complete — JSON Import/Export**

The application provides portable JSON interchange for individual Japanese Toolbox designs alongside browser persistence and parametric editing:

- **Export JSON:** Export the current working design to a human-readable `.json` file formatted with 2-space indentation and a filesystem-safe filename slug derived from the design name. Export is disabled when input draft errors or invalid physical geometry exist.
- **Import JSON:** Import a previously exported `.json` design file entirely in the browser using modern local File APIs (no network requests, APIs, servers, or external services).
- **One Design Per File:** Each JSON file represents exactly one canonical `ToolboxDesign` containing physical design inputs, unit system preference, wood ID, and timestamps.
- **Inputs Only (No Derived Geometry):** Exported JSON files never store calculated geometry or derived metrics (such as internal dimensions, lid panel length, or wedge widths). Geometry is always computed deterministically upon import.
- **Safe Validation & Structured Errors:** Files are defended against malformed JSON, oversized payloads (> 1 MiB), unsupported schema versions, schema violations, and physical geometry violations before any action is taken.
- **Safe Import Semantics:** Imported designs become the active working design marked as `Not saved`. They are not automatically written to browser `localStorage` until you explicitly click `Save`.
- **Identity & Conflict Resolution:** If an imported design's ID matches an existing saved or working design ID, a fresh unique ID and new timestamps are automatically assigned to prevent silent overwriting of existing designs.
- **Unsaved Changes Guard:** Importing checks the unsaved-change guard after validation passes, preventing accidental loss of current editor work.
- **Local & Private:** All import, export, and editing operations happen strictly within the client browser. No file contents or design data are ever transmitted over the network.

_Note: 2D technical drawings in SVG (Phase 9), 3D interactive viewer (Phase 10), materials (Phase 11), cut list generation (Phase 12), and PDF workshop documentation (Phase 13) are scheduled for subsequent phases._

For the full specification and architectural roadmap, see the [Product Requirements Document](.junie/plans/prd-v1.md), the [Sliding Lid Geometry Documentation](docs/lid-geometry.md), and the [Locking Wedge Geometry Documentation](docs/wedge-geometry.md).

## Technology Stack

- **Framework & UI:** React 19, TypeScript
- **Build Tool:** Vite
- **Package Manager:** pnpm
- **Unit & Component Testing:** Vitest, React Testing Library, `@testing-library/jest-dom`
- **End-to-End Testing:** Playwright
- **Linting & Code Formatting:** ESLint (flat config), Prettier
- **Deployment:** GitHub Pages (static client-only deployment)

## Prerequisites

- **Node.js:** LTS release (Node.js 20+ or 22+)
- **pnpm:** 10.x+

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Development Server

```bash
pnpm dev
```

The application will be accessible at `http://localhost:5173/`.

## Available Scripts

### Development & Build

- `pnpm dev`: Start the local Vite development server.
- `pnpm build`: Run TypeScript checks and compile static production assets into `dist/`.
- `pnpm preview`: Locally preview the production build.

### Code Quality & Verification

- `pnpm typecheck`: Run strict TypeScript type checking without emitting output files.
- `pnpm lint`: Run ESLint checks across the codebase.
- `pnpm format`: Format source files using Prettier.
- `pnpm format:check`: Verify that all files adhere to Prettier formatting rules.
- `pnpm check`: Run all static checks (`format:check`, `lint`, `typecheck`) and unit tests in sequence.

### Testing

- `pnpm test`: Run Vitest in interactive watch mode for active development.
- `pnpm test:run`: Run Vitest once and exit with a status code (used in CI).
- `pnpm test:e2e`: Run Playwright end-to-end browser smoke tests.

## Architecture & Domain Model

- **Browser-Only:** The application runs completely in the browser with no backend server, database, or cloud API required.
- **Canonical Millimetre Representation:** Dimensions are stored internally in millimetres (`1 inch = 25.4 mm` exact). Metric and imperial are presentation and input formats; changing units updates display representation without mutating underlying physical design values or accumulating rounding drift.
- **Imperial Woodworking Resolution:** Imperial inputs and display formatting operate on a standard woodworking grid with a maximum resolution of `1/16 inch` (denominators 2, 4, 8, 16).
- **GitHub Pages Deployment:** The application builds into static assets configured for hosting under `/japanese-toolbox-designer/` on GitHub Pages. CI/CD runs automated verification on all pull requests and pushes to `main`, and deploys passing builds directly to GitHub Pages.

## Geometry Conventions

The geometry engine (`src/domain/geometry.ts`) is a pure, framework-independent calculation layer based on standard V1 Japanese toolbox carcass construction:

- **Coordinate System:**
  - `X` = overall outside length of the main box body (left/right, parallel to future sliding lid movement)
  - `Y` = overall outside width of the main box body (front/back across carcass)
  - `Z` = vertical distance from the underside of the bottom board to the top edge of the side/end walls
  - `T` = main stock thickness (`stockThickness`)
  - `R` = fixed top batten width (`fixedTopBattenWidth`)
- **Carcass Construction:**
  - The long side boards run the full outside length `X` and sit on top of the bottom board (`X × (Z - T) × T`).
  - The end boards fit between the long sides and sit on top of the bottom board (`(Y - 2T) × (Z - T) × T`).
  - The bottom board is full-size and attached underneath the carcass walls (`X × Y × T`).
  - Two fixed top battens sit **on top** of the body flush with each end and span the full outside width (`Y × R × T`).
  - Overall height including fixed top battens is therefore `Z + T`.
- **Internal & Clear Opening Dimensions:**
  - Unobstructed internal dimensions: `(X - 2T) × (Y - 2T) × (Z - T)`.
  - Clear top opening between fixed battens: `(X - 2R)` along `X` and `(Y - 2T)` along `Y`.
  - Fixed top batten interior projection: `R - T` (inward projection past the inner face of the end board).
- **Calculations & Scope:**
  - All calculations operate deterministically in canonical millimetres with full floating-point precision (no premature rounding).
  - Phase 3 implements core carcass geometry only. Sliding lid calculations (Phase 4) and locking wedge geometry (Phase 5) will build on this model.
  - Phase 6 provides live interactive numerical parameter editing, validation, and calculated dimensions.

## Roadmap

Implementation roadmap outlined in `.junie/plans/prd-v1.md`:

- **Phase 1 (Complete):** Project foundation, testing infrastructure, and deployment pipeline
- **Phase 2 (Complete):** Domain model, unit system (metric and imperial fractions), and default design state
- **Phase 3 (Complete):** Pure TypeScript core box geometry calculation engine and physical validation
- **Phase 4 (Complete):** Sliding lid geometry, kinematic reference states, and non-flexing release validation
- **Phase 5 (Complete):** Locking wedge and tapered batten geometry
- **Phase 6 (Complete):** Interactive numerical design parameters editor, live validation, and calculated dimensions
- **Phase 7 (Complete):** Local storage persistence, multi-design management (New, Save, Open, Rename, Duplicate, Delete), and Zod schema validation
- **Phase 8 (Complete):** Portable JSON single-design export and import with validation, ID conflict resolution, and pure serialization
- **Phase 9:** 2D technical drawing generation (front, plan, end views) using SVG with zoom/pan
- **Phase 10:** Interactive 3D viewer (Three.js / React Three Fiber)
- **Phase 11–13:** Wood materials, automated cut lists, process planning, and browser-side PDF export
