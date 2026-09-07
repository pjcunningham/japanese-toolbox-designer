import type { CalculatedToolboxGeometry } from '../../../domain/geometry';
import type { PolyhedronPart3D } from '../model/toolbox3DModel';

/**
 * Constructs the captured tapered locking wedge polyhedron.
 *
 * Uses the authoritative bottom plan polygon: geometry.lockingMechanism.wedge.planCorners.
 * At the top face:
 * - Fixed-batten side X moves inward (-X) by H = wedge.bevelOffsetNormalPerSide
 * - Locking-batten side X moves toward wedge interior (+X) by taperedTopInset
 *
 * Produces exact top narrow and wide widths matching authoritative Phase 5 geometry.
 */
export function createWedgePolyhedron(geometry: CalculatedToolboxGeometry): PolyhedronPart3D {
  const bottomZ = geometry.lockingMechanism.vertical.wedgeBottomZ;
  const topZ = geometry.lockingMechanism.vertical.wedgeTopZ;
  const corners = geometry.lockingMechanism.wedge.planCorners;
  const H = geometry.lockingMechanism.wedge.bevelOffsetNormalPerSide;
  const taperedTopInset = geometry.lockingMechanism.capture.topWidthReduction - H;

  const vertices = [
    // Bottom quad: 0..3 (z = bottomZ)
    {
      x: corners.battenMatingNarrowCorner.x,
      y: corners.battenMatingNarrowCorner.y,
      z: bottomZ,
    }, // 0: batten narrow (0)
    {
      x: corners.fixedBattenNarrowCorner.x,
      y: corners.fixedBattenNarrowCorner.y,
      z: bottomZ,
    }, // 1: fixed narrow (0)
    {
      x: corners.fixedBattenWideCorner.x,
      y: corners.fixedBattenWideCorner.y,
      z: bottomZ,
    }, // 2: fixed wide (Y)
    {
      x: corners.battenMatingWideCorner.x,
      y: corners.battenMatingWideCorner.y,
      z: bottomZ,
    }, // 3: batten wide (Y)
    // Top quad: 4..7 (z = topZ)
    {
      x: corners.battenMatingNarrowCorner.x + taperedTopInset,
      y: corners.battenMatingNarrowCorner.y,
      z: topZ,
    }, // 4: top batten narrow
    {
      x: corners.fixedBattenNarrowCorner.x - H,
      y: corners.fixedBattenNarrowCorner.y,
      z: topZ,
    }, // 5: top fixed narrow
    {
      x: corners.fixedBattenWideCorner.x - H,
      y: corners.fixedBattenWideCorner.y,
      z: topZ,
    }, // 6: top fixed wide
    {
      x: corners.battenMatingWideCorner.x + taperedTopInset,
      y: corners.battenMatingWideCorner.y,
      z: topZ,
    }, // 7: top batten wide
  ];

  const faces = [
    [0, 3, 2, 1], // Bottom face (-Z)
    [4, 5, 6, 7], // Top face (+Z)
    [0, 1, 5, 4], // Narrow end (-Y)
    [3, 7, 6, 2], // Wide end (+Y)
    [0, 4, 7, 3], // Batten-facing bevel face (-X)
    [1, 2, 6, 5], // Fixed-batten-facing bevel face (+X)
  ];

  return {
    id: 'locking-wedge',
    part: 'locking-wedge',
    name: 'Locking Wedge',
    kind: 'polyhedron',
    vertices,
    faces,
  };
}
