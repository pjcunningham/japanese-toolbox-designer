# Manufacturing Layer — Cut List & Construction Process Plan

This document specifies the workshop-ready manufacturing architecture and models for generating the **Cut List** and **Construction Process Plan** from authoritative parametric toolbox geometry.

---

## 1. Architectural Role & Flow

The manufacturing layer is a pure, renderer-neutral domain transformation that consumes authoritative calculated toolbox geometry (`CalculatedToolboxGeometry`) and produces structured, deterministic workshop data models:

```text
       ToolboxDesign
             │
             ▼
 calculateToolboxGeometry()
             │
   ┌─────────┴─────────┐
   ▼                   ▼
createCutList()   createProcessPlan()
   │                   │
   ├─────────┬─────────┤
   ▼         ▼         ▼
CutList  ProcessPlan   UI (Workshop Panel)
   │         │
   └────┬────┘
        ▼
 Phase 13 Workshop PDF
```

Key architectural rules:

- **Zero recalculation**: The manufacturing layer projects directly from domain geometry properties rather than duplicating mathematical formulas.
- **UI & library independence**: Modules in `src/manufacturing/` have no dependencies on React, DOM, SVG, Three.js, or PDF libraries.
- **Derived & ephemeral**: Manufacturing data is computed dynamically on demand and is never serialized into localStorage or JSON interchange files.
- **Future PDF reuse**: Phase 13 PDF generation directly consumes the structured `CutList` and `ProcessPlan` objects rather than scraping rendered DOM elements.

---

## 2. Cut List: Nominal Stock Blanks

The V1 Cut List defines the **rectangular stock blanks** the woodworker should initially prepare before cutting joinery housing dados, tapers, and bevels.

### Invariant Quantities (V2 Default Design)

- **Line item count**: `8` line items (blanks grouped by identical dimensions).
- **Stock blank count**: `12` initial physical blanks.
- **Finished part count**: `13` semantic physical parts.

The difference between 12 stock blanks and 13 finished parts arises from the **one combined locking-set blank** (`332 × 59.5 × 18 mm`), which is machined and separated into two finished components:

1. One tapered locking lid batten ($296\text{ mm}$ finished working length).
2. One captured locking wedge ($296\text{ mm}$ working length + $36\text{ mm}$ fitting allowance = $332\text{ mm}$ starting length).

### Standard Cut List Rows (V2 Default)

| #   | Item Name                        | Qty |  Dimensions ($L \times W \times T$)   | Manufacturing Notes                                                                                                                                               |
| --- | :------------------------------- | :-: | :-----------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Long sides**                   |  2  | $600 \times 238 \times 18\text{ mm}$  | Cut housing dados for both inset end walls after preparing the blank.                                                                                             |
| 2   | **End walls**                    |  2  | $270 \times 238 \times 18\text{ mm}$  | Includes the housed portion entering both side-board dados.                                                                                                       |
| 3   | **Bottom**                       |  1  | $600 \times 300 \times 12\text{ mm}$  | Full-size bottom fitted beneath the carcass.                                                                                                                      |
| 4   | **Grab handles**                 |  2  |  $264 \times 72 \times 36\text{ mm}$  | Fit between the long sides at the two inset end bays.                                                                                                             |
| 5   | **End caps**                     |  2  |  $300 \times 84 \times 18\text{ mm}$  | Stop-end cap keeps a square inner edge; locking-end cap receives the captured-wedge bevel.                                                                        |
| 6   | **Lid panel**                    |  1  | $459 \times 260 \times 12\text{ mm}$  | Final longitudinal fit is governed by locked overlap and release travel.                                                                                          |
| 7   | **Straight lid batten**          |  1  |  $296 \times 42 \times 18\text{ mm}$  | Stop-end lid batten.                                                                                                                                              |
| 8   | **Locking batten + wedge blank** |  1  | $332 \times 59.5 \times 18\text{ mm}$ | This single blank is machined to produce both the tapered locking lid batten and the captured wedge. The wedge is deliberately left overlength for final fitting. |

### Woodworking Assumptions & Boundaries

- **No saw-kerf allowance**: Cut-list dimensions are finished nominal blank dimensions.
- **No arbitrary rough-sizing padding**: The only intentional overlength is the authoritative locking wedge fitting allowance ($2T = 36\text{ mm}$).
- **No stock nesting or linear optimization**: Optimization features are deferred to future versions.
- **No cost estimation**: Wood species selection affects appearance and metadata only.

---

## 3. Construction Process Plan

The Construction Process Plan provides a deterministic 23-step workshop sequence reflecting traditional Japanese toolbox joinery and the compound locking lid mechanism.

### Key Joinery & Assembly Sequences

1. **Stock preparation**: Dimensioning main carcass stock, bottom board, lid panel, and handle stock.
2. **Housing dados**: Gang-marking side boards and cutting shallow dados ($G = 3\text{ mm}$) to house the inset end walls.
3. **Inset end walls & carcass assembly**: Dry-fitting end walls and securing the full-size bottom board underneath.
4. **Grab handle installation**: Fitting solid handles into the upper portion of the inset end bays.
5. **End caps & lid pocket**: Installing fixed top battens that project inward past the end walls to establish pocket depth ($R - I - T = 30\text{ mm}$).
6. **Compound locking set**: Machining the plan taper ($\alpha = 2^\circ$) and retaining bevel ($\beta = 10^\circ$) on the combined blank, separating the batten and wedge, and retaining wedge overlength for fitting.
7. **Lid operation verification**: Step-by-step check confirming non-flexing rigid lid release travel ($D = 16.5\text{ mm}$, release margin $= 3\text{ mm}$).
8. **Final wedge fitting & edge easing**: Workshop tuning and final trimming of excess wedge grip length.

---

## 4. Units & Precision

- **Internal precision**: All linear dimensions remain unrounded canonical millimetres in data structures (e.g. `59.5 mm`).
- **Unit independence**: Pure models generated under Metric and Imperial settings are identical in numerical value.
- **Display formatting**: The UI and future PDF format linear dimensions through the domain unit formatters (`formatMetricDimension` / `formatImperialDimension`), producing clean woodworking fractions (e.g. `23 5/8"`, `11/16"`) in Imperial mode.
- **Angles**: Angles remain degrees (`°`) across both unit systems.
