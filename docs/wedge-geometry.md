# Locking Wedge Geometry (Phase 5)

This document specifies the authoritative mathematical model, geometric conventions, and physical relationships for the V1 Japanese toolbox locking mechanism.

---

## 1. Component Terminology

To avoid ambiguity in technical documentation and implementation:

1. **Fixed top batten (locking-end):** The box-mounted batten attached flush with the locking end of the carcass. Its interior-facing edge is bevelled at angle $\beta$ away from vertical to capture the wedge.
2. **Locking lid batten:** The batten attached to the upper face of the sliding lid panel at the locking end. Its finished shape is a plan trapezoid (tapered at plan angle $\alpha$) with an undercut compound-angle mating face bevelled at angle $\beta$.
3. **Locking wedge:** The removable tapered wooden key inserted horizontally between the fixed top batten and the locking lid batten.
   - The finished component is best described as a **captured tapered wedge** or **tapered sliding-dovetail key** rather than a "double compound-angle wedge."
4. **Compound-angle face:** The mating face between the locking wedge and the locking lid batten. It is a genuine compound-angle face because it combines the plan taper $\alpha$ and the vertical bevel $\beta$.
   - The opposite mating face (between the wedge and the fixed top batten) is straight in plan ($0^\circ$) but bevelled at $\beta$ from vertical.

---

## 2. Coordinate System & Motions

The geometry preserves the right-handed Cartesian coordinate system established in previous phases:

- **$X$ axis (Toolbox Length):** Parallel to the sliding lid movement.
  - $x = 0$: **Stop end** (contains straight lid batten).
  - $x = X$: **Locking end** (contains locking-end fixed top batten, locking lid batten, and locking wedge).
  - The **lid slides along $X$**.
- **$Y$ axis (Toolbox Width):** Across the toolbox width (between the long side walls).
  - The **wedge slides along $Y$**.
- **$Z$ axis (Toolbox Height):** Vertical axis from the underside of the bottom board ($z = 0$) to the top edge of the side/end walls ($z = Z$).

```text
x = 0 (Stop End)                                                 x = X (Locking End)
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Fixed Top Batten]                                            [Fixed Top Batten]│
│ [Straight Batten]                                                      [Wedge]  │
│                                                               [Locking Batten]  │
│                                                                                 │
│                       Top Opening (Length = X - 2R)                             │
│                                                                                 │
│   <── Lid Slides along X ──>                      <── Wedge Slides along Y ──>  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Kinematic Integration & Travel Clearance

### Preserving Phase 4 Lid Travel

Phase 4 & 10A define the available lid travel required to release the lid:

$$D = \text{availableLidTravel} = (R - I - T) - O$$

where:

- $R$ is the fixed top batten width (`fixedTopBattenWidth`).
- $I$ is the end handle depth / end-wall inset (`endHandleDepth`).
- $T$ is the stock thickness (`stockThickness`).
- $O$ is the locked longitudinal overlap per end (`desiredOverlap`).

When the wedge is removed, the lid must be free to shift by the full travel distance $D$ towards the locking end to allow the stop end to clear the top opening.

### Locking Batten Travel Clearance ($Q$)

A dedicated construction parameter, $Q = \text{lockingBattenTravelClearance}$ (default $1\text{ mm}$), defines:

> The minimum longitudinal gap remaining between the locking lid batten and locking-end fixed top batten after the lid has completed its full Phase 4 release travel with the wedge removed.

### Minimum Wedge-Channel Width ($W_{\min}$)

To guarantee that the locking lid batten never becomes the travel stop:

$$W_{\min} = \text{wedgeMinimumBottomWidth} = D + Q = \text{availableLidTravel} + \text{lockingBattenTravelClearance}$$

When the lid shifts by the full available travel $D$, the remaining minimum gap is exactly:

$$\text{remainingGapAfterFullLidShift} = W_{\min} - D = (D + Q) - D = Q$$

For the default design:

- $D = 16.5\text{ mm}$
- $Q = 1.0\text{ mm}$
- $W_{\min} = 17.5\text{ mm}$
- $\text{remainingGapAfterFullLidShift} = 1.0\text{ mm} > 0$

---

## 4. Plan Taper & One-Blank Geometry

### Working Length ($L$) & Plan Taper Angle ($\alpha$)

The locking lid batten and wedge have a working length $L$ equal to the straight lid batten length:

$$L = \text{lockingBattenLength} = \text{lidPanelWidth} + 2E$$

where $E$ is `lidBattenOverhang`.

For a plan taper angle $\alpha$ (`wedgeTaperAngle`, default $2^\circ$), the width change across the full length is:

$$\text{taperDelta} = L \times \tan(\alpha)$$

The rate of wedge width change per unit of transverse travel is:

$$\text{taperRate} = \tan(\alpha)$$

### Wedge Plan Widths (Bottom Face)

At the bottom face (adjacent to the lid panel):

- $\text{bottomNarrowWidth} = W_{\min}$
- $\text{bottomWideWidth} = W_{\min} + \text{taperDelta}$

### Locking Lid Batten Taper

The locking batten has maximum width $B = \text{lidBattenWidth}$ (default $42\text{ mm}$):

- $\text{maximumWidth} = B$
- $\text{minimumWidth} = B - \text{taperDelta}$

### One-Blank Manufacturing Invariant

The wedge and locking lid batten can conceptually be produced by making a single diagonal cut across a rectangular blank of width $B + W_{\min}$:

$$\text{combinedLockingBlankWidth} = B + W_{\min}$$

At the opposite end:

$$\text{lockingBattenMinimumWidth} + \text{wedgeBottomWideWidth} = (B - \text{taperDelta}) + (W_{\min} + \text{taperDelta}) = B + W_{\min}$$

```text
Plan View of Blank (Width = B + Wmin):
y = yStart                                                            y = yEnd
┌────────────────────────────────────────────────────────────────────────────┐
│ Locking Lid Batten (Max Width = B)       │ (Min Width = B - taperDelta)    │
│──────────────────────────────────────────┼─────────────────────────────────│
│ Wedge (Narrow Width = Wmin)              │ (Wide Width = Wmin + taperDelta)│
└────────────────────────────────────────────────────────────────────────────┘
 <────────────────────────── Working Length L ──────────────────────────────>
