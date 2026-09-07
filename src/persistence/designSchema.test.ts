import { describe, it, expect } from 'vitest';
import { createDefaultToolboxDesign } from '../domain';
import {
  ToolboxDesignSchema,
  ToolboxDesignV1Schema,
  ToolboxDimensionsSchema,
  ToolboxConstructionParametersSchema,
  PersistedDesignStoreSchema,
  PersistedSettingsSchema,
  migrateToolboxDesignV1ToV2,
  type ToolboxDesignV1,
} from './designSchema';

describe('ToolboxDesignSchema Zod Validation (V2)', () => {
  it('validates a default valid ToolboxDesign V2', () => {
    const design = createDefaultToolboxDesign();
    const result = ToolboxDesignSchema.safeParse(design);
    expect(result.success).toBe(true);
  });

  it('rejects schemaVersion 1 in V2 schema', () => {
    const design = {
      ...createDefaultToolboxDesign(),
      schemaVersion: 1,
    };
    const result = ToolboxDesignSchema.safeParse(design);
    expect(result.success).toBe(false);
  });

  it('rejects blank or whitespace-only design names', () => {
    const design = createDefaultToolboxDesign({ name: '   ' });
    const result = ToolboxDesignSchema.safeParse(design);
    expect(result.success).toBe(false);
  });

  it('rejects names exceeding 100 characters', () => {
    const design = createDefaultToolboxDesign({ name: 'a'.repeat(101) });
    const result = ToolboxDesignSchema.safeParse(design);
    expect(result.success).toBe(false);
  });

  it('rejects unsupported schema version', () => {
    const design = {
      ...createDefaultToolboxDesign(),
      schemaVersion: 999,
    };
    const result = ToolboxDesignSchema.safeParse(design);
    expect(result.success).toBe(false);
  });

  it('rejects invalid unit systems', () => {
    const design = {
      ...createDefaultToolboxDesign(),
      unitSystem: 'cubits',
    };
    const result = ToolboxDesignSchema.safeParse(design);
    expect(result.success).toBe(false);
  });

  it('rejects NaN, Infinity, and -Infinity in dimensions', () => {
    const base = createDefaultToolboxDesign().dimensions;

    expect(ToolboxDimensionsSchema.safeParse({ ...base, length: NaN }).success).toBe(false);
    expect(ToolboxDimensionsSchema.safeParse({ ...base, width: Infinity }).success).toBe(false);
    expect(ToolboxDimensionsSchema.safeParse({ ...base, height: -Infinity }).success).toBe(false);
    expect(ToolboxDimensionsSchema.safeParse({ ...base, stockThickness: -5 }).success).toBe(false);
  });

  it('rejects NaN, Infinity, and -Infinity in construction parameters', () => {
    const base = createDefaultToolboxDesign().constructionParameters;

    expect(
      ToolboxConstructionParametersSchema.safeParse({ ...base, lidThickness: NaN }).success,
    ).toBe(false);
    expect(
      ToolboxConstructionParametersSchema.safeParse({ ...base, bottomThickness: NaN }).success,
    ).toBe(false);
    expect(
      ToolboxConstructionParametersSchema.safeParse({ ...base, endHandleDepth: NaN }).success,
    ).toBe(false);
    expect(
      ToolboxConstructionParametersSchema.safeParse({ ...base, endHandleHeight: NaN }).success,
    ).toBe(false);
    expect(
      ToolboxConstructionParametersSchema.safeParse({ ...base, housingDadoDepth: NaN }).success,
    ).toBe(false);
    expect(
      ToolboxConstructionParametersSchema.safeParse({ ...base, desiredOverlap: Infinity }).success,
    ).toBe(false);
    expect(
      ToolboxConstructionParametersSchema.safeParse({ ...base, wedgeTaperAngle: -Infinity })
        .success,
    ).toBe(false);
    expect(
      ToolboxConstructionParametersSchema.safeParse({ ...base, lidSideClearance: -1 }).success,
    ).toBe(false);
  });

  it('rejects missing construction parameters', () => {
    const base = {
      ...createDefaultToolboxDesign().constructionParameters,
    } as Record<string, unknown>;
    delete base.desiredOverlap;
    expect(ToolboxConstructionParametersSchema.safeParse(base).success).toBe(false);
  });

  it('rejects invalid timestamps', () => {
    const design = {
      ...createDefaultToolboxDesign(),
      createdAt: 'not-a-timestamp',
    };
    expect(ToolboxDesignSchema.safeParse(design).success).toBe(false);
  });

  it('rejects empty wood ID', () => {
    const design = {
      ...createDefaultToolboxDesign(),
      wood: { id: '   ' },
    };
    expect(ToolboxDesignSchema.safeParse(design).success).toBe(false);
  });
});

