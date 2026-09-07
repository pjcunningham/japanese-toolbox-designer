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
    bottomThickness: 12, // Tb = (2/3) * T = 12 mm
    lidThickness: 12, // P = (2/3) * T = 12 mm
    endHandleDepth: 36, // I = 2 * T = 36 mm
    endHandleHeight: 72, // H = 4 * T = 72 mm
    housingDadoDepth: 3, // G = T / 6 = 3 mm
    fixedTopBattenWidth: 84, // R = (14/3) * T = 84 mm
    lidBattenWidth: 42, // B = (7/3) * T = 42 mm
    lidSideClearance: 2, // C = 2 mm
    desiredOverlap: 13.5, // O = 0.75 * T = 13.5 mm
    lidBattenOverhang: 18, // E = T = 18 mm
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

export interface DuplicateToolboxDesignOptions {
  idGenerator?: () => string;
  timestampGenerator?: () => string;
  name?: string;
}

/**
 * Creates an independent clone of a ToolboxDesign with a fresh ID, new timestamps,
 * and a copy-style name without mutating or sharing object references with the original.
 */
export function duplicateToolboxDesign(
  source: ToolboxDesign,
  options?: DuplicateToolboxDesignOptions,
): ToolboxDesign {
  const generateId = options?.idGenerator ?? defaultIdGenerator;
  const generateTimestamp = options?.timestampGenerator ?? (() => new Date().toISOString());
  const now = generateTimestamp();

  return {
    id: generateId(),
    name: options?.name ?? `${source.name} (copy)`,
    schemaVersion: source.schemaVersion,
    createdAt: now,
    updatedAt: now,
    unitSystem: source.unitSystem,
    dimensions: {
      length: source.dimensions.length,
      width: source.dimensions.width,
      height: source.dimensions.height,
      stockThickness: source.dimensions.stockThickness,
    },
    constructionParameters: {
      bottomThickness: source.constructionParameters.bottomThickness,
      lidThickness: source.constructionParameters.lidThickness,
      endHandleDepth: source.constructionParameters.endHandleDepth,
      endHandleHeight: source.constructionParameters.endHandleHeight,
      housingDadoDepth: source.constructionParameters.housingDadoDepth,
      fixedTopBattenWidth: source.constructionParameters.fixedTopBattenWidth,
      lidBattenWidth: source.constructionParameters.lidBattenWidth,
      lidSideClearance: source.constructionParameters.lidSideClearance,
      desiredOverlap: source.constructionParameters.desiredOverlap,
      lidBattenOverhang: source.constructionParameters.lidBattenOverhang,
      wedgeTaperAngle: source.constructionParameters.wedgeTaperAngle,
      wedgeBevelAngle: source.constructionParameters.wedgeBevelAngle,
      lockingBattenTravelClearance: source.constructionParameters.lockingBattenTravelClearance,
    },
    wood: {
      id: source.wood.id,
    },
  };
}
