import type { ToolboxDesign } from './design';

/**
 * ---------------------------------------------------------------------------
 * Core Box Geometry (Phase 3)
 * ---------------------------------------------------------------------------
 *
 * AUTHORITATIVE WOODWORKING GEOMETRY CONVENTIONS:
 *
 * 1. Coordinate System (Right-handed conceptual space):
 *    - X: Toolbox length (left/right along toolbox length, parallel to sliding lid movement).
 *    - Y: Toolbox width (front/back across toolbox width).
 *    - Z: Toolbox body height (vertical from underside of bottom board to top of side/end walls).
 *
 * 2. V1 Carcass Construction Assumptions:
 *    - The user-specified dimensions (X, Y, Z) define the outside dimensions of the main box body.
 *    - T = Main stock thickness (`design.dimensions.stockThickness`).
 *    - R = Fixed top batten width (`design.constructionParameters.fixedTopBattenWidth`).
 *    - Long side boards run full length X, attached on top of the bottom board:
 *      blank = X × (Z - T) × T (quantity: 2).
 *    - End boards fit between the long side boards, attached on top of the bottom board:
 *      blank = (Y - 2T) × (Z - T) × T (quantity: 2).
 *    - Bottom board is full-size and attached underneath the carcass:
 *      blank = X × Y × T (quantity: 1).
 *    - Fixed top battens (quantity: 2) sit ON TOP of the carcass body flush with each end,
 *      spanning the full outside width Y:
 *      blank = Y × R × T (quantity: 2).
 *    - Absolute height including fixed top battens = Z + T (since top battens project above Z).
 *
 * 3. Interior & Clear Opening Dimensions:
 *    - Internal length = X - 2T (end boards consume T at each end).
 *    - Internal width = Y - 2T (side boards consume T at each side).
 *    - Internal height = Z - T (bottom consumes T at bottom; top is open).
 *    - Clear top opening length = X - 2R (along X between inner edges of fixed top battens).
 *    - Clear top opening width = Y - 2T (along Y between inner faces of long side walls).
 *    - Fixed top batten interior projection = R - T (inward projection past the inner face of the end wall).
 *
 * 4. Units & Precision:
 *    - All calculations are pure, deterministic, and use canonical millimetres directly.
 *    - No display rounding or precision truncation is performed in the geometry engine.
 */

export interface PartDimensions {
  length: number;
  width: number;
  thickness: number;
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
  };
  topOpening: {
    length: number;
    width: number;
    battenInteriorProjection: number;
  };
}

export type GeometryErrorCode =
  | 'INVALID_LENGTH'
  | 'INVALID_WIDTH'
  | 'INVALID_HEIGHT'
  | 'INVALID_STOCK_THICKNESS'
  | 'INVALID_FIXED_TOP_BATTEN_WIDTH'
  | 'LENGTH_TOO_SMALL'
  | 'WIDTH_TOO_SMALL'
  | 'HEIGHT_TOO_SMALL'
  | 'FIXED_TOP_BATTENS_TOO_WIDE'
  | 'FIXED_TOP_BATTEN_TOO_NARROW';

export interface GeometryError {
  code: GeometryErrorCode;
  message: string;
}

export interface GeometryWarning {
  code: string;
  message: string;
}

export type GeometryResult =
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
  const { fixedTopBattenWidth: r } = design.constructionParameters;

  // 1. Basic non-positive checks
  if (x <= 0) {
    errors.push({
      code: 'INVALID_LENGTH',
      message: 'Toolbox length must be greater than 0.',
    });
  }
  if (y <= 0) {
    errors.push({
      code: 'INVALID_WIDTH',
      message: 'Toolbox width must be greater than 0.',
    });
  }
  if (z <= 0) {
    errors.push({
      code: 'INVALID_HEIGHT',
      message: 'Toolbox height must be greater than 0.',
    });
  }
  if (t <= 0) {
    errors.push({
      code: 'INVALID_STOCK_THICKNESS',
      message: 'Stock thickness must be greater than 0.',
    });
  }
  if (r <= 0) {
    errors.push({
      code: 'INVALID_FIXED_TOP_BATTEN_WIDTH',
      message: 'Fixed top batten width must be greater than 0.',
    });
  }

  // 2. Relational carcass constraints (only evaluate when relevant inputs are positive)
  if (x > 0 && t > 0 && x <= 2 * t) {
    errors.push({
      code: 'LENGTH_TOO_SMALL',
      message:
        'Toolbox length must be greater than 2x stock thickness (X > 2T) for internal space.',
    });
  }

  if (y > 0 && t > 0 && y <= 2 * t) {
    errors.push({
      code: 'WIDTH_TOO_SMALL',
      message: 'Toolbox width must be greater than 2x stock thickness (Y > 2T) for internal space.',
    });
  }

  if (z > 0 && t > 0 && z <= t) {
    errors.push({
      code: 'HEIGHT_TOO_SMALL',
      message: 'Toolbox height must be greater than stock thickness (Z > T) for internal space.',
    });
  }

  if (r > 0 && t > 0 && r <= t) {
    errors.push({
      code: 'FIXED_TOP_BATTEN_TOO_NARROW',
      message:
        'Fixed top batten width must be greater than stock thickness (R > T) to project inside the end wall.',
    });
  }

  if (r > 0 && x > 0 && 2 * r >= x) {
    errors.push({
      code: 'FIXED_TOP_BATTENS_TOO_WIDE',
      message:
        'Combined fixed top batten widths must be less than toolbox length (2R < X) to leave a top opening.',
    });
  }

  return { errors, warnings };
}

/**
 * Calculates the authoritative core box geometry from a ToolboxDesign.
 * Pure, deterministic, non-mutating calculation in canonical millimetres.
 */
export function calculateBoxGeometry(design: ToolboxDesign): GeometryResult {
  const { errors, warnings } = validateBoxGeometry(design);

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
      warnings,
    };
  }

  const { length: x, width: y, height: z, stockThickness: t } = design.dimensions;
  const { fixedTopBattenWidth: r } = design.constructionParameters;

  const sideWallWidth = z - t;
  const endWallLength = y - 2 * t;

  const geometry: CalculatedBoxGeometry = {
    outside: {
      length: x,
      width: y,
      bodyHeight: z,
      overallHeightWithTopBattens: z + t,
    },
    internal: {
      length: x - 2 * t,
      width: y - 2 * t,
      height: z - t,
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
          thickness: t,
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
    },
    topOpening: {
      length: x - 2 * r,
      width: y - 2 * t,
      battenInteriorProjection: r - t,
    },
  };

  return {
    ok: true,
    geometry,
    warnings,
  };
}

/**
 * Alias for calculateBoxGeometry.
 */
export const calculateToolboxGeometry = calculateBoxGeometry;
