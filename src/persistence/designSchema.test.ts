import { describe, it, expect } from 'vitest';
import { createDefaultToolboxDesign } from '../domain';
import {
  ToolboxDesignSchema,
  ToolboxDimensionsSchema,
  ToolboxConstructionParametersSchema,
  PersistedDesignStoreSchema,
  PersistedSettingsSchema,
} from './designSchema';

describe('ToolboxDesignSchema Zod Validation', () => {
  it('validates a default valid ToolboxDesign', () => {
    const design = createDefaultToolboxDesign();
    const result = ToolboxDesignSchema.safeParse(design);
    expect(result.success).toBe(true);
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
