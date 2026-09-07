import { getWoodDefinition, type WoodDefinition } from '../../../materials';

export interface RenderWoodMaterial {
  color: string;
  roughness: number;
  metalness: number;
  edgeColor: string;
}

export type ToolboxPartCategory = 'carcass' | 'lid' | 'wedge';

/**
 * Categorizes a part ID into carcass, lid assembly, or locking wedge.
 */
export function getPartCategory(partId: string): ToolboxPartCategory {
  if (partId === 'locking-wedge') {
    return 'wedge';
  }
  if (
    partId.startsWith('lid-') ||
    partId.startsWith('straight-') ||
    partId.startsWith('locking-lid-')
  ) {
    return 'lid';
  }
  return 'carcass';
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function adjustLightness(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  if (factor >= 0) {
    // Lighten
    return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor);
  }
  // Darken
  const mult = 1 + factor;
  return rgbToHex(r * mult, g * mult, b * mult);
}

function deriveEdgeColor(baseHex: string): string {
  const [r, g, b] = hexToRgb(baseHex);
  // Darken proportionally to maintain crisp, readable outlines across pale and dark timber
  return rgbToHex(r * 0.32, g * 0.28, b * 0.24);
}

/**
 * Resolves Three.js-ready material properties for a given wood species ID / definition and part ID.
 * Returns non-metallic parameters with restrained deterministic part-family colour differentiation.
 */
export function resolveWoodMaterial(
  woodIdOrDefinition: string | WoodDefinition,
  partId?: string,
): RenderWoodMaterial {
  const definition =
    typeof woodIdOrDefinition === 'string'
      ? getWoodDefinition(woodIdOrDefinition)
      : woodIdOrDefinition;

  const category = partId ? getPartCategory(partId) : 'carcass';

  let color = definition.displayColour;
  if (category === 'lid') {
    color = adjustLightness(definition.displayColour, 0.07);
  } else if (category === 'wedge') {
    color = adjustLightness(definition.displayColour, -0.12);
  }

  const edgeColor = deriveEdgeColor(definition.displayColour);

  return {
    color,
    roughness: definition.roughness,
    metalness: 0,
    edgeColor,
  };
}
