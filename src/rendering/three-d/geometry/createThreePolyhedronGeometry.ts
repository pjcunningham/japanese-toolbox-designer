import * as THREE from 'three';
import type { PolyhedronPart3D, Point3D } from '../model/toolbox3DModel';

/**
 * Converts a pure PolyhedronPart3D into a Three.js BufferGeometry.
 *
 * Coordinate mapping:
 * - Three X = Domain X - centerX
 * - Three Y = Domain Z - centerZ (vertical)
 * - Three Z = Domain Y - centerY (depth)
 *
 * Face triangulation preserves outward-pointing normals under the Y-Z axis swap.
 */
export function createThreePolyhedronGeometry(
  poly: PolyhedronPart3D,
  center: Point3D = { x: 0, y: 0, z: 0 },
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  // 1. Convert vertices to Three.js coordinate system centered at origin
  const positions: number[] = [];
  for (const v of poly.vertices) {
    const x3 = v.x - center.x;
    const y3 = v.z - center.z; // Domain Z -> Three Y
    const z3 = v.y - center.y; // Domain Y -> Three Z
    positions.push(x3, y3, z3);
  }

  // 2. Triangulate faces
  const indices: number[] = [];
  for (const face of poly.faces) {
    if (face.length < 3) continue;

    // Fan triangulation with inverted winding to account for Y-Z swap
    for (let i = 1; i < face.length - 1; i++) {
      const idx0 = face[0];
      const idx1 = face[i + 1];
      const idx2 = face[i];
      if (idx0 !== undefined && idx1 !== undefined && idx2 !== undefined) {
        indices.push(idx0, idx1, idx2);
      }
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}
