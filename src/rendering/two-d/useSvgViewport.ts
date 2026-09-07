import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { DrawingBounds } from './drawingModel';

export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UseSvgViewportOptions {
  bounds: DrawingBounds;
  minZoomFactor?: number; // Minimum zoom relative to fit (e.g. 0.5 = 2x zoomed out)
  maxZoomFactor?: number; // Maximum zoom relative to fit (e.g. 20 = 20x zoomed in)
}

export interface UseSvgViewportResult {
  viewBox: ViewBox;
  viewBoxString: string;
  svgRef: React.RefObject<SVGSVGElement | null>;
  isPanning: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToView: () => void;
  handlePointerDown: (e: React.PointerEvent<SVGSVGElement>) => void;
  handlePointerMove: (e: React.PointerEvent<SVGSVGElement>) => void;
  handlePointerUp: (e: React.PointerEvent<SVGSVGElement>) => void;
  handlePointerCancel: (e: React.PointerEvent<SVGSVGElement>) => void;
  applyZoom: (factor: number, focalPoint?: { x: number; y: number }) => void;
}

export function calculateFitViewBox(bounds: DrawingBounds): ViewBox {
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  return {
    x: bounds.minX,
    y: -bounds.maxY,
    width,
    height,
  };
}

export function useSvgViewport({
  bounds,
  minZoomFactor = 0.5,
  maxZoomFactor = 20,
}: UseSvgViewportOptions): UseSvgViewportResult {
  const fitViewBox = useMemo(() => calculateFitViewBox(bounds), [bounds]);

  const [prevFitViewBox, setPrevFitViewBox] = useState<ViewBox>(fitViewBox);
  const [viewBox, setViewBox] = useState<ViewBox>(fitViewBox);
  const [isPanning, setIsPanning] = useState(false);

  // Synchronize state during rendering when fit bounds change
  if (
    fitViewBox.x !== prevFitViewBox.x ||
    fitViewBox.y !== prevFitViewBox.y ||
    fitViewBox.width !== prevFitViewBox.width ||
    fitViewBox.height !== prevFitViewBox.height
  ) {
    setPrevFitViewBox(fitViewBox);
    setViewBox(fitViewBox);
  }

  const svgRef = useRef<SVGSVGElement | null>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{
    clientX: number;
    clientY: number;
    viewBoxX: number;
    viewBoxY: number;
  }>({
    clientX: 0,
    clientY: 0,
    viewBoxX: fitViewBox.x,
    viewBoxY: fitViewBox.y,
  });

  const applyZoom = useCallback(
    (factor: number, focalPoint?: { x: number; y: number }) => {
      setViewBox((current) => {
        const minWidth = fitViewBox.width / maxZoomFactor;
        const maxWidth = fitViewBox.width / minZoomFactor;

        const targetWidth = current.width * factor;
        const clampedWidth = Math.min(Math.max(targetWidth, minWidth), maxWidth);
        const actualRatio = clampedWidth / current.width;

        const newWidth = clampedWidth;
        const newHeight = current.height * actualRatio;

        const fx = focalPoint ? focalPoint.x : current.x + current.width / 2;
        const fy = focalPoint ? focalPoint.y : current.y + current.height / 2;

        const newX = fx - (fx - current.x) * actualRatio;
        const newY = fy - (fy - current.y) * actualRatio;

        return {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        };
      });
    },
    [fitViewBox.width, maxZoomFactor, minZoomFactor],
  );

  const zoomIn = useCallback(() => {
    applyZoom(1 / 1.25);
  }, [applyZoom]);

  const zoomOut = useCallback(() => {
    applyZoom(1.25);
  }, [applyZoom]);

  const fitToView = useCallback(() => {
    setViewBox(fitViewBox);
  }, [fitViewBox]);

  // Pointer panning handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      // Only handle primary pointer (e.g. left click)
      if (e.button !== 0) return;

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Safe fallback in test environments
      }

      isPanningRef.current = true;
      setIsPanning(true);
      panStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        viewBoxX: viewBox.x,
        viewBoxY: viewBox.y,
      };
    },
    [viewBox.x, viewBox.y],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!isPanningRef.current) return;

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    setViewBox((current) => {
      const currentScaleX = current.width / rect.width;
      const currentScaleY = current.height / rect.height;

      const deltaX = (e.clientX - panStartRef.current.clientX) * currentScaleX;
      const deltaY = (e.clientY - panStartRef.current.clientY) * currentScaleY;

      return {
        ...current,
        x: panStartRef.current.viewBoxX - deltaX,
        y: panStartRef.current.viewBoxY - deltaY,
      };
    });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!isPanningRef.current) return;
    isPanningRef.current = false;
    setIsPanning(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }
  }, []);

  const handlePointerCancel = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!isPanningRef.current) return;
    isPanningRef.current = false;
    setIsPanning(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Wheel zoom handler attached with non-passive listener to prevent window scrolling
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      setViewBox((current) => {
        const fx = current.x + ((e.clientX - rect.left) / rect.width) * current.width;
        const fy = current.y + ((e.clientY - rect.top) / rect.height) * current.height;

        const factor = e.deltaY < 0 ? 0.85 : 1 / 0.85;

        const minWidth = fitViewBox.width / maxZoomFactor;
        const maxWidth = fitViewBox.width / minZoomFactor;

        const targetWidth = current.width * factor;
        const clampedWidth = Math.min(Math.max(targetWidth, minWidth), maxWidth);
        const actualRatio = clampedWidth / current.width;

        const newWidth = clampedWidth;
        const newHeight = current.height * actualRatio;

        const newX = fx - (fx - current.x) * actualRatio;
        const newY = fy - (fy - current.y) * actualRatio;

        return {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        };
      });
    };

    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      svg.removeEventListener('wheel', handleWheel);
    };
  }, [fitViewBox, maxZoomFactor, minZoomFactor]);

  const viewBoxString = `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`;

  return {
    viewBox,
    viewBoxString,
    svgRef,
    isPanning,
    zoomIn,
    zoomOut,
    fitToView,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    applyZoom,
  };
}
