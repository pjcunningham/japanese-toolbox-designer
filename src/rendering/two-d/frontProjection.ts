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
 * Creates the renderer-neutral Front Elevation technical drawing model.
 *
 * View: Front elevation (looking across Y axis)
 * Horizontal axis: X (left/right, 0 = stop end, X = locking end)
 * Vertical axis: Z (vertical height, 0 = underside of bottom board, Z = body height)
 * Vertical coordinate increases upward.
 */
export function createFrontDrawing(geometry: CalculatedToolboxGeometry): TechnicalDrawingModel {
  const X = geometry.box.outside.length;
  const bodyHeight = geometry.box.outside.bodyHeight;
  const overallHeightWithTopBattens = geometry.box.outside.overallHeightWithTopBattens;
  const Tb = geometry.box.parts.bottom.dimensions.thickness;
  const R = geometry.lid.openingEdges.stopOpeningEdgeX;

  const lidPanelBottomZ = geometry.lid.vertical.lidPanelBottomZ;
  const lidPanelTopZ = geometry.lid.vertical.lidPanelTopZ;
  const lockedPanelStartX = geometry.lid.states.locked.panel.startX;
  const lockedPanelEndX = geometry.lid.states.locked.panel.endX;
  const lidPanelLength = geometry.lid.panel.dimensions.length;

  const straightBattenStartX = geometry.lid.states.locked.straightLidBatten.startX;
  const straightBattenEndX = geometry.lid.states.locked.straightLidBatten.endX;
  const straightBattenWidth = straightBattenEndX - straightBattenStartX;

  const stopWall = geometry.box.layout.endWalls.stop;
  const lockingWall = geometry.box.layout.endWalls.locking;
  const stopHandle = geometry.box.layout.handles.stop;
  const lockingHandle = geometry.box.layout.handles.locking;

  // Rectangles
  const rectangles: DrawingRectangle[] = [
    // 1. Bottom board
    {
      id: 'front-bottom',
      part: 'bottom',
      x: 0,
      y: 0,
      width: X,
      height: Tb,
    },
    // 2. Front side wall (above bottom board up to body height)
    {
      id: 'front-side-wall',
      part: 'side',
      x: 0,
      y: Tb,
      width: X,
      height: bodyHeight - Tb,
    },
    // 3. Hidden grab handles behind front side board
    {
      id: 'front-handle-stop',
      part: 'handle-stop',
      x: stopHandle.startX,
      y: stopHandle.startZ,
      width: stopHandle.endX - stopHandle.startX,
      height: stopHandle.endZ - stopHandle.startZ,
      hidden: true,
    },
    {
      id: 'front-handle-locking',
      part: 'handle-locking',
      x: lockingHandle.startX,
      y: lockingHandle.startZ,
      width: lockingHandle.endX - lockingHandle.startX,
      height: lockingHandle.endZ - lockingHandle.startZ,
      hidden: true,
    },
    // 4. Hidden lid panel
    {
      id: 'front-lid-panel',
      part: 'lid-panel',
      x: lockedPanelStartX,
      y: lidPanelBottomZ,
      width: lidPanelLength,
      height: lidPanelTopZ - lidPanelBottomZ,
      hidden: true,
    },
    // 5. Stop fixed top batten / end cap
    {
      id: 'front-fixed-top-batten-stop',
      part: 'fixed-top-batten-stop',
      x: 0,
      y: bodyHeight,
      width: R,
      height: overallHeightWithTopBattens - bodyHeight,
    },
    // 6. Straight lid batten
    {
      id: 'front-straight-lid-batten',
      part: 'straight-lid-batten',
      x: straightBattenStartX,
      y: bodyHeight,
      width: straightBattenWidth,
      height: overallHeightWithTopBattens - bodyHeight,
    },
  ];

  // Captured wedge cross-section profile at narrow end (front-most Y profile)
  const lockingLidBatten = geometry.lockingMechanism.lockingLidBatten;
  const lockingFixedTopBatten = geometry.lockingMechanism.lockingFixedTopBatten;
  const wedge = geometry.lockingMechanism.wedge;
  const capture = geometry.lockingMechanism.capture;

  const straightFaceTopInset = wedge.bevelOffsetNormalPerSide;
  const taperedFaceTopInset = capture.topWidthReduction - wedge.bevelOffsetNormalPerSide;

  const battenTopZ = overallHeightWithTopBattens;
  const battenBottomZ = bodyHeight;

  const polygons: DrawingPolygon[] = [
    // Locking lid batten with compound bevel face
    {
      id: 'front-locking-lid-batten',
      part: 'locking-lid-batten',
      points: [
        { x: lockingLidBatten.interiorEdgeX, y: battenBottomZ },
        { x: lockingLidBatten.narrowEndWedgeFaceX, y: battenBottomZ },
        { x: lockingLidBatten.narrowEndWedgeFaceX + taperedFaceTopInset, y: battenTopZ },
        { x: lockingLidBatten.interiorEdgeX, y: battenTopZ },
      ],
    },
    // Removable locking wedge (captured trapezoidal cross-section: bottom wider than top)
    {
      id: 'front-locking-wedge',
      part: 'locking-wedge',
      points: [
        { x: lockingLidBatten.narrowEndWedgeFaceX, y: battenBottomZ },
        { x: lockingFixedTopBatten.innerEdgeX, y: battenBottomZ },
        { x: lockingFixedTopBatten.innerEdgeX - straightFaceTopInset, y: battenTopZ },
        { x: lockingLidBatten.narrowEndWedgeFaceX + taperedFaceTopInset, y: battenTopZ },
      ],
    },
    // Locking fixed top batten with complementary bevel face
    {
      id: 'front-fixed-top-batten-locking',
      part: 'fixed-top-batten-locking',
      points: [
        { x: lockingFixedTopBatten.innerEdgeX, y: battenBottomZ },
        { x: X, y: battenBottomZ },
        { x: X, y: battenTopZ },
        { x: lockingFixedTopBatten.innerEdgeX - straightFaceTopInset, y: battenTopZ },
      ],
    },
  ];

  // Lines (Hidden inset end walls, grab handle lines, hidden lid panel edges)
  const lines: DrawingLine[] = [
    // Inset stop end wall (hidden lines through front side board)
    {
      id: 'front-line-end-stop-outside',
      kind: 'hidden',
      part: 'end-wall-stop',
      start: { x: stopWall.outsideFaceX, y: Tb },
      end: { x: stopWall.outsideFaceX, y: bodyHeight },
    },
    {
      id: 'front-line-end-stop-inside',
      kind: 'hidden',
      part: 'end-wall-stop',
      start: { x: stopWall.insideFaceX, y: Tb },
      end: { x: stopWall.insideFaceX, y: bodyHeight },
    },
    // Inset locking end wall (hidden lines through front side board)
    {
      id: 'front-line-end-locking-inside',
      kind: 'hidden',
      part: 'end-wall-locking',
      start: { x: lockingWall.insideFaceX, y: Tb },
      end: { x: lockingWall.insideFaceX, y: bodyHeight },
    },
    {
      id: 'front-line-end-locking-outside',
      kind: 'hidden',
      part: 'end-wall-locking',
      start: { x: lockingWall.outsideFaceX, y: Tb },
      end: { x: lockingWall.outsideFaceX, y: bodyHeight },
    },
    // Stop handle bottom hidden line
    {
      id: 'front-line-handle-stop-bottom',
      kind: 'hidden',
      part: 'handle-stop',
      start: { x: stopHandle.startX, y: stopHandle.startZ },
      end: { x: stopHandle.endX, y: stopHandle.startZ },
    },
    // Locking handle bottom hidden line
    {
      id: 'front-line-handle-locking-bottom',
      kind: 'hidden',
      part: 'handle-locking',
      start: { x: lockingHandle.startX, y: lockingHandle.startZ },
      end: { x: lockingHandle.endX, y: lockingHandle.startZ },
    },
    // Hidden lid panel top & bottom & end edges
    {
      id: 'front-line-lid-top',
      kind: 'hidden',
      part: 'lid-panel',
      start: { x: lockedPanelStartX, y: lidPanelTopZ },
      end: { x: lockedPanelEndX, y: lidPanelTopZ },
    },
    {
      id: 'front-line-lid-bottom',
      kind: 'hidden',
      part: 'lid-panel',
      start: { x: lockedPanelStartX, y: lidPanelBottomZ },
      end: { x: lockedPanelEndX, y: lidPanelBottomZ },
    },
    {
      id: 'front-line-lid-stop-end',
      kind: 'hidden',
      part: 'lid-panel',
      start: { x: lockedPanelStartX, y: lidPanelBottomZ },
      end: { x: lockedPanelStartX, y: lidPanelTopZ },
    },
    {
      id: 'front-line-lid-locking-end',
      kind: 'hidden',
      part: 'lid-panel',
      start: { x: lockedPanelEndX, y: lidPanelBottomZ },
      end: { x: lockedPanelEndX, y: lidPanelTopZ },
    },
    // Joint line between bottom board and side wall
    {
      id: 'front-line-bottom-joint',
      kind: 'visible',
      part: 'body',
      start: { x: 0, y: Tb },
      end: { x: X, y: Tb },
    },
  ];

  // Dimensions
  const dimensions: DrawingDimension[] = [
    // Overall X length (below carcass)
    {
      id: 'front-dim-overall-length',
      axis: 'x',
      start: { x: 0, y: 0 },
      end: { x: X, y: 0 },
      offset: -35,
      valueMillimetres: X,
      label: 'Length X',
    },
    // Body Z height (left of carcass)
    {
      id: 'front-dim-body-height',
      axis: 'y',
      start: { x: 0, y: 0 },
      end: { x: 0, y: bodyHeight },
      offset: -35,
      valueMillimetres: bodyHeight,
      label: 'Body Height',
    },
    // Overall height with top battens (right of carcass)
    {
      id: 'front-dim-overall-height',
      axis: 'y',
      start: { x: X, y: 0 },
      end: { x: X, y: overallHeightWithTopBattens },
      offset: 35,
      valueMillimetres: overallHeightWithTopBattens,
      label: 'Total Height',
    },
    // Handle depth / wall inset I
    {
      id: 'front-dim-inset',
      axis: 'x',
      start: { x: 0, y: bodyHeight },
      end: { x: stopWall.outsideFaceX, y: bodyHeight },
      offset: 18,
      valueMillimetres: stopWall.outsideFaceX,
      label: 'Inset I',
    },
  ];

  // Annotations
  const wedgeMidX = (lockingLidBatten.narrowEndWedgeFaceX + lockingFixedTopBatten.innerEdgeX) / 2;

  const annotations: DrawingAnnotation[] = [
    {
      id: 'front-ann-stop-end',
      position: { x: R / 2, y: overallHeightWithTopBattens + 12 },
      text: 'STOP END',
      align: 'center',
    },
    {
      id: 'front-ann-locking-end',
      position: {
        x: X - (X - lockingFixedTopBatten.innerEdgeX) / 2,
        y: overallHeightWithTopBattens + 28,
      },
      text: 'LOCKING END',
      align: 'center',
    },
    {
      id: 'front-ann-captured-wedge',
      position: { x: wedgeMidX, y: overallHeightWithTopBattens + 12 },
      text: 'Captured wedge',
      secondaryText: `β = ${wedge.bevelAngle}°`,
      align: 'center',
    },
    {
      id: 'front-ann-grab-handle',
      position: {
        x: (stopHandle.startX + stopHandle.endX) / 2,
        y: (stopHandle.startZ + stopHandle.endZ) / 2,
      },
      text: 'Grab handle',
      align: 'center',
    },
    {
      id: 'front-ann-inset-end-wall',
      position: {
        x: (stopWall.startX + stopWall.endX) / 2,
        y: Tb + (bodyHeight - Tb) / 2,
      },
      text: 'Inset end wall',
      align: 'center',
    },
  ];

  // Viewport margin bounds
  const marginX = Math.max(50, X * 0.08);
  const marginZ = Math.max(50, overallHeightWithTopBattens * 0.12);

  const bounds: DrawingBounds = {
    minX: -marginX,
    minY: -marginZ,
    maxX: X + marginX,
    maxY: overallHeightWithTopBattens + marginZ,
  };

  return {
    view: 'front',
    title: 'Front Elevation',
    description: `Front elevation of toolbox (${X} × ${overallHeightWithTopBattens} mm) looking across Y axis showing long side board, bottom board, top battens, and hidden inset end walls and grab handles.`,
    bounds,
    rectangles,
    polygons,
    lines,
    dimensions,
    annotations,
  };
}
