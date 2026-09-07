# 3D Rendering Architecture (Phase 10)

This document describes the 3D rendering architecture for the Japanese Toolbox Designer implemented in Phase 10.

---

## 1. Authoritative Domain Coordinate System vs Three.js Coordinate System

The domain layer uses the standard carpentry coordinate system:

- **Domain X**: Length along the toolbox (`0` at stop end, `X` at locking end)
- **Domain Y**: Width across the toolbox (`0` at front / narrow wedge end, `Y` at back / wide wedge end)
- **Domain Z**: Vertical height (`0` at bottom base, `Z` at carcass body height, `Z + T` at top of fixed and lid battens)

### Three.js Axis Mapping

Three.js uses a conventional Y-up right-handed coordinate system. At the rendering boundary, the pure domain coordinates are mapped to Three.js world coordinates:

```text
Domain X → Three X  (Length)
Domain Y → Three Z  (Depth)
Domain Z → Three Y  (Vertical height)
```

Conceptually:

$$\text{domainToThree}(x, y, z) = [x - x_c, z - z_c, y - y_c]$$

where $(x_c, y_c, z_c)$ represents the geometric center of the complete toolbox assembly bounds.

---

## 2. Pure Renderer-Neutral 3D Model (`Toolbox3DModel`)

To maintain clean separation between woodworking domain geometry and WebGL rendering, the 3D pipeline uses a pure, testable intermediate representation under `src/rendering/three-d/model/`:

```text
CalculatedToolboxGeometry
          │
          ▼
Toolbox3DModel (Pure TypeScript, physical coordinates & polyhedra)
          │
          ▼
React Three Fiber / Three.js Canvas & Meshes
```

The `Toolbox3DModel` contains 13 semantic woodworking parts, precise bounding volumes, and metadata without any React, Three.js, or WebGL dependencies.

---

## 3. Physical Parts Modelled (13 Distinct Semantic Parts)

The Japanese toolbox is modelled as 13 distinct semantic woodworking parts:

1. **`bottom`** (Box): Full base footprint $X \times Y$, thickness $T_b = 12\text{ mm}$ (default).
2. **`side-front`** (Compound Box): Runs full length $X$, thickness $T = 18\text{ mm}$, height $T_b \dots Z$. Modeled as 5 non-overlapping rectangular box segments to physically carve out the two housing dado recesses of depth $G = 3\text{ mm}$ without CSG or volume boolean artifacts.
3. **`side-back`** (Compound Box): Runs full length $X$, thickness $T = 18\text{ mm}$, height $T_b \dots Z$. Modeled as 5 non-overlapping rectangular box segments with the inner $G = 3\text{ mm}$ removed at each housing location.
4. **`end-stop`** (Box): Inset end wall at $X = 36 \dots 54\text{ mm}$, spanning $Y = 15 \dots 285\text{ mm}$ (entering the front and back housing dados by $G = 3\text{ mm}$ on each side), height $T_b \dots Z$.
5. **`end-locking`** (Box): Inset end wall at $X = 546 \dots 564\text{ mm}$, spanning $Y = 15 \dots 285\text{ mm}$ (entering the front and back housing dados by $G = 3\text{ mm}$ on each side), height $T_b \dots Z$.
6. **`handle-stop`** (Box): Solid crosswise grab handle at the stop end spanning $X = 0 \dots 36\text{ mm}$, $Y = 18 \dots 282\text{ mm}$, and $Z = 178 \dots 250\text{ mm}$ (height $H = 72\text{ mm}$).
7. **`handle-locking`** (Box): Solid crosswise grab handle at the locking end spanning $X = 564 \dots 600\text{ mm}$, $Y = 18 \dots 282\text{ mm}$, and $Z = 178 \dots 250\text{ mm}$ (height $H = 72\text{ mm}$).
8. **`fixed-top-batten-stop`** (Box): Top end cap above stop end spanning $0 \dots R = 84\text{ mm}$, $0 \dots Y$, $Z \dots Z + T$.
9. **`fixed-top-batten-locking`** (Polyhedron): Top end cap above locking end spanning $516 \dots 600\text{ mm}$ with inner bevel matching wedge capture angle $\beta = 10^\circ$.
10. **`lid-panel`** (Box): Sliding lid panel in locked state, centered laterally between side walls with lateral clearance $C = 2\text{ mm}$.
11. **`straight-lid-batten`** (Box): Rectangular batten affixed to lid panel, aligned with locked straight batten X coordinates and plan overhang.
12. **`locking-lid-batten`** (Polyhedron): Compound tapered ($\alpha = 2^\circ$) and bevelled ($\beta = 10^\circ$) batten affixed to lid panel forming the moving side of the wedge channel.
13. **`locking-wedge`** (Polyhedron): Compound tapered locking wedge captured vertically and tightened laterally.

