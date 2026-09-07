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
  const C = geometry.lid.lateralFit.clearancePerSide;

  const lidPanelBottomZ = geometry.lid.vertical.lidPanelBottomZ;
  const lidPanelTopZ = geometry.lid.vertical.lidPanelTopZ;
  const lidPanelWidth = geometry.lid.panel.dimensions.width;
  const lidPanelStartY = T + C;

  const straightBattenStartY =
    geometry.lockingMechanism.lockingLidBatten.planCorners.interiorNarrowCorner.y;
  const straightBattenLength = geometry.lid.straightLidBatten.dimensions.length;

  // Rectangles
  const rectangles: DrawingRectangle[] = [
    // 1. Bottom board
    {
      id: 'end-bottom',
      part: 'bottom',
      x: 0,
      y: 0,
      width: Y,
      height: T,
    },
    // 2. Facing end board
    {
      id: 'end-board',
      part: 'end',
      x: T,
      y: T,
      width: Y - 2 * T,
      height: bodyHeight - T,
    },
    // 3. Left side wall (front side)
    {
      id: 'end-side-wall-left',
      part: 'side',
      x: 0,
      y: T,
      width: T,
      height: bodyHeight - T,
    },
    // 4. Right side wall (back side)
    {
      id: 'end-side-wall-right',
      part: 'side',
      x: Y - T,
      y: T,
      width: T,
      height: bodyHeight - T,
    },
    // 5. Lid panel
    {
      id: 'end-lid-panel',
      part: 'lid-panel',
      x: lidPanelStartY,
      y: lidPanelBottomZ,
      width: lidPanelWidth,
      height: lidPanelTopZ - lidPanelBottomZ,
    },
    // 6. Fixed top batten spanning full width
    {
      id: 'end-fixed-top-batten',
      part: 'fixed-top-batten',
      x: 0,
      y: bodyHeight,
      width: Y,
      height: overallHeightWithTopBattens - bodyHeight,
    },
  ];

  const polygons: DrawingPolygon[] = [];

  // Lines (Lid batten projection overhangs and joint lines)
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
    // Bottom board joint
    {
      id: 'end-line-bottom-joint',
      kind: 'visible',
      part: 'body',
      start: { x: 0, y: T },
      end: { x: Y, y: T },
    },
    // Side wall inner vertical joints
    {
      id: 'end-line-side-joint-left',
      kind: 'visible',
      part: 'body',
      start: { x: T, y: T },
      end: { x: T, y: bodyHeight },
    },
    {
      id: 'end-line-side-joint-right',
      kind: 'visible',
      part: 'body',
      start: { x: Y - T, y: T },
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
    description: `End elevation of toolbox (${Y} × ${overallHeightWithTopBattens} mm) looking along X axis showing side walls, lid panel width, and clearances.`,
    bounds,
    rectangles,
    polygons,
    lines,
    dimensions,
    annotations,
  };
}
