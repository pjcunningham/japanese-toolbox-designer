import { describe, expect, it } from 'vitest';
import { createDefaultToolboxDesign } from './defaults';
import type { ToolboxDesign } from './design';
import { setDesignUnitSystem } from './design';
import { calculateBoxGeometry, calculateToolboxGeometry, validateBoxGeometry } from './geometry';

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

  describe('Aliases and utility equivalence', () => {
    it('calculateToolboxGeometry produces identical results to calculateBoxGeometry', () => {
      const design = createDefaultToolboxDesign();
      expect(calculateToolboxGeometry(design)).toEqual(calculateBoxGeometry(design));
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
  });
});
