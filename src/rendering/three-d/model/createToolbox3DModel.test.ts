import { describe, it, expect } from 'vitest';
import { createDefaultToolboxDesign } from '../../../domain/defaults';
import { calculateToolboxGeometry } from '../../../domain/geometry';
import { setDesignUnitSystem } from '../../../domain/design';
import { createToolbox3DModel } from './createToolbox3DModel';
import type { BoxPart3D, PolyhedronPart3D } from './toolbox3DModel';

describe('createToolbox3DModel (Phase 10 Requirements 4-37, 70-72)', () => {
  const defaultDesign = createDefaultToolboxDesign();
  const geometryResult = calculateToolboxGeometry(defaultDesign);
  if (!geometryResult.ok) {
    throw new Error('Default design geometry should be valid');
  }
  const geometry = geometryResult.geometry;

  it('Requirement 30: produces exactly 11 physical parts with stable semantic IDs', () => {
    const model = createToolbox3DModel(geometry);
    expect(model.parts).toHaveLength(11);
    expect(model.metadata.partCount).toBe(11);

    const partIds = model.parts.map((p) => p.id);
    expect(partIds).toEqual([
      'bottom',
      'side-front',
      'side-back',
      'end-stop',
      'end-locking',
      'fixed-top-batten-stop',
      'fixed-top-batten-locking',
      'lid-panel',
      'straight-lid-batten',
      'locking-lid-batten',
      'locking-wedge',
    ]);
  });

  it('Requirement 31: calculates exact domain bounds for axis-aligned carcass parts', () => {
    const model = createToolbox3DModel(geometry);

    // Bottom
    const bottom = model.parts.find((p) => p.id === 'bottom') as BoxPart3D;
    expect(bottom.kind).toBe('box');
    expect(bottom.min).toEqual({ x: 0, y: 0, z: 0 });
    expect(bottom.max).toEqual({ x: 600, y: 300, z: 18 });

    // Front side
    const frontSide = model.parts.find((p) => p.id === 'side-front') as BoxPart3D;
    expect(frontSide.min).toEqual({ x: 0, y: 0, z: 18 });
    expect(frontSide.max).toEqual({ x: 600, y: 18, z: 250 });

    // Back side
    const backSide = model.parts.find((p) => p.id === 'side-back') as BoxPart3D;
    expect(backSide.min).toEqual({ x: 0, y: 282, z: 18 });
    expect(backSide.max).toEqual({ x: 600, y: 300, z: 250 });

    // Stop end
    const stopEnd = model.parts.find((p) => p.id === 'end-stop') as BoxPart3D;
    expect(stopEnd.min).toEqual({ x: 0, y: 18, z: 18 });
    expect(stopEnd.max).toEqual({ x: 18, y: 282, z: 250 });

    // Locking end
    const lockingEnd = model.parts.find((p) => p.id === 'end-locking') as BoxPart3D;
    expect(lockingEnd.min).toEqual({ x: 582, y: 18, z: 18 });
    expect(lockingEnd.max).toEqual({ x: 600, y: 282, z: 250 });

    // Stop top batten
    const stopTopBatten = model.parts.find((p) => p.id === 'fixed-top-batten-stop') as BoxPart3D;
    expect(stopTopBatten.min).toEqual({ x: 0, y: 0, z: 250 });
    expect(stopTopBatten.max).toEqual({ x: 54, y: 300, z: 268 });
  });

  it('Requirement 32: calculates exact domain bounds for locked lid panel and straight batten', () => {
    const model = createToolbox3DModel(geometry);

    // Lid panel
    const lidPanel = model.parts.find((p) => p.id === 'lid-panel') as BoxPart3D;
    expect(lidPanel.min.x).toBe(40.5);
    expect(lidPanel.max.x).toBe(559.5);
    expect(lidPanel.min.y).toBe(20); // 18 + 2 clearance
    expect(lidPanel.max.y).toBe(280); // 300 - 18 - 2
    expect(lidPanel.min.z).toBe(232);
    expect(lidPanel.max.z).toBe(250);

    // Straight lid batten
    const straightBatten = model.parts.find((p) => p.id === 'straight-lid-batten') as BoxPart3D;
    expect(straightBatten.min.x).toBe(54);
    expect(straightBatten.max.x).toBe(99);
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
    expect(bottomNarrowWidth).toBeCloseTo(23.5, 5);
    expect(bottomNarrowWidth).toBeCloseTo(geometry.lockingMechanism.wedge.bottomNarrowWidth, 5);

    // Bottom wide width (at y = Y = 300): fixed wide X - batten wide X
    const bottomWideWidth = wedge.vertices[2]!.x - wedge.vertices[3]!.x;
    expect(bottomWideWidth).toBeCloseTo(33.83655, 4);
    expect(bottomWideWidth).toBeCloseTo(geometry.lockingMechanism.wedge.bottomWideWidth, 5);

    // Top narrow width (at y = 0): top fixed narrow X - top batten narrow X
    const topNarrowWidth = wedge.vertices[5]!.x - wedge.vertices[4]!.x;
    expect(topNarrowWidth).toBeCloseTo(17.15029, 4);
    expect(topNarrowWidth).toBeCloseTo(geometry.lockingMechanism.wedge.topNarrowWidth, 5);

    // Top wide width (at y = Y = 300): top fixed wide X - top batten wide X
    const topWideWidth = wedge.vertices[6]!.x - wedge.vertices[7]!.x;
    expect(topWideWidth).toBeCloseTo(27.48684, 4);
    expect(topWideWidth).toBeCloseTo(geometry.lockingMechanism.wedge.topWideWidth, 5);

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
