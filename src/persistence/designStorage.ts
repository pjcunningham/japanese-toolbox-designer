import type { ToolboxDesign } from '../domain';
import { TOOLBOX_DESIGN_SCHEMA_VERSION } from '../domain';
import {
  DESIGNS_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  DESIGN_STORAGE_VERSION,
  SETTINGS_STORAGE_VERSION,
  PersistedDesignStoreSchema,
  PersistedSettingsSchema,
  ToolboxDesignSchema,
  ToolboxDesignV1Schema,
  migrateToolboxDesignV1ToV2,
  type PersistedDesignStore,
  type PersistedSettings,
} from './designSchema';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function getDefaultStorage(): StorageLike | undefined {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return undefined;
}

export interface LoadDesignStoreSuccess {
  status: 'ok';
  designs: ToolboxDesign[];
  warnings: string[];
  isReadOnly: false;
}

export interface LoadDesignStoreUnsupportedVersion {
  status: 'unsupported_version';
  designs: [];
  version: number;
  error: string;
  isReadOnly: true;
}

export interface LoadDesignStoreCorrupted {
  status: 'corrupted';
  designs: [];
  error: string;
  isReadOnly: false;
}

export interface LoadDesignStoreStorageUnavailable {
  status: 'storage_unavailable';
  designs: [];
  error: string;
  isReadOnly: true;
}

export type LoadDesignStoreResult =
  | LoadDesignStoreSuccess
  | LoadDesignStoreUnsupportedVersion
  | LoadDesignStoreCorrupted
  | LoadDesignStoreStorageUnavailable;

export interface StorageOperationSuccess<T = void> {
  ok: true;
  data?: T;
}

export interface StorageOperationFailure {
  ok: false;
  error: string;
}

export type StorageOperationResult<T = void> = StorageOperationSuccess<T> | StorageOperationFailure;

/**
 * Sorts designs deterministically by updatedAt descending, then by name.
 */
