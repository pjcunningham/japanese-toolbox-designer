import type { ToolboxDesign } from '../domain/design';
import type { CalculatedToolboxGeometry } from '../domain/geometry';
import { createFrontDrawing, createPlanDrawing, createEndDrawing } from '../rendering/two-d';
import { createCutList, createProcessPlan } from '../manufacturing';
import { getWoodDefinition } from '../materials/woodDefinitions';
import type { WorkshopPdfData } from './types';

/**
 * Pure aggregate data factory that bundles all models needed for workshop PDF rendering.
 * Reuses existing authoritative 2D projections, cut list, process plan, and material definitions.
 */
export function createWorkshopPdfData(
  design: ToolboxDesign,
  geometry: CalculatedToolboxGeometry,
): WorkshopPdfData {
  return {
    design,
    geometry,
    drawings: {
      front: createFrontDrawing(geometry),
      plan: createPlanDrawing(geometry),
      end: createEndDrawing(geometry),
    },
    cutList: createCutList(geometry),
    processPlan: createProcessPlan(geometry),
    wood: getWoodDefinition(design.wood.id),
  };
}
