import type { ToolboxDesign } from '../domain/design';
import type { CalculatedToolboxGeometry } from '../domain/geometry';
import type { TechnicalDrawingModel } from '../rendering/two-d/drawingModel';
import type { CutList, ProcessPlan } from '../manufacturing/types';
import type { WoodDefinition } from '../materials/woodDefinitions';

/**
 * Pure, renderer-neutral aggregate model containing all authoritative data
 * needed to render the workshop PDF.
 */
export interface WorkshopPdfData {
  design: ToolboxDesign;
  geometry: CalculatedToolboxGeometry;
  drawings: {
    front: TechnicalDrawingModel;
    plan: TechnicalDrawingModel;
    end: TechnicalDrawingModel;
  };
  cutList: CutList;
  processPlan: ProcessPlan;
  wood: WoodDefinition;
}

export interface GeneratePdfOptions {
  generatedAt?: Date;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DrawingFitResult {
  scale: number;
  offsetX: number;
  offsetY: number;
  fittedWidth: number;
  fittedHeight: number;
}
