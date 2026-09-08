import React, { useState, useMemo, useRef } from 'react';
import type { ToolboxDesign } from '../../domain';
import { RenameDialog } from './RenameDialog';
import './designManager.css';

export type PersistenceStatus = 'saved' | 'unsaved_changes' | 'not_saved';

export interface DesignOperationMessage {
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export type PersistenceMessage = DesignOperationMessage;

export interface DesignManagerProps {
  workingDesign: ToolboxDesign;
  savedDesigns: ToolboxDesign[];
  persistenceStatus: PersistenceStatus;
  hasInputErrors: boolean;
  isGeometryValid?: boolean;
  isReadOnly: boolean;
  message: DesignOperationMessage | null;
  isGeneratingPdf?: boolean;
  onNew: () => void;
  onSave: () => void;
  onRename: (newName: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onOpen: (designId: string) => void;
  onExport?: () => void;
  onExportPdf?: () => void | Promise<void>;
  onImportFile?: (file: File) => void | Promise<void>;
}

export const DesignManager: React.FC<DesignManagerProps> = ({
  workingDesign,
  savedDesigns,
  persistenceStatus,
  hasInputErrors,
  isGeometryValid = true,
  isReadOnly,
  message,
  isGeneratingPdf = false,
  onNew,
  onSave,
  onRename,
  onDuplicate,
  onDelete,
  onOpen,
  onExport,
  onExportPdf,
  onImportFile,
}) => {
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [userSelectedId, setUserSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveSelectedId = useMemo(() => {
    if (userSelectedId && savedDesigns.some((d) => d.id === userSelectedId)) {
      return userSelectedId;
    }
    if (savedDesigns.some((d) => d.id === workingDesign.id)) {
      return workingDesign.id;
    }
    if (savedDesigns.length > 0 && savedDesigns[0]) {
      return savedDesigns[0].id;
    }
    return '';
  }, [userSelectedId, savedDesigns, workingDesign.id]);

  const getStatusBadge = () => {
    switch (persistenceStatus) {
      case 'saved':
        return (
          <span className="persistence-badge persistence-badge-saved">
            <span aria-hidden="true">&#10003;</span> Saved
          </span>
        );
      case 'unsaved_changes':
        return (
          <span className="persistence-badge persistence-badge-unsaved_changes">
            <span aria-hidden="true">&bull;</span> Unsaved changes
          </span>
        );
      case 'not_saved':
      default:
        return (
          <span className="persistence-badge persistence-badge-not_saved">
            <span aria-hidden="true">&#9675;</span> Not saved
          </span>
        );
    }
  };

  const handleOpenClick = () => {
    if (effectiveSelectedId) {
      onOpen(effectiveSelectedId);
    }
  };

  const handleImportButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportFile) {
      await onImportFile(file);
    }
    // Always reset file input value to allow selecting the same file again
    e.target.value = '';
  };

  const isExportDisabled = hasInputErrors || !isGeometryValid;
  const exportButtonTitle = hasInputErrors
    ? 'Resolve invalid field values before exporting'
    : !isGeometryValid
      ? 'Cannot export design with geometry errors'
      : 'Export design as JSON file';

  const isExportPdfDisabled = hasInputErrors || !isGeometryValid || isGeneratingPdf;
  const exportPdfButtonTitle = isGeneratingPdf
    ? 'Generating PDF...'
    : hasInputErrors
      ? 'Resolve invalid field values before exporting PDF'
      : !isGeometryValid
        ? 'Cannot export PDF with geometry errors'
        : 'Export workshop plan as PDF';

  return (
    <section className="design-manager" aria-label="Design management">
      <div className="design-manager-header">
        <div className="design-title-group">
          <span className="design-title-label">Design:</span>
          <h2 className="design-title">{workingDesign.name}</h2>
          {getStatusBadge()}
        </div>
      </div>

      <div className="design-manager-toolbar">
        <div className="design-selector-group">
          <label
            htmlFor="saved-design-selector"
            className="sr-only"
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          >
            Saved designs
          </label>
          <select
            id="saved-design-selector"
            className="saved-design-select"
            aria-label="Saved designs"
            value={effectiveSelectedId}
            onChange={(e) => setUserSelectedId(e.target.value)}
            disabled={savedDesigns.length === 0}
          >
            {savedDesigns.length === 0 ? (
              <option value="">No saved designs</option>
            ) : (
              savedDesigns.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))
            )}
          </select>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleOpenClick}
            disabled={savedDesigns.length === 0 || !effectiveSelectedId}
          >
            Open
          </button>
        </div>

        <div className="design-action-buttons">
          <div className="design-actions-group design-actions-lifecycle">
            <button type="button" className="btn btn-secondary" onClick={onNew}>
              New
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onSave}
              disabled={hasInputErrors || isReadOnly}
              title={
                hasInputErrors
                  ? 'Resolve invalid field values before saving'
                  : isReadOnly
                    ? 'Saving is disabled in read-only mode'
                    : 'Save design'
              }
            >
              Save
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsRenameOpen(true)}
            >
              Rename
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onDuplicate}
              disabled={hasInputErrors}
              title={
                hasInputErrors
                  ? 'Resolve invalid field values before duplicating'
                  : 'Duplicate design'
              }
            >
              Duplicate
            </button>
          </div>

          <div className="design-actions-group design-actions-danger">
            <button
              type="button"
              className="btn btn-danger"
              onClick={onDelete}
              disabled={persistenceStatus === 'not_saved' || isReadOnly}
              title={
                persistenceStatus === 'not_saved'
                  ? 'Design is not saved in storage'
                  : 'Delete saved design'
              }
            >
              Delete
            </button>
          </div>

          <div className="design-actions-group design-actions-interchange">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onExport}
              disabled={isExportDisabled}
              title={exportButtonTitle}
            >
              Export JSON
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onExportPdf}
              disabled={isExportPdfDisabled}
              title={exportPdfButtonTitle}
              data-testid="export-pdf-button"
            >
              {isGeneratingPdf ? 'Generating PDF...' : 'Export PDF'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleImportButtonClick}
              title="Import design from JSON file"
            >
              Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
              tabIndex={-1}
              aria-hidden="true"
              data-testid="import-json-input"
            />
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`design-manager-status-area status-${message.type}`}
          role="status"
          aria-live="polite"
        >
          {message.text}
        </div>
      )}

      <p className="design-manager-footer-note">
        Saved designs are stored only in this browser on this device.
      </p>

      <RenameDialog
        isOpen={isRenameOpen}
        currentName={workingDesign.name}
        onRename={onRename}
        onClose={() => setIsRenameOpen(false)}
      />
    </section>
  );
};
