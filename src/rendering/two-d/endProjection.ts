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
 * Creates the renderer-neutral End Elevation technical drawing model.
 *
 * View: End elevation (looking along X axis)
 * Horizontal axis: Y (toolbox width, 0 = front / side wall 1, Y = back / side wall 2)
 * Vertical axis: Z (vertical height, 0 = underside of bottom board, Z = body height)
 * Vertical coordinate increases upward.
 */
export function createEndDrawing(geometry: CalculatedToolboxGeometry): TechnicalDrawingModel {
  const Y = geometry.box.outside.width;
  const bodyHeight = geometry.box.outside.bodyHeight;
  const overallHeightWithTopBattens = geometry.box.outside.overallHeightWithTopBattens;
  const T = geometry.box.parts.side.dimensions.thickness;
  const Tb = geometry.box.parts.bottom.dimensions.thickness;
  const G = geometry.box.layout.housingDados.depth;
  const C = geometry.lid.lateralFit.clearancePerSide;

  const lidPanelBottomZ = geometry.lid.vertical.lidPanelBottomZ;
  const lidPanelTopZ = geometry.lid.vertical.lidPanelTopZ;
  const lidPanelWidth = geometry.lid.panel.dimensions.width;
  const lidPanelStartY = T + C;

  const straightBattenStartY =
    geometry.lockingMechanism.lockingLidBatten.planCorners.interiorNarrowCorner.y;
  const straightBattenLength = geometry.lid.straightLidBatten.dimensions.length;

  const stopWall = geometry.box.layout.endWalls.stop;
  const stopHandle = geometry.box.layout.handles.stop;

  // Rectangles
  const rectangles: DrawingRectangle[] = [
    // 1. Bottom board
    {
      id: 'end-bottom',
      part: 'bottom',
      x: 0,
      y: 0,
      width: Y,
      height: Tb,
    },
    // 2. Left side wall (front side)
    {
      id: 'end-side-wall-left',
      part: 'side',
      x: 0,
      y: Tb,
      width: T,
      height: bodyHeight - Tb,
    },
    // 3. Right side wall (back side)
    {
      id: 'end-side-wall-right',
      part: 'side',
      x: Y - T,
      y: Tb,
      width: T,
      height: bodyHeight - Tb,
    },
    // 4. Solid grab handle in upper end bay
    {
      id: 'end-handle-stop',
      part: 'handle-stop',
      x: T,
      y: stopHandle.startZ,
      width: Y - 2 * T,
      height: stopHandle.endZ - stopHandle.startZ,
    },
    // 5. Inset end wall (visible/recessed below grab handle)
    {
      id: 'end-wall-stop',
      part: 'end-wall-stop',
      x: T,
      y: Tb,
      width: Y - 2 * T,
      height: stopHandle.startZ - Tb,
    },
    // 6. Lid panel
    {
      id: 'end-lid-panel',
      part: 'lid-panel',
      x: lidPanelStartY,
      y: lidPanelBottomZ,
      width: lidPanelWidth,
      height: lidPanelTopZ - lidPanelBottomZ,
    },
    // 7. Stop fixed top batten / end cap spanning full width
    {
      id: 'end-fixed-top-batten',
      part: 'fixed-top-batten-stop',
      x: 0,
      y: bodyHeight,
      width: Y,
      height: overallHeightWithTopBattens - bodyHeight,
    },
  ];

  const polygons: DrawingPolygon[] = [];

  // Lines (Lid batten projection overhangs, housing dados, and joint lines)
  const lines: DrawingLine[] = [
    // Lid batten projection profile
    {
      id: 'end-batten-projection-top',
      kind: 'construction',
      part: 'straight-lid-batten',
      start: { x: straightBattenStartY, y: overallHeightWithTopBattens },
      end: { x: straightBattenStartY + straightBattenLength, y: overallHeightWithTopBattens },
    },
    {
      id: 'end-batten-projection-left',
      kind: 'construction',
      part: 'straight-lid-batten',
      start: { x: straightBattenStartY, y: bodyHeight },
      end: { x: straightBattenStartY, y: overallHeightWithTopBattens },
    },
    {
      id: 'end-batten-projection-right',
      kind: 'construction',
      part: 'straight-lid-batten',
      start: { x: straightBattenStartY + straightBattenLength, y: bodyHeight },
      end: { x: straightBattenStartY + straightBattenLength, y: overallHeightWithTopBattens },
    },
    // Bottom board joint line
    {
      id: 'end-line-bottom-joint',
      kind: 'visible',
      part: 'body',
      start: { x: 0, y: Tb },
      end: { x: Y, y: Tb },
    },
    // Side wall inner vertical joints
    {
      id: 'end-line-side-joint-left',
      kind: 'visible',
      part: 'body',
      start: { x: T, y: Tb },
      end: { x: T, y: bodyHeight },
    },
    {
      id: 'end-line-side-joint-right',
      kind: 'visible',
      part: 'body',
      start: { x: Y - T, y: Tb },
      end: { x: Y - T, y: bodyHeight },
    },
    // Housing dado indication lines in side walls (depth G)
    {
      id: 'end-line-housing-left',
      kind: 'construction',
      part: 'housing-dado',
      start: { x: T - G, y: Tb },
      end: { x: T - G, y: bodyHeight },
    },
    {
      id: 'end-line-housing-right',
      kind: 'construction',
      part: 'housing-dado',
      start: { x: Y - T + G, y: Tb },
      end: { x: Y - T + G, y: bodyHeight },
    },
    // End wall continuation behind grab handle
    {
      id: 'end-line-wall-stop-left-behind-handle',
      kind: 'hidden',
      part: 'end-wall-stop',
      start: { x: T, y: stopHandle.startZ },
      end: { x: T, y: bodyHeight },
    },
    {
      id: 'end-line-wall-stop-right-behind-handle',
      kind: 'hidden',
      part: 'end-wall-stop',
      start: { x: Y - T, y: stopHandle.startZ },
      end: { x: Y - T, y: bodyHeight },
    },
  ];

  // Dimensions
  const dimensions: DrawingDimension[] = [
    // Overall Y width (below carcass)
    {
      id: 'end-dim-overall-width',
      axis: 'x',
      start: { x: 0, y: 0 },
      end: { x: Y, y: 0 },
      offset: -35,
      valueMillimetres: Y,
      label: 'Width Y',
    },
    // Body Z height (left of carcass)
    {
      id: 'end-dim-body-height',
      axis: 'y',
      start: { x: 0, y: 0 },
      end: { x: 0, y: bodyHeight },
      offset: -35,
      valueMillimetres: bodyHeight,
      label: 'Body Height',
    },
    // Handle height H (along Z on grab handle)
    {
      id: 'end-dim-handle-height',
      axis: 'y',
      start: { x: T, y: stopHandle.startZ },
      end: { x: T, y: stopHandle.endZ },
      offset: 20,
      valueMillimetres: stopHandle.endZ - stopHandle.startZ,
      label: 'Handle H',
    },
    // Bottom thickness Tb (along Z at bottom edge)
    {
      id: 'end-dim-bottom-thickness',
      axis: 'y',
      start: { x: Y, y: 0 },
      end: { x: Y, y: Tb },
      offset: 20,
      valueMillimetres: Tb,
      label: 'Bottom Tb',
    },
    // Lid panel width (above lid panel)
    {
      id: 'end-dim-lid-width',
      axis: 'x',
      start: { x: lidPanelStartY, y: lidPanelTopZ },
      end: { x: lidPanelStartY + lidPanelWidth, y: lidPanelTopZ },
      offset: 35,
      valueMillimetres: lidPanelWidth,
      label: 'Lid Width',
    },
  ];

  // Annotations
  const annotations: DrawingAnnotation[] = [
    {
      id: 'end-ann-clearance',
      position: { x: Y / 2, y: overallHeightWithTopBattens + 12 },
      text: `Clearance C = ${C} mm per side`,
      align: 'center',
    },
    {
      id: 'end-ann-grab-handle',
      position: {
        x: Y / 2,
        y: (stopHandle.startZ + stopHandle.endZ) / 2,
      },
      text: 'Grab handle',
      align: 'center',
    },
    {
      id: 'end-ann-inset-end-wall',
      position: {
        x: Y / 2,
        y: (Tb + stopHandle.startZ) / 2,
      },
      text: `Inset end wall — ${stopWall.outsideFaceX} mm behind end`,
      align: 'center',
    },
  ];

  // Viewport margin bounds
  const marginY = Math.max(50, Y * 0.08);
  const marginZ = Math.max(50, overallHeightWithTopBattens * 0.12);

  const bounds: DrawingBounds = {
    minX: -marginY,
    minY: -marginZ,
    maxX: Y + marginY,
    maxY: overallHeightWithTopBattens + marginZ,
  };

  return {
    view: 'end',
    title: 'End Elevation',
    description: `End elevation showing the solid grab handle, inset end wall and side walls.`,
    bounds,
    rectangles,
    polygons,
    lines,
    dimensions,
    annotations,
  };
}
