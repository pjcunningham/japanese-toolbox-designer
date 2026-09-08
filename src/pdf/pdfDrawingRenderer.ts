import { degrees, type PDFPage, type PDFFont } from 'pdf-lib';
import type { TechnicalDrawingModel } from '../rendering/two-d/drawingModel';
import type { UnitSystem } from '../domain/design';
import { formatDimension } from '../domain/units';
import { toPdfSafeText } from './pdfText';
import {
  fitDrawingBoundsToRect,
  COLOR_DRAWING_VISIBLE,
  COLOR_DRAWING_HIDDEN,
  COLOR_DRAWING_CONSTRUCTION,
  COLOR_DRAWING_DIMENSION,
  COLOR_DRAWING_FILL,
  COLOR_TEXT_PRIMARY,
  COLOR_TEXT_SECONDARY,
} from './pdfLayout';
import type { Rect } from './types';

export interface DrawingRendererFonts {
  regular: PDFFont;
  bold: PDFFont;
}

export interface VerticalDimensionPlacement {
  x: number;
  y: number;
  rotationDegrees: number;
}

/**
 * Calculates deterministic placement and rotation for vertical (Y-axis) dimension labels in PDF space.
 * Uses normal technical drawing convention: text reads bottom-to-top (+90 degrees counter-clockwise in PDF coordinate space).
 */
export function calculateVerticalDimensionTextPlacement(
  pdfXDim: number,
  pdfY1: number,
  pdfY2: number,
  textWidth: number,
  fontSize: number,
  offset: number,
  gap: number = 3.5,
): VerticalDimensionPlacement {
  const midY = (pdfY1 + pdfY2) / 2;
  const startY = midY - textWidth / 2;
  const textX = offset > 0 ? pdfXDim + gap + fontSize * 0.75 : pdfXDim - gap;

  return {
    x: textX,
    y: startY,
    rotationDegrees: 90,
  };
}

/**
 * Draws arrowheads for horizontal dimension lines.
 */
function drawHorizontalArrows(page: PDFPage, x1: number, x2: number, y: number): void {
  const arrowLength = 4.5;
  const halfWidth = 1.8;

  // Left arrow pointing right
  page.drawLine({
    start: { x: x1, y },
    end: { x: x1 + arrowLength, y: y + halfWidth },
    thickness: 0.6,
    color: COLOR_DRAWING_DIMENSION,
  });
  page.drawLine({
    start: { x: x1, y },
    end: { x: x1 + arrowLength, y: y - halfWidth },
    thickness: 0.6,
    color: COLOR_DRAWING_DIMENSION,
  });

  // Right arrow pointing left
  page.drawLine({
    start: { x: x2, y },
    end: { x: x2 - arrowLength, y: y + halfWidth },
    thickness: 0.6,
    color: COLOR_DRAWING_DIMENSION,
  });
  page.drawLine({
    start: { x: x2, y },
    end: { x: x2 - arrowLength, y: y - halfWidth },
    thickness: 0.6,
    color: COLOR_DRAWING_DIMENSION,
  });
}

/**
 * Draws arrowheads for vertical dimension lines.
 */
function drawVerticalArrows(page: PDFPage, x: number, y1: number, y2: number): void {
  const arrowLength = 4.5;
  const halfWidth = 1.8;

  // Bottom arrow pointing up
  page.drawLine({
    start: { x, y: y1 },
    end: { x: x - halfWidth, y: y1 + arrowLength },
    thickness: 0.6,
    color: COLOR_DRAWING_DIMENSION,
  });
  page.drawLine({
    start: { x, y: y1 },
    end: { x: x + halfWidth, y: y1 + arrowLength },
    thickness: 0.6,
    color: COLOR_DRAWING_DIMENSION,
  });

  // Top arrow pointing down
  page.drawLine({
    start: { x, y: y2 },
    end: { x: x - halfWidth, y: y2 - arrowLength },
    thickness: 0.6,
    color: COLOR_DRAWING_DIMENSION,
  });
  page.drawLine({
    start: { x, y: y2 },
    end: { x: x + halfWidth, y: y2 - arrowLength },
    thickness: 0.6,
    color: COLOR_DRAWING_DIMENSION,
  });
}

