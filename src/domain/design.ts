export type UnitSystem = 'metric' | 'imperial';

export const TOOLBOX_DESIGN_SCHEMA_VERSION = 1;

export interface ToolboxDimensions {
  length: number;
  width: number;
  height: number;
  stockThickness: number;
}

export interface ToolboxConstructionParameters {
  lidThickness: number;
  fixedTopBattenWidth: number;
  lidBattenWidth: number;
  lidSideClearance: number;
  desiredOverlap: number;
  lidBattenOverhang: number;
  wedgeTaperAngle: number;
  wedgeBevelAngle: number;
}

export interface ToolboxWoodParameters {
  id: string;
}

export interface ToolboxDesign {
  id: string;
  name: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  unitSystem: UnitSystem;
  dimensions: ToolboxDimensions;
  constructionParameters: ToolboxConstructionParameters;
  wood: ToolboxWoodParameters;
}

export interface UnitSwitchOptions {
  timestampGenerator?: () => string;
}

/**
 * Changes the presentation unit system for a design without mutating or recalculating
 * underlying millimetre dimensions, avoiding cumulative rounding drift.
 */
export function setDesignUnitSystem(
  design: ToolboxDesign,
  unitSystem: UnitSystem,
  options?: UnitSwitchOptions,
): ToolboxDesign {
  if (design.unitSystem === unitSystem) {
    return design;
  }

  const generateTimestamp = options?.timestampGenerator ?? (() => new Date().toISOString());

  return {
    ...design,
    unitSystem,
    updatedAt: generateTimestamp(),
  };
}
