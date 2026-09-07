# Wood Materials & Species System (Phase 11)

This document describes the browser-local material and wood species catalogue implemented in Phase 11 for the Japanese Toolbox Designer.

---

## 1. Overview & Architecture

The material system allows woodworkers to choose a timber species for their toolbox design. The selection affects the 3D interactive model appearance while maintaining strict physical geometry independence.

### Key Architectural Principles:

1. **Strict Geometry Independence**:
   - Selecting or changing wood species has **no effect** on `CalculatedToolboxGeometry`, `TechnicalDrawingModel`, `Toolbox3DModel` physical coordinates, cut lists, or validation rules.
   - Material selection is purely an appearance and design metadata operation.
2. **No Schema Bump**:
   - Uses the existing domain property `wood: { id: string }` within `ToolboxDesign` (schema version 2).
   - Preserves envelope and localStorage versioning without migration.
3. **Local Bundled Catalogue**:
   - All species definitions are bundled statically into the application.
   - Requires zero network requests, external CDNs, or image asset downloads.
4. **Renderer Neutrality**:
   - The catalogue (`src/materials/woodDefinitions.ts`) consists of plain, immutable TypeScript data structures without Three.js objects.
   - Three.js material resolution occurs lazily at the 3D rendering boundary (`src/rendering/three-d/materials/resolveWoodMaterial.ts`).
5. **No Photographic or Procedural Grain (V1 Scope)**:
   - V1 materials deliberately use subdued approximate colour, roughness, and restrained deterministic part-family differentiation.
   - Photographic texture maps, GLSL procedural grain shaders, and canvas textures are out of scope for V1.

---

## 2. V1 Species Catalogue

The catalogue includes nine stable built-in species:

| ID               | Species Name              | Base Display Colour             | Roughness | Description                                                                                        |
| :--------------- | :------------------------ | :------------------------------ | :-------- | :------------------------------------------------------------------------------------------------- |
| `hinoki`         | Hinoki / Japanese Cypress | `#f0e5cb` (light warm cream)    | `0.72`    | Light, fine-grained sacred softwood with a pale cream tone and soft satin luster.                  |
| `japanese-cedar` | Japanese Cedar (Sugi)     | `#bd7351` (warm reddish tan)    | `0.76`    | Warm reddish-tan softwood traditionally prized for fragrant, lightweight storage chests.           |
| `pine`           | Pine _(Default)_          | `#d2a775` (light yellow/tan)    | `0.75`    | Light yellow-tan traditional utility softwood with balanced grain.                                 |
| `douglas-fir`    | Douglas Fir               | `#c47d48` (warm orange-brown)   | `0.70`    | Warm orange-brown straight-grained structural timber with distinct figure.                         |
| `paulownia`      | Paulownia (Kiri)          | `#dfd5c2` (pale silvery tan)    | `0.82`    | Extremely lightweight, pale silvery-tan timber traditionally used for fine heirloom storage boxes. |
| `ash`            | Ash                       | `#dcd0b8` (pale beige)          | `0.68`    | Pale beige, resilient and tough hardwood with pronounced open grain.                               |
| `oak`            | Oak                       | `#9c6d44` (medium golden brown) | `0.72`    | Medium golden-brown dense hardwood offering high strength and durability.                          |
| `beech`          | Beech                     | `#c89980` (light warm pink/tan) | `0.70`    | Light warm pink-tan hardwood with a close, uniform texture.                                        |
| `custom`         | Other / Custom            | `#c2a688` (neutral wood tone)   | `0.75`    | Neutral medium-light timber tone for custom or unlisted wood species.                              |

### Illustrative Disclaimer

> **Disclaimer:** Material colours and roughness values are approximate visual representations for design identification, not calibrated colour samples of timber. Actual timber appearance varies by individual board, age, finish, lighting, heartwood/sapwood balance, and screen calibration.

---

## 3. Unknown & Forward-Compatible Wood IDs

- If an imported design or persisted envelope contains an unrecognized `wood.id` (e.g. from a future extension), the application does **not** crash or reject the design.
- The design retains its original `wood.id` string in memory and in JSON export.
- The UI displays an `Unknown / Custom (<id>)` state in the selector.
- The 3D renderer applies the fallback `custom` appearance.

---

## 4. 3D Material Resolution & Part Family Differentiation

The material resolver (`resolveWoodMaterial`) maps wood species to Three.js `MeshStandardMaterial` properties with zero metalness (`metalness = 0`):

1. **Carcass, End Walls, Bottom, Battens & Handles**:
   - Render with the base species colour and catalogue roughness.
   - All five segments of each compound dadoed side board receive identical material properties as a single woodworking component.
   - Grab handles share the carcass timber appearance.
2. **Lid Assembly (`lid-panel`, `straight-lid-batten`, `locking-lid-batten`)**:
   - Renders with a subtly lighter (+7% lightness) derivative of the species colour to aid visual distinction during assembly inspection.
3. **Locking Wedge (`locking-wedge`)**:
   - Renders with a subtly deeper (-12% lightness) derivative of the species colour for clear mechanical visibility.
4. **Component Outlines / Edges**:
   - Outlines are deterministically derived from darkened timber tones, ensuring crisp component definition across both very pale woods (e.g. Hinoki) and deeper woods (e.g. Oak).

---

## 5. Persistence & JSON Serialization

- **Persistence**: The selected species is stored directly as `wood.id` in `ToolboxDesign` in localStorage (`jtd.designs.v1`).
- **JSON Interchange**: Serialized JSON includes `"wood": { "id": "..." }`. Renderer-specific RGB/hex colours and roughness are **not** serialized, allowing application visual improvements without altering design files.
