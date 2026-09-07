# Japanese Toolbox Design JSON Format

This document specifies the portable JSON interchange file format for Japanese Toolbox Designer.

## Overview

- **One Design Per File:** Each `.json` file contains exactly one logical `ToolboxDesign` object.
- **Inputs Only:** The file stores only the canonical physical design parameters and presentation preferences. No derived geometry, calculated kinematics, or UI editor drafts are persisted.
- **Deterministic Units:** All linear dimensions in the file are strictly expressed in canonical millimetres (as finite positive numbers). Angles are expressed in degrees.
- **ISO 8601 Timestamps:** Creation and update timestamps are serialized as standard UTC ISO 8601 strings.
- **Human-Readable:** Files are serialized with 2-space indentation and end with a newline (`\n`).

## Schema Version

The current schema version is `1`. The `schemaVersion` field is required and validated against `TOOLBOX_DESIGN_SCHEMA_VERSION`.

## Top-Level Fields

| Field                    | Type                     | Description                                            |
| ------------------------ | ------------------------ | ------------------------------------------------------ |
| `id`                     | `string` (UUID)          | Unique identifier for the design.                      |
| `name`                   | `string` (1–100 chars)   | User-visible name of the design.                       |
| `schemaVersion`          | `number` (`1`)           | Version of the serialized design schema.               |
| `createdAt`              | `string` (ISO 8601)      | Timestamp of original creation.                        |
| `updatedAt`              | `string` (ISO 8601)      | Timestamp of last modification.                        |
| `unitSystem`             | `'metric' \| 'imperial'` | Preferred display unit system when opening the design. |
| `dimensions`             | `object`                 | Carcass outer dimensions and stock thickness.          |
| `constructionParameters` | `object`                 | Sliding lid and locking mechanism parameters.          |
| `wood`                   | `object`                 | Wood species identifier.                               |

### `dimensions` Object

All values in canonical millimetres:

- `length`: Outside carcass length ($X$).
- `width`: Outside carcass width ($Y$).
- `height`: Carcass body height ($Z$).
- `stockThickness`: Main timber stock thickness ($T$).

### `constructionParameters` Object

All linear dimensions in canonical millimetres, angles in degrees:

- `lidThickness`: Sliding lid board thickness ($P$).
- `fixedTopBattenWidth`: Width of fixed end battens ($R$).
- `lidBattenWidth`: Width of sliding lid battens ($B$).
- `lidSideClearance`: Lateral clearance per side between lid panel and carcass wall ($C$).
- `desiredOverlap`: Longitudinal engagement per end under fixed battens ($O$).
- `lidBattenOverhang`: Lateral projection of lid battens past lid panel edges ($E$).
- `wedgeTaperAngle`: Plan taper angle in degrees ($\alpha$).
- `wedgeBevelAngle`: Vertical captured bevel angle in degrees ($\beta$).
- `lockingBattenTravelClearance`: Residual gap remaining after full lid shift ($Q$).

### `wood` Object

- `id`: Wood species identifier string (e.g. `"pine"`).

## Example JSON

```json
{
  "id": "e4b27cb0-81f9-4b44-9fa7-3939637cfa90",
  "name": "Workshop Toolbox",
  "schemaVersion": 1,
  "createdAt": "2026-09-07T10:00:00.000Z",
  "updatedAt": "2026-09-07T10:00:00.000Z",
  "unitSystem": "metric",
  "dimensions": {
    "length": 600,
    "width": 300,
    "height": 250,
    "stockThickness": 18
  },
  "constructionParameters": {
    "lidThickness": 18,
    "fixedTopBattenWidth": 54,
    "lidBattenWidth": 45,
    "lidSideClearance": 2,
    "desiredOverlap": 13.5,
    "lidBattenOverhang": 18,
    "wedgeTaperAngle": 2,
    "wedgeBevelAngle": 10,
    "lockingBattenTravelClearance": 1
  },
  "wood": {
    "id": "pine"
  }
}
```

## Import & Identity Conflict Rules

1. **Validation Pipeline:** Import performs structural JSON parse, Zod schema validation, schema version checks, and physical geometry validation before touching application state.
2. **Conflict Resolution:** If an imported design's `id` conflicts with an existing saved or active design, a new unique UUID and fresh timestamps are assigned, preserving all physical inputs and the design name.
3. **Explicit Save:** An imported design is placed in working memory as `Not saved`. It is persisted only when the user explicitly clicks `Save`.
