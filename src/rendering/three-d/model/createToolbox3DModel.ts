import type { CalculatedToolboxGeometry } from '../../../domain/geometry';
import type {
  Toolbox3DModel,
  Toolbox3DPartModel,
  BoxPart3D,
  CompoundBoxPart3D,
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
  const G = geometry.box.layout.housingDados.depth;
  const C = geometry.lid.lateralFit.clearancePerSide;

  const stopWall = geometry.box.layout.endWalls.stop;
  const lockingWall = geometry.box.layout.endWalls.locking;
  const stopDados = geometry.box.layout.housingDados.stopEnd;
  const lockingDados = geometry.box.layout.housingDados.lockingEnd;
  const stopHandle = geometry.box.layout.handles.stop;
  const lockingHandle = geometry.box.layout.handles.locking;

  // 1. Bottom board (full footprint X * Y, height 0..bottomT)
  const bottom: BoxPart3D = {
    id: 'bottom',
    part: 'bottom',
    name: 'Bottom Board',
    kind: 'box',
    min: { x: 0, y: 0, z: 0 },
    max: { x: X, y: Y, z: bottomT },
  };

  // 2. Front side (compound part with 5 segments modeling the 2 housing dado recesses)
  const sideFront: CompoundBoxPart3D = {
    id: 'side-front',
    part: 'side-front',
    name: 'Front Side Board',
    kind: 'compound-box',
    solids: [
      {
        min: { x: 0, y: 0, z: bottomT },
        max: { x: stopWall.startX, y: T, z: Z },
      },
      {
        min: { x: stopWall.startX, y: 0, z: bottomT },
        max: { x: stopWall.endX, y: T - G, z: Z },
      },
      {
        min: { x: stopWall.endX, y: 0, z: bottomT },
        max: { x: lockingWall.startX, y: T, z: Z },
      },
      {
        min: { x: lockingWall.startX, y: 0, z: bottomT },
        max: { x: lockingWall.endX, y: T - G, z: Z },
      },
      {
        min: { x: lockingWall.endX, y: 0, z: bottomT },
        max: { x: X, y: T, z: Z },
      },
    ],
  };

  // 3. Back side (compound part with 5 segments modeling the 2 housing dado recesses)
  const sideBack: CompoundBoxPart3D = {
    id: 'side-back',
    part: 'side-back',
    name: 'Back Side Board',
    kind: 'compound-box',
    solids: [
      {
        min: { x: 0, y: Y - T, z: bottomT },
        max: { x: stopWall.startX, y: Y, z: Z },
      },
      {
        min: { x: stopWall.startX, y: Y - T + G, z: bottomT },
        max: { x: stopWall.endX, y: Y, z: Z },
      },
      {
        min: { x: stopWall.endX, y: Y - T, z: bottomT },
        max: { x: lockingWall.startX, y: Y, z: Z },
      },
      {
        min: { x: lockingWall.startX, y: Y - T + G, z: bottomT },
        max: { x: lockingWall.endX, y: Y, z: Z },
      },
      {
        min: { x: lockingWall.endX, y: Y - T, z: bottomT },
        max: { x: X, y: Y, z: Z },
      },
    ],
  };

  // 4. Inset stop end board (enters the side housings by depth G on each side)
  const endStop: BoxPart3D = {
    id: 'end-stop',
    part: 'end-stop',
    name: 'Stop End Board',
    kind: 'box',
    min: { x: stopWall.startX, y: stopDados.frontY.startY, z: bottomT },
    max: { x: stopWall.endX, y: stopDados.backY.endY, z: Z },
  };

  // 5. Inset locking end board (enters the side housings by depth G on each side)
  const endLocking: BoxPart3D = {
    id: 'end-locking',
    part: 'end-locking',
    name: 'Locking End Board',
    kind: 'box',
    min: { x: lockingWall.startX, y: lockingDados.frontY.startY, z: bottomT },
    max: { x: lockingWall.endX, y: lockingDados.backY.endY, z: Z },
  };

  // 6. Stop grab handle
  const handleStop: BoxPart3D = {
    id: 'handle-stop',
    part: 'handle-stop',
    name: 'Stop Grab Handle',
    kind: 'box',
    min: { x: stopHandle.startX, y: stopHandle.startY, z: stopHandle.startZ },
    max: { x: stopHandle.endX, y: stopHandle.endY, z: stopHandle.endZ },
  };

  // 7. Locking grab handle
  const handleLocking: BoxPart3D = {
    id: 'handle-locking',
    part: 'handle-locking',
    name: 'Locking Grab Handle',
    kind: 'box',
    min: { x: lockingHandle.startX, y: lockingHandle.startY, z: lockingHandle.startZ },
    max: { x: lockingHandle.endX, y: lockingHandle.endY, z: lockingHandle.endZ },
  };

  // 8. Stop-end fixed top batten / end cap (X from 0..stopOpeningEdgeX, Y from 0..Y, Z from Z..Z + fixedTopBattenT)
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

  // 9. Locking-end fixed top batten with bevel (polyhedron)
  const lockingFixedTopBatten = createLockingFixedBattenPolyhedron(geometry);

  // 10. Sliding lid panel in locked state (X from locked.panel.startX..locked.panel.endX, centered across Y)
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

  // 11. Straight lid batten in locked state
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

  // 12. Locking lid batten with plan taper and bevel (polyhedron)
  const lockingLidBatten = createLockingBattenPolyhedron(geometry);

  // 13. Captured locking wedge (polyhedron)
  const lockingWedge = createWedgePolyhedron(geometry);

  const parts: Toolbox3DPartModel[] = [
    bottom,
    sideFront,
    sideBack,
    endStop,
    endLocking,
    handleStop,
    handleLocking,
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
    } else if (part.kind === 'compound-box') {
      for (const solid of part.solids) {
        updateBounds(solid.min);
        updateBounds(solid.max);
      }
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
