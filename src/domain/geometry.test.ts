import { describe, expect, it } from 'vitest';
import { createDefaultToolboxDesign, type CreateToolboxDesignOptions } from './defaults';
import type { ToolboxDesign } from './design';
import { setDesignUnitSystem } from './design';
import {
  calculateBoxGeometry,
  calculateLidGeometry,
  calculateLockingMechanismGeometry,
  calculateToolboxGeometry,
  validateBoxGeometry,
  validateLidGeometry,
  validateLockingMechanismGeometry,
  validateToolboxGeometry,
} from './geometry';

describe('calculateBoxGeometry', () => {
  describe('Default worked fixture (600 × 300 × 250 × 18 mm, R = 54 mm)', () => {
    it('calculates the exact hand-calculated reference values for the default design', () => {
      const design = createDefaultToolboxDesign();
      const result = calculateBoxGeometry(design);

      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }

      // Outside body
      expect(result.geometry.outside.length).toBe(600);
      expect(result.geometry.outside.width).toBe(300);
      expect(result.geometry.outside.bodyHeight).toBe(250);
      expect(result.geometry.outside.overallHeightWithTopBattens).toBe(268);

      // Internal unobstructed body
      expect(result.geometry.internal.length).toBe(564);
      expect(result.geometry.internal.width).toBe(264);
      expect(result.geometry.internal.height).toBe(232);

      // Long side panels
      expect(result.geometry.parts.side.quantity).toBe(2);
      expect(result.geometry.parts.side.dimensions).toEqual({
        length: 600,
        width: 232,
        thickness: 18,
      });

      // End panels
      expect(result.geometry.parts.end.quantity).toBe(2);
      expect(result.geometry.parts.end.dimensions).toEqual({
        length: 264,
        width: 232,
        thickness: 18,
      });

      // Bottom panel
      expect(result.geometry.parts.bottom.quantity).toBe(1);
      expect(result.geometry.parts.bottom.dimensions).toEqual({
        length: 600,
        width: 300,
        thickness: 18,
      });

      // Fixed top battens
      expect(result.geometry.parts.fixedTopBatten.quantity).toBe(2);
      expect(result.geometry.parts.fixedTopBatten.dimensions).toEqual({
        length: 300,
        width: 54,
        thickness: 18,
      });

      // Clear top opening and projection
      expect(result.geometry.topOpening.length).toBe(492);
      expect(result.geometry.topOpening.width).toBe(264);
      expect(result.geometry.topOpening.battenInteriorProjection).toBe(36);

      // Warnings
      expect(result.warnings).toEqual([]);
    });
  });

  describe('Second hand-calculated fixture (450 × 240 × 200 × 15 mm, R = 45 mm)', () => {
    it('calculates exact hand-calculated reference values with non-default proportions', () => {
      const design = createDefaultToolboxDesign({
        dimensions: {
          length: 450,
          width: 240,
          height: 200,
          stockThickness: 15,
        },
        constructionParameters: {
          fixedTopBattenWidth: 45,
        },
      });

      const result = calculateBoxGeometry(design);

      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }

      // Outside body
      expect(result.geometry.outside.length).toBe(450);
      expect(result.geometry.outside.width).toBe(240);
      expect(result.geometry.outside.bodyHeight).toBe(200);
      expect(result.geometry.outside.overallHeightWithTopBattens).toBe(215);

      // Internal body
      expect(result.geometry.internal.length).toBe(420);
      expect(result.geometry.internal.width).toBe(210);
      expect(result.geometry.internal.height).toBe(185);

      // Side blanks
      expect(result.geometry.parts.side.quantity).toBe(2);
      expect(result.geometry.parts.side.dimensions).toEqual({
        length: 450,
        width: 185,
        thickness: 15,
      });

      // End blanks
      expect(result.geometry.parts.end.quantity).toBe(2);
      expect(result.geometry.parts.end.dimensions).toEqual({
        length: 210,
        width: 185,
        thickness: 15,
      });

      // Bottom blank
      expect(result.geometry.parts.bottom.quantity).toBe(1);
      expect(result.geometry.parts.bottom.dimensions).toEqual({
        length: 450,
        width: 240,
        thickness: 15,
      });

      // Fixed top battens
      expect(result.geometry.parts.fixedTopBatten.quantity).toBe(2);
      expect(result.geometry.parts.fixedTopBatten.dimensions).toEqual({
        length: 240,
        width: 45,
        thickness: 15,
      });

      // Top opening
      expect(result.geometry.topOpening.length).toBe(360);
      expect(result.geometry.topOpening.width).toBe(210);
      expect(result.geometry.topOpening.battenInteriorProjection).toBe(30);

      expect(result.warnings).toEqual([]);
    });
  });

  describe('Authoritative aggregate calculateToolboxGeometry', () => {
    it('returns combined box and lid geometry for valid designs', () => {
      const design = createDefaultToolboxDesign();
      const result = calculateToolboxGeometry(design);

      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }

      const boxResult = calculateBoxGeometry(design);
      const lidResult = calculateLidGeometry(design);

      expect(boxResult.ok).toBe(true);
      expect(lidResult.ok).toBe(true);

      if (boxResult.ok && lidResult.ok) {
        expect(result.geometry.box).toEqual(boxResult.geometry);
        expect(result.geometry.lid).toEqual(lidResult.geometry);
      }
    });
  });

  describe('Fractional millimetre precision', () => {
    it('retains exact floating-point decimals without arbitrary rounding to integers', () => {
      const design = createDefaultToolboxDesign({
        dimensions: {
          length: 600.5,
          width: 300.25,
          height: 250.75,
          stockThickness: 18.5,
        },
        constructionParameters: {
          fixedTopBattenWidth: 54.25,
        },
      });

      const result = calculateBoxGeometry(design);

      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }

      // 600.5 - 2*18.5 = 563.5
      expect(result.geometry.internal.length).toBe(563.5);
      // 300.25 - 2*18.5 = 263.25
      expect(result.geometry.internal.width).toBe(263.25);
      // 250.75 - 18.5 = 232.25
      expect(result.geometry.internal.height).toBe(232.25);

      // Overall height: 250.75 + 18.5 = 269.25
      expect(result.geometry.outside.overallHeightWithTopBattens).toBe(269.25);

      // Side: 600.5 x 232.25 x 18.5
      expect(result.geometry.parts.side.dimensions).toEqual({
        length: 600.5,
        width: 232.25,
        thickness: 18.5,
      });

      // End: 263.25 x 232.25 x 18.5
      expect(result.geometry.parts.end.dimensions).toEqual({
        length: 263.25,
        width: 232.25,
        thickness: 18.5,
      });

      // Bottom: 600.5 x 300.25 x 18.5
      expect(result.geometry.parts.bottom.dimensions).toEqual({
        length: 600.5,
        width: 300.25,
        thickness: 18.5,
      });

      // Batten: 300.25 x 54.25 x 18.5
      expect(result.geometry.parts.fixedTopBatten.dimensions).toEqual({
        length: 300.25,
        width: 54.25,
        thickness: 18.5,
      });

      // Top opening: 600.5 - 2*54.25 = 492
      expect(result.geometry.topOpening.length).toBe(492);
      expect(result.geometry.topOpening.width).toBe(263.25);
      // Projection: 54.25 - 18.5 = 35.75
      expect(result.geometry.topOpening.battenInteriorProjection).toBe(35.75);
    });
  });

  describe('Unit independence', () => {
    it('calculates identical physical geometry regardless of unitSystem setting', () => {
      const metricDesign = createDefaultToolboxDesign();
      const imperialDesign = setDesignUnitSystem(metricDesign, 'imperial');

      const metricResult = calculateBoxGeometry(metricDesign);
      const imperialResult = calculateBoxGeometry(imperialDesign);

      expect(metricResult.ok).toBe(true);
      expect(imperialResult.ok).toBe(true);
      expect(metricResult).toEqual(imperialResult);
    });
  });

  describe('Input immutability', () => {
    function deepFreeze<T extends object>(obj: T): Readonly<T> {
      Object.freeze(obj);
      for (const prop of Object.getOwnPropertyNames(obj)) {
        const val = (obj as Record<string, unknown>)[prop];
        if (
          val !== null &&
          (typeof val === 'object' || typeof val === 'function') &&
          !Object.isFrozen(val)
        ) {
          deepFreeze(val as object);
        }
      }
      return obj;
    }

    it('does not mutate or alter the input ToolboxDesign object', () => {
      const design = createDefaultToolboxDesign();
      const snapshot = JSON.parse(JSON.stringify(design));

      deepFreeze(design);

      const result = calculateBoxGeometry(design);

      expect(result.ok).toBe(true);
      expect(design).toEqual(snapshot);
    });
  });

  describe('Validation & error handling', () => {
    it('rejects non-positive length (X <= 0)', () => {
      const design = createDefaultToolboxDesign({ dimensions: { length: 0 } });
      const result = calculateBoxGeometry(design);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.code === 'INVALID_LENGTH')).toBe(true);
      }
    });

    it('rejects non-positive width (Y <= 0)', () => {
      const design = createDefaultToolboxDesign({ dimensions: { width: -10 } });
      const result = calculateBoxGeometry(design);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.code === 'INVALID_WIDTH')).toBe(true);
      }
    });

    it('rejects non-positive height (Z <= 0)', () => {
      const design = createDefaultToolboxDesign({ dimensions: { height: 0 } });
      const result = calculateBoxGeometry(design);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.code === 'INVALID_HEIGHT')).toBe(true);
      }
    });

    it('rejects non-positive stock thickness (T <= 0)', () => {
      const design = createDefaultToolboxDesign({ dimensions: { stockThickness: 0 } });
      const result = calculateBoxGeometry(design);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.code === 'INVALID_STOCK_THICKNESS')).toBe(true);
      }
    });

    it('rejects non-positive fixed top batten width (R <= 0)', () => {
      const design = createDefaultToolboxDesign({
        constructionParameters: { fixedTopBattenWidth: 0 },
      });
      const result = calculateBoxGeometry(design);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.code === 'INVALID_FIXED_TOP_BATTEN_WIDTH')).toBe(true);
      }
    });

    describe('Boundary conditions', () => {
      it('rejects X = 2T and accepts X > 2T', () => {
        // T = 18, 2T = 36.
        // For X = 36: length <= 2T is invalid
        const invalidDesign = createDefaultToolboxDesign({
          dimensions: { length: 36, stockThickness: 18 },
        });
        const invalidResult = calculateBoxGeometry(invalidDesign);
        expect(invalidResult.ok).toBe(false);
        if (!invalidResult.ok) {
          expect(invalidResult.errors.some((e) => e.code === 'LENGTH_TOO_SMALL')).toBe(true);
        }

        // For X = 200, T = 18 (2T = 36): valid
        const validDesign = createDefaultToolboxDesign({
          dimensions: { length: 200, stockThickness: 18 },
          constructionParameters: { fixedTopBattenWidth: 54 },
        });
        const validResult = calculateBoxGeometry(validDesign);
        expect(validResult.ok).toBe(true);
      });

      it('rejects Y = 2T and accepts Y > 2T', () => {
        // T = 18, 2T = 36.
        const invalidDesign = createDefaultToolboxDesign({
          dimensions: { width: 36, stockThickness: 18 },
        });
        const invalidResult = calculateBoxGeometry(invalidDesign);
        expect(invalidResult.ok).toBe(false);
        if (!invalidResult.ok) {
          expect(invalidResult.errors.some((e) => e.code === 'WIDTH_TOO_SMALL')).toBe(true);
        }

        const validDesign = createDefaultToolboxDesign({
          dimensions: { width: 36.5, stockThickness: 18 },
        });
        const validResult = calculateBoxGeometry(validDesign);
        expect(validResult.ok).toBe(true);
      });

      it('rejects Z = T and accepts Z > T', () => {
        // T = 18
        const invalidDesign = createDefaultToolboxDesign({
          dimensions: { height: 18, stockThickness: 18 },
        });
        const invalidResult = calculateBoxGeometry(invalidDesign);
        expect(invalidResult.ok).toBe(false);
        if (!invalidResult.ok) {
          expect(invalidResult.errors.some((e) => e.code === 'HEIGHT_TOO_SMALL')).toBe(true);
        }

        const validDesign = createDefaultToolboxDesign({
          dimensions: { height: 18.5, stockThickness: 18 },
        });
        const validResult = calculateBoxGeometry(validDesign);
        expect(validResult.ok).toBe(true);
      });

      it('rejects R <= T (no interior projection) and accepts R > T', () => {
        // T = 18, R = 18
        const invalidDesign = createDefaultToolboxDesign({
          dimensions: { stockThickness: 18 },
          constructionParameters: { fixedTopBattenWidth: 18 },
        });
        const invalidResult = calculateBoxGeometry(invalidDesign);
        expect(invalidResult.ok).toBe(false);
        if (!invalidResult.ok) {
          expect(invalidResult.errors.some((e) => e.code === 'FIXED_TOP_BATTEN_TOO_NARROW')).toBe(
            true,
          );
        }

        const validDesign = createDefaultToolboxDesign({
          dimensions: { stockThickness: 18 },
          constructionParameters: { fixedTopBattenWidth: 18.5 },
        });
        const validResult = calculateBoxGeometry(validDesign);
        expect(validResult.ok).toBe(true);
      });

      it('rejects 2R >= X (no top opening) and accepts 2R < X', () => {
        // X = 100, R = 50 -> 2R = 100
        const invalidDesign = createDefaultToolboxDesign({
          dimensions: { length: 100, stockThickness: 18 },
          constructionParameters: { fixedTopBattenWidth: 50 },
        });
        const invalidResult = calculateBoxGeometry(invalidDesign);
        expect(invalidResult.ok).toBe(false);
        if (!invalidResult.ok) {
          expect(invalidResult.errors.some((e) => e.code === 'FIXED_TOP_BATTENS_TOO_WIDE')).toBe(
            true,
          );
        }

        const validDesign = createDefaultToolboxDesign({
          dimensions: { length: 100, stockThickness: 18 },
          constructionParameters: { fixedTopBattenWidth: 49.5 },
        });
        const validResult = calculateBoxGeometry(validDesign);
        expect(validResult.ok).toBe(true);
      });
    });

    it('accumulates multiple validation errors across dimensions', () => {
      // X = 30 (<= 2T = 36), Y = 30 (<= 2T = 36), Z = 15 (<= T = 18), R = 18 (<= T = 18), 2R = 36 (>= X = 30)
      const impossibleDesign: ToolboxDesign = {
        ...createDefaultToolboxDesign(),
        dimensions: {
          length: 30,
          width: 30,
          height: 15,
          stockThickness: 18,
        },
        constructionParameters: {
          ...createDefaultToolboxDesign().constructionParameters,
          fixedTopBattenWidth: 18,
        },
      };

      const result = calculateBoxGeometry(impossibleDesign);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        const errorCodes = result.errors.map((e) => e.code);
        expect(errorCodes).toContain('LENGTH_TOO_SMALL');
        expect(errorCodes).toContain('WIDTH_TOO_SMALL');
        expect(errorCodes).toContain('HEIGHT_TOO_SMALL');
        expect(errorCodes).toContain('FIXED_TOP_BATTEN_TOO_NARROW');
        expect(errorCodes).toContain('FIXED_TOP_BATTENS_TOO_WIDE');
        expect(result.errors.length).toBe(5);
      }
    });

    it('accumulates all non-positive field errors when all dimensions are <= 0', () => {
      const negativeDesign: ToolboxDesign = {
        ...createDefaultToolboxDesign(),
        dimensions: {
          length: 0,
          width: -10,
          height: -5,
          stockThickness: 0,
        },
        constructionParameters: {
          ...createDefaultToolboxDesign().constructionParameters,
          fixedTopBattenWidth: -20,
        },
      };

      const { errors } = validateBoxGeometry(negativeDesign);
      const codes = errors.map((e) => e.code);

      expect(codes).toContain('INVALID_LENGTH');
      expect(codes).toContain('INVALID_WIDTH');
      expect(codes).toContain('INVALID_HEIGHT');
      expect(codes).toContain('INVALID_STOCK_THICKNESS');
      expect(codes).toContain('INVALID_FIXED_TOP_BATTEN_WIDTH');
      expect(errors.length).toBe(5);
    });

    it('rejects non-finite box dimensions (NaN, Infinity, -Infinity)', () => {
      const nanDesign = createDefaultToolboxDesign({
        dimensions: {
          length: NaN,
          width: Infinity,
          height: -Infinity,
          stockThickness: NaN,
        },
        constructionParameters: {
          fixedTopBattenWidth: NaN,
        },
      });

      const { errors } = validateBoxGeometry(nanDesign);
      const codes = errors.map((e) => e.code);

      expect(codes).toContain('INVALID_LENGTH');
      expect(codes).toContain('INVALID_WIDTH');
      expect(codes).toContain('INVALID_HEIGHT');
      expect(codes).toContain('INVALID_STOCK_THICKNESS');
      expect(codes).toContain('INVALID_FIXED_TOP_BATTEN_WIDTH');
      expect(errors.length).toBe(5);
    });
  });
});

