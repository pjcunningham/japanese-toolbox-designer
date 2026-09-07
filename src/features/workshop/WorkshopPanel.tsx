import React, { useState, useMemo } from 'react';
import type { WorkshopPanelProps, WorkshopTab } from './types';
import { createCutList, createProcessPlan } from '../../manufacturing';
import { CutListView } from './CutListView';
import { ProcessPlanView } from './ProcessPlanView';
import './workshop.css';

export const WorkshopPanel: React.FC<WorkshopPanelProps> = ({
  geometryResult,
  unitSystem,
  design,
  hasInputErrors,
}) => {
  const [activeTab, setActiveTab] = useState<WorkshopTab>('cut-list');

  const isGeometryValid = geometryResult.ok;
  const isAvailable = !hasInputErrors && isGeometryValid;

  const cutList = useMemo(() => {
    if (!geometryResult.ok) return null;
    return createCutList(geometryResult.geometry);
  }, [geometryResult]);

  const processPlan = useMemo(() => {
    if (!geometryResult.ok) return null;
    return createProcessPlan(geometryResult.geometry);
  }, [geometryResult]);

  return (
    <section
      className={`workshop-panel ${!isAvailable ? 'is-stale' : ''}`}
      aria-labelledby="workshop-heading"
      data-testid="workshop-panel"
    >
      <div className="workshop-header-row">
        <div className="workshop-title-area">
          <h2 id="workshop-heading" className="workshop-main-title">
            Workshop
          </h2>
          <p className="workshop-subtitle">
            Authoritative workshop cut list and step-by-step construction process plan.
          </p>
        </div>

        <div className="workshop-tab-toggle-group" role="tablist" aria-label="Workshop Views">
          <button
            type="button"
            role="tab"
            id="tab-workshop-cutlist"
            aria-selected={activeTab === 'cut-list'}
            aria-controls="panel-workshop-cutlist"
            className={`workshop-tab-btn ${activeTab === 'cut-list' ? 'active' : ''}`}
            onClick={() => setActiveTab('cut-list')}
          >
            Cut list
          </button>
          <button
            type="button"
            role="tab"
            id="tab-workshop-processplan"
            aria-selected={activeTab === 'process-plan'}
            aria-controls="panel-workshop-processplan"
            className={`workshop-tab-btn ${activeTab === 'process-plan' ? 'active' : ''}`}
            onClick={() => setActiveTab('process-plan')}
          >
            Process plan
          </button>
        </div>
      </div>

      {!isAvailable ? (
        <div
          className="workshop-unavailable-message"
          role="status"
          data-testid="workshop-unavailable-message"
        >
          <p>
            {hasInputErrors
              ? 'Fix input errors to update workshop information.'
              : 'Cut list and process plan are available when the design geometry is valid.'}
          </p>
        </div>
      ) : (
        <div className="workshop-tab-content">
          {activeTab === 'cut-list' && cutList && (
            <div id="panel-workshop-cutlist" role="tabpanel" aria-labelledby="tab-workshop-cutlist">
              <CutListView cutList={cutList} unitSystem={unitSystem} design={design} />
            </div>
          )}

          {activeTab === 'process-plan' && processPlan && (
            <div
              id="panel-workshop-processplan"
              role="tabpanel"
              aria-labelledby="tab-workshop-processplan"
            >
              <ProcessPlanView processPlan={processPlan} unitSystem={unitSystem} design={design} />
            </div>
          )}
        </div>
      )}
    </section>
  );
};
