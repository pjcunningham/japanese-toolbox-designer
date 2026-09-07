import React, { useState, useMemo, useCallback } from 'react';
import type { ToolboxGeometryResult } from '../../domain/geometry';
import type { UnitSystem, ToolboxDesign } from '../../domain/design';
import type { TechnicalDrawingView, TechnicalDrawingModel } from './drawingModel';
import { createFrontDrawing } from './frontProjection';
import { createPlanDrawing } from './planProjection';
import { createEndDrawing } from './endProjection';
import { SvgTechnicalDrawing } from './SvgTechnicalDrawing';
import { useSvgViewport } from './useSvgViewport';
import './technicalDrawing.css';

export interface TechnicalDrawingViewerProps {
  geometryResult: ToolboxGeometryResult;
  unitSystem: UnitSystem;
  hasInputErrors?: boolean;
  design?: ToolboxDesign;
  className?: string;
}

const TABS: Array<{ key: TechnicalDrawingView; label: string }> = [
  { key: 'front', label: 'Front' },
  { key: 'plan', label: 'Plan' },
  { key: 'end', label: 'End' },
];

export const TechnicalDrawingViewer: React.FC<TechnicalDrawingViewerProps> = ({
  geometryResult,
  unitSystem,
  hasInputErrors = false,
  className = '',
}) => {
  // Plan view is default active view
  const [activeView, setActiveView] = useState<TechnicalDrawingView>('plan');

  const model: TechnicalDrawingModel | null = useMemo(() => {
    if (hasInputErrors || !geometryResult.ok) {
      return null;
    }

    const geometry = geometryResult.geometry;
    switch (activeView) {
      case 'front':
        return createFrontDrawing(geometry);
      case 'plan':
        return createPlanDrawing(geometry);
      case 'end':
        return createEndDrawing(geometry);
      default:
        return createPlanDrawing(geometry);
    }
  }, [hasInputErrors, geometryResult, activeView]);

  // Fallback bounds for hooks when model is null
  const bounds = useMemo(
    () => model?.bounds ?? { minX: 0, minY: 0, maxX: 600, maxY: 300 },
    [model?.bounds],
  );

  const viewport = useSvgViewport({ bounds });

  const handleTabClick = useCallback(
    (view: TechnicalDrawingView) => {
      setActiveView(view);
      viewport.fitToView();
    },
    [viewport],
  );

  return (
    <section
      className={`technical-drawing-card ${className}`}
      aria-labelledby="technical-drawings-heading"
    >
      <div className="technical-drawing-header">
        <h2 id="technical-drawings-heading" className="technical-drawing-title">
          Technical drawings
        </h2>

        {/* View Tabs */}
        <div className="technical-drawing-tabs" role="tablist" aria-label="Technical drawing views">
          {TABS.map((tab) => {
            const isActive = activeView === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                id={`tab-${tab.key}`}
                aria-selected={isActive}
                aria-controls="technical-drawing-panel"
                className={`technical-drawing-tab ${isActive ? 'is-active' : ''}`}
                onClick={() => handleTabClick(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Drawing Area */}
      <div
        id="technical-drawing-panel"
        role="tabpanel"
        aria-labelledby={`tab-${activeView}`}
        className="technical-drawing-viewer"
      >
        {hasInputErrors ? (
          <div className="drawing-unavailable-state" data-testid="drawing-input-error">
            <div className="drawing-unavailable-icon" aria-hidden="true">
              ✏️
            </div>
            <p className="drawing-unavailable-text">
              Fix input errors to update the technical drawing.
            </p>
          </div>
        ) : !geometryResult.ok ? (
          <div className="drawing-unavailable-state" data-testid="drawing-geometry-error">
            <div className="drawing-unavailable-icon" aria-hidden="true">
              ⚠️
            </div>
            <p className="drawing-unavailable-text">
              Technical drawing unavailable until the design geometry is valid.
            </p>
          </div>
        ) : model ? (
          <SvgTechnicalDrawing model={model} unitSystem={unitSystem} viewport={viewport} />
        ) : null}
      </div>

      {/* Zoom / Viewport Controls */}
      <div className="technical-drawing-controls">
        <button
          type="button"
          className="drawing-control-btn"
          onClick={viewport.zoomOut}
          aria-label="Zoom out"
          title="Zoom out"
          disabled={hasInputErrors || !geometryResult.ok}
        >
          −
        </button>
        <button
          type="button"
          className="drawing-control-btn"
          onClick={viewport.zoomIn}
          aria-label="Zoom in"
          title="Zoom in"
          disabled={hasInputErrors || !geometryResult.ok}
        >
          +
        </button>
        <button
          type="button"
          className="drawing-control-btn"
          onClick={viewport.fitToView}
          aria-label="Fit to view"
          disabled={hasInputErrors || !geometryResult.ok}
        >
          Fit to view
        </button>
      </div>
    </section>
  );
};