describe('calculateLidGeometry & Sliding Lid Mechanics (Phase 4)', () => {
  describe('Default worked fixture (600 × 300 × 250 × 18 mm, R = 54 mm, P = 18 mm, C = 2 mm, O = 13.5 mm, B = 45 mm, E = 18 mm)', () => {
    it('calculates the exact hand-calculated reference values for the default design', () => {
      const design = createDefaultToolboxDesign();
      const result = calculateLidGeometry(design);

      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }

      // 1. Lid panel dimensions
      expect(result.geometry.panel.dimensions).toEqual({
        length: 519,
        width: 260,
        thickness: 18,
      });

      // 2. Straight lid batten blank & position
      expect(result.geometry.straightLidBatten.quantity).toBe(1);
      expect(result.geometry.straightLidBatten.dimensions).toEqual({
        length: 296,
        width: 45,
        thickness: 18,
      });
      expect(result.geometry.straightLidBatten.startFromPanelEnd).toBe(13.5);

      // 3. Side-wall bearing and lateral fit
      expect(result.geometry.lateralFit.clearancePerSide).toBe(2);
      expect(result.geometry.lateralFit.battenBearingPerSide).toBe(16);
      expect(result.geometry.lateralFit.outsideInsetPerSide).toBe(2);
      expect(result.geometry.lateralFit.outsideProjectionPerSide).toBe(0);

      // 4. Vertical Z levels
      expect(result.geometry.vertical).toEqual({
        lidPanelTopZ: 250,
        lidPanelBottomZ: 232,
        lidBattenBottomZ: 250,
        lidBattenTopZ: 268,
      });

      // 5. Longitudinal fit & travel
      expect(result.geometry.longitudinalFit).toEqual({
        lockedOverlapPerEnd: 13.5,
        pocketDepth: 36,
        travelToReleaseEdge: 13.5,
        availableTravel: 22.5,
        releaseTravelMargin: 9,
      });

      // 6. Box opening edges
      expect(result.geometry.openingEdges).toEqual({
        stopOpeningEdgeX: 54,
        lockingOpeningEdgeX: 546,
      });

      // 7. Reference state: LOCKED
      expect(result.geometry.states.locked).toEqual({
        name: 'locked',
        translationFromLocked: 0,
        panel: {
          startX: 40.5,
          endX: 559.5,
        },
        straightLidBatten: {
          startX: 54,
          endX: 99,
        },
        stopEndOverlap: 13.5,
        lockingEndOverlap: 13.5,
        stopEndReleaseClearance: 0,
      });

      // 8. Reference state: RELEASE_THRESHOLD
      expect(result.geometry.states.releaseThreshold).toEqual({
        name: 'releaseThreshold',
        translationFromLocked: 13.5,
        panel: {
          startX: 54,
          endX: 573,
        },
        straightLidBatten: {
          startX: 67.5,
          endX: 112.5,
        },
        stopEndOverlap: 0,
        lockingEndOverlap: 27,
        stopEndReleaseClearance: 0,
      });

      // 9. Reference state: SHIFTED_FOR_RELEASE
      expect(result.geometry.states.shiftedForRelease).toEqual({
        name: 'shiftedForRelease',
        translationFromLocked: 22.5,
        panel: {
          startX: 63,
          endX: 582,
        },
        straightLidBatten: {
          startX: 76.5,
          endX: 121.5,
        },
        stopEndOverlap: 0,
        lockingEndOverlap: 36,
        stopEndReleaseClearance: 9,
      });

      expect(result.warnings).toEqual([]);
    });
  });

  describe('Second hand-calculated fixture (450 × 240 × 200 × 15 mm, R = 45 mm, P = 12 mm, C = 1.5 mm, O = 10 mm, B = 37.5 mm, E = 15 mm)', () => {
    it('calculates exact hand-calculated reference values with non-default proportions', () => {
      const design = createDefaultToolboxDesign({
        dimensions: {
          length: 450,
          width: 240,
          height: 200,
          stockThickness: 15,
        },
        constructionParameters: {
          fixedTopBattenWidth: 45,
          lidThickness: 12,
          lidSideClearance: 1.5,
          desiredOverlap: 10,
          lidBattenWidth: 37.5,
          lidBattenOverhang: 15,
        },
      });

      const result = calculateLidGeometry(design);

      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }

      // 1. Lid panel dimensions (topOpeningLength = 360, topOpeningWidth = 210)
      expect(result.geometry.panel.dimensions).toEqual({
        length: 380,
        width: 207,
        thickness: 12,
      });

      // 2. Straight lid batten blank (length = 207 + 2*15 = 237)
      expect(result.geometry.straightLidBatten.quantity).toBe(1);
      expect(result.geometry.straightLidBatten.dimensions).toEqual({
        length: 237,
        width: 37.5,
        thickness: 15,
      });
      expect(result.geometry.straightLidBatten.startFromPanelEnd).toBe(10);

      // 3. Side-wall bearing and lateral fit
      expect(result.geometry.lateralFit.clearancePerSide).toBe(1.5);
      expect(result.geometry.lateralFit.battenBearingPerSide).toBe(13.5);
      expect(result.geometry.lateralFit.outsideInsetPerSide).toBe(1.5);
      expect(result.geometry.lateralFit.outsideProjectionPerSide).toBe(0);

      // 4. Vertical levels
      expect(result.geometry.vertical).toEqual({
        lidPanelTopZ: 200,
        lidPanelBottomZ: 188,
        lidBattenBottomZ: 200,
        lidBattenTopZ: 215,
      });

      // 5. Longitudinal fit & travel
      expect(result.geometry.longitudinalFit).toEqual({
        lockedOverlapPerEnd: 10,
        pocketDepth: 30,
        travelToReleaseEdge: 10,
        availableTravel: 20,
        releaseTravelMargin: 10,
      });

      // 6. Box opening edges
      expect(result.geometry.openingEdges).toEqual({
        stopOpeningEdgeX: 45,
        lockingOpeningEdgeX: 405,
      });

      // 7. Reference states
      expect(result.geometry.states.locked).toEqual({
        name: 'locked',
        translationFromLocked: 0,
        panel: {
          startX: 35,
          endX: 415,
        },
        straightLidBatten: {
          startX: 45,
          endX: 82.5,
        },
        stopEndOverlap: 10,
        lockingEndOverlap: 10,
        stopEndReleaseClearance: 0,
      });

      expect(result.geometry.states.releaseThreshold).toEqual({
        name: 'releaseThreshold',
        translationFromLocked: 10,
        panel: {
          startX: 45,
          endX: 425,
        },
        straightLidBatten: {
          startX: 55,
          endX: 92.5,
        },
        stopEndOverlap: 0,
        lockingEndOverlap: 20,
        stopEndReleaseClearance: 0,
      });

      expect(result.geometry.states.shiftedForRelease).toEqual({
        name: 'shiftedForRelease',
        translationFromLocked: 20,
        panel: {
          startX: 55,
          endX: 435,
        },
        straightLidBatten: {
          startX: 65,
          endX: 102.5,
        },
        stopEndOverlap: 0,
        lockingEndOverlap: 30,
        stopEndReleaseClearance: 10,
      });
    });
  });

  describe('Boundary tests for fundamental release condition (2O < pocketDepth)', () => {
    it('accepts 2O < pocketDepth, rejects 2O = pocketDepth, and rejects 2O > pocketDepth', () => {
      // Default: R = 54, T = 18 -> pocketDepth = 36
      // 1. 2O < 36 -> O = 17.9 (2O = 35.8 < 36) -> Valid
      const validDesign = createDefaultToolboxDesign({
        constructionParameters: { desiredOverlap: 17.9 },
      });
      const validResult = calculateLidGeometry(validDesign);
      expect(validResult.ok).toBe(true);
      if (validResult.ok) {
        expect(validResult.geometry.longitudinalFit.releaseTravelMargin).toBeCloseTo(0.2, 5);
      }

      // 2. 2O = 36 -> O = 18 (2O = 36) -> Invalid (zero clearance)
      const boundaryDesign = createDefaultToolboxDesign({
        constructionParameters: { desiredOverlap: 18 },
      });
      const boundaryResult = calculateLidGeometry(boundaryDesign);
      expect(boundaryResult.ok).toBe(false);
      if (!boundaryResult.ok) {
        expect(
          boundaryResult.errors.some((e) => e.code === 'INSUFFICIENT_LID_RELEASE_TRAVEL'),
        ).toBe(true);
      }

      // 3. 2O > 36 -> O = 18.1 (2O = 36.2 > 36) -> Invalid
      const excessiveDesign = createDefaultToolboxDesign({
        constructionParameters: { desiredOverlap: 18.1 },
      });
      const excessiveResult = calculateLidGeometry(excessiveDesign);
      expect(excessiveResult.ok).toBe(false);
      if (!excessiveResult.ok) {
        expect(
          excessiveResult.errors.some((e) => e.code === 'INSUFFICIENT_LID_RELEASE_TRAVEL'),
        ).toBe(true);
      }
    });

    it('enforces exact fractional millimetre boundary without premature integer rounding', () => {
      // R = 40.5, T = 18.25 -> pocketDepth = 22.25
      // 2O < 22.25: O = 11.124 -> 2O = 22.248 < 22.25 -> Valid
      const validFractional = createDefaultToolboxDesign({
        dimensions: { stockThickness: 18.25 },
        constructionParameters: {
          fixedTopBattenWidth: 40.5,
          desiredOverlap: 11.124,
        },
      });
      const validRes = calculateLidGeometry(validFractional);
      expect(validRes.ok).toBe(true);

      // 2O = 22.25: O = 11.125 -> 2O = 22.25 -> Invalid
      const invalidFractional = createDefaultToolboxDesign({
        dimensions: { stockThickness: 18.25 },
        constructionParameters: {
          fixedTopBattenWidth: 40.5,
          desiredOverlap: 11.125,
        },
      });
      const invalidRes = calculateLidGeometry(invalidFractional);
      expect(invalidRes.ok).toBe(false);
      if (!invalidRes.ok) {
        expect(invalidRes.errors.some((e) => e.code === 'INSUFFICIENT_LID_RELEASE_TRAVEL')).toBe(
          true,
        );
      }
    });
  });

  describe('Fractional imperial-derived dimensions', () => {
    it('retains exact 1/16-inch fractional millimetre conversions without rounding', () => {
      const sixteenthInch = 1.5875;
      const design = createDefaultToolboxDesign({
        dimensions: {
          length: 600 + sixteenthInch,
          width: 300 + sixteenthInch,
          height: 250 + sixteenthInch,
          stockThickness: 18 + sixteenthInch,
        },
        constructionParameters: {
          fixedTopBattenWidth: 54 + sixteenthInch,
          lidThickness: 18 + sixteenthInch,
          lidSideClearance: sixteenthInch,
          desiredOverlap: 13.5 + sixteenthInch,
          lidBattenWidth: 45 + sixteenthInch,
          lidBattenOverhang: 18 + sixteenthInch,
        },
      });

      const result = calculateLidGeometry(design);
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }

      // Verify no rounding occurred
      expect(result.geometry.panel.dimensions.thickness).toBe(18 + sixteenthInch);
      expect(result.geometry.lateralFit.clearancePerSide).toBe(sixteenthInch);
      expect(result.geometry.longitudinalFit.lockedOverlapPerEnd).toBe(13.5 + sixteenthInch);
      expect(result.geometry.longitudinalFit.pocketDepth).toBe(36); // (54 + s) - (18 + s) = 36
      expect(result.geometry.longitudinalFit.availableTravel).toBe(22.5 - sixteenthInch);
      expect(result.geometry.longitudinalFit.releaseTravelMargin).toBeCloseTo(
        9 - 2 * sixteenthInch,
        10,
      );
    });
  });

  describe('Unit-system independence', () => {
    it('calculates identical physical lid geometry regardless of unitSystem setting', () => {
      const metricDesign = createDefaultToolboxDesign();
      const imperialDesign = setDesignUnitSystem(metricDesign, 'imperial');

      const metricResult = calculateLidGeometry(metricDesign);
      const imperialResult = calculateLidGeometry(imperialDesign);

      expect(metricResult.ok).toBe(true);
      expect(imperialResult.ok).toBe(true);
      expect(metricResult).toEqual(imperialResult);
    });
  });

  describe('Immutability', () => {
    function deepFreeze<T extends object>(obj: T): Readonly<T> {
      Object.freeze(obj);
      for (const prop of Object.getOwnPropertyNames(obj)) {
        const val = (obj as Record<string, unknown>)[prop];
        if (
          val !== null &&
          (typeof val === 'object' || typeof val === 'function') &&
          !Object.isFrozen(val)
        ) {
          deepFreeze(val as object);
        }
      }
      return obj;
    }

    it('does not mutate or alter the input ToolboxDesign object in calculateLidGeometry or calculateToolboxGeometry', () => {
      const design = createDefaultToolboxDesign();
      const snapshot = JSON.parse(JSON.stringify(design));

      deepFreeze(design);

      const lidResult = calculateLidGeometry(design);
      const toolboxResult = calculateToolboxGeometry(design);

      expect(lidResult.ok).toBe(true);
      expect(toolboxResult.ok).toBe(true);
      expect(design).toEqual(snapshot);
    });
  });

  describe('Lid validation & error handling', () => {
    it('rejects non-positive lid thickness (P <= 0)', () => {
      const design0 = createDefaultToolboxDesign({
        constructionParameters: { lidThickness: 0 },
      });
      const res0 = calculateLidGeometry(design0);
      expect(res0.ok).toBe(false);
      if (!res0.ok) {
        expect(res0.errors.some((e) => e.code === 'INVALID_LID_THICKNESS')).toBe(true);
      }

      const designNeg = createDefaultToolboxDesign({
        constructionParameters: { lidThickness: -5 },
      });
      const resNeg = calculateLidGeometry(designNeg);
      expect(resNeg.ok).toBe(false);
      if (!resNeg.ok) {
        expect(resNeg.errors.some((e) => e.code === 'INVALID_LID_THICKNESS')).toBe(true);
      }
    });

    it('rejects excessive lid thickness (P >= Z - T)', () => {
      // Internal height = 250 - 18 = 232
      const design = createDefaultToolboxDesign({
        dimensions: { height: 250, stockThickness: 18 },
        constructionParameters: { lidThickness: 232 },
      });
      const result = calculateLidGeometry(design);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.code === 'LID_TOO_THICK')).toBe(true);
      }
    });

    it('rejects negative lid side clearance (C < 0)', () => {
      const design = createDefaultToolboxDesign({
        constructionParameters: { lidSideClearance: -1 },
      });
      const result = calculateLidGeometry(design);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.code === 'INVALID_LID_SIDE_CLEARANCE')).toBe(true);
      }
    });

    it('allows zero side clearance (C = 0) when E > C', () => {
      const design = createDefaultToolboxDesign({
        constructionParameters: { lidSideClearance: 0, lidBattenOverhang: 18 },
      });
      const result = calculateLidGeometry(design);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.geometry.lateralFit.clearancePerSide).toBe(0);
        expect(result.geometry.panel.dimensions.width).toBe(264);
      }
    });

    it('rejects excessive side clearance (2C >= Y - 2T)', () => {
      // Top opening width = 300 - 2*18 = 264. 2C >= 264 -> C >= 132
      const design = createDefaultToolboxDesign({
        constructionParameters: { lidSideClearance: 132 },
      });
      const result = calculateLidGeometry(design);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.code === 'LID_SIDE_CLEARANCE_TOO_LARGE')).toBe(true);
      }
    });

    it('rejects non-positive desired overlap (O <= 0)', () => {
      const design = createDefaultToolboxDesign({
        constructionParameters: { desiredOverlap: 0 },
      });
      const result = calculateLidGeometry(design);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.code === 'INVALID_LID_OVERLAP')).toBe(true);
      }
    });

    it('rejects non-positive lid batten width (B <= 0)', () => {
      const design = createDefaultToolboxDesign({
        constructionParameters: { lidBattenWidth: 0 },
      });
      const result = calculateLidGeometry(design);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.code === 'INVALID_LID_BATTEN_WIDTH')).toBe(true);
      }
    });

    it('rejects excessive lid batten width (B >= X - 2R)', () => {
      // Top opening length = 600 - 2*54 = 492.
      const design = createDefaultToolboxDesign({
        constructionParameters: { lidBattenWidth: 492 },
      });
      const result = calculateLidGeometry(design);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.code === 'LID_BATTEN_TOO_WIDE')).toBe(true);
      }
    });

    it('rejects negative lid batten overhang (E < 0)', () => {
      const design = createDefaultToolboxDesign({
        constructionParameters: { lidBattenOverhang: -2 },
      });
      const result = calculateLidGeometry(design);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.code === 'INVALID_LID_BATTEN_OVERHANG')).toBe(true);
      }
    });

    it('rejects lid batten overhang with no side bearing (E <= C)', () => {
      // C = 2, E = 2 -> E <= C
      const designEqual = createDefaultToolboxDesign({
        constructionParameters: { lidSideClearance: 2, lidBattenOverhang: 2 },
      });
      const resEqual = calculateLidGeometry(designEqual);
      expect(resEqual.ok).toBe(false);
      if (!resEqual.ok) {
        expect(resEqual.errors.some((e) => e.code === 'LID_BATTEN_HAS_NO_SIDE_BEARING')).toBe(true);
      }

      // C = 2, E = 1 -> E < C
      const designLess = createDefaultToolboxDesign({
        constructionParameters: { lidSideClearance: 2, lidBattenOverhang: 1 },
      });
      const resLess = calculateLidGeometry(designLess);
      expect(resLess.ok).toBe(false);
      if (!resLess.ok) {
        expect(resLess.errors.some((e) => e.code === 'LID_BATTEN_HAS_NO_SIDE_BEARING')).toBe(true);
      }
    });

    it('rejects non-finite lid parameters (NaN, Infinity, -Infinity)', () => {
      const nanDesign = createDefaultToolboxDesign({
        constructionParameters: {
          lidThickness: NaN,
          lidSideClearance: Infinity,
          desiredOverlap: -Infinity,
          lidBattenWidth: NaN,
          lidBattenOverhang: Infinity,
        },
      });

      const { errors } = validateLidGeometry(nanDesign);
      const codes = errors.map((e) => e.code);

      expect(codes).toContain('INVALID_LID_THICKNESS');
      expect(codes).toContain('INVALID_LID_SIDE_CLEARANCE');
      expect(codes).toContain('INVALID_LID_OVERLAP');
      expect(codes).toContain('INVALID_LID_BATTEN_WIDTH');
      expect(codes).toContain('INVALID_LID_BATTEN_OVERHANG');
      expect(errors.length).toBe(5);
    });

    it('accumulates multiple independent lid errors without emitting confusing derivative errors', () => {
      const design = createDefaultToolboxDesign({
        constructionParameters: {
          lidThickness: 0,
          lidSideClearance: -5,
          lidBattenWidth: -10,
        },
      });

      const { errors } = validateLidGeometry(design);
      const codes = errors.map((e) => e.code);

      expect(codes).toContain('INVALID_LID_THICKNESS');
      expect(codes).toContain('INVALID_LID_SIDE_CLEARANCE');
      expect(codes).toContain('INVALID_LID_BATTEN_WIDTH');
      expect(codes).not.toContain('LID_TOO_THICK');
      expect(codes).not.toContain('LID_SIDE_CLEARANCE_TOO_LARGE');
      expect(codes).not.toContain('LID_BATTEN_TOO_WIDE');
      expect(errors.length).toBe(3);
    });

    it('validateToolboxGeometry accumulates both box and lid errors simultaneously', () => {
      const design = createDefaultToolboxDesign({
        dimensions: { length: -10 },
        constructionParameters: { lidThickness: -5 },
      });

      const { errors } = validateToolboxGeometry(design);
      const codes = errors.map((e) => e.code);

      expect(codes).toContain('INVALID_LENGTH');
      expect(codes).toContain('INVALID_LID_THICKNESS');
      expect(errors.length).toBe(2);
    });
  });

  describe('Algebraic invariants for valid sliding lid geometry', () => {
    const testCases: CreateToolboxDesignOptions[] = [
      {}, // Default
      {
        dimensions: { length: 500, width: 280, height: 220, stockThickness: 16 },
        constructionParameters: {
          fixedTopBattenWidth: 48,
          lidThickness: 16,
          lidSideClearance: 1.5,
          desiredOverlap: 12,
          lidBattenWidth: 40,
          lidBattenOverhang: 16,
        },
      },
      {
        dimensions: { length: 700, width: 350, height: 300, stockThickness: 20 },
        constructionParameters: {
          fixedTopBattenWidth: 60,
          lidThickness: 20,
          lidSideClearance: 2.5,
          desiredOverlap: 15,
          lidBattenWidth: 50,
          lidBattenOverhang: 22,
        },
      },
    ];

    testCases.forEach((testCase, idx) => {
      it(`preserves all core kinematic invariants for test configuration #${idx + 1}`, () => {
        const design = createDefaultToolboxDesign(testCase);
        const result = calculateToolboxGeometry(design);

        expect(result.ok).toBe(true);
        if (!result.ok) {
          return;
        }

        const { box, lid } = result.geometry;
        const x = design.dimensions.length;
        const t = design.dimensions.stockThickness;

        // Invariant 1: lidPanelLength = topOpeningLength + 2 * lockedOverlap
        expect(lid.panel.dimensions.length).toBe(
          box.topOpening.length + 2 * lid.longitudinalFit.lockedOverlapPerEnd,
        );

        // Invariant 2: availableTravel = pocketDepth - lockedOverlap
        expect(lid.longitudinalFit.availableTravel).toBe(
          lid.longitudinalFit.pocketDepth - lid.longitudinalFit.lockedOverlapPerEnd,
        );

        // Invariant 3: releaseTravelMargin = availableTravel - travelToReleaseEdge
        expect(lid.longitudinalFit.releaseTravelMargin).toBe(
          lid.longitudinalFit.availableTravel - lid.longitudinalFit.travelToReleaseEdge,
        );

        // Invariant 4: releaseTravelMargin = pocketDepth - 2 * lockedOverlap
        expect(lid.longitudinalFit.releaseTravelMargin).toBe(
          lid.longitudinalFit.pocketDepth - 2 * lid.longitudinalFit.lockedOverlapPerEnd,
        );

        // Invariant 5: fully shifted locking-end panel coordinate touches inner end wall (X - T)
        expect(lid.states.shiftedForRelease.panel.endX).toBe(x - t);

        // Invariant 6: fully shifted stop-end clearance equals releaseTravelMargin
        expect(lid.states.shiftedForRelease.stopEndReleaseClearance).toBe(
          lid.longitudinalFit.releaseTravelMargin,
        );

        // Invariant 7: panel span is constant across all 3 kinematic states
        expect(lid.states.locked.panel.endX - lid.states.locked.panel.startX).toBe(
          lid.panel.dimensions.length,
        );
        expect(
          lid.states.releaseThreshold.panel.endX - lid.states.releaseThreshold.panel.startX,
        ).toBe(lid.panel.dimensions.length);
        expect(
          lid.states.shiftedForRelease.panel.endX - lid.states.shiftedForRelease.panel.startX,
        ).toBe(lid.panel.dimensions.length);

        // Invariant 8: straight lid batten width is constant across states
        expect(
          lid.states.locked.straightLidBatten.endX - lid.states.locked.straightLidBatten.startX,
        ).toBe(lid.straightLidBatten.dimensions.width);
        expect(
          lid.states.releaseThreshold.straightLidBatten.endX -
            lid.states.releaseThreshold.straightLidBatten.startX,
        ).toBe(lid.straightLidBatten.dimensions.width);
        expect(
          lid.states.shiftedForRelease.straightLidBatten.endX -
            lid.states.shiftedForRelease.straightLidBatten.startX,
        ).toBe(lid.straightLidBatten.dimensions.width);
      });
    });
  });
});

