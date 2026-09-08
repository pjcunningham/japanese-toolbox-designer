import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { createDefaultToolboxDesign, type ToolboxDesign } from '../domain';
import * as interchangeModule from '../interchange';
import * as pdfModule from '../pdf';
import {
  DESIGNS_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  DESIGN_STORAGE_VERSION,
  type StorageLike,
} from '../persistence';

function createMockStorage(initialData: Record<string, string> = {}): StorageLike {
  const store = new Map<string, string>(Object.entries(initialData));
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
}

describe('App Component - General Rendering', () => {
  it('renders the Japanese Toolbox Designer main heading, subtitle, and badge', () => {
    const storage = createMockStorage();
    render(<App storage={storage} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Japanese Toolbox Designer' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Parametric Japanese toolbox design in your browser.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Design Editor')).toBeInTheDocument();
  });
});

describe('App Component - Phase 7 Saved Designs Requirements', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Requirement 49: handles initial empty state correctly', () => {
    const storage = createMockStorage();
    render(<App storage={storage} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Japanese Toolbox' })).toBeInTheDocument();
    expect(screen.getByText('Not saved')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    expect(screen.getByText('No saved designs')).toBeInTheDocument();
  });

  it('Requirement 50: saves a design, updates persistence status, and writes settings', async () => {
    const user = userEvent.setup();
    const storage = createMockStorage();
    render(<App storage={storage} />);

    // Edit a dimension (length to 650)
    const lengthInput = screen.getByLabelText(/Length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, '650');

    // Click Save
    const saveBtn = screen.getByRole('button', { name: 'Save' });
    await user.click(saveBtn);

    // Verify status becomes Saved
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Design saved.')).toBeInTheDocument();

    // Verify storage contents
    const rawDesigns = storage.getItem(DESIGNS_STORAGE_KEY);
    expect(rawDesigns).toBeTruthy();
    const parsedDesigns = JSON.parse(rawDesigns!);
    expect(parsedDesigns.designs).toHaveLength(1);
    expect(parsedDesigns.designs[0].dimensions.length).toBe(650);

    const rawSettings = storage.getItem(SETTINGS_STORAGE_KEY);
    expect(rawSettings).toBeTruthy();
    const parsedSettings = JSON.parse(rawSettings!);
    expect(parsedSettings.activeDesignId).toBe(parsedDesigns.designs[0].id);
  });

  it('Requirement 51: recovers saved designs upon application reload / remount', async () => {
    const user = userEvent.setup();
    const storage = createMockStorage();

    const { unmount } = render(<App storage={storage} />);

    const lengthInput = screen.getByLabelText(/Length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, '720');

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();

    unmount();

    // Remount with the same storage
    render(<App storage={storage} />);

    expect(screen.getByText('Saved')).toBeInTheDocument();
    const remountedLengthInput = screen.getByLabelText(/Length/i);
    expect(remountedLengthInput).toHaveValue('720');
  });

  it('Requirement 52: tracks unsaved changes and does not autosave on edits', async () => {
    const user = userEvent.setup();
    const storage = createMockStorage();

    render(<App storage={storage} />);

    // Initial save
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();

    // Change dimension to 700
    const lengthInput = screen.getByLabelText(/Length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, '700');

    // Verify status changed to Unsaved changes
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();

    // Verify storage still contains original 600 mm value
    const stored = JSON.parse(storage.getItem(DESIGNS_STORAGE_KEY)!);
    expect(stored.designs[0].dimensions.length).toBe(600);

    // Click save again
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();

    // Verify storage now updated to 700 mm
    const updatedStore = JSON.parse(storage.getItem(DESIGNS_STORAGE_KEY)!);
    expect(updatedStore.designs[0].dimensions.length).toBe(700);
  });

  it('Requirement 53: disables Save and Duplicate when visible drafts contain parse errors', async () => {
    const user = userEvent.setup();
    const storage = createMockStorage();

    render(<App storage={storage} />);

    const lengthInput = screen.getByLabelText(/Length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, 'invalid-num');

    expect(screen.getByText(/Invalid metric dimension/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeDisabled();

    // Stored designs remains untouched (empty)
    expect(storage.getItem(DESIGNS_STORAGE_KEY)).toBeNull();

    // Correcting the input restores functionality
    await user.clear(lengthInput);
    await user.type(lengthInput, '600');

    expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Duplicate' })).not.toBeDisabled();
  });

  it('Requirement 54: allows saving geometry-invalid work-in-progress designs', async () => {
    const user = userEvent.setup();
    const storage = createMockStorage();

    const { unmount } = render(<App storage={storage} />);

    // Make lockingEndOverlap impossible (e.g. 50 mm when stock is 18 mm)
    const overlapInput = screen.getByLabelText(/Locking-end locked overlap/i);
    await user.clear(overlapInput);
    await user.type(overlapInput, '50');

    // Physical geometry error is shown
    expect(
      screen.getAllByText(/Combined locked overlaps must be less than the end-cap pocket depth/i)
        .length,
    ).toBeGreaterThanOrEqual(1);

    // Save remains allowed
    const saveBtn = screen.getByRole('button', { name: 'Save' });
    expect(saveBtn).not.toBeDisabled();
    await user.click(saveBtn);
    expect(screen.getByText('Saved')).toBeInTheDocument();

    unmount();

    // Reload and verify design is recovered and shows the geometry error
    render(<App storage={storage} />);
    expect(screen.getByLabelText(/Locking-end locked overlap/i)).toHaveValue('50');
    expect(
      screen.getAllByText(/Combined locked overlaps must be less than the end-cap pocket depth/i)
        .length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('Requirement 55: supports renaming designs in-memory before explicit save', async () => {
    const user = userEvent.setup();
    const storage = createMockStorage();

    render(<App storage={storage} />);

    // Initial Save as "Japanese Toolbox"
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();

    // Open Rename Dialog
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    const nameInput = screen.getByLabelText('Design name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Master Craftsman Box');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    // Working name updated, status becomes Unsaved changes
    expect(
      screen.getByRole('heading', { level: 2, name: 'Master Craftsman Box' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();

    // In storage, old name persists until Save
    const storedBefore = JSON.parse(storage.getItem(DESIGNS_STORAGE_KEY)!);
    expect(storedBefore.designs[0].name).toBe('Japanese Toolbox');

    // Click Save
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();

    const storedAfter = JSON.parse(storage.getItem(DESIGNS_STORAGE_KEY)!);
    expect(storedAfter.designs[0].name).toBe('Master Craftsman Box');
  });

  it('Requirement 56: duplicates current design with new ID, copy name, and Not saved status', async () => {
    const user = userEvent.setup();
    const storage = createMockStorage();

    render(<App storage={storage} />);

    // Save original design
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();

    const originalStore = JSON.parse(storage.getItem(DESIGNS_STORAGE_KEY)!);
    const originalId = originalStore.designs[0].id;

    // Click Duplicate
    await user.click(screen.getByRole('button', { name: 'Duplicate' }));

    expect(
      screen.getByRole('heading', { level: 2, name: 'Japanese Toolbox (copy)' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Not saved')).toBeInTheDocument();

    // Original remains stored unchanged
    const storedAfterDup = JSON.parse(storage.getItem(DESIGNS_STORAGE_KEY)!);
    expect(storedAfterDup.designs).toHaveLength(1);
    expect(storedAfterDup.designs[0].id).toBe(originalId);

    // Save the duplicate -> Now storage has 2 designs
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();

    const twoDesignsStore = JSON.parse(storage.getItem(DESIGNS_STORAGE_KEY)!);
    expect(twoDesignsStore.designs).toHaveLength(2);
  });

  it('Requirement 57: opens a saved design and guards unsaved changes with confirmation', async () => {
    const user = userEvent.setup();
    const d1 = createDefaultToolboxDesign({
      name: 'Box Alpha',
      idGenerator: () => 'id-alpha',
      timestampGenerator: () => '2026-09-07T10:00:00.000Z',
      dimensions: { length: 500 },
    });
    const d2 = createDefaultToolboxDesign({
      name: 'Box Beta',
      idGenerator: () => 'id-beta',
      timestampGenerator: () => '2026-09-07T11:00:00.000Z',
      dimensions: { length: 800 },
    });

    const storage = createMockStorage({
      [DESIGNS_STORAGE_KEY]: JSON.stringify({
        storageVersion: DESIGN_STORAGE_VERSION,
        designs: [d2, d1],
      }),
      [SETTINGS_STORAGE_KEY]: JSON.stringify({
        storageVersion: 1,
        activeDesignId: 'id-beta',
      }),
    });

    render(<App storage={storage} />);

    // Initial design is Box Beta (800 mm)
    expect(screen.getByRole('heading', { level: 2, name: 'Box Beta' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Length/i)).toHaveValue('800');

    // Switch to Box Alpha and click Open
    const select = screen.getByLabelText('Saved designs');
    await user.selectOptions(select, 'id-alpha');
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('heading', { level: 2, name: 'Box Alpha' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Length/i)).toHaveValue('500');

    // Make an unsaved edit
    const lengthInput = screen.getByLabelText(/Length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, '550');

    // Try opening Box Beta while cancelling confirmation
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await user.selectOptions(select, 'id-beta');
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(confirmSpy).toHaveBeenCalledWith('Discard unsaved changes to this design?');
    // Box Alpha remains open with unsaved changes
    expect(screen.getByRole('heading', { level: 2, name: 'Box Alpha' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Length/i)).toHaveValue('550');

    // Try opening Box Beta while accepting confirmation
    confirmSpy.mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('heading', { level: 2, name: 'Box Beta' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Length/i)).toHaveValue('800');
  });

  it('Requirement 58: deletes a saved design, opens next design, or creates fresh default on final deletion', async () => {
    const user = userEvent.setup();
    const d1 = createDefaultToolboxDesign({
      name: 'Box 1',
      idGenerator: () => 'id-1',
      timestampGenerator: () => '2026-09-07T10:00:00.000Z',
    });
    const d2 = createDefaultToolboxDesign({
      name: 'Box 2',
      idGenerator: () => 'id-2',
      timestampGenerator: () => '2026-09-07T11:00:00.000Z',
    });

    const storage = createMockStorage({
      [DESIGNS_STORAGE_KEY]: JSON.stringify({
        storageVersion: DESIGN_STORAGE_VERSION,
        designs: [d2, d1],
      }),
      [SETTINGS_STORAGE_KEY]: JSON.stringify({
        storageVersion: 1,
        activeDesignId: 'id-2',
      }),
    });

    render(<App storage={storage} />);

    // Currently on Box 2
    expect(screen.getByRole('heading', { level: 2, name: 'Box 2' })).toBeInTheDocument();

    // Cancel deletion
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Box 2' })).toBeInTheDocument();

    // Confirm deletion of Box 2
    confirmSpy.mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    // Box 1 should now be open
    expect(screen.getByRole('heading', { level: 2, name: 'Box 1' })).toBeInTheDocument();
    expect(screen.getByText('Design deleted.')).toBeInTheDocument();

    // Delete Box 1 (final saved design)
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    // A fresh default unsaved design is created
    expect(screen.getByRole('heading', { level: 2, name: 'Japanese Toolbox' })).toBeInTheDocument();
    expect(screen.getByText('Not saved')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  it('Requirement 59: handles corrupt storage and salvages valid designs without crashing', () => {
    const valid = createDefaultToolboxDesign({
      name: 'Salvaged Box',
      idGenerator: () => 'id-salvaged',
    });
    const invalid = {
      ...createDefaultToolboxDesign({ name: 'Broken' }),
      schemaVersion: 999,
    };

    const storage = createMockStorage({
      [DESIGNS_STORAGE_KEY]: JSON.stringify({
        storageVersion: DESIGN_STORAGE_VERSION,
        designs: [valid, invalid],
      }),
    });

    render(<App storage={storage} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Salvaged Box' })).toBeInTheDocument();
    expect(
      screen.getByText(/skipped due to unsupported design schema version/i),
    ).toBeInTheDocument();
  });
});

describe('App Component - Phase 8 JSON Import/Export Requirements', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Requirement 45: exports valid design, triggers download, displays success, keeps dirty state unchanged', async () => {
    const user = userEvent.setup();
    const downloadSpy = vi
      .spyOn(interchangeModule, 'downloadDesignFile')
      .mockImplementation(() => {});

    const storage = createMockStorage();
    render(<App storage={storage} />);

    const exportBtn = screen.getByRole('button', { name: 'Export JSON' });
    expect(exportBtn).toBeEnabled();

    await user.click(exportBtn);

    expect(downloadSpy).toHaveBeenCalledTimes(1);
    const [downloadedJson, filename] = downloadSpy.mock.calls[0] as [string, string];
    expect(filename).toBe('japanese-toolbox.json');

    const parsed = JSON.parse(downloadedJson);
    expect(parsed.name).toBe('Japanese Toolbox');
    expect(parsed.dimensions.length).toBe(600);

    expect(screen.getByText('Design exported as JSON.')).toBeInTheDocument();
    expect(screen.getByText('Not saved')).toBeInTheDocument();
  });

  it('Requirement 46: exports dirty unsaved working changes without modifying saved storage snapshot', async () => {
    const user = userEvent.setup();
    const downloadSpy = vi
      .spyOn(interchangeModule, 'downloadDesignFile')
      .mockImplementation(() => {});

    const initialDesign = createDefaultToolboxDesign({
      name: 'Workshop Box',
      idGenerator: () => 'box-600',
      dimensions: { length: 600, width: 300, height: 250, stockThickness: 18 },
    });

    const storage = createMockStorage({
      [DESIGNS_STORAGE_KEY]: JSON.stringify({
        storageVersion: DESIGN_STORAGE_VERSION,
        designs: [initialDesign],
      }),
      [SETTINGS_STORAGE_KEY]: JSON.stringify({
        storageVersion: 1,
        activeDesignId: 'box-600',
      }),
    });

    render(<App storage={storage} />);

    // Initially saved with 600 mm
    expect(screen.getByText('Saved')).toBeInTheDocument();

    // Edit length to 650 mm (making it dirty)
    const lengthInput = screen.getByLabelText(/Length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, '650');

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();

    // Click Export JSON
    await user.click(screen.getByRole('button', { name: 'Export JSON' }));

    expect(downloadSpy).toHaveBeenCalledTimes(1);
    const [downloadedJson] = downloadSpy.mock.calls[0] as [string, string];
    const parsed = JSON.parse(downloadedJson);
    expect(parsed.dimensions.length).toBe(650);

    // Verify localStorage still has 600 mm
    const storageRaw = storage.getItem(DESIGNS_STORAGE_KEY);
    const storageParsed = JSON.parse(storageRaw!);
    expect(storageParsed.designs[0].dimensions.length).toBe(600);
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('Requirement 47: disables Export JSON when editor drafts contain parse errors', async () => {
    const user = userEvent.setup();
    const downloadSpy = vi
      .spyOn(interchangeModule, 'downloadDesignFile')
      .mockImplementation(() => {});

    const storage = createMockStorage();
    render(<App storage={storage} />);

    const lengthInput = screen.getByLabelText(/Length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, 'abc');

    const exportBtn = screen.getByRole('button', { name: 'Export JSON' });
    expect(exportBtn).toBeDisabled();
    expect(exportBtn).toHaveAttribute('title', 'Resolve invalid field values before exporting');
    expect(lengthInput).toHaveValue('abc');
    expect(downloadSpy).not.toHaveBeenCalled();
  });

  it('Requirement 48: disables Export JSON when physical geometry is invalid', async () => {
    const user = userEvent.setup();
    const downloadSpy = vi
      .spyOn(interchangeModule, 'downloadDesignFile')
      .mockImplementation(() => {});

    const storage = createMockStorage();
    render(<App storage={storage} />);

    // Set height to 30 mm which produces geometry errors with 18 mm stock thickness
    const heightInput = screen.getByLabelText(/^Height/i);
    await user.clear(heightInput);
    await user.type(heightInput, '30');

    const exportBtn = screen.getByRole('button', { name: 'Export JSON' });
    expect(exportBtn).toBeDisabled();
    expect(exportBtn).toHaveAttribute('title', 'Cannot export design with geometry errors');
    expect(downloadSpy).not.toHaveBeenCalled();
  });

  it('Requirement 49: imports a valid JSON design and leaves it unsaved until explicit save', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const storage = createMockStorage();
    render(<App storage={storage} />);

    const importedDesign = createDefaultToolboxDesign({
      name: 'Imported Masterpiece',
      idGenerator: () => 'unique-imported-id',
      dimensions: { length: 750, width: 350, height: 280, stockThickness: 20 },
    });

    const file = new File([JSON.stringify(importedDesign, null, 2)], 'masterpiece.json', {
      type: 'application/json',
    });
    const fileInput = screen.getByTestId('import-json-input');

    await user.upload(fileInput, file);

    // Verify working design updated
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Imported Masterpiece' }),
    ).toBeInTheDocument();
    expect(await screen.findByDisplayValue('750')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Length/i)).toHaveValue('750');
    expect(screen.getByLabelText(/^Width/i)).toHaveValue('350');
    expect(screen.getByText('Not saved')).toBeInTheDocument();
    expect(
      screen.getByText('Design imported. Save it to keep it in this browser.'),
    ).toBeInTheDocument();

    // Verify storage has NOT been modified yet
    expect(storage.getItem(DESIGNS_STORAGE_KEY)).toBeNull();
  });

  it('Requirement 50: imports a valid design and persists to library upon clicking Save', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const storage = createMockStorage();
    const { unmount } = render(<App storage={storage} />);

    const importedDesign = createDefaultToolboxDesign({
      name: 'Imported Box',
      idGenerator: () => 'imported-id-1',
      dimensions: { length: 820, width: 360, height: 290, stockThickness: 19 },
    });

    const file = new File([JSON.stringify(importedDesign)], 'imported.json', {
      type: 'application/json',
    });
    const fileInput = screen.getByTestId('import-json-input');

    await user.upload(fileInput, file);

    // Click Save
    const saveBtn = screen.getByRole('button', { name: 'Save' });
    await user.click(saveBtn);

    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Design saved.')).toBeInTheDocument();

    unmount();

    // Remount to verify reload restores the imported saved design
    render(<App storage={storage} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Imported Box' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Length/i)).toHaveValue('820');
  });

  it('Requirement 51: resolves ID conflict by generating a fresh ID and preserving saved designs', async () => {
    const user = userEvent.setup();
    const existingSaved = createDefaultToolboxDesign({
      name: 'Original Box',
      idGenerator: () => 'shared-conflict-id',
      dimensions: { length: 500, width: 250, height: 200, stockThickness: 15 },
    });

    const storage = createMockStorage({
      [DESIGNS_STORAGE_KEY]: JSON.stringify({
        storageVersion: DESIGN_STORAGE_VERSION,
        designs: [existingSaved],
      }),
      [SETTINGS_STORAGE_KEY]: JSON.stringify({
        storageVersion: 1,
        activeDesignId: 'shared-conflict-id',
      }),
    });

    render(<App storage={storage} />);

    // Initially Original Box is open and Saved
    expect(screen.getByRole('heading', { level: 2, name: 'Original Box' })).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();

    // Prepare import with the exact same ID but different name & dimensions
    const conflictingImport = createDefaultToolboxDesign({
      name: 'Conflicting Import Box',
      idGenerator: () => 'shared-conflict-id',
      dimensions: { length: 650, width: 320, height: 260, stockThickness: 18 },
    });

    const file = new File([JSON.stringify(conflictingImport)], 'conflict.json', {
      type: 'application/json',
    });
    const fileInput = screen.getByTestId('import-json-input');

    await user.upload(fileInput, file);

    // Imported design is loaded with conflict message and Not saved status
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Conflicting Import Box' }),
    ).toBeInTheDocument();
    expect(await screen.findByDisplayValue('650')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Length/i)).toHaveValue('650');
    expect(screen.getByText('Not saved')).toBeInTheDocument();
    expect(
      screen.getByText('Design imported as a new design. Save it to keep it in this browser.'),
    ).toBeInTheDocument();

    // Save the new design
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();

    // Verify storage contains BOTH designs with different IDs
    const rawDesigns = storage.getItem(DESIGNS_STORAGE_KEY);
    const parsed = JSON.parse(rawDesigns!);
    expect(parsed.designs).toHaveLength(2);
    expect(parsed.designs.map((d: ToolboxDesign) => d.name)).toContain('Original Box');
    expect(parsed.designs.map((d: ToolboxDesign) => d.name)).toContain('Conflicting Import Box');
  });

  it('Requirement 52: rejects malformed file without changing current design or storage', async () => {
    const user = userEvent.setup();
    const storage = createMockStorage();
    render(<App storage={storage} />);

    // Save initial design first
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();

    const lengthInput = screen.getByLabelText(/^Length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, '640');

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();

    const malformedFile = new File(['{ this is not valid json'], 'bad.json', {
      type: 'application/json',
    });
    const fileInput = screen.getByTestId('import-json-input');

    await user.upload(fileInput, malformedFile);

    // Error displayed, current design preserved with unsaved changes intact
    expect(screen.getByText('The file contains invalid or unparseable JSON.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Length/i)).toHaveValue('640');
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('Requirement 53: rejects structurally valid JSON with invalid geometry', async () => {
    const user = userEvent.setup();
    const storage = createMockStorage();
    render(<App storage={storage} />);

    const invalidGeoDesign = {
      ...createDefaultToolboxDesign({ name: 'Impossible Box' }),
      dimensions: { length: 600, width: 300, height: 30, stockThickness: 18 },
    };

    const file = new File([JSON.stringify(invalidGeoDesign)], 'invalid-geo.json', {
      type: 'application/json',
    });
    const fileInput = screen.getByTestId('import-json-input');

    await user.upload(fileInput, file);

    expect(
      screen.getByText(/The design contains physically invalid geometry and cannot be imported/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Japanese Toolbox' })).toBeInTheDocument();
  });

  it('Requirement 54: prompts unsaved changes guard for valid import; cancel preserves working design, confirm loads it', async () => {
    const user = userEvent.setup();
    const storage = createMockStorage();
    render(<App storage={storage} />);

    // Save initial design first
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();

    // Make an unsaved change
    const lengthInput = screen.getByLabelText(/^Length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, '620');
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();

    const validImport = createDefaultToolboxDesign({
      name: 'Imported After Guard',
      dimensions: { length: 700, width: 320, height: 260, stockThickness: 18 },
    });
    const file = new File([JSON.stringify(validImport)], 'valid.json', {
      type: 'application/json',
    });
    const fileInput = screen.getByTestId('import-json-input');

    // User cancels the discard prompt
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await user.upload(fileInput, file);

    expect(confirmSpy).toHaveBeenCalledWith('Discard unsaved changes to this design?');
    // Design remains 620 mm and unsaved
    expect(screen.getByLabelText(/^Length/i)).toHaveValue('620');
    expect(screen.getByRole('heading', { level: 2, name: 'Japanese Toolbox' })).toBeInTheDocument();
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();

    // Now user accepts confirmation
    confirmSpy.mockReturnValue(true);
    await user.upload(fileInput, file);

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Imported After Guard' }),
    ).toBeInTheDocument();
    expect(await screen.findByDisplayValue('700')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Length/i)).toHaveValue('700');
    expect(screen.getByText('Not saved')).toBeInTheDocument();
  });

  it('Requirement 55: does NOT prompt discard confirmation when imported file is invalid', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm');
    const storage = createMockStorage();
    render(<App storage={storage} />);

    // Make unsaved edit
    const lengthInput = screen.getByLabelText(/Length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, '630');

    const malformedFile = new File(['invalid json content'], 'broken.json', {
      type: 'application/json',
    });
    const fileInput = screen.getByTestId('import-json-input');

    await user.upload(fileInput, malformedFile);

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.getByText('The file contains invalid or unparseable JSON.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Length/i)).toHaveValue('630');
  });

  it('Requirement 56: resets file input allowing selecting the same file twice in succession', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const storage = createMockStorage();
    render(<App storage={storage} />);

    const designToImport = createDefaultToolboxDesign({
      name: 'Repeat Import Box',
      dimensions: { length: 680, width: 310, height: 250, stockThickness: 18 },
    });
    const file = new File([JSON.stringify(designToImport)], 'repeat.json', {
      type: 'application/json',
    });
    const fileInput = screen.getByTestId('import-json-input');

    // First upload
    await user.upload(fileInput, file);
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Repeat Import Box' }),
    ).toBeInTheDocument();
    expect(await screen.findByDisplayValue('680')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Length/i)).toHaveValue('680');

    // User modifies length
    const lengthInput = screen.getByLabelText(/^Length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, '690');
    expect(lengthInput).toHaveValue('690');

    // Re-upload same file, confirm discard
    await user.upload(fileInput, file);

    // Verified length reset to 680
    expect(await screen.findByDisplayValue('680')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Length/i)).toHaveValue('680');
  });
});

describe('App Component - Phase 13 Workshop PDF Export', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exports valid design as PDF, triggers download, displays success, leaves dirty state unchanged', async () => {
    const user = userEvent.setup();
    const downloadPdfSpy = vi.spyOn(pdfModule, 'downloadWorkshopPdf').mockImplementation(() => {});

    const storage = createMockStorage();
    render(<App storage={storage} />);

    const exportPdfBtn = screen.getByRole('button', { name: 'Export PDF' });
    expect(exportPdfBtn).toBeEnabled();

    await user.click(exportPdfBtn);

    expect(await screen.findByText('Workshop PDF exported.')).toBeInTheDocument();
    expect(downloadPdfSpy).toHaveBeenCalledTimes(1);

    const [pdfBytes, filename] = downloadPdfSpy.mock.calls[0] as [Uint8Array, string];
    expect(filename).toBe('japanese-toolbox-workshop-plan.pdf');
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(1000);

    // Verified dirty state unchanged (remains Not saved, not silently saved)
    expect(screen.getByText('Not saved')).toBeInTheDocument();
  });

  it('exports dirty unsaved working design to PDF without altering saved storage snapshot', async () => {
    const user = userEvent.setup();
    const downloadPdfSpy = vi.spyOn(pdfModule, 'downloadWorkshopPdf').mockImplementation(() => {});

    const savedOriginal = createDefaultToolboxDesign({
      name: 'Saved Box',
      dimensions: { length: 600, width: 300, height: 250, stockThickness: 18 },
    });
    const storage = createMockStorage({
      [DESIGNS_STORAGE_KEY]: JSON.stringify({
        storageVersion: DESIGN_STORAGE_VERSION,
        designs: [savedOriginal],
      }),
      [SETTINGS_STORAGE_KEY]: JSON.stringify({
        storageVersion: 1,
        activeDesignId: savedOriginal.id,
      }),
    });

    render(<App storage={storage} />);

    // Modify length from 600 to 650
    const lengthInput = screen.getByLabelText(/^Length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, '650');

    expect(screen.getByText(/Unsaved changes/i)).toBeInTheDocument();

    // Export PDF while dirty
    await user.click(screen.getByRole('button', { name: 'Export PDF' }));

    expect(await screen.findByText('Workshop PDF exported.')).toBeInTheDocument();
    expect(downloadPdfSpy).toHaveBeenCalledTimes(1);
    const [, filename] = downloadPdfSpy.mock.calls[0] as [Uint8Array, string];
    expect(filename).toBe('saved-box-workshop-plan.pdf');

    // Storage still contains 600
    const stored = JSON.parse(storage.getItem(DESIGNS_STORAGE_KEY)!);
    expect(stored.designs[0].dimensions.length).toBe(600);

    // Working design is still dirty with 650
    expect(screen.getByText(/Unsaved changes/i)).toBeInTheDocument();
    expect(lengthInput).toHaveValue('650');
  });

  it('disables Export PDF when editor drafts contain parse errors', async () => {
    const user = userEvent.setup();
    const downloadPdfSpy = vi.spyOn(pdfModule, 'downloadWorkshopPdf').mockImplementation(() => {});

    const storage = createMockStorage();
    render(<App storage={storage} />);

    const lengthInput = screen.getByLabelText(/^Length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, 'abc');

    const exportPdfBtn = screen.getByRole('button', { name: 'Export PDF' });
    expect(exportPdfBtn).toBeDisabled();
    expect(exportPdfBtn).toHaveAttribute(
      'title',
      'Resolve invalid field values before exporting PDF',
    );
    expect(downloadPdfSpy).not.toHaveBeenCalled();
  });

  it('disables Export PDF when physical geometry is invalid', async () => {
    const user = userEvent.setup();
    const downloadPdfSpy = vi.spyOn(pdfModule, 'downloadWorkshopPdf').mockImplementation(() => {});

    const storage = createMockStorage();
    render(<App storage={storage} />);

    const lengthInput = screen.getByLabelText(/^Length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, '100'); // Physically invalid length

    const exportPdfBtn = screen.getByRole('button', { name: 'Export PDF' });
    expect(exportPdfBtn).toBeDisabled();
    expect(exportPdfBtn).toHaveAttribute('title', 'Cannot export PDF with geometry errors');
    expect(downloadPdfSpy).not.toHaveBeenCalled();
  });

  it('handles PDF generation failure gracefully without crashing and displays error status', async () => {
    const user = userEvent.setup();
    vi.spyOn(pdfModule, 'generateWorkshopPdf').mockRejectedValueOnce(
      new Error('Synthetic PDF generator fault'),
    );

    const storage = createMockStorage();
    render(<App storage={storage} />);

    const exportPdfBtn = screen.getByRole('button', { name: 'Export PDF' });
    await user.click(exportPdfBtn);

    expect(await screen.findByText('PDF export failed.')).toBeInTheDocument();
    expect(exportPdfBtn).toBeEnabled();
  });
});
