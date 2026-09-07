import React, { useState, useCallback, useMemo } from 'react';
import {
  createDefaultToolboxDesign,
  duplicateToolboxDesign,
  calculateToolboxGeometry,
  type ToolboxDesign,
} from '../domain';
import { DesignEditor } from '../features/editor';
import {
  DesignManager,
  type DesignOperationMessage,
  type PersistenceStatus,
} from '../features/designManager';
import {
  serializeToolboxDesign,
  parseToolboxDesignJson,
  makeImportedDesignUnique,
  downloadDesignFile,
  readDesignFile,
} from '../interchange';
import {
  loadDesignStore,
  loadSettings,
  upsertDesignInStore,
  deleteDesignFromStore,
  writeSettings,
  SETTINGS_STORAGE_VERSION,
  type StorageLike,
} from '../persistence';
import './App.css';

export interface AppProps {
  storage?: StorageLike;
}

export const App: React.FC<AppProps> = ({ storage }) => {
  // Initial state setup from storage
  const [initialData] = useState(() => {
    const storeResult = loadDesignStore(storage);
    const settingsResult = loadSettings(storage);

    let initialWorkingDesign: ToolboxDesign;
    let initialMessage: DesignOperationMessage | null = null;

    if (storeResult.status === 'unsupported_version') {
      initialMessage = { text: storeResult.error, type: 'warning' };
      initialWorkingDesign = createDefaultToolboxDesign();
    } else if (storeResult.status === 'corrupted') {
      initialMessage = { text: storeResult.error, type: 'warning' };
      initialWorkingDesign = createDefaultToolboxDesign();
    } else if (storeResult.status === 'storage_unavailable') {
      initialMessage = { text: storeResult.error, type: 'warning' };
      initialWorkingDesign = createDefaultToolboxDesign();
    } else {
      if (storeResult.warnings.length > 0) {
        initialMessage = { text: storeResult.warnings.join(' '), type: 'warning' };
      }

      const activeId = settingsResult.settings.activeDesignId;
      const matchingDesign = activeId
        ? storeResult.designs.find((d) => d.id === activeId)
        : undefined;

      if (matchingDesign) {
        initialWorkingDesign = duplicateToolboxDesign(matchingDesign, {
          idGenerator: () => matchingDesign.id,
          timestampGenerator: () => matchingDesign.updatedAt,
          name: matchingDesign.name,
        });
      } else if (storeResult.designs.length > 0 && storeResult.designs[0]) {
        const topDesign = storeResult.designs[0];
        initialWorkingDesign = duplicateToolboxDesign(topDesign, {
          idGenerator: () => topDesign.id,
          timestampGenerator: () => topDesign.updatedAt,
          name: topDesign.name,
        });
      } else {
        initialWorkingDesign = createDefaultToolboxDesign();
      }
    }

    return {
      workingDesign: initialWorkingDesign,
      savedDesigns: storeResult.designs,
      isReadOnly: storeResult.isReadOnly,
      message: initialMessage,
    };
  });

  const [workingDesign, setWorkingDesign] = useState<ToolboxDesign>(initialData.workingDesign);
  const [savedDesigns, setSavedDesigns] = useState<ToolboxDesign[]>(initialData.savedDesigns);
  const [isReadOnly] = useState<boolean>(initialData.isReadOnly);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [hasInputErrors, setHasInputErrors] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [message, setMessage] = useState<DesignOperationMessage | null>(initialData.message);

  const persistenceStatus: PersistenceStatus = useMemo(() => {
    const isSaved = savedDesigns.some((d) => d.id === workingDesign.id);
    if (!isSaved) {
      return 'not_saved';
    }
    if (isDirty) {
      return 'unsaved_changes';
    }
    return 'saved';
  }, [savedDesigns, workingDesign.id, isDirty]);

  const handleDesignChange = useCallback((updatedDesign: ToolboxDesign) => {
    setWorkingDesign(updatedDesign);
    setIsDirty(true);
    setMessage(null);
  }, []);

  const handleInputValidityChange = useCallback((hasErrors: boolean) => {
    setHasInputErrors(hasErrors);
  }, []);

  const confirmDiscardUnsaved = useCallback((): boolean => {
    const hasUnsavedChanges =
      hasInputErrors ||
      persistenceStatus === 'unsaved_changes' ||
      persistenceStatus === 'not_saved';

    if (!hasUnsavedChanges) {
      return true;
    }

    return window.confirm('Discard unsaved changes to this design?');
  }, [hasInputErrors, persistenceStatus]);

  const handleNew = useCallback(() => {
    if (!confirmDiscardUnsaved()) {
      return;
    }
    const fresh = createDefaultToolboxDesign();
    setWorkingDesign(fresh);
    setIsDirty(false);
    setMessage(null);
  }, [confirmDiscardUnsaved]);

  const handleSave = useCallback(() => {
    if (hasInputErrors || isReadOnly) {
      return;
    }

    const now = new Date().toISOString();
    const toSave: ToolboxDesign = {
      ...workingDesign,
      updatedAt: now,
    };

    const saveResult = upsertDesignInStore(toSave, storage);
    if (!saveResult.ok) {
      setMessage({ text: saveResult.error, type: 'error' });
      return;
    }

    const nextSavedDesigns = saveResult.data ?? savedDesigns;
    setWorkingDesign(toSave);
    setSavedDesigns(nextSavedDesigns);
    setIsDirty(false);

    const settingsRes = writeSettings(
      {
        storageVersion: SETTINGS_STORAGE_VERSION,
        activeDesignId: toSave.id,
      },
      storage,
    );

    if (!settingsRes.ok) {
      setMessage({
        text: 'Design saved, but last-opened preference could not be stored.',
        type: 'warning',
      });
    } else {
      setMessage({ text: 'Design saved.', type: 'success' });
    }
  }, [hasInputErrors, isReadOnly, workingDesign, storage, savedDesigns]);

  const handleRename = useCallback((newName: string) => {
    const now = new Date().toISOString();
    setWorkingDesign((prev) => ({
      ...prev,
      name: newName,
      updatedAt: now,
    }));
    setIsDirty(true);
    setMessage(null);
  }, []);

  const handleDuplicate = useCallback(() => {
    if (hasInputErrors) {
      return;
    }

    const dup = duplicateToolboxDesign(workingDesign);
    setWorkingDesign(dup);
    setIsDirty(false);
    setMessage(null);
  }, [hasInputErrors, workingDesign]);

  const handleOpen = useCallback(
    (designId: string) => {
      if (designId === workingDesign.id && persistenceStatus === 'saved') {
        return;
      }

      if (!confirmDiscardUnsaved()) {
        return;
      }

      const target = savedDesigns.find((d) => d.id === designId);
      if (!target) {
        return;
      }

      const copy = duplicateToolboxDesign(target, {
        idGenerator: () => target.id,
        timestampGenerator: () => target.updatedAt,
        name: target.name,
      });

      setWorkingDesign(copy);
      setIsDirty(false);
      writeSettings(
        {
          storageVersion: SETTINGS_STORAGE_VERSION,
          activeDesignId: target.id,
        },
        storage,
      );
      setMessage(null);
    },
    [workingDesign.id, persistenceStatus, confirmDiscardUnsaved, savedDesigns, storage],
  );

  const handleDelete = useCallback(() => {
    if (persistenceStatus === 'not_saved' || isReadOnly) {
      return;
    }

    const confirmMsg = isDirty
      ? `Delete "${workingDesign.name}"? Unsaved working changes will also be discarded. This cannot be undone.`
      : `Delete "${workingDesign.name}"? This cannot be undone.`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    const deleteResult = deleteDesignFromStore(workingDesign.id, storage);
    if (!deleteResult.ok) {
      setMessage({ text: deleteResult.error, type: 'error' });
      return;
    }

    const remaining = deleteResult.data ?? [];
    setSavedDesigns(remaining);

    if (remaining.length > 0 && remaining[0]) {
      const nextDesign = remaining[0];
      const copy = duplicateToolboxDesign(nextDesign, {
        idGenerator: () => nextDesign.id,
        timestampGenerator: () => nextDesign.updatedAt,
        name: nextDesign.name,
      });
      setWorkingDesign(copy);
      setIsDirty(false);
      writeSettings(
        {
          storageVersion: SETTINGS_STORAGE_VERSION,
          activeDesignId: nextDesign.id,
        },
        storage,
      );
    } else {
      const fresh = createDefaultToolboxDesign();
      setWorkingDesign(fresh);
      setIsDirty(false);
      writeSettings(
        {
          storageVersion: SETTINGS_STORAGE_VERSION,
          activeDesignId: null,
        },
        storage,
      );
    }

    setMessage({ text: 'Design deleted.', type: 'info' });
  }, [persistenceStatus, isReadOnly, isDirty, workingDesign, storage]);

  const isGeometryValid = useMemo(() => {
    const geoResult = calculateToolboxGeometry(workingDesign);
    return geoResult.ok;
  }, [workingDesign]);

  const handleExport = useCallback(() => {
    if (hasInputErrors || !isGeometryValid) {
      return;
    }

    const exportResult = serializeToolboxDesign(workingDesign);
    if (!exportResult.ok) {
      let errorMsg = exportResult.error;
      if (exportResult.details && exportResult.details.length > 0) {
        errorMsg = `${exportResult.error} ${exportResult.details.slice(0, 2).join('; ')}`;
      }
      setMessage({ text: errorMsg, type: 'error' });
      return;
    }

    downloadDesignFile(exportResult.json, exportResult.filename);
    setMessage({ text: 'Design exported as JSON.', type: 'success' });
  }, [hasInputErrors, isGeometryValid, workingDesign]);

  const handleExportPdf = useCallback(async () => {
    if (hasInputErrors || !isGeometryValid || isGeneratingPdf) {
      return;
    }

    setIsGeneratingPdf(true);
    setMessage({ text: 'Generating PDF...', type: 'info' });

    try {
      const {
        createWorkshopPdfData,
        generateWorkshopPdf,
        generateWorkshopPdfFilename,
        downloadWorkshopPdf,
      } = await import('../pdf');

      const geoResult = calculateToolboxGeometry(workingDesign);
      if (!geoResult.ok) {
        throw new Error('Cannot export PDF because toolbox geometry is invalid.');
      }

      const pdfData = createWorkshopPdfData(workingDesign, geoResult.geometry);
      const pdfBytes = await generateWorkshopPdf(pdfData);
      const filename = generateWorkshopPdfFilename(workingDesign.name);

      downloadWorkshopPdf(pdfBytes, filename);
      setMessage({ text: 'Workshop PDF exported.', type: 'success' });
    } catch {
      setMessage({ text: 'PDF export failed.', type: 'error' });
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [hasInputErrors, isGeometryValid, isGeneratingPdf, workingDesign]);

  const handleImportFile = useCallback(
    async (file: File) => {
      let jsonText: string;
      try {
        jsonText = await readDesignFile(file);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to read the selected file.';
        setMessage({ text: errorMsg, type: 'error' });
        return;
      }

      const parseResult = parseToolboxDesignJson(jsonText);
      if (!parseResult.ok) {
        let errorMsg = parseResult.error;
        if (parseResult.details && parseResult.details.length > 0) {
          errorMsg = `${parseResult.error} ${parseResult.details.slice(0, 2).join('; ')}`;
        }
        setMessage({ text: errorMsg, type: 'error' });
        return;
      }

      // Valid file -> now apply unsaved-change guard
      if (!confirmDiscardUnsaved()) {
        return;
      }

      const importedDesign = parseResult.design;
      const existingIds = new Set(savedDesigns.map((d) => d.id));
      existingIds.add(workingDesign.id);

      const { design: resolvedDesign, wasConflict } = makeImportedDesignUnique(
        importedDesign,
        existingIds,
      );

      setWorkingDesign(resolvedDesign);
      setIsDirty(false);

      if (wasConflict) {
        setMessage({
          text: 'Design imported as a new design. Save it to keep it in this browser.',
          type: 'success',
        });
      } else {
        setMessage({
          text: 'Design imported. Save it to keep it in this browser.',
          type: 'success',
        });
      }
    },
    [confirmDiscardUnsaved, savedDesigns, workingDesign],
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <svg
              className="header-logo"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect
                x="2"
                y="8"
                width="28"
                height="18"
                rx="2"
                fill="#8B5A2B"
                stroke="#5C3A1E"
                strokeWidth="2"
              />
              <rect x="4" y="10" width="24" height="4" fill="#C49A6C" />
              <line x1="6" y1="12" x2="26" y2="12" stroke="#5C3A1E" strokeWidth="1.5" />
              <rect
                x="10"
                y="6"
                width="12"
                height="4"
                rx="1"
                fill="#D2B48C"
                stroke="#5C3A1E"
                strokeWidth="1.5"
              />
            </svg>
            <span className="header-title">Japanese Toolbox Designer</span>
          </div>
          <span className="header-badge">Design Editor</span>
        </div>
      </header>

      <main className="app-main">
        <div className="workspace-intro">
          <h1 className="workspace-title">Japanese Toolbox Designer</h1>
          <p className="workspace-subtitle">Parametric Japanese toolbox design in your browser.</p>
        </div>

        <DesignManager
          workingDesign={workingDesign}
          savedDesigns={savedDesigns}
          persistenceStatus={persistenceStatus}
          hasInputErrors={hasInputErrors}
          isGeometryValid={isGeometryValid}
          isReadOnly={isReadOnly}
          message={message}
          isGeneratingPdf={isGeneratingPdf}
          onNew={handleNew}
          onSave={handleSave}
          onRename={handleRename}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onOpen={handleOpen}
          onExport={handleExport}
          onExportPdf={handleExportPdf}
          onImportFile={handleImportFile}
        />

        <DesignEditor
          design={workingDesign}
          onDesignChange={handleDesignChange}
          onInputValidityChange={handleInputValidityChange}
        />
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p>Japanese Toolbox Designer &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
