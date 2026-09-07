import type { ToolboxDesign, UnitSystem } from '../../domain/design';
import type { ToolboxGeometryResult } from '../../domain/geometry';

export type DimensionFieldKey =
  | 'length'
  | 'width'
  | 'height'
  | 'stockThickness'
  | 'lidThickness'
  | 'fixedTopBattenWidth'
  | 'lidBattenWidth'
  | 'lidSideClearance'
  | 'desiredOverlap'
  | 'lidBattenOverhang'
  | 'lockingBattenTravelClearance';

export type AngleFieldKey = 'wedgeTaperAngle' | 'wedgeBevelAngle';

export type EditorFieldKey = DimensionFieldKey | AngleFieldKey;

export type DraftValues = Record<EditorFieldKey, string>;
export type FieldErrors = Partial<Record<EditorFieldKey, string>>;

export interface DesignEditorProps {
  design: ToolboxDesign;
  onDesignChange: (updatedDesign: ToolboxDesign) => void;
  className?: string;
}

export interface CalculatedDimensionsPanelProps {
  geometryResult: ToolboxGeometryResult;
  unitSystem: UnitSystem;
  hasInputErrors: boolean;
}
