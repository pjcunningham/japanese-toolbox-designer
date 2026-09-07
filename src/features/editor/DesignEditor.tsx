import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { ToolboxDesign, UnitSystem } from '../../domain/design';
import { setDesignUnitSystem } from '../../domain/design';
import { parseDimension, formatDimension } from '../../domain/units';
import { calculateToolboxGeometry } from '../../domain/geometry';
import { DimensionField } from './DimensionField';
import { AngleField } from './AngleField';
import { UnitSelector } from './UnitSelector';
import { ValidationPanel } from './ValidationPanel';
import { CalculatedDimensionsPanel } from './CalculatedDimensionsPanel';
import { TechnicalDrawingViewer } from '../../rendering/two-d';
import type {
  DesignEditorProps,
  DimensionFieldKey,
  AngleFieldKey,
  DraftValues,
  FieldErrors,
} from './types';
import './editor.css';

function parseAngle(input: string): { ok: true; degrees: number } | { ok: false; error: string } {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { ok: false, error: 'Please enter an angle.' };
  }
  const withoutDegree = trimmed.replace(/°$/, '').trim();
  const num = Number(withoutDegree);
  if (isNaN(num) || !isFinite(num)) {
    return { ok: false, error: 'Invalid angle. Enter a numeric angle in degrees (e.g. 2.5).' };
  }
  return { ok: true, degrees: num };
}

function getInitialDrafts(design: ToolboxDesign): DraftValues {
  return {
    length: formatDimension(design.dimensions.length, design.unitSystem, { includeUnit: false }),
    width: formatDimension(design.dimensions.width, design.unitSystem, { includeUnit: false }),
    height: formatDimension(design.dimensions.height, design.unitSystem, { includeUnit: false }),
    stockThickness: formatDimension(design.dimensions.stockThickness, design.unitSystem, {
      includeUnit: false,
    }),
    lidThickness: formatDimension(design.constructionParameters.lidThickness, design.unitSystem, {
      includeUnit: false,
    }),
    fixedTopBattenWidth: formatDimension(
      design.constructionParameters.fixedTopBattenWidth,
      design.unitSystem,
      { includeUnit: false },
    ),
    lidBattenWidth: formatDimension(
      design.constructionParameters.lidBattenWidth,
      design.unitSystem,
      { includeUnit: false },
    ),
    lidSideClearance: formatDimension(
      design.constructionParameters.lidSideClearance,
      design.unitSystem,
      { includeUnit: false },
    ),
    desiredOverlap: formatDimension(
      design.constructionParameters.desiredOverlap,
      design.unitSystem,
      { includeUnit: false },
    ),
    lidBattenOverhang: formatDimension(
      design.constructionParameters.lidBattenOverhang,
      design.unitSystem,
      { includeUnit: false },
    ),
    lockingBattenTravelClearance: formatDimension(
      design.constructionParameters.lockingBattenTravelClearance,
      design.unitSystem,
      { includeUnit: false },
    ),
    wedgeTaperAngle: String(design.constructionParameters.wedgeTaperAngle),
    wedgeBevelAngle: String(design.constructionParameters.wedgeBevelAngle),
  };
}

