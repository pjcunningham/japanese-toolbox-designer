# Japanese Toolbox Designer — Release Notes v1.0.0

Japanese Toolbox Designer **v1.0.0** is the first official production release of the browser-only parametric Japanese toolbox design and planning application.

---

## Overview

Japanese Toolbox Designer is a zero-dependency, browser-local CAD and workshop planning application tailored for woodworkers building traditional Japanese toolboxes (_bako_).

The application requires no backend server, cloud database, user accounts, or external API services. All calculations, 2D technical drawings, 3D interactive models, cut lists, construction plans, and multi-page workshop PDF exports are generated entirely client-side.

---

## Key Capabilities in V1.0.0

- **Parametric Carcass & Inset-End Joinery:** Full parametric modeling of outside box dimensions ($X \times Y \times Z$), stock thickness ($T$), bottom thickness ($T_b$), end-wall inset ($I$), handle height ($H$), housing dado depth ($G$), and fixed top batten width ($R$).
- **Authentic Traditional Construction:** The final V1 model uses inset housed end walls and integral grab-handle bays, replacing an earlier pre-release flush-end prototype model. Side boards feature shallow housing dados ($G = 3\text{ mm}$) to securely seat the inset end walls without overlapping physical solids.
- **Kinematic Sliding Lid & Captured Locking Wedge:** Mathematically rigorous sliding lid mechanics with independent stop-end and locking-end lid overlaps, allowing asymmetric sliding-lid geometry, release travel ($D$), clearance margins, and compound wedge geometry ($2^\circ$ plan taper $\alpha$, $10^\circ$ vertical undercut retention bevel $\beta$).
- **Dual Unit System:** Full floating-point canonical millimetre representation internally with seamless switching between Metric (whole mm) and Imperial fractional woodworking units ($1/16\text{ in}$ resolution).
- **Interactive 2D Technical Drawings:** Responsive vector SVG orthographic Plan, Front, and End views with non-scaling dimension lines, callout annotations, pointer-centered zoom, pan, and fit-to-view.
- **Interactive 3D WebGL Model:** Three.js / React Three Fiber interactive model representing 13 distinct semantic woodworking parts, standard camera projections (Perspective, Front, End, Top, Fit to View), orbit/zoom/pan controls, and species-sensitive timber rendering.
- **Bundled Wood Species Catalogue:** 9 built-in species definitions (Hinoki, Japanese Cedar, Pine, Douglas Fir, Paulownia, Ash, Oak, Beech, Custom) bundled locally with zero remote asset downloads.
- **Workshop Cut List:** Nominal stock blank bill of materials grouping 8 line items, 12 initial stock blanks, 13 finished parts, and a single combined locking batten + wedge blank.
- **23-Step Construction Process Plan:** Complete sequential woodworking process plan from dimensioning stock and cutting housing dados to compound wedge fitting, rigid lid release verification, and final edge easing.
- **Offline Multi-Page Workshop PDF Export:** Structured A4 workshop documentation generated client-side using `pdf-lib`, including design specifications, vector engineering drawings, cut list table, and paginated process plan.
- **Local Persistence & JSON Interchange:** Browser `localStorage` multi-design lifecycle management (New, Save, Open, Rename, Duplicate, Delete) with legacy Schema V1/V2 automatic in-memory migration, and portable single-design JSON import/export with ID conflict resolution.
- **Responsive CAD Workstation Interface:** Fluid workstation shell adapting from ultra-wide 3-column desktop viewports (`>= 1500px`) and 2-column laptop layouts to tablet and single-column mobile screens without horizontal page overflow.

---

## Technical Specifications

- **Runtime:** Browser-only (client-side execution, no network API calls)
- **Framework & Language:** React 19, TypeScript (strict mode)
- **Visualization:** Three.js / React Three Fiber (lazy loaded)
- **PDF Engine:** `pdf-lib` (lazy loaded, vector drawings, standard fonts)
- **Storage:** Browser `localStorage` (`jtd.designs.v1`, Schema V3 designs in a version 1 envelope)
- **Test Suite:** Vitest unit/component tests and Playwright E2E tests across Chromium, Firefox, and WebKit
- **Bundle Footprint:** Initial JS ~392 kB, lazy Three.js chunk ~935 kB, lazy PDF chunk ~436 kB, CSS ~29 kB

---

## Suggested Git Tag

```bash
git tag -a v1.0.0 -m "Japanese Toolbox Designer v1.0.0"
git push origin v1.0.0
```
