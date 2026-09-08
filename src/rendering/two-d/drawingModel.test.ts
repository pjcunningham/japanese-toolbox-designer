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

      // Inset end walls (stop: 36..54, locking: 546..564, Y: 15..285)
      const stopWallRect = model.rectangles.find((r) => r.id === 'plan-end-wall-stop');
      expect(stopWallRect).toBeDefined();
      expect(stopWallRect?.x).toBe(36);
      expect(stopWallRect?.width).toBe(18);
      expect(stopWallRect?.y).toBe(15);
      expect(stopWallRect?.height).toBe(270);
      expect(stopWallRect?.hidden).toBe(true);

      const lockingWallRect = model.rectangles.find((r) => r.id === 'plan-end-wall-locking');
      expect(lockingWallRect).toBeDefined();
      expect(lockingWallRect?.x).toBe(546);
      expect(lockingWallRect?.width).toBe(18);
      expect(lockingWallRect?.y).toBe(15);
      expect(lockingWallRect?.height).toBe(270);
      expect(lockingWallRect?.hidden).toBe(true);

      // Grab handles (stop: 0..36, locking: 564..600, Y: 18..282)
      const stopHandleRect = model.rectangles.find((r) => r.id === 'plan-handle-stop');
      expect(stopHandleRect).toBeDefined();
      expect(stopHandleRect?.x).toBe(0);
      expect(stopHandleRect?.width).toBe(36);
      expect(stopHandleRect?.y).toBe(18);
      expect(stopHandleRect?.height).toBe(264);
      expect(stopHandleRect?.hidden).toBe(true);

      const lockingHandleRect = model.rectangles.find((r) => r.id === 'plan-handle-locking');
      expect(lockingHandleRect).toBeDefined();
      expect(lockingHandleRect?.x).toBe(564);
      expect(lockingHandleRect?.width).toBe(36);
      expect(lockingHandleRect?.y).toBe(18);
      expect(lockingHandleRect?.height).toBe(264);
      expect(lockingHandleRect?.hidden).toBe(true);

      // Housing dados (4 regions)
      const stopFrontDado = model.rectangles.find((r) => r.id === 'plan-housing-dado-stop-front');
      expect(stopFrontDado).toBeDefined();
      expect(stopFrontDado?.x).toBe(36);
      expect(stopFrontDado?.width).toBe(18);
      expect(stopFrontDado?.y).toBe(15);
      expect(stopFrontDado?.height).toBe(3);

      const stopBackDado = model.rectangles.find((r) => r.id === 'plan-housing-dado-stop-back');
      expect(stopBackDado).toBeDefined();
      expect(stopBackDado?.x).toBe(36);
      expect(stopBackDado?.width).toBe(18);
      expect(stopBackDado?.y).toBe(282);
      expect(stopBackDado?.height).toBe(3);

      const lockFrontDado = model.rectangles.find(
        (r) => r.id === 'plan-housing-dado-locking-front',
      );
      expect(lockFrontDado).toBeDefined();
      expect(lockFrontDado?.x).toBe(546);
      expect(lockFrontDado?.width).toBe(18);
      expect(lockFrontDado?.y).toBe(15);
      expect(lockFrontDado?.height).toBe(3);

      const lockBackDado = model.rectangles.find((r) => r.id === 'plan-housing-dado-locking-back');
      expect(lockBackDado).toBeDefined();
      expect(lockBackDado?.x).toBe(546);
      expect(lockBackDado?.width).toBe(18);
      expect(lockBackDado?.y).toBe(282);
      expect(lockBackDado?.height).toBe(3);

      // Stop fixed top batten / end cap (0..84, full width 300)
      const stopBattenRect = model.rectangles.find((r) => r.id === 'plan-fixed-top-batten-stop');
      expect(stopBattenRect).toBeDefined();
      expect(stopBattenRect?.x).toBe(0);
      expect(stopBattenRect?.width).toBe(84);
      expect(stopBattenRect?.height).toBe(300);

      // Locking fixed top batten / end cap (516..600, full width 300)
      const lockingBattenRect = model.rectangles.find(
        (r) => r.id === 'plan-fixed-top-batten-locking',
      );
      expect(lockingBattenRect).toBeDefined();
      expect(lockingBattenRect?.x).toBe(516);
      expect(lockingBattenRect?.width).toBe(84);
      expect(lockingBattenRect?.height).toBe(300);

      // Locked lid panel (70.5..529.5, Y: 20..280, length 459, width 260)
      const lidPanelRect = model.rectangles.find((r) => r.id === 'plan-lid-panel');
      expect(lidPanelRect).toBeDefined();
      expect(lidPanelRect?.x).toBeCloseTo(70.5, 4);
      expect(lidPanelRect?.y).toBe(20);
      expect(lidPanelRect?.width).toBeCloseTo(459, 4);
      expect(lidPanelRect?.height).toBe(260);

      // Straight lid batten (84..126, Y: 2..298, length 296, width 42)
      const straightBattenRect = model.rectangles.find((r) => r.id === 'plan-straight-lid-batten');
      expect(straightBattenRect).toBeDefined();
      expect(straightBattenRect?.x).toBe(84);
      expect(straightBattenRect?.y).toBe(2);
      expect(straightBattenRect?.width).toBe(42);
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
      expect(lockingPoly?.points[0]?.x).toBeCloseTo(456.5, 4);
      expect(lockingPoly?.points[0]?.y).toBe(2);
      expect(lockingPoly?.points[1]?.x).toBeCloseTo(498.5, 4);
      expect(lockingPoly?.points[1]?.y).toBe(2);
      expect(lockingPoly?.points[2]?.x).toBeCloseTo(488.16345, 4);
      expect(lockingPoly?.points[2]?.y).toBe(298);
      expect(lockingPoly?.points[3]?.x).toBeCloseTo(456.5, 4);
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
      expect(wedgePoly?.points[1]?.x).toBe(516);
      expect(wedgePoly?.points[2]?.x).toBe(516);

      // Dimensions include overall length, width, top opening, locked overlap O, inset I, pocket depth, dado depth
      const dimLength = model.dimensions.find((d) => d.id === 'plan-dim-overall-length');
      const dimWidth = model.dimensions.find((d) => d.id === 'plan-dim-overall-width');
      const dimOpening = model.dimensions.find((d) => d.id === 'plan-dim-opening-length');
      const dimOverlap = model.dimensions.find((d) => d.id === 'plan-dim-overlap');
      const dimInset = model.dimensions.find((d) => d.id === 'plan-dim-inset');
      const dimPocket = model.dimensions.find((d) => d.id === 'plan-dim-pocket-depth');
      const dimDado = model.dimensions.find((d) => d.id === 'plan-dim-dado-depth');

      expect(dimLength?.valueMillimetres).toBe(600);
      expect(dimWidth?.valueMillimetres).toBe(300);
      expect(dimOpening?.valueMillimetres).toBe(432);
      expect(dimOverlap?.valueMillimetres).toBeCloseTo(13.5, 4);
      expect(dimInset?.valueMillimetres).toBe(36);
      expect(dimPocket?.valueMillimetres).toBe(30);
      expect(dimDado?.valueMillimetres).toBe(3);

      // Annotations
      expect(model.annotations.some((a) => a.text === 'STOP END')).toBe(true);
      expect(model.annotations.some((a) => a.text === 'LOCKING END')).toBe(true);
      expect(model.annotations.some((a) => a.text.includes('Lid release'))).toBe(true);
      expect(model.annotations.some((a) => a.text.includes('Wedge insertion +Y'))).toBe(true);
      expect(model.annotations.some((a) => a.text.includes('α = 2°'))).toBe(true);
      expect(model.annotations.some((a) => a.text.includes('Inset housed end wall'))).toBe(true);
      expect(model.annotations.some((a) => a.text.includes('Grab handle below end cap'))).toBe(
        true,
      );
    });
  });

  describe('Front Elevation Projection (Requirements 25–31, 61–62)', () => {
    it('creates accurate front elevation model for default design', () => {
      const model = createFrontDrawing(geometry);

      expect(model.view).toBe('front');
      expect(model.title).toBe('Front Elevation');

      // Bottom board: Z = 0..12, length = 600
      const bottomRect = model.rectangles.find((r) => r.id === 'front-bottom');
      expect(bottomRect?.x).toBe(0);
      expect(bottomRect?.y).toBe(0);
      expect(bottomRect?.width).toBe(600);
      expect(bottomRect?.height).toBe(12);

      // Side wall: Z = 12..250
      const sideWallRect = model.rectangles.find((r) => r.id === 'front-side-wall');
      expect(sideWallRect?.x).toBe(0);
      expect(sideWallRect?.y).toBe(12);
      expect(sideWallRect?.width).toBe(600);
      expect(sideWallRect?.height).toBe(238);

      // Inset end walls hidden lines: X = 36, 54, 546, 564
      const stopOutsideLine = model.lines.find((l) => l.id === 'front-line-end-stop-outside');
      expect(stopOutsideLine?.kind).toBe('hidden');
      expect(stopOutsideLine?.start).toEqual({ x: 36, y: 12 });
      expect(stopOutsideLine?.end).toEqual({ x: 36, y: 250 });

      const stopInsideLine = model.lines.find((l) => l.id === 'front-line-end-stop-inside');
      expect(stopInsideLine?.kind).toBe('hidden');
      expect(stopInsideLine?.start).toEqual({ x: 54, y: 12 });
      expect(stopInsideLine?.end).toEqual({ x: 54, y: 250 });

      const lockInsideLine = model.lines.find((l) => l.id === 'front-line-end-locking-inside');
      expect(lockInsideLine?.kind).toBe('hidden');
      expect(lockInsideLine?.start).toEqual({ x: 546, y: 12 });
      expect(lockInsideLine?.end).toEqual({ x: 546, y: 250 });

      const lockOutsideLine = model.lines.find((l) => l.id === 'front-line-end-locking-outside');
      expect(lockOutsideLine?.kind).toBe('hidden');
      expect(lockOutsideLine?.start).toEqual({ x: 564, y: 12 });
      expect(lockOutsideLine?.end).toEqual({ x: 564, y: 250 });

      // Grab handles hidden rectangles: Z = 178..250
      const stopHandle = model.rectangles.find((r) => r.id === 'front-handle-stop');
      expect(stopHandle?.hidden).toBe(true);
      expect(stopHandle?.x).toBe(0);
      expect(stopHandle?.y).toBe(178);
      expect(stopHandle?.width).toBe(36);
      expect(stopHandle?.height).toBe(72);

      const lockHandle = model.rectangles.find((r) => r.id === 'front-handle-locking');
      expect(lockHandle?.hidden).toBe(true);
      expect(lockHandle?.x).toBe(564);
      expect(lockHandle?.y).toBe(178);
      expect(lockHandle?.width).toBe(36);
      expect(lockHandle?.height).toBe(72);

      // Hidden lid panel: Z = 238..250, startX = 70.5, endX = 529.5
      const hiddenLidRect = model.rectangles.find((r) => r.id === 'front-lid-panel');
      expect(hiddenLidRect?.hidden).toBe(true);
      expect(hiddenLidRect?.x).toBeCloseTo(70.5, 4);
      expect(hiddenLidRect?.y).toBe(238);
      expect(hiddenLidRect?.height).toBe(12);

      // Stop top batten / end cap: Z = 250..268, X = 0..84
      const stopBatten = model.rectangles.find((r) => r.id === 'front-fixed-top-batten-stop');
      expect(stopBatten?.x).toBe(0);
      expect(stopBatten?.y).toBe(250);
      expect(stopBatten?.width).toBe(84);
      expect(stopBatten?.height).toBe(18);

      // Straight lid batten: Z = 250..268, X = 84..126
      const straightBatten = model.rectangles.find((r) => r.id === 'front-straight-lid-batten');
      expect(straightBatten?.x).toBe(84);
      expect(straightBatten?.y).toBe(250);
      expect(straightBatten?.width).toBe(42);
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
      const dimInset = model.dimensions.find((d) => d.id === 'front-dim-inset');

      expect(dimLength?.valueMillimetres).toBe(600);
      expect(dimBodyHeight?.valueMillimetres).toBe(250);
      expect(dimTotalHeight?.valueMillimetres).toBe(268);
      expect(dimInset?.valueMillimetres).toBe(36);

      // Annotations
      const capturedWedgeAnn = model.annotations.find((a) => a.id === 'front-ann-captured-wedge');
      const lockingEndAnn = model.annotations.find((a) => a.id === 'front-ann-locking-end');
      expect(capturedWedgeAnn).toBeDefined();
      expect(capturedWedgeAnn?.text).toBe('Captured wedge');
      expect(capturedWedgeAnn?.secondaryText).toBe(
        `β = ${geometry.lockingMechanism.wedge.bevelAngle}°`,
      );
      expect(lockingEndAnn).toBeDefined();
      expect(lockingEndAnn?.text).toBe('LOCKING END');
      expect(lockingEndAnn!.position.y - capturedWedgeAnn!.position.y).toBeGreaterThanOrEqual(12);
      expect(model.annotations.some((a) => a.text.includes('Grab handle'))).toBe(true);
      expect(model.annotations.some((a) => a.text.includes('Inset end wall'))).toBe(true);
    });
  });

  describe('End Elevation Projection (Requirements 32–35, 63)', () => {
    it('creates accurate end elevation model for default design', () => {
      const model = createEndDrawing(geometry);

      expect(model.view).toBe('end');
      expect(model.title).toBe('End Elevation');

      // Bottom board: Y = 0..300, Z = 0..12
      const bottom = model.rectangles.find((r) => r.id === 'end-bottom');
      expect(bottom?.x).toBe(0);
      expect(bottom?.y).toBe(0);
      expect(bottom?.width).toBe(300);
      expect(bottom?.height).toBe(12);

      // Solid grab handle in upper bay: Y = 18..282, Z = 178..250 (width 264, height 72)
      const handle = model.rectangles.find((r) => r.id === 'end-handle-stop');
      expect(handle).toBeDefined();
      expect(handle?.x).toBe(18);
      expect(handle?.y).toBe(178);
      expect(handle?.width).toBe(264);
      expect(handle?.height).toBe(72);

      // Recessed end wall below grab handle: Y = 18..282, Z = 12..178 (width 264, height 166)
      const recessedEndWall = model.rectangles.find((r) => r.id === 'end-wall-stop');
      expect(recessedEndWall).toBeDefined();
      expect(recessedEndWall?.x).toBe(18);
      expect(recessedEndWall?.y).toBe(12);
      expect(recessedEndWall?.width).toBe(264);
      expect(recessedEndWall?.height).toBe(166);

      // Side walls: 18 mm thickness each side, Z = 12..250
      const leftSide = model.rectangles.find((r) => r.id === 'end-side-wall-left');
      const rightSide = model.rectangles.find((r) => r.id === 'end-side-wall-right');
      expect(leftSide?.width).toBe(18);
      expect(leftSide?.y).toBe(12);
      expect(leftSide?.height).toBe(238);
      expect(rightSide?.width).toBe(18);
      expect(rightSide?.y).toBe(12);
      expect(rightSide?.height).toBe(238);

      // Fixed top batten / end cap: full width 300, Z = 250..268
      const topBatten = model.rectangles.find((r) => r.id === 'end-fixed-top-batten');
      expect(topBatten?.width).toBe(300);
      expect(topBatten?.y).toBe(250);
      expect(topBatten?.height).toBe(18);

      // Lid panel: Y = 20..280 (width 260), Z = 238..250
      const lidPanel = model.rectangles.find((r) => r.id === 'end-lid-panel');
      expect(lidPanel?.x).toBe(20);
      expect(lidPanel?.y).toBe(238);
      expect(lidPanel?.width).toBe(260);
      expect(lidPanel?.height).toBe(12);

      // Dimensions
      const dimWidth = model.dimensions.find((d) => d.id === 'end-dim-overall-width');
      const dimBodyHeight = model.dimensions.find((d) => d.id === 'end-dim-body-height');
      const dimHandleHeight = model.dimensions.find((d) => d.id === 'end-dim-handle-height');
      const dimBottomT = model.dimensions.find((d) => d.id === 'end-dim-bottom-thickness');
      const dimLidWidth = model.dimensions.find((d) => d.id === 'end-dim-lid-width');

      expect(dimWidth?.valueMillimetres).toBe(300);
      expect(dimBodyHeight?.valueMillimetres).toBe(250);
      expect(dimHandleHeight?.valueMillimetres).toBe(72);
      expect(dimBottomT?.valueMillimetres).toBe(12);
      expect(dimLidWidth?.valueMillimetres).toBe(260);

      // Annotations
      expect(model.annotations.some((a) => a.text === 'Grab handle')).toBe(true);
      expect(model.annotations.some((a) => a.text.includes('Inset end wall'))).toBe(true);
      expect(model.description).toBe(
        'End elevation showing the solid grab handle, inset end wall and side walls.',
      );
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
