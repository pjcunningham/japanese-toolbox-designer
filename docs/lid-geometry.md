# Sliding Lid Geometry (Phases 4 & 10A)

This document specifies the authoritative mathematical model and kinematic conventions for the Japanese toolbox sliding lid mechanism.

---

## 1. Coordinate System & Mechanism Orientation

The toolbox coordinates use a right-handed Cartesian system:

- **X axis:** Toolbox length (longitudinal direction, parallel to lid sliding motion).
  - `x = 0`: **Stop end** (where the straight stop lid batten is located).
  - `x = X`: **Locking / wedge end** (where the tapered batten and locking wedge are placed in Phase 5).
- **Y axis:** Toolbox width (transverse direction across long side walls).
- **Z axis:** Toolbox body height (vertical from underside of bottom board to top edge of side/end walls).

```text
x = 0                                                           x = X
Stop End                                                  Locking End
┌───────────────────────────────────────────────────────────────────┐
│ [Fixed Top Batten]                               [Fixed Top Batten]│
│                                                                   │
│                     Top Opening (Length = X - 2R)                 │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 2. Symbols & Parameters

### Primary Dimensions

- $X$: Outside toolbox length (`dimensions.length`)
- $Y$: Outside toolbox width (`dimensions.width`)
- $Z$: Outside body height (`dimensions.height`)
- $T$: Main stock thickness (`dimensions.stockThickness`)
- $T_b$: Bottom thickness (`constructionParameters.bottomThickness`)
- $I$: End handle depth / end-wall inset (`constructionParameters.endHandleDepth`)
- $R$: Fixed top batten width (`constructionParameters.fixedTopBattenWidth`)

### Lid Parameters

- $P$: Lid panel thickness (`constructionParameters.lidThickness`)
- $C$: Lid side clearance per side (`constructionParameters.lidSideClearance`)
- $O$: Desired locked longitudinal overlap per end (`constructionParameters.desiredOverlap`)
- $B$: Lid batten width (`constructionParameters.lidBattenWidth`)
- $E$: Lid batten overhang beyond lid panel edge per side (`constructionParameters.lidBattenOverhang`)

---

## 3. Box Clear Opening & Pocket Depth

From the traditional inset-end carcass geometry (Phase 10A):

$$\text{topOpeningLength} = X - 2R$$

$$\text{topOpeningWidth} = Y - 2T$$

$$\text{pocketDepth} = R - I - T$$

### Physical Interpretation of Pocket Depth

Each fixed top batten spans from the outside end ($x = 0$ or $x = X$) and projects past the inner face of the inset end wall ($x = I + T$ or $x = X - I - T$) into the internal cavity by:

$$\text{pocketDepth} = R - (I + T) = R - I - T$$

In longitudinal cross-section:

```text
Outside End (x=0)                          Box Interior (x > I+T)
│
│<────────────────── R fixed top batten / end cap ───────────────────>│
│                                                                     │
│<── I handle bay ──>│<── T end wall ──>│                             │
                                        │<─────── R - I - T ─────────>│
                                                   lid pocket
