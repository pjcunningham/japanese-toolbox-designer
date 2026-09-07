import type { ToolboxDesign } from './design';

/**
 * ---------------------------------------------------------------------------
 * Core Box & Sliding Lid Geometry (Phases 3, 4, 5 & 10A)
 * ---------------------------------------------------------------------------
 *
 * AUTHORITATIVE WOODWORKING GEOMETRY CONVENTIONS:
 *
 * 1. Coordinate System (Right-handed conceptual space):
 *    - X: Toolbox length (parallel to sliding lid movement).
 *         x = 0 is the STOP END (contains straight lid batten).
 *         x = X is the LOCKING/WEDGE END (contains locking batten and wedge).
 *    - Y: Toolbox width (front/back across toolbox width).
 *    - Z: Toolbox body height (vertical from underside of bottom board to top of side/end walls).
 *
 * 2. V2 Traditional Inset-End Carcass Construction:
 *    - The user-specified dimensions (X, Y, Z) define the outside dimensions of the main box body.
 *    - T  = Main stock thickness (`design.dimensions.stockThickness`).
 *    - Tb = Bottom thickness (`design.constructionParameters.bottomThickness`).
 *    - I  = End handle depth / end-wall inset (`design.constructionParameters.endHandleDepth`).
 *    - H  = End handle height (`design.constructionParameters.endHandleHeight`).
 *    - G  = Housing dado depth (`design.constructionParameters.housingDadoDepth`).
 *    - R  = Fixed top batten / end-cap width (`design.constructionParameters.fixedTopBattenWidth`).
 *    - Bottom board is full-size underneath the carcass:
 *      blank = X × Y × Tb (quantity: 1).
 *    - Long side boards run full length X, attached on top of the bottom board:
 *      blank = X × (Z - Tb) × T (quantity: 2).
 *    - End walls are inset from ends by I and housed into shallow dados of depth G in the side walls:
 *      blank = (Y - 2T + 2G) × (Z - Tb) × T (quantity: 2).
 *    - Solid grab handles fit between side walls at each end:
 *      blank = (Y - 2T) × H × I (quantity: 2).
 *    - Fixed top battens / end caps (quantity: 2) sit ON TOP of the carcass body flush with each end:
 *      blank = Y × R × T (quantity: 2).
 *    - Absolute height including fixed top battens = Z + T.
 *
 * 3. Interior & Clear Opening Dimensions:
 *    - Internal length = X - 2(I + T) (distance between inner faces of inset end walls).
 *    - Internal width = Y - 2T (between inner faces of long side walls).
 *    - Internal height = Z - Tb (from top of bottom board to top of side/end walls).
 *    - Clear top opening length = X - 2R (along X between inner edges of fixed top battens).
 *    - Clear top opening width = Y - 2T.
 *    - Fixed top batten interior projection (pocket depth) = R - I - T (projection past inset end wall).
 *
 * 4. Sliding Lid Construction & Kinematics (Phase 4):
 *    - P = Lid panel thickness (`design.constructionParameters.lidThickness`).
 *    - C = Lid side clearance PER SIDE (`design.constructionParameters.lidSideClearance`).
 *    - O = Desired/locked longitudinal overlap PER END (`design.constructionParameters.desiredOverlap`).
 *    - B = Lid batten width (`design.constructionParameters.lidBattenWidth`).
 *    - E = Lid batten overhang beyond lid panel edge PER SIDE (`design.constructionParameters.lidBattenOverhang`).
 *    - Lid panel width = topOpeningWidth - 2C = Y - 2T - 2C.
 *    - Lid panel length = topOpeningLength + 2O = X - 2R + 2O.
 *    - Straight lid batten blank = (lidPanelWidth + 2E) × B × T (quantity: 1).
 *    - Straight lid batten attaches to lid panel at distance O from stop end.
 *    - Side-wall bearing per side = min(max(E - C, 0), T).
 *    - Available lid travel = pocketDepth - O = (R - I - T) - O.
 *    - Travel to release threshold = O.
 *    - Release travel margin = availableLidTravel - travelToReleaseEdge = (R - I - T) - 2O.
 *    - Fundamental rigid release condition: 2O < R - I - T (or releaseTravelMargin > 0).
 *    - Lid removal motion is purely longitudinal in +X direction without flexing or bending.
 *
 * 5. Locking Mechanism & Captured Wedge Geometry (Phase 5):
 *    - The locking mechanism consists of:
 *      1. Locking-end fixed top batten on the carcass body (inner edge bevelled by beta).
 *      2. Locking lid batten on the lid (tapered in plan by alpha, compound bevel beta).
 *      3. Removable locking wedge between them (tapered in plan by alpha, bevelled on both sides by beta).
 *    - alpha = wedge plan taper angle (`design.constructionParameters.wedgeTaperAngle`).
 *    - beta = wedge vertical bevel angle (`design.constructionParameters.wedgeBevelAngle`).
 *    - Q = locking batten travel clearance (`design.constructionParameters.lockingBattenTravelClearance`).
 *    - Working length L = locking batten length = lidBattenLength = lidPanelWidth + 2E.
 *    - Available lid travel D = (R - I - T) - O.
 *    - Minimum wedge channel bottom width: Wmin = D + Q.
 *    - Residual minimum gap after full lid shift = Wmin - D = Q (> 0).
 *    - Plan taper delta = L * tan(alpha).
 *    - Locking batten finished widths: maximum = B, minimum = B - taperDelta.
 *    - Wedge plan widths (bottom face): narrow = Wmin, wide = Wmin + taperDelta.
 *    - One-blank manufacturing invariant: combined width = B + Wmin = lockingBattenMinimumWidth + wedgeBottomWideWidth.
 *    - Vertical captured bevel offset: H = T * tan(beta).
 *    - Top width reduction: topWidthReduction = H * (1 + sec(alpha)) = H * (1 + 1 / cos(alpha)).
 *    - Wedge top widths: topNarrowWidth = Wmin - topWidthReduction, topWideWidth = bottomWideWidth - topWidthReduction.
 *    - Capture condition: beta > 0 and topNarrowWidth > 0 ensure the wider bottom prevents vertical extraction.
 *    - Recommended wedge blank length: L + 2T (including 2T overlength allowance for fitting/trimming).
 *
 * 6. Units & Precision:
 *    - All calculations are pure, deterministic, and use canonical millimetres directly.
 *    - No display rounding or precision truncation is performed in the geometry engine.
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface PartDimensions {
  length: number;
  width: number;
  thickness: number;
}

export interface BoxEndWallCoordinates {
  startX: number;
  endX: number;
  outsideFaceX: number;
  insideFaceX: number;
}

export interface BoxHandleCoordinates {
  startX: number;
  endX: number;
  startY: number;
  endY: number;
  startZ: number;
  endZ: number;
}

export interface BoxHandleBayCoordinates {
  startX: number;
  endX: number;
}

export interface HousingDadoRange {
  startY: number;
  endY: number;
}

export interface HousingDadoCoordinates {
  width: number;
  depth: number;
  verticalStart: number;
  verticalEnd: number;
  stopEnd: {
    startX: number;
    endX: number;
    frontY: HousingDadoRange;
    backY: HousingDadoRange;
  };
  lockingEnd: {
    startX: number;
    endX: number;
    frontY: HousingDadoRange;
    backY: HousingDadoRange;
  };
}

export interface CalculatedBoxLayout {
  endWalls: {
    stop: BoxEndWallCoordinates;
    locking: BoxEndWallCoordinates;
  };
  handles: {
    stop: BoxHandleCoordinates;
    locking: BoxHandleCoordinates;
  };
  handleBays: {
    stop: BoxHandleBayCoordinates;
    locking: BoxHandleBayCoordinates;
  };
  housingDados: HousingDadoCoordinates;
}

export interface CalculatedBoxGeometry {
  outside: {
    length: number;
    width: number;
    bodyHeight: number;
    overallHeightWithTopBattens: number;
  };
  internal: {
    length: number;
    width: number;
    height: number;
  };
  parts: {
    side: {
      quantity: 2;
      dimensions: PartDimensions;
    };
    end: {
      quantity: 2;
      dimensions: PartDimensions;
    };
    bottom: {
      quantity: 1;
      dimensions: PartDimensions;
    };
    fixedTopBatten: {
      quantity: 2;
      dimensions: PartDimensions;
    };
    handle: {
      quantity: 2;
      dimensions: PartDimensions;
    };
  };
  topOpening: {
    length: number;
    width: number;
    battenInteriorProjection: number;
  };
  layout: CalculatedBoxLayout;
}

export type LidStateName = 'locked' | 'releaseThreshold' | 'shiftedForRelease';

export interface LidStateCoordinates {
  name: LidStateName;
  translationFromLocked: number;
  panel: {
    startX: number;
    endX: number;
  };
  straightLidBatten: {
    startX: number;
    endX: number;
  };
  stopEndOverlap: number;
  lockingEndOverlap: number;
  stopEndReleaseClearance: number;
}

export interface CalculatedLidGeometry {
  panel: {
    dimensions: PartDimensions;
  };
  straightLidBatten: {
    quantity: 1;
    dimensions: PartDimensions;
    startFromPanelEnd: number;
  };
  vertical: {
    lidPanelTopZ: number;
    lidPanelBottomZ: number;
    lidBattenBottomZ: number;
    lidBattenTopZ: number;
  };
  lateralFit: {
    clearancePerSide: number;
    battenBearingPerSide: number;
    outsideInsetPerSide: number;
    outsideProjectionPerSide: number;
  };
  longitudinalFit: {
    lockedOverlapPerEnd: number;
    pocketDepth: number;
    travelToReleaseEdge: number;
    availableTravel: number;
    releaseTravelMargin: number;
  };
  openingEdges: {
    stopOpeningEdgeX: number;
    lockingOpeningEdgeX: number;
  };
  states: {
    locked: LidStateCoordinates;
    releaseThreshold: LidStateCoordinates;
    shiftedForRelease: LidStateCoordinates;
  };
}

export interface CalculatedLockingMechanismGeometry {
  lockingFixedTopBatten: {
    dimensions: PartDimensions;
    bevelAngle: number;
    bevelOffsetNormal: number;
    innerEdgeX: number;
  };
  lockingLidBatten: {
    blankDimensions: PartDimensions;
    maximumWidth: number;
    minimumWidth: number;
    taperDelta: number;
    interiorEdgeX: number;
    narrowEndWedgeFaceX: number;
    wideEndWedgeFaceX: number;
    planCorners: {
      interiorNarrowCorner: Point2D;
      interiorWideCorner: Point2D;
      wedgeNarrowCorner: Point2D;
      wedgeWideCorner: Point2D;
    };
  };
  wedge: {
    workingLength: number;
    recommendedBlankLength: number;
    recommendedOverlength: number;
    blankDimensions: PartDimensions;
    bottomNarrowWidth: number;
    bottomWideWidth: number;
    topNarrowWidth: number;
    topWideWidth: number;
    taperAngle: number;
    bevelAngle: number;
    bevelOffsetNormalPerSide: number;
    taperRate: number;
    insertionDirection: '+Y';
    planCorners: {
      fixedBattenNarrowCorner: Point2D;
      fixedBattenWideCorner: Point2D;
      battenMatingNarrowCorner: Point2D;
      battenMatingWideCorner: Point2D;
    };
  };
  channel: {
    minimumBottomWidth: number;
    maximumBottomWidth: number;
    residualGapAfterFullLidShift: number;
  };
  capture: {
    topWidthReduction: number;
    verticallyCaptured: boolean;
  };
  vertical: {
    wedgeBottomZ: number;
    wedgeTopZ: number;
    lockingBattenBottomZ: number;
    lockingBattenTopZ: number;
  };
  manufacturing: {
    combinedLockingBlankWidth: number;
    recommendedWedgeOverlength: number;
    recommendedWedgeBlankLength: number;
  };
}

export interface CalculatedToolboxGeometry {
  box: CalculatedBoxGeometry;
  lid: CalculatedLidGeometry;
  lockingMechanism: CalculatedLockingMechanismGeometry;
}

export type GeometryErrorCode =
  | 'INVALID_LENGTH'
  | 'INVALID_WIDTH'
  | 'INVALID_HEIGHT'
  | 'INVALID_STOCK_THICKNESS'
  | 'INVALID_BOTTOM_THICKNESS'
  | 'INVALID_END_HANDLE_DEPTH'
  | 'INVALID_END_HANDLE_HEIGHT'
  | 'INVALID_HOUSING_DADO_DEPTH'
  | 'INVALID_FIXED_TOP_BATTEN_WIDTH'
  | 'LENGTH_TOO_SMALL'
  | 'LENGTH_TOO_SMALL_FOR_INSET_ENDS'
  | 'WIDTH_TOO_SMALL'
  | 'HEIGHT_TOO_SMALL'
  | 'BOTTOM_TOO_THICK'
  | 'END_HANDLE_TOO_TALL'
  | 'HOUSING_DADO_TOO_DEEP'
  | 'FIXED_TOP_BATTENS_TOO_WIDE'
  | 'FIXED_TOP_BATTEN_TOO_NARROW'
  | 'INVALID_LID_THICKNESS'
  | 'LID_TOO_THICK'
  | 'INVALID_LID_SIDE_CLEARANCE'
  | 'LID_SIDE_CLEARANCE_TOO_LARGE'
  | 'INVALID_LID_OVERLAP'
  | 'INSUFFICIENT_LID_RELEASE_TRAVEL'
  | 'INVALID_LID_BATTEN_WIDTH'
  | 'LID_BATTEN_TOO_WIDE'
  | 'INVALID_LID_BATTEN_OVERHANG'
  | 'LID_BATTEN_HAS_NO_SIDE_BEARING'
  | 'INVALID_LOCKING_BATTEN_TRAVEL_CLEARANCE'
  | 'INVALID_WEDGE_TAPER_ANGLE'
  | 'INVALID_WEDGE_BEVEL_ANGLE'
  | 'WEDGE_TAPER_TOO_STEEP_FOR_LID_BATTEN'
  | 'WEDGE_BEVEL_TOO_STEEP_FOR_WIDTH'
  | 'LOCKING_LID_BATTEN_OUTSIDE_PANEL'
  | 'LID_BATTENS_OVERLAP'
  | 'LOCKING_BATTEN_RESTRICTS_LID_TRAVEL';

export interface GeometryError {
  code: GeometryErrorCode;
  message: string;
}

export interface GeometryWarning {
  code: string;
  message: string;
}

export type BoxGeometryResult =
  | {
      ok: true;
      geometry: CalculatedBoxGeometry;
      warnings: GeometryWarning[];
    }
  | {
      ok: false;
      errors: GeometryError[];
      warnings: GeometryWarning[];
    };

export type LidGeometryResult =
  | {
      ok: true;
      geometry: CalculatedLidGeometry;
      warnings: GeometryWarning[];
    }
  | {
      ok: false;
      errors: GeometryError[];
      warnings: GeometryWarning[];
    };

export type LockingMechanismGeometryResult =
  | {
      ok: true;
      geometry: CalculatedLockingMechanismGeometry;
      warnings: GeometryWarning[];
    }
  | {
      ok: false;
      errors: GeometryError[];
      warnings: GeometryWarning[];
    };

export type ToolboxGeometryResult =
  | {
      ok: true;
      geometry: CalculatedToolboxGeometry;
      warnings: GeometryWarning[];
    }
  | {
      ok: false;
      errors: GeometryError[];
      warnings: GeometryWarning[];
    };

/**
 * Backward compatibility alias for BoxGeometryResult.
 */
