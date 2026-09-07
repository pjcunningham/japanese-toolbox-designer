# Japanese Toolbox Carcass Geometry (V2 Inset-End Construction)

This document specifies the authoritative domain geometry for the traditional inset-end Japanese toolbox carcass introduced in Phase 10A (Schema Version 2).

---

## 1. Coordinate Conventions

The application uses a right-handed conceptual coordinate system:

- **+X**: Toolbox longitudinal axis (parallel to sliding lid movement).
  - `x = 0`: **Stop End** (straight lid batten / closed lid stop).
  - `x = X`: **Locking / Wedge End** (locking batten and removable wedge).
- **+Y**: Toolbox transverse axis (width across long side boards).
- **+Z**: Toolbox vertical axis (from underside of bottom board upwards).

```text
       Z (Height)
       ^
       |
       |       X (Length: 0 = Stop, X = Locking)
       +-------->
      /
     /
    v Y (Width)
```

---

## 2. Toolbox Dimensions & Primary Parameters

The user-specified outside dimensions $(X \times Y \times Z)$ represent the extreme dimensions of the main box body:

- $X = \text{length}$: extreme outside length of the long side boards.
- $Y = \text{width}$: extreme outside width across the long side boards.
- $Z = \text{height}$: extreme height from underside of bottom board to top of side/end walls.

### Material & Construction Parameters

| Parameter             | Symbol | Description                                      | Default ($T=18\text{ mm}$) |
| :-------------------- | :----: | :----------------------------------------------- | :------------------------- |
| `stockThickness`      |  $T$   | Main side, end wall, and batten stock thickness  | $18\text{ mm}$             |
| `bottomThickness`     | $T_b$  | Bottom board thickness                           | $12\text{ mm}$             |
| `endHandleDepth`      |  $I$   | End-wall inset depth / handle longitudinal depth | $36\text{ mm}$             |
| `endHandleHeight`     |  $H$   | Handle vertical height                           | $72\text{ mm}$             |
| `housingDadoDepth`    |  $G$   | Depth of shallow housing dado in side boards     | $3\text{ mm}$              |
| `fixedTopBattenWidth` |  $R$   | End-cap / fixed top batten width                 | $84\text{ mm}$             |

The fixed top battens (end caps) sit above $Z$, making overall height:
$$\text{overallHeightWithTopBattens} = Z + T$$

---

## 3. Longitudinal Construction & Inset End Walls

Rather than placing end walls flush at $x=0$ and $x=X$, the end walls are inset longitudinally by $I$ from each extreme end.

```text
x = 0            x = I        x = I+T                           x = X-I-T      x = X-I          x = X
+----------------+------------+---------------------------------+--------------+----------------+
|   STOP BAY     | STOP END   |        INTERNAL CAVITY          | LOCKING END  |  LOCKING BAY   |
| (Handle x=0..I)| WALL       |                                 | WALL         | (Handle)       |
+----------------+------------+---------------------------------+--------------+----------------+
                 |<-   T    ->|                                 |<-    T     ->|
|<--     I    -->|                                                             |<--     I    -->|
```

### Physical Longitudinal Positions

- **Stop Handle Bay**: $x \in [0, I]$
- **Stop End Wall**: $x \in [I, I + T]$
  - Outside face: $x = I$
  - Inside face: $x = I + T$
- **Internal Cavity**: $x \in [I + T, X - I - T]$
- **Locking End Wall**: $x \in [X - I - T, X - I]$
  - Inside face: $x = X - I - T$
  - Outside face: $x = X - I$
- **Locking Handle Bay**: $x \in [X - I, X]$

### Internal Dimensions

$$\text{internalLength} = X - 2(I + T)$$
$$\text{internalWidth} = Y - 2T$$
$$\text{internalHeight} = Z - T_b$$

For default dimensions ($600 \times 300 \times 250\text{ mm}$):

- $\text{internalLength} = 600 - 2(36 + 18) = 492\text{ mm}$
- $\text{internalWidth} = 300 - 2(18) = 264\text{ mm}$
- $\text{internalHeight} = 250 - 12 = 238\text{ mm}$

---

## 4. Housing Dados & End-Wall Blank Length

The two inset end walls are housed into shallow dados cut into the inner faces of the long side boards.

- **Clear distance between inner faces**: $Y - 2T$
- **Housing dado depth per side**: $G$
- **End-Wall Blank Length**:
  $$\text{endWallLength} = Y - 2T + 2G$$

For default dimensions:
$$\text{endWallLength} = 300 - 36 + 6 = 270\text{ mm}$$

### Housing Dado Extents

- **Width along X**: $T$
- **Depth along Y**: $G$ into the side walls ($y \in [T-G, T]$ and $y \in [Y-T, Y-T+G]$)
- **Vertical extent**: $z \in [T_b, Z]$ (height $Z - T_b$)

---

## 5. Solid Grab Handles

A solid wooden grab handle block is mounted at each end spanning between the inner faces of the side boards.

- **Blank dimensions**: $(Y - 2T) \times H \times I$ (Quantity: 2)
  - Length: $Y - 2T$ (transverse across Y)
  - Width: $H$ (vertical height)
  - Thickness: $I$ (longitudinal depth)
- **Positions**:
  - Top-aligned with carcass sides ($z \in [Z - H, Z]$)
  - Mounted in handle bays ($x \in [0, I]$ at stop end, $x \in [X - I, X]$ at locking end)
  - Clear hand-opening below each handle: $z \in [T_b, Z - H]$

For default dimensions:

- Handle blank: $264 \times 72 \times 36\text{ mm}$
- Stop handle: $X \in [0, 36], Y \in [18, 282], Z \in [178, 250]$
- Locking handle: $X \in [564, 600], Y \in [18, 282], Z \in [178, 250]$

---

## 6. End Caps & Corrected Lid Pocket Depth

Two fixed top battens / end caps span the full width $Y$ flush with the box ends:

- **Blank dimensions**: $Y \times R \times T$ (Quantity: 2)
- **Stop End Cap**: $x \in [0, R], y \in [0, Y], z \in [Z, Z + T]$
- **Locking End Cap**: $x \in [X - R, X], y \in [0, Y], z \in [Z, Z + T]$
- **Clear Top Opening**:
  $$\text{topOpeningLength} = X - 2R$$
  $$\text{topOpeningWidth} = Y - 2T$$

### Corrected Pocket Depth

Because the end walls are inset by $I$, the inner face of the end wall is at $I + T$. The fixed top batten projects beyond this inner face into the internal cavity by:

$$\text{pocketDepth} = R - (I + T) = R - I - T$$

For default dimensions:
$$\text{pocketDepth} = 84 - 36 - 18 = 30\text{ mm}$$

---

## 7. Complete Carcass Part Breakdown (V2 Default)

Finished physical parts in the main carcass:

| Part                           | Quantity | Blank Dimensions ($L \times W \times T$) |
| :----------------------------- | :------: | :--------------------------------------- |
| **Side board**                 |    2     | $600 \times 238 \times 18\text{ mm}$     |
| **End wall**                   |    2     | $270 \times 238 \times 18\text{ mm}$     |
| **Bottom board**               |    1     | $600 \times 300 \times 12\text{ mm}$     |
| **Fixed top batten (End cap)** |    2     | $300 \times 84 \times 18\text{ mm}$      |
| **Solid grab handle**          |    2     | $264 \times 72 \times 36\text{ mm}$      |

Total finished physical parts across complete toolbox: **13 parts** (9 carcass parts + 4 lid/locking parts).
