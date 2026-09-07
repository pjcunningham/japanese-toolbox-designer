import React from 'react';
import type { ToolboxGeometryResult } from '../../domain/geometry';

export interface ValidationPanelProps {
  hasInputErrors: boolean;
  geometryResult?: ToolboxGeometryResult;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  hasInputErrors,
  geometryResult,
}) => {
  if (hasInputErrors) {
    return (
      <div className="validation-panel validation-input-errors" role="alert">
        <div className="validation-header">
          <span className="validation-icon" aria-hidden="true">
            ⚠
          </span>
          <h3 className="validation-title">Input Attention Needed</h3>
        </div>
        <p className="validation-description">Fix input errors to update the calculated design.</p>
      </div>
    );
  }

  if (!geometryResult) {
    return null;
  }

  if (!geometryResult.ok) {
    return (
      <div
        className="validation-panel validation-geometry-errors"
        role="region"
        aria-label="Geometry validation issues"
      >
        <div className="validation-header">
          <span className="validation-icon" aria-hidden="true">
            ⚠
          </span>
          <h3 className="validation-title">Physical Geometry Issues</h3>
        </div>
        <ul className="validation-list error-list">
          {geometryResult.errors.map((error, idx) => (
            <li key={`${error.code}-${idx}`} className="validation-item error-item">
              <span className="validation-message">{error.message}</span>
            </li>
          ))}
        </ul>

        {geometryResult.warnings.length > 0 && (
          <div className="validation-warnings-subgroup">
            <h4 className="validation-subtitle">Warnings</h4>
            <ul className="validation-list warning-list">
              {geometryResult.warnings.map((warning, idx) => (
                <li key={`${warning.code}-${idx}`} className="validation-item warning-item">
                  <span className="validation-message">{warning.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (geometryResult.warnings.length > 0) {
    return (
      <div
        className="validation-panel validation-warnings-only"
        role="region"
        aria-label="Geometry validation warnings"
      >
        <div className="validation-header">
          <span className="validation-icon" aria-hidden="true">
            ℹ
          </span>
          <h3 className="validation-title">Geometry Warnings</h3>
        </div>
        <ul className="validation-list warning-list">
          {geometryResult.warnings.map((warning, idx) => (
            <li key={`${warning.code}-${idx}`} className="validation-item warning-item">
              <span className="validation-message">{warning.message}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
};
