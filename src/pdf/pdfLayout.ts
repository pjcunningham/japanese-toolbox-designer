import { rgb } from 'pdf-lib';
import type { DrawingBounds } from '../rendering/two-d/drawingModel';
import type { Rect, DrawingFitResult } from './types';

export const A4_PORTRAIT_WIDTH = 595.28;
export const A4_PORTRAIT_HEIGHT = 841.89;

export const A4_LANDSCAPE_WIDTH = 841.89;
export const A4_LANDSCAPE_HEIGHT = 595.28;

export const PAGE_MARGIN = 36; // 0.5 inch / ~12.7 mm

// Standard colors for print-friendly workshop document
export const COLOR_TEXT_PRIMARY = rgb(0.1, 0.1, 0.1);
export const COLOR_TEXT_SECONDARY = rgb(0.35, 0.35, 0.35);
export const COLOR_RULE = rgb(0.8, 0.8, 0.8);
export const COLOR_HEADER_BG = rgb(0.93, 0.93, 0.93);
export const COLOR_ROW_ALT_BG = rgb(0.98, 0.98, 0.98);
export const COLOR_CARD_BG = rgb(0.97, 0.97, 0.97);

// Drawing line & fill colors
export const COLOR_DRAWING_VISIBLE = rgb(0.1, 0.1, 0.1);
export const COLOR_DRAWING_HIDDEN = rgb(0.35, 0.35, 0.35);
export const COLOR_DRAWING_CONSTRUCTION = rgb(0.6, 0.6, 0.6);
export const COLOR_DRAWING_DIMENSION = rgb(0.25, 0.25, 0.25);
export const COLOR_DRAWING_FILL = rgb(0.96, 0.96, 0.96);

/**
 * Fits a model's DrawingBounds into a target PDF rectangle while preserving
 * aspect ratio and centering the result.
 */
export function fitDrawingBoundsToRect(bounds: DrawingBounds, targetRect: Rect): DrawingFitResult {
  const modelWidth = Math.max(bounds.maxX - bounds.minX, 1e-4);
  const modelHeight = Math.max(bounds.maxY - bounds.minY, 1e-4);

  const scale = Math.min(targetRect.width / modelWidth, targetRect.height / modelHeight);

  const fittedWidth = modelWidth * scale;
  const fittedHeight = modelHeight * scale;

  const offsetX = targetRect.x + (targetRect.width - fittedWidth) / 2 - bounds.minX * scale;
  const offsetY = targetRect.y + (targetRect.height - fittedHeight) / 2 - bounds.minY * scale;

  return {
    scale,
    offsetX,
    offsetY,
    fittedWidth,
    fittedHeight,
  };
}
