import { describe, it, expect } from 'vitest';
import { fitDrawingBoundsToRect } from './pdfLayout';
import type { DrawingBounds } from '../rendering/two-d/drawingModel';
import type { Rect } from './types';

describe('fitDrawingBoundsToRect', () => {
  const targetRect: Rect = {
    x: 36,
    y: 50,
    width: 769.89,
    height: 480,
  };

  it('fits a wide drawing (Plan view) within target rectangle preserving aspect ratio', () => {
    const wideBounds: DrawingBounds = {
      minX: -50,
      minY: -30,
      maxX: 650,
      maxY: 330,
    };

    const fit = fitDrawingBoundsToRect(wideBounds, targetRect);
    expect(fit.scale).toBeGreaterThan(0);
    expect(fit.fittedWidth).toBeLessThanOrEqual(targetRect.width + 1e-4);
    expect(fit.fittedHeight).toBeLessThanOrEqual(targetRect.height + 1e-4);

    // Verify drawing bounds transformed to PDF coordinates stay inside targetRect
    const minPdfX = wideBounds.minX * fit.scale + fit.offsetX;
    const maxPdfX = wideBounds.maxX * fit.scale + fit.offsetX;
    const minPdfY = wideBounds.minY * fit.scale + fit.offsetY;
    const maxPdfY = wideBounds.maxY * fit.scale + fit.offsetY;

    expect(minPdfX).toBeGreaterThanOrEqual(targetRect.x - 1e-4);
    expect(maxPdfX).toBeLessThanOrEqual(targetRect.x + targetRect.width + 1e-4);
    expect(minPdfY).toBeGreaterThanOrEqual(targetRect.y - 1e-4);
    expect(maxPdfY).toBeLessThanOrEqual(targetRect.y + targetRect.height + 1e-4);
  });

  it('fits a tall drawing (End view) within target rectangle preserving aspect ratio', () => {
    const tallBounds: DrawingBounds = {
      minX: -50,
      minY: -30,
      maxX: 350,
      maxY: 600,
    };

    const fit = fitDrawingBoundsToRect(tallBounds, targetRect);
    expect(fit.scale).toBeGreaterThan(0);
    expect(fit.fittedWidth).toBeLessThanOrEqual(targetRect.width + 1e-4);
    expect(fit.fittedHeight).toBeLessThanOrEqual(targetRect.height + 1e-4);
  });

  it('handles zero or tiny model bounds safely without division by zero', () => {
    const zeroBounds: DrawingBounds = {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
    };

    const fit = fitDrawingBoundsToRect(zeroBounds, targetRect);
    expect(fit.scale).toBeGreaterThan(0);
    expect(Number.isFinite(fit.offsetX)).toBe(true);
    expect(Number.isFinite(fit.offsetY)).toBe(true);
  });
});
