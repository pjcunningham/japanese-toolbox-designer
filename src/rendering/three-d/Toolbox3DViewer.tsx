import React, { useState, useMemo, useCallback, Component, type ErrorInfo } from 'react';
import { Canvas } from '@react-three/fiber';
import type { ToolboxGeometryResult } from '../../domain/geometry';
import type { UnitSystem } from '../../domain/design';
import { createToolbox3DModel } from './model/createToolbox3DModel';
import type { Toolbox3DModel } from './model/toolbox3DModel';
import { Toolbox3DScene } from './Toolbox3DScene';
import type { StandardCameraView } from './camera/cameraFit';
import './threeD.css';

export interface Toolbox3DViewerProps {
  geometryResult: ToolboxGeometryResult;
  unitSystem: UnitSystem;
  hasInputErrors?: boolean;
  className?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class WebGLFallbackErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('WebGL / 3D Viewer rendering error caught:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const CAMERA_VIEWS: Array<{ key: StandardCameraView; label: string }> = [
  { key: 'perspective', label: 'Perspective' },
  { key: 'front', label: 'Front' },
  { key: 'end', label: 'End' },
  { key: 'top', label: 'Top' },
];

export const Toolbox3DViewer: React.FC<Toolbox3DViewerProps> = ({
  geometryResult,
  hasInputErrors = false,
  className = '',
}) => {
  const [activeView, setActiveView] = useState<StandardCameraView>('perspective');
  const [resetSignal, setResetSignal] = useState<number>(0);

  const model: Toolbox3DModel | null = useMemo(() => {
    if (hasInputErrors || !geometryResult.ok) {
      return null;
    }
    return createToolbox3DModel(geometryResult.geometry);
  }, [hasInputErrors, geometryResult]);

  const handleFitToView = useCallback(() => {
    setResetSignal((s) => s + 1);
  }, []);

  const handleViewChange = useCallback((view: StandardCameraView) => {
    setActiveView(view);
    setResetSignal((s) => s + 1);
  }, []);

  const isUnavailable = hasInputErrors || !geometryResult.ok || !model;

  return (
    <section
      className={`toolbox-3d-container ${className}`}
      aria-label="Interactive 3D model of Japanese Toolbox"
      data-testid="toolbox-3d-viewer"
      data-model-part-count={model ? model.metadata.partCount : undefined}
      data-model-length={model ? model.metadata.length : undefined}
      data-model-width={model ? model.metadata.width : undefined}
      data-model-height={model ? model.metadata.height : undefined}
      data-camera-view={activeView}
    >
      {/* Header with Camera View Selector */}
      <div className="toolbox-3d-header">
        <h2 className="toolbox-3d-title">3D Interactive Model</h2>
        <div className="toolbox-3d-tabs" role="tablist" aria-label="3D Camera Views">
          {CAMERA_VIEWS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeView === key}
              className={`toolbox-3d-tab ${activeView === key ? 'active' : ''}`}
              onClick={() => handleViewChange(key)}
              disabled={isUnavailable}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Canvas / Unavailable Fallback */}
      <div className="toolbox-3d-canvas-wrapper">
        {hasInputErrors ? (
          <div className="toolbox-3d-unavailable" data-testid="3d-input-error">
            <div className="toolbox-3d-unavailable-icon" aria-hidden="true">
              ⚠️
            </div>
            <p className="toolbox-3d-unavailable-text">
              3D model unavailable until the input errors are corrected.
            </p>
          </div>
        ) : !geometryResult.ok ? (
          <div className="toolbox-3d-unavailable" data-testid="3d-geometry-error">
            <div className="toolbox-3d-unavailable-icon" aria-hidden="true">
              ⚠️
            </div>
            <p className="toolbox-3d-unavailable-text">
              3D model unavailable until the design geometry is valid.
            </p>
          </div>
        ) : model ? (
          <WebGLFallbackErrorBoundary
            fallback={
              <div className="toolbox-3d-unavailable" data-testid="3d-webgl-fallback">
                <div className="toolbox-3d-unavailable-icon" aria-hidden="true">
                  ⚙️
                </div>
                <p className="toolbox-3d-unavailable-text">
                  The 3D viewer could not be started in this browser. The 2D technical drawings
                  remain available.
                </p>
              </div>
            }
          >
            <Canvas
              className="toolbox-3d-canvas"
              dpr={[1, 2]}
              gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
            >
              <Toolbox3DScene model={model} activeView={activeView} resetSignal={resetSignal} />
            </Canvas>
          </WebGLFallbackErrorBoundary>
        ) : null}
      </div>

      {/* Footer bar with Help Text and Fit to view */}
      <div className="toolbox-3d-controls-bar">
        <span className="toolbox-3d-hint">Drag to orbit · Wheel to zoom · Right-drag to pan</span>
        <div className="toolbox-3d-actions">
          <button
            type="button"
            className="toolbox-3d-fit-btn"
            onClick={handleFitToView}
            aria-label="Fit to view"
            disabled={isUnavailable}
          >
            Fit to view
          </button>
        </div>
      </div>
    </section>
  );
};

export default Toolbox3DViewer;
