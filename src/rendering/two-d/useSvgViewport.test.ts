import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSvgViewport, calculateFitViewBox } from './useSvgViewport';
import type { DrawingBounds } from './drawingModel';

describe('useSvgViewport Hook (Requirements 73–75)', () => {
  const sampleBounds: DrawingBounds = {
    minX: -50,
    minY: -40,
    maxX: 650,
    maxY: 340,
  };

  it('calculates initial fit viewBox matching model bounds with positive dimensions', () => {
    const fit = calculateFitViewBox(sampleBounds);

    expect(fit.x).toBe(-50);
    expect(fit.y).toBe(-340);
    expect(fit.width).toBe(700);
    expect(fit.height).toBe(380);
  });

  it('initializes hook state to fitted viewBox', () => {
    const { result } = renderHook(() => useSvgViewport({ bounds: sampleBounds }));

    expect(result.current.viewBox.x).toBe(-50);
    expect(result.current.viewBox.y).toBe(-340);
    expect(result.current.viewBox.width).toBe(700);
    expect(result.current.viewBox.height).toBe(380);
    expect(result.current.viewBoxString).toBe('-50 -340 700 380');
  });

  it('zooms in reducing viewBox dimensions around center', () => {
    const { result } = renderHook(() => useSvgViewport({ bounds: sampleBounds }));

    act(() => {
      result.current.zoomIn();
    });

    expect(result.current.viewBox.width).toBeLessThan(700);
    expect(result.current.viewBox.height).toBeLessThan(380);
    expect(result.current.viewBox.width).toBeCloseTo(700 / 1.25, 4);
    expect(result.current.viewBox.height).toBeCloseTo(380 / 1.25, 4);
  });

  it('zooms out increasing viewBox dimensions around center', () => {
    const { result } = renderHook(() => useSvgViewport({ bounds: sampleBounds }));

    act(() => {
      result.current.zoomOut();
    });

    expect(result.current.viewBox.width).toBeGreaterThan(700);
    expect(result.current.viewBox.height).toBeGreaterThan(380);
    expect(result.current.viewBox.width).toBeCloseTo(700 * 1.25, 4);
  });

  it('enforces zoom limits preventing zero or runaway dimensions', () => {
    const { result } = renderHook(() =>
      useSvgViewport({ bounds: sampleBounds, minZoomFactor: 0.5, maxZoomFactor: 20 }),
    );

    // Zoom in many times
    act(() => {
      for (let i = 0; i < 50; i++) {
        result.current.zoomIn();
      }
    });

    const minWidth = 700 / 20;
    expect(result.current.viewBox.width).toBeCloseTo(minWidth, 4);
    expect(result.current.viewBox.width).toBeGreaterThan(0);
    expect(result.current.viewBox.height).toBeGreaterThan(0);

    // Zoom out many times
    act(() => {
      for (let i = 0; i < 50; i++) {
        result.current.zoomOut();
      }
    });

    const maxWidth = 700 / 0.5;
    expect(result.current.viewBox.width).toBeCloseTo(maxWidth, 4);
  });

  it('restores initial fitted bounds when fitToView is called', () => {
    const { result } = renderHook(() => useSvgViewport({ bounds: sampleBounds }));

    act(() => {
      result.current.zoomIn();
      result.current.zoomIn();
    });

    expect(result.current.viewBox.width).not.toBe(700);

    act(() => {
      result.current.fitToView();
    });

    expect(result.current.viewBox.x).toBe(-50);
    expect(result.current.viewBox.y).toBe(-340);
    expect(result.current.viewBox.width).toBe(700);
    expect(result.current.viewBox.height).toBe(380);
  });

  it('automatically resets to fit when bounds change', () => {
    let currentBounds = sampleBounds;
    const { result, rerender } = renderHook(() => useSvgViewport({ bounds: currentBounds }));

    act(() => {
      result.current.zoomIn();
    });

    const newBounds: DrawingBounds = {
      minX: -60,
      minY: -50,
      maxX: 800,
      maxY: 400,
    };
    currentBounds = newBounds;
    rerender();

    expect(result.current.viewBox.x).toBe(-60);
    expect(result.current.viewBox.y).toBe(-400);
    expect(result.current.viewBox.width).toBe(860);
    expect(result.current.viewBox.height).toBe(450);
  });
});