export type GeometryResult = BoxGeometryResult;

/**
 * Validates the core box parameters for physical feasibility.
 * Accumulates all relevant validation errors across fields.
 */
export function validateBoxGeometry(design: ToolboxDesign): {
  errors: GeometryError[];
  warnings: GeometryWarning[];
} {
  const errors: GeometryError[] = [];
  const warnings: GeometryWarning[] = [];

  const { length: x, width: y, height: z, stockThickness: t } = design.dimensions;
  const {
    bottomThickness: tb,
    endHandleDepth: i,
    endHandleHeight: h,
    housingDadoDepth: g,
    fixedTopBattenWidth: r,
  } = design.constructionParameters;

  // 1. Basic finite & positive checks
  if (!Number.isFinite(x) || x <= 0) {
    errors.push({
      code: 'INVALID_LENGTH',
      message: 'Toolbox length must be a finite number greater than 0.',
    });
  }
  if (!Number.isFinite(y) || y <= 0) {
    errors.push({
      code: 'INVALID_WIDTH',
      message: 'Toolbox width must be a finite number greater than 0.',
    });
  }
  if (!Number.isFinite(z) || z <= 0) {
    errors.push({
      code: 'INVALID_HEIGHT',
      message: 'Toolbox height must be a finite number greater than 0.',
    });
  }
  if (!Number.isFinite(t) || t <= 0) {
    errors.push({
      code: 'INVALID_STOCK_THICKNESS',
      message: 'Stock thickness must be a finite number greater than 0.',
    });
  }
  if (!Number.isFinite(tb) || tb <= 0) {
    errors.push({
      code: 'INVALID_BOTTOM_THICKNESS',
      message: 'Bottom thickness must be a finite number greater than 0.',
    });
  }
  if (!Number.isFinite(i) || i <= 0) {
    errors.push({
      code: 'INVALID_END_HANDLE_DEPTH',
      message: 'End handle depth must be a finite number greater than 0.',
    });
  }
  if (!Number.isFinite(h) || h <= 0) {
    errors.push({
      code: 'INVALID_END_HANDLE_HEIGHT',
      message: 'End handle height must be a finite number greater than 0.',
    });
  }
  if (!Number.isFinite(g) || g <= 0) {
    errors.push({
      code: 'INVALID_HOUSING_DADO_DEPTH',
      message: 'Housing dado depth must be a finite number greater than 0.',
    });
  }
  if (!Number.isFinite(r) || r <= 0) {
    errors.push({
      code: 'INVALID_FIXED_TOP_BATTEN_WIDTH',
      message: 'Fixed top batten width must be a finite number greater than 0.',
    });
  }

  // 2. Relational carcass constraints (only evaluate when relevant inputs are finite and positive)
  const isXValid = Number.isFinite(x) && x > 0;
  const isYValid = Number.isFinite(y) && y > 0;
  const isZValid = Number.isFinite(z) && z > 0;
  const isTValid = Number.isFinite(t) && t > 0;
  const isTbValid = Number.isFinite(tb) && tb > 0;
  const isIValid = Number.isFinite(i) && i > 0;
  const isHValid = Number.isFinite(h) && h > 0;
  const isGValid = Number.isFinite(g) && g > 0;
  const isRValid = Number.isFinite(r) && r > 0;

  if (isTbValid && isZValid && tb >= z) {
    errors.push({
      code: 'BOTTOM_TOO_THICK',
      message:
        'Bottom thickness must be less than toolbox body height (Tb < Z) to leave positive wall height.',
    });
  }

  if (isXValid && isIValid && isTValid && x <= 2 * (i + t)) {
    errors.push({
      code: 'LENGTH_TOO_SMALL_FOR_INSET_ENDS',
      message:
        'Toolbox length must be greater than 2x (end handle depth + stock thickness) (X > 2(I + T)) to leave an internal cavity.',
    });
  }

  if (isYValid && isTValid && y <= 2 * t) {
    errors.push({
      code: 'WIDTH_TOO_SMALL',
      message: 'Toolbox width must be greater than 2x stock thickness (Y > 2T) for internal space.',
    });
  }

  if (isZValid && isTbValid && z <= tb) {
    if (!errors.some((e) => e.code === 'BOTTOM_TOO_THICK')) {
      errors.push({
        code: 'HEIGHT_TOO_SMALL',
        message:
          'Toolbox height must be greater than bottom thickness (Z > Tb) for internal space.',
      });
    }
  }

  if (isHValid && isZValid && isTbValid && z > tb && h >= z - tb) {
    errors.push({
      code: 'END_HANDLE_TOO_TALL',
      message:
        'End handle height must be less than internal body height (H < Z - Tb) to leave a hand grip opening.',
    });
  }

  if (isGValid && isTValid && g >= t) {
    errors.push({
      code: 'HOUSING_DADO_TOO_DEEP',
      message:
        'Housing dado depth must be less than side stock thickness (G < T) to avoid cutting through the side wall.',
    });
  }

  if (isRValid && isIValid && isTValid && r <= i + t) {
    errors.push({
      code: 'FIXED_TOP_BATTEN_TOO_NARROW',
      message:
        'Fixed top batten width must be greater than end handle depth plus stock thickness (R > I + T) to project inside the inset end wall.',
    });
  }

  if (isRValid && isXValid && 2 * r >= x) {
    errors.push({
      code: 'FIXED_TOP_BATTENS_TOO_WIDE',
      message:
        'Combined fixed top batten widths must be less than toolbox length (2R < X) to leave a top opening.',
    });
  }

  return { errors, warnings };
}

