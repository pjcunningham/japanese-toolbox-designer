import { describe, it, expect } from 'vitest';
import { createDefaultToolboxDesign } from '../../domain/defaults';
import { calculateToolboxGeometry } from '../../domain/geometry';
import { setDesignUnitSystem } from '../../domain/design';
import { createPlanDrawing } from './planProjection';
import { createFrontDrawing } from './frontProjection';
import { createEndDrawing } from './endProjection';

describe('2D Technical Drawing Projections (Phase 9)', () => {
  const defaultDesign = createDefaultToolboxDesign();
  const geometryResult = calculateToolboxGeometry(defaultDesign);

  if (!geometryResult.ok) {
    throw new Error('Default geometry must be valid');
  }
  const geometry = geometryResult.geometry;

  describe('Plan View Projection (Requirements 16–24, 59–60)', () => {
    it('creates accurate plan drawing model for default 600 × 300 × 250 × 18 design', () => {
      const model = createPlanDrawing(geometry);

      expect(model.view).toBe('plan');
      expect(model.title).toBe('Plan View');

      // Footprint (0..600, 0..300)
      const bodyRect = model.rectangles.find((r) => r.id === 'plan-body');
      expect(bodyRect).toBeDefined();
      expect(bodyRect?.x).toBe(0);
      expect(bodyRect?.y).toBe(0);
      expect(bodyRect?.width).toBe(600);
      expect(bodyRect?.height).toBe(300);

      // Stop fixed top batten (0..54, full width 300)
      const stopBattenRect = model.rectangles.find((r) => r.id === 'plan-fixed-top-batten-stop');
      expect(stopBattenRect).toBeDefined();
      expect(stopBattenRect?.x).toBe(0);
      expect(stopBattenRect?.width).toBe(54);
      expect(stopBattenRect?.height).toBe(300);

      // Locking fixed top batten (546..600, full width 300)
      const lockingBattenRect = model.rectangles.find(
        (r) => r.id === 'plan-fixed-top-batten-locking',
      );
      expect(lockingBattenRect).toBeDefined();
      expect(lockingBattenRect?.x).toBe(546);
      expect(lockingBattenRect?.width).toBe(54);
      expect(lockingBattenRect?.height).toBe(300);

      // Locked lid panel (40.5..559.5, Y: 20..280, length 519, width 260)
      const lidPanelRect = model.rectangles.find((r) => r.id === 'plan-lid-panel');
      expect(lidPanelRect).toBeDefined();
      expect(lidPanelRect?.x).toBeCloseTo(40.5, 4);
      expect(lidPanelRect?.y).toBe(20);
      expect(lidPanelRect?.width).toBeCloseTo(519, 4);
      expect(lidPanelRect?.height).toBe(260);

      // Straight lid batten (54..99, Y: 2..298, length 296, width 45)
      const straightBattenRect = model.rectangles.find((r) => r.id === 'plan-straight-lid-batten');
      expect(straightBattenRect).toBeDefined();
      expect(straightBattenRect?.x).toBe(54);
      expect(straightBattenRect?.y).toBe(2);
      expect(straightBattenRect?.width).toBe(45);
      expect(straightBattenRect?.height).toBe(296);

      // Locking lid batten corners match authoritative Phase 5 planCorners
      const lockingPoly = model.polygons.find((p) => p.id === 'plan-locking-lid-batten');
      expect(lockingPoly).toBeDefined();
      expect(lockingPoly?.points).toEqual([
        geometry.lockingMechanism.lockingLidBatten.planCorners.interiorNarrowCorner,
        geometry.lockingMechanism.lockingLidBatten.planCorners.wedgeNarrowCorner,
        geometry.lockingMechanism.lockingLidBatten.planCorners.wedgeWideCorner,
        geometry.lockingMechanism.lockingLidBatten.planCorners.interiorWideCorner,
      ]);
      expect(lockingPoly?.points[0]?.x).toBeCloseTo(477.5, 4);
      expect(lockingPoly?.points[0]?.y).toBe(2);
      expect(lockingPoly?.points[1]?.x).toBeCloseTo(522.5, 4);
      expect(lockingPoly?.points[1]?.y).toBe(2);
      expect(lockingPoly?.points[2]?.x).toBeCloseTo(512.16345, 4);
      expect(lockingPoly?.points[2]?.y).toBe(298);
      expect(lockingPoly?.points[3]?.x).toBeCloseTo(477.5, 4);
      expect(lockingPoly?.points[3]?.y).toBe(298);

      // Wedge corners match authoritative Phase 5 planCorners
      const wedgePoly = model.polygons.find((p) => p.id === 'plan-locking-wedge');
      expect(wedgePoly).toBeDefined();
      expect(wedgePoly?.points).toEqual([
        geometry.lockingMechanism.wedge.planCorners.battenMatingNarrowCorner,
        geometry.lockingMechanism.wedge.planCorners.fixedBattenNarrowCorner,
        geometry.lockingMechanism.wedge.planCorners.fixedBattenWideCorner,
        geometry.lockingMechanism.wedge.planCorners.battenMatingWideCorner,
      ]);
      expect(wedgePoly?.points[1]?.x).toBe(546);
      expect(wedgePoly?.points[2]?.x).toBe(546);

      // Dimensions include overall length, width, top opening, and locked overlap O
      const dimLength = model.dimensions.find((d) => d.id === 'plan-dim-overall-length');
      const dimWidth = model.dimensions.find((d) => d.id === 'plan-dim-overall-width');
      const dimOpening = model.dimensions.find((d) => d.id === 'plan-dim-opening-length');
      const dimOverlap = model.dimensions.find((d) => d.id === 'plan-dim-overlap');

      expect(dimLength?.valueMillimetres).toBe(600);
      expect(dimWidth?.valueMillimetres).toBe(300);
      expect(dimOpening?.valueMillimetres).toBe(492);
      expect(dimOverlap?.valueMillimetres).toBeCloseTo(13.5, 4);

      // Annotations
      expect(model.annotations.some((a) => a.text === 'STOP END')).toBe(true);
      expect(model.annotations.some((a) => a.text === 'LOCKING END')).toBe(true);
      expect(model.annotations.some((a) => a.text.includes('Lid release'))).toBe(true);
      expect(model.annotations.some((a) => a.text.includes('Wedge insertion +Y'))).toBe(true);
      expect(model.annotations.some((a) => a.text.includes('α = 2°'))).toBe(true);
    });
  });

  describe('Front Elevation Projection (Requirements 25–31, 61–62)', () => {
    it('creates accurate front elevation model for default design', () => {
      const model = createFrontDrawing(geometry);

      expect(model.view).toBe('front');
      expect(model.title).toBe('Front Elevation');

      // Bottom board: Z = 0..18, length = 600
      const bottomRect = model.rectangles.find((r) => r.id === 'front-bottom');
      expect(bottomRect?.x).toBe(0);
      expect(bottomRect?.y).toBe(0);
      expect(bottomRect?.width).toBe(600);
      expect(bottomRect?.height).toBe(18);

      // Side wall: Z = 18..250
      const sideWallRect = model.rectangles.find((r) => r.id === 'front-side-wall');
      expect(sideWallRect?.x).toBe(0);
      expect(sideWallRect?.y).toBe(18);
      expect(sideWallRect?.width).toBe(600);
      expect(sideWallRect?.height).toBe(232);

      // Hidden lid panel: Z = 232..250, startX = 40.5, endX = 559.5
      const hiddenLidRect = model.rectangles.find((r) => r.id === 'front-lid-panel');
      expect(hiddenLidRect?.hidden).toBe(true);
      expect(hiddenLidRect?.x).toBeCloseTo(40.5, 4);
      expect(hiddenLidRect?.y).toBe(232);
      expect(hiddenLidRect?.height).toBe(18);

      // Stop top batten: Z = 250..268, X = 0..54
      const stopBatten = model.rectangles.find((r) => r.id === 'front-fixed-top-batten-stop');
      expect(stopBatten?.x).toBe(0);
      expect(stopBatten?.y).toBe(250);
      expect(stopBatten?.width).toBe(54);
      expect(stopBatten?.height).toBe(18);

      // Straight lid batten: Z = 250..268, X = 54..99
      const straightBatten = model.rectangles.find((r) => r.id === 'front-straight-lid-batten');
      expect(straightBatten?.x).toBe(54);
      expect(straightBatten?.y).toBe(250);
      expect(straightBatten?.width).toBe(45);
      expect(straightBatten?.height).toBe(18);

      // Captured wedge cross-section profile
      const wedgePoly = model.polygons.find((p) => p.id === 'front-locking-wedge');
      expect(wedgePoly).toBeDefined();
      const points = wedgePoly!.points;
      // 4 points: bottom-left, bottom-right, top-right, top-left
      expect(points.length).toBe(4);

      const bottomWidth = points[1]!.x - points[0]!.x;
      const topWidth = points[2]!.x - points[3]!.x;

      // Bottom wider than top invariant
      expect(bottomWidth).toBeGreaterThan(topWidth);
      expect(bottomWidth).toBeCloseTo(geometry.lockingMechanism.wedge.bottomNarrowWidth, 4);
      expect(topWidth).toBeCloseTo(geometry.lockingMechanism.wedge.topNarrowWidth, 4);

      // Dimensions
      const dimLength = model.dimensions.find((d) => d.id === 'front-dim-overall-length');
      const dimBodyHeight = model.dimensions.find((d) => d.id === 'front-dim-body-height');
      const dimTotalHeight = model.dimensions.find((d) => d.id === 'front-dim-overall-height');

      expect(dimLength?.valueMillimetres).toBe(600);
      expect(dimBodyHeight?.valueMillimetres).toBe(250);
      expect(dimTotalHeight?.valueMillimetres).toBe(268);

      // Captured wedge annotation
      expect(model.annotations.some((a) => a.text.includes('β = 10°'))).toBe(true);
      expect(model.annotations.some((a) => a.text.includes('Captured wedge'))).toBe(true);
    });
  });

  describe('End Elevation Projection (Requirements 32–35, 63)', () => {
    it('creates accurate end elevation model for default design', () => {
      const model = createEndDrawing(geometry);

      expect(model.view).toBe('end');
      expect(model.title).toBe('End Elevation');

      // Bottom board: Y = 0..300, Z = 0..18
      const bottom = model.rectangles.find((r) => r.id === 'end-bottom');
      expect(bottom?.x).toBe(0);
      expect(bottom?.y).toBe(0);
      expect(bottom?.width).toBe(300);
      expect(bottom?.height).toBe(18);

      // Facing end board: Y = 18..282, Z = 18..250 (width 264, height 232)
      const endBoard = model.rectangles.find((r) => r.id === 'end-board');
      expect(endBoard?.x).toBe(18);
      expect(endBoard?.y).toBe(18);
      expect(endBoard?.width).toBe(264);
      expect(endBoard?.height).toBe(232);

      // Side walls: 18 mm thickness each side
      const leftSide = model.rectangles.find((r) => r.id === 'end-side-wall-left');
      const rightSide = model.rectangles.find((r) => r.id === 'end-side-wall-right');
      expect(leftSide?.width).toBe(18);
      expect(rightSide?.width).toBe(18);

      // Lid panel: Y = 20..280 (width 260), Z = 232..250
      const lidPanel = model.rectangles.find((r) => r.id === 'end-lid-panel');
      expect(lidPanel?.x).toBe(20);
      expect(lidPanel?.y).toBe(232);
      expect(lidPanel?.width).toBe(260);
      expect(lidPanel?.height).toBe(18);

      // Dimensions
      const dimWidth = model.dimensions.find((d) => d.id === 'end-dim-overall-width');
      const dimBodyHeight = model.dimensions.find((d) => d.id === 'end-dim-body-height');
      const dimLidWidth = model.dimensions.find((d) => d.id === 'end-dim-lid-width');

      expect(dimWidth?.valueMillimetres).toBe(300);
      expect(dimBodyHeight?.valueMillimetres).toBe(250);
      expect(dimLidWidth?.valueMillimetres).toBe(260);
    });
  });

  describe('Unit Independence & Immutability (Requirements 64, 66)', () => {
    it('produces identical physical drawing models regardless of unitSystem', () => {
      const imperialDesign = setDesignUnitSystem(defaultDesign, 'imperial');
      const imperialGeoResult = calculateToolboxGeometry(imperialDesign);
      if (!imperialGeoResult.ok) throw new Error('Must be ok');

      const metricPlan = createPlanDrawing(geometry);
      const imperialPlan = createPlanDrawing(imperialGeoResult.geometry);

      expect(metricPlan.rectangles).toEqual(imperialPlan.rectangles);
      expect(metricPlan.polygons).toEqual(imperialPlan.polygons);
      expect(metricPlan.lines).toEqual(imperialPlan.lines);
      expect(metricPlan.bounds).toEqual(imperialPlan.bounds);
      expect(metricPlan.dimensions).toEqual(imperialPlan.dimensions);
    });

    it('does not mutate input geometry or design', () => {
      const deepCloneGeo = JSON.parse(JSON.stringify(geometry));
      const deepCloneDesign = JSON.parse(JSON.stringify(defaultDesign));

      createPlanDrawing(geometry);
      createFrontDrawing(geometry);
      createEndDrawing(geometry);

      expect(geometry).toEqual(deepCloneGeo);
      expect(defaultDesign).toEqual(deepCloneDesign);
    });
  });
});
