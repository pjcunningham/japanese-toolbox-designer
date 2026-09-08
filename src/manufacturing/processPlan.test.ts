import { describe, it, expect } from 'vitest';
import { createDefaultToolboxDesign, setDesignUnitSystem } from '../domain';
import { calculateToolboxGeometry } from '../domain/geometry';
import { createProcessPlan } from './processPlan';

describe('createProcessPlan', () => {
  it('generates the complete 23-step process sequence in stable order with expected IDs', () => {
    const design = createDefaultToolboxDesign();
    const result = calculateToolboxGeometry(design);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const plan = createProcessPlan(result.geometry);
    expect(plan.steps).toHaveLength(23);

    const expectedStepIds = [
      'prepare-stock',
      'cut-sides',
      'mark-end-walls',
      'cut-housing-dados',
      'fit-end-walls',
      'fit-bottom',
      'assemble-carcass',
      'fit-handles',
      'level-top',
      'fit-end-caps',
      'prepare-lid',
      'fit-straight-batten',
      'prepare-locking-blank',
      'layout-taper',
      'cut-compound-face',
      'separate-locking-set',
      'fit-locking-batten',
      'bevel-locking-cap',
      'fit-wedge',
      'verify-capture',
      'verify-lid-operation',
      'trim-wedge',
      'finish',
    ];

    expect(plan.steps.map((s) => s.id)).toEqual(expectedStepIds);
    expect(plan.steps.map((s) => s.order)).toEqual(Array.from({ length: 23 }, (_, i) => i + 1));
  });

  it('contains authoritative representative default measurements without recomputing', () => {
    const design = createDefaultToolboxDesign();
    const result = calculateToolboxGeometry(design);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const plan = createProcessPlan(result.geometry);

    // Step 3 & 4: Housing & End-wall inset
    const markStep = plan.steps.find((s) => s.id === 'mark-end-walls');
    const insetMeas = markStep?.measurements?.find((m) => m.label === 'End-wall inset');
    expect(insetMeas?.kind === 'linear' && insetMeas.value).toBe(36);

    const housingStep = plan.steps.find((s) => s.id === 'cut-housing-dados');
    const depthMeas = housingStep?.measurements?.find((m) => m.label === 'Housing depth');
    expect(depthMeas?.kind === 'linear' && depthMeas.value).toBe(3);

    // Step 8: Handle
    const handleStep = plan.steps.find((s) => s.id === 'fit-handles');
    const handleHeightMeas = handleStep?.measurements?.find((m) => m.label === 'Handle height');
    expect(handleHeightMeas?.kind === 'linear' && handleHeightMeas.value).toBe(72);

    // Step 10: Pocket depth
    const endCapStep = plan.steps.find((s) => s.id === 'fit-end-caps');
    const pocketMeas = endCapStep?.measurements?.find((m) => m.label === 'Pocket depth');
    expect(pocketMeas?.kind === 'linear' && pocketMeas.value).toBe(30);

    // Step 11: Locked overlaps
    const lidStep = plan.steps.find((s) => s.id === 'prepare-lid');
    const stopOverlapMeas = lidStep?.measurements?.find(
      (m) => m.label === 'Stop-end locked overlap',
    );
    expect(stopOverlapMeas?.kind === 'linear' && stopOverlapMeas.value).toBe(6);
    const lockingOverlapMeas = lidStep?.measurements?.find(
      (m) => m.label === 'Locking-end locked overlap',
    );
    expect(lockingOverlapMeas?.kind === 'linear' && lockingOverlapMeas.value).toBe(20);

    // Step 13: Combined locking blank
    const lockBlankStep = plan.steps.find((s) => s.id === 'prepare-locking-blank');
    const blankWidthMeas = lockBlankStep?.measurements?.find(
      (m) => m.label === 'Combined blank width',
    );
    expect(blankWidthMeas?.kind === 'linear' && blankWidthMeas.value).toBe(53);
    const taperLenMeas = lockBlankStep?.measurements?.find(
      (m) => m.label === 'Working taper length',
    );
    expect(taperLenMeas?.kind === 'linear' && taperLenMeas.value).toBe(296);
    const overlengthMeas = lockBlankStep?.measurements?.find(
      (m) => m.label === 'Recommended wedge overlength',
    );
    expect(overlengthMeas?.kind === 'linear' && overlengthMeas.value).toBe(36);

    // Step 14 & 15: Plan taper angle and bevel angle
    const taperStep = plan.steps.find((s) => s.id === 'layout-taper');
    const alphaMeas = taperStep?.measurements?.find((m) => m.label === 'Plan taper angle α');
    expect(alphaMeas?.kind === 'angle' && alphaMeas.valueDegrees).toBe(2);

    const compoundStep = plan.steps.find((s) => s.id === 'cut-compound-face');
    const betaMeas = compoundStep?.measurements?.find((m) => m.label === 'Bevel angle β');
    expect(betaMeas?.kind === 'angle' && betaMeas.valueDegrees).toBe(10);

    // Step 21: Verify lid operation
    const verifyLidStep = plan.steps.find((s) => s.id === 'verify-lid-operation');
    const availTravelMeas = verifyLidStep?.measurements?.find(
      (m) => m.label === 'Available lid travel',
    );
    expect(availTravelMeas?.kind === 'linear' && availTravelMeas.value).toBe(10);
    const relMarginMeas = verifyLidStep?.measurements?.find(
      (m) => m.label === 'Release travel margin',
    );
    expect(relMarginMeas?.kind === 'linear' && relMarginMeas.value).toBe(4);
  });

  it('correctly models single combined locking-set blank in step sequence', () => {
    const design = createDefaultToolboxDesign();
    const result = calculateToolboxGeometry(design);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const plan = createProcessPlan(result.geometry);
    const prepareBlankStep = plan.steps.find((s) => s.id === 'prepare-locking-blank');
    expect(prepareBlankStep?.instructions[0]).toContain(
      'One stock blank produces both the tapered locking lid batten and locking wedge.',
    );

    const separateStep = plan.steps.find((s) => s.id === 'separate-locking-set');
    expect(separateStep?.instructions[0]).toContain(
      'Separate the two complementary components from the prepared blank.',
    );
    expect(separateStep?.instructions[2]).toContain('Retain the wedge overlength for fitting.');
  });

  it('derives verticallyCaptured dynamically from geometry in capture verification step', () => {
    const design = createDefaultToolboxDesign();
    const result = calculateToolboxGeometry(design);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const plan = createProcessPlan(result.geometry);
    const captureStep = plan.steps.find((s) => s.id === 'verify-capture');
    expect(captureStep?.notes).toContain('Vertically captured = true');
  });

  it('produces identical pure process plans regardless of unit system selection', () => {
    const metricDesign = createDefaultToolboxDesign();
    const imperialDesign = setDesignUnitSystem(createDefaultToolboxDesign(), 'imperial');

    const metricGeo = calculateToolboxGeometry(metricDesign);
    const imperialGeo = calculateToolboxGeometry(imperialDesign);

    expect(metricGeo.ok && imperialGeo.ok).toBe(true);
    if (!metricGeo.ok || !imperialGeo.ok) return;

    const metricPlan = createProcessPlan(metricGeo.geometry);
    const imperialPlan = createProcessPlan(imperialGeo.geometry);

    expect(metricPlan).toEqual(imperialPlan);
  });

  it('produces identical pure process plans regardless of wood species selection', () => {
    const designPine = createDefaultToolboxDesign();
    const designOak = { ...createDefaultToolboxDesign(), wood: { id: 'white-oak' } };

    const geoPine = calculateToolboxGeometry(designPine);
    const geoOak = calculateToolboxGeometry(designOak);

    expect(geoPine.ok && geoOak.ok).toBe(true);
    if (!geoPine.ok || !geoOak.ok) return;

    const planPine = createProcessPlan(geoPine.geometry);
    const planOak = createProcessPlan(geoOak.geometry);

    expect(planPine).toEqual(planOak);
  });

  it('does not mutate input geometry', () => {
    const design = createDefaultToolboxDesign();
    const result = calculateToolboxGeometry(design);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const geometryBefore = JSON.parse(JSON.stringify(result.geometry));
    const plan = createProcessPlan(result.geometry);
    expect(plan).toBeDefined();
    expect(result.geometry).toEqual(geometryBefore);
  });
});