```

---

## 5. Vertical Datum, Bevel Angle & Dovetail Capture

### Vertical Bevel Angle ($\beta$)

To prevent the wedge from falling out vertically when the toolbox is inverted, both side mating faces are bevelled at angle $\beta$ (`wedgeBevelAngle`, default $10^\circ$) away from vertical.

- The wedge is wider at its bottom face ($z = Z$) and narrower at its top face ($z = Z + T$).
- The surrounding fixed top batten and locking lid batten contain complementary undercuts.
- Vertical extraction is geometrically impossible because the wider bottom cannot pass through the narrower top aperture.

### Bevel Normal Offset ($H$)

For stock thickness $T$:

$$H = \text{bevelOffsetNormal} = T \times \tan(\beta)$$

### Compound Taper Top Width Reduction

On the straight fixed-batten face, the horizontal inset at the top is $H$.
On the $\alpha$-tapered face, comparing transverse cross-sections at constant $Y$ introduces a geometric factor $1 / \cos(\alpha) = \sec(\alpha)$.

The total top width reduction of the wedge is:

$$\text{topWidthReduction} = H + \frac{H}{\cos(\alpha)} = H \times (1 + \sec(\alpha))$$

Top widths of the wedge:

- $\text{topNarrowWidth} = \text{bottomNarrowWidth} - \text{topWidthReduction}$
- $\text{topWideWidth} = \text{bottomWideWidth} - \text{topWidthReduction}$

### Positive Vertical Capture Condition

For valid capture:

$$\beta > 0 \quad \text{and} \quad \text{topNarrowWidth} > 0$$

```text
Transverse Cross-Section of Wedge Channel (Z vs X):
Z + T (Top)      │<── Top Width ──>│
                 ┌─────────────────┐
                 │ \             / │  <── Bevel Angle β (10°)
                 │  \   WEDGE   /  │
Z (Bottom)       └───\─────────/───┘
                 │<─ Bottom Width ─>│
             [Locking Batten]    [Fixed Top Batten]
```

---

## 6. Manufacturing Overlength Allowance

In practical woodworking, wedges are cut slightly long and trimmed flush after final hand fitting.

- $\text{recommendedWedgeOverlength} = 2 \times T$ (default $36\text{ mm}$)
- $\text{recommendedWedgeBlankLength} = L + 2T$ (default $332\text{ mm}$)

This allowance is provided for cut lists and material preparation; mechanical geometry and kinematic contacts use the authoritative working length $L$.

---

## 7. Default Reference Worked Example (V2 Default)

For the canonical default design:

- Dimensions: $X = 600\text{ mm}, Y = 300\text{ mm}, Z = 250\text{ mm}, T = 18\text{ mm}$
- Construction parameters: $T_b = 12\text{ mm}, I = 36\text{ mm}, H = 72\text{ mm}, G = 3\text{ mm}, R = 84\text{ mm}, B = 42\text{ mm}, E = 18\text{ mm}, O = 13.5\text{ mm}, C = 2\text{ mm}, P = 12\text{ mm}$
- Locking parameters: $\alpha = 2^\circ, \beta = 10^\circ, Q = 1.0\text{ mm}$

### Calculated Values:

1. **Kinematics & Opening:**
   - Locking opening edge $F = X - R = 516.0\text{ mm}$
   - Available lid travel $D = (84 - 36 - 18) - 13.5 = 16.5\text{ mm}$
   - Working length $L = 260 + 2(18) = 296.0\text{ mm}$
2. **Channel & Bottom Profile:**
   - Minimum channel width $W_{\min} = 16.5 + 1.0 = 17.5\text{ mm}$
   - Taper delta $= 296 \times \tan(2^\circ) \approx 10.33655\text{ mm}$
   - Wedge bottom narrow width $= 17.5\text{ mm}$
   - Wedge bottom wide width $= 17.5 + 10.33655 \approx 27.83655\text{ mm}$
   - Locking lid batten maximum width $= 42.0\text{ mm}$
   - Locking lid batten minimum width $= 42.0 - 10.33655 \approx 31.66345\text{ mm}$
   - Combined locking blank width $= 42.0 + 17.5 = 59.5\text{ mm}$
3. **Bevel Profile & Top Dimensions:**
   - Normal bevel offset $H = 18 \times \tan(10^\circ) \approx 3.17389\text{ mm}$
   - Top width reduction $= 3.17389 \times (1 + \sec(2^\circ)) \approx 6.34971\text{ mm}$
   - Wedge top narrow width $\approx 17.5 - 6.34971 \approx 11.15029\text{ mm}$
   - Wedge top wide width $\approx 27.83655 - 6.34971 \approx 21.48684\text{ mm}$
4. **Physical Coordinates:**
   - Locking batten interior edge $X = 516.0 - 17.5 - 42.0 = 456.5\text{ mm}$
   - Narrow wedge-face $X = 516.0 - 17.5 = 498.5\text{ mm}$
   - Wide wedge-face $X \approx 498.5 - 10.33655 \approx 488.16345\text{ mm}$
5. **Manufacturing:**
   - Combined blank width $= 42.0 + 17.5 = 59.5\text{ mm}$
   - Recommended wedge blank length $= 296 + 36 = 332.0\text{ mm}$
