# Japanese Toolbox Designer

## Product Requirements Document

**Product:** Japanese Toolbox Designer  
**Repository:** https://github.com/pjcunningham/japanese-toolbox-designer  
**Version:** V1  
**Status:** Initial specification  
**Application type:** Browser-only static web application  
**Primary language:** TypeScript

---

# 1. Product Summary

Japanese Toolbox Designer is a browser-based parametric design tool for creating traditional Japanese toolboxes with sliding lids and wedge-locking battens.

The application allows a woodworker to enter the desired overall dimensions and construction parameters of a toolbox and automatically derives:

- carcass dimensions;
- lid dimensions;
- lid travel;
- lid overlap;
- fixed batten positions;
- lid batten positions;
- locking wedge geometry;
- cutting dimensions;
- construction information.

The design is visualised using:

- front elevation;
- plan view;
- end elevation;
- interactive 3D model.

Designs can be named and retained in browser local storage.

The application requires no server, database, login, cloud storage or network API.

It must be capable of being built and deployed directly from the public GitHub repository using GitHub Pages.

---

# 2. Primary Goal

The most important purpose of the application is to remove the difficult geometry involved in calculating the sliding lid.

In particular, the application must correctly determine and clearly show:

1. lid length;
2. available lid movement;
3. engagement beneath the fixed battens;
4. overlap when locked;
5. clearance required before the opposite end can be lifted;
6. fixed lid-batten position;
7. tapered locking-batten position;
8. locking wedge geometry;
9. the relationship between the wedge, lid batten and fixed box batten.

The application must detect geometrically impossible designs rather than simply producing invalid dimensions.

---

# 3. V1 Design Philosophy

V1 should be useful enough that somebody could actually build a toolbox from it.

It should not attempt to be a general-purpose CAD system.

V1 will support **one defined Japanese toolbox construction method**.

Future versions may add alternative:

- joints;
- lid arrangements;
- bottom construction;
- batten styles;
- wedges;
- handles;
- trays.

The application's geometry must be deterministic and testable.

No dimensional calculation should exist only inside a React component or renderer.

---

# 4. Technology Stack

Recommended V1 stack:

- TypeScript
- React
- Vite
- pnpm
- SVG for 2D technical drawings
- Three.js
- React Three Fiber
- Drei where useful for camera controls
- Zod for persisted/imported data validation
- Vitest for unit/component tests
- React Testing Library
- Playwright for browser/end-to-end tests
- ESLint
- Prettier

PDF generation must run entirely in the browser.

A suitable browser-side PDF library should be selected during implementation.

No backend framework is required.

---

# 5. Browser Support

V1 should target current desktop versions of:

- Chrome
- Microsoft Edge
- Firefox
- Safari

The application must also remain usable on:

- tablets;
- mobile phones.

The primary design experience may be desktop-oriented, but no essential function should be inaccessible on a smaller screen.

---

# 6. Application Architecture

The application should be divided conceptually into:

```text
UI
 │
 ├── Design editor
 ├── Design manager
 ├── 2D viewer
 ├── 3D viewer
 ├── Cut list
 └── PDF / JSON export
            │
            ▼
     Calculated Design
            ▲
            │
     Geometry Engine
            ▲
            │
       Design Model
```

The geometry engine must be independent of React.

A function conceptually similar to:

```ts
calculateDesign(design: ToolboxDesign): CalculatedToolboxDesign
```

should be the single source of truth.

2D, 3D, cut lists and PDF export must consume `CalculatedToolboxDesign`.

They must not independently calculate woodworking dimensions.

---

# 7. Coordinate Convention

V1 will use a consistent toolbox coordinate system.

```text
X = outside length
Y = outside width
Z = outside height
```

The X axis is also the direction in which the lid moves when being fitted or removed.

This convention must be used throughout:

- calculations;
- drawings;
- 3D model;
- PDF;
- tests;
- documentation.

---

# 8. Units

The application supports:

- Metric
- Imperial

## 8.1 Internal representation

All calculations use one canonical internal representation.

Millimetres should be used internally.

Changing the displayed unit must not alter the underlying geometry.

---

## 8.2 Metric input

Metric dimensions:

- displayed in millimetres;
- entered as whole millimetres;
- minimum resolution 1 mm.

Examples:

```text
18 mm
250 mm
600 mm
```

Metric inputs should not normally expose decimal millimetres.

---

## 8.3 Imperial input

Imperial dimensions must use woodworking-friendly fractions.

Minimum increment:

