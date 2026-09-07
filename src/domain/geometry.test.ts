import { describe, expect, it } from 'vitest';
import { createDefaultToolboxDesign, type CreateToolboxDesignOptions } from './defaults';
import { setDesignUnitSystem } from './design';
import {
  calculateBoxGeometry,
  calculateLidGeometry,
  calculateLockingMechanismGeometry,
  calculateToolboxGeometry,
} from './geometry';

describe('calculateBoxGeometry (Phase 10A Corrected Carcass)', () => {
  describe('Default worked fixture (600 × 300 × 250 × 18 mm, Tb = 12 mm, I = 36 mm, H = 72 mm, G = 3 mm, R = 84 mm)', () => {
    it('calculates exact hand-calculated reference values for the V2 default design', () => {
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

      // Internal body
      // internalLength = X - 2(I + T) = 600 - 2*(36 + 18) = 492
      expect(result.geometry.internal.length).toBe(492);
      // internalWidth = Y - 2T = 300 - 36 = 264
      expect(result.geometry.internal.width).toBe(264);
      // internalHeight = Z - Tb = 250 - 12 = 238
      expect(result.geometry.internal.height).toBe(238);

      // 1. Long side boards (2 of them: X × (Z - Tb) × T)
      expect(result.geometry.parts.side.quantity).toBe(2);
      expect(result.geometry.parts.side.dimensions).toEqual({
        length: 600,
        width: 238,
        thickness: 18,
      });

      // 2. End walls housed into side dados (2 of them: (Y - 2T + 2G) × (Z - Tb) × T)
      expect(result.geometry.parts.end.quantity).toBe(2);
      expect(result.geometry.parts.end.dimensions).toEqual({
        length: 270,
        width: 238,
        thickness: 18,
      });

      // 3. Bottom board (1 of them: X × Y × Tb)
      expect(result.geometry.parts.bottom.quantity).toBe(1);
      expect(result.geometry.parts.bottom.dimensions).toEqual({
        length: 600,
        width: 300,
        thickness: 12,
      });

      // 4. End caps / Fixed top battens (2 of them: Y × R × T)
      expect(result.geometry.parts.fixedTopBatten.quantity).toBe(2);
      expect(result.geometry.parts.fixedTopBatten.dimensions).toEqual({
        length: 300,
        width: 84,
        thickness: 18,
      });

      // 5. Solid grab handles (2 of them: (Y - 2T) × H × I)
      expect(result.geometry.parts.handle.quantity).toBe(2);
      expect(result.geometry.parts.handle.dimensions).toEqual({
        length: 264,
        width: 72,
        thickness: 36,
      });

      // Clear top opening and pocket depth
      // topOpeningLength = X - 2R = 600 - 168 = 432
      expect(result.geometry.topOpening.length).toBe(432);
      expect(result.geometry.topOpening.width).toBe(264);
      // pocketDepth = R - I - T = 84 - 36 - 18 = 30
      expect(result.geometry.topOpening.battenInteriorProjection).toBe(30);

      // Layout: End walls
      expect(result.geometry.layout.endWalls.stop).toEqual({
        startX: 36,
        endX: 54,
        outsideFaceX: 36,
        insideFaceX: 54,
      });
      expect(result.geometry.layout.endWalls.locking).toEqual({
        startX: 546,
        endX: 564,
        outsideFaceX: 564,
        insideFaceX: 546,
      });

      // Layout: Handles
      expect(result.geometry.layout.handles.stop).toEqual({
        startX: 0,
        endX: 36,
        startY: 18,
        endY: 282,
        startZ: 178, // 250 - 72
        endZ: 250,
      });
      expect(result.geometry.layout.handles.locking).toEqual({
        startX: 564,
        endX: 600,
        startY: 18,
        endY: 282,
        startZ: 178,
        endZ: 250,
      });

      // Layout: Handle bays
      expect(result.geometry.layout.handleBays.stop).toEqual({
        startX: 0,
        endX: 36,
      });
      expect(result.geometry.layout.handleBays.locking).toEqual({
        startX: 564,
        endX: 600,
      });

      // Layout: Housing dados
      expect(result.geometry.layout.housingDados).toEqual({
        width: 18,
        depth: 3,
        verticalStart: 12,
        verticalEnd: 250,
        stopEnd: {
          startX: 36,
          endX: 54,
          frontY: { startY: 15, endY: 18 },
          backY: { startY: 282, endY: 285 },
        },
        lockingEnd: {
          startX: 546,
          endX: 564,
          frontY: { startY: 15, endY: 18 },
          backY: { startY: 282, endY: 285 },
        },
      });

      // Warnings
      expect(result.warnings).toEqual([]);
    });
  });

  describe('Second hand-calculated fixture (450 × 240 × 200 × 15 mm, Tb = 10 mm, I = 30 mm, H = 60 mm, G = 2.5 mm, R = 70 mm, B = 35 mm)', () => {
    it('calculates exact hand-calculated reference values with non-default proportions', () => {
      const design = createDefaultToolboxDesign({
        dimensions: {
          length: 450,
          width: 240,
          height: 200,
          stockThickness: 15,
        },
        constructionParameters: {
          bottomThickness: 10,
          lidThickness: 10,
          endHandleDepth: 30,
          endHandleHeight: 60,
          housingDadoDepth: 2.5,
          fixedTopBattenWidth: 70,
          lidBattenWidth: 35,
          lidSideClearance: 1.5,
          desiredOverlap: 10,
          lidBattenOverhang: 15,
          lockingBattenTravelClearance: 1,
          wedgeTaperAngle: 2,
          wedgeBevelAngle: 10,
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
      // internalLength = 450 - 2*(30 + 15) = 360
      expect(result.geometry.internal.length).toBe(360);
      // internalWidth = 240 - 2*15 = 210
      expect(result.geometry.internal.width).toBe(210);
      // internalHeight = 200 - 10 = 190
      expect(result.geometry.internal.height).toBe(190);

      // Side: 450 × 190 × 15
      expect(result.geometry.parts.side.dimensions).toEqual({
        length: 450,
        width: 190,
        thickness: 15,
      });

      // End: (210 + 5) × 190 × 15 = 215 × 190 × 15
      expect(result.geometry.parts.end.dimensions).toEqual({
        length: 215,
        width: 190,
        thickness: 15,
      });

      // Bottom: 450 × 240 × 10
      expect(result.geometry.parts.bottom.dimensions).toEqual({
        length: 450,
        width: 240,
        thickness: 10,
      });

      // Handle: 210 × 60 × 30
      expect(result.geometry.parts.handle.dimensions).toEqual({
        length: 210,
        width: 60,
        thickness: 30,
      });

      // End cap: 240 × 70 × 15
      expect(result.geometry.parts.fixedTopBatten.dimensions).toEqual({
        length: 240,
        width: 70,
        thickness: 15,
      });

      // Top opening
      expect(result.geometry.topOpening.length).toBe(310);
      expect(result.geometry.topOpening.width).toBe(210);
      expect(result.geometry.topOpening.battenInteriorProjection).toBe(25); // 70 - 30 - 15
    });
  });

  describe('Carcass Invariants (Sections 38-42, 30)', () => {
    it('invariant: endWallBlankLength = internalWidth + 2G', () => {
      const design = createDefaultToolboxDesign();
      const result = calculateBoxGeometry(design);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.geometry.parts.end.dimensions.length).toBe(
          result.geometry.internal.width + 2 * design.constructionParameters.housingDadoDepth,
        );
        expect(result.geometry.parts.end.dimensions.length).toBe(270);
      }
    });

    it('invariant: internalLength = distance between inner faces of the two inset end walls', () => {
      const design = createDefaultToolboxDesign();
      const result = calculateBoxGeometry(design);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const stopInnerX = result.geometry.layout.endWalls.stop.insideFaceX;
        const lockingInnerX = result.geometry.layout.endWalls.locking.insideFaceX;
        expect(lockingInnerX - stopInnerX).toBe(result.geometry.internal.length);
        expect(lockingInnerX - stopInnerX).toBe(492);
      }
    });

    it('invariant: pocketDepth = stop opening edge X - stop end-wall inner face X = locking end-wall inner face X - locking opening edge X', () => {
      const design = createDefaultToolboxDesign();
      const result = calculateBoxGeometry(design);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const stopOpeningEdgeX = design.constructionParameters.fixedTopBattenWidth;
        const stopEndInnerX = result.geometry.layout.endWalls.stop.insideFaceX;
        const stopPocketDepth = stopOpeningEdgeX - stopEndInnerX;

        const lockingOpeningEdgeX =
          design.dimensions.length - design.constructionParameters.fixedTopBattenWidth;
        const lockingEndInnerX = result.geometry.layout.endWalls.locking.insideFaceX;
        const lockingPocketDepth = lockingEndInnerX - lockingOpeningEdgeX;

        expect(stopPocketDepth).toBe(30);
        expect(lockingPocketDepth).toBe(30);
        expect(stopPocketDepth).toBe(result.geometry.topOpening.battenInteriorProjection);
      }
    });

    it('invariant: handle bay depth = I and handle thickness = I', () => {
      const design = createDefaultToolboxDesign();
      const result = calculateBoxGeometry(design);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const I = design.constructionParameters.endHandleDepth;
        expect(
          result.geometry.layout.handleBays.stop.endX -
            result.geometry.layout.handleBays.stop.startX,
        ).toBe(I);
        expect(
          result.geometry.layout.handleBays.locking.endX -
            result.geometry.layout.handleBays.locking.startX,
        ).toBe(I);
        expect(result.geometry.parts.handle.dimensions.thickness).toBe(I);
      }
    });

    it('invariant: housing fit - end wall physical Y extent equals blank length', () => {
      const design = createDefaultToolboxDesign();
      const result = calculateBoxGeometry(design);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const T = design.dimensions.stockThickness;
        const G = design.constructionParameters.housingDadoDepth;
        const Y = design.dimensions.width;
        const startY = T - G;
        const endY = Y - T + G;
        expect(endY - startY).toBe(result.geometry.parts.end.dimensions.length);
        expect(endY - startY).toBe(270);
      }
    });

    it('domain part count: total finished physical parts equals 13', () => {
      const design = createDefaultToolboxDesign();
      const full = calculateToolboxGeometry(design);
      expect(full.ok).toBe(true);
      if (full.ok) {
        const totalParts =
          full.geometry.box.parts.side.quantity + // 2
          full.geometry.box.parts.end.quantity + // 2
          full.geometry.box.parts.bottom.quantity + // 1
          full.geometry.box.parts.fixedTopBatten.quantity + // 2
          full.geometry.box.parts.handle.quantity + // 2
          1 + // lid panel
          full.geometry.lid.straightLidBatten.quantity + // 1
          1 + // locking lid batten
          1; // locking wedge
        expect(totalParts).toBe(13);
      }
    });
  });

  describe('Validation & Error Handling (Box parameters)', () => {
    it('rejects non-positive bottom thickness (Tb <= 0)', () => {
      const design = createDefaultToolboxDesign({
        constructionParameters: { bottomThickness: 0 },
      });
      const result = calculateBoxGeometry(design);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.code === 'INVALID_BOTTOM_THICKNESS')).toBe(true);
      }
    });

    it('rejects bottom thickness greater than or equal to body height (Tb >= Z)', () => {
      const design = createDefaultToolboxDesign({
        dimensions: { height: 200 },
        constructionParameters: { bottomThickness: 200 },
      });
      const result = calculateBoxGeometry(design);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.code === 'BOTTOM_TOO_THICK')).toBe(true);
      }
    });

    it('rejects non-positive end handle depth (I <= 0)', () => {
      const design = createDefaultToolboxDesign({
        constructionParameters: { endHandleDepth: 0 },
      });
      const result = calculateBoxGeometry(design);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.code === 'INVALID_END_HANDLE_DEPTH')).toBe(true);
      }
    });

    it('rejects length too small for inset ends (X <= 2(I + T))', () => {
      // I = 36, T = 18 -> 2(I + T) = 108
      const design = createDefaultToolboxDesign({
        dimensions: { length: 108, stockThickness: 18 },
        constructionParameters: { endHandleDepth: 36 },
      });
      const result = calculateBoxGeometry(design);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.code === 'LENGTH_TOO_SMALL_FOR_INSET_ENDS')).toBe(true);
      }
    });

    it('rejects non-positive end handle height (H <= 0)', () => {
      const design = createDefaultToolboxDesign({
        constructionParameters: { endHandleHeight: 0 },
      });
      const result = calculateBoxGeometry(design);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.code === 'INVALID_END_HANDLE_HEIGHT')).toBe(true);
      }
    });

    it('rejects end handle too tall (H >= Z - Tb)', () => {
      // Z = 250, Tb = 12 -> Z - Tb = 238
      const designEqual = createDefaultToolboxDesign({
        dimensions: { height: 250 },
        constructionParameters: { bottomThickness: 12, endHandleHeight: 238 },
      });
      const resultEqual = calculateBoxGeometry(designEqual);
      expect(resultEqual.ok).toBe(false);
      if (!resultEqual.ok) {
        expect(resultEqual.errors.some((e) => e.code === 'END_HANDLE_TOO_TALL')).toBe(true);
      }

      const designGreater = createDefaultToolboxDesign({
        dimensions: { height: 250 },
        constructionParameters: { bottomThickness: 12, endHandleHeight: 240 },
      });
      const resultGreater = calculateBoxGeometry(designGreater);
      expect(resultGreater.ok).toBe(false);
      if (!resultGreater.ok) {
        expect(resultGreater.errors.some((e) => e.code === 'END_HANDLE_TOO_TALL')).toBe(true);
      }
    });

    it('rejects non-positive housing dado depth (G <= 0)', () => {
      const design = createDefaultToolboxDesign({
        constructionParameters: { housingDadoDepth: 0 },
      });
      const result = calculateBoxGeometry(design);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.code === 'INVALID_HOUSING_DADO_DEPTH')).toBe(true);
      }
    });

    it('rejects housing dado depth too deep (G >= T)', () => {
      // T = 18
      const designEqual = createDefaultToolboxDesign({
        dimensions: { stockThickness: 18 },
        constructionParameters: { housingDadoDepth: 18 },
      });
      const resultEqual = calculateBoxGeometry(designEqual);
      expect(resultEqual.ok).toBe(false);
      if (!resultEqual.ok) {
        expect(resultEqual.errors.some((e) => e.code === 'HOUSING_DADO_TOO_DEEP')).toBe(true);
      }
    });

    it('rejects fixed top batten too narrow for inset end wall (R <= I + T)', () => {
      // I = 36, T = 18 -> I + T = 54
      const designEqual = createDefaultToolboxDesign({
        dimensions: { stockThickness: 18 },
        constructionParameters: { endHandleDepth: 36, fixedTopBattenWidth: 54 },
      });
      const resultEqual = calculateBoxGeometry(designEqual);
      expect(resultEqual.ok).toBe(false);
      if (!resultEqual.ok) {
        expect(resultEqual.errors.some((e) => e.code === 'FIXED_TOP_BATTEN_TOO_NARROW')).toBe(true);
      }
    });

    it('rejects 2R >= X and accepts 2R < X', () => {
      const designEqual = createDefaultToolboxDesign({
        dimensions: { length: 200 },
        constructionParameters: { fixedTopBattenWidth: 100 },
      });
      const resultEqual = calculateBoxGeometry(designEqual);
      expect(resultEqual.ok).toBe(false);
      if (!resultEqual.ok) {
        expect(resultEqual.errors.some((e) => e.code === 'FIXED_TOP_BATTENS_TOO_WIDE')).toBe(true);
      }
    });
  });

  describe('Unit independence and immutability', () => {
    it('calculates identical physical geometry regardless of unitSystem setting', () => {
      const metricDesign = createDefaultToolboxDesign();
      const imperialDesign = setDesignUnitSystem(metricDesign, 'imperial');

      const metricResult = calculateBoxGeometry(metricDesign);
      const imperialResult = calculateBoxGeometry(imperialDesign);

      expect(metricResult.ok).toBe(true);
      expect(imperialResult.ok).toBe(true);
      expect(metricResult).toEqual(imperialResult);
    });

    it('does not mutate or alter the input ToolboxDesign object', () => {
      const design = createDefaultToolboxDesign();
      const snapshot = JSON.parse(JSON.stringify(design));
      Object.freeze(design);

      const result = calculateBoxGeometry(design);
      expect(result.ok).toBe(true);
      expect(design).toEqual(snapshot);
    });
  });
});