export function sortDesigns(designs: ToolboxDesign[]): ToolboxDesign[] {
  return [...designs].sort((a, b) => {
    const timeA = Date.parse(a.updatedAt) || 0;
    const timeB = Date.parse(b.updatedAt) || 0;
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Loads and validates saved designs from localStorage.
 * Handles missing storage, parse errors, unsupported envelope versions,
 * unsupported design schema versions, and salvages valid designs from partially corrupt stores.
 */
export function loadDesignStore(
  storage: StorageLike | undefined = getDefaultStorage(),
): LoadDesignStoreResult {
  if (!storage) {
    return {
      status: 'storage_unavailable',
      designs: [],
      error: 'Browser storage is unavailable; changes cannot be saved.',
      isReadOnly: true,
    };
  }

  let raw: string | null;
  try {
    raw = storage.getItem(DESIGNS_STORAGE_KEY);
  } catch {
    return {
      status: 'storage_unavailable',
      designs: [],
      error: 'Browser storage is unavailable; changes cannot be saved.',
      isReadOnly: true,
    };
  }

  if (raw === null || raw.trim() === '') {
    return {
      status: 'ok',
      designs: [],
      warnings: [],
      isReadOnly: false,
    };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return {
      status: 'corrupted',
      designs: [],
      error: 'Saved designs could not be read because the storage data is malformed JSON.',
      isReadOnly: false,
    };
  }

  if (typeof parsedJson !== 'object' || parsedJson === null) {
    return {
      status: 'corrupted',
      designs: [],
      error: 'Saved designs envelope is malformed.',
      isReadOnly: false,
    };
  }

  const envelope = parsedJson as Record<string, unknown>;

  if (
    typeof envelope.storageVersion === 'number' &&
    envelope.storageVersion > DESIGN_STORAGE_VERSION
  ) {
    return {
      status: 'unsupported_version',
      designs: [],
      version: envelope.storageVersion,
      error:
        'Saved designs were created by a newer version of Japanese Toolbox Designer and cannot be modified by this version.',
      isReadOnly: true,
    };
  }

  if (envelope.storageVersion !== DESIGN_STORAGE_VERSION || !Array.isArray(envelope.designs)) {
    return {
      status: 'corrupted',
      designs: [],
      error: 'Saved designs envelope structure is invalid.',
      isReadOnly: false,
    };
  }

  const validDesigns: ToolboxDesign[] = [];
  const warnings: string[] = [];

  for (const item of envelope.designs) {
    if (typeof item !== 'object' || item === null) {
      warnings.push('A saved design was skipped because it was corrupted or invalid.');
      continue;
    }

    const itemObj = item as Record<string, unknown>;
    const version = itemObj.schemaVersion;

    if (version === 2) {
      const parseResult = ToolboxDesignSchema.safeParse(item);
      if (parseResult.success) {
        validDesigns.push(parseResult.data);
      } else {
        warnings.push('A saved design was skipped because it was corrupted or invalid.');
      }
    } else if (version === 1) {
      const v1Result = ToolboxDesignV1Schema.safeParse(item);
      if (v1Result.success) {
        const migrated = migrateToolboxDesignV1ToV2(v1Result.data);
        validDesigns.push(migrated);
        const designName = migrated.name ? `"${migrated.name}"` : 'Unknown';
        warnings.push(
          `Design ${designName} was automatically migrated from schema version 1 to version 2.`,
        );
      } else {
        warnings.push('A saved design was skipped because it was corrupted or invalid.');
      }
    } else if (typeof version === 'number' && version > TOOLBOX_DESIGN_SCHEMA_VERSION) {
      const designName =
        typeof itemObj.name === 'string' && itemObj.name.trim()
          ? `"${itemObj.name.trim()}"`
          : 'Unknown';
      warnings.push(
        `Design ${designName} was skipped due to unsupported design schema version (${String(version)}).`,
      );
    } else {
      warnings.push('A saved design was skipped because it was corrupted or invalid.');
    }
  }

  return {
    status: 'ok',
    designs: sortDesigns(validDesigns),
    warnings,
    isReadOnly: false,
  };
}

/**
 * Persists the complete design store into localStorage.
 */
export function writeDesignStore(
  store: PersistedDesignStore,
  storage: StorageLike | undefined = getDefaultStorage(),
): StorageOperationResult {
  if (!storage) {
    return {
      ok: false,
      error: 'Browser storage is unavailable; changes cannot be saved.',
    };
  }

  const validation = PersistedDesignStoreSchema.safeParse(store);
  if (!validation.success) {
    return {
      ok: false,
      error: 'Cannot save invalid design store structure.',
    };
  }

  try {
    storage.setItem(DESIGNS_STORAGE_KEY, JSON.stringify(validation.data));
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: 'Failed to write saved designs to browser storage.',
    };
  }
}

/**
 * Upserts a design by ID into the saved design store.
 */
export function upsertDesignInStore(
  design: ToolboxDesign,
  storage: StorageLike | undefined = getDefaultStorage(),
): StorageOperationResult<ToolboxDesign[]> {
  const designValidation = ToolboxDesignSchema.safeParse(design);
  if (!designValidation.success) {
    return {
      ok: false,
      error: 'Cannot save invalid design data.',
    };
  }

  const loadResult = loadDesignStore(storage);
  if (loadResult.status === 'unsupported_version') {
    return {
      ok: false,
      error: loadResult.error,
    };
  }
  if (loadResult.status === 'storage_unavailable') {
    return {
      ok: false,
      error: loadResult.error,
    };
  }

  const existingDesigns = loadResult.status === 'ok' ? [...loadResult.designs] : [];
  const index = existingDesigns.findIndex((d) => d.id === design.id);

  if (index >= 0) {
    existingDesigns[index] = designValidation.data;
  } else {
    existingDesigns.push(designValidation.data);
  }

  const sorted = sortDesigns(existingDesigns);
  const writeResult = writeDesignStore(
    {
      storageVersion: DESIGN_STORAGE_VERSION,
      designs: sorted,
    },
    storage,
  );

  if (!writeResult.ok) {
    return {
      ok: false,
      error: writeResult.error,
    };
  }

  return {
    ok: true,
    data: sorted,
  };
}

/**
 * Deletes a design by ID from the saved design store.
 */
export function deleteDesignFromStore(
  designId: string,
  storage: StorageLike | undefined = getDefaultStorage(),
): StorageOperationResult<ToolboxDesign[]> {
  const loadResult = loadDesignStore(storage);
  if (loadResult.status === 'unsupported_version') {
    return {
      ok: false,
      error: loadResult.error,
    };
  }
  if (loadResult.status === 'storage_unavailable') {
    return {
      ok: false,
      error: loadResult.error,
    };
  }
  if (loadResult.status === 'corrupted') {
    return {
      ok: false,
      error: loadResult.error,
    };
  }

  const remaining = loadResult.designs.filter((d) => d.id !== designId);
  const sorted = sortDesigns(remaining);

  const writeResult = writeDesignStore(
    {
      storageVersion: DESIGN_STORAGE_VERSION,
      designs: sorted,
    },
    storage,
  );

  if (!writeResult.ok) {
    return {
      ok: false,
      error: writeResult.error,
    };
  }

  return {
    ok: true,
    data: sorted,
  };
}

export interface LoadSettingsResult {
  status: 'ok' | 'warning' | 'storage_unavailable';
  settings: PersistedSettings;
  error?: string;
}

/**
 * Loads application persistence settings (e.g. activeDesignId).
 */
export function loadSettings(
  storage: StorageLike | undefined = getDefaultStorage(),
): LoadSettingsResult {
  const defaultSettings: PersistedSettings = {
    storageVersion: SETTINGS_STORAGE_VERSION,
    activeDesignId: null,
  };

  if (!storage) {
    return {
      status: 'storage_unavailable',
      settings: defaultSettings,
      error: 'Browser storage is unavailable.',
    };
  }

  let raw: string | null;
  try {
    raw = storage.getItem(SETTINGS_STORAGE_KEY);
  } catch {
    return {
      status: 'storage_unavailable',
      settings: defaultSettings,
      error: 'Browser storage is unavailable.',
    };
  }

  if (raw === null || raw.trim() === '') {
    return {
      status: 'ok',
      settings: defaultSettings,
    };
  }

  try {
    const parsed = JSON.parse(raw);
    const validation = PersistedSettingsSchema.safeParse(parsed);
    if (validation.success) {
      return {
        status: 'ok',
        settings: validation.data,
      };
    }
    return {
      status: 'warning',
      settings: defaultSettings,
      error: 'Application settings could not be read; using default preferences.',
    };
  } catch {
    return {
      status: 'warning',
      settings: defaultSettings,
      error: 'Application settings were malformed JSON; using default preferences.',
    };
  }
}

/**
 * Writes application persistence settings.
 */
export function writeSettings(
  settings: PersistedSettings,
  storage: StorageLike | undefined = getDefaultStorage(),
): StorageOperationResult {
  if (!storage) {
    return {
      ok: false,
      error: 'Browser storage is unavailable.',
    };
  }

  const validation = PersistedSettingsSchema.safeParse(settings);
  if (!validation.success) {
    return {
      ok: false,
      error: 'Cannot save invalid settings data.',
    };
  }

  try {
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(validation.data));
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: 'Failed to save application settings to browser storage.',
    };
  }
}
