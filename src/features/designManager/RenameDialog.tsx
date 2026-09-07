import React, { useState, useEffect, useRef } from 'react';

export interface RenameDialogProps {
  isOpen: boolean;
  currentName: string;
  onRename: (newName: string) => void;
  onClose: () => void;
}

interface RenameDialogContentProps {
  currentName: string;
  onRename: (newName: string) => void;
  onClose: () => void;
}

const RenameDialogContent: React.FC<RenameDialogContentProps> = ({
  currentName,
  onRename,
  onClose,
}) => {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError('Design name cannot be blank.');
      return;
    }
    if (trimmed.length > 100) {
      setError('Design name must not exceed 100 characters.');
      return;
    }
    onRename(trimmed);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
  };

  return (
    <div
      className="dialog-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        className="dialog-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-dialog-title"
      >
        <div className="dialog-header">
          <h3 id="rename-dialog-title" className="dialog-title">
            Rename Design
          </h3>
          <button
            type="button"
            className="dialog-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="dialog-field">
            <label htmlFor="rename-design-input" className="dialog-label">
              Design name
            </label>
            <input
              ref={inputRef}
              id="rename-design-input"
              type="text"
              value={name}
              maxLength={100}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              className={`dialog-input ${error ? 'dialog-input-error' : ''}`}
              aria-invalid={!!error}
              aria-describedby={error ? 'rename-error-msg' : undefined}
            />
            {error && (
              <span id="rename-error-msg" className="dialog-error" role="alert">
                {error}
              </span>
            )}
          </div>

          <div className="dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const RenameDialog: React.FC<RenameDialogProps> = ({
  isOpen,
  currentName,
  onRename,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <RenameDialogContent
      key={currentName}
      currentName={currentName}
      onRename={onRename}
      onClose={onClose}
    />
  );
};
