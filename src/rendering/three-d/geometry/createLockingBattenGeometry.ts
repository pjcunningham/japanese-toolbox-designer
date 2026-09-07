import type { CalculatedToolboxGeometry } from '../../../domain/geometry';
import type { PolyhedronPart3D } from '../model/toolbox3DModel';

/**
 * Constructs the tapered and bevelled locking lid batten polyhedron.
 *
 * Bottom face corresponds to authoritative planCorners at lockingBattenBottomZ.
 * Top face moves the wedge-facing edge towards the wedge (+X) by taperedTopInset:
 * taperedTopInset = capture.topWidthReduction - wedge.bevelOffsetNormalPerSide
 * The interior-facing edge remains at interiorEdgeX.
 */
export function createLockingBattenPolyhedron(
  geometry: CalculatedToolboxGeometry,
): PolyhedronPart3D {
  const bottomZ = geometry.lockingMechanism.vertical.lockingBattenBottomZ;
  const topZ = geometry.lockingMechanism.vertical.lockingBattenTopZ;
  const corners = geometry.lockingMechanism.lockingLidBatten.planCorners;
  const interiorEdgeX = geometry.lockingMechanism.lockingLidBatten.interiorEdgeX;
  const narrowFaceX = corners.wedgeNarrowCorner.x;
  const wideFaceX = corners.wedgeWideCorner.x;
  const yNarrow = corners.interiorNarrowCorner.y;
  const yWide = corners.interiorWideCorner.y;

  const taperedTopInset =
    geometry.lockingMechanism.capture.topWidthReduction -
    geometry.lockingMechanism.wedge.bevelOffsetNormalPerSide;

  const vertices = [
    // Bottom quad: 0..3 (z = bottomZ)
    { x: interiorEdgeX, y: yNarrow, z: bottomZ }, // 0: interior narrow
    { x: narrowFaceX, y: yNarrow, z: bottomZ }, // 1: wedge narrow
    { x: wideFaceX, y: yWide, z: bottomZ }, // 2: wedge wide
    { x: interiorEdgeX, y: yWide, z: bottomZ }, // 3: interior wide
    // Top quad: 4..7 (z = topZ)
    { x: interiorEdgeX, y: yNarrow, z: topZ }, // 4: top interior narrow
    { x: narrowFaceX + taperedTopInset, y: yNarrow, z: topZ }, // 5: top wedge narrow
    { x: wideFaceX + taperedTopInset, y: yWide, z: topZ }, // 6: top wedge wide
    { x: interiorEdgeX, y: yWide, z: topZ }, // 7: top interior wide
  ];

  const faces = [
    [0, 3, 2, 1], // Bottom face (-Z)
    [4, 5, 6, 7], // Top face (+Z)
    [0, 1, 5, 4], // Narrow end (-Y)
    [3, 7, 6, 2], // Wide end (+Y)
    [0, 4, 7, 3], // Interior face (-X)
    [1, 2, 6, 5], // Wedge bevel face (+X)
  ];

  return {
    id: 'locking-lid-batten',
    part: 'locking-lid-batten',
    name: 'Locking Lid Batten',
    kind: 'polyhedron',
    vertices,
    faces,
  };
}
