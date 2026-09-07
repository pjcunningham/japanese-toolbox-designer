import { describe, it, expect } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { renderTechnicalDrawing } from './pdfDrawingRenderer';
import type { TechnicalDrawingModel } from '../rendering/two-d/drawingModel';
import { A4_LANDSCAPE_WIDTH, A4_LANDSCAPE_HEIGHT, PAGE_MARGIN } from './pdfLayout';

describe('renderTechnicalDrawing', () => {
  it('renders synthetic TechnicalDrawingModel onto a PDF page without errors', async () => {
    const doc = await PDFDocument.create();
    const regularFont = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    const page = doc.addPage([A4_LANDSCAPE_WIDTH, A4_LANDSCAPE_HEIGHT]);

    const syntheticModel: TechnicalDrawingModel = {
      view: 'plan',
      title: 'Plan View',
      description: 'Synthetic plan test drawing',
      bounds: {
        minX: -50,
        minY: -50,
        maxX: 650,
        maxY: 350,
      },
      rectangles: [
        {
          id: 'rect-1',
          part: 'body',
          x: 0,
          y: 0,
          width: 600,
          height: 300,
        },
        {
          id: 'rect-hidden',
          part: 'bottom',
          x: 20,
          y: 20,
          width: 560,
          height: 260,
          hidden: true,
        },
      ],
      polygons: [
        {
          id: 'poly-1',
          part: 'locking-wedge',
          points: [
            { x: 100, y: 100 },
            { x: 200, y: 110 },
            { x: 200, y: 140 },
            { x: 100, y: 130 },
          ],
        },
        {
          id: 'poly-hidden',
          part: 'locking-lid-batten',
          points: [
            { x: 210, y: 100 },
            { x: 300, y: 100 },
            { x: 300, y: 140 },
            { x: 210, y: 140 },
          ],
          hidden: true,
        },
      ],
      lines: [
        {
          id: 'line-vis',
          kind: 'visible',
          part: 'side',
          start: { x: 0, y: 0 },
          end: { x: 600, y: 0 },
        },
        {
          id: 'line-hid',
          kind: 'hidden',
          part: 'end',
          start: { x: 0, y: 300 },
          end: { x: 600, y: 300 },
        },
        {
          id: 'line-const',
          kind: 'construction',
          part: 'body',
          start: { x: 300, y: 0 },
          end: { x: 300, y: 300 },
        },
      ],
      dimensions: [
        {
          id: 'dim-x',
          axis: 'x',
          start: { x: 0, y: 0 },
          end: { x: 600, y: 0 },
          offset: -30,
          valueMillimetres: 600,
          label: 'Length',
        },
        {
          id: 'dim-y',
          axis: 'y',
          start: { x: 0, y: 0 },
          end: { x: 0, y: 300 },
          offset: -30,
          valueMillimetres: 300,
        },
      ],
      annotations: [
        {
          id: 'ann-1',
          position: { x: 300, y: 150 },
          text: 'Center Line',
          secondaryText: 'Reference axis',
          align: 'center',
        },
      ],
    };

    const targetRect = {
      x: PAGE_MARGIN,
      y: 48,
      width: A4_LANDSCAPE_WIDTH - PAGE_MARGIN * 2,
      height: A4_LANDSCAPE_HEIGHT - 48 - PAGE_MARGIN,
    };

    expect(() => {
      renderTechnicalDrawing(page, syntheticModel, targetRect, 'metric', {
        regular: regularFont,
        bold: boldFont,
      });
    }).not.toThrow();

    const pdfBytes = await doc.save();
    expect(pdfBytes.length).toBeGreaterThan(500);
  });
});