/**
 * Renders a complete TechnicalDrawingModel directly into vector PDF instructions.
 */
export function renderTechnicalDrawing(
  page: PDFPage,
  model: TechnicalDrawingModel,
  targetRect: Rect,
  unitSystem: UnitSystem,
  fonts: DrawingRendererFonts,
): void {
  const fit = fitDrawingBoundsToRect(model.bounds, targetRect);

  // 1. Rectangles
  for (const rect of model.rectangles) {
    const pdfX = rect.x * fit.scale + fit.offsetX;
    const pdfY = rect.y * fit.scale + fit.offsetY;
    const pdfW = rect.width * fit.scale;
    const pdfH = rect.height * fit.scale;

    if (rect.hidden) {
      page.drawRectangle({
        x: pdfX,
        y: pdfY,
        width: pdfW,
        height: pdfH,
        borderWidth: 0.75,
        borderColor: COLOR_DRAWING_HIDDEN,
        borderDashArray: [4, 3],
      });
    } else {
      page.drawRectangle({
        x: pdfX,
        y: pdfY,
        width: pdfW,
        height: pdfH,
        borderWidth: 0.9,
        borderColor: COLOR_DRAWING_VISIBLE,
        color: COLOR_DRAWING_FILL,
      });
    }
  }

  // 2. Polygons
  for (const poly of model.polygons) {
    const pts = poly.points.map((p) => ({
      x: p.x * fit.scale + fit.offsetX,
      y: p.y * fit.scale + fit.offsetY,
    }));

    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i]!;
      const p2 = pts[(i + 1) % pts.length]!;

      page.drawLine({
        start: p1,
        end: p2,
        thickness: poly.hidden ? 0.75 : 0.9,
        color: poly.hidden ? COLOR_DRAWING_HIDDEN : COLOR_DRAWING_VISIBLE,
        ...(poly.hidden ? { dashArray: [4, 3] } : {}),
      });
    }
  }

  // 3. Lines
  for (const line of model.lines) {
    const p1 = {
      x: line.start.x * fit.scale + fit.offsetX,
      y: line.start.y * fit.scale + fit.offsetY,
    };
    const p2 = {
      x: line.end.x * fit.scale + fit.offsetX,
      y: line.end.y * fit.scale + fit.offsetY,
    };

    if (line.kind === 'visible') {
      page.drawLine({
        start: p1,
        end: p2,
        thickness: 0.9,
        color: COLOR_DRAWING_VISIBLE,
      });
    } else if (line.kind === 'hidden') {
      page.drawLine({
        start: p1,
        end: p2,
        thickness: 0.75,
        color: COLOR_DRAWING_HIDDEN,
        dashArray: [4, 3],
      });
    } else if (line.kind === 'construction') {
      page.drawLine({
        start: p1,
        end: p2,
        thickness: 0.5,
        color: COLOR_DRAWING_CONSTRUCTION,
        dashArray: [2, 2],
      });
    }
  }

  // 4. Dimensions
  for (const dim of model.dimensions) {
    const formatted = formatDimension(dim.valueMillimetres, unitSystem);
    const displayText = toPdfSafeText(dim.label ? `${dim.label}: ${formatted}` : formatted);

    if (dim.axis === 'x') {
      const x1 = Math.min(dim.start.x, dim.end.x);
      const x2 = Math.max(dim.start.x, dim.end.x);
      const yBase = dim.start.y;
      const yDim = yBase + dim.offset;

      const pdfX1 = x1 * fit.scale + fit.offsetX;
      const pdfX2 = x2 * fit.scale + fit.offsetX;
      const pdfYBase = yBase * fit.scale + fit.offsetY;
      const pdfYDim = yDim * fit.scale + fit.offsetY;
      const overshoot = dim.offset > 0 ? 5 : -5;

      // Extension lines
      page.drawLine({
        start: { x: pdfX1, y: pdfYBase },
        end: { x: pdfX1, y: pdfYDim + overshoot },
        thickness: 0.5,
        color: COLOR_DRAWING_DIMENSION,
      });
      page.drawLine({
        start: { x: pdfX2, y: pdfYBase },
        end: { x: pdfX2, y: pdfYDim + overshoot },
        thickness: 0.5,
        color: COLOR_DRAWING_DIMENSION,
      });

      // Dimension line
      page.drawLine({
        start: { x: pdfX1, y: pdfYDim },
        end: { x: pdfX2, y: pdfYDim },
        thickness: 0.6,
        color: COLOR_DRAWING_DIMENSION,
      });

      // Arrowheads
      drawHorizontalArrows(page, pdfX1, pdfX2, pdfYDim);

      // Label
      const textWidth = fonts.regular.widthOfTextAtSize(displayText, 7.5);
      const textX = (pdfX1 + pdfX2) / 2 - textWidth / 2;
      const textY = pdfYDim + (dim.offset > 0 ? 2.5 : -9);

      page.drawText(displayText, {
        x: textX,
        y: textY,
        size: 7.5,
        font: fonts.regular,
        color: COLOR_TEXT_PRIMARY,
      });
    } else if (dim.axis === 'y') {
      const y1 = Math.min(dim.start.y, dim.end.y);
      const y2 = Math.max(dim.start.y, dim.end.y);
      const xBase = dim.start.x;
      const xDim = xBase + dim.offset;

      const pdfY1 = y1 * fit.scale + fit.offsetY;
      const pdfY2 = y2 * fit.scale + fit.offsetY;
      const pdfXBase = xBase * fit.scale + fit.offsetX;
      const pdfXDim = xDim * fit.scale + fit.offsetX;
      const overshoot = dim.offset > 0 ? 5 : -5;

      // Extension lines
      page.drawLine({
        start: { x: pdfXBase, y: pdfY1 },
        end: { x: pdfXDim + overshoot, y: pdfY1 },
        thickness: 0.5,
        color: COLOR_DRAWING_DIMENSION,
      });
      page.drawLine({
        start: { x: pdfXBase, y: pdfY2 },
        end: { x: pdfXDim + overshoot, y: pdfY2 },
        thickness: 0.5,
        color: COLOR_DRAWING_DIMENSION,
      });

      // Dimension line
      page.drawLine({
        start: { x: pdfXDim, y: pdfY1 },
        end: { x: pdfXDim, y: pdfY2 },
        thickness: 0.6,
        color: COLOR_DRAWING_DIMENSION,
      });

      // Arrowheads
      drawVerticalArrows(page, pdfXDim, pdfY1, pdfY2);

      // Label (Vertically oriented, bottom-to-top reading direction)
      const fontSize = 7.5;
      const textWidth = fonts.regular.widthOfTextAtSize(displayText, fontSize);
      const placement = calculateVerticalDimensionTextPlacement(
        pdfXDim,
        pdfY1,
        pdfY2,
        textWidth,
        fontSize,
        dim.offset,
        3.5,
      );

      page.drawText(displayText, {
        x: placement.x,
        y: placement.y,
        size: fontSize,
        font: fonts.regular,
        color: COLOR_TEXT_PRIMARY,
        rotate: degrees(placement.rotationDegrees),
      });
    }
  }

  // 5. Annotations
  for (const ann of model.annotations) {
    const pdfX = ann.position.x * fit.scale + fit.offsetX;
    const pdfY = ann.position.y * fit.scale + fit.offsetY;
    const safeText = toPdfSafeText(ann.text);
    const textWidth = fonts.bold.widthOfTextAtSize(safeText, 7.5);

    let textX = pdfX - textWidth / 2;
    if (ann.align === 'left') {
      textX = pdfX;
    } else if (ann.align === 'right') {
      textX = pdfX - textWidth;
    }

    page.drawText(safeText, {
      x: textX,
      y: pdfY - 2.5,
      size: 7.5,
      font: fonts.bold,
      color: COLOR_TEXT_PRIMARY,
    });

    if (ann.secondaryText) {
      const safeSec = toPdfSafeText(ann.secondaryText);
      const secWidth = fonts.regular.widthOfTextAtSize(safeSec, 6.5);
      let secX = pdfX - secWidth / 2;
      if (ann.align === 'left') {
        secX = pdfX;
      } else if (ann.align === 'right') {
        secX = pdfX - secWidth;
      }

      page.drawText(safeSec, {
        x: secX,
        y: pdfY - 10,
        size: 6.5,
        font: fonts.regular,
        color: COLOR_TEXT_SECONDARY,
      });
    }
  }
}
