import { describe, it, expect } from 'vitest';
import { createDefaultToolboxDesign } from '../../../domain/defaults';
import { calculateToolboxGeometry } from '../../../domain/geometry';
import { setDesignUnitSystem } from '../../../domain/design';
import { createToolbox3DModel } from './createToolbox3DModel';
import type { BoxPart3D, PolyhedronPart3D, CompoundBoxPart3D } from './toolbox3DModel';

describe('createToolbox3DModel (Phase 10 Requirements 4-37, 70-72)', () => {
  const defaultDesign = createDefaultToolboxDesign();
  const geometryResult = calculateToolboxGeometry(defaultDesign);
  if (!geometryResult.ok) {
    throw new Error('Default design geometry should be valid');
  }
  const geometry = geometryResult.geometry;

  it('Requirement 30 & 61: produces exactly 13 physical parts with stable semantic IDs', () => {
    const model = createToolbox3DModel(geometry);
    expect(model.parts).toHaveLength(13);
    expect(model.metadata.partCount).toBe(13);

    const partIds = model.parts.map((p) => p.id);
    expect(partIds).toEqual([
      'bottom',
      'side-front',
      'side-back',
      'end-stop',
      'end-locking',
      'handle-stop',
      'handle-locking',
      'fixed-top-batten-stop',
      'fixed-top-batten-locking',
      'lid-panel',
      'straight-lid-batten',
      'locking-lid-batten',
      'locking-wedge',
    ]);
  });

  it('Requirement 31 & 62: calculates exact domain bounds for axis-aligned carcass parts', () => {
    const model = createToolbox3DModel(geometry);

    // Bottom (0..600, 0..300, 0..12)
    const bottom = model.parts.find((p) => p.id === 'bottom') as BoxPart3D;
    expect(bottom.kind).toBe('box');
    expect(bottom.min).toEqual({ x: 0, y: 0, z: 0 });
    expect(bottom.max).toEqual({ x: 600, y: 300, z: 12 });

    // Stop end wall (36..54, 15..285, 12..250)
    const stopEnd = model.parts.find((p) => p.id === 'end-stop') as BoxPart3D;
    expect(stopEnd.kind).toBe('box');
    expect(stopEnd.min).toEqual({ x: 36, y: 15, z: 12 });
    expect(stopEnd.max).toEqual({ x: 54, y: 285, z: 250 });

    // Locking end wall (546..564, 15..285, 12..250)
    const lockingEnd = model.parts.find((p) => p.id === 'end-locking') as BoxPart3D;
    expect(lockingEnd.kind).toBe('box');
    expect(lockingEnd.min).toEqual({ x: 546, y: 15, z: 12 });
    expect(lockingEnd.max).toEqual({ x: 564, y: 285, z: 250 });

    // Stop grab handle (0..36, 18..282, 178..250)
    const stopHandle = model.parts.find((p) => p.id === 'handle-stop') as BoxPart3D;
    expect(stopHandle.kind).toBe('box');
    expect(stopHandle.min).toEqual({ x: 0, y: 18, z: 178 });
    expect(stopHandle.max).toEqual({ x: 36, y: 282, z: 250 });

    // Locking grab handle (564..600, 18..282, 178..250)
    const lockHandle = model.parts.find((p) => p.id === 'handle-locking') as BoxPart3D;
    expect(lockHandle.kind).toBe('box');
    expect(lockHandle.min).toEqual({ x: 564, y: 18, z: 178 });
    expect(lockHandle.max).toEqual({ x: 600, y: 282, z: 250 });

    // Stop top batten / end cap (0..84, 0..300, 250..268)
    const stopTopBatten = model.parts.find((p) => p.id === 'fixed-top-batten-stop') as BoxPart3D;
    expect(stopTopBatten.kind).toBe('box');
    expect(stopTopBatten.min).toEqual({ x: 0, y: 0, z: 250 });
    expect(stopTopBatten.max).toEqual({ x: 84, y: 300, z: 268 });
  });

  it('Requirement 63: models compound side boards with exact 5 physical segments for housing dados', () => {
    const model = createToolbox3DModel(geometry);

    // Front side (compound-box with 5 segments)
    const frontSide = model.parts.find((p) => p.id === 'side-front') as CompoundBoxPart3D;
    expect(frontSide.kind).toBe('compound-box');
    expect(frontSide.solids).toHaveLength(5);

    expect(frontSide.solids[0]).toEqual({
      min: { x: 0, y: 0, z: 12 },
      max: { x: 36, y: 18, z: 250 },
    });
    expect(frontSide.solids[1]).toEqual({
      min: { x: 36, y: 0, z: 12 },
      max: { x: 54, y: 15, z: 250 },
    });
    expect(frontSide.solids[2]).toEqual({
      min: { x: 54, y: 0, z: 12 },
      max: { x: 546, y: 18, z: 250 },
    });
    expect(frontSide.solids[3]).toEqual({
      min: { x: 546, y: 0, z: 12 },
      max: { x: 564, y: 15, z: 250 },
    });
    expect(frontSide.solids[4]).toEqual({
      min: { x: 564, y: 0, z: 12 },
      max: { x: 600, y: 18, z: 250 },
    });

    // Back side (compound-box with 5 segments)
    const backSide = model.parts.find((p) => p.id === 'side-back') as CompoundBoxPart3D;
    expect(backSide.kind).toBe('compound-box');
    expect(backSide.solids).toHaveLength(5);

    expect(backSide.solids[0]).toEqual({
      min: { x: 0, y: 282, z: 12 },
      max: { x: 36, y: 300, z: 250 },
    });
    expect(backSide.solids[1]).toEqual({
      min: { x: 36, y: 285, z: 12 },
      max: { x: 54, y: 300, z: 250 },
    });
    expect(backSide.solids[2]).toEqual({
      min: { x: 54, y: 282, z: 12 },
      max: { x: 546, y: 300, z: 250 },
    });
    expect(backSide.solids[3]).toEqual({
      min: { x: 546, y: 285, z: 12 },
      max: { x: 564, y: 300, z: 250 },
    });
    expect(backSide.solids[4]).toEqual({
      min: { x: 564, y: 282, z: 12 },
      max: { x: 600, y: 300, z: 250 },
    });
  });

  it('Requirement 64: proves end-wall housed boundaries mate perfectly with side-board recesses with no overlap or gaps', () => {
    const model = createToolbox3DModel(geometry);
    const stopEnd = model.parts.find((p) => p.id === 'end-stop') as BoxPart3D;
    const lockEnd = model.parts.find((p) => p.id === 'end-locking') as BoxPart3D;
    const frontSide = model.parts.find((p) => p.id === 'side-front') as CompoundBoxPart3D;
    const backSide = model.parts.find((p) => p.id === 'side-back') as CompoundBoxPart3D;

    // Stop end wall enters front dado (X: 36..54, Y: 15..18, Z: 12..250)
    // Front side dado recess: X: 36..54, Y: 15..18 is open/removed
    expect(stopEnd.min.y).toBe(frontSide.solids[1]!.max.y); // 15
    expect(stopEnd.min.x).toBe(frontSide.solids[1]!.min.x); // 36
    expect(stopEnd.max.x).toBe(frontSide.solids[1]!.max.x); // 54

    // Stop end wall enters back dado (X: 36..54, Y: 282..285, Z: 12..250)
    expect(stopEnd.max.y).toBe(backSide.solids[1]!.min.y); // 285
    expect(stopEnd.min.x).toBe(backSide.solids[1]!.min.x); // 36
    expect(stopEnd.max.x).toBe(backSide.solids[1]!.max.x); // 54

    // Locking end wall enters front dado (X: 546..564, Y: 15..18, Z: 12..250)
    expect(lockEnd.min.y).toBe(frontSide.solids[3]!.max.y); // 15
    expect(lockEnd.min.x).toBe(frontSide.solids[3]!.min.x); // 546
    expect(lockEnd.max.x).toBe(frontSide.solids[3]!.max.x); // 564

    // Locking end wall enters back dado (X: 546..564, Y: 282..285, Z: 12..250)
    expect(lockEnd.max.y).toBe(backSide.solids[3]!.min.y); // 285
    expect(lockEnd.min.x).toBe(backSide.solids[3]!.min.x); // 546
    expect(lockEnd.max.x).toBe(backSide.solids[3]!.max.x); // 564
  });

  it('Requirement 32: calculates exact domain bounds for locked lid panel and straight batten', () => {
    const model = createToolbox3DModel(geometry);

    // Lid panel
    const lidPanel = model.parts.find((p) => p.id === 'lid-panel') as BoxPart3D;
    expect(lidPanel.min.x).toBe(70.5);
    expect(lidPanel.max.x).toBe(529.5);
    expect(lidPanel.min.y).toBe(20); // 18 + 2 clearance
    expect(lidPanel.max.y).toBe(280); // 300 - 18 - 2
    expect(lidPanel.min.z).toBe(238);
    expect(lidPanel.max.z).toBe(250);

    // Straight lid batten
    const straightBatten = model.parts.find((p) => p.id === 'straight-lid-batten') as BoxPart3D;
    expect(straightBatten.min.x).toBe(84);
    expect(straightBatten.max.x).toBe(126);
    expect(straightBatten.min.y).toBe(2); // planCorners.interiorNarrowCorner.y (18 + 2 - 18 overhang = 2)
    expect(straightBatten.max.y).toBe(298); // 2 + 296
    expect(straightBatten.min.z).toBe(250);
    expect(straightBatten.max.z).toBe(268);
  });

  it('Requirements 23, 24, 33, 34: constructs locking wedge matching authoritative Phase 5 dimensions', () => {
    const model = createToolbox3DModel(geometry);
    const wedge = model.parts.find((p) => p.id === 'locking-wedge') as PolyhedronPart3D;

    expect(wedge.kind).toBe('polyhedron');
    expect(wedge.vertices).toHaveLength(8);
    expect(wedge.faces).toHaveLength(6);

    // Bottom and top Z coordinates
    const bottomZ = wedge.vertices[0]!.z;
    const topZ = wedge.vertices[4]!.z;
    expect(bottomZ).toBe(250);
    expect(topZ).toBe(268);

    // Bottom narrow width (at y = 0): fixed narrow X - batten narrow X
    const bottomNarrowWidth = wedge.vertices[1]!.x - wedge.vertices[0]!.x;
    expect(bottomNarrowWidth).toBeCloseTo(17.5, 5);
    expect(bottomNarrowWidth).toBeCloseTo(geometry.lockingMechanism.wedge.bottomNarrowWidth, 5);

    // Bottom wide width (at y = Y = 300): fixed wide X - batten wide X
    const bottomWideWidth = wedge.vertices[2]!.x - wedge.vertices[3]!.x;
    expect(bottomWideWidth).toBeCloseTo(27.83655, 4);
    expect(bottomWideWidth).toBeCloseTo(geometry.lockingMechanism.wedge.bottomWideWidth, 4);

    // Top narrow width (at y = 0): top fixed narrow X - top batten narrow X
    const topNarrowWidth = wedge.vertices[5]!.x - wedge.vertices[4]!.x;
    expect(topNarrowWidth).toBeCloseTo(11.15029, 4);
    expect(topNarrowWidth).toBeCloseTo(geometry.lockingMechanism.wedge.topNarrowWidth, 4);

    // Top wide width (at y = Y = 300): top fixed wide X - top batten wide X
    const topWideWidth = wedge.vertices[6]!.x - wedge.vertices[7]!.x;
    expect(topWideWidth).toBeCloseTo(21.48684, 4);
    expect(topWideWidth).toBeCloseTo(geometry.lockingMechanism.wedge.topWideWidth, 4);

    // Capture geometry: top width is strictly less than bottom width
    expect(topNarrowWidth).toBeLessThan(bottomNarrowWidth);
    expect(topWideWidth).toBeLessThan(bottomWideWidth);
  });

  it('Requirements 21, 22, 35: locking lid batten mates perfectly with the locking wedge', () => {
    const model = createToolbox3DModel(geometry);
    const batten = model.parts.find((p) => p.id === 'locking-lid-batten') as PolyhedronPart3D;
    const wedge = model.parts.find((p) => p.id === 'locking-wedge') as PolyhedronPart3D;

    // Batten vertical span
    expect(batten.vertices[0]!.z).toBe(250);
    expect(batten.vertices[4]!.z).toBe(268);

    // Batten overhang (y = 18 + 2 - 18 = 2 to 298)
    expect(batten.vertices[0]!.y).toBe(2);
    expect(batten.vertices[2]!.y).toBe(298);

    // Mating surface check along y = 0 (narrow end)
    // Wedge batten-side bottom vertex: (x, 0, 250)
    // Locking batten wedge-side bottom edge at y = 0 must have the exact same X
    const wedgeBottomNarrowX = wedge.vertices[0]!.x;
    // In locking batten, narrowFaceX is at y = -10; by taper equation, at y = 0 it matches geometry.narrowFaceX
    expect(wedgeBottomNarrowX).toBeCloseTo(
      geometry.lockingMechanism.wedge.planCorners.battenMatingNarrowCorner.x,
      5,
    );

    // Mating top edge at y = 0
    const wedgeTopNarrowX = wedge.vertices[4]!.x;
    const battenTopNarrowX = batten.vertices[5]!.x;
    expect(battenTopNarrowX).toBeCloseTo(wedgeTopNarrowX, 5);

    // Mating top edge at y = Y
    const wedgeTopWideX = wedge.vertices[7]!.x;
    const battenTopWideX = batten.vertices[6]!.x;
    expect(battenTopWideX).toBeCloseTo(wedgeTopWideX, 5);
  });

  it('Requirements 14, 15, 36: locking fixed top batten mates with locking wedge without artificial gap', () => {
    const model = createToolbox3DModel(geometry);
    const fixedBatten = model.parts.find(
      (p) => p.id === 'fixed-top-batten-locking',
    ) as PolyhedronPart3D;
    const wedge = model.parts.find((p) => p.id === 'locking-wedge') as PolyhedronPart3D;

    // Bottom inner edge of fixed batten at y = 0
    expect(fixedBatten.vertices[0]!.x).toBeCloseTo(wedge.vertices[1]!.x, 5);
    // Bottom inner edge of fixed batten at y = Y
    expect(fixedBatten.vertices[3]!.x).toBeCloseTo(wedge.vertices[2]!.x, 5);

    // Top inner edge of fixed batten at y = 0
    expect(fixedBatten.vertices[4]!.x).toBeCloseTo(wedge.vertices[5]!.x, 5);
    // Top inner edge of fixed batten at y = Y
    expect(fixedBatten.vertices[7]!.x).toBeCloseTo(wedge.vertices[6]!.x, 5);
  });

  it('Requirement 29: model bounds account for overall dimensions and batten overhang beyond carcass', () => {
    const model = createToolbox3DModel(geometry);
    expect(model.bounds.min.x).toBe(0);
    expect(model.bounds.max.x).toBe(600);
    expect(model.bounds.min.y).toBe(0);
    expect(model.bounds.max.y).toBe(300);
    expect(model.bounds.min.z).toBe(0);
    expect(model.bounds.max.z).toBe(268); // 250 + 18 batten height

    // Test with larger overhang that extends past the carcass sides
    const customDesign = {
      ...defaultDesign,
      constructionParameters: {
        ...defaultDesign.constructionParameters,
        lidBattenOverhang: 30, // 18 + 2 - 30 = -10 mm overhang past side wall
      },
    };
    const customGeo = calculateToolboxGeometry(customDesign);
    if (customGeo.ok) {
      const customModel = createToolbox3DModel(customGeo.geometry);
      expect(customModel.bounds.min.y).toBe(-10);
      expect(customModel.bounds.max.y).toBe(310);
    }
  });

  it('Requirement 71: unit-system independence produces identical pure 3D physical model', () => {
    const metricDesign = createDefaultToolboxDesign();
    const imperialDesign = setDesignUnitSystem(metricDesign, 'imperial');

    const metricGeo = calculateToolboxGeometry(metricDesign);
    const imperialGeo = calculateToolboxGeometry(imperialDesign);

    if (!metricGeo.ok || !imperialGeo.ok) {
      throw new Error('Both geometries must be valid');
    }

    const metricModel = createToolbox3DModel(metricGeo.geometry);
    const imperialModel = createToolbox3DModel(imperialGeo.geometry);

    expect(metricModel).toEqual(imperialModel);
  });

  it('Requirement 72: immutability check ensures creation does not mutate input geometry', () => {
    const clonedGeometry = JSON.parse(JSON.stringify(geometry));
    createToolbox3DModel(geometry);
    expect(geometry).toEqual(clonedGeometry);
  });
});
