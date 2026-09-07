import { describe, it, expect } from 'vitest';
import { calculateCameraFitting, DEFAULT_CAMERA_FOV } from './cameraFit';
import type { Toolbox3DBounds } from '../model/toolbox3DModel';

describe('calculateCameraFitting (Requirements 53-60, 73)', () => {
  const defaultBounds: Toolbox3DBounds = {
    min: { x: 0, y: 0, z: 0 },
    max: { x: 600, y: 300, z: 268 },
  };

  it('calculates deterministic perspective camera parameters for default model', () => {
    const fit = calculateCameraFitting(defaultBounds, 'perspective');

    expect(fit.view).toBe('perspective');
    expect(fit.target).toEqual([0, 0, 0]);
    expect(fit.up).toEqual([0, 1, 0]);
    expect(fit.fov).toBe(DEFAULT_CAMERA_FOV);
    expect(fit.distance).toBeGreaterThan(500);
    expect(fit.near).toBeGreaterThan(0);
    expect(fit.far).toBeGreaterThan(fit.distance);

    // Position in perspective should have negative X, positive Y, negative Z in Three coords
    expect(fit.position[0]).toBeLessThan(0);
    expect(fit.position[1]).toBeGreaterThan(0);
    expect(fit.position[2]).toBeLessThan(0);
  });

  it('generates correct standard camera views with appropriate up vectors', () => {
    // Front view: camera at -Z, up = (0, 1, 0)
    const front = calculateCameraFitting(defaultBounds, 'front');
    expect(front.position[0]).toBe(0);
    expect(front.position[1]).toBe(0);
    expect(front.position[2]).toBeCloseTo(-front.distance, 1);
    expect(front.up).toEqual([0, 1, 0]);

    // End view: camera at -X, up = (0, 1, 0)
    const end = calculateCameraFitting(defaultBounds, 'end');
    expect(end.position[0]).toBeCloseTo(-end.distance, 1);
    expect(end.position[1]).toBe(0);
    expect(end.position[2]).toBe(0);
    expect(end.up).toEqual([0, 1, 0]);

    // Top view: camera at +Y, up = (0, 0, 1) (Three Z = Domain Y)
    const top = calculateCameraFitting(defaultBounds, 'top');
    expect(top.position[0]).toBe(0);
    expect(top.position[1]).toBeCloseTo(top.distance, 1);
    expect(top.position[2]).toBe(0);
    expect(top.up).toEqual([0, 0, 1]);
  });

  it('scales camera distance proportionally with model size', () => {
    const smallBounds: Toolbox3DBounds = {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 300, y: 150, z: 120 },
    };
    const longBounds: Toolbox3DBounds = {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 1200, y: 300, z: 268 },
    };
    const tallBounds: Toolbox3DBounds = {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 600, y: 300, z: 800 },
    };

    const defaultFit = calculateCameraFitting(defaultBounds);
    const smallFit = calculateCameraFitting(smallBounds);
    const longFit = calculateCameraFitting(longBounds);
    const tallFit = calculateCameraFitting(tallBounds);

    expect(smallFit.distance).toBeLessThan(defaultFit.distance);
    expect(longFit.distance).toBeGreaterThan(defaultFit.distance);
    expect(tallFit.distance).toBeGreaterThan(defaultFit.distance);

    expect(smallFit.near).toBeGreaterThan(0);
    expect(longFit.near).toBeGreaterThan(0);
    expect(tallFit.near).toBeGreaterThan(0);
  });
});
