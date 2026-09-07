import type { CalculatedToolboxGeometry } from '../../domain/geometry';
import type {
  TechnicalDrawingModel,
  DrawingBounds,
  DrawingRectangle,
  DrawingPolygon,
  DrawingLine,
  DrawingDimension,
  DrawingAnnotation,
} from './drawingModel';

/**
 * Creates the renderer-neutral Plan View technical drawing model.
 *
 * View: Plan (looking downward along Z axis)
 * Horizontal axis: X (left/right, 0 = stop end, X = locking end)
 * Vertical axis: Y (toolbox width, 0 = narrow wedge end / front, Y = wide wedge end / back)
 * Vertical coordinate increases upward.
 */
export function createPlanDrawing(geometry: CalculatedToolboxGeometry): TechnicalDrawingModel {
  const X = geometry.box.outside.length;
  const Y = geometry.box.outside.width;
  const T = geometry.box.parts.side.dimensions.thickness;
  const C = geometry.lid.lateralFit.clearancePerSide;
  const R = geometry.lid.openingEdges.stopOpeningEdgeX;
  const lockingOpeningEdgeX = geometry.lid.openingEdges.lockingOpeningEdgeX;

  // Lid panel Y start and width
  const lidPanelStartY = T + C;
  const lidPanelWidth = geometry.lid.panel.dimensions.width;
  const lidPanelLength = geometry.lid.panel.dimensions.length;
  const lockedPanelStartX = geometry.lid.states.locked.panel.startX;
  const lockedPanelEndX = geometry.lid.states.locked.panel.endX;

  // Straight lid batten
  const straightBattenStartX = geometry.lid.states.locked.straightLidBatten.startX;
  const straightBattenEndX = geometry.lid.states.locked.straightLidBatten.endX;
  const straightBattenWidth = straightBattenEndX - straightBattenStartX;
  const straightBattenLength = geometry.lid.straightLidBatten.dimensions.length;
  const straightBattenStartY =
    geometry.lockingMechanism.lockingLidBatten.planCorners.interiorNarrowCorner.y;

  // Inset end walls coordinates
  const stopWall = geometry.box.layout.endWalls.stop;
  const lockingWall = geometry.box.layout.endWalls.locking;
  const stopDados = geometry.box.layout.housingDados.stopEnd;
  const lockingDados = geometry.box.layout.housingDados.lockingEnd;
  const stopHandle = geometry.box.layout.handles.stop;
  const lockingHandle = geometry.box.layout.handles.locking;

  // Rectangles
  const rectangles: DrawingRectangle[] = [
    // 1. Carcass body footprint
    {
      id: 'plan-body',
      part: 'body',
      x: 0,
      y: 0,
      width: X,
      height: Y,
    },
    // 2. Inset end walls (hidden under end caps / lid)
    {
      id: 'plan-end-wall-stop',
      part: 'end-wall-stop',
      x: stopWall.startX,
      y: stopDados.frontY.startY,
      width: stopWall.endX - stopWall.startX,
      height: stopDados.backY.endY - stopDados.frontY.startY,
      hidden: true,
    },
    {
      id: 'plan-end-wall-locking',
      part: 'end-wall-locking',
      x: lockingWall.startX,
      y: lockingDados.frontY.startY,
      width: lockingWall.endX - lockingWall.startX,
      height: lockingDados.backY.endY - lockingDados.frontY.startY,
      hidden: true,
    },
    // 3. Grab handles (hidden under end caps)
    {
      id: 'plan-handle-stop',
      part: 'handle-stop',
      x: stopHandle.startX,
      y: stopHandle.startY,
      width: stopHandle.endX - stopHandle.startX,
      height: stopHandle.endY - stopHandle.startY,
      hidden: true,
    },
    {
      id: 'plan-handle-locking',
      part: 'handle-locking',
      x: lockingHandle.startX,
      y: lockingHandle.startY,
      width: lockingHandle.endX - lockingHandle.startX,
      height: lockingHandle.endY - lockingHandle.startY,
      hidden: true,
    },
    // 4. Housing dados (4 recessed regions in side walls)
    {
      id: 'plan-housing-dado-stop-front',
      part: 'housing-dado',
      x: stopDados.startX,
      y: stopDados.frontY.startY,
      width: stopDados.endX - stopDados.startX,
      height: stopDados.frontY.endY - stopDados.frontY.startY,
      hidden: true,
    },
    {
      id: 'plan-housing-dado-stop-back',
      part: 'housing-dado',
      x: stopDados.startX,
      y: stopDados.backY.startY,
      width: stopDados.endX - stopDados.startX,
      height: stopDados.backY.endY - stopDados.backY.startY,
      hidden: true,
    },
    {
      id: 'plan-housing-dado-locking-front',
      part: 'housing-dado',
      x: lockingDados.startX,
      y: lockingDados.frontY.startY,
      width: lockingDados.endX - lockingDados.startX,
      height: lockingDados.frontY.endY - lockingDados.frontY.startY,
      hidden: true,
    },
    {
      id: 'plan-housing-dado-locking-back',
      part: 'housing-dado',
      x: lockingDados.startX,
      y: lockingDados.backY.startY,
      width: lockingDados.endX - lockingDados.startX,
      height: lockingDados.backY.endY - lockingDados.backY.startY,
      hidden: true,
    },
    // 5. Locked lid panel
    {
      id: 'plan-lid-panel',
      part: 'lid-panel',
      x: lockedPanelStartX,
      y: lidPanelStartY,
      width: lidPanelLength,
      height: lidPanelWidth,
    },
    // 6. Straight lid batten
    {
      id: 'plan-straight-lid-batten',
      part: 'straight-lid-batten',
      x: straightBattenStartX,
      y: straightBattenStartY,
      width: straightBattenWidth,
      height: straightBattenLength,
    },
    // 7. Stop fixed top batten / end cap
    {
      id: 'plan-fixed-top-batten-stop',
      part: 'fixed-top-batten-stop',
      x: 0,
      y: 0,
      width: R,
      height: Y,
    },
    // 8. Locking fixed top batten / end cap
    {
      id: 'plan-fixed-top-batten-locking',
      part: 'fixed-top-batten-locking',
      x: lockingOpeningEdgeX,
      y: 0,
      width: X - lockingOpeningEdgeX,
      height: Y,
    },
  ];

  // Polygons (Locking batten and wedge use exact Phase 5 planCorners)
  const lockingBattenCorners = geometry.lockingMechanism.lockingLidBatten.planCorners;
  const wedgeCorners = geometry.lockingMechanism.wedge.planCorners;

  const polygons: DrawingPolygon[] = [
    // Tapered locking lid batten
    {
      id: 'plan-locking-lid-batten',
      part: 'locking-lid-batten',
      points: [
        lockingBattenCorners.interiorNarrowCorner,
        lockingBattenCorners.wedgeNarrowCorner,
        lockingBattenCorners.wedgeWideCorner,
        lockingBattenCorners.interiorWideCorner,
      ],
    },
    // Removable locking wedge
    {
      id: 'plan-locking-wedge',
      part: 'locking-wedge',
      points: [
        wedgeCorners.battenMatingNarrowCorner,
        wedgeCorners.fixedBattenNarrowCorner,
        wedgeCorners.fixedBattenWideCorner,
        wedgeCorners.battenMatingWideCorner,
      ],
    },
  ];

  // Lines (Hidden edges of lid panel under fixed top battens, and inside body wall edges)
  const lines: DrawingLine[] = [
    // Stop end hidden lid panel edge
    {
      id: 'plan-lid-hidden-stop-end',
      kind: 'hidden',
      part: 'lid-panel',
      start: { x: lockedPanelStartX, y: lidPanelStartY },
      end: { x: lockedPanelStartX, y: lidPanelStartY + lidPanelWidth },
    },
    // Locking end hidden lid panel edge
    {
      id: 'plan-lid-hidden-locking-end',
      kind: 'hidden',
      part: 'lid-panel',
      start: { x: lockedPanelEndX, y: lidPanelStartY },
      end: { x: lockedPanelEndX, y: lidPanelStartY + lidPanelWidth },
    },
    // Internal side wall lines (for technical clarity)
    {
      id: 'plan-inner-wall-bottom',
      kind: 'construction',
      part: 'wall',
      start: { x: T, y: T },
      end: { x: X - T, y: T },
    },
    {
      id: 'plan-inner-wall-top',
      kind: 'construction',
      part: 'wall',
      start: { x: T, y: Y - T },
      end: { x: X - T, y: Y - T },
    },
  ];

  // Dimensions
  const dimensions: DrawingDimension[] = [
    // Overall X length (below carcass)
    {
      id: 'plan-dim-overall-length',
      axis: 'x',
      start: { x: 0, y: 0 },
      end: { x: X, y: 0 },
      offset: -35,
      valueMillimetres: X,
      label: 'Length X',
    },
    // Overall Y width (left of carcass)
    {
      id: 'plan-dim-overall-width',
      axis: 'y',
      start: { x: 0, y: 0 },
      end: { x: 0, y: Y },
      offset: -35,
      valueMillimetres: Y,
      label: 'Width Y',
    },
    // Clear top opening length (above carcass)
    {
      id: 'plan-dim-opening-length',
      axis: 'x',
      start: { x: R, y: Y },
      end: { x: lockingOpeningEdgeX, y: Y },
      offset: 35,
      valueMillimetres: lockingOpeningEdgeX - R,
      label: 'Top Opening',
    },
    // Stop-end locked overlap O (between locked panel start and stop batten inner edge R)
    {
      id: 'plan-dim-overlap',
      axis: 'x',
      start: { x: lockedPanelStartX, y: 0 },
      end: { x: R, y: 0 },
      offset: -18,
      valueMillimetres: geometry.lid.longitudinalFit.lockedOverlapPerEnd,
      label: 'Overlap O',
    },
    // End wall inset / handle depth I
    {
      id: 'plan-dim-inset',
      axis: 'x',
      start: { x: 0, y: Y },
      end: { x: stopWall.outsideFaceX, y: Y },
      offset: 18,
      valueMillimetres: stopWall.outsideFaceX,
      label: 'Inset I',
    },
    // Fixed top batten interior projection (Pocket depth)
    {
      id: 'plan-dim-pocket-depth',
      axis: 'x',
      start: { x: stopWall.insideFaceX, y: Y },
      end: { x: R, y: Y },
      offset: 18,
      valueMillimetres: geometry.box.topOpening.battenInteriorProjection,
      label: 'Pocket',
    },
    // Housing dado depth G
    {
      id: 'plan-dim-dado-depth',
      axis: 'y',
      start: { x: stopWall.startX, y: stopDados.frontY.startY },
      end: { x: stopWall.startX, y: stopDados.frontY.endY },
      offset: -18,
      valueMillimetres: geometry.box.layout.housingDados.depth,
      label: 'Dado G',
    },
  ];

  // Annotations
  const annotations: DrawingAnnotation[] = [
    {
      id: 'plan-ann-stop-end',
      position: { x: R / 2, y: Y + 12 },
      text: 'STOP END',
      align: 'center',
    },
    {
      id: 'plan-ann-locking-end',
      position: { x: X - (X - lockingOpeningEdgeX) / 2, y: Y + 12 },
      text: 'LOCKING END',
      align: 'center',
    },
    {
      id: 'plan-ann-lid-release',
      position: { x: X / 2, y: Y + 12 },
      text: 'Lid release +X →',
      align: 'center',
    },
    {
      id: 'plan-ann-wedge-insertion',
      position: {
        x: (geometry.lockingMechanism.lockingLidBatten.interiorEdgeX + X) / 2,
        y: -14,
      },
      text: `Wedge insertion ${geometry.lockingMechanism.wedge.insertionDirection} ↑`,
      align: 'center',
    },
    {
      id: 'plan-ann-wedge-taper',
      position: {
        x: geometry.lockingMechanism.lockingLidBatten.interiorEdgeX - 10,
        y: Y / 2,
      },
      text: `α = ${geometry.lockingMechanism.wedge.taperAngle}°`,
      align: 'right',
    },
    {
      id: 'plan-ann-inset-end-wall',
      position: {
        x: (stopWall.startX + stopWall.endX) / 2,
        y: -14,
      },
      text: 'Inset housed end wall',
      align: 'center',
    },
    {
      id: 'plan-ann-grab-handle',
      position: {
        x: (stopHandle.startX + stopHandle.endX) / 2,
        y: Y / 2,
      },
      text: 'Grab handle below end cap',
      align: 'center',
    },
  ];

  // Viewport margin bounds
  const marginX = Math.max(50, X * 0.08);
  const marginY = Math.max(50, Y * 0.08);

  const bounds: DrawingBounds = {
    minX: -marginX,
    minY: -marginY,
    maxX: X + marginX,
    maxY: Y + marginY,
  };

  return {
    view: 'plan',
    title: 'Plan View',
    description: `Plan view of toolbox (${X} × ${Y} mm) looking downward along Z axis showing sliding lid and wedge locking mechanism, inset end walls, grab handles, and housing dados.`,
    bounds,
    rectangles,
    polygons,
    lines,
    dimensions,
    annotations,
  };
}