export const DesignEditor: React.FC<DesignEditorProps> = ({
  design,
  onDesignChange,
  onInputValidityChange,
  className = '',
}) => {
  const [drafts, setDrafts] = useState<DraftValues>(() => getInitialDrafts(design));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [blockedUnitMessage, setBlockedUnitMessage] = useState<string | undefined>();

  const prevUnitSystemRef = useRef<UnitSystem>(design.unitSystem);
  const prevDesignIdRef = useRef<string>(design.id);

  const hasInputErrors = Object.keys(fieldErrors).length > 0;

  useEffect(() => {
    onInputValidityChange?.(hasInputErrors);
  }, [hasInputErrors, onInputValidityChange]);

  // Sync drafts when design ID or unit system changes externally
  useEffect(() => {
    const unitChanged = prevUnitSystemRef.current !== design.unitSystem;
    const idChanged = prevDesignIdRef.current !== design.id;

    if (unitChanged || idChanged) {
      prevUnitSystemRef.current = design.unitSystem;
      prevDesignIdRef.current = design.id;
      setDrafts(getInitialDrafts(design));
      setFieldErrors({});
      setBlockedUnitMessage(undefined);
    }
  }, [design]);

  const geometryResult = useMemo(() => {
    return calculateToolboxGeometry(design);
  }, [design]);

  const handleDimensionChange = (key: DimensionFieldKey, rawValue: string) => {
    setDrafts((prev) => ({ ...prev, [key]: rawValue }));

    const parseResult = parseDimension(rawValue, design.unitSystem);

    if (parseResult.ok) {
      const nextErrors = { ...fieldErrors };
      delete nextErrors[key];
      setFieldErrors(nextErrors);
      if (Object.keys(nextErrors).length === 0) {
        setBlockedUnitMessage(undefined);
      }

      const now = new Date().toISOString();
      if (key in design.dimensions) {
        onDesignChange({
          ...design,
          updatedAt: now,
          dimensions: {
            ...design.dimensions,
            [key]: parseResult.millimetres,
          },
        });
      } else {
        onDesignChange({
          ...design,
          updatedAt: now,
          constructionParameters: {
            ...design.constructionParameters,
            [key]: parseResult.millimetres,
          },
        });
      }
    } else {
      setFieldErrors((prev) => ({ ...prev, [key]: parseResult.error }));
    }
  };

  const handleAngleChange = (key: AngleFieldKey, rawValue: string) => {
    setDrafts((prev) => ({ ...prev, [key]: rawValue }));

    const parseResult = parseAngle(rawValue);

    if (parseResult.ok) {
      const nextErrors = { ...fieldErrors };
      delete nextErrors[key];
      setFieldErrors(nextErrors);
      if (Object.keys(nextErrors).length === 0) {
        setBlockedUnitMessage(undefined);
      }

      const now = new Date().toISOString();
      onDesignChange({
        ...design,
        updatedAt: now,
        constructionParameters: {
          ...design.constructionParameters,
          [key]: parseResult.degrees,
        },
      });
    } else {
      setFieldErrors((prev) => ({ ...prev, [key]: parseResult.error }));
    }
  };

  const handleDimensionBlur = (key: DimensionFieldKey) => {
    if (!fieldErrors[key]) {
      const canonicalVal =
        key in design.dimensions
          ? design.dimensions[key as keyof typeof design.dimensions]
          : design.constructionParameters[key as keyof typeof design.constructionParameters];

      const formatted = formatDimension(canonicalVal, design.unitSystem, { includeUnit: false });
      setDrafts((prev) => ({ ...prev, [key]: formatted }));
    }
  };

  const handleAngleBlur = (key: AngleFieldKey) => {
    if (!fieldErrors[key]) {
      const canonicalVal = design.constructionParameters[key];
      setDrafts((prev) => ({ ...prev, [key]: String(canonicalVal) }));
    }
  };

  const handleUnitChange = (targetUnitSystem: UnitSystem) => {
    if (targetUnitSystem === design.unitSystem) {
      return;
    }

    if (hasInputErrors) {
      setBlockedUnitMessage('Correct invalid dimensions before changing units.');
      return;
    }

    setBlockedUnitMessage(undefined);
    const updated = setDesignUnitSystem(design, targetUnitSystem);
    prevUnitSystemRef.current = targetUnitSystem;
    onDesignChange(updated);
    setDrafts(getInitialDrafts(updated));
  };

  return (
    <div className={`design-editor ${className}`}>
      {/* Editor Header / Context */}
      <div className="editor-top-bar">
        <div className="editor-design-meta">
          <span className="editor-design-name">{design.name}</span>
          <span className="editor-unit-indicator">
            Active units:{' '}
            <strong>{design.unitSystem === 'metric' ? 'Metric (mm)' : 'Imperial (in)'}</strong>
          </span>
        </div>

        <UnitSelector
          unitSystem={design.unitSystem}
          onUnitChange={handleUnitChange}
          blockedMessage={blockedUnitMessage}
        />
      </div>

      {/* Validation Panel (Geometry errors & warnings or parse alerts) */}
      <ValidationPanel hasInputErrors={hasInputErrors} geometryResult={geometryResult} />

      {/* Main Workspace Grid */}
      <div className="editor-workspace-grid">
        {/* Left Column: Form Inputs */}
        <div className="editor-inputs-column">
          {/* Basic Dimensions Card */}
          <section className="editor-card" aria-labelledby="basic-dimensions-title">
            <h2 id="basic-dimensions-title" className="editor-card-title">
              Design dimensions
            </h2>
            <div className="field-grid">
              <DimensionField
                id="field-length"
                label="Length"
                symbol="X"
                value={drafts.length}
                unitSystem={design.unitSystem}
                error={fieldErrors.length}
                onChange={(val) => handleDimensionChange('length', val)}
                onBlur={() => handleDimensionBlur('length')}
              />
              <DimensionField
                id="field-width"
                label="Width"
                symbol="Y"
                value={drafts.width}
                unitSystem={design.unitSystem}
                error={fieldErrors.width}
                onChange={(val) => handleDimensionChange('width', val)}
                onBlur={() => handleDimensionBlur('width')}
              />
              <DimensionField
                id="field-height"
                label="Height"
                symbol="Z"
                value={drafts.height}
                unitSystem={design.unitSystem}
                error={fieldErrors.height}
                onChange={(val) => handleDimensionChange('height', val)}
                onBlur={() => handleDimensionBlur('height')}
              />
              <DimensionField
                id="field-stockThickness"
                label="Stock thickness"
                symbol="T"
                value={drafts.stockThickness}
                unitSystem={design.unitSystem}
                error={fieldErrors.stockThickness}
                onChange={(val) => handleDimensionChange('stockThickness', val)}
                onBlur={() => handleDimensionBlur('stockThickness')}
              />
            </div>
          </section>

          {/* Advanced Lid & Locking Parameters Card */}
          <section className="editor-card" aria-labelledby="advanced-parameters-heading">
            <details className="advanced-details" open>
              <summary id="advanced-parameters-heading" className="advanced-summary">
                <span>Lid &amp; locking mechanism</span>
              </summary>
              <div className="advanced-content">
                <div className="field-grid">
                  <DimensionField
                    id="field-lidThickness"
                    label="Lid thickness"
                    symbol="P"
                    value={drafts.lidThickness}
                    unitSystem={design.unitSystem}
                    error={fieldErrors.lidThickness}
                    onChange={(val) => handleDimensionChange('lidThickness', val)}
                    onBlur={() => handleDimensionBlur('lidThickness')}
                  />
                  <DimensionField
                    id="field-fixedTopBattenWidth"
                    label="Fixed top batten width"
                    symbol="R"
                    value={drafts.fixedTopBattenWidth}
                    unitSystem={design.unitSystem}
                    error={fieldErrors.fixedTopBattenWidth}
                    onChange={(val) => handleDimensionChange('fixedTopBattenWidth', val)}
                    onBlur={() => handleDimensionBlur('fixedTopBattenWidth')}
                  />
                  <DimensionField
                    id="field-lidBattenWidth"
                    label="Lid batten width"
                    symbol="B"
                    value={drafts.lidBattenWidth}
                    unitSystem={design.unitSystem}
                    error={fieldErrors.lidBattenWidth}
                    onChange={(val) => handleDimensionChange('lidBattenWidth', val)}
                    onBlur={() => handleDimensionBlur('lidBattenWidth')}
                  />
                  <DimensionField
                    id="field-lidSideClearance"
                    label="Lid side clearance"
                    symbol="C"
                    value={drafts.lidSideClearance}
                    unitSystem={design.unitSystem}
                    error={fieldErrors.lidSideClearance}
                    helperText="Clearance between the lid panel and each long side wall."
                    onChange={(val) => handleDimensionChange('lidSideClearance', val)}
                    onBlur={() => handleDimensionBlur('lidSideClearance')}
                  />
                  <DimensionField
                    id="field-desiredOverlap"
                    label="Desired overlap"
                    symbol="O"
                    value={drafts.desiredOverlap}
                    unitSystem={design.unitSystem}
                    error={fieldErrors.desiredOverlap}
                    helperText="Amount the lid panel extends beneath each fixed top batten when locked."
                    onChange={(val) => handleDimensionChange('desiredOverlap', val)}
                    onBlur={() => handleDimensionBlur('desiredOverlap')}
                  />
                  <DimensionField
                    id="field-lidBattenOverhang"
                    label="Lid batten overhang"
                    symbol="E"
                    value={drafts.lidBattenOverhang}
                    unitSystem={design.unitSystem}
                    error={fieldErrors.lidBattenOverhang}
                    onChange={(val) => handleDimensionChange('lidBattenOverhang', val)}
                    onBlur={() => handleDimensionBlur('lidBattenOverhang')}
                  />
                  <DimensionField
                    id="field-lockingBattenTravelClearance"
                    label="Locking batten travel clearance"
                    symbol="Q"
                    value={drafts.lockingBattenTravelClearance}
                    unitSystem={design.unitSystem}
                    error={fieldErrors.lockingBattenTravelClearance}
                    helperText="Clearance remaining after the lid completes its full release movement with the wedge removed."
                    onChange={(val) => handleDimensionChange('lockingBattenTravelClearance', val)}
                    onBlur={() => handleDimensionBlur('lockingBattenTravelClearance')}
                  />
                  <AngleField
                    id="field-wedgeTaperAngle"
                    label="Wedge taper angle"
                    symbol="α"
                    value={drafts.wedgeTaperAngle}
                    error={fieldErrors.wedgeTaperAngle}
                    helperText="Plan taper that progressively tightens the wedge as it slides across the toolbox."
                    onChange={(val) => handleAngleChange('wedgeTaperAngle', val)}
                    onBlur={() => handleAngleBlur('wedgeTaperAngle')}
                  />
                  <AngleField
                    id="field-wedgeBevelAngle"
                    label="Wedge bevel angle"
                    symbol="β"
                    value={drafts.wedgeBevelAngle}
                    error={fieldErrors.wedgeBevelAngle}
                    helperText="Undercut angle that vertically captures the wedge."
                    onChange={(val) => handleAngleChange('wedgeBevelAngle', val)}
                    onBlur={() => handleAngleBlur('wedgeBevelAngle')}
                  />
                </div>
              </div>
            </details>
          </section>
        </div>

        {/* Right Column: Live Calculated Results & Technical Drawings */}
        <div className="editor-calculated-column">
          <TechnicalDrawingViewer
            geometryResult={geometryResult}
            unitSystem={design.unitSystem}
            hasInputErrors={hasInputErrors}
            design={design}
          />
          <CalculatedDimensionsPanel
            geometryResult={geometryResult}
            unitSystem={design.unitSystem}
            hasInputErrors={hasInputErrors}
          />
        </div>
      </div>

      {/* Secondary Precision Note */}
      <footer className="editor-precision-footer">
        <p>
          Switching units changes display/input format only; the design keeps its internal
          precision.
        </p>
      </footer>
    </div>
  );
};
