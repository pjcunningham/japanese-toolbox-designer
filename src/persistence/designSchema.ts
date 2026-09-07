import { z } from 'zod';
import {
  TOOLBOX_DESIGN_SCHEMA_VERSION,
  type ToolboxConstructionParameters,
  type ToolboxDesign,
  type ToolboxDimensions,
  type ToolboxWoodParameters,
  type UnitSystem,
} from '../domain';

export const DESIGNS_STORAGE_KEY = 'jtd.designs.v1';
export const SETTINGS_STORAGE_KEY = 'jtd.settings.v1';
export const DESIGN_STORAGE_VERSION = 1;
export const SETTINGS_STORAGE_VERSION = 1;

export const UnitSystemSchema: z.ZodType<UnitSystem> = z.enum(['metric', 'imperial']);

export const ToolboxDimensionsSchema: z.ZodType<ToolboxDimensions> = z.object({
  length: z.number().finite().positive('Length must be a positive finite number.'),
  width: z.number().finite().positive('Width must be a positive finite number.'),
  height: z.number().finite().positive('Height must be a positive finite number.'),
  stockThickness: z.number().finite().positive('Stock thickness must be a positive finite number.'),
});

export const ToolboxConstructionParametersSchema: z.ZodType<ToolboxConstructionParameters> =
  z.object({
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

export const ToolboxWoodParametersSchema: z.ZodType<ToolboxWoodParameters> = z.object({
  id: z.string().trim().min(1, 'Wood ID must be a non-empty string.'),
});

export const ToolboxDesignSchema: z.ZodType<ToolboxDesign> = z.object({
  id: z.string().trim().min(1, 'Design ID must be a non-empty string.'),
  name: z
    .string()
    .trim()
    .min(1, 'Design name must not be empty.')
    .max(100, 'Design name must not exceed 100 characters.'),
  schemaVersion: z.literal(1, {
    message: `Unsupported design schema version. Expected ${TOOLBOX_DESIGN_SCHEMA_VERSION}.`,
  }),
  createdAt: z.string().datetime({ message: 'createdAt must be a valid ISO 8601 timestamp.' }),
  updatedAt: z.string().datetime({ message: 'updatedAt must be a valid ISO 8601 timestamp.' }),
  unitSystem: UnitSystemSchema,
  dimensions: ToolboxDimensionsSchema,
  constructionParameters: ToolboxConstructionParametersSchema,
  wood: ToolboxWoodParametersSchema,
});

export interface PersistedDesignStore {
  storageVersion: 1;
  designs: ToolboxDesign[];
}

export interface PersistedSettings {
  storageVersion: 1;
  activeDesignId: string | null;
}

export const PersistedDesignStoreSchema: z.ZodType<PersistedDesignStore> = z.object({
  storageVersion: z.literal(1),
  designs: z.array(ToolboxDesignSchema),
});

export const PersistedSettingsSchema: z.ZodType<PersistedSettings> = z.object({
  storageVersion: z.literal(1),
  activeDesignId: z.string().trim().min(1).nullable(),
});
