import {
  type ToolboxDesign,
  TOOLBOX_DESIGN_SCHEMA_VERSION,
  calculateToolboxGeometry,
} from '../domain';
import {
  ToolboxDesignSchema,
  ToolboxDesignV1Schema,
  migrateToolboxDesignV1ToV2,
} from '../persistence';

export const MAX_DESIGN_FILE_SIZE_BYTES = 1024 * 1024; // 1 MiB
export const DEFAULT_EXPORT_FILENAME = 'japanese-toolbox-design.json';

export type JsonExportErrorCode = 'INVALID_DESIGN_SCHEMA' | 'INVALID_GEOMETRY';

export interface JsonExportSuccess {
  ok: true;
  json: string;
  filename: string;
  design: ToolboxDesign;
}

export interface JsonExportFailure {
  ok: false;
  code: JsonExportErrorCode;
  error: string;
  details?: string[];
}

export type JsonExportResult = JsonExportSuccess | JsonExportFailure;

export type JsonImportErrorCode =
  | 'MALFORMED_JSON'
  | 'INVALID_DESIGN_SCHEMA'
  | 'UNSUPPORTED_DESIGN_VERSION'
  | 'INVALID_GEOMETRY'
  | 'FILE_TOO_LARGE'
  | 'FILE_READ_FAILED';

export interface JsonImportSuccess {
  ok: true;
  design: ToolboxDesign;
  migratedFromVersion?: number;
}

export interface JsonImportFailure {
  ok: false;
  code: JsonImportErrorCode;
  error: string;
  details?: string[];
}

export type JsonImportResult = JsonImportSuccess | JsonImportFailure;

/**
 * Generates a clean, filesystem-safe filename for an exported design.
 * Rules:
 * - Lowercase
 * - Spaces converted to hyphens
 * - Unsafe characters removed
 * - Consecutive hyphens collapsed
 * - Leading/trailing hyphens trimmed
 * - Always ends in `.json`
 * - Falls back to DEFAULT_EXPORT_FILENAME if empty
 */
export function generateDesignFilename(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug ? `${slug}.json` : DEFAULT_EXPORT_FILENAME;
}

/**
 * Pure function to serialize a ToolboxDesign into formatted JSON.
 * Validates against both the authoritative Zod schema and physical geometry rules.
 * Does NOT mutate the input design or alter timestamps.
 */
export function serializeToolboxDesign(design: ToolboxDesign): JsonExportResult {
  const schemaResult = ToolboxDesignSchema.safeParse(design);
  if (!schemaResult.success) {
    return {
      ok: false,
      code: 'INVALID_DESIGN_SCHEMA',
      error: 'Design does not conform to the required schema.',
      details: schemaResult.error.issues.map((i) => i.message),
    };
  }

  const geometryResult = calculateToolboxGeometry(design);
  if (!geometryResult.ok) {
    return {
      ok: false,
      code: 'INVALID_GEOMETRY',
      error: 'Cannot export design with invalid physical geometry.',
      details: geometryResult.errors.map((e) => e.message),
    };
  }

  const json = JSON.stringify(design, null, 2) + '\n';
  const filename = generateDesignFilename(design.name);

  return {
    ok: true,
    json,
    filename,
    design,
  };
}

/**
 * Pure function to parse and validate a ToolboxDesign JSON string.
 * Validates JSON structure, Zod schema, schema version, and physical geometry.
 * Preserves fractional millimetre numbers exactly as parsed.
 */