```

The lid panel can slide underneath this pocket, but cannot pass through the inset end wall ($x = I + T$ or $x = X - I - T$).

For the V2 default ($R = 84\text{ mm}, I = 36\text{ mm}, T = 18\text{ mm}$):
$$\text{pocketDepth} = 84 - 36 - 18 = 30\text{ mm}$$

---

## 4. Lid Panel Dimensions

- **Width:** Fits inside the long side walls with clearance $C$ on each side:
  $$\text{lidPanelWidth} = \text{topOpeningWidth} - 2C = Y - 2T - 2C$$

- **Length:** Spans the clear opening plus locked overlap $O$ underneath both fixed top battens:
  $$\text{lidPanelLength} = \text{topOpeningLength} + 2O = X - 2R + 2O$$

- **Thickness:** $P$

For the V2 default ($X=600, Y=300, R=84, T=18, C=2, O=13.5, P=12\text{ mm}$):

- $\text{lidPanelWidth} = 300 - 36 - 4 = 260\text{ mm}$
- $\text{lidPanelLength} = (600 - 168) + 2(13.5) = 432 + 27 = 459\text{ mm}$
- $\text{lidPanelDimensions} = 459 \times 260 \times 12\text{ mm}$

---

## 5. Straight Lid Batten

The stop end features a straight rectangular batten attached to the upper face of the lid panel.

- **Blank Dimensions:**
  - $\text{Length} = \text{lidPanelWidth} + 2E$
  - $\text{Width} = B$
  - $\text{Thickness} = T$
  - $\text{Quantity} = 1$ (locking batten is added in Phase 5)

- **Position relative to lid panel:**
  - Stop-facing edge is located at distance $O$ from the stop end of the lid panel.
  - In the locked state, this edge contacts the inner edge of the stop-end fixed top batten ($x = R$), serving as a positive stop.

- **Side-Wall Bearing:**
  The lid battens overhang the panel and bear on top of the carcass side walls:
  $$\text{sideWallBearingPerSide} = \min(\max(E - C, 0), T)$$
  $$\text{outsideInsetPerSide} = \max((T + C) - E, 0)$$
  $$\text{outsideProjectionPerSide} = \max(E - (T + C), 0)$$

---

## 6. Vertical Datum Conventions

- Lid panel sits immediately below the batten level:
  $$\text{lidPanelTopZ} = Z$$
  $$\text{lidPanelBottomZ} = Z - P$$

- Lid battens sit flush with the top of the side walls and fixed top battens:
  $$\text{lidBattenBottomZ} = Z$$
  $$\text{lidBattenTopZ} = Z + T$$

- Lid vertical clearance check:
  $$P < Z - T_b$$

---

## 7. Release Kinematics & Fundamental Inequality

### Removal Motion

To remove the lid (after the locking wedge is removed), the rigid lid is slid in the **$+X$ direction** towards the locking end.

1. **Travel to Release Edge:**
   The stop end moves towards the clear opening edge ($x = R$):
   $$\text{travelToReleaseEdge} = O$$
   At this position, stop overlap is $0$, and locking overlap is $2O$.

2. **Maximum Available Travel:**
   The locking-end edge can slide until it contacts the inner face of the locking inset end wall ($x = X - I - T$):
   $$\text{availableLidTravel} = \text{pocketDepth} - O = (R - I - T) - O$$

3. **Release Travel Margin:**
   The positive clearance at the stop end once fully shifted:
   $$\text{releaseTravelMargin} = \text{availableLidTravel} - \text{travelToReleaseEdge} = (R - I - T) - 2O$$

### Fundamental Rigid Release Condition

For a rigid lid to be lifted and removed without flexing or bending:

$$\text{releaseTravelMargin} > 0 \iff 2O < R - I - T$$

Strict inequality is required because $2O = R - I - T$ yields zero clearance, making physical lifting impossible.

For the V2 default ($O = 13.5\text{ mm}, \text{pocketDepth} = 30\text{ mm}$):

- $\text{availableLidTravel} = 30 - 13.5 = 16.5\text{ mm}$
- $\text{releaseTravelMargin} = 30 - 2(13.5) = 3\text{ mm}$

---

## 8. Reference Kinematic States (V2 Default)

### 1. LOCKED ($\Delta x = 0$)

- $\text{stopOverlap} = 13.5\text{ mm}$
- $\text{lockingOverlap} = 13.5\text{ mm}$
- $\text{stopReleaseClearance} = 0\text{ mm}$
- Panel range: $[R - O,\; X - R + O] = [70.5,\; 529.5]$
- Straight batten range: $[R,\; R + B] = [84,\; 126]$

### 2. RELEASE_THRESHOLD ($\Delta x = O = 13.5\text{ mm}$)

- $\text{stopOverlap} = 0\text{ mm}$
- $\text{lockingOverlap} = 2O = 27\text{ mm}$
- $\text{stopReleaseClearance} = 0\text{ mm}$
- Panel range: $[R,\; X - R + 2O] = [84,\; 543]$
- Straight batten range: $[R + O,\; R + O + B] = [97.5,\; 139.5]$

### 3. SHIFTED_FOR_RELEASE ($\Delta x = (R - I - T) - O = 16.5\text{ mm}$)

- $\text{stopOverlap} = 0\text{ mm}$
- $\text{lockingOverlap} = R - I - T = 30\text{ mm} = \text{pocketDepth}$
- $\text{stopReleaseClearance} = 3\text{ mm} = \text{releaseTravelMargin}$
- Panel range: $[87,\; 546]$ ($546 = X - I - T$, contacting locking inset wall)
- Straight batten range: $[100.5,\; 142.5]$
