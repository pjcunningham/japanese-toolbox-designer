import { describe, it, expect } from 'vitest';
import { createDefaultToolboxDesign, calculateToolboxGeometry } from '../domain';
import { createWorkshopPdfData } from './createWorkshopPdfData';

describe('createWorkshopPdfData', () => {
  it('creates complete workshop PDF data for default design', () => {
    const design = createDefaultToolboxDesign();
    const geomResult = calculateToolboxGeometry(design);
    expect(geomResult.ok).toBe(true);
    if (!geomResult.ok) return;

    const data = createWorkshopPdfData(design, geomResult.geometry);

    expect(data.design).toBe(design);
    expect(data.geometry).toBe(geomResult.geometry);
    expect(data.wood.id).toBe('pine');
    expect(data.wood.name).toBe('Pine');

    // Verify drawings
    expect(data.drawings.front.view).toBe('front');
    expect(data.drawings.plan.view).toBe('plan');
    expect(data.drawings.end.view).toBe('end');

    // Verify cut list
    expect(data.cutList.summary.lineItemCount).toBe(8);
    expect(data.cutList.summary.stockBlankCount).toBe(12);
    expect(data.cutList.summary.finishedPartCount).toBe(13);

    // Verify process plan
    expect(data.processPlan.steps.length).toBe(23);
  });

  it('preserves geometry and physical cut list when switching unitSystem', () => {
    const metricDesign = createDefaultToolboxDesign();
    const imperialDesign = {
      ...createDefaultToolboxDesign(),
      unitSystem: 'imperial' as const,
    };

    const metricGeom = calculateToolboxGeometry(metricDesign);
    const imperialGeom = calculateToolboxGeometry(imperialDesign);

    expect(metricGeom.ok).toBe(true);
    expect(imperialGeom.ok).toBe(true);
    if (!metricGeom.ok || !imperialGeom.ok) return;

    const metricData = createWorkshopPdfData(metricDesign, metricGeom.geometry);
    const imperialData = createWorkshopPdfData(imperialDesign, imperialGeom.geometry);

    expect(metricData.cutList.items[0]!.dimensions.length).toBe(
      imperialData.cutList.items[0]!.dimensions.length,
    );
    expect(metricData.drawings.front.bounds).toEqual(imperialData.drawings.front.bounds);
  });

  it('updates wood definition when wood species changes without mutating design', () => {
    const design = {
      ...createDefaultToolboxDesign(),
      wood: { id: 'oak' },
    };
    const geomResult = calculateToolboxGeometry(design);
    expect(geomResult.ok).toBe(true);
    if (!geomResult.ok) return;

    const data = createWorkshopPdfData(design, geomResult.geometry);
    expect(data.wood.id).toBe('oak');
    expect(data.wood.name).toBe('Oak');
    expect(data.design.wood.id).toBe('oak');
  });
});
