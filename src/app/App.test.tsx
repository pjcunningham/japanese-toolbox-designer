import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { createDefaultToolboxDesign } from '../domain';
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

    // Make desiredOverlap impossible (e.g. 50 mm when stock is 18 mm)
    const overlapInput = screen.getByLabelText(/Desired overlap/i);
    await user.clear(overlapInput);
    await user.type(overlapInput, '50');

    // Physical geometry error is shown
    expect(
      screen.getAllByText(/Lid overlap requires more travel than available pocket depth/i).length,
    ).toBeGreaterThanOrEqual(1);

    // Save remains allowed
    const saveBtn = screen.getByRole('button', { name: 'Save' });
    expect(saveBtn).not.toBeDisabled();
    await user.click(saveBtn);
    expect(screen.getByText('Saved')).toBeInTheDocument();

    unmount();

    // Reload and verify design is recovered and shows the geometry error
    render(<App storage={storage} />);
    expect(screen.getByLabelText(/Desired overlap/i)).toHaveValue('50');
    expect(
      screen.getAllByText(/Lid overlap requires more travel than available pocket depth/i).length,
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