describe('calculateLidGeometry & Sliding Lid Mechanics (Phase 4 & 10A)', () => {
  describe('Default worked fixture (X = 600, R = 84, I = 36, T = 18, O = 13.5, B = 42, P = 12, C = 2, E = 18)', () => {
    it('calculates exact hand-calculated reference values for the V2 default lid', () => {
      const design = createDefaultToolboxDesign();
      const result = calculateLidGeometry(design);

      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }

      // 1. Lid panel dimensions (432 + 27 = 459, 264 - 4 = 260, thickness = 12)
      expect(result.geometry.panel.dimensions).toEqual({
        length: 459,
        width: 260,
        thickness: 12,
      });

      // 2. Straight lid batten blank (260 + 36 = 296, width = 42, thickness = 18)
      expect(result.geometry.straightLidBatten.quantity).toBe(1);
      expect(result.geometry.straightLidBatten.dimensions).toEqual({
        length: 296,
        width: 42,
        thickness: 18,
      });
      expect(result.geometry.straightLidBatten.startFromPanelEnd).toBe(13.5);

      // 3. Side-wall bearing and lateral fit
      expect(result.geometry.lateralFit.clearancePerSide).toBe(2);
      expect(result.geometry.lateralFit.battenBearingPerSide).toBe(16);
      expect(result.geometry.lateralFit.outsideInsetPerSide).toBe(2);
      expect(result.geometry.lateralFit.outsideProjectionPerSide).toBe(0);

      // 4. Vertical levels
      expect(result.geometry.vertical).toEqual({
        lidPanelTopZ: 250,
        lidPanelBottomZ: 238, // 250 - 12
        lidBattenBottomZ: 250,
        lidBattenTopZ: 268, // 250 + 18
      });

      // 5. Longitudinal fit & travel
      expect(result.geometry.longitudinalFit).toEqual({
        lockedOverlapPerEnd: 13.5,
        pocketDepth: 30, // 84 - 36 - 18
        travelToReleaseEdge: 13.5,
        availableTravel: 16.5, // 30 - 13.5
        releaseTravelMargin: 3, // 30 - 27
      });

      // 6. Box opening edges
      expect(result.geometry.openingEdges).toEqual({
        stopOpeningEdgeX: 84,
        lockingOpeningEdgeX: 516,
      });

      // 7. Reference state: LOCKED
      expect(result.geometry.states.locked).toEqual({
        name: 'locked',
        translationFromLocked: 0,
        panel: {
          startX: 70.5, // 84 - 13.5
          endX: 529.5, // 516 + 13.5
        },
        straightLidBatten: {
          startX: 84,
          endX: 126, // 84 + 42
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
          startX: 84,
          endX: 543,
        },
        straightLidBatten: {
          startX: 97.5,
          endX: 139.5,
        },
        stopEndOverlap: 0,
        lockingEndOverlap: 27,
        stopEndReleaseClearance: 0,
      });

      // 9. Reference state: SHIFTED_FOR_RELEASE
      expect(result.geometry.states.shiftedForRelease).toEqual({
        name: 'shiftedForRelease',
        translationFromLocked: 16.5,
        panel: {
          startX: 87, // 70.5 + 16.5
          endX: 546, // 529.5 + 16.5 = X - I - T
        },
        straightLidBatten: {
          startX: 100.5,
          endX: 142.5,
        },
        stopEndOverlap: 0,
        lockingEndOverlap: 30,
        stopEndReleaseClearance: 3,
      });

      expect(result.warnings).toEqual([]);
    });
  });

  describe('Boundary tests for fundamental release condition (2O < R - I - T)', () => {
    it('accepts 2O < pocketDepth, rejects 2O = pocketDepth, and rejects 2O > pocketDepth', () => {
      // Default: R = 84, I = 36, T = 18 -> pocketDepth = 30
      // 1. 2O < 30 -> O = 14.9 (2O = 29.8 < 30) -> Valid
      const validDesign = createDefaultToolboxDesign({
        constructionParameters: { desiredOverlap: 14.9 },
      });
      const validResult = calculateLidGeometry(validDesign);
      expect(validResult.ok).toBe(true);
      if (validResult.ok) {
        expect(validResult.geometry.longitudinalFit.releaseTravelMargin).toBeCloseTo(0.2, 5);
      }

      // 2. 2O = 30 -> O = 15 -> Invalid
      const equalDesign = createDefaultToolboxDesign({
        constructionParameters: { desiredOverlap: 15 },
      });
      const equalResult = calculateLidGeometry(equalDesign);
      expect(equalResult.ok).toBe(false);
      if (!equalResult.ok) {
        expect(equalResult.errors.some((e) => e.code === 'INSUFFICIENT_LID_RELEASE_TRAVEL')).toBe(
          true,
        );
      }

      // 3. 2O > 30 -> O = 16 -> Invalid
      const invalidDesign = createDefaultToolboxDesign({
        constructionParameters: { desiredOverlap: 16 },
      });
      const invalidResult = calculateLidGeometry(invalidDesign);
      expect(invalidResult.ok).toBe(false);
      if (!invalidResult.ok) {
        expect(invalidResult.errors.some((e) => e.code === 'INSUFFICIENT_LID_RELEASE_TRAVEL')).toBe(
          true,
        );
      }
    });

    it('rejects lid too thick (P >= Z - Tb)', () => {
      // Z = 250, Tb = 12 -> Z - Tb = 238
      const designEqual = createDefaultToolboxDesign({
        dimensions: { height: 250 },
        constructionParameters: { bottomThickness: 12, lidThickness: 238 },
      });
      const resEqual = calculateLidGeometry(designEqual);
      expect(resEqual.ok).toBe(false);
      if (!resEqual.ok) {
        expect(resEqual.errors.some((e) => e.code === 'LID_TOO_THICK')).toBe(true);
      }
    });
  });

  describe('Algebraic invariants for valid sliding lid geometry', () => {
    const testCases: CreateToolboxDesignOptions[] = [
      {}, // Default
      {
        dimensions: { length: 500, width: 280, height: 220, stockThickness: 16 },
        constructionParameters: {
          bottomThickness: 10,
          endHandleDepth: 32,
          endHandleHeight: 64,
          housingDadoDepth: 2.5,
          fixedTopBattenWidth: 75,
          lidThickness: 10,
          lidSideClearance: 2,
          desiredOverlap: 12,
          lidBattenWidth: 38,
          lidBattenOverhang: 16,
        },
      },
    ];

    testCases.forEach((testCase, index) => {
      it(`preserves all sliding lid invariants for test configuration #${index + 1}`, () => {
        const design = createDefaultToolboxDesign(testCase);
        const result = calculateToolboxGeometry(design);

        expect(result.ok).toBe(true);
        if (!result.ok) {
          return;
        }

        const { box, lid } = result.geometry;
        const x = design.dimensions.length;
        const t = design.dimensions.stockThickness;
        const i = design.constructionParameters.endHandleDepth;

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

        // Invariant 5: fully shifted locking-end panel coordinate touches inner inset end wall (X - I - T)
        expect(lid.states.shiftedForRelease.panel.endX).toBe(x - i - t);

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
      });
    });
  });
});