### Compound Part Representation for Housing Dados

To prevent overlapping physical solids at the housed dado joints:

- The end-wall blanks physically extend into the side walls by $G = 3\text{ mm}$ ($Y = 15 \dots 18$ and $Y = 282 \dots 285$).
- The side boards are modeled as **compound parts** consisting of multiple solid box segments where the inner $G = 3\text{ mm}$ is recessed.
- At render time, multiple Three.js box meshes represent the one semantic side-board woodworking part, sharing identical material, edge styling, and part identity (`metadata.partCount = 13`).

---

## 4. Custom Locking Mechanism Geometry

### Locking Fixed Top Batten Bevel

- **Bottom inner edge**: $X = \text{lockingOpeningEdgeX}$ ($F$)
- **Top inner edge**: $X = F - H$, where $H = \text{lockingFixedTopBatten.bevelOffsetNormal}$
- Extruded across $Y = 0 \dots Y$, forming a vertical outer face at $x = X$ and an undercut bevel face on the inside.

### Tapered Locking Lid Batten Polyhedron

- **Bottom Face**: Matches authoritative $\text{lockingLidBatten.planCorners}$ from Phase 5 at $Z = \text{lockingBattenBottomZ}$.
- **Top Face**: The interior edge remains vertical at $x = \text{interiorEdgeX}$. The wedge-facing edge moves toward the wedge ($+X$) by $\text{taperedTopInset} = \text{capture.topWidthReduction} - \text{wedge.bevelOffsetNormalPerSide}$.

### Captured Locking Wedge Polyhedron

The wedge geometry is directly generated from authoritative Phase 5 plan and capture calculations:

- **Bottom Face ($Z = \text{wedgeBottomZ}$)**: Vertices given by $\text{wedge.planCorners}$ spanning $y = 0 \dots Y$.
  - Bottom narrow width = $23.50\text{ mm}$ (for default $600\text{ mm}$ toolbox)
  - Bottom wide width $\approx 33.84\text{ mm}$
- **Top Face ($Z = \text{wedgeTopZ}$)**:
  - Fixed-batten side moves inward ($-X$) by $H = \text{wedge.bevelOffsetNormalPerSide}$.
  - Locking-batten side moves inward ($+X$) by $\text{taperedTopInset}$.
  - Top narrow width = $\text{bottomNarrowWidth} - \text{topWidthReduction} \approx 17.15\text{ mm}$.
  - Top wide width = $\text{bottomWideWidth} - \text{topWidthReduction} \approx 27.49\text{ mm}$.

Because the wedge is wider at the bottom than the top, it is mechanically captured between the complementary undercut bevels of the fixed batten and lid batten.

---

## 5. Camera Controls and Standard Views

Perspective camera fitting is dynamically computed from the exact 3D model bounding sphere and FOV ($40^\circ$):

- **Perspective View**: Standard isometric-like three-quarter view looking from front/stop end towards the locking mechanism.
- **Front View**: Looking along Domain $+Y$ (horizontal axis is Domain $X$, vertical is Domain $Z$).
- **End View**: Looking along Domain $+X$ (horizontal axis is Domain $Y$, vertical is Domain $Z$).
- **Top View**: Looking downward along Domain $+Z$ (horizontal axis is Domain $X$, vertical is Domain $Y$).
- **Fit to View**: Resets OrbitControls target to model center and repositions camera to optimal bounding frame.

---

## 6. Lazy Loading and WebGL Fallback

- **Code Splitting**: The 3D viewer and Three.js runtime are code-split using `React.lazy()` and `React.Suspense`. Users remaining in 2D technical drawings do not execute or load the Three.js bundle chunk.
- **Error Boundary**: If WebGL context creation fails, `WebGLFallbackErrorBoundary` displays a clean message:
  _"The 3D viewer could not be started in this browser. The 2D technical drawings remain available."_

---

## 7. Phase 11 Boundary

Phase 10 deliberately uses a neutral wood-tone material (`MeshStandardMaterial` with subtle edge outlines) without external textures or species presets. Phase 11 will introduce wood species definitions, color variations, and refined material appearance.