/**
 * Validates the sliding lid parameters for physical feasibility.
 * Enforces non-flexing rigid removal condition (2O < R - I - T).
 */
export function validateLidGeometry(design: ToolboxDesign): {
  errors: GeometryError[];
  warnings: GeometryWarning[];
} {
  const errors: GeometryError[] = [];
  const warnings: GeometryWarning[] = [];

  const { length: x, width: y, height: z, stockThickness: t } = design.dimensions;
  const {
    bottomThickness: tb,
    endHandleDepth: i,
    lidThickness: p,
    lidSideClearance: c,
    desiredOverlap: o,
    lidBattenWidth: b,
    lidBattenOverhang: e,
    fixedTopBattenWidth: r,
  } = design.constructionParameters;

  // 1. Basic finite & range checks
  if (!Number.isFinite(p) || p <= 0) {
    errors.push({
      code: 'INVALID_LID_THICKNESS',
      message: 'Lid thickness must be a finite number greater than 0.',
    });
  }

  if (!Number.isFinite(c) || c < 0) {
    errors.push({
      code: 'INVALID_LID_SIDE_CLEARANCE',
      message: 'Lid side clearance per side must be a finite number greater than or equal to 0.',
    });
  }

  if (!Number.isFinite(o) || o <= 0) {
    errors.push({
      code: 'INVALID_LID_OVERLAP',
      message: 'Lid desired overlap per end must be a finite number greater than 0.',
    });
  }

  if (!Number.isFinite(b) || b <= 0) {
    errors.push({
      code: 'INVALID_LID_BATTEN_WIDTH',
      message: 'Lid batten width must be a finite number greater than 0.',
    });
  }

  if (!Number.isFinite(e) || e < 0) {
    errors.push({
      code: 'INVALID_LID_BATTEN_OVERHANG',
      message: 'Lid batten overhang per side must be a finite number greater than or equal to 0.',
    });
  }

  // 2. Relational lid constraints (evaluated only when prerequisite inputs are valid)
  const isPValid = Number.isFinite(p) && p > 0;
  const isCValid = Number.isFinite(c) && c >= 0;
  const isOValid = Number.isFinite(o) && o > 0;
  const isBValid = Number.isFinite(b) && b > 0;
  const isEValid = Number.isFinite(e) && e >= 0;

  const isXValid = Number.isFinite(x) && x > 0;
  const isYValid = Number.isFinite(y) && y > 0;
  const isZValid = Number.isFinite(z) && z > 0;
  const isTValid = Number.isFinite(t) && t > 0;
  const isTbValid = Number.isFinite(tb) && tb > 0;
  const isIValid = Number.isFinite(i) && i > 0;
  const isRValid = Number.isFinite(r) && r > 0;

  // P < Z - Tb (lid panel fits vertically inside the box body)
  if (isPValid && isZValid && isTbValid && z > tb && p >= z - tb) {
    errors.push({
      code: 'LID_TOO_THICK',
      message:
        'Lid thickness must be less than internal body height (P < Z - Tb) to prevent colliding with the bottom.',
    });
  }

  // 2C < Y - 2T (lid panel width > 0)
  if (isCValid && isYValid && isTValid && y > 2 * t && 2 * c >= y - 2 * t) {
    errors.push({
      code: 'LID_SIDE_CLEARANCE_TOO_LARGE',
      message: 'Lid side clearance per side must leave positive panel width (2C < Y - 2T).',
    });
  }

  // 2O < R - I - T (fundamental release condition: positive release travel margin)
  if (isOValid && isRValid && isIValid && isTValid && r > i + t && 2 * o >= r - i - t) {
    errors.push({
      code: 'INSUFFICIENT_LID_RELEASE_TRAVEL',
      message:
        'Lid overlap requires more travel than available pocket depth (2O < R - I - T) for positive release clearance.',
    });
  }

  // B < X - 2R (lid batten width less than clear top opening)
  if (isBValid && isXValid && isRValid && x > 2 * r && b >= x - 2 * r) {
    errors.push({
      code: 'LID_BATTEN_TOO_WIDE',
      message: 'Lid batten width must be less than clear top opening length (B < X - 2R).',
    });
  }

  // E > C (batten extends beyond side wall inner face for positive bearing)
  if (isEValid && isCValid && e <= c) {
    errors.push({
      code: 'LID_BATTEN_HAS_NO_SIDE_BEARING',
      message:
        'Lid batten overhang must be greater than side clearance (E > C) to provide side-wall bearing.',
    });
  }

  return { errors, warnings };
}

