import React from 'react';

export interface AngleFieldProps {
  id: string;
  label: string;
  symbol?: string | undefined;
  value: string;
  error?: string | undefined;
  helperText?: string | undefined;
  onChange: (value: string) => void;
  onBlur?: (() => void) | undefined;
  disabled?: boolean | undefined;
}

export const AngleField: React.FC<AngleFieldProps> = ({
  id,
  label,
  symbol,
  value,
  error,
  helperText,
  onChange,
  onBlur,
  disabled = false,
}) => {
  const helperId = helperText ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`editor-field ${error ? 'has-error' : ''}`}>
      <div className="field-header">
        <label htmlFor={id} className="field-label">
          {label} {symbol && <span className="field-symbol">({symbol})</span>}
        </label>
        <span className="field-unit-badge">°</span>
      </div>

      <div className="field-input-wrapper">
        <input
          id={id}
          type="text"
          className="field-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          autoComplete="off"
          spellCheck="false"
        />
      </div>

      {helperText && (
        <p id={helperId} className="field-helper">
          {helperText}
        </p>
      )}

      {error && (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
