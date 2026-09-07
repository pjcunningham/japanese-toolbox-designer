import type { CalculatedToolboxGeometry } from '../domain/geometry';
import type { CutList, CutListItem, CutListSummary } from './types';

/**
 * Creates the workshop Cut List from authoritative calculated toolbox geometry.
 *
 * DEFINITION:
 * The V1 Cut List defines the rectangular stock blanks the woodworker should initially
 * prepare before machining joints, tapers, and bevels.
 *
 * It is pure, deterministic, unit-neutral (canonical mm), and non-mutating.
 */
export function createCutList(geometry: CalculatedToolboxGeometry): CutList {
  const items: CutListItem[] = [
    {
      id: 'side',
      name: 'Long sides',
      quantity: geometry.box.parts.side.quantity,
      dimensions: { ...geometry.box.parts.side.dimensions },
      notes: ['Cut housing dados for both inset end walls after preparing the blank.'],
    },
    {
      id: 'end-wall',
      name: 'End walls',
      quantity: geometry.box.parts.end.quantity,
      dimensions: { ...geometry.box.parts.end.dimensions },
      notes: ['Includes the housed portion entering both side-board dados.'],
    },
    {
      id: 'bottom',
      name: 'Bottom',
      quantity: geometry.box.parts.bottom.quantity,
      dimensions: { ...geometry.box.parts.bottom.dimensions },
      notes: ['Full-size bottom fitted beneath the carcass.'],
    },
    {
      id: 'handle',
      name: 'Grab handles',
      quantity: geometry.box.parts.handle.quantity,
      dimensions: { ...geometry.box.parts.handle.dimensions },
      notes: ['Fit between the long sides at the two inset end bays.'],
    },
    {
      id: 'end-cap',
      name: 'End caps',
      quantity: geometry.box.parts.fixedTopBatten.quantity,
      dimensions: { ...geometry.box.parts.fixedTopBatten.dimensions },
      notes: [
        'Stop-end cap keeps a square inner edge.',
        'Locking-end cap receives the captured-wedge bevel.',
      ],
    },
    {
      id: 'lid-panel',
      name: 'Lid panel',
      quantity: 1,
      dimensions: { ...geometry.lid.panel.dimensions },
      notes: ['Final longitudinal fit is governed by locked overlap and release travel.'],
    },
    {
      id: 'straight-lid-batten',
      name: 'Straight lid batten',
      quantity: geometry.lid.straightLidBatten.quantity,
      dimensions: { ...geometry.lid.straightLidBatten.dimensions },
      notes: ['Stop-end lid batten.'],
    },
    {
      id: 'locking-set-blank',
      name: 'Locking batten + wedge blank',
      quantity: 1,
      dimensions: { ...geometry.lockingMechanism.wedge.blankDimensions },
      notes: [
        'This single blank is machined to produce both the tapered locking lid batten and the captured wedge. The wedge is deliberately left overlength for final fitting.',
      ],
      lockingSet: {
        workingLength: geometry.lockingMechanism.wedge.workingLength,
        wedgeOverlength: geometry.lockingMechanism.wedge.recommendedOverlength,
        taperAngleDegrees: geometry.lockingMechanism.wedge.taperAngle,
        bevelAngleDegrees: geometry.lockingMechanism.wedge.bevelAngle,
        combinedWidth: geometry.lockingMechanism.wedge.blankDimensions.width,
        lockingBattenMaximumWidth: geometry.lockingMechanism.lockingLidBatten.maximumWidth,
        lockingBattenMinimumWidth: geometry.lockingMechanism.lockingLidBatten.minimumWidth,
        wedgeBottomNarrowWidth: geometry.lockingMechanism.wedge.bottomNarrowWidth,
        wedgeBottomWideWidth: geometry.lockingMechanism.wedge.bottomWideWidth,
      },
    },
  ];

  const lineItemCount = items.length;
  const stockBlankCount = items.reduce((sum, item) => sum + item.quantity, 0);
  // The combined locking-set blank yields 2 finished parts (locking lid batten + locking wedge).
  const finishedPartCount = items.reduce(
    (sum, item) => sum + (item.id === 'locking-set-blank' ? item.quantity * 2 : item.quantity),
    0,
  );

  const summary: CutListSummary = {
    lineItemCount,
    stockBlankCount,
    finishedPartCount,
  };

  return {
    items,
    summary,
  };
}