describe('V1 Schema & Migration (Sections 46, 48, 68, 69)', () => {
  const v1Fixture: ToolboxDesignV1 = {
    id: 'v1-test-id',
    name: 'Legacy V1 Toolbox',
    schemaVersion: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    unitSystem: 'metric',
    dimensions: {
      length: 600,
      width: 300,
      height: 250,
      stockThickness: 18,
    },
    constructionParameters: {
      lidThickness: 18,
      fixedTopBattenWidth: 54,
      lidBattenWidth: 45,
      lidSideClearance: 2,
      desiredOverlap: 13.5,
      lidBattenOverhang: 18,
      wedgeTaperAngle: 2,
      wedgeBevelAngle: 10,
      lockingBattenTravelClearance: 1,
    },
    wood: {
      id: 'pine',
    },
  };

  it('validates a schema-v1 design with ToolboxDesignV1Schema', () => {
    const result = ToolboxDesignV1Schema.safeParse(v1Fixture);
    expect(result.success).toBe(true);
  });

  it('migrates standard V1 default design to V2 correctly (Section 68)', () => {
    const migrated = migrateToolboxDesignV1ToV2(v1Fixture);

    expect(migrated.id).toBe('v1-test-id');
    expect(migrated.name).toBe('Legacy V1 Toolbox');
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(migrated.updatedAt).toBe('2026-01-02T00:00:00.000Z');
    expect(migrated.unitSystem).toBe('metric');
    expect(migrated.wood).toEqual({ id: 'pine' });

    expect(migrated.dimensions).toEqual({
      length: 600,
      width: 300,
      height: 250,
      stockThickness: 18,
    });

    expect(migrated.constructionParameters).toEqual({
      bottomThickness: 12,
      lidThickness: 12,
      endHandleDepth: 36,
      endHandleHeight: 72,
      housingDadoDepth: 3,
      fixedTopBattenWidth: 84,
      lidBattenWidth: 42,
      lidSideClearance: 2,
      desiredOverlap: 13.5,
      lidBattenOverhang: 18,
      wedgeTaperAngle: 2,
      wedgeBevelAngle: 10,
      lockingBattenTravelClearance: 1,
    });
  });

  it('migrates fractional stockThickness V1 design without rounding (Section 69)', () => {
    const fractionalV1: ToolboxDesignV1 = {
      ...v1Fixture,
      dimensions: {
        length: 450,
        width: 240,
        height: 200,
        stockThickness: 15,
      },
    };

    const migrated = migrateToolboxDesignV1ToV2(fractionalV1);

    expect(migrated.constructionParameters.bottomThickness).toBe(10);
    expect(migrated.constructionParameters.lidThickness).toBe(10);
    expect(migrated.constructionParameters.endHandleDepth).toBe(30);
    expect(migrated.constructionParameters.endHandleHeight).toBe(60);
    expect(migrated.constructionParameters.housingDadoDepth).toBe(2.5);
    expect(migrated.constructionParameters.fixedTopBattenWidth).toBe(70);
    expect(migrated.constructionParameters.lidBattenWidth).toBe(35);
  });
});

describe('Envelope Schema Validation', () => {
  it('validates valid PersistedDesignStore', () => {
    const store = {
      storageVersion: 1,
      designs: [createDefaultToolboxDesign()],
    };
    expect(PersistedDesignStoreSchema.safeParse(store).success).toBe(true);
  });

  it('rejects invalid storageVersion in PersistedDesignStore', () => {
    const store = {
      storageVersion: 2,
      designs: [createDefaultToolboxDesign()],
    };
    expect(PersistedDesignStoreSchema.safeParse(store).success).toBe(false);
  });

  it('validates valid PersistedSettings with activeDesignId or null', () => {
    expect(
      PersistedSettingsSchema.safeParse({
        storageVersion: 1,
        activeDesignId: 'design-123',
      }).success,
    ).toBe(true);

    expect(
      PersistedSettingsSchema.safeParse({
        storageVersion: 1,
        activeDesignId: null,
      }).success,
    ).toBe(true);
  });
});
