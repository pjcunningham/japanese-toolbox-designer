import type { CalculatedToolboxGeometry } from '../../../domain/geometry';
import type {
  Toolbox3DModel,
  Toolbox3DPartModel,
  BoxPart3D,
  Point3D,
  Toolbox3DBounds,
} from './toolbox3DModel';
import { createLockingFixedBattenPolyhedron } from '../geometry/createLockingFixedBattenGeometry';
import { createLockingBattenPolyhedron } from '../geometry/createLockingBattenGeometry';
import { createWedgePolyhedron } from '../geometry/createWedgeGeometry';

/**
 * Creates the pure, renderer-neutral 3D model representing the physical
 * components of the Japanese toolbox in authoritative domain coordinates:
 *
 * X = toolbox length (0 = stop end, X = locking end)
 * Y = toolbox width (0 = front / narrow wedge end, Y = back / wide wedge end)
 * Z = vertical height (0 = bottom base, Z = carcass height, Z+T = top of battens)
 */
export function createToolbox3DModel(geometry: CalculatedToolboxGeometry): Toolbox3DModel {
  const X = geometry.box.outside.length;
  const Y = geometry.box.outside.width;
  const Z = geometry.box.outside.bodyHeight;
  const T = geometry.box.parts.side.dimensions.thickness;
  const bottomT = geometry.box.parts.bottom.dimensions.thickness;
  const fixedTopBattenT = geometry.box.parts.fixedTopBatten.dimensions.thickness;
  const C = geometry.lid.lateralFit.clearancePerSide;

  // 1. Bottom board (full footprint X * Y, height 0..bottomT)
  const bottom: BoxPart3D = {
    id: 'bottom',
    part: 'bottom',
    name: 'Bottom Board',
    kind: 'box',
    min: { x: 0, y: 0, z: 0 },
    max: { x: X, y: Y, z: bottomT },
  };

  // 2. Front side (runs full X, Y from 0..T, Z from bottomT..Z)
  const sideFront: BoxPart3D = {
    id: 'side-front',
    part: 'side-front',
    name: 'Front Side Board',
    kind: 'box',
    min: { x: 0, y: 0, z: bottomT },
    max: { x: X, y: T, z: Z },
  };

  // 3. Back side (runs full X, Y from Y - T..Y, Z from bottomT..Z)
  const sideBack: BoxPart3D = {
    id: 'side-back',
    part: 'side-back',
    name: 'Back Side Board',
    kind: 'box',
    min: { x: 0, y: Y - T, z: bottomT },
    max: { x: X, y: Y, z: Z },
  };

  // 4. Stop end board (fits between sides: Y from T..Y - T, X from 0..T, Z from bottomT..Z)
  const endStop: BoxPart3D = {
    id: 'end-stop',
    part: 'end-stop',
    name: 'Stop End Board',
    kind: 'box',
    min: { x: 0, y: T, z: bottomT },
    max: { x: T, y: Y - T, z: Z },
  };

  // 5. Locking end board (fits between sides: Y from T..Y - T, X from X - T..X, Z from bottomT..Z)
  const endLocking: BoxPart3D = {
    id: 'end-locking',
    part: 'end-locking',
    name: 'Locking End Board',
    kind: 'box',
    min: { x: X - T, y: T, z: bottomT },
    max: { x: X, y: Y - T, z: Z },
  };

  // 6. Stop-end fixed top batten (X from 0..stopOpeningEdgeX, Y from 0..Y, Z from Z..Z + fixedTopBattenT)
  const stopFixedTopBatten: BoxPart3D = {
    id: 'fixed-top-batten-stop',
    part: 'fixed-top-batten-stop',
    name: 'Stop Fixed Top Batten',
    kind: 'box',
    min: { x: 0, y: 0, z: Z },
    max: {
      x: geometry.lid.openingEdges.stopOpeningEdgeX,
      y: Y,
      z: Z + fixedTopBattenT,
    },
  };

  // 7. Locking-end fixed top batten with bevel (polyhedron)
  const lockingFixedTopBatten = createLockingFixedBattenPolyhedron(geometry);

  // 8. Sliding lid panel in locked state (X from locked.panel.startX..locked.panel.endX, centered across Y)
  const lidPanelStartY = T + C;
  const lidPanelEndY = lidPanelStartY + geometry.lid.panel.dimensions.width;
  const lidPanel: BoxPart3D = {
    id: 'lid-panel',
    part: 'lid-panel',
    name: 'Lid Panel',
    kind: 'box',
    min: {
      x: geometry.lid.states.locked.panel.startX,
      y: lidPanelStartY,
      z: geometry.lid.vertical.lidPanelBottomZ,
    },
    max: {
      x: geometry.lid.states.locked.panel.endX,
      y: lidPanelEndY,
      z: geometry.lid.vertical.lidPanelTopZ,
    },
  };

  // 9. Straight lid batten in locked state
  const straightBattenStartY =
    geometry.lockingMechanism.lockingLidBatten.planCorners.interiorNarrowCorner.y;
  const straightBattenEndY =
    straightBattenStartY + geometry.lid.straightLidBatten.dimensions.length;
  const straightLidBatten: BoxPart3D = {
    id: 'straight-lid-batten',
    part: 'straight-lid-batten',
    name: 'Straight Lid Batten',
    kind: 'box',
    min: {
      x: geometry.lid.states.locked.straightLidBatten.startX,
      y: straightBattenStartY,
      z: geometry.lid.vertical.lidBattenBottomZ,
    },
    max: {
      x: geometry.lid.states.locked.straightLidBatten.endX,
      y: straightBattenEndY,
      z: geometry.lid.vertical.lidBattenTopZ,
    },
  };

  // 10. Locking lid batten with plan taper and bevel (polyhedron)
  const lockingLidBatten = createLockingBattenPolyhedron(geometry);

  // 11. Captured locking wedge (polyhedron)
  const lockingWedge = createWedgePolyhedron(geometry);

  const parts: Toolbox3DPartModel[] = [
    bottom,
    sideFront,
    sideBack,
    endStop,
    endLocking,
    stopFixedTopBatten,
    lockingFixedTopBatten,
    lidPanel,
    straightLidBatten,
    lockingLidBatten,
    lockingWedge,
  ];

  // Calculate comprehensive assembly bounds
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  const updateBounds = (p: Point3D) => {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.z < minZ) minZ = p.z;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
    if (p.z > maxZ) maxZ = p.z;
  };

  for (const part of parts) {
    if (part.kind === 'box') {
      updateBounds(part.min);
      updateBounds(part.max);
    } else {
      for (const vertex of part.vertices) {
        updateBounds(vertex);
      }
    }
  }

  const bounds: Toolbox3DBounds = {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
  };

  return {
    parts,
    bounds,
    metadata: {
      partCount: parts.length,
      length: X,
      width: Y,
      height: Z,
      wedgeWorkingLength: geometry.lockingMechanism.wedge.workingLength,
    },
  };
}
