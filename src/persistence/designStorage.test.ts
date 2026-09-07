import { describe, it, expect } from 'vitest';
import { createDefaultToolboxDesign, type ToolboxDesign } from '../domain';
import {
  DESIGNS_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  DESIGN_STORAGE_VERSION,
  SETTINGS_STORAGE_VERSION,
} from './designSchema';
import {
  loadDesignStore,
  writeDesignStore,
  upsertDesignInStore,
  deleteDesignFromStore,
  loadSettings,
  writeSettings,
  type StorageLike,
} from './designStorage';

function createMockStorage(initialData: Record<string, string> = {}): StorageLike {
  const store = new Map<string, string>(Object.entries(initialData));
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
}

describe('designStorage persistence functions', () => {
  it('handles empty localStorage gracefully', () => {
    const storage = createMockStorage();
    const result = loadDesignStore(storage);

    expect(result.status).toBe('ok');
    expect(result.designs).toEqual([]);
    if (result.status === 'ok') {
      expect(result.warnings).toEqual([]);
      expect(result.isReadOnly).toBe(false);
    }
  });

  it('performs a valid design store round trip', () => {
    const storage = createMockStorage();
    const design1 = createDefaultToolboxDesign({
      name: 'Box 1',
      idGenerator: () => 'id-1',
      timestampGenerator: () => '2026-09-07T10:00:00.000Z',
    });

    const writeResult = writeDesignStore(
      {
        storageVersion: DESIGN_STORAGE_VERSION,
        designs: [design1],
      },
      storage,
    );
    expect(writeResult.ok).toBe(true);

    const loadResult = loadDesignStore(storage);
    expect(loadResult.status).toBe('ok');
    expect(loadResult.designs).toHaveLength(1);
    expect(loadResult.designs[0]).toEqual(design1);
  });

  it('stores multiple designs and returns them sorted by updatedAt descending', () => {
    const storage = createMockStorage();
    const d1 = createDefaultToolboxDesign({
      name: 'Older Box',
      idGenerator: () => 'id-old',
      timestampGenerator: () => '2026-09-07T08:00:00.000Z',
    });
    const d2 = createDefaultToolboxDesign({
      name: 'Newer Box',
      idGenerator: () => 'id-new',
      timestampGenerator: () => '2026-09-07T12:00:00.000Z',
    });

    writeDesignStore({ storageVersion: DESIGN_STORAGE_VERSION, designs: [d1, d2] }, storage);

    const result = loadDesignStore(storage);
    expect(result.status).toBe('ok');
    expect(result.designs).toHaveLength(2);
    expect(result.designs[0]?.id).toBe('id-new');
    expect(result.designs[1]?.id).toBe('id-old');
  });

  it('upserts a new design and updates an existing design by ID', () => {
    const storage = createMockStorage();
    const initialDesign = createDefaultToolboxDesign({
      name: 'Original Name',
      idGenerator: () => 'fixed-id',
      timestampGenerator: () => '2026-09-07T09:00:00.000Z',
    });

    const res1 = upsertDesignInStore(initialDesign, storage);
    expect(res1.ok).toBe(true);

    const updatedDesign: ToolboxDesign = {
      ...initialDesign,
      name: 'Updated Name',
      updatedAt: '2026-09-07T10:00:00.000Z',
      dimensions: {
        ...initialDesign.dimensions,
        length: 750,
      },
    };

    const res2 = upsertDesignInStore(updatedDesign, storage);
    expect(res2.ok).toBe(true);

    const loadResult = loadDesignStore(storage);
    expect(loadResult.status).toBe('ok');
    expect(loadResult.designs).toHaveLength(1);
    expect(loadResult.designs[0]?.name).toBe('Updated Name');
    expect(loadResult.designs[0]?.dimensions.length).toBe(750);
  });

  it('deletes a design by ID', () => {
    const storage = createMockStorage();
    const d1 = createDefaultToolboxDesign({ idGenerator: () => 'id-1' });
    const d2 = createDefaultToolboxDesign({ idGenerator: () => 'id-2' });

    upsertDesignInStore(d1, storage);
    upsertDesignInStore(d2, storage);

    const deleteRes = deleteDesignFromStore('id-1', storage);
    expect(deleteRes.ok).toBe(true);

    const loadResult = loadDesignStore(storage);
    expect(loadResult.status).toBe('ok');
    expect(loadResult.designs).toHaveLength(1);
    expect(loadResult.designs[0]?.id).toBe('id-2');
  });

  it('performs settings round trip and stores activeDesignId', () => {
    const storage = createMockStorage();
    const initialSettings = loadSettings(storage);
    expect(initialSettings.status).toBe('ok');
    expect(initialSettings.settings.activeDesignId).toBeNull();

    const writeRes = writeSettings(
      {
        storageVersion: SETTINGS_STORAGE_VERSION,
        activeDesignId: 'design-abc',
      },
      storage,
    );
    expect(writeRes.ok).toBe(true);

    const updatedSettings = loadSettings(storage);
    expect(updatedSettings.status).toBe('ok');
    expect(updatedSettings.settings.activeDesignId).toBe('design-abc');
  });

  it('handles malformed JSON in design storage without crashing', () => {
    const storage = createMockStorage({
      [DESIGNS_STORAGE_KEY]: '{ invalid json ...',
    });

    const result = loadDesignStore(storage);
    expect(result.status).toBe('corrupted');
    expect(result.designs).toEqual([]);
    expect(result.isReadOnly).toBe(false);
  });

  it('handles malformed JSON in settings without crashing', () => {
    const storage = createMockStorage({
      [SETTINGS_STORAGE_KEY]: '{ broken settings ...',
    });

    const result = loadSettings(storage);
    expect(result.status).toBe('warning');
    expect(result.settings.activeDesignId).toBeNull();
  });

  it('handles malformed envelope structures', () => {
    const storage = createMockStorage({
      [DESIGNS_STORAGE_KEY]: JSON.stringify({ notAnEnvelope: true }),
    });

    const result = loadDesignStore(storage);
    expect(result.status).toBe('corrupted');
    expect(result.designs).toEqual([]);
  });

  it('handles unsupported future storage versions as read-only and blocked', () => {
    const storage = createMockStorage({
      [DESIGNS_STORAGE_KEY]: JSON.stringify({
        storageVersion: 2,
        designs: [],
      }),
    });

    const result = loadDesignStore(storage);
    expect(result.status).toBe('unsupported_version');
    if (result.status === 'unsupported_version') {
      expect(result.isReadOnly).toBe(true);
      expect(result.error).toContain('newer version of Japanese Toolbox Designer');
    }

    // Attempting upsert or delete should fail
    const upsertRes = upsertDesignInStore(createDefaultToolboxDesign(), storage);
    expect(upsertRes.ok).toBe(false);

    const deleteRes = deleteDesignFromStore('some-id', storage);
    expect(deleteRes.ok).toBe(false);
  });

  it('salvages valid designs when some designs have unsupported schema version or invalid data', () => {
    const valid1 = createDefaultToolboxDesign({
      name: 'Valid One',
      idGenerator: () => 'v-1',
    });
    const valid2 = createDefaultToolboxDesign({
      name: 'Valid Two',
      idGenerator: () => 'v-2',
    });

    const unsupportedSchemaDesign = {
      ...createDefaultToolboxDesign({ name: 'Future Box' }),
      schemaVersion: 999,
    };

    const invalidNumberDesign = {
      ...createDefaultToolboxDesign({ name: 'Corrupt Box' }),
      dimensions: {
        ...createDefaultToolboxDesign().dimensions,
        length: NaN,
      },
    };

    const storage = createMockStorage({
      [DESIGNS_STORAGE_KEY]: JSON.stringify({
        storageVersion: DESIGN_STORAGE_VERSION,
        designs: [valid1, unsupportedSchemaDesign, invalidNumberDesign, valid2],
      }),
    });

    const result = loadDesignStore(storage);
    expect(result.status).toBe('ok');
    expect(result.designs).toHaveLength(2);
    expect(result.designs.map((d) => d.id)).toEqual(['v-1', 'v-2']);
    if (result.status === 'ok') {
      expect(result.warnings).toHaveLength(2);
      expect(result.warnings[0]).toContain('unsupported design schema version');
      expect(result.warnings[1]).toContain('skipped because it was corrupted or invalid');
    }
  });

  it('loads and migrates schema-v1 designs in-memory without rewriting storage (Sections 51, 52, 74)', () => {
    const v1Design = {
      id: 'v1-saved-id',
      name: 'V1 Box In Storage',
      schemaVersion: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
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
      wood: { id: 'pine' },
    };

    const initialJson = JSON.stringify({
      storageVersion: 1,
      designs: [v1Design],
    });

    const storage = createMockStorage({
      [DESIGNS_STORAGE_KEY]: initialJson,
    });

    const result = loadDesignStore(storage);
    expect(result.status).toBe('ok');
    expect(result.designs).toHaveLength(1);
    expect(result.designs[0]?.schemaVersion).toBe(2);
    expect(result.designs[0]?.constructionParameters.bottomThickness).toBe(12);
    expect(result.designs[0]?.constructionParameters.endHandleDepth).toBe(36);
    expect(result.designs[0]?.constructionParameters.housingDadoDepth).toBe(3);
    if (result.status === 'ok') {
      expect(result.warnings.some((w) => w.includes('automatically migrated'))).toBe(true);
    }

    // Storage was NOT rewritten merely from loading (Section 52)
    expect(storage.getItem(DESIGNS_STORAGE_KEY)).toBe(initialJson);
  });

  it('loads a mixed store with both V1 and V2 designs', () => {
    const v1Design = {
      id: 'v1-mixed-id',
      name: 'V1 Box',
      schemaVersion: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
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
      wood: { id: 'pine' },
    };
    const v2Design = createDefaultToolboxDesign({
      name: 'V2 Box',
      idGenerator: () => 'v2-mixed-id',
    });

    const storage = createMockStorage({
      [DESIGNS_STORAGE_KEY]: JSON.stringify({
        storageVersion: 1,
        designs: [v1Design, v2Design],
      }),
    });

    const result = loadDesignStore(storage);
    expect(result.status).toBe('ok');
    expect(result.designs).toHaveLength(2);
    expect(result.designs.every((d) => d.schemaVersion === 2)).toBe(true);
  });

  it('handles storage read exception gracefully', () => {
    const throwingStorage: StorageLike = {
      getItem: () => {
        throw new Error('SecurityError: Access Denied');
      },
      setItem: () => {},
      removeItem: () => {},
    };

    const result = loadDesignStore(throwingStorage);
    expect(result.status).toBe('storage_unavailable');
    expect(result.isReadOnly).toBe(true);
    expect(result.designs).toEqual([]);
  });

  it('handles storage write exception gracefully without corrupting state', () => {
    const throwingStorage: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {},
    };

    const design = createDefaultToolboxDesign();
    const result = upsertDesignInStore(design, throwingStorage);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('Failed to write');
    }
  });
});
