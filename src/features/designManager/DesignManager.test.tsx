import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DesignManager } from './DesignManager';
import { createDefaultToolboxDesign } from '../../domain';

describe('DesignManager Component', () => {
  const dummyDesign = createDefaultToolboxDesign({ name: 'My Toolbox' });

  it('renders design name, status badge, and controls', () => {
    render(
      <DesignManager
        workingDesign={dummyDesign}
        savedDesigns={[dummyDesign]}
        persistenceStatus="saved"
        hasInputErrors={false}
        isReadOnly={false}
        message={null}
        onNew={vi.fn()}
        onSave={vi.fn()}
        onRename={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onOpen={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { level: 2, name: 'My Toolbox' })).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rename' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(
      screen.getByText('Saved designs are stored only in this browser on this device.'),
    ).toBeInTheDocument();
  });

  it('displays unsaved changes and not saved status badges appropriately', () => {
    const { rerender } = render(
      <DesignManager
        workingDesign={dummyDesign}
        savedDesigns={[]}
        persistenceStatus="not_saved"
        hasInputErrors={false}
        isReadOnly={false}
        message={null}
        onNew={vi.fn()}
        onSave={vi.fn()}
        onRename={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onOpen={vi.fn()}
      />,
    );

    expect(screen.getByText('Not saved')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();

    rerender(
      <DesignManager
        workingDesign={dummyDesign}
        savedDesigns={[dummyDesign]}
        persistenceStatus="unsaved_changes"
        hasInputErrors={false}
        isReadOnly={false}
        message={null}
        onNew={vi.fn()}
        onSave={vi.fn()}
        onRename={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onOpen={vi.fn()}
      />,
    );

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).not.toBeDisabled();
  });

  it('disables Save and Duplicate when input errors exist', () => {
    render(
      <DesignManager
        workingDesign={dummyDesign}
        savedDesigns={[dummyDesign]}
        persistenceStatus="unsaved_changes"
        hasInputErrors={true}
        isReadOnly={false}
        message={null}
        onNew={vi.fn()}
        onSave={vi.fn()}
        onRename={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onOpen={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeDisabled();
  });

  it('handles rename dialog open, validation, and confirmation', async () => {
    const user = userEvent.setup();
    const handleRename = vi.fn();

    render(
      <DesignManager
        workingDesign={dummyDesign}
        savedDesigns={[dummyDesign]}
        persistenceStatus="saved"
        hasInputErrors={false}
        isReadOnly={false}
        message={null}
        onNew={vi.fn()}
        onSave={vi.fn()}
        onRename={handleRename}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onOpen={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Rename' }));

    const dialog = screen.getByRole('dialog', { name: 'Rename Design' });
    expect(dialog).toBeInTheDocument();

    const input = screen.getByLabelText('Design name');
    expect(input).toHaveValue('My Toolbox');

    // Blank name rejection
    await user.clear(input);
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(screen.getByText('Design name cannot be blank.')).toBeInTheDocument();
    expect(handleRename).not.toHaveBeenCalled();

    // Valid name submission
    await user.type(input, 'Renamed Box');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(handleRename).toHaveBeenCalledWith('Renamed Box');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('handles rename dialog cancel', async () => {
    const user = userEvent.setup();
    const handleRename = vi.fn();

    render(
      <DesignManager
        workingDesign={dummyDesign}
        savedDesigns={[dummyDesign]}
        persistenceStatus="saved"
        hasInputErrors={false}
        isReadOnly={false}
        message={null}
        onNew={vi.fn()}
        onSave={vi.fn()}
        onRename={handleRename}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onOpen={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Rename' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(handleRename).not.toHaveBeenCalled();
  });

  it('triggers onOpen when Open button is clicked', async () => {
    const user = userEvent.setup();
    const handleOpen = vi.fn();
    const d1 = createDefaultToolboxDesign({ name: 'Box 1', idGenerator: () => 'id-1' });
    const d2 = createDefaultToolboxDesign({ name: 'Box 2', idGenerator: () => 'id-2' });

    render(
      <DesignManager
        workingDesign={d1}
        savedDesigns={[d1, d2]}
        persistenceStatus="saved"
        hasInputErrors={false}
        isReadOnly={false}
        message={null}
        onNew={vi.fn()}
        onSave={vi.fn()}
        onRename={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onOpen={handleOpen}
      />,
    );

    const select = screen.getByLabelText('Saved designs');
    await user.selectOptions(select, 'id-2');
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(handleOpen).toHaveBeenCalledWith('id-2');
  });

  it('renders Export and Import buttons and handles Export click', async () => {
    const user = userEvent.setup();
    const handleExport = vi.fn();

    render(
      <DesignManager
        workingDesign={dummyDesign}
        savedDesigns={[dummyDesign]}
        persistenceStatus="saved"
        hasInputErrors={false}
        isGeometryValid={true}
        isReadOnly={false}
        message={null}
        onNew={vi.fn()}
        onSave={vi.fn()}
        onRename={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onOpen={vi.fn()}
        onExport={handleExport}
      />,
    );

    const exportBtn = screen.getByRole('button', { name: 'Export JSON' });
    const importBtn = screen.getByRole('button', { name: 'Import JSON' });

    expect(exportBtn).toBeInTheDocument();
    expect(exportBtn).toBeEnabled();
    expect(importBtn).toBeInTheDocument();
    expect(importBtn).toBeEnabled();

    await user.click(exportBtn);
    expect(handleExport).toHaveBeenCalled();
  });

  it('disables Export button when input errors or geometry errors exist', () => {
    const { rerender } = render(
      <DesignManager
        workingDesign={dummyDesign}
        savedDesigns={[dummyDesign]}
        persistenceStatus="saved"
        hasInputErrors={true}
        isGeometryValid={true}
        isReadOnly={false}
        message={null}
        onNew={vi.fn()}
        onSave={vi.fn()}
        onRename={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onOpen={vi.fn()}
      />,
    );

    const exportBtnWithInputError = screen.getByRole('button', { name: 'Export JSON' });
    expect(exportBtnWithInputError).toBeDisabled();
    expect(exportBtnWithInputError).toHaveAttribute(
      'title',
      'Resolve invalid field values before exporting',
    );

    rerender(
      <DesignManager
        workingDesign={dummyDesign}
        savedDesigns={[dummyDesign]}
        persistenceStatus="saved"
        hasInputErrors={false}
        isGeometryValid={false}
        isReadOnly={false}
        message={null}
        onNew={vi.fn()}
        onSave={vi.fn()}
        onRename={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onOpen={vi.fn()}
      />,
    );

    const exportBtnWithGeoError = screen.getByRole('button', { name: 'Export JSON' });
    expect(exportBtnWithGeoError).toBeDisabled();
    expect(exportBtnWithGeoError).toHaveAttribute(
      'title',
      'Cannot export design with geometry errors',
    );
  });

  it('handles Import button file selection and triggers onImportFile callback', async () => {
    const user = userEvent.setup();
    const handleImportFile = vi.fn();

    render(
      <DesignManager
        workingDesign={dummyDesign}
        savedDesigns={[dummyDesign]}
        persistenceStatus="saved"
        hasInputErrors={false}
        isGeometryValid={true}
        isReadOnly={false}
        message={null}
        onNew={vi.fn()}
        onSave={vi.fn()}
        onRename={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onOpen={vi.fn()}
        onImportFile={handleImportFile}
      />,
    );

    const file = new File(['{"name":"Imported"}'], 'design.json', { type: 'application/json' });
    const fileInput = screen.getByTestId('import-json-input');

    await user.upload(fileInput, file);

    expect(handleImportFile).toHaveBeenCalledWith(file);
  });
});
