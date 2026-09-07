import type { ToolboxDesign } from '../../domain/design';

/**
 * ---------------------------------------------------------------------------
 * Technical Drawing Model Types & Primitives (Phase 9)
 * ---------------------------------------------------------------------------
 *
 * Renderer-neutral technical drawing model positioned between authoritative
 * woodworking geometry (CalculatedToolboxGeometry) and presentation layers
 * (SVG viewer and future browser-side PDF generator).
 *
 * COORDINATE SYSTEM CONVENTION:
 * Normal engineering coordinates:
 * - Horizontal coordinate (X or Y) increases to the right.
 * - Vertical coordinate (Y or Z) increases UPWARD.
 * (Inversion to screen/SVG coordinate space is handled solely at the SVG rendering boundary).
 */

export type TechnicalDrawingView = 'front' | 'plan' | 'end';

export type DrawingPart =
  | 'body'
  | 'bottom'
  | 'side'
  | 'end'
  | 'end-wall-stop'
  | 'end-wall-locking'
  | 'handle-stop'
  | 'handle-locking'
  | 'housing-dado'
  | 'handle-bay'
  | 'fixed-top-batten'
  | 'fixed-top-batten-stop'
  | 'fixed-top-batten-locking'
  | 'lid-panel'
  | 'straight-lid-batten'
  | 'locking-lid-batten'
  | 'locking-wedge'
  | 'wall';

export interface DrawingPoint {
  x: number;
  y: number;
}

export type DrawingLineKind = 'visible' | 'hidden' | 'construction';

export interface DrawingLine {
  id: string;
  kind: DrawingLineKind;
  start: DrawingPoint;
  end: DrawingPoint;
  part?: DrawingPart;
}

export interface DrawingPolygon {
  id: string;
  part: DrawingPart;
  points: DrawingPoint[];
  hidden?: boolean;
}

export interface DrawingRectangle {
  id: string;
  part: DrawingPart;
  x: number;
  y: number;
  width: number;
  height: number;
  hidden?: boolean;
}

export interface DrawingDimension {
  id: string;
  start: DrawingPoint;
  end: DrawingPoint;
  offset: number;
  valueMillimetres: number;
  label?: string;
  axis: 'x' | 'y' | 'aligned';
}

export interface DrawingAnnotation {
  id: string;
  position: DrawingPoint;
  text: string;
  align?: 'left' | 'center' | 'right';
  secondaryText?: string;
}

export interface DrawingBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface TechnicalDrawingModel {
  view: TechnicalDrawingView;
  title: string;
  description: string;
  bounds: DrawingBounds;
  rectangles: DrawingRectangle[];
  polygons: DrawingPolygon[];
  lines: DrawingLine[];
  dimensions: DrawingDimension[];
  annotations: DrawingAnnotation[];
}

export interface ProjectionOptions {
  design?: ToolboxDesign;
}
