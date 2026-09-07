import React from 'react';
import type { UnitSystem } from '../../domain/design';

export interface UnitSelectorProps {
  unitSystem: UnitSystem;
  onUnitChange: (unitSystem: UnitSystem) => void;
  disabled?: boolean | undefined;
  blockedMessage?: string | undefined;
}

export const UnitSelector: React.FC<UnitSelectorProps> = ({
  unitSystem,
  onUnitChange,
  disabled = false,
  blockedMessage,
}) => {
  return (
    <div className="unit-selector-wrapper">
      <div className="unit-selector-group" role="radiogroup" aria-label="Unit system">
        <button
          type="button"
          role="radio"
          aria-checked={unitSystem === 'metric'}
          className={`unit-button ${unitSystem === 'metric' ? 'active' : ''}`}
          onClick={() => onUnitChange('metric')}
          disabled={disabled}
        >
          Metric
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={unitSystem === 'imperial'}
          className={`unit-button ${unitSystem === 'imperial' ? 'active' : ''}`}
          onClick={() => onUnitChange('imperial')}
          disabled={disabled}
        >
          Imperial
        </button>
      </div>

      {blockedMessage && (
        <p className="unit-blocked-message" role="alert">
          {blockedMessage}
        </p>
      )}

      <div className="unit-precision-hint">
        <span>Metric input: nearest 1 mm &bull; Imperial input: nearest 1/16&Prime;</span>
      </div>
    </div>
  );
};