describe('calculateLockingMechanismGeometry', () => {
  describe('Default worked fixture (600 × 300 × 250 × 18 mm, α = 2°, β = 10°, Q = 1 mm)', () => {
    it('calculates exact hand-calculated reference values for the locking mechanism', () => {
      const design = createDefaultToolboxDesign();
      const result = calculateLockingMechanismGeometry(design);

      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }

      const {
        lockingFixedTopBatten,
        lockingLidBatten,
        wedge,
        channel,
        capture,
        vertical,
        manufacturing,
      } = result.geometry;

      // 1. Locking-end fixed top batten
      expect(lockingFixedTopBatten.dimensions).toEqual({
        length: 300,
        width: 54,
        thickness: 18,
      });
      expect(lockingFixedTopBatten.bevelAngle).toBe(10);
      expect(lockingFixedTopBatten.bevelOffsetNormal).toBeCloseTo(3.17388565, 6);
      expect(lockingFixedTopBatten.innerEdgeX).toBe(546);

      // 2. Locking lid batten
      expect(lockingLidBatten.blankDimensions).toEqual({
        length: 296,
        width: 45,
        thickness: 18,
      });
      expect(lockingLidBatten.maximumWidth).toBe(45);
      expect(lockingLidBatten.minimumWidth).toBeCloseTo(34.66345223, 6);
      expect(lockingLidBatten.taperDelta).toBeCloseTo(10.33654777, 6);
      expect(lockingLidBatten.interiorEdgeX).toBe(477.5);
      expect(lockingLidBatten.narrowEndWedgeFaceX).toBe(522.5);
      expect(lockingLidBatten.wideEndWedgeFaceX).toBeCloseTo(512.16345223, 6);

      // Plan corners for locking lid batten (yStart = 2, yEnd = 298)
      expect(lockingLidBatten.planCorners.interiorNarrowCorner).toEqual({ x: 477.5, y: 2 });
      expect(lockingLidBatten.planCorners.interiorWideCorner).toEqual({ x: 477.5, y: 298 });
      expect(lockingLidBatten.planCorners.wedgeNarrowCorner).toEqual({ x: 522.5, y: 2 });
      expect(lockingLidBatten.planCorners.wedgeWideCorner.x).toBeCloseTo(512.16345223, 6);
      expect(lockingLidBatten.planCorners.wedgeWideCorner.y).toBe(298);

      // 3. Removable Locking Wedge
      expect(wedge.workingLength).toBe(296);
      expect(wedge.recommendedOverlength).toBe(36);
      expect(wedge.recommendedBlankLength).toBe(332);
      expect(wedge.blankDimensions).toEqual({
        length: 332,
        width: 68.5,
        thickness: 18,
      });
      expect(wedge.bottomNarrowWidth).toBe(23.5);
      expect(wedge.bottomWideWidth).toBeCloseTo(33.83654777, 6);
      expect(wedge.topNarrowWidth).toBeCloseTo(17.15029407, 6);
      expect(wedge.topWideWidth).toBeCloseTo(27.48684184, 6);
      expect(wedge.taperAngle).toBe(2);
      expect(wedge.bevelAngle).toBe(10);
      expect(wedge.bevelOffsetNormalPerSide).toBeCloseTo(3.17388565, 6);
      expect(wedge.taperRate).toBeCloseTo(0.03492077, 6);
      expect(wedge.insertionDirection).toBe('+Y');

      // Plan corners for wedge (yStart = 2, yEnd = 298)
      expect(wedge.planCorners.fixedBattenNarrowCorner).toEqual({ x: 546, y: 2 });
      expect(wedge.planCorners.fixedBattenWideCorner).toEqual({ x: 546, y: 298 });
      expect(wedge.planCorners.battenMatingNarrowCorner).toEqual({ x: 522.5, y: 2 });
      expect(wedge.planCorners.battenMatingWideCorner.x).toBeCloseTo(512.16345223, 6);
      expect(wedge.planCorners.battenMatingWideCorner.y).toBe(298);

      // 4. Channel
      expect(channel.minimumBottomWidth).toBe(23.5);
      expect(channel.maximumBottomWidth).toBeCloseTo(33.83654777, 6);
      expect(channel.residualGapAfterFullLidShift).toBe(1.0);

      // 5. Vertical Capture
      expect(capture.topWidthReduction).toBeCloseTo(6.34970593, 6);
      expect(capture.verticallyCaptured).toBe(true);

      // 6. Vertical Z-levels
      expect(vertical).toEqual({
        wedgeBottomZ: 250,
        wedgeTopZ: 268,
        lockingBattenBottomZ: 250,
        lockingBattenTopZ: 268,
      });

      // 7. Manufacturing dimensions
      expect(manufacturing.combinedLockingBlankWidth).toBe(68.5);
      expect(manufacturing.recommendedWedgeOverlength).toBe(36);
      expect(manufacturing.recommendedWedgeBlankLength).toBe(332);
      expect(lockingLidBatten.minimumWidth + wedge.bottomWideWidth).toBeCloseTo(68.5, 6);

      expect(result.warnings).toEqual([]);
    });
  });

  describe('Second hand-calculated fixture (450 × 240 × 200 × 15 mm, α = 2°, β = 10°, Q = 1 mm)', () => {
    it('calculates exact hand-calculated reference values with non-default proportions', () => {
      const design = createDefaultToolboxDesign({
        dimensions: {
          length: 450,
          width: 240,
          height: 200,
          stockThickness: 15,
        },
        constructionParameters: {
          fixedTopBattenWidth: 45,
          lidThickness: 12,
          lidSideClearance: 1.5,
          desiredOverlap: 10,
          lidBattenWidth: 37.5,
          lidBattenOverhang: 15,
          wedgeTaperAngle: 2,
          wedgeBevelAngle: 10,
          lockingBattenTravelClearance: 1,
        },
      });

      const result = calculateLockingMechanismGeometry(design);

      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }

      const {
        lockingFixedTopBatten,
        lockingLidBatten,
        wedge,
        channel,
        capture,
        vertical,
        manufacturing,
      } = result.geometry;

      // 1. Locking-end fixed top batten
      expect(lockingFixedTopBatten.dimensions).toEqual({
        length: 240,
        width: 45,
        thickness: 15,
      });
      expect(lockingFixedTopBatten.bevelAngle).toBe(10);
      expect(lockingFixedTopBatten.bevelOffsetNormal).toBeCloseTo(2.64490471, 6);
      expect(lockingFixedTopBatten.innerEdgeX).toBe(405);

      // 2. Locking lid batten (L = 237, B = 37.5)
      expect(lockingLidBatten.blankDimensions).toEqual({
        length: 237,
        width: 37.5,
        thickness: 15,
      });
      expect(lockingLidBatten.maximumWidth).toBe(37.5);
      expect(lockingLidBatten.minimumWidth).toBeCloseTo(29.22377763, 6);
      expect(lockingLidBatten.taperDelta).toBeCloseTo(8.27622237, 6);
      expect(lockingLidBatten.interiorEdgeX).toBe(405 - 21 - 37.5); // 346.5
      expect(lockingLidBatten.narrowEndWedgeFaceX).toBe(405 - 21); // 384
      expect(lockingLidBatten.wideEndWedgeFaceX).toBeCloseTo(405 - 21 - 8.27622237, 6);

      // 3. Wedge (D = 20, Q = 1 -> Wmin = 21)
      expect(wedge.workingLength).toBe(237);
      expect(wedge.recommendedOverlength).toBe(30);
      expect(wedge.recommendedBlankLength).toBe(267);
      expect(wedge.blankDimensions).toEqual({
        length: 267,
        width: 58.5,
        thickness: 15,
      });
      expect(wedge.bottomNarrowWidth).toBe(21);
      expect(wedge.bottomWideWidth).toBeCloseTo(29.27622237, 6);
      expect(wedge.topNarrowWidth).toBeCloseTo(15.70857839, 6);
      expect(wedge.topWideWidth).toBeCloseTo(23.98480076, 6);
      expect(wedge.bevelOffsetNormalPerSide).toBeCloseTo(2.64490471, 6);

      // 4. Channel
      expect(channel.minimumBottomWidth).toBe(21);
      expect(channel.maximumBottomWidth).toBeCloseTo(29.27622237, 6);
      expect(channel.residualGapAfterFullLidShift).toBe(1.0);

      // 5. Capture & manufacturing
      expect(capture.topWidthReduction).toBeCloseTo(5.29142161, 6);
      expect(capture.verticallyCaptured).toBe(true);
      expect(manufacturing.combinedLockingBlankWidth).toBe(58.5);
      expect(manufacturing.recommendedWedgeOverlength).toBe(30);
      expect(manufacturing.recommendedWedgeBlankLength).toBe(267);

      // 6. Vertical Z-levels
      expect(vertical).toEqual({
        wedgeBottomZ: 200,
        wedgeTopZ: 215,
        lockingBattenBottomZ: 200,
        lockingBattenTopZ: 215,
      });
    });
  });

  describe('Algebraic invariants for locking mechanism', () => {
    const testCases: CreateToolboxDesignOptions[] = [
      {},
      {
        dimensions: { length: 500, width: 280, height: 220, stockThickness: 16 },
        constructionParameters: {
          fixedTopBattenWidth: 48,
          lidThickness: 16,
          lidSideClearance: 1.5,
          desiredOverlap: 12,
          lidBattenWidth: 40,
          lidBattenOverhang: 16,
          wedgeTaperAngle: 1.8,
          wedgeBevelAngle: 12,
          lockingBattenTravelClearance: 1.5,
        },
      },
      {
        dimensions: { length: 700, width: 350, height: 300, stockThickness: 20 },
        constructionParameters: {
          fixedTopBattenWidth: 60,
          lidThickness: 20,
          lidSideClearance: 2.5,
          desiredOverlap: 15,
          lidBattenWidth: 50,
          lidBattenOverhang: 22,
          wedgeTaperAngle: 2.5,
          wedgeBevelAngle: 8,
          lockingBattenTravelClearance: 2,
        },
      },
    ];

    testCases.forEach((testCase, idx) => {
      it(`preserves all locking geometry invariants for configuration #${idx + 1}`, () => {
        const design = createDefaultToolboxDesign(testCase);
        const result = calculateToolboxGeometry(design);

        expect(result.ok).toBe(true);
        if (!result.ok) {
          return;
        }

        const { lid, lockingMechanism } = result.geometry;
        const q = design.constructionParameters.lockingBattenTravelClearance;

        // Invariant 1: wedgeBottomNarrowWidth = availableLidTravel + lockingBattenTravelClearance
        expect(lockingMechanism.wedge.bottomNarrowWidth).toBe(
          lid.longitudinalFit.availableTravel + q,
        );

        // Invariant 2: remainingGapAfterFullLidShift = lockingBattenTravelClearance
        expect(lockingMechanism.channel.residualGapAfterFullLidShift).toBe(q);

        // Invariant 3: wedgeBottomWideWidth - wedgeBottomNarrowWidth = taperDelta
        expect(
          lockingMechanism.wedge.bottomWideWidth - lockingMechanism.wedge.bottomNarrowWidth,
        ).toBeCloseTo(lockingMechanism.lockingLidBatten.taperDelta, 9);

        // Invariant 4: lockingBattenMaximumWidth - lockingBattenMinimumWidth = taperDelta
        expect(
          lockingMechanism.lockingLidBatten.maximumWidth -
            lockingMechanism.lockingLidBatten.minimumWidth,
        ).toBeCloseTo(lockingMechanism.lockingLidBatten.taperDelta, 9);

        // Invariant 5: One-blank invariant: maximumWidth + bottomNarrowWidth = minimumWidth + bottomWideWidth
        expect(
          lockingMechanism.lockingLidBatten.maximumWidth + lockingMechanism.wedge.bottomNarrowWidth,
        ).toBeCloseTo(
          lockingMechanism.lockingLidBatten.minimumWidth + lockingMechanism.wedge.bottomWideWidth,
          9,
        );

        // Invariant 6: combinedLockingBlankWidth = lidBattenWidth + wedgeBottomNarrowWidth
        expect(lockingMechanism.manufacturing.combinedLockingBlankWidth).toBe(
          design.constructionParameters.lidBattenWidth + lockingMechanism.wedge.bottomNarrowWidth,
        );

        // Invariant 7: Vertical capture top width < bottom width
        expect(lockingMechanism.wedge.topNarrowWidth).toBeLessThan(
          lockingMechanism.wedge.bottomNarrowWidth,
        );
        expect(lockingMechanism.wedge.topWideWidth).toBeLessThan(
          lockingMechanism.wedge.bottomWideWidth,
        );
        expect(lockingMechanism.wedge.topNarrowWidth).toBeGreaterThan(0);
        expect(lockingMechanism.capture.verticallyCaptured).toBe(true);

        // Invariant 8: Recommended wedge blank length = workingLength + 2 * T
        expect(lockingMechanism.wedge.recommendedBlankLength).toBe(
          lockingMechanism.wedge.workingLength + 2 * design.dimensions.stockThickness,
        );
      });
    });
  });

  describe('Fractional-millimetre inputs, unit independence, and immutability', () => {
    it('handles precise fractional-millimetre inputs accurately', () => {
      const design = createDefaultToolboxDesign({
        dimensions: {
          length: 609.6,
          width: 304.8,
          height: 254.0,
          stockThickness: 19.05,
        },
        constructionParameters: {
          lidThickness: 19.05,
          fixedTopBattenWidth: 57.15,
          lidBattenWidth: 47.625,
          lidSideClearance: 1.5875,
          desiredOverlap: 14.2875,
          lidBattenOverhang: 19.05,
          wedgeTaperAngle: 2,
          wedgeBevelAngle: 10,
          lockingBattenTravelClearance: 1.5875,
        },
      });

      const result = calculateLockingMechanismGeometry(design);
      expect(result.ok).toBe(true);
    });

    it('produces identical locking geometry regardless of presentation unitSystem', () => {
      const metricDesign = createDefaultToolboxDesign();
      const imperialDesign = setDesignUnitSystem(metricDesign, 'imperial');

      const metricResult = calculateToolboxGeometry(metricDesign);
      const imperialResult = calculateToolboxGeometry(imperialDesign);

      expect(metricResult.ok).toBe(true);
      expect(imperialResult.ok).toBe(true);
      if (metricResult.ok && imperialResult.ok) {
        expect(metricResult.geometry.lockingMechanism).toEqual(
          imperialResult.geometry.lockingMechanism,
        );
      }
    });

    it('does not mutate input design or calculated geometries during calculation', () => {
      const design = createDefaultToolboxDesign();
      const designSnapshot = JSON.stringify(design);

      const boxResult = calculateBoxGeometry(design);
      const lidResult = calculateLidGeometry(design, boxResult.ok ? boxResult.geometry : undefined);
      const boxSnapshot = JSON.stringify(boxResult);
      const lidSnapshot = JSON.stringify(lidResult);

      const lockingResult = calculateLockingMechanismGeometry(
        design,
        boxResult.ok ? boxResult.geometry : undefined,
        lidResult.ok ? lidResult.geometry : undefined,
      );

      expect(JSON.stringify(design)).toBe(designSnapshot);
      expect(JSON.stringify(boxResult)).toBe(boxSnapshot);
      expect(JSON.stringify(lidResult)).toBe(lidSnapshot);
      expect(lockingResult.ok).toBe(true);
    });

    it('aggregate calculateToolboxGeometry preserves exact Phase 4 box and lid results', () => {
      const design = createDefaultToolboxDesign();
      const boxOnly = calculateBoxGeometry(design);
      const lidOnly = calculateLidGeometry(design);
      const combined = calculateToolboxGeometry(design);

      expect(boxOnly.ok).toBe(true);
      expect(lidOnly.ok).toBe(true);
      expect(combined.ok).toBe(true);

      if (boxOnly.ok && lidOnly.ok && combined.ok) {
        expect(combined.geometry.box).toEqual(boxOnly.geometry);
        expect(combined.geometry.lid).toEqual(lidOnly.geometry);
        expect(combined.geometry.lockingMechanism).toBeDefined();
      }
    });
  });
});

