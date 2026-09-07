import { describe, it, expect, vi } from 'vitest';
import {
  createDefaultToolboxDesign,
  calculateToolboxGeometry,
  type ToolboxDesign,
} from '../domain';
import {
  serializeToolboxDesign,
  parseToolboxDesignJson,
  generateDesignFilename,
  makeImportedDesignUnique,
  readDesignFile,
  downloadDesignFile,
  MAX_DESIGN_FILE_SIZE_BYTES,
  DEFAULT_EXPORT_FILENAME,
} from './designJson';

describe('Phase 8 — JSON Interchange', () => {
  describe('generateDesignFilename', () => {
    it('converts names to clean lowercase hyphenated filenames', () => {
      expect(generateDesignFilename('Workshop Toolbox')).toBe('workshop-toolbox.json');
      expect(generateDesignFilename('My First Toolbox 2026')).toBe('my-first-toolbox-2026.json');
    });

    it('strips unsafe filename characters and collapses hyphens', () => {
      expect(generateDesignFilename('Toolbox #1 (Special Edition!)')).toBe(
        'toolbox-1-special-edition.json',
      );
      expect(generateDesignFilename('---Leading and Trailing---')).toBe(
        'leading-and-trailing.json',
      );
      expect(generateDesignFilename('Multiple   Spaces   Inside')).toBe(
        'multiple-spaces-inside.json',
      );
    });

    it('falls back to default filename if slug is empty or unsafe only', () => {
      expect(generateDesignFilename('')).toBe(DEFAULT_EXPORT_FILENAME);
      expect(generateDesignFilename('   ')).toBe(DEFAULT_EXPORT_FILENAME);
      expect(generateDesignFilename('!@#$%^&*()')).toBe(DEFAULT_EXPORT_FILENAME);
      expect(generateDesignFilename('---')).toBe(DEFAULT_EXPORT_FILENAME);
    });
  });

  describe('serializeToolboxDesign', () => {
    it('serializes a valid default design with 2-space indentation and trailing newline', () => {
      const design = createDefaultToolboxDesign({ name: 'Standard Pine Box' });
      const result = serializeToolboxDesign(design);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.filename).toBe('standard-pine-box.json');
      expect(result.json.endsWith('\n')).toBe(true);
      expect(result.json).toContain('  "id":');
      expect(result.json).toContain('  "dimensions": {');

      const parsed = JSON.parse(result.json);
      expect(parsed.id).toBe(design.id);
      expect(parsed.name).toBe('Standard Pine Box');
      expect(parsed.schemaVersion).toBe(1);
      expect(parsed.dimensions.length).toBe(600);
    });

    it('does NOT include derived geometry in serialized output', () => {
      const design = createDefaultToolboxDesign();
      const result = serializeToolboxDesign(design);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const parsed = JSON.parse(result.json);
      expect(parsed.internalLength).toBeUndefined();
      expect(parsed.lidPanelLength).toBeUndefined();
      expect(parsed.releaseTravelMargin).toBeUndefined();
      expect(parsed.wedgeBottomNarrowWidth).toBeUndefined();
      expect(parsed.wedgeBottomWideWidth).toBeUndefined();
      expect(parsed.box).toBeUndefined();
      expect(parsed.lid).toBeUndefined();
      expect(parsed.lockingMechanism).toBeUndefined();
    });

    it('does NOT mutate the input design or alter timestamps', () => {
      const originalTime = '2026-01-01T00:00:00.000Z';
      const design = createDefaultToolboxDesign({
        timestampGenerator: () => originalTime,
      });

      const designCopy = JSON.parse(JSON.stringify(design));
      const result = serializeToolboxDesign(design);

      expect(result.ok).toBe(true);
      expect(design).toEqual(designCopy);
      expect(design.createdAt).toBe(originalTime);
      expect(design.updatedAt).toBe(originalTime);
    });

    it('rejects schema-invalid designs', () => {
      const invalidDesign = {
        ...createDefaultToolboxDesign(),
        dimensions: {
          length: -50, // invalid negative length
          width: 300,
          height: 250,
          stockThickness: 18,
        },
      } as unknown as ToolboxDesign;

      const result = serializeToolboxDesign(invalidDesign);
      expect(result.ok).toBe(false);
      if (result.ok) return;

      expect(result.code).toBe('INVALID_DESIGN_SCHEMA');
      expect(result.details).toBeDefined();
    });

    it('rejects geometry-invalid designs', () => {
      // Create a design with invalid physical geometry (e.g. stock thickness >= height / 2)
      const invalidGeoDesign: ToolboxDesign = {
        ...createDefaultToolboxDesign(),
        dimensions: {
          length: 600,
          width: 300,
          height: 30, // height too small for stock thickness 18
          stockThickness: 18,
        },
      };

      const result = serializeToolboxDesign(invalidGeoDesign);
      expect(result.ok).toBe(false);
      if (result.ok) return;

      expect(result.code).toBe('INVALID_GEOMETRY');
      expect(result.error).toContain('physical geometry');
      expect(result.details && result.details.length).toBeGreaterThan(0);
    });
  });

  describe('parseToolboxDesignJson', () => {
    it('successfully parses a valid serialized design JSON', () => {
      const design = createDefaultToolboxDesign({ name: 'Valid Toolbox' });
      const serialized = serializeToolboxDesign(design);
      expect(serialized.ok).toBe(true);
      if (!serialized.ok) return;

      const importResult = parseToolboxDesignJson(serialized.json);
      expect(importResult.ok).toBe(true);
      if (!importResult.ok) return;

      expect(importResult.design).toEqual(design);
    });

    it('rejects malformed JSON', () => {
      const malformed = '{ this is not json';
      const result = parseToolboxDesignJson(malformed);

      expect(result.ok).toBe(false);
      if (result.ok) return;

      expect(result.code).toBe('MALFORMED_JSON');
    });

    it('rejects empty string or non-string input', () => {
      expect(parseToolboxDesignJson('').ok).toBe(false);
      expect(parseToolboxDesignJson(null as unknown as string).ok).toBe(false);
    });

    it('rejects JSON null, primitives, and JSON arrays', () => {
      const nullResult = parseToolboxDesignJson('null');
      expect(nullResult.ok).toBe(false);
      if (!nullResult.ok) {
        expect(nullResult.code).toBe('INVALID_DESIGN_SCHEMA');
      }

      const numberResult = parseToolboxDesignJson('42');
      expect(numberResult.ok).toBe(false);

      const arrayResult = parseToolboxDesignJson('[]');
      expect(arrayResult.ok).toBe(false);
      if (!arrayResult.ok) {
        expect(arrayResult.code).toBe('INVALID_DESIGN_SCHEMA');
      }
    });

    it('rejects localStorage backup envelopes with clear message', () => {
      const envelope = JSON.stringify({
        storageVersion: 1,
        designs: [createDefaultToolboxDesign()],
      });

      const result = parseToolboxDesignJson(envelope);
      expect(result.ok).toBe(false);
      if (result.ok) return;

      expect(result.code).toBe('INVALID_DESIGN_SCHEMA');
      expect(result.error).toContain('storage backup envelope');
    });

    it('rejects unsupported schema versions', () => {
      const unsupported = {
        ...createDefaultToolboxDesign(),
        schemaVersion: 2,
      };

      const result = parseToolboxDesignJson(JSON.stringify(unsupported));
      expect(result.ok).toBe(false);
      if (result.ok) return;

      expect(result.code).toBe('UNSUPPORTED_DESIGN_VERSION');
      expect(result.error).toContain('unsupported schema version');
    });

    it('rejects missing or wrong-typed properties', () => {
      const missingLength = createDefaultToolboxDesign();
      // @ts-expect-error test missing property
      delete missingLength.dimensions.length;

      const result = parseToolboxDesignJson(JSON.stringify(missingLength));
      expect(result.ok).toBe(false);
      if (result.ok) return;

      expect(result.code).toBe('INVALID_DESIGN_SCHEMA');
    });

    it('rejects invalid unit system', () => {
      const invalidUnit = {
        ...createDefaultToolboxDesign(),
        unitSystem: 'cubits',
      };

      const result = parseToolboxDesignJson(JSON.stringify(invalidUnit));
      expect(result.ok).toBe(false);
      if (result.ok) return;

      expect(result.code).toBe('INVALID_DESIGN_SCHEMA');
    });

    it('rejects designs that produce invalid physical geometry', () => {
      const validSchemaInvalidGeo = {
        ...createDefaultToolboxDesign(),
        dimensions: {
          length: 600,
          width: 300,
          height: 30, // height too small
          stockThickness: 18,
        },
      };

      const result = parseToolboxDesignJson(JSON.stringify(validSchemaInvalidGeo));
      expect(result.ok).toBe(false);
      if (result.ok) return;

      expect(result.code).toBe('INVALID_GEOMETRY');
      expect(result.error).toContain('physically invalid geometry');
    });

    it('rejects oversized JSON text exceeding file size limit', () => {
      const largePadding = ' '.repeat(MAX_DESIGN_FILE_SIZE_BYTES + 10);
      const oversized = `{"id": "1", ${largePadding}}`;

      const result = parseToolboxDesignJson(oversized);
      expect(result.ok).toBe(false);
      if (result.ok) return;

      expect(result.code).toBe('FILE_TOO_LARGE');
    });
  });

  describe('Round-trip Invariant & Precision', () => {
    it('preserves all properties and recalculates identical geometry across serialization round trip', () => {
      const original = createDefaultToolboxDesign({
        name: 'Workshop Master',
        dimensions: {
          length: 650,
          width: 320,
          height: 260,
          stockThickness: 20,
        },
        constructionParameters: {
          lidThickness: 19,
          fixedTopBattenWidth: 55,
          lidBattenWidth: 46,
          lidSideClearance: 2.5,
          desiredOverlap: 14,
          lidBattenOverhang: 19,
          wedgeTaperAngle: 2.2,
          wedgeBevelAngle: 10.5,
          lockingBattenTravelClearance: 1.5,
        },
      });

      const serialized = serializeToolboxDesign(original);
      expect(serialized.ok).toBe(true);
      if (!serialized.ok) return;

      const imported = parseToolboxDesignJson(serialized.json);
      expect(imported.ok).toBe(true);
      if (!imported.ok) return;

      expect(imported.design).toEqual(original);

      const originalGeo = calculateToolboxGeometry(original);
      const importedGeo = calculateToolboxGeometry(imported.design);
      expect(importedGeo).toEqual(originalGeo);
    });

    it('preserves exact fractional millimetre precision without rounding', () => {
      const fractionalDesign = createDefaultToolboxDesign({
        name: 'Fractional Precision Box',
        dimensions: {
          length: 600.375,
          width: 300.125,
          height: 250.5,
          stockThickness: 18.75,
        },
        constructionParameters: {
          lidThickness: 18.75,
          fixedTopBattenWidth: 54.25,
          lidBattenWidth: 45.125,
          lidSideClearance: 2.125,
          desiredOverlap: 13.5625,
          lidBattenOverhang: 18.75,
          wedgeTaperAngle: 2.125,
          wedgeBevelAngle: 10.375,
          lockingBattenTravelClearance: 1.5875,
        },
      });

      const serialized = serializeToolboxDesign(fractionalDesign);
      expect(serialized.ok).toBe(true);
      if (!serialized.ok) return;

      const imported = parseToolboxDesignJson(serialized.json);
      expect(imported.ok).toBe(true);
      if (!imported.ok) return;

      expect(imported.design.dimensions.length).toBe(600.375);
      expect(imported.design.dimensions.width).toBe(300.125);
      expect(imported.design.constructionParameters.desiredOverlap).toBe(13.5625);
      expect(imported.design.constructionParameters.lockingBattenTravelClearance).toBe(1.5875);
    });

    it('preserves imperial unit system on import without converting dimensions', () => {
      const imperialDesign: ToolboxDesign = {
        ...createDefaultToolboxDesign({ name: 'Imperial Box' }),
        unitSystem: 'imperial',
      };

      const serialized = serializeToolboxDesign(imperialDesign);
      expect(serialized.ok).toBe(true);
      if (!serialized.ok) return;

      const imported = parseToolboxDesignJson(serialized.json);
      expect(imported.ok).toBe(true);
      if (!imported.ok) return;

      expect(imported.design.unitSystem).toBe('imperial');
      expect(imported.design.dimensions.length).toBe(600); // Canonical mm remains untouched
    });
  });

  describe('makeImportedDesignUnique (ID Conflict Handling)', () => {
    it('preserves ID and timestamps when there is no conflict', () => {
      const imported = createDefaultToolboxDesign({ name: 'Unique Import' });
      const existingIds = ['other-id-1', 'other-id-2'];

      const result = makeImportedDesignUnique(imported, existingIds);

      expect(result.wasConflict).toBe(false);
      expect(result.design.id).toBe(imported.id);
      expect(result.design.createdAt).toBe(imported.createdAt);
      expect(result.design.updatedAt).toBe(imported.updatedAt);
      expect(result.design.name).toBe(imported.name);
    });

    it('generates a fresh ID and new timestamps when ID conflicts with existing IDs', () => {
      const imported = createDefaultToolboxDesign({
        name: 'Conflicting Import',
        timestampGenerator: () => '2026-01-01T00:00:00.000Z',
      });
      const existingIds = [imported.id, 'other-id'];

      const customId = 'new-unique-id-999';
      const customTime = '2026-09-07T12:00:00.000Z';

      const result = makeImportedDesignUnique(imported, existingIds, {
        idGenerator: () => customId,
        timestampGenerator: () => customTime,
      });

      expect(result.wasConflict).toBe(true);
      expect(result.design.id).toBe(customId);
      expect(result.design.createdAt).toBe(customTime);
      expect(result.design.updatedAt).toBe(customTime);
      // Name must be preserved without appending "(imported)" or "(copy)"
      expect(result.design.name).toBe('Conflicting Import');
      // Physical inputs must remain identical
      expect(result.design.dimensions).toEqual(imported.dimensions);
      expect(result.design.constructionParameters).toEqual(imported.constructionParameters);
    });
  });

  describe('Browser file operations helpers', () => {
    it('readDesignFile reads file text', async () => {
      const sampleContent = JSON.stringify({ test: 'data' });
      const file = new File([sampleContent], 'design.json', { type: 'application/json' });

      const text = await readDesignFile(file);
      expect(text).toBe(sampleContent);
    });

    it('readDesignFile rejects files exceeding 1 MiB', async () => {
      const oversizedBlob = new Blob(['a'.repeat(MAX_DESIGN_FILE_SIZE_BYTES + 100)]);
      const file = new File([oversizedBlob], 'large.json', { type: 'application/json' });

      await expect(readDesignFile(file)).rejects.toThrow(
        'The selected file is too large to be a Japanese Toolbox Designer file.',
      );
    });

    it('downloadDesignFile creates blob and triggers link click', () => {
      const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
      const revokeObjectURLMock = vi.fn();
      globalThis.URL.createObjectURL = createObjectURLMock;
      globalThis.URL.revokeObjectURL = revokeObjectURLMock;

      const clickSpy = vi.fn();
      const realCreateElement = document.createElement.bind(document);
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation(((
        tag: string,
        options?: ElementCreationOptions,
      ) => {
        const el = realCreateElement(tag, options);
        if (tag === 'a') {
          el.click = clickSpy;
        }
        return el;
      }) as typeof document.createElement);

      downloadDesignFile('{"test": true}', 'test.json');

      expect(createObjectURLMock).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');

      createElementSpy.mockRestore();
    });
  });
});