```text
1/16"
```

Valid fractions are therefore based on:

```text
1/2
1/4
1/8
1/16
```

Examples of accepted input:

```text
12
12 1/2
12 3/4
12 7/8
12 15/16
3/16
```

Values finer than 1/16" must be rejected.

For example:

```text
12 1/32
```

is invalid.

Fractions should be normalised for display.

For example:

```text
8/16
```

becomes:

```text
1/2
```

Switching units must not progressively introduce rounding errors.

---

# 9. Primary Design Parameters

The basic design form should initially expose:

| Symbol | Description |
|---|---|
| X | Outside toolbox length |
| Y | Outside toolbox width |
| Z | Outside toolbox height |
| T | Main stock thickness |
| P | Lid panel thickness |
| R | Fixed top batten width |
| B | Lid batten width |
| C | Lid side clearance |
| O | Desired lid engagement/overlap |
| E | Lid-batten end overhang |
| α | Locking wedge taper angle |
| β | Locking wedge retaining bevel angle |

Not every parameter needs to be prominent.

The interface should have:

### Basic dimensions

- Length
- Width
- Height
- Main timber thickness

### Lid and locking mechanism

Advanced parameters initially populated with sensible defaults.

These include:

- lid thickness;
- lid clearance;
- batten width;
- rail width;
- overlap;
- wedge taper;
- wedge bevel.

A user should therefore be able to create a sensible toolbox by changing only X, Y, Z and T.

---

# 10. Default Geometry

V1 should provide sensible default proportions based on stock thickness.

For example, initial defaults may derive values approximately from:

```text
R = 3 × T
B = 2.5 × T
O = 0.75 × T
```

with practical minimum clearances.

These formulas must be isolated in the geometry/defaults layer.

They should not be embedded in UI components.

The precise formulas will be established and tested during the geometry implementation phase.

---

# 11. Lid Geometry

This is the most important part of the application.

The geometry engine must calculate at least:

```text
internalLength
internalWidth

lidLength
lidWidth

lockedLeftOverlap
lockedRightOverlap

availableLidTravel
requiredReleaseTravel

fixedBattenPosition
lockingBattenPosition

wedgeLength
wedgeMinimumWidth
wedgeMaximumWidth
```

The calculation must model two important states.

## 11.1 Locked state

The lid is fully closed and retained by both ends of the box.

The application must know exactly how much material overlaps beneath the appropriate fixed battens.

---

## 11.2 Removal state

After removing the locking key, the lid is translated along X.

The geometry engine must demonstrate that sufficient movement exists to:

1. disengage one end;
2. raise that end;
3. withdraw the opposite end.

This must be mathematically verified.

A design which cannot perform this movement is invalid.

---

# 12. Locking Wedge

V1 will implement a tapered captured locking key.

The wedge has two relevant angular properties.

## Plan taper

```text
α
```

The width varies along the length of the wedge so that sliding the wedge home progressively tightens the lid.

---

## Retaining bevel

```text
β
```

The wedge and mating components have complementary bevelled surfaces.

The resulting geometry must retain the wedge vertically so that simply turning the toolbox upside down does not cause the wedge to fall out.

The UI should refer to the component primarily as:

**Locking wedge**

Technical documentation may additionally describe it as a:

**tapered captured key**

or:

**tapered dovetail-like locking key**

The exact terminology can be refined later without affecting the geometry model.

---

# 13. Geometry Validation

The geometry engine must return errors and warnings.

It must never silently create impossible parts.

Examples of errors include:

- negative internal dimensions;
- lid wider than available opening;
- insufficient lid movement;
- overlap greater than available travel;
- battens intersecting incorrectly;
- wedge becoming too narrow;
- impossible wedge geometry;
- zero or negative component dimensions;
- top battens occupying excessive box length.

Warnings may include:

- unusually thin stock;
- very small overlap;
- excessive lid clearance;
- unusually steep wedge taper;
- very wide or narrow toolbox proportions.

Errors prevent export.

Warnings do not necessarily prevent export.

---

# 14. Design Management

The user can maintain multiple toolbox designs.

Required operations:

- New
- Save
- Rename
- Duplicate
- Delete
- Open

Each design has:

```text
id
name
schemaVersion
createdAt
updatedAt
unitSystem
dimensions
constructionParameters
wood
```

IDs should not depend on design names.

Duplicate names may be permitted.

---

# 15. Local Storage

All saved designs are stored in browser local storage.

Suggested versioned keys:

