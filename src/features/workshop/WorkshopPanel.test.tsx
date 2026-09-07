import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkshopPanel } from './WorkshopPanel';
import { createDefaultToolboxDesign, setDesignUnitSystem } from '../../domain';
import { calculateToolboxGeometry } from '../../domain/geometry';

describe('WorkshopPanel Component', () => {
  it('Requirement 82: renders Workshop heading, tabs, default active Cut list with all 8 rows and summary metrics', () => {
    const design = createDefaultToolboxDesign();
    const result = calculateToolboxGeometry(design);

    render(
      <WorkshopPanel
        geometryResult={result}
        unitSystem={design.unitSystem}
        design={design}
        hasInputErrors={false}
      />,
    );

    // Workshop heading
    expect(screen.getByRole('heading', { level: 2, name: 'Workshop' })).toBeInTheDocument();

    // Tabs
    const cutListTab = screen.getByRole('tab', { name: 'Cut list' });
    const processPlanTab = screen.getByRole('tab', { name: 'Process plan' });
    expect(cutListTab).toBeInTheDocument();
    expect(processPlanTab).toBeInTheDocument();
    expect(cutListTab).toHaveAttribute('aria-selected', 'true');
    expect(processPlanTab).toHaveAttribute('aria-selected', 'false');

    // Summary metrics
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('line items')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('stock blanks')).toBeInTheDocument();
    expect(screen.getByText('13')).toBeInTheDocument();
    expect(screen.getByText('finished parts')).toBeInTheDocument();

    // 8 Cut list rows
    expect(screen.getByTestId('cutlist-row-side')).toBeInTheDocument();
    expect(screen.getByTestId('cutlist-row-end-wall')).toBeInTheDocument();
    expect(screen.getByTestId('cutlist-row-bottom')).toBeInTheDocument();
    expect(screen.getByTestId('cutlist-row-handle')).toBeInTheDocument();
    expect(screen.getByTestId('cutlist-row-end-cap')).toBeInTheDocument();
    expect(screen.getByTestId('cutlist-row-lid-panel')).toBeInTheDocument();
    expect(screen.getByTestId('cutlist-row-straight-lid-batten')).toBeInTheDocument();
    expect(screen.getByTestId('cutlist-row-locking-set-blank')).toBeInTheDocument();

    // Locking set blank explanation
    expect(screen.getByText(/Locking batten \+ wedge blank/i)).toBeInTheDocument();
  });

  it('Requirement 83: switches to Process plan tab and verifies key construction steps', () => {
    const design = createDefaultToolboxDesign();
    const result = calculateToolboxGeometry(design);

    render(
      <WorkshopPanel
        geometryResult={result}
        unitSystem={design.unitSystem}
        design={design}
        hasInputErrors={false}
      />,
    );

    const processPlanTab = screen.getByRole('tab', { name: 'Process plan' });
    fireEvent.click(processPlanTab);

    expect(processPlanTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('workshop-processplan-view')).toBeInTheDocument();

    // Verify key steps
    expect(screen.getByTestId('process-step-cut-housing-dados')).toBeInTheDocument();
    expect(screen.getByText('Cut the end-wall housing dados')).toBeInTheDocument();

    expect(screen.getByTestId('process-step-fit-handles')).toBeInTheDocument();
    expect(screen.getByText('Fit grab handles')).toBeInTheDocument();

    expect(screen.getByTestId('process-step-prepare-locking-blank')).toBeInTheDocument();
    expect(screen.getByText('Prepare the locking batten/wedge blank')).toBeInTheDocument();

    expect(screen.getByTestId('process-step-cut-compound-face')).toBeInTheDocument();
    expect(screen.getByText('Cut the compound tapered locking face')).toBeInTheDocument();

    expect(screen.getByTestId('process-step-verify-lid-operation')).toBeInTheDocument();
    expect(screen.getByText('Verify lid operation')).toBeInTheDocument();
  });

  it('Requirement 85: formats linear dimensions as imperial woodworking fractions when unitSystem is imperial', () => {
    const design = setDesignUnitSystem(createDefaultToolboxDesign(), 'imperial');
    const result = calculateToolboxGeometry(design);

    render(
      <WorkshopPanel
        geometryResult={result}
        unitSystem="imperial"
        design={design}
        hasInputErrors={false}
      />,
    );

    // 600 mm = 23 5/8", 18 mm = 11/16"
    expect(screen.getAllByText('23 5/8"').length).toBeGreaterThan(0);
    expect(screen.getAllByText('11/16"').length).toBeGreaterThan(0);
  });

  it('Requirement 86: displays unavailable message when input errors exist', () => {
    const design = createDefaultToolboxDesign();
    const result = calculateToolboxGeometry(design);

    render(
      <WorkshopPanel
        geometryResult={result}
        unitSystem={design.unitSystem}
        design={design}
        hasInputErrors={true}
      />,
    );

    expect(
      screen.getByText('Fix input errors to update workshop information.'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('workshop-cutlist-view')).not.toBeInTheDocument();
  });

  it('Requirement 87: displays unavailable message when geometry is physically invalid', () => {
    const invalidDesign = {
      ...createDefaultToolboxDesign(),
      constructionParameters: {
        ...createDefaultToolboxDesign().constructionParameters,
        desiredOverlap: 50,
      },
    };
    const invalidResult = calculateToolboxGeometry(invalidDesign);
    expect(invalidResult.ok).toBe(false);

    render(
      <WorkshopPanel
        geometryResult={invalidResult}
        unitSystem={invalidDesign.unitSystem}
        design={invalidDesign}
        hasInputErrors={false}
      />,
    );

    expect(
      screen.getByText(
        'Cut list and process plan are available when the design geometry is valid.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('workshop-cutlist-view')).not.toBeInTheDocument();
  });
});