describe('validateLockingMechanismGeometry', () => {
  it('rejects non-positive and non-finite locking batten travel clearance', () => {
    const invalidClearances = [0, -1, NaN, Infinity, -Infinity];

    invalidClearances.forEach((clearance) => {
      const design = createDefaultToolboxDesign({
        constructionParameters: { lockingBattenTravelClearance: clearance },
      });

      const { errors } = validateLockingMechanismGeometry(design);
      expect(errors.some((e) => e.code === 'INVALID_LOCKING_BATTEN_TRAVEL_CLEARANCE')).toBe(true);
    });
  });

  it('rejects invalid wedge taper angle α (<= 0 or >= 45 degrees or non-finite)', () => {
    const invalidAlphas = [0, -2, 45, 50, NaN, Infinity, -Infinity];

    invalidAlphas.forEach((alpha) => {
      const design = createDefaultToolboxDesign({
        constructionParameters: { wedgeTaperAngle: alpha },
      });

      const { errors } = validateLockingMechanismGeometry(design);
      expect(errors.some((e) => e.code === 'INVALID_WEDGE_TAPER_ANGLE')).toBe(true);
    });
  });

  it('rejects invalid wedge bevel angle β (<= 0 or >= 45 degrees or non-finite)', () => {
    const invalidBetas = [0, -10, 45, 60, NaN, Infinity, -Infinity];

    invalidBetas.forEach((beta) => {
      const design = createDefaultToolboxDesign({
        constructionParameters: { wedgeBevelAngle: beta },
      });

      const { errors } = validateLockingMechanismGeometry(design);
      expect(errors.some((e) => e.code === 'INVALID_WEDGE_BEVEL_ANGLE')).toBe(true);
    });
  });

  it('rejects taper angle when taperDelta >= lidBattenWidth (WEDGE_TAPER_TOO_STEEP_FOR_LID_BATTEN)', () => {
    // With L = 296, B = 45, taper angle alpha = 10 deg -> taperDelta = 296 * tan(10 deg) = 52.19 > 45
    const design = createDefaultToolboxDesign({
      constructionParameters: { wedgeTaperAngle: 10 },
    });

    const { errors } = validateLockingMechanismGeometry(design);
    expect(errors.some((e) => e.code === 'WEDGE_TAPER_TOO_STEEP_FOR_LID_BATTEN')).toBe(true);
  });

  it('rejects bevel angle when topWidthReduction removes entire narrow wedge top (WEDGE_BEVEL_TOO_STEEP_FOR_WIDTH)', () => {
    // Default Wmin = 23.5. If T = 50, beta = 30 deg -> H = 50 * tan(30) = 28.86 > 23.5
    const design = createDefaultToolboxDesign({
      dimensions: { stockThickness: 40, height: 350 },
      constructionParameters: {
        fixedTopBattenWidth: 100,
        wedgeBevelAngle: 30,
        desiredOverlap: 20,
      },
    });

    const { errors } = validateLockingMechanismGeometry(design);
    expect(errors.some((e) => e.code === 'WEDGE_BEVEL_TOO_STEEP_FOR_WIDTH')).toBe(true);
  });

  it('rejects locking lid batten when it extends outside the lid panel (LOCKING_LID_BATTEN_OUTSIDE_PANEL)', () => {
    // If length X is small relative to battens and wedge width
    const design = createDefaultToolboxDesign({
      dimensions: { length: 200, width: 200, height: 150, stockThickness: 15 },
      constructionParameters: {
        fixedTopBattenWidth: 50,
        lidBattenWidth: 40,
        desiredOverlap: 10,
        lockingBattenTravelClearance: 10,
      },
    });

    const { errors } = validateLockingMechanismGeometry(design);
    expect(
      errors.some(
        (e) => e.code === 'LOCKING_LID_BATTEN_OUTSIDE_PANEL' || e.code === 'LID_BATTENS_OVERLAP',
      ),
    ).toBe(true);
  });

  it('accumulates box, lid, and locking mechanism errors in validateToolboxGeometry', () => {
    const design = createDefaultToolboxDesign({
      dimensions: { length: -10 },
      constructionParameters: {
        lidThickness: -5,
        lockingBattenTravelClearance: -1,
      },
    });

    const { errors } = validateToolboxGeometry(design);
    const codes = errors.map((e) => e.code);

    expect(codes).toContain('INVALID_LENGTH');
    expect(codes).toContain('INVALID_LID_THICKNESS');
    expect(codes).toContain('INVALID_LOCKING_BATTEN_TRAVEL_CLEARANCE');
    expect(errors.length).toBe(3);
  });
});