```text
jtd.designs.v1
jtd.settings.v1
```

Persisted data must be validated when loaded.

A corrupt design must not crash the application.

The storage format must have a schema version so future versions can migrate old designs.

---

# 16. JSON Export

The current design can be exported as JSON.

Example conceptual structure:

```json
{
  "schemaVersion": 1,
  "name": "Workshop Toolbox",
  "unitSystem": "metric",
  "dimensions": {
    "length": 600,
    "width": 300,
    "height": 250,
    "stockThickness": 18
  },
  "lid": {},
  "lockingMechanism": {},
  "wood": {}
}
```

Derived/calculated dimensions should normally **not** be persisted.

They should be recalculated after loading.

This avoids stale calculated data.

---

# 17. JSON Import

The user can import a previously exported JSON design.

Import must:

1. parse the JSON safely;
2. validate its schema;
3. validate its version;
4. validate dimensions;
5. run the geometry engine;
6. reject unusable data gracefully.

Importing JSON must never allow arbitrary code execution.

If an imported design ID conflicts with an existing design, V1 should import it as a new design rather than silently overwrite an existing design.

---

# 18. Wood Selection

V1 should include a small locally defined list of suitable woods.

For example:

- Hinoki / Japanese Cypress
- Japanese Cedar
- Pine
- Douglas Fir
- Paulownia
- Ash
- Oak
- Beech
- Other / Custom

A wood definition may contain:

```ts
interface WoodDefinition {
  id: string;
  name: string;
  displayColour: string;
  roughness: number;
}
```

This data must be bundled with the application.

No external service is required.

---

# 19. V1 Wood Rendering

The selected species should affect the 3D model.

For V1 this can be deliberately simple:

- approximate colour;
- material roughness;
- subtle variation if practical.

V1 does **not** require photographic wood grain texture maps.

Realistic procedural or photographic wood grain is a V2 feature.

The purpose in V1 is for a pine toolbox, ash toolbox and dark oak toolbox to be visually distinguishable.

---

# 20. 2D Technical Drawing Area

The application must provide:

- Front
- Plan
- End

views.

SVG is recommended.

The drawings must be generated from calculated geometry.

They should display:

- visible edges;
- hidden edges where useful;
- major dimensions;
- lid;
- fixed battens;
- lid battens;
- locking wedge.

Important lid-mechanism measurements should be shown particularly clearly.

---

# 21. 2D Viewer Interaction

The 2D viewer must support:

- zoom in;
- zoom out;
- pan;
- fit to view;
- reset view.

Zooming should not alter the actual design dimensions.

SVG should remain sharp at all zoom levels.

---

# 22. 3D Viewer

The application must provide an interactive 3D representation of the calculated toolbox.

Use:

- Three.js;
- React Three Fiber.

The V1 model should include individual components rather than representing the toolbox as one rectangular block.

At minimum:

- sides;
- ends;
- bottom;
- fixed top battens;
- lid;
- lid battens;
- locking wedge.

---

# 23. 3D Viewer Interaction

The 3D viewer should support:

- orbit;
- zoom;
- pan;
- reset camera;
- fit object to view.

Provide standard camera shortcuts if straightforward:

- Perspective
- Front
- End
- Top

V1 does not require physically based photorealistic rendering.

---

# 24. Design Workspace Layout

Desktop layout should broadly consist of:

```text
┌──────────────────────────────────────────────────────────┐
│ Japanese Toolbox Designer        Design / Save / Export │
├───────────────────┬──────────────────────────────────────┤
│                   │                                      │
│ Design parameters │          Drawing / 3D Viewer         │
│                   │                                      │
│ Dimensions        │                                      │
│ Lid               │                                      │
│ Materials         │                                      │
│                   │                                      │
├───────────────────┴──────────────────────────────────────┤
│ Calculated dimensions / validation / cut list            │
└──────────────────────────────────────────────────────────┘
```

Viewer tabs might be:

```text
Front | Plan | End | 3D
```

or:

```text
2D | 3D
```

with Front/Plan/End controls within 2D.

Implementation may choose whichever gives the cleaner interface.

---

# 25. Responsive Layout

Desktop:

- design controls alongside viewer.

Tablet:

- narrower side panel or collapsible controls.

Mobile:

- controls and viewer stacked vertically.

The application must not rely solely on hover interaction.

---

# 26. Calculated Dimensions Panel

The UI should expose important derived values.

For example:

