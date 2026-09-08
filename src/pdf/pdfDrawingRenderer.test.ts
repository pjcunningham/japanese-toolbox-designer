import { describe, it, expect } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import {
  renderTechnicalDrawing,
  calculateVerticalDimensionTextPlacement,
} from './pdfDrawingRenderer';
import type { TechnicalDrawingModel } from '../rendering/two-d/drawingModel';
import { createDefaultToolboxDesign } from '../domain/defaults';
import { calculateToolboxGeometry } from '../domain/geometry';
import { createPlanDrawing } from '../rendering/two-d/planProjection';
import { createFrontDrawing } from '../rendering/two-d/frontProjection';
import {
  A4_LANDSCAPE_WIDTH,
  A4_LANDSCAPE_HEIGHT,
  PAGE_MARGIN,
  fitDrawingBoundsToRect,
} from './pdfLayout';
import { toPdfSafeText } from './pdfText';

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

  describe('calculateVerticalDimensionTextPlacement (Phase 13A)', () => {
    it('calculates deterministic vertical placement with 90 degree rotation', () => {
      const pdfXDim = 100;
      const pdfY1 = 50;
      const pdfY2 = 250;
      const textWidth = 80;
      const fontSize = 7.5;
      const offset = -35; // Left-side dimension

      const placement = calculateVerticalDimensionTextPlacement(
        pdfXDim,
        pdfY1,
        pdfY2,
        textWidth,
        fontSize,
        offset,
      );

      expect(placement.rotationDegrees).toBe(90);
      expect(placement.x).toBe(pdfXDim - 3.5);
      // Midpoint Y is 150. Start Y is 150 - 80 / 2 = 110.
      expect(placement.y).toBe(110);
      // Span is 50..250. Text spans 110..(110+80=190), strictly inside the dimension span.
      expect(placement.y).toBeGreaterThanOrEqual(pdfY1);
      expect(placement.y + textWidth).toBeLessThanOrEqual(pdfY2);
    });

    it('positions right-side vertical dimensions with positive offset', () => {
      const pdfXDim = 500;
      const pdfY1 = 100;
      const pdfY2 = 300;
      const textWidth = 60;
      const fontSize = 7.5;
      const offset = 35; // Right-side dimension

      const placement = calculateVerticalDimensionTextPlacement(
        pdfXDim,
        pdfY1,
        pdfY2,
        textWidth,
        fontSize,
        offset,
      );

      expect(placement.rotationDegrees).toBe(90);
      expect(placement.x).toBeGreaterThan(pdfXDim);
      expect(placement.y).toBe(200 - 30);
    });
  });

  describe('PDF Drawing Boundary Regression (Phase 13A)', () => {
    const defaultDesign = createDefaultToolboxDesign();
    const geoResult = calculateToolboxGeometry(defaultDesign);
    if (!geoResult.ok) throw new Error('Default geometry must be valid');
    const geometry = geoResult.geometry;

    const targetRect = {
      x: PAGE_MARGIN,
      y: 48,
      width: A4_LANDSCAPE_WIDTH - PAGE_MARGIN * 2,
      height: A4_LANDSCAPE_HEIGHT - 48 - PAGE_MARGIN,
    };

    it('keeps Plan Width Y dimension label inside drawing target bounds', async () => {
      const doc = await PDFDocument.create();
      const regularFont = await doc.embedFont(StandardFonts.Helvetica);

      const planModel = createPlanDrawing(geometry);
      const fit = fitDrawingBoundsToRect(planModel.bounds, targetRect);

      const widthDim = planModel.dimensions.find((d) => d.id === 'plan-dim-overall-width')!;
      expect(widthDim).toBeDefined();

      const displayText = 'Width Y: 300 mm';
      const fontSize = 7.5;
      const textWidth = regularFont.widthOfTextAtSize(displayText, fontSize);

      const y1 = Math.min(widthDim.start.y, widthDim.end.y);
      const y2 = Math.max(widthDim.start.y, widthDim.end.y);
      const xDim = widthDim.start.x + widthDim.offset;
      const pdfY1 = y1 * fit.scale + fit.offsetY;
      const pdfY2 = y2 * fit.scale + fit.offsetY;
      const pdfXDim = xDim * fit.scale + fit.offsetX;

      const placement = calculateVerticalDimensionTextPlacement(
        pdfXDim,
        pdfY1,
        pdfY2,
        textWidth,
        fontSize,
        widthDim.offset,
      );

      // Rotated 90 degrees: text bounding box in PDF page space:
      // X spans [placement.x - fontSize, placement.x]
      // Y spans [placement.y, placement.y + textWidth]
      const minTextX = placement.x - fontSize;
      const maxTextX = placement.x;
      const minTextY = placement.y;
      const maxTextY = placement.y + textWidth;

      // Ensure text is inside targetRect (or safely inside page margin > 0)
      expect(minTextX).toBeGreaterThanOrEqual(0);
      expect(minTextX).toBeGreaterThanOrEqual(PAGE_MARGIN / 2);
      expect(maxTextX).toBeLessThanOrEqual(targetRect.x + targetRect.width);
      expect(minTextY).toBeGreaterThanOrEqual(targetRect.y);
      expect(maxTextY).toBeLessThanOrEqual(targetRect.y + targetRect.height);
    });

    it('keeps Front Body Height dimension label inside drawing target bounds', async () => {
      const doc = await PDFDocument.create();
      const regularFont = await doc.embedFont(StandardFonts.Helvetica);

      const frontModel = createFrontDrawing(geometry);
      const fit = fitDrawingBoundsToRect(frontModel.bounds, targetRect);

      const heightDim = frontModel.dimensions.find((d) => d.id === 'front-dim-body-height')!;
      expect(heightDim).toBeDefined();

      const displayText = 'Body Height: 250 mm';
      const fontSize = 7.5;
      const textWidth = regularFont.widthOfTextAtSize(displayText, fontSize);

      const y1 = Math.min(heightDim.start.y, heightDim.end.y);
      const y2 = Math.max(heightDim.start.y, heightDim.end.y);
      const xDim = heightDim.start.x + heightDim.offset;
      const pdfY1 = y1 * fit.scale + fit.offsetY;
      const pdfY2 = y2 * fit.scale + fit.offsetY;
      const pdfXDim = xDim * fit.scale + fit.offsetX;

      const placement = calculateVerticalDimensionTextPlacement(
        pdfXDim,
        pdfY1,
        pdfY2,
        textWidth,
        fontSize,
        heightDim.offset,
      );

      const minTextX = placement.x - fontSize;
      expect(minTextX).toBeGreaterThanOrEqual(PAGE_MARGIN / 2);
    });

    it('ensures Front top annotations LOCKING END and Captured wedge do not collide in PDF layout', async () => {
      const doc = await PDFDocument.create();
      const regularFont = await doc.embedFont(StandardFonts.Helvetica);
      const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

      const frontModel = createFrontDrawing(geometry);
      const fit = fitDrawingBoundsToRect(frontModel.bounds, targetRect);

      const lockAnn = frontModel.annotations.find((a) => a.id === 'front-ann-locking-end')!;
      const wedgeAnn = frontModel.annotations.find((a) => a.id === 'front-ann-captured-wedge')!;
      expect(lockAnn).toBeDefined();
      expect(wedgeAnn).toBeDefined();

      // Compute bounding boxes in PDF space
      // LOCKING END:
      const lockPdfX = lockAnn.position.x * fit.scale + fit.offsetX;
      const lockPdfY = lockAnn.position.y * fit.scale + fit.offsetY;
      const lockWidth = boldFont.widthOfTextAtSize(toPdfSafeText(lockAnn.text), 7.5);
      const lockBox = {
        left: lockPdfX - lockWidth / 2,
        right: lockPdfX + lockWidth / 2,
        bottom: lockPdfY - 2.5,
        top: lockPdfY - 2.5 + 7.5,
      };

      // Captured wedge (primary + secondary):
      const wedgePdfX = wedgeAnn.position.x * fit.scale + fit.offsetX;
      const wedgePdfY = wedgeAnn.position.y * fit.scale + fit.offsetY;
      const wedgeWidth1 = boldFont.widthOfTextAtSize(toPdfSafeText(wedgeAnn.text), 7.5);
      const wedgeWidth2 = regularFont.widthOfTextAtSize(
        toPdfSafeText(wedgeAnn.secondaryText!),
        6.5,
      );
      const maxWedgeWidth = Math.max(wedgeWidth1, wedgeWidth2);
      const wedgeBox = {
        left: wedgePdfX - maxWedgeWidth / 2,
        right: wedgePdfX + maxWedgeWidth / 2,
        bottom: wedgePdfY - 10,
        top: wedgePdfY - 2.5 + 7.5,
      };

      // Check vertical separation or horizontal separation
      const verticalOverlap = !(lockBox.bottom >= wedgeBox.top || wedgeBox.bottom >= lockBox.top);
      const horizontalOverlap = !(lockBox.left >= wedgeBox.right || wedgeBox.left >= lockBox.right);

      // They must NOT overlap in both dimensions simultaneously
      const boxesOverlap = verticalOverlap && horizontalOverlap;
      expect(boxesOverlap).toBe(false);

      // Specifically, LOCKING END should sit on an upper row above Captured wedge
      expect(lockBox.bottom).toBeGreaterThan(wedgeBox.top);
    });
  });
});
