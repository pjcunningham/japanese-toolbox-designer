import type { PartDimensions } from '../domain/geometry';

export interface CutListItemLockingSet {
  workingLength: number;
  wedgeOverlength: number;
  taperAngleDegrees: number;
  bevelAngleDegrees: number;
  combinedWidth: number;
  lockingBattenMaximumWidth: number;
  lockingBattenMinimumWidth: number;
  wedgeBottomNarrowWidth: number;
  wedgeBottomWideWidth: number;
}

export interface CutListItem {
  id: string;
  name: string;
  quantity: number;
  dimensions: PartDimensions;
  notes: string[];
  lockingSet?: CutListItemLockingSet;
}

export interface CutListSummary {
  lineItemCount: number;
  stockBlankCount: number;
  finishedPartCount: number;
}

export interface CutList {
  items: CutListItem[];
  summary: CutListSummary;
}

export type ProcessMeasurement =
  | {
      kind: 'linear';
      label: string;
      value: number;
    }
  | {
      kind: 'angle';
      label: string;
      valueDegrees: number;
    }
  | {
      kind: 'text';
      label: string;
      valueText: string;
    }
  | {
      kind: 'boolean';
      label: string;
      valueBoolean: boolean;
    };

export interface ProcessPlanStep {
  id: string;
  order: number;
  title: string;
  instructions: string[];
  measurements?: ProcessMeasurement[];
  notes?: string[];
}

export interface ProcessPlan {
  steps: ProcessPlanStep[];
}
