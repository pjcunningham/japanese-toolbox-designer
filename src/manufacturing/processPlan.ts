import type { CalculatedToolboxGeometry } from '../domain/geometry';
import type { ProcessPlan, ProcessPlanStep } from './types';

/**
 * Creates the deterministic Construction Process Plan from authoritative calculated geometry.
 *
 * It is pure, deterministic, unit-neutral (canonical mm and degrees), and non-mutating.
 */
export function createProcessPlan(geometry: CalculatedToolboxGeometry): ProcessPlan {
  const steps: ProcessPlanStep[] = [
    {
      id: 'prepare-stock',
      order: 1,
      title: 'Prepare and dimension stock',
      instructions: [
        'Prepare main-stock material to thickness T.',
        'Prepare bottom stock to thickness Tb.',
        'Prepare lid panel stock to thickness P.',
        'Prepare handle stock to the calculated handle depth.',
      ],
      measurements: [
        {
          kind: 'linear',
          label: 'Main stock thickness T',
          value: geometry.box.parts.side.dimensions.thickness,
        },
        {
          kind: 'linear',
          label: 'Bottom thickness Tb',
          value: geometry.box.parts.bottom.dimensions.thickness,
        },
        {
          kind: 'linear',
          label: 'Lid thickness P',
          value: geometry.lid.panel.dimensions.thickness,
        },
        {
          kind: 'linear',
          label: 'Handle depth',
          value: geometry.box.parts.handle.dimensions.thickness,
        },
      ],
    },
    {
      id: 'cut-sides',
      order: 2,
      title: 'Cut long sides',
      instructions: [
        'Cut two identical long side blanks to finished outside length and carcass body height.',
      ],
      measurements: [
        {
          kind: 'linear',
          label: 'Side blank length',
          value: geometry.box.parts.side.dimensions.length,
        },
        {
          kind: 'linear',
          label: 'Side blank width',
          value: geometry.box.parts.side.dimensions.width,
        },
        {
          kind: 'linear',
          label: 'Side blank thickness',
          value: geometry.box.parts.side.dimensions.thickness,
        },
      ],
    },
    {
      id: 'mark-end-walls',
      order: 3,
      title: 'Mark the inset end-wall positions',
      instructions: [
        'Mark the position of each inset end wall measured from the extreme ends of the long sides.',
      ],
      measurements: [
        {
          kind: 'linear',
          label: 'End-wall inset',
          value: geometry.box.layout.endWalls.stop.startX,
        },
        {
          kind: 'linear',
          label: 'End-wall thickness',
          value: geometry.box.parts.end.dimensions.thickness,
        },
      ],
    },
    {
      id: 'cut-housing-dados',
      order: 4,
      title: 'Cut the end-wall housing dados',
      instructions: [
        'Gang-mark both long sides where practical.',
        'Cut one housing dado for each inset end wall across the inside face of both long sides.',
        'Dado width corresponds to end-wall thickness.',
        'Dado depth comes from the configured housing dado depth.',
        'Keep corresponding housings accurately aligned across both side boards.',
      ],
      measurements: [
        {
          kind: 'linear',
          label: 'Stop-end housing start',
          value: geometry.box.layout.housingDados.stopEnd.startX,
        },
        {
          kind: 'linear',
          label: 'Stop-end housing end',
          value: geometry.box.layout.housingDados.stopEnd.endX,
        },
        {
          kind: 'linear',
          label: 'Locking-end housing start',
          value: geometry.box.layout.housingDados.lockingEnd.startX,
        },
        {
          kind: 'linear',
          label: 'Locking-end housing end',
          value: geometry.box.layout.housingDados.lockingEnd.endX,
        },
        {
          kind: 'linear',
          label: 'Housing width',
          value: geometry.box.layout.housingDados.width,
        },
        {
          kind: 'linear',
          label: 'Housing depth',
          value: geometry.box.layout.housingDados.depth,
        },
      ],
    },
    {
      id: 'fit-end-walls',
      order: 5,
      title: 'Fit inset end walls',
      instructions: [
        'Cut two end-wall blanks to size, including the housed portion extending into both side housings.',
        'Dry-fit the end walls into the side housings.',
        'Interior faces establish the true internal length of the box.',
      ],
      measurements: [
        {
          kind: 'linear',
          label: 'End-wall blank length',
          value: geometry.box.parts.end.dimensions.length,
        },
        {
          kind: 'linear',
          label: 'End-wall blank width',
          value: geometry.box.parts.end.dimensions.width,
        },
        {
          kind: 'linear',
          label: 'End-wall blank thickness',
          value: geometry.box.parts.end.dimensions.thickness,
        },
        {
          kind: 'linear',
          label: 'Housing engagement per side G',
          value: geometry.box.layout.housingDados.depth,
        },
      ],
    },
    {
      id: 'fit-bottom',
      order: 6,
      title: 'Cut and fit the bottom',
      instructions: [
        'Bottom is full-size and fits beneath the carcass.',
        'Use appropriate fastening and pilot drilling for the selected timber.',
      ],
      measurements: [
        {
          kind: 'linear',
          label: 'Bottom blank length',
          value: geometry.box.parts.bottom.dimensions.length,
        },
        {
          kind: 'linear',
          label: 'Bottom blank width',
          value: geometry.box.parts.bottom.dimensions.width,
        },
        {
          kind: 'linear',
          label: 'Bottom blank thickness',
          value: geometry.box.parts.bottom.dimensions.thickness,
        },
      ],
    },
    {
      id: 'assemble-carcass',
      order: 7,
      title: 'Assemble and square the carcass',
      instructions: [
        'Fit the side and end-wall housing joints.',
        'Position the bottom board beneath the carcass.',
        'Check diagonal measurements to ensure the assembly is square.',
        'Ensure both inset end-wall interior faces are parallel.',
      ],
      measurements: [
        {
          kind: 'linear',
          label: 'Internal length',
          value: geometry.box.internal.length,
        },
        {
          kind: 'linear',
          label: 'Internal width',
          value: geometry.box.internal.width,
        },
        {
          kind: 'linear',
          label: 'Internal height',
          value: geometry.box.internal.height,
        },
      ],
    },
    {
      id: 'fit-handles',
      order: 8,
      title: 'Fit grab handles',
      instructions: [
        'Handles span between the long sides at both inset end bays.',
        'Handles occupy the upper portion of each end bay and align with the top of the carcass.',
        'The opening beneath provides the hand grip.',
      ],
      measurements: [
        {
          kind: 'linear',
          label: 'Handle blank length',
          value: geometry.box.parts.handle.dimensions.length,
        },
        {
          kind: 'linear',
          label: 'Handle height',
          value: geometry.box.parts.handle.dimensions.width,
        },
        {
          kind: 'linear',
          label: 'Handle depth',
          value: geometry.box.parts.handle.dimensions.thickness,
        },
        {
          kind: 'linear',
          label: 'Hand grip opening height',
          value: geometry.box.internal.height - geometry.box.parts.handle.dimensions.width,
        },
      ],
    },
    {
      id: 'level-top',
      order: 9,
      title: 'Level top surfaces',
      instructions: [
        'After the carcass and handles are fitted, bring the upper surfaces of sides, end walls and handles flush as required before fitting the end caps.',
      ],
    },
    {
      id: 'fit-end-caps',
      order: 10,
      title: 'Prepare and fit end caps',
      instructions: [
        'End caps span the full width Y across the top of the carcass.',
        'Fit one end cap flush at each extreme end of the carcass.',
        'Leave the stop-end cap square initially.',
        'The locking-end cap receives its captured-wedge bevel later.',
        'End caps project inward past the inset end walls to create the lid pockets.',
      ],
      measurements: [
        {
          kind: 'linear',
          label: 'End-cap blank length',
          value: geometry.box.parts.fixedTopBatten.dimensions.length,
        },
        {
          kind: 'linear',
          label: 'End-cap width R',
          value: geometry.box.parts.fixedTopBatten.dimensions.width,
        },
        {
          kind: 'linear',
          label: 'End-cap thickness',
          value: geometry.box.parts.fixedTopBatten.dimensions.thickness,
        },
        {
          kind: 'linear',
          label: 'Pocket depth',
          value: geometry.lid.longitudinalFit.pocketDepth,
        },
      ],
    },
    {
      id: 'prepare-lid',
      order: 11,
      title: 'Prepare the lid panel',
      instructions: [
        'Cut the lid panel to finished length and width.',
        'The panel fits between side walls with clearance C per side.',
        'The panel extends beneath both end caps by locked overlap O.',
      ],
      measurements: [
        {
          kind: 'linear',
          label: 'Lid panel length',
          value: geometry.lid.panel.dimensions.length,
        },
        {
          kind: 'linear',
          label: 'Lid panel width',
          value: geometry.lid.panel.dimensions.width,
        },
        {
          kind: 'linear',
          label: 'Lid panel thickness',
          value: geometry.lid.panel.dimensions.thickness,
        },
        {
          kind: 'linear',
          label: 'Side clearance per side',
          value: geometry.lid.lateralFit.clearancePerSide,
        },
        {
          kind: 'linear',
          label: 'Locked overlap per end',
          value: geometry.lid.longitudinalFit.lockedOverlapPerEnd,
        },
      ],
    },
    {
      id: 'fit-straight-batten',
      order: 12,
      title: 'Fit straight stop lid batten',
      instructions: [
        'Cut the straight batten and attach it to the top face of the lid panel at the stop end.',
        'Its stop-facing edge aligns with the stop end-cap opening edge in locked position.',
      ],
      measurements: [
        {
          kind: 'linear',
          label: 'Straight batten length',
          value: geometry.lid.straightLidBatten.dimensions.length,
        },
        {
          kind: 'linear',
          label: 'Straight batten width',
          value: geometry.lid.straightLidBatten.dimensions.width,
        },
        {
          kind: 'linear',
          label: 'Straight batten thickness',
          value: geometry.lid.straightLidBatten.dimensions.thickness,
        },
        {
          kind: 'linear',
          label: 'Distance from panel end',
          value: geometry.lid.straightLidBatten.startFromPanelEnd,
        },
      ],
    },
    {
      id: 'prepare-locking-blank',
      order: 13,
      title: 'Prepare the locking batten/wedge blank',
      instructions: [
        'One stock blank produces both the tapered locking lid batten and locking wedge.',
        'The blank includes extra length as a fitting allowance for the wedge.',
      ],
      measurements: [
        {
          kind: 'linear',
          label: 'Combined blank length',
          value: geometry.lockingMechanism.wedge.blankDimensions.length,
        },
        {
          kind: 'linear',
          label: 'Combined blank width',
          value: geometry.lockingMechanism.wedge.blankDimensions.width,
        },
        {
          kind: 'linear',
          label: 'Combined blank thickness',
          value: geometry.lockingMechanism.wedge.blankDimensions.thickness,
        },
        {
          kind: 'linear',
          label: 'Working taper length',
          value: geometry.lockingMechanism.wedge.workingLength,
        },
        {
          kind: 'linear',
          label: 'Recommended wedge overlength',
          value: geometry.lockingMechanism.wedge.recommendedOverlength,
        },
      ],
    },
    {
      id: 'layout-taper',
      order: 14,
      title: 'Lay out the plan taper',
      instructions: [
        'Mark the plan taper angle α over the authoritative working span.',
        'Narrow end leads in the wedge insertion direction (+Y).',
        'The same cut establishes complementary locking-batten and wedge geometry.',
      ],
      measurements: [
        {
          kind: 'angle',
          label: 'Plan taper angle α',
          valueDegrees: geometry.lockingMechanism.wedge.taperAngle,
        },
        {
          kind: 'linear',
          label: 'Working length',
          value: geometry.lockingMechanism.wedge.workingLength,
        },
        {
          kind: 'linear',
          label: 'Taper delta',
          value: geometry.lockingMechanism.lockingLidBatten.taperDelta,
        },
        {
          kind: 'linear',
          label: 'Locking batten maximum width',
          value: geometry.lockingMechanism.lockingLidBatten.maximumWidth,
        },
        {
          kind: 'linear',
          label: 'Locking batten minimum width',
          value: geometry.lockingMechanism.lockingLidBatten.minimumWidth,
        },
        {
          kind: 'linear',
          label: 'Wedge bottom narrow width',
          value: geometry.lockingMechanism.wedge.bottomNarrowWidth,
        },
        {
          kind: 'linear',
          label: 'Wedge bottom wide width',
          value: geometry.lockingMechanism.wedge.bottomWideWidth,
        },
      ],
    },
    {
      id: 'cut-compound-face',
      order: 15,
      title: 'Cut the compound tapered locking face',
      instructions: [
        'The locking-batten/wedge mating face combines the plan taper α with the retaining bevel β.',
        'This is the compound-angle face.',
      ],
      measurements: [
        {
          kind: 'angle',
          label: 'Plan taper angle α',
          valueDegrees: geometry.lockingMechanism.wedge.taperAngle,
        },
        {
          kind: 'angle',
          label: 'Bevel angle β',
          valueDegrees: geometry.lockingMechanism.wedge.bevelAngle,
        },
      ],
    },
    {
      id: 'separate-locking-set',
      order: 16,
      title: 'Separate locking batten and wedge',
      instructions: [
        'Separate the two complementary components from the prepared blank.',
        'Trim the locking lid batten to its authoritative working length.',
        'Retain the wedge overlength for fitting.',
      ],
      measurements: [
        {
          kind: 'linear',
          label: 'Locking batten finished working length',
          value: geometry.lockingMechanism.wedge.workingLength,
        },
        {
          kind: 'linear',
          label: 'Recommended wedge blank length',
          value: geometry.lockingMechanism.wedge.recommendedBlankLength,
        },
        {
          kind: 'linear',
          label: 'Recommended wedge overlength',
          value: geometry.lockingMechanism.wedge.recommendedOverlength,
        },
      ],
    },
    {
      id: 'fit-locking-batten',
      order: 17,
      title: 'Fit locking lid batten',
      instructions: [
        'Attach the locking batten to the lid.',
        'Preserve the calculated channel width and full lid release movement.',
        'Check that it does not restrict available travel with the wedge removed.',
      ],
      measurements: [
        {
          kind: 'linear',
          label: 'Available lid travel',
          value: geometry.lid.longitudinalFit.availableTravel,
        },
        {
          kind: 'linear',
          label: 'Locking travel clearance Q',
          value: geometry.lockingMechanism.channel.residualGapAfterFullLidShift,
        },
      ],
    },
    {
      id: 'bevel-locking-cap',
      order: 18,
      title: 'Bevel locking-end cap',
      instructions: [
        'Bevel the inner face of the locking-end cap by β.',
        'This face must complement the straight side of the captured wedge.',
      ],
      measurements: [
        {
          kind: 'angle',
          label: 'Bevel angle β',
          valueDegrees: geometry.lockingMechanism.lockingFixedTopBatten.bevelAngle,
        },
        {
          kind: 'linear',
          label: 'Bevel offset',
          value: geometry.lockingMechanism.lockingFixedTopBatten.bevelOffsetNormal,
        },
      ],
    },
    {
      id: 'fit-wedge',
      order: 19,
      title: 'Fit the wedge',
      instructions: [
        'Insert the wedge along the +Y direction.',
        'Progressively wider material tightens the locking mechanism.',
        'Tune the fit carefully.',
        'Retain sufficient overlength while fitting.',
      ],
      measurements: [
        {
          kind: 'text',
          label: 'Wedge insertion direction',
          valueText: geometry.lockingMechanism.wedge.insertionDirection,
        },
        {
          kind: 'linear',
          label: 'Wedge bottom narrow width',
          value: geometry.lockingMechanism.wedge.bottomNarrowWidth,
        },
        {
          kind: 'linear',
          label: 'Wedge bottom wide width',
          value: geometry.lockingMechanism.wedge.bottomWideWidth,
        },
        {
          kind: 'linear',
          label: 'Wedge top narrow width',
          value: geometry.lockingMechanism.wedge.topNarrowWidth,
        },
        {
          kind: 'linear',
          label: 'Wedge top wide width',
          value: geometry.lockingMechanism.wedge.topWideWidth,
        },
      ],
    },
    {
      id: 'verify-capture',
      order: 20,
      title: 'Verify captured profile',
      instructions: [
        'Check that the wedge is wider at the bottom than the top and is retained by the complementary bevelled faces.',
      ],
      measurements: [
        {
          kind: 'angle',
          label: 'Bevel angle β',
          valueDegrees: geometry.lockingMechanism.wedge.bevelAngle,
        },
        {
          kind: 'linear',
          label: 'Top width reduction',
          value: geometry.lockingMechanism.capture.topWidthReduction,
        },
      ],
      notes: [
        `Vertically captured = ${geometry.lockingMechanism.capture.verticallyCaptured ? 'true' : 'false'}`,
      ],
    },
    {
      id: 'verify-lid-operation',
      order: 21,
      title: 'Verify lid operation',
      instructions: [
        '1. Remove or loosen the locking wedge.',
        '2. Slide the lid toward the locking end (+X).',
        '3. Confirm the stop end clears the fixed stop end cap.',
        '4. Lift the stop end upward.',
        '5. Withdraw the lid.',
      ],
      measurements: [
        {
          kind: 'linear',
          label: 'Locked overlap',
          value: geometry.lid.longitudinalFit.lockedOverlapPerEnd,
        },
        {
          kind: 'linear',
          label: 'Travel to release edge',
          value: geometry.lid.longitudinalFit.travelToReleaseEdge,
        },
        {
          kind: 'linear',
          label: 'Available lid travel',
          value: geometry.lid.longitudinalFit.availableTravel,
        },
        {
          kind: 'linear',
          label: 'Release travel margin',
          value: geometry.lid.longitudinalFit.releaseTravelMargin,
        },
        {
          kind: 'linear',
          label: 'Pocket depth',
          value: geometry.lid.longitudinalFit.pocketDepth,
        },
      ],
    },
    {
      id: 'trim-wedge',
      order: 22,
      title: 'Trim wedge after final fitting',
      instructions: [
        'Once the wedge seats correctly and the lid locks and releases reliably, trim or shape the excess wedge length to the preferred finished grip.',
      ],
    },
    {
      id: 'finish',
      order: 23,
      title: 'Ease edges and finish',
      instructions: [
        'Ease exposed sharp edges on the box carcass and lid.',
        'Sand and apply finish as appropriate for the selected timber.',
        'Preserve critical locking surfaces.',
        'Avoid excessive rounding of wedge and batten mating faces.',
      ],
    },
  ];

  return { steps };
}
