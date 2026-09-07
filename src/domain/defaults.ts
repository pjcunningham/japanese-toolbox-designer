import {
  TOOLBOX_DESIGN_SCHEMA_VERSION,
  type ToolboxConstructionParameters,
  type ToolboxDesign,
  type ToolboxDimensions,
  type ToolboxWoodParameters,
} from './design';

export const DEFAULT_DIMENSIONS: Readonly<ToolboxDimensions> = Object.freeze({
  length: 600,
  width: 300,
  height: 250,
  stockThickness: 18,
});

export const DEFAULT_CONSTRUCTION_PARAMETERS: Readonly<ToolboxConstructionParameters> =
  Object.freeze({
    lidThickness: 18,
    fixedTopBattenWidth: 54, // ~3 * T (3 * 18 = 54)
    lidBattenWidth: 45, // ~2.5 * T (2.5 * 18 = 45)
    lidSideClearance: 2,
    desiredOverlap: 13.5, // ~0.75 * T (0.75 * 18 = 13.5)
    lidBattenOverhang: 18,
    wedgeTaperAngle: 2, // degrees (alpha)
    wedgeBevelAngle: 10, // degrees (beta)
    lockingBattenTravelClearance: 1, // mm (Q)
  });

export const DEFAULT_WOOD: Readonly<ToolboxWoodParameters> = Object.freeze({
  id: 'pine',
});

export const DEFAULT_DESIGN_NAME = 'Japanese Toolbox';

export interface CreateToolboxDesignOptions {
  idGenerator?: () => string;
  timestampGenerator?: () => string;
  name?: string;
  dimensions?: Partial<ToolboxDimensions>;
  constructionParameters?: Partial<ToolboxConstructionParameters>;
  wood?: Partial<ToolboxWoodParameters>;
}

function defaultIdGenerator(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for non-standard environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Creates a default canonical ToolboxDesign instance.
 * All dimensions are stored in millimetres.
 */
export function createDefaultToolboxDesign(options?: CreateToolboxDesignOptions): ToolboxDesign {
  const generateId = options?.idGenerator ?? defaultIdGenerator;
  const generateTimestamp = options?.timestampGenerator ?? (() => new Date().toISOString());
  const now = generateTimestamp();

  return {
    id: generateId(),
    name: options?.name ?? DEFAULT_DESIGN_NAME,
    schemaVersion: TOOLBOX_DESIGN_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    unitSystem: 'metric',
    dimensions: {
      ...DEFAULT_DIMENSIONS,
      ...options?.dimensions,
    },
    constructionParameters: {
      ...DEFAULT_CONSTRUCTION_PARAMETERS,
      ...options?.constructionParameters,
    },
    wood: {
      ...DEFAULT_WOOD,
      ...options?.wood,
    },
  };
}