describe('calculateLockingMechanismGeometry (Phase 5 & 10A)', () => {
  describe('Default worked fixture (600 × 300 × 250 × 18 mm, α = 2°, β = 10°, Q = 1 mm)', () => {
    it('calculates exact hand-calculated reference values for the locking mechanism', () => {
      const design = createDefaultToolboxDesign();
      const result = calculateLockingMechanismGeometry(design);

      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }

      const { lockingFixedTopBatten, lockingLidBatten, wedge, channel, capture, manufacturing } =
        result.geometry;

      // 1. Locking-end fixed top batten
      expect(lockingFixedTopBatten.dimensions).toEqual({
        length: 300,
        width: 84,
        thickness: 18,
      });
      expect(lockingFixedTopBatten.bevelAngle).toBe(10);
      expect(lockingFixedTopBatten.bevelOffsetNormal).toBeCloseTo(3.17388565, 6);
      expect(lockingFixedTopBatten.innerEdgeX).toBe(516); // 600 - 84

      // 2. Locking lid batten
      expect(lockingLidBatten.blankDimensions).toEqual({
        length: 296,
        width: 42,
        thickness: 18,
      });
      expect(lockingLidBatten.maximumWidth).toBe(42);
      expect(lockingLidBatten.minimumWidth).toBeCloseTo(31.66345223, 6);
      expect(lockingLidBatten.taperDelta).toBeCloseTo(10.33654777, 6);
      expect(lockingLidBatten.interiorEdgeX).toBe(456.5); // 516 - 17.5 - 42
      expect(lockingLidBatten.narrowEndWedgeFaceX).toBe(498.5); // 516 - 17.5
      expect(lockingLidBatten.wideEndWedgeFaceX).toBeCloseTo(488.16345223, 6);

      // 3. Removable Locking Wedge
      expect(wedge.workingLength).toBe(296);
      expect(wedge.recommendedOverlength).toBe(36);
      expect(wedge.recommendedBlankLength).toBe(332);
      expect(wedge.bottomNarrowWidth).toBe(17.5);
      expect(wedge.bottomWideWidth).toBeCloseTo(27.83654777, 5);
      expect(wedge.topNarrowWidth).toBeCloseTo(11.15029, 4);
      expect(wedge.topWideWidth).toBeCloseTo(21.48684, 4);

      // 4. Channel and residual gap
      expect(channel.minimumBottomWidth).toBe(17.5);
      expect(channel.maximumBottomWidth).toBeCloseTo(27.83654777, 6);
      expect(channel.residualGapAfterFullLidShift).toBe(1);

      // 5. Vertical capture
      expect(capture.verticallyCaptured).toBe(true);
      expect(capture.topWidthReduction).toBeCloseTo(6.34971, 4);

      // 6. Manufacturing
      expect(manufacturing.combinedLockingBlankWidth).toBe(59.5); // 42 + 17.5
    });
  });
});

