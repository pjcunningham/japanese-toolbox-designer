import { describe, it, expect } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { calculateCutListRowLayouts, renderCutListTable } from './pdfTable';
import { createDefaultToolboxDesign, calculateToolboxGeometry } from '../domain';
import { createCutList } from '../manufacturing';
import { A4_LANDSCAPE_WIDTH, A4_LANDSCAPE_HEIGHT, PAGE_MARGIN } from './pdfLayout';

describe('CutList Table rendering and layout', () => {
  it('calculates row heights adapting to multi-line notes without clipping', async () => {
    const doc = await PDFDocument.create();
    const regularFont = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    const design = createDefaultToolboxDesign();
    const geomResult = calculateToolboxGeometry(design);
    expect(geomResult.ok).toBe(true);
    if (!geomResult.ok) return;

    const cutList = createCutList(geomResult.geometry);
    const layouts = calculateCutListRowLayouts(cutList.items, {
      regular: regularFont,
      bold: boldFont,
    });

    expect(layouts.length).toBe(8);

    // Locking batten row has longer notes and should have taller height
    const lockingRow = layouts.find((l) => l.item.id === 'locking-set-blank');
    expect(lockingRow).toBeDefined();
    expect(lockingRow!.notesLines.length).toBeGreaterThan(1);
    expect(lockingRow!.height).toBeGreaterThan(22);
  });

  it('renders complete Cut List table on a landscape A4 page', async () => {
    const doc = await PDFDocument.create();
    const regularFont = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    const page = doc.addPage([A4_LANDSCAPE_WIDTH, A4_LANDSCAPE_HEIGHT]);

    const design = createDefaultToolboxDesign();
    const geomResult = calculateToolboxGeometry(design);
    expect(geomResult.ok).toBe(true);
    if (!geomResult.ok) return;

    const cutList = createCutList(geomResult.geometry);

    const endY = renderCutListTable(
      page,
      cutList,
      PAGE_MARGIN,
      A4_LANDSCAPE_HEIGHT - 100,
      'metric',
      { regular: regularFont, bold: boldFont },
    );

    // Verify table ends well above bottom margin
    expect(endY).toBeGreaterThan(PAGE_MARGIN);

    const pdfBytes = await doc.save();
    expect(pdfBytes.length).toBeGreaterThan(1000);
  });
});
