# Japanese Toolbox Designer

Parametric Japanese toolbox design in your browser.

Japanese Toolbox Designer is a browser-only web application designed for woodworkers to simplify the design and layout of traditional Japanese toolboxes with sliding lids and wedge-locking battens.

## Current Status

**Phase 1 Complete — Project Foundation**

The application shell, development environment, build pipeline, static verification suites (TypeScript, ESLint, Prettier), testing frameworks (Vitest, React Testing Library, Playwright), and GitHub Pages deployment workflows are established.

Toolbox geometry calculations, 2D technical drawings, 3D interactive rendering, materials management, cut lists, and PDF export will be implemented in subsequent phases.

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

## Architecture & Deployment

- **Browser-Only:** The application runs completely in the browser with no backend server, database, or cloud API required.
- **GitHub Pages Deployment:** The application builds into static assets configured for hosting under `/japanese-toolbox-designer/` on GitHub Pages. CI/CD runs automated verification on all pull requests and pushes to `main`, and deploys passing builds directly to GitHub Pages.

## Roadmap

Upcoming implementation phases outlined in `.junie/plans/prd-v1.md`:

- **Phase 2:** Domain model, unit system (metric and imperial fractions), and default design state
- **Phase 3 & 4:** Pure TypeScript core box and sliding lid geometry calculation engine
- **Phase 5:** Locking wedge and tapered batten geometry
- **Phase 6 & 7:** Interactive design parameters editor and local storage persistence
- **Phase 8 & 9:** 2D technical drawing generation (plan, elevation, cross-sections) using SVG
- **Phase 10:** Interactive 3D viewer (Three.js / React Three Fiber)
- **Phase 11–13:** Wood materials, automated cut lists, process planning, and browser-side PDF export
