import { z } from 'zod';
import type { ToolboxDesign, ToolboxWoodParameters, UnitSystem } from '../../domain';

export const ToolboxConstructionParametersV1Schema = z.object({
  lidThickness: z.number().finite().positive('Lid thickness must be a positive finite number.'),
  fixedTopBattenWidth: z
    .number()
    .finite()
    .positive('Fixed top batten width must be a positive finite number.'),
  lidBattenWidth: z
    .number()
    .finite()
    .positive('Lid batten width must be a positive finite number.'),
  lidSideClearance: z
    .number()
    .finite()
    .min(0, 'Lid side clearance must be a non-negative finite number.'),
  desiredOverlap: z
    .number()
    .finite()
    .min(0, 'Desired overlap must be a non-negative finite number.'),
  lidBattenOverhang: z
    .number()
    .finite()
    .min(0, 'Lid batten overhang must be a non-negative finite number.'),
  wedgeTaperAngle: z.number().finite('Wedge taper angle must be a finite number.'),
  wedgeBevelAngle: z.number().finite('Wedge bevel angle must be a finite number.'),
  lockingBattenTravelClearance: z
    .number()
    .finite()
    .min(0, 'Locking batten travel clearance must be a non-negative finite number.'),
});

export type ToolboxConstructionParametersV1 = z.infer<typeof ToolboxConstructionParametersV1Schema>;

export const ToolboxDesignV1Schema = z.object({
  id: z.string().trim().min(1, 'Design ID must be a non-empty string.'),
  name: z
    .string()
    .trim()
    .min(1, 'Design name must not be empty.')
    .max(100, 'Design name must not exceed 100 characters.'),
  schemaVersion: z.literal(1, {
    message: 'Unsupported design schema version. Expected 1.',
  }),
  createdAt: z.string().datetime({ message: 'createdAt must be a valid ISO 8601 timestamp.' }),
  updatedAt: z.string().datetime({ message: 'updatedAt must be a valid ISO 8601 timestamp.' }),
  unitSystem: z.enum(['metric', 'imperial']) as z.ZodType<UnitSystem>,
  dimensions: z.object({
    length: z.number().finite().positive('Length must be a positive finite number.'),
    width: z.number().finite().positive('Width must be a positive finite number.'),
    height: z.number().finite().positive('Height must be a positive finite number.'),
    stockThickness: z
      .number()
      .finite()
      .positive('Stock thickness must be a positive finite number.'),
  }),
  constructionParameters: ToolboxConstructionParametersV1Schema,
  wood: z.object({
    id: z.string().trim().min(1, 'Wood ID must be a non-empty string.'),
  }) as z.ZodType<ToolboxWoodParameters>,
});

export type ToolboxDesignV1 = z.infer<typeof ToolboxDesignV1Schema>;

/**
 * Pure deterministic migration function from Schema V1 to Schema V2.
 *
 * A V1 design cannot preserve its exact old carcass construction because that
 * construction model was incorrect. Migration preserves overall size, identity,
 * timestamps, and user-adjustable fit/locking preferences while replacing the
 * obsolete structural proportions with the corrected V2 inset-end construction
 * derived from the design's main stock thickness T.
 */
export function migrateToolboxDesignV1ToV2(v1Design: ToolboxDesignV1): ToolboxDesign {
  const T = v1Design.dimensions.stockThickness;

  return {
    id: v1Design.id,
    name: v1Design.name,
    schemaVersion: 2,
    createdAt: v1Design.createdAt,
    updatedAt: v1Design.updatedAt,
    unitSystem: v1Design.unitSystem,
    dimensions: {
      length: v1Design.dimensions.length,
      width: v1Design.dimensions.width,
      height: v1Design.dimensions.height,
      stockThickness: T,
    },
    constructionParameters: {
      bottomThickness: (2 / 3) * T,
      lidThickness: (2 / 3) * T,
      endHandleDepth: 2 * T,
      endHandleHeight: 4 * T,
      housingDadoDepth: T / 6,
      fixedTopBattenWidth: (14 / 3) * T,
      lidBattenWidth: (7 / 3) * T,
      lidSideClearance: v1Design.constructionParameters.lidSideClearance,
      desiredOverlap: v1Design.constructionParameters.desiredOverlap,
      lidBattenOverhang: v1Design.constructionParameters.lidBattenOverhang,
      wedgeTaperAngle: v1Design.constructionParameters.wedgeTaperAngle,
      wedgeBevelAngle: v1Design.constructionParameters.wedgeBevelAngle,
      lockingBattenTravelClearance: v1Design.constructionParameters.lockingBattenTravelClearance,
    },
    wood: {
      id: v1Design.wood.id,
    },
  };
}