/**
 * Validates the entire toolbox geometry (box, lid, and locking mechanism).
 */
export function validateToolboxGeometry(design: ToolboxDesign): {
  errors: GeometryError[];
  warnings: GeometryWarning[];
} {
  const boxValidation = validateBoxGeometry(design);
  const lidValidation = validateLidGeometry(design);
  const lockingValidation = validateLockingMechanismGeometry(design);

  return {
    errors: [...boxValidation.errors, ...lidValidation.errors, ...lockingValidation.errors],
    warnings: [...boxValidation.warnings, ...lidValidation.warnings, ...lockingValidation.warnings],
  };
}

/**
 * Calculates the authoritative core box geometry from a ToolboxDesign.
 * Pure, deterministic, non-mutating calculation in canonical millimetres.
 */
export function calculateBoxGeometry(design: ToolboxDesign): BoxGeometryResult {
  const { errors, warnings } = validateBoxGeometry(design);

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
      warnings,
    };
  }

  const { length: x, width: y, height: z, stockThickness: t } = design.dimensions;
  const {
    bottomThickness: tb,
    endHandleDepth: i,
    endHandleHeight: h,
    housingDadoDepth: g,
    fixedTopBattenWidth: r,
  } = design.constructionParameters;

  const sideWallWidth = z - tb;
  const endWallLength = y - 2 * t + 2 * g;
  const handleLength = y - 2 * t;

  const stopEndWallStartX = i;
  const stopEndWallEndX = i + t;
  const lockingEndWallStartX = x - i - t;
  const lockingEndWallEndX = x - i;

  const geometry: CalculatedBoxGeometry = {
    outside: {
      length: x,
      width: y,
      bodyHeight: z,
      overallHeightWithTopBattens: z + t,
    },
    internal: {
      length: x - 2 * (i + t),
      width: y - 2 * t,
      height: z - tb,
    },
    parts: {
      side: {
        quantity: 2,
        dimensions: {
          length: x,
          width: sideWallWidth,
          thickness: t,
        },
      },
      end: {
        quantity: 2,
        dimensions: {
          length: endWallLength,
          width: sideWallWidth,
          thickness: t,
        },
      },
      bottom: {
        quantity: 1,
        dimensions: {
          length: x,
          width: y,
          thickness: tb,
        },
      },
      fixedTopBatten: {
        quantity: 2,
        dimensions: {
          length: y,
          width: r,
          thickness: t,
        },
      },
      handle: {
        quantity: 2,
        dimensions: {
          length: handleLength,
          width: h,
          thickness: i,
        },
      },
    },
    topOpening: {
      length: x - 2 * r,
      width: y - 2 * t,
      battenInteriorProjection: r - i - t,
    },
    layout: {
      endWalls: {
        stop: {
          startX: stopEndWallStartX,
          endX: stopEndWallEndX,
          outsideFaceX: stopEndWallStartX,
          insideFaceX: stopEndWallEndX,
        },
        locking: {
          startX: lockingEndWallStartX,
          endX: lockingEndWallEndX,
          outsideFaceX: lockingEndWallEndX,
          insideFaceX: lockingEndWallStartX,
        },
      },
      handles: {
        stop: {
          startX: 0,
          endX: i,
          startY: t,
          endY: y - t,
          startZ: z - h,
          endZ: z,
        },
        locking: {
          startX: x - i,
          endX: x,
          startY: t,
          endY: y - t,
          startZ: z - h,
          endZ: z,
        },
      },
      handleBays: {
        stop: {
          startX: 0,
          endX: i,
        },
        locking: {
          startX: x - i,
          endX: x,
        },
      },
      housingDados: {
        width: t,
        depth: g,
        verticalStart: tb,
        verticalEnd: z,
        stopEnd: {
          startX: stopEndWallStartX,
          endX: stopEndWallEndX,
          frontY: { startY: t - g, endY: t },
          backY: { startY: y - t, endY: y - t + g },
        },
        lockingEnd: {
          startX: lockingEndWallStartX,
          endX: lockingEndWallEndX,
          frontY: { startY: t - g, endY: t },
          backY: { startY: y - t, endY: y - t + g },
        },
      },
    },
  };

  return {
    ok: true,
    geometry,
    warnings,
  };
}

