import { z } from 'zod';
import type {
  ToolboxDesign,
  ToolboxDimensions,
  ToolboxWoodParameters,
  UnitSystem,
} from '../../domain';

export const ToolboxConstructionParametersV2Schema = z
  .object({
    bottomThickness: z
      .number()
      .finite()
      .positive('Bottom thickness must be a positive finite number.'),
    lidThickness: z.number().finite().positive('Lid thickness must be a positive finite number.'),
    endHandleDepth: z
      .number()
      .finite()
      .positive('End handle depth must be a positive finite number.'),
    endHandleHeight: z
      .number()
      .finite()
      .positive('End handle height must be a positive finite number.'),
    housingDadoDepth: z
      .number()
      .finite()
      .positive('Housing dado depth must be a positive finite number.'),
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
  })
  .strict();

export type ToolboxConstructionParametersV2 = z.infer<typeof ToolboxConstructionParametersV2Schema>;

export const ToolboxDesignV2Schema = z
  .object({
    id: z.string().trim().min(1, 'Design ID must be a non-empty string.'),
    name: z
      .string()
      .trim()
      .min(1, 'Design name must not be empty.')
      .max(100, 'Design name must not exceed 100 characters.'),
    schemaVersion: z.literal(2, {
      message: 'Unsupported design schema version. Expected 2.',
    }),
    createdAt: z.string().datetime({ message: 'createdAt must be a valid ISO 8601 timestamp.' }),
    updatedAt: z.string().datetime({ message: 'updatedAt must be a valid ISO 8601 timestamp.' }),
    unitSystem: z.enum(['metric', 'imperial']) as z.ZodType<UnitSystem>,
    dimensions: z
      .object({
        length: z.number().finite().positive('Length must be a positive finite number.'),
        width: z.number().finite().positive('Width must be a positive finite number.'),
        height: z.number().finite().positive('Height must be a positive finite number.'),
        stockThickness: z
          .number()
          .finite()
          .positive('Stock thickness must be a positive finite number.'),
      })
      .strict() as z.ZodType<ToolboxDimensions>,
    constructionParameters: ToolboxConstructionParametersV2Schema,
    wood: z
      .object({
        id: z.string().trim().min(1, 'Wood ID must be a non-empty string.'),
      })
      .strict() as z.ZodType<ToolboxWoodParameters>,
  })
  .strict();

export type ToolboxDesignV2 = z.infer<typeof ToolboxDesignV2Schema>;

export function migrateToolboxDesignV2ToV3(v2Design: ToolboxDesignV2): ToolboxDesign {
  const { desiredOverlap, ...restConstructionParameters } = v2Design.constructionParameters;

  return {
    id: v2Design.id,
    name: v2Design.name,
    schemaVersion: 3,
    createdAt: v2Design.createdAt,
    updatedAt: v2Design.updatedAt,
    unitSystem: v2Design.unitSystem,
    dimensions: {
      length: v2Design.dimensions.length,
      width: v2Design.dimensions.width,
      height: v2Design.dimensions.height,
      stockThickness: v2Design.dimensions.stockThickness,
    },
    constructionParameters: {
      ...restConstructionParameters,
      stopEndOverlap: desiredOverlap,
      lockingEndOverlap: desiredOverlap,
    },
    wood: {
      id: v2Design.wood.id,
    },
  };
}

export function migrateToolboxDesignToCurrent(
  design: ToolboxDesign | ToolboxDesignV2,
): ToolboxDesign {
  if (design.schemaVersion === 3) {
    return design;
  }

  return migrateToolboxDesignV2ToV3(design as ToolboxDesignV2);
}