```text
Internal length
Internal width
Internal height

Lid length
Lid width

Lid travel
Required release travel

Locked overlap — fixed end
Locked overlap — wedge end

Wedge minimum width
Wedge maximum width
```

This is particularly valuable when investigating the sliding-lid mechanism.

---

# 27. Cut List

A calculated cut list must be available in the browser.

Typical columns:

| Part | Qty | Length | Width | Thickness | Notes |
|---|---:|---:|---:|---:|---|
| Long side | 2 | ... | ... | ... | |
| End | 2 | ... | ... | ... | |
| Bottom | 1 | ... | ... | ... | |
| Fixed top batten | 2 | ... | ... | ... | |
| Lid panel | 1 | ... | ... | ... | |
| Fixed lid batten | 1 | ... | ... | ... | |
| Locking lid batten | 1 | ... | ... | ... | compound cut |
| Locking wedge | 1 | ... | ... | ... | fit after assembly |

All values must originate from the calculated design.

The cut list must honour the selected display units.

---

# 28. Construction Process Plan

V1 should generate a deterministic construction sequence.

No AI/API is required.

Initial sequence:

1. Prepare and dimension stock.
2. Cut long sides.
3. Cut end boards.
4. Assemble and square carcass.
5. Fit bottom.
6. Prepare fixed top battens.
7. Install fixed top battens.
8. Prepare lid panel.
9. Fit fixed lid batten.
10. Prepare locking lid batten.
11. Cut compound/tapered locking geometry.
12. Prepare locking wedge from mating geometry.
13. Dry-fit lid.
14. Verify lid overlap.
15. Verify lid release travel.
16. Fit wedge.
17. Trim wedge after fitting.
18. Ease exposed edges.
19. Sand and finish.

Where practical the process plan should include dimensions specific to the current design.

---

# 29. PDF Export

V1 must generate a useful workshop PDF entirely in the browser.

No server or API call may be required.

The PDF should contain:

## Page 1

- design name;
- date generated;
- unit system;
- overall X × Y × Z dimensions;
- wood species;
- important construction parameters.

## Drawing section

At minimum:

- front view;
- plan view;
- end view.

## Cut list

Include the full calculated cut list.

## Lid mechanism

Include key values:

- overlap;
- release travel;
- lid clearance;
- wedge taper;
- retaining bevel.

## Process plan

Include the generated construction sequence.

The V1 PDF does not need photorealistic rendering.

---

# 30. Autosizing and Printing

Technical drawings and PDFs must use true calculated proportions.

The screen drawing does not need to correspond to physical print scale.

A future version may support explicit drawing scales such as:

```text
1:5
1:10
1:20
```

---

# 31. Accessibility

V1 should:

- use semantic HTML;
- provide labels for all form controls;
- permit keyboard operation of normal UI controls;
- maintain sufficient contrast;
- not communicate validation state through colour alone.

The 3D viewer itself need not be keyboard-equivalent to CAD software.

Important information visible in 3D must also be available textually.

---

# 32. Testing Requirements

Testing is a first-class requirement.

A feature is not considered complete until its relevant tests exist.

---

## 32.1 Geometry unit tests

This is the most important test suite.

Test:

- internal dimensions;
- lid width;
- lid length;
- batten locations;
- overlap;
- release travel;
- wedge geometry;
- cut list dimensions;
- impossible designs;
- boundary conditions.

Tests should contain known hand-calculated examples.

---

## 32.2 Unit conversion tests

Test:

- mm → imperial;
- imperial → mm;
- nearest 1/16";
- fraction simplification;
- invalid 1/32";
- mixed-number parsing;
- repeated switching between metric and imperial without accumulating error.

---

## 32.3 Persistence tests

Test:

- create;
- save;
- load;
- rename;
- duplicate;
- delete;
- corrupt local storage;
- schema version handling.

---

## 32.4 JSON tests

Test:

- export;
- round-trip import/export;
- malformed JSON;
- invalid schema;
- invalid dimensions;
- unsupported schema version;
- conflicting IDs.

---

## 32.5 UI tests

Use React Testing Library for important workflows.

Examples:

- dimension edit recalculates design;
- unit switching;
- validation message display;
- design selection;
- cut-list update.

---

## 32.6 Browser tests

Use Playwright for key end-to-end workflows.

At minimum:

### Workflow A

```text
Open application
→ create design
→ modify dimensions
→ save
→ reload browser
→ reopen saved design
```

### Workflow B

```text
Create design
→ export JSON
→ import JSON
→ verify dimensions
```

### Workflow C