/**
 * Calculates the authoritative sliding lid geometry from a ToolboxDesign.
 * Optionally accepts a precalculated box geometry to avoid redundant recalculation.
 */
export function calculateLidGeometry(
  design: ToolboxDesign,
  precalculatedBox?: CalculatedBoxGeometry,
): LidGeometryResult {
  let box = precalculatedBox;
  let boxErrors: GeometryError[] = [];
  let boxWarnings: GeometryWarning[] = [];

  if (!box) {
    const boxResult = calculateBoxGeometry(design);
    if (boxResult.ok) {
      box = boxResult.geometry;
      boxWarnings = boxResult.warnings;
    } else {
      boxErrors = boxResult.errors;
      boxWarnings = boxResult.warnings;
    }
  }

  const lidValidation = validateLidGeometry(design);
  const errors = [...boxErrors, ...lidValidation.errors];
  const warnings = [...boxWarnings, ...lidValidation.warnings];

  if (errors.length > 0 || !box) {
    return {
      ok: false,
      errors,
      warnings,
    };
  }

  const { length: x, height: z, stockThickness: t } = design.dimensions;
  const {
    endHandleDepth: i,
    lidThickness: p,
    lidSideClearance: c,
    desiredOverlap: o,
    lidBattenWidth: b,
    lidBattenOverhang: e,
    fixedTopBattenWidth: r,
  } = design.constructionParameters;

  const topOpeningLength = box.topOpening.length;
  const topOpeningWidth = box.topOpening.width;
  const pocketDepth = box.topOpening.battenInteriorProjection;

  const lidPanelWidth = topOpeningWidth - 2 * c;
  const lidPanelLength = topOpeningLength + 2 * o;
  const lidBattenLength = lidPanelWidth + 2 * e;

  const sideWallBearingPerSide = Math.min(Math.max(e - c, 0), t);
  const outsideInsetPerSide = Math.max(t + c - e, 0);
  const outsideProjectionPerSide = Math.max(e - (t + c), 0);

  const travelToReleaseEdge = o;
  const availableTravel = pocketDepth - o;
  const releaseTravelMargin = pocketDepth - 2 * o;

  const stopOpeningEdgeX = r;
  const lockingOpeningEdgeX = x - r;

  // Reference state 1: LOCKED
  const lockedState: LidStateCoordinates = {
    name: 'locked',
    translationFromLocked: 0,
    panel: {
      startX: r - o,
      endX: x - r + o,
    },
    straightLidBatten: {
      startX: r,
      endX: r + b,
    },
    stopEndOverlap: o,
    lockingEndOverlap: o,
    stopEndReleaseClearance: 0,
  };

  // Reference state 2: RELEASE_THRESHOLD
  const releaseThresholdState: LidStateCoordinates = {
    name: 'releaseThreshold',
    translationFromLocked: travelToReleaseEdge,
    panel: {
      startX: r,
      endX: x - r + 2 * o,
    },
    straightLidBatten: {
      startX: r + o,
      endX: r + o + b,
    },
    stopEndOverlap: 0,
    lockingEndOverlap: 2 * o,
    stopEndReleaseClearance: 0,
  };

  // Reference state 3: SHIFTED_FOR_RELEASE
  const shiftedForReleaseState: LidStateCoordinates = {
    name: 'shiftedForRelease',
    translationFromLocked: availableTravel,
    panel: {
      startX: lockedState.panel.startX + availableTravel,
      endX: x - i - t,
    },
    straightLidBatten: {
      startX: r + availableTravel,
      endX: r + availableTravel + b,
    },
    stopEndOverlap: 0,
    lockingEndOverlap: pocketDepth,
    stopEndReleaseClearance: releaseTravelMargin,
  };

  const geometry: CalculatedLidGeometry = {
    panel: {
      dimensions: {
        length: lidPanelLength,
        width: lidPanelWidth,
        thickness: p,
      },
    },
    straightLidBatten: {
      quantity: 1,
      dimensions: {
        length: lidBattenLength,
        width: b,
        thickness: t,
      },
      startFromPanelEnd: o,
    },
    vertical: {
      lidPanelTopZ: z,
      lidPanelBottomZ: z - p,
      lidBattenBottomZ: z,
      lidBattenTopZ: z + t,
    },
    lateralFit: {
      clearancePerSide: c,
      battenBearingPerSide: sideWallBearingPerSide,
      outsideInsetPerSide,
      outsideProjectionPerSide,
    },
    longitudinalFit: {
      lockedOverlapPerEnd: o,
      pocketDepth,
      travelToReleaseEdge,
      availableTravel,
      releaseTravelMargin,
    },
    openingEdges: {
      stopOpeningEdgeX,
      lockingOpeningEdgeX,
    },
    states: {
      locked: lockedState,
      releaseThreshold: releaseThresholdState,
      shiftedForRelease: shiftedForReleaseState,
    },
  };

  return {
    ok: true,
    geometry,
    warnings,
  };
}

