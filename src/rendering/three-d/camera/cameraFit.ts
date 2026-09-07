import type { Toolbox3DBounds } from '../model/toolbox3DModel';

export type StandardCameraView = 'perspective' | 'front' | 'end' | 'top';

export interface CameraFittingResult {
  view: StandardCameraView;
  position: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
  fov: number;
  near: number;
  far: number;
  distance: number;
  radius: number;
  center: [number, number, number]; // in Three.js coordinates
}

export const DEFAULT_CAMERA_FOV = 40;

/**
 * Calculates deterministic perspective camera parameters and positions
 * for the standard views given model bounds in authoritative domain coordinates.
 *
 * In Three.js world coordinates (centered at origin):
 * - Three X = Domain X - centerX
 * - Three Y = Domain Z - centerZ (vertical)
 * - Three Z = Domain Y - centerY (depth)
 */
export function calculateCameraFitting(
  bounds: Toolbox3DBounds,
  view: StandardCameraView = 'perspective',
  fov: number = DEFAULT_CAMERA_FOV,
): CameraFittingResult {
  const sizeX = Math.max(1, bounds.max.x - bounds.min.x);
  const sizeY = Math.max(1, bounds.max.y - bounds.min.y);
  const sizeZ = Math.max(1, bounds.max.z - bounds.min.z);

  // In Three.js: dx = sizeX, dy = sizeZ (vertical), dz = sizeY (depth)
  const dx = sizeX;
  const dy = sizeZ;
  const dz = sizeY;

  const radius = 0.5 * Math.sqrt(dx * dx + dy * dy + dz * dz);
  const fovRad = (fov * Math.PI) / 180;
  const distance = Math.max(10, (radius / Math.sin(fovRad / 2)) * 1.25);

  const near = Math.max(1, Math.round(distance - radius * 2.5));
  const far = Math.max(100, Math.round(distance + radius * 6));

  const target: [number, number, number] = [0, 0, 0];
  let position: [number, number, number];
  let up: [number, number, number] = [0, 1, 0];

  switch (view) {
    case 'perspective': {
      // Three-quarter view looking from stop end / front side (-X, -Z, +Y in Three)
      // Normal vector approx (-1.1, 0.9, -1.2) normalized
      const dirX = -1.1;
      const dirY = 0.9;
      const dirZ = -1.2;
      const len = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
      position = [(dirX / len) * distance, (dirY / len) * distance, (dirZ / len) * distance];
      up = [0, 1, 0];
      break;
    }
    case 'front': {
      // Looking along Domain +Y (front to back): camera at -Z in Three.js
      position = [0, 0, -distance];
      up = [0, 1, 0];
      break;
    }
    case 'end': {
      // Looking along Domain +X (stop end to locking end): camera at -X in Three.js
      position = [-distance, 0, 0];
      up = [0, 1, 0];
      break;
    }
    case 'top': {
      // Looking downward along Domain +Z: camera at +Y in Three.js
      // Up along Three +Z (Domain +Y) so Domain +X is right, Domain +Y is up
      position = [0, distance, 0];
      up = [0, 0, 1];
      break;
    }
  }

  return {
    view,
    position,
    target,
    up,
    fov,
    near,
    far,
    distance,
    radius,
    center: [0, 0, 0],
  };
}
