import type { ToolboxDesign, UnitSystem } from '../../domain/design';
import type { ToolboxGeometryResult } from '../../domain/geometry';

export type WorkshopTab = 'cut-list' | 'process-plan';

export interface WorkshopPanelProps {
  geometryResult: ToolboxGeometryResult;
  unitSystem: UnitSystem;
  design: ToolboxDesign;
  hasInputErrors: boolean;
}
