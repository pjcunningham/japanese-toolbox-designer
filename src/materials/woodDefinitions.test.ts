import { describe, it, expect } from 'vitest';
import {
  getWoodDefinitions,
  getWoodDefinition,
  WOOD_DEFINITIONS,
  DEFAULT_WOOD_ID,
  CUSTOM_WOOD_ID,
  MATERIAL_DISCLAIMER,
} from './woodDefinitions';

describe('Wood Material Catalogue', () => {
  it('contains all required V1 species with non-empty metadata', () => {
    const definitions = getWoodDefinitions();
    expect(definitions.length).toBeGreaterThanOrEqual(9);

    const requiredIds = [
      'hinoki',
      'japanese-cedar',
      'pine',
      'douglas-fir',
      'paulownia',
      'ash',
      'oak',
      'beech',
      'custom',
    ];

    const ids = definitions.map((d) => d.id);
    for (const requiredId of requiredIds) {
      expect(ids).toContain(requiredId);
    }

    // Uniqueness
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);

    for (const def of definitions) {
      expect(def.id.trim()).toBe(def.id);
      expect(def.name.trim().length).toBeGreaterThan(0);
      expect(def.description.trim().length).toBeGreaterThan(0);
      expect(def.displayColour).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(def.roughness).toBeGreaterThanOrEqual(0);
      expect(def.roughness).toBeLessThanOrEqual(1);
      expect(Number.isFinite(def.roughness)).toBe(true);
    }
  });

  it('has Pine as the default wood ID and custom as fallback ID', () => {
    expect(DEFAULT_WOOD_ID).toBe('pine');
    expect(CUSTOM_WOOD_ID).toBe('custom');
    expect(getWoodDefinition('pine').id).toBe('pine');
    expect(getWoodDefinition('custom').id).toBe('custom');
  });

  it('safely handles unknown wood IDs by returning the custom fallback definition without throwing', () => {
    const unknownLookup = getWoodDefinition('non-existent-exotic-wood-12345');
    expect(unknownLookup).toBeDefined();
    expect(unknownLookup.id).toBe('custom');
    expect(unknownLookup.name).toBe('Other / Custom');

    // Empty string fallback
    const emptyLookup = getWoodDefinition('');
    expect(emptyLookup.id).toBe('custom');
  });

  it('provides a frozen/immutable catalogue', () => {
    expect(Object.isFrozen(WOOD_DEFINITIONS)).toBe(true);
  });

  it('exposes the illustrative material disclaimer', () => {
    expect(MATERIAL_DISCLAIMER).toContain('Approximate visual representation');
  });
});
