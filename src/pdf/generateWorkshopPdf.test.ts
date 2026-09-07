import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { createDefaultToolboxDesign, calculateToolboxGeometry } from '../domain';
import { createWorkshopPdfData } from './createWorkshopPdfData';
import { generateWorkshopPdf } from './generateWorkshopPdf';

describe('generateWorkshopPdf', () => {
  const fixedDate = new Date('2026-09-07T12:00:00Z');

  it('generates a valid, readable multi-page PDF document for default design', async () => {
    const design = createDefaultToolboxDesign();
    const geomResult = calculateToolboxGeometry(design);
    expect(geomResult.ok).toBe(true);
    if (!geomResult.ok) return;

    const data = createWorkshopPdfData(design, geomResult.geometry);
    const pdfBytes = await generateWorkshopPdf(data, {
      generatedAt: fixedDate,
    });

    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(5000);

    // Verify PDF header magic bytes %PDF-
    const headerString = String.fromCharCode(...pdfBytes.slice(0, 5));
    expect(headerString).toBe('%PDF-');

    // Reopen and parse with pdf-lib to verify structural integrity
    const reloadedDoc = await PDFDocument.load(pdfBytes);
    const pageCount = reloadedDoc.getPageCount();

    // Must have at least 1 summary + 3 drawings + 1 cut list + process plan pages (>= 6)
    expect(pageCount).toBeGreaterThanOrEqual(6);

    // Verify orientations
    const p1 = reloadedDoc.getPage(0);
    expect(p1.getWidth()).toBeLessThan(p1.getHeight()); // Portrait summary

    const p2 = reloadedDoc.getPage(1);
    expect(p2.getWidth()).toBeGreaterThan(p2.getHeight()); // Landscape plan drawing

    const p3 = reloadedDoc.getPage(2);
    expect(p3.getWidth()).toBeGreaterThan(p3.getHeight()); // Landscape front drawing

    const p4 = reloadedDoc.getPage(3);
    expect(p4.getWidth()).toBeGreaterThan(p4.getHeight()); // Landscape end drawing

    const p5 = reloadedDoc.getPage(4);
    expect(p5.getWidth()).toBeGreaterThan(p5.getHeight()); // Landscape cut list

    const p6 = reloadedDoc.getPage(5);
    expect(p6.getWidth()).toBeLessThan(p6.getHeight()); // Portrait process plan

    // Verify metadata
    expect(reloadedDoc.getTitle()).toContain('Japanese Toolbox Workshop Plan');
    expect(reloadedDoc.getAuthor()).toBe('Japanese Toolbox Designer');
    expect(reloadedDoc.getCreator()).toBe('Japanese Toolbox Designer');
  });

  it('generates valid PDF in Imperial unit system without errors', async () => {
    const imperialDesign = {
      ...createDefaultToolboxDesign(),
      name: 'Imperial Master Box',
      unitSystem: 'imperial' as const,
    };
    const geomResult = calculateToolboxGeometry(imperialDesign);
    expect(geomResult.ok).toBe(true);
    if (!geomResult.ok) return;

    const data = createWorkshopPdfData(imperialDesign, geomResult.geometry);
    const pdfBytes = await generateWorkshopPdf(data, {
      generatedAt: fixedDate,
    });

    expect(pdfBytes.length).toBeGreaterThan(5000);
    const reloadedDoc = await PDFDocument.load(pdfBytes);
    expect(reloadedDoc.getPageCount()).toBeGreaterThanOrEqual(6);
  });

  it('handles very long design names gracefully without crashing or throwing', async () => {
    const longNameDesign = {
      ...createDefaultToolboxDesign(),
      name: 'Extremely Long Traditional Japanese Sashimono Toolbox With Compound Wedge Locking Mechanism And Dual Inset End Walls 2026 Edition',
    };
    const geomResult = calculateToolboxGeometry(longNameDesign);
    expect(geomResult.ok).toBe(true);
    if (!geomResult.ok) return;

    const data = createWorkshopPdfData(longNameDesign, geomResult.geometry);
    const pdfBytes = await generateWorkshopPdf(data, {
      generatedAt: fixedDate,
    });

    const reloadedDoc = await PDFDocument.load(pdfBytes);
    expect(reloadedDoc.getPageCount()).toBeGreaterThanOrEqual(6);
  });
});
