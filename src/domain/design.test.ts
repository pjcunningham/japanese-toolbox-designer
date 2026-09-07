import { describe, it, expect } from 'vitest';
import { TOOLBOX_DESIGN_SCHEMA_VERSION, setDesignUnitSystem, type ToolboxDesign } from './design';
import {
  createDefaultToolboxDesign,
  DEFAULT_CONSTRUCTION_PARAMETERS,
  DEFAULT_DESIGN_NAME,
  DEFAULT_DIMENSIONS,
  DEFAULT_WOOD,
} from './defaults';

describe('ToolboxDesign Domain Model', () => {
  it('defines TOOLBOX_DESIGN_SCHEMA_VERSION as 1', () => {
    expect(TOOLBOX_DESIGN_SCHEMA_VERSION).toBe(1);
  });

  it('creates a default design with sensible metric woodworking defaults', () => {
    const fixedTime = '2026-09-07T12:00:00.000Z';
    const fixedId = 'test-id-1234';

    const design = createDefaultToolboxDesign({
      idGenerator: () => fixedId,
      timestampGenerator: () => fixedTime,
    });

    expect(design.id).toBe(fixedId);
    expect(design.name).toBe(DEFAULT_DESIGN_NAME);
    expect(design.schemaVersion).toBe(1);
    expect(design.createdAt).toBe(fixedTime);
    expect(design.updatedAt).toBe(fixedTime);
    expect(design.unitSystem).toBe('metric');

    expect(design.dimensions).toEqual({
      length: 600,
      width: 300,
      height: 250,
      stockThickness: 18,
    });

    expect(design.constructionParameters).toEqual({
      lidThickness: 18,
      fixedTopBattenWidth: 54, // ~3 * T
      lidBattenWidth: 45, // ~2.5 * T
      lidSideClearance: 2,
      desiredOverlap: 13.5, // ~0.75 * T
      lidBattenOverhang: 18,
      wedgeTaperAngle: 2,
      wedgeBevelAngle: 10,
      lockingBattenTravelClearance: 1,
    });

    expect(design.wood).toEqual(DEFAULT_WOOD);
  });

  it('generates valid UUIDs and ISO timestamps in the default factory without overrides', () => {
    const design = createDefaultToolboxDesign();

    expect(typeof design.id).toBe('string');
    expect(design.id.length).toBeGreaterThan(0);
    expect(Date.parse(design.createdAt)).not.toBeNaN();
    expect(Date.parse(design.updatedAt)).not.toBeNaN();
  });

  it('allows overriding dimensions, construction parameters, and wood', () => {
    const design = createDefaultToolboxDesign({
      name: 'Custom Oak Box',
      dimensions: {
        length: 750,
      },
      constructionParameters: {
        lidSideClearance: 3,
      },
      wood: {
        id: 'oak',
      },
    });

    expect(design.name).toBe('Custom Oak Box');
    expect(design.dimensions.length).toBe(750);
    expect(design.dimensions.width).toBe(DEFAULT_DIMENSIONS.width);
    expect(design.constructionParameters.lidSideClearance).toBe(3);
    expect(design.constructionParameters.fixedTopBattenWidth).toBe(
      DEFAULT_CONSTRUCTION_PARAMETERS.fixedTopBattenWidth,
    );
    expect(design.wood.id).toBe('oak');
  });
});

describe('Unit Switching Behavior', () => {
  it('switches unit system without modifying underlying stored millimetre dimensions', () => {
    const originalTime = '2026-09-07T10:00:00.000Z';
    const switchTime = '2026-09-07T10:05:00.000Z';

    const initialDesign: ToolboxDesign = createDefaultToolboxDesign({
      timestampGenerator: () => originalTime,
    });

    const imperialDesign = setDesignUnitSystem(initialDesign, 'imperial', {
      timestampGenerator: () => switchTime,
    });

    expect(imperialDesign.unitSystem).toBe('imperial');
    expect(imperialDesign.updatedAt).toBe(switchTime);
    expect(imperialDesign.dimensions).toEqual(initialDesign.dimensions);
    expect(imperialDesign.constructionParameters).toEqual(initialDesign.constructionParameters);
  });

  it('returns the same reference if switching to the existing unit system', () => {
    const initialDesign = createDefaultToolboxDesign();
    const unchanged = setDesignUnitSystem(initialDesign, 'metric');
    expect(unchanged).toBe(initialDesign);
  });

  it('proves that repeated unit switching does not accumulate rounding error or modify dimensions', () => {
    const initialDesign = createDefaultToolboxDesign({
      dimensions: {
        length: 609.6, // 24"
        width: 304.8, // 12"
        height: 254.0, // 10"
        stockThickness: 19.05, // 3/4"
      },
      constructionParameters: {
        lidThickness: 19.05,
        fixedTopBattenWidth: 57.15,
        lidBattenWidth: 47.625,
        lidSideClearance: 1.5875, // 1/16"
        desiredOverlap: 14.2875,
        lidBattenOverhang: 19.05,
        wedgeTaperAngle: 2,
        wedgeBevelAngle: 10,
        lockingBattenTravelClearance: 1.5875,
      },
    });

    const initialSnapshot = JSON.stringify({
      dimensions: initialDesign.dimensions,
      constructionParameters: initialDesign.constructionParameters,
    });

    let current = initialDesign;
    // Switch metric -> imperial -> metric -> imperial -> metric 20 times
    for (let i = 0; i < 20; i++) {
      current = setDesignUnitSystem(current, i % 2 === 0 ? 'imperial' : 'metric');
    }

    const finalSnapshot = JSON.stringify({
      dimensions: current.dimensions,
      constructionParameters: current.constructionParameters,
    });

    expect(finalSnapshot).toBe(initialSnapshot);
    expect(current.dimensions.length).toBe(609.6);
    expect(current.dimensions.stockThickness).toBe(19.05);
    expect(current.constructionParameters.lidSideClearance).toBe(1.5875);
  });
});