/**
 * Validates the locking mechanism parameters (clearance, taper angle, bevel angle, fitting).
 */
export function validateLockingMechanismGeometry(
  design: ToolboxDesign,
  precalculatedBox?: CalculatedBoxGeometry,
  precalculatedLid?: CalculatedLidGeometry,
): {
  errors: GeometryError[];
  warnings: GeometryWarning[];
} {
  const errors: GeometryError[] = [];
  const warnings: GeometryWarning[] = [];

  const { length: x, stockThickness: t } = design.dimensions;
  const {
    fixedTopBattenWidth: r,
    lidBattenWidth: b,
    desiredOverlap: o,
    wedgeTaperAngle: alpha,
    wedgeBevelAngle: beta,
    lockingBattenTravelClearance: q,
  } = design.constructionParameters;

  // 1. Basic finite & range checks for Phase 5 inputs
  if (!Number.isFinite(q) || q <= 0) {
    errors.push({
      code: 'INVALID_LOCKING_BATTEN_TRAVEL_CLEARANCE',
      message: 'Locking batten travel clearance must be a finite number greater than 0.',
    });
  }

  if (!Number.isFinite(alpha) || alpha <= 0 || alpha >= 45) {
    errors.push({
      code: 'INVALID_WEDGE_TAPER_ANGLE',
      message: 'Wedge taper angle must be a finite number greater than 0 and less than 45 degrees.',
    });
  }

  if (!Number.isFinite(beta) || beta <= 0 || beta >= 45) {
    errors.push({
      code: 'INVALID_WEDGE_BEVEL_ANGLE',
      message: 'Wedge bevel angle must be a finite number greater than 0 and less than 45 degrees.',
    });
  }

  // 2. Relational checks (only evaluate if prerequisite inputs and structures are valid)
  const isQValid = Number.isFinite(q) && q > 0;
  const isAlphaValid = Number.isFinite(alpha) && alpha > 0 && alpha < 45;
  const isBetaValid = Number.isFinite(beta) && beta > 0 && beta < 45;

  const isXValid = Number.isFinite(x) && x > 0;
  const isTValid = Number.isFinite(t) && t > 0;
  const isRValid = Number.isFinite(r) && r > 0;
  const isBValid = Number.isFinite(b) && b > 0;
  const isOValid = Number.isFinite(o) && o > 0;

  let box = precalculatedBox;
  if (!box && isXValid && isTValid && isRValid) {
    const boxResult = calculateBoxGeometry(design);
    if (boxResult.ok) {
      box = boxResult.geometry;
    }
  }

  let lid = precalculatedLid;
  if (!lid && box && isBValid && isOValid) {
    const lidResult = calculateLidGeometry(design, box);
    if (lidResult.ok) {
      lid = lidResult.geometry;
    }
  }

  if (
    isQValid &&
    isAlphaValid &&
    isBetaValid &&
    box &&
    lid &&
    isTValid &&
    isBValid &&
    isRValid &&
    isXValid &&
    isOValid
  ) {
    const availableLidTravel = lid.longitudinalFit.availableTravel; // D
    const lockingBattenLength = lid.straightLidBatten.dimensions.length; // L
    const alphaRad = (alpha * Math.PI) / 180;
    const betaRad = (beta * Math.PI) / 180;

    const taperDelta = lockingBattenLength * Math.tan(alphaRad);
    const lockingBattenMinimumWidth = b - taperDelta;

    if (lockingBattenMinimumWidth <= 0) {
      errors.push({
        code: 'WEDGE_TAPER_TOO_STEEP_FOR_LID_BATTEN',
        message:
          'Wedge taper angle is too steep for the selected lid batten width (B <= taperDelta).',
      });
    }

    const wedgeMinimumBottomWidth = availableLidTravel + q; // Wmin = D + Q
    const bevelOffsetNormalPerSide = t * Math.tan(betaRad); // H
    const topWidthReduction = bevelOffsetNormalPerSide * (1 + 1 / Math.cos(alphaRad));
    const wedgeTopNarrowWidth = wedgeMinimumBottomWidth - topWidthReduction;

    if (wedgeTopNarrowWidth <= 0) {
      errors.push({
        code: 'WEDGE_BEVEL_TOO_STEEP_FOR_WIDTH',
        message:
          'Wedge bevel angle is too steep for the minimum wedge width, removing the entire top section.',
      });
    }

    const lockingOpeningEdgeX = x - r;
    const lockingBattenInteriorEdgeX = lockingOpeningEdgeX - wedgeMinimumBottomWidth - b;
    const panelStartX = r - o;
    const straightBattenEndX = r + b;

    if (lockingBattenInteriorEdgeX < panelStartX) {
      errors.push({
        code: 'LOCKING_LID_BATTEN_OUTSIDE_PANEL',
        message: 'Locking lid batten extends beyond the stop end of the lid panel.',
      });
    }

    if (lockingBattenInteriorEdgeX <= straightBattenEndX) {
      errors.push({
        code: 'LID_BATTENS_OVERLAP',
        message: 'Locking lid batten overlaps with the straight stop lid batten.',
      });
    }

    const remainingMinimumGapAfterFullLidShift = wedgeMinimumBottomWidth - availableLidTravel;
    if (remainingMinimumGapAfterFullLidShift <= 0) {
      errors.push({
        code: 'LOCKING_BATTEN_RESTRICTS_LID_TRAVEL',
        message: 'Locking batten does not preserve the required lid release travel margin.',
      });
    }
  }

  return { errors, warnings };
}

