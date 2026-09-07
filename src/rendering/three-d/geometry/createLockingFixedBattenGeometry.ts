import type { CalculatedToolboxGeometry } from '../../../domain/geometry';
import type { PolyhedronPart3D } from '../model/toolbox3DModel';

/**
 * Constructs the locking fixed top batten polyhedron.
 *
 * It is rectangular in plan over 0..Y, with its outer end at x = X being vertical.
 * Its inner edge is bevelled according to authoritative lockingFixedTopBatten parameters:
 * - Bottom inner edge X = lockingFixedTopBatten.innerEdgeX (F)
 * - Top inner edge X = F - lockingFixedTopBatten.bevelOffsetNormal (F - H)
 */
export function createLockingFixedBattenPolyhedron(
  geometry: CalculatedToolboxGeometry,
): PolyhedronPart3D {
  const X = geometry.box.outside.length;
  const Y = geometry.box.outside.width;
  const Z = geometry.box.outside.bodyHeight;
  const battenThickness = geometry.box.parts.fixedTopBatten.dimensions.thickness;
  const bottomZ = Z;
  const topZ = Z + battenThickness;

  const F = geometry.lockingMechanism.lockingFixedTopBatten.innerEdgeX;
  const H = geometry.lockingMechanism.lockingFixedTopBatten.bevelOffsetNormal;

  const vertices = [
    // Bottom quad: 0..3 (z = bottomZ)
    { x: F, y: 0, z: bottomZ }, // 0: inner front
    { x: X, y: 0, z: bottomZ }, // 1: outer front
    { x: X, y: Y, z: bottomZ }, // 2: outer back
    { x: F, y: Y, z: bottomZ }, // 3: inner back
    // Top quad: 4..7 (z = topZ)
    { x: F - H, y: 0, z: topZ }, // 4: inner front top
    { x: X, y: 0, z: topZ }, // 5: outer front top
    { x: X, y: Y, z: topZ }, // 6: outer back top
    { x: F - H, y: Y, z: topZ }, // 7: inner back top
  ];

  const faces = [
    [0, 3, 2, 1], // Bottom face (-Z)
    [4, 5, 6, 7], // Top face (+Z)
    [0, 1, 5, 4], // Front face (-Y)
    [3, 7, 6, 2], // Back face (+Y)
    [1, 2, 6, 5], // Outer face (+X)
    [0, 4, 7, 3], // Inner bevel face (-X)
  ];

  return {
    id: 'fixed-top-batten-locking',
    part: 'fixed-top-batten-locking',
    name: 'Locking Fixed Top Batten',
    kind: 'polyhedron',
    vertices,
    faces,
  };
}