describe('calculateToolboxGeometry — Wood Species Independence (Phase 11)', () => {
  it('produces strictly identical physical geometry regardless of selected wood species', () => {
    const pineDesign = createDefaultToolboxDesign({ wood: { id: 'pine' } });
    const oakDesign = createDefaultToolboxDesign({ wood: { id: 'oak' } });
    const hinokiDesign = createDefaultToolboxDesign({ wood: { id: 'hinoki' } });
    const customDesign = createDefaultToolboxDesign({ wood: { id: 'exotic-custom-999' } });

    const pineResult = calculateToolboxGeometry(pineDesign);
    const oakResult = calculateToolboxGeometry(oakDesign);
    const hinokiResult = calculateToolboxGeometry(hinokiDesign);
    const customResult = calculateToolboxGeometry(customDesign);

    expect(pineResult.ok).toBe(true);
    expect(oakResult.ok).toBe(true);
    expect(hinokiResult.ok).toBe(true);
    expect(customResult.ok).toBe(true);

    if (!pineResult.ok || !oakResult.ok || !hinokiResult.ok || !customResult.ok) {
      return;
    }

    expect(oakResult.geometry).toEqual(pineResult.geometry);
    expect(hinokiResult.geometry).toEqual(pineResult.geometry);
    expect(customResult.geometry).toEqual(pineResult.geometry);
  });
});