/**
 * Calculates the authoritative locking mechanism geometry (fixed top batten profile, locking lid batten, wedge, channel, and capture).
 * Pure, deterministic, non-mutating calculation in canonical millimetres.
 */
export function calculateLockingMechanismGeometry(
  design: ToolboxDesign,
  precalculatedBox?: CalculatedBoxGeometry,
  precalculatedLid?: CalculatedLidGeometry,
): LockingMechanismGeometryResult {
  let box = precalculatedBox;
  let boxErrors: GeometryError[] = [];
  let boxWarnings: GeometryWarning[] = [];

  if (!box) {
    const boxResult = calculateBoxGeometry(design);
    if (boxResult.ok) {
      box = boxResult.geometry;
      boxWarnings = boxResult.warnings;
    } else {
      boxErrors = boxResult.errors;
      boxWarnings = boxResult.warnings;
    }
  }

  let lid = precalculatedLid;
  let lidErrors: GeometryError[] = [];
  let lidWarnings: GeometryWarning[] = [];

  if (!lid && box) {
    const lidResult = calculateLidGeometry(design, box);
    if (lidResult.ok) {
      lid = lidResult.geometry;
      lidWarnings = lidResult.warnings;
    } else {
      lidErrors = lidResult.errors;
      lidWarnings = lidResult.warnings;
    }
  }

  const lockingValidation = validateLockingMechanismGeometry(design, box, lid);
  const errors = [...boxErrors, ...lidErrors, ...lockingValidation.errors];
  const warnings = [...boxWarnings, ...lidWarnings, ...lockingValidation.warnings];

  if (errors.length > 0 || !box || !lid) {
    return {
      ok: false,
      errors,
      warnings,
    };
  }

  const { length: x, width: y, height: z, stockThickness: t } = design.dimensions;
  const {
    fixedTopBattenWidth: r,
    lidBattenWidth: b,
    lidBattenOverhang: e,
    lidSideClearance: c,
    wedgeTaperAngle: alpha,
    wedgeBevelAngle: beta,
    lockingBattenTravelClearance: q,
  } = design.constructionParameters;

  const alphaRad = (alpha * Math.PI) / 180;
  const betaRad = (beta * Math.PI) / 180;

  const availableLidTravel = lid.longitudinalFit.availableTravel; // D
  const workingLength = lid.straightLidBatten.dimensions.length; // L = lidPanelWidth + 2E
  const lockingOpeningEdgeX = x - r; // F

  const minimumBottomWidth = availableLidTravel + q; // Wmin = D + Q
  const taperRate = Math.tan(alphaRad);
  const taperDelta = workingLength * taperRate;
  const maximumBottomWidth = minimumBottomWidth + taperDelta;

  const lockingBattenMaximumWidth = b;
  const lockingBattenMinimumWidth = b - taperDelta;

  const lockingBattenInteriorEdgeX = lockingOpeningEdgeX - minimumBottomWidth - b;
  const narrowEndWedgeFaceX = lockingOpeningEdgeX - minimumBottomWidth;
  const wideEndWedgeFaceX = lockingOpeningEdgeX - minimumBottomWidth - taperDelta;

  const bevelOffsetNormalPerSide = t * Math.tan(betaRad); // H
  const secAlpha = 1 / Math.cos(alphaRad);
  const topWidthReduction = bevelOffsetNormalPerSide * (1 + secAlpha);

  const topNarrowWidth = minimumBottomWidth - topWidthReduction;
  const topWideWidth = maximumBottomWidth - topWidthReduction;

  const combinedLockingBlankWidth = b + minimumBottomWidth;
  const recommendedWedgeOverlength = 2 * t;
  const recommendedWedgeBlankLength = workingLength + recommendedWedgeOverlength;

  const residualGapAfterFullLidShift = minimumBottomWidth - availableLidTravel; // Q

  // Lateral coordinates along Y for plan corners:
  const yStart = t + c - e;
  const yEnd = yStart + workingLength;

  const lockingBattenPlanCorners = {
    interiorNarrowCorner: { x: lockingBattenInteriorEdgeX, y: yStart },
    interiorWideCorner: { x: lockingBattenInteriorEdgeX, y: yEnd },
    wedgeNarrowCorner: { x: narrowEndWedgeFaceX, y: yStart },
    wedgeWideCorner: { x: wideEndWedgeFaceX, y: yEnd },
  };

  const wedgePlanCorners = {
    fixedBattenNarrowCorner: { x: lockingOpeningEdgeX, y: yStart },
    fixedBattenWideCorner: { x: lockingOpeningEdgeX, y: yEnd },
    battenMatingNarrowCorner: { x: narrowEndWedgeFaceX, y: yStart },
    battenMatingWideCorner: { x: wideEndWedgeFaceX, y: yEnd },
  };

  const geometry: CalculatedLockingMechanismGeometry = {
    lockingFixedTopBatten: {
      dimensions: {
        length: y,
        width: r,
        thickness: t,
      },
      bevelAngle: beta,
      bevelOffsetNormal: bevelOffsetNormalPerSide,
      innerEdgeX: lockingOpeningEdgeX,
    },
    lockingLidBatten: {
      blankDimensions: {
        length: workingLength,
        width: b,
        thickness: t,
      },
      maximumWidth: lockingBattenMaximumWidth,
      minimumWidth: lockingBattenMinimumWidth,
      taperDelta,
      interiorEdgeX: lockingBattenInteriorEdgeX,
      narrowEndWedgeFaceX,
      wideEndWedgeFaceX,
      planCorners: lockingBattenPlanCorners,
    },
    wedge: {
      workingLength,
      recommendedBlankLength: recommendedWedgeBlankLength,
      recommendedOverlength: recommendedWedgeOverlength,
      blankDimensions: {
        length: recommendedWedgeBlankLength,
        width: combinedLockingBlankWidth,
        thickness: t,
      },
      bottomNarrowWidth: minimumBottomWidth,
      bottomWideWidth: maximumBottomWidth,
      topNarrowWidth,
      topWideWidth,
      taperAngle: alpha,
      bevelAngle: beta,
      bevelOffsetNormalPerSide,
      taperRate,
      insertionDirection: '+Y',
      planCorners: wedgePlanCorners,
    },
    channel: {
      minimumBottomWidth,
      maximumBottomWidth,
      residualGapAfterFullLidShift,
    },
    capture: {
      topWidthReduction,
      verticallyCaptured: beta > 0 && topNarrowWidth > 0,
    },
    vertical: {
      wedgeBottomZ: z,
      wedgeTopZ: z + t,
      lockingBattenBottomZ: z,
      lockingBattenTopZ: z + t,
    },
    manufacturing: {
      combinedLockingBlankWidth,
      recommendedWedgeOverlength,
      recommendedWedgeBlankLength,
    },
  };

  return {
    ok: true,
    geometry,
    warnings,
  };
}

