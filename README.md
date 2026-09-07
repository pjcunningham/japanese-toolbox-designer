# Japanese Toolbox Designer

Parametric Japanese toolbox design in your browser.

Japanese Toolbox Designer is a browser-only web application designed for woodworkers to simplify the design and layout of traditional Japanese toolboxes with sliding lids and wedge-locking battens.

## Current Status

**Phase 3 Complete — Core Box Geometry**

The pure TypeScript core box geometry engine (`calculateBoxGeometry`) calculates authoritative carcass dimensions, individual component blank dimensions (side panels, end panels, bottom panel, fixed top battens), internal clear dimensions, clear top opening, and fixed top batten interior projections with physical validity validation.

Sliding lid calculations (Phase 4), locking wedge calculations (Phase 5), design editor UI (Phase 6), local storage persistence (Phase 7), 2D technical drawings, 3D interactive rendering, materials management, cut lists, and PDF export will be implemented in subsequent phases.

For the full specification and architectural roadmap, see the [Product Requirements Document](.junie/plans/prd-v1.md).

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
  - The application UI currently presents the Phase 1 shell; direct UI parameter editing will be introduced in Phase 6.

## Roadmap

Implementation roadmap outlined in `.junie/plans/prd-v1.md`:

- **Phase 1 (Complete):** Project foundation, testing infrastructure, and deployment pipeline
- **Phase 2 (Complete):** Domain model, unit system (metric and imperial fractions), and default design state
- **Phase 3 (Complete):** Pure TypeScript core box geometry calculation engine and physical validation
- **Phase 4:** Sliding lid geometry and movement states
- **Phase 5:** Locking wedge and tapered batten geometry
- **Phase 6 & 7:** Interactive design parameters editor and local storage persistence
- **Phase 8 & 9:** 2D technical drawing generation (plan, elevation, cross-sections) using SVG
- **Phase 10:** Interactive 3D viewer (Three.js / React Three Fiber)
- **Phase 11–13:** Wood materials, automated cut lists, process planning, and browser-side PDF export
