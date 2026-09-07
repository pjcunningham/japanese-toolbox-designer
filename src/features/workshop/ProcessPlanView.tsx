import React from 'react';
import type { ProcessPlan, ProcessMeasurement } from '../../manufacturing';
import type { ToolboxDesign, UnitSystem } from '../../domain/design';
import { formatDimension } from '../../domain/units';
import { getWoodDefinition } from '../../materials';

export interface ProcessPlanViewProps {
  processPlan: ProcessPlan;
  unitSystem: UnitSystem;
  design: ToolboxDesign;
}

function formatProcessMeasurement(measurement: ProcessMeasurement, unitSystem: UnitSystem): string {
  switch (measurement.kind) {
    case 'linear':
      return formatDimension(measurement.value, unitSystem);
    case 'angle':
      return `${measurement.valueDegrees}°`;
    case 'text':
      return measurement.valueText;
    case 'boolean':
      return measurement.valueBoolean ? 'true' : 'false';
    default:
      return '';
  }
}

export const ProcessPlanView: React.FC<ProcessPlanViewProps> = ({
  processPlan,
  unitSystem,
  design,
}) => {
  const woodDef = getWoodDefinition(design.wood.id);
  const woodName = woodDef ? woodDef.name : design.wood.id;
  const unitLabel = unitSystem === 'metric' ? 'Metric' : 'Imperial';

  return (
    <div className="workshop-processplan-view" data-testid="workshop-processplan-view">
      <div className="workshop-view-header">
        <div className="workshop-metadata-badge">
          <span className="metadata-item design-name">{design.name}</span>
          <span className="metadata-separator">·</span>
          <span className="metadata-item wood-name">{woodName}</span>
          <span className="metadata-separator">·</span>
          <span className="metadata-item unit-system">{unitLabel}</span>
        </div>

        <div className="processplan-summary-pills">
          <span className="summary-pill steps-count-pill">
            <strong>{processPlan.steps.length}</strong> construction steps
          </span>
        </div>
      </div>

      <ol className="process-steps-list" aria-label="Construction process plan sequence">
        {processPlan.steps.map((step) => (
          <li
            key={step.id}
            data-testid={`process-step-${step.id}`}
            className={`process-step-card step-${step.id}`}
          >
            <details className="process-step-details" open>
              <summary className="process-step-summary">
                <span className="step-badge">Step {step.order}</span>
                <span className="step-title-text">{step.title}</span>
              </summary>

              <div className="step-content-body">
                {step.instructions.length > 0 && (
                  <ul className="step-instructions-list">
                    {step.instructions.map((instruction, idx) => (
                      <li key={idx}>{instruction}</li>
                    ))}
                  </ul>
                )}

                {step.measurements && step.measurements.length > 0 && (
                  <div className="step-measurements-panel">
                    <h4 className="step-measurements-title">Key Measurements</h4>
                    <dl className="step-measurements-grid">
                      {step.measurements.map((m, idx) => (
                        <div key={idx} className="step-measurement-item">
                          <dt className="measurement-label">{m.label}</dt>
                          <dd className="measurement-value">
                            {formatProcessMeasurement(m, unitSystem)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {step.notes && step.notes.length > 0 && (
                  <div className="step-notes-panel">
                    {step.notes.map((note, idx) => (
                      <p key={idx} className="step-note-text">
                        <strong>Note:</strong> {note}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </details>
          </li>
        ))}
      </ol>
    </div>
  );
};
