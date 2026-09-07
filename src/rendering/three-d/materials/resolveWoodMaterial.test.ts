import { describe, it, expect } from 'vitest';
import { resolveWoodMaterial, getPartCategory } from './resolveWoodMaterial';
import { getWoodDefinition } from '../../../materials';

describe('resolveWoodMaterial', () => {
  it('correctly categorizes part IDs', () => {
    expect(getPartCategory('front-side')).toBe('carcass');
    expect(getPartCategory('back-side')).toBe('carcass');
    expect(getPartCategory('left-end')).toBe('carcass');
    expect(getPartCategory('right-end')).toBe('carcass');
    expect(getPartCategory('bottom')).toBe('carcass');
    expect(getPartCategory('left-handle')).toBe('carcass');
    expect(getPartCategory('right-handle')).toBe('carcass');
    expect(getPartCategory('left-fixed-batten')).toBe('carcass');
    expect(getPartCategory('right-fixed-batten')).toBe('carcass');

    expect(getPartCategory('lid-panel')).toBe('lid');
    expect(getPartCategory('straight-lid-batten')).toBe('lid');
    expect(getPartCategory('locking-lid-batten')).toBe('lid');

    expect(getPartCategory('locking-wedge')).toBe('wedge');
  });

  it('resolves species material properties for Pine, Oak, and Hinoki with zero metalness', () => {
    const pineMat = resolveWoodMaterial('pine', 'front-side');
    const oakMat = resolveWoodMaterial('oak', 'front-side');
    const hinokiMat = resolveWoodMaterial('hinoki', 'front-side');

    expect(pineMat.metalness).toBe(0);
    expect(oakMat.metalness).toBe(0);
    expect(hinokiMat.metalness).toBe(0);

    expect(pineMat.roughness).toBe(getWoodDefinition('pine').roughness);
    expect(oakMat.roughness).toBe(getWoodDefinition('oak').roughness);
    expect(hinokiMat.roughness).toBe(getWoodDefinition('hinoki').roughness);

    expect(pineMat.color).toBe(getWoodDefinition('pine').displayColour);
    expect(oakMat.color).toBe(getWoodDefinition('oak').displayColour);
    expect(hinokiMat.color).toBe(getWoodDefinition('hinoki').displayColour);

    expect(pineMat.color).not.toBe(oakMat.color);
    expect(pineMat.color).not.toBe(hinokiMat.color);
  });

  it('provides deterministic part-family variation derived from the selected species', () => {
    const pineCarcass = resolveWoodMaterial('pine', 'front-side');
    const pineLid = resolveWoodMaterial('pine', 'lid-panel');
    const pineWedge = resolveWoodMaterial('pine', 'locking-wedge');

    expect(pineLid.color).not.toBe(pineCarcass.color);
    expect(pineWedge.color).not.toBe(pineCarcass.color);
    expect(pineLid.color).not.toBe(pineWedge.color);

    const oakCarcass = resolveWoodMaterial('oak', 'front-side');
    const oakLid = resolveWoodMaterial('oak', 'lid-panel');
    const oakWedge = resolveWoodMaterial('oak', 'locking-wedge');

    expect(oakLid.color).not.toBe(oakCarcass.color);
    expect(oakWedge.color).not.toBe(oakCarcass.color);
    expect(oakLid.color).not.toBe(oakWedge.color);

    // Oak lid is derived from Oak, not fixed Pine color
    expect(oakLid.color).not.toBe(pineLid.color);
    expect(oakWedge.color).not.toBe(pineWedge.color);
  });

  it('derives readable edge colors for both pale and dark woods', () => {
    const hinokiMat = resolveWoodMaterial('hinoki');
    const oakMat = resolveWoodMaterial('oak');

    expect(hinokiMat.edgeColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(oakMat.edgeColor).toMatch(/^#[0-9a-fA-F]{6}$/);

    expect(hinokiMat.edgeColor).not.toBe(hinokiMat.color);
    expect(oakMat.edgeColor).not.toBe(oakMat.color);
  });

  it('safely handles unknown wood IDs by resolving the custom fallback', () => {
    const unknownMat = resolveWoodMaterial('exotic-future-timber-999', 'locking-wedge');
    const customDefinition = getWoodDefinition('custom');

    expect(unknownMat.metalness).toBe(0);
    expect(unknownMat.roughness).toBe(customDefinition.roughness);
    expect(unknownMat.color).toBeDefined();
  });
});