export function parseToolboxDesignJson(jsonText: string): JsonImportResult {
  if (typeof jsonText !== 'string') {
    return {
      ok: false,
      code: 'MALFORMED_JSON',
      error: 'Import input must be a JSON string.',
    };
  }

  // Defensively check size
  if (jsonText.length > MAX_DESIGN_FILE_SIZE_BYTES) {
    return {
      ok: false,
      code: 'FILE_TOO_LARGE',
      error: 'The selected file is too large to be a Japanese Toolbox Designer file.',
    };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch {
    return {
      ok: false,
      code: 'MALFORMED_JSON',
      error: 'The file contains invalid or unparseable JSON.',
    };
  }

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return {
      ok: false,
      code: 'INVALID_DESIGN_SCHEMA',
      error: 'The file does not contain a valid Japanese Toolbox design object.',
    };
  }

  // Check for localStorage envelopes or other envelopes
  const rawObj = raw as Record<string, unknown>;
  if ('storageVersion' in rawObj && 'designs' in rawObj) {
    return {
      ok: false,
      code: 'INVALID_DESIGN_SCHEMA',
      error:
        'The selected file is a storage backup envelope, not a single Japanese Toolbox design.',
    };
  }

  // Check version explicitly for clearer error message
  if (
    'schemaVersion' in rawObj &&
    typeof rawObj.schemaVersion === 'number' &&
    rawObj.schemaVersion > TOOLBOX_DESIGN_SCHEMA_VERSION
  ) {
    return {
      ok: false,
      code: 'UNSUPPORTED_DESIGN_VERSION',
      error: `The design was created with an unsupported schema version (${rawObj.schemaVersion}). Expected version ${TOOLBOX_DESIGN_SCHEMA_VERSION}.`,
    };
  }

  const version = rawObj.schemaVersion;
  let designToValidate: ToolboxDesign;
  let migratedFromVersion: number | undefined;

  if (version === 1) {
    const v1ParseResult = ToolboxDesignV1Schema.safeParse(raw);
    if (!v1ParseResult.success) {
      return {
        ok: false,
        code: 'INVALID_DESIGN_SCHEMA',
        error: 'The file does not conform to the Japanese Toolbox schema version 1.',
        details: v1ParseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      };
    }
    designToValidate = migrateToolboxDesignV1ToV2(v1ParseResult.data);
    migratedFromVersion = 1;
  } else {
    const parseResult = ToolboxDesignSchema.safeParse(raw);
    if (!parseResult.success) {
      const versionIssue = parseResult.error.issues.find((i) => i.path[0] === 'schemaVersion');
      if (versionIssue) {
        return {
          ok: false,
          code: 'UNSUPPORTED_DESIGN_VERSION',
          error: versionIssue.message,
        };
      }

      return {
        ok: false,
        code: 'INVALID_DESIGN_SCHEMA',
        error: 'The file does not conform to the Japanese Toolbox design schema.',
        details: parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      };
    }
    designToValidate = parseResult.data;
  }

  const geometryResult = calculateToolboxGeometry(designToValidate);
  if (!geometryResult.ok) {
    return {
      ok: false,
      code: 'INVALID_GEOMETRY',
      error: 'The design contains physically invalid geometry and cannot be imported.',
      details: geometryResult.errors.map((e) => e.message),
    };
  }

  return {
    ok: true,
    design: designToValidate,
    ...(migratedFromVersion !== undefined ? { migratedFromVersion } : {}),
  };
}

export interface MakeImportedDesignUniqueOptions {
  idGenerator?: () => string;
  timestampGenerator?: () => string;
}

export interface UniqueImportResult {
  design: ToolboxDesign;
  wasConflict: boolean;
}

function defaultIdGenerator(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Checks if an imported design ID conflicts with existing design IDs.
 * If a conflict exists, generates a fresh unique ID and new timestamps while preserving
 * the design name, unit system, wood, and physical parameters.
 * If no conflict exists, preserves the original ID and timestamps.
 */
export function makeImportedDesignUnique(
  importedDesign: ToolboxDesign,
  existingIds: string[] | Set<string>,
  options?: MakeImportedDesignUniqueOptions,
): UniqueImportResult {
  const ids = existingIds instanceof Set ? existingIds : new Set(existingIds);
  const isConflict = ids.has(importedDesign.id);

  if (!isConflict) {
    return {
      design: importedDesign,
      wasConflict: false,
    };
  }

  const generateId = options?.idGenerator ?? defaultIdGenerator;
  const generateTimestamp = options?.timestampGenerator ?? (() => new Date().toISOString());
  const now = generateTimestamp();

  return {
    design: {
      ...importedDesign,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    },
    wasConflict: true,
  };
}

/**
 * Triggers a browser file download for a JSON string without external dependencies.
 */
export function downloadDesignFile(jsonContent: string, filename: string): void {
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Reads the text content of a selected File with size validation.
 */
export async function readDesignFile(file: File): Promise<string> {
  if (file.size > MAX_DESIGN_FILE_SIZE_BYTES) {
    throw new Error('The selected file is too large to be a Japanese Toolbox Designer file.');
  }
  return await file.text();
}