/**
 * Authoritative aggregate calculation for the complete toolbox geometry (box + lid + locking mechanism).
 * Pure, deterministic, non-mutating calculation in canonical millimetres.
 */
export function calculateToolboxGeometry(design: ToolboxDesign): ToolboxGeometryResult {
  const boxResult = calculateBoxGeometry(design);
  const lidResult = calculateLidGeometry(design, boxResult.ok ? boxResult.geometry : undefined);
  const lockingResult = calculateLockingMechanismGeometry(
    design,
    boxResult.ok ? boxResult.geometry : undefined,
    lidResult.ok ? lidResult.geometry : undefined,
  );

  const errors = [
    ...(boxResult.ok ? [] : boxResult.errors),
    ...(lidResult.ok ? [] : lidResult.errors),
    ...(lockingResult.ok ? [] : lockingResult.errors),
  ];
  const warnings = [...boxResult.warnings, ...lidResult.warnings, ...lockingResult.warnings];

  if (!boxResult.ok || !lidResult.ok || !lockingResult.ok) {
    return {
      ok: false,
      errors,
      warnings,
    };
  }

  return {
    ok: true,
    geometry: {
      box: boxResult.geometry,
      lid: lidResult.geometry,
      lockingMechanism: lockingResult.geometry,
    },
    warnings,
  };
}