```text
Create valid design
→ view front/plan/end
→ open 3D view
```

### Workflow D

```text
Create design
→ export PDF
→ verify PDF is produced
```

---

# 33. Testing Geometry Against Rendering

Rendering tests should not duplicate geometry formulas.

Instead they should verify that rendered components use values from `CalculatedToolboxDesign`.

This prevents tests themselves from creating a second implementation of the geometry.

---

# 34. Code Quality

TypeScript should use strict mode.

Avoid:

```ts
any
```

unless genuinely unavoidable and documented.

Domain interfaces should be explicit.

Prefer small pure functions for:

- unit conversion;
- fraction parsing;
- geometry;
- validation;
- cut-list generation;
- process-plan generation.

React components should primarily deal with presentation and interaction.

---

# 35. Repository Structure

A possible structure is:

```text
japanese-toolbox-designer/
├── src/
│   ├── app/
│   ├── components/
│   ├── domain/
│   │   ├── design.ts
│   │   ├── geometry.ts
│   │   ├── validation.ts
│   │   ├── units.ts
│   │   ├── cutList.ts
│   │   └── processPlan.ts
│   ├── features/
│   │   ├── designs/
│   │   ├── editor/
│   │   ├── cut-list/
│   │   └── export/
│   ├── persistence/
│   ├── rendering/
│   │   ├── two-d/
│   │   └── three-d/
│   ├── materials/
│   └── test/
├── e2e/
├── public/
├── docs/
└── README.md
```

The exact structure may evolve where justified.

---

# 36. GitHub Pages

The application must be deployable as a static site using GitHub Pages.

A GitHub Actions workflow should:

```text
checkout
→ install dependencies
→ lint
→ type-check
→ run unit/component tests
→ build
→ deploy
```

Playwright testing may run as a separate job if this makes CI simpler.

Vite must be configured correctly for the repository base path:

```text
/japanese-toolbox-designer/
```

No backend service may be necessary to run the deployed application.

---

# 37. Runtime Network Requirement

After the static application assets have loaded, normal application functionality must require no network API calls.

In particular:

- design calculations are local;
- saved designs are local;
- material definitions are local;
- JSON import/export is local;
- PDF generation is local;
- 2D rendering is local;
- 3D rendering is local.

Do not introduce analytics, cloud persistence or remote APIs in V1.

---

# 38. README

The repository README should eventually include:

- application purpose;
- screenshot;
- live GitHub Pages link;
- development setup;
- test commands;
- production build command;
- architecture overview;
- explanation of metric/imperial handling;
- explanation of the geometry engine;
- limitations;
- roadmap.

---

# 39. V1 Exclusions

The following are explicitly out of scope for V1 unless implementation proves trivial.

## Accounts and cloud

- user accounts;
- login;
- cloud design storage;
- database;
- server API.

## Advanced CAD

- arbitrary freehand CAD editing;
- user-defined joinery;
- arbitrary component movement;
- dimension dragging.

## Advanced woodworking

- dovetailed carcasses;
- finger-jointed carcasses;
- multiple bottom styles;
- removable trays;
- internal tool trays;
- tool holders;
- handles with alternative geometry;
- stock optimisation;
- board-foot calculations;
- costing.

## Advanced rendering

- photorealistic wood;
- external texture downloads;
- ray-traced rendering;
- workshop environments;
- animated lid removal.

## Advanced documentation

- manufacturing drawings for every component;
- DXF export;
- SVG export;
- CNC files;
- STEP/STL export.

These can be considered for V2 and later.

---

# 40. Likely V2 Features

Potential V2 work includes:

- realistic wood grain;
- more wood species;
- custom material definitions;
- animated lid insertion/removal;
- exploded 3D view;
- transparent/x-ray view;
- dedicated enlarged wedge detail;
- alternative wedge styles;
- alternative traditional Japanese toolbox constructions;
- internal trays;
- handles;
- alternative bottom joints;
- stock optimisation;
- cost estimator;
- toolbox weight estimator;
- SVG drawing export;
- DXF export;
- STL/3D export;
- user-selectable PDF scale;
- shareable designs encoded in URLs;
- Progressive Web App/offline installation.

---

# 41. Implementation Strategy

Development should proceed in small independently tested phases.

The application should remain runnable at the end of every phase.

Do not attempt the complete UI before establishing and testing the geometry model.

Recommended phases follow.

---

## Phase 1 — Project foundation

Create:

- Vite React TypeScript project;
- linting;
- formatting;
- Vitest;
- React Testing Library;
- Playwright;
- basic application shell;
- CI workflow;
- GitHub Pages build configuration.

No toolbox geometry yet.

---

## Phase 2 — Domain model and units

Implement:

- `ToolboxDesign`;
- unit system;
- metric parser;
- imperial fraction parser;
- formatting;
- unit conversion;
- default design;
- tests.

No rendering yet.

---

## Phase 3 — Core box geometry

Implement pure TypeScript calculations for:

- sides;
- ends;
- bottom;
- internal dimensions;
- top battens;
- basic lid opening.

Add extensive tests.

No 3D rendering.

---

## Phase 4 — Sliding lid geometry

Implement:

- lid dimensions;
- locked state;
- removal state;
- overlap;
- available travel;
- required travel;
- batten locations;
- geometry validation.

This is a critical milestone.

Use hand-calculated test fixtures before continuing.

---

## Phase 5 — Locking wedge geometry

Implement:

- tapered locking batten;
- wedge;
- plan taper;
- retaining bevel;
- minimum/maximum wedge dimensions;
- validation;
- tests.

At this point the entire physical design should be calculable without a UI.

---

## Phase 6 — Design editor

Build:

- basic dimensions form;
- advanced lid parameters;
- live calculated dimensions;
- errors;
- warnings;
- metric/imperial switching.

The designer is now usable numerically.

---

## Phase 7 — Saved designs

Implement:

- local storage;
- New;
- Save;
- Open;
- Rename;
- Duplicate;
- Delete;
- schema versioning.

---

## Phase 8 — JSON import/export

Implement validated:

- Export Design;
- Import Design.

Add round-trip tests.

---

## Phase 9 — 2D drawings

Implement SVG:

- front;
- plan;
- end.

Add:

- dimensions;
- zoom;
- pan;
- fit-to-view.

The plan view should make the lid overlap and locking geometry particularly clear.

---

## Phase 10 — Basic 3D viewer

Implement:

- carcass;
- bottom;
- lid;
- fixed battens;
- lid battens;
- wedge.

Add orbit/zoom/pan.

Use simple wood materials.

---

## Phase 11 — Materials

Add bundled wood definitions.

Make selected wood influence 3D appearance.

No external textures.

---

## Phase 12 — Cut list and process plan

Generate:

- complete cut list;
- construction sequence;
- design-specific measurements.

Both must use `CalculatedToolboxDesign`.

---

## Phase 13 — PDF

Implement browser-only PDF generation containing:

- design details;
- orthographic drawings;
- cut list;
- lid mechanism dimensions;
- process plan.

---

## Phase 14 — Responsive UI and polish

Improve:

- desktop layout;
- tablet layout;
- mobile layout;
- keyboard accessibility;
- error handling;
- empty states;
- design-management UX.

---

## Phase 15 — Final V1 verification

Run:

- lint;
- type checking;
- unit tests;
- component tests;
- Playwright;
- production build.

Verify GitHub Pages deployment from a clean checkout.

Update README.

Tag V1.

---

# 42. V1 Definition of Done

V1 is complete when a user can:

1. Open the application from GitHub Pages.
2. Create a named toolbox design.
3. Specify X, Y, Z and timber thickness.
4. Adjust lid-mechanism parameters.
5. Work in metric or imperial units.
6. See calculated lid overlaps and release travel.
7. Receive an error if the lid geometry cannot work.
8. View front, plan and end drawings.
9. Zoom and pan the drawings.
10. View the toolbox interactively in 3D.
11. Zoom, rotate and pan the 3D model.
12. Select a wood species and see it represented in 3D.
13. View a calculated cut list.
14. View a construction process plan.
15. Save the design locally.
16. Rename it.
17. Duplicate it.
18. Delete it.
19. Close the browser and retrieve it later.
20. Export it as JSON.
21. Import it from JSON.
22. Export a workshop PDF.
23. Use all of the above without a backend or API.
24. Run the complete automated test suite successfully.
25. Build and deploy the application entirely from the public GitHub repository.

---

# 43. Most Important Engineering Rule

The following must remain true throughout development:

> There is exactly one authoritative implementation of the toolbox geometry.

The same calculated model drives:

- validation;
- displayed calculated dimensions;
- 2D drawings;
- 3D model;
- cut list;
- construction plan;
- PDF.

If two parts of the application independently calculate the same woodworking dimension, the design should be refactored.

This is particularly important for the sliding lid overlap and locking wedge geometry.