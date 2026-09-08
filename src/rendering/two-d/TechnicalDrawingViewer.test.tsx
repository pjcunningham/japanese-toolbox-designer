import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TechnicalDrawingViewer } from './TechnicalDrawingViewer';
import { createDefaultToolboxDesign } from '../../domain/defaults';
import { calculateToolboxGeometry } from '../../domain/geometry';
import { setDesignUnitSystem } from '../../domain/design';

describe('TechnicalDrawingViewer Component (Requirements 67–72)', () => {
  const defaultDesign = createDefaultToolboxDesign();
  const validGeometryResult = calculateToolboxGeometry(defaultDesign);

  it('renders technical drawings card with Plan view active by default', () => {
    render(
      <TechnicalDrawingViewer
        geometryResult={validGeometryResult}
        unitSystem="metric"
        hasInputErrors={false}
        design={defaultDesign}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: /Technical drawings/i }),
    ).toBeInTheDocument();

    const planTab = screen.getByRole('tab', { name: 'Plan' });
    const frontTab = screen.getByRole('tab', { name: 'Front' });
    const endTab = screen.getByRole('tab', { name: 'End' });

    expect(planTab).toHaveAttribute('aria-selected', 'true');
    expect(frontTab).toHaveAttribute('aria-selected', 'false');
    expect(endTab).toHaveAttribute('aria-selected', 'false');

    const svg = screen.getByRole('img');
    expect(svg).toHaveAttribute('data-view', 'plan');
    expect(svg).toHaveAttribute('aria-labelledby');

    // Zoom and fit controls
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fit to view' })).toBeInTheDocument();
  });

  it('switches views between Plan, Front, and End when clicking tabs', () => {
    render(
      <TechnicalDrawingViewer
        geometryResult={validGeometryResult}
        unitSystem="metric"
        hasInputErrors={false}
        design={defaultDesign}
      />,
    );

    const svg = screen.getByRole('img');
    expect(svg).toHaveAttribute('data-view', 'plan');

    // Switch to Front
    const frontTab = screen.getByRole('tab', { name: 'Front' });
    fireEvent.click(frontTab);
    expect(frontTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('img')).toHaveAttribute('data-view', 'front');

    // Switch to End
    const endTab = screen.getByRole('tab', { name: 'End' });
    fireEvent.click(endTab);
    expect(endTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('img')).toHaveAttribute('data-view', 'end');
  });

  it('updates SVG and dimensions when canonical design changes', () => {
    const { rerender } = render(
      <TechnicalDrawingViewer
        geometryResult={validGeometryResult}
        unitSystem="metric"
        hasInputErrors={false}
        design={defaultDesign}
      />,
    );

    expect(screen.getByText(/Length X: 600 mm/i)).toBeInTheDocument();

    // Change length to 750 mm
    const updatedDesign = {
      ...defaultDesign,
      dimensions: { ...defaultDesign.dimensions, length: 750 },
    };
    const updatedGeoResult = calculateToolboxGeometry(updatedDesign);

    rerender(
      <TechnicalDrawingViewer
        geometryResult={updatedGeoResult}
        unitSystem="metric"
        hasInputErrors={false}
        design={updatedDesign}
      />,
    );

    expect(screen.getByText(/Length X: 750 mm/i)).toBeInTheDocument();
  });

  it('formats dimensions according to unitSystem without changing drawing structure', () => {
    const imperialDesign = setDesignUnitSystem(defaultDesign, 'imperial');

    render(
      <TechnicalDrawingViewer
        geometryResult={validGeometryResult}
        unitSystem="imperial"
        hasInputErrors={false}
        design={imperialDesign}
      />,
    );

    // 600 mm = 23 5/8"
    expect(screen.getByText(/Length X: 23 5\/8"/i)).toBeInTheDocument();
    // 300 mm = 11 13/16"
    expect(screen.getByText(/Width Y: 11 13\/16"/i)).toBeInTheDocument();
  });

  it('displays unavailable state when input draft errors exist', () => {
    render(
      <TechnicalDrawingViewer
        geometryResult={validGeometryResult}
        unitSystem="metric"
        hasInputErrors={true}
        design={defaultDesign}
      />,
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByTestId('drawing-input-error')).toBeInTheDocument();
    expect(
      screen.getByText(/Fix input errors to update the technical drawing/i),
    ).toBeInTheDocument();

    // Controls should be disabled
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Fit to view' })).toBeDisabled();
  });

  it('displays unavailable state when geometry calculation fails', () => {
    const invalidDesign = {
      ...defaultDesign,
      dimensions: { ...defaultDesign.dimensions, length: 100 }, // impossible dimensions
    };
    const invalidGeoResult = calculateToolboxGeometry(invalidDesign);

    render(
      <TechnicalDrawingViewer
        geometryResult={invalidGeoResult}
        unitSystem="metric"
        hasInputErrors={false}
        design={invalidDesign}
      />,
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByTestId('drawing-geometry-error')).toBeInTheDocument();
    expect(
      screen.getByText(/Technical drawing unavailable until the design geometry is valid/i),
    ).toBeInTheDocument();
  });

  it('interacts with zoom buttons and fit to view', () => {
    render(
      <TechnicalDrawingViewer
        geometryResult={validGeometryResult}
        unitSystem="metric"
        hasInputErrors={false}
        design={defaultDesign}
      />,
    );

    const svg = screen.getByRole('img');
    const initialViewBox = svg.getAttribute('viewBox');
    expect(initialViewBox).toBeTruthy();

    const zoomInBtn = screen.getByRole('button', { name: 'Zoom in' });
    fireEvent.click(zoomInBtn);

    const zoomedInViewBox = svg.getAttribute('viewBox');
    expect(zoomedInViewBox).not.toBe(initialViewBox);

    const fitBtn = screen.getByRole('button', { name: 'Fit to view' });
    fireEvent.click(fitBtn);

    expect(svg.getAttribute('viewBox')).toBe(initialViewBox);
  });

  it('renders vertical dimensions with -90 degree rotation and centered alignment in SVG (Phase 13A)', () => {
    const { container } = render(
      <TechnicalDrawingViewer
        geometryResult={validGeometryResult}
        unitSystem="metric"
        hasInputErrors={false}
        design={defaultDesign}
      />,
    );

    // Plan view has Width Y dimension (axis: 'y')
    const widthYGroup = container.querySelector('[data-dimension="plan-dim-overall-width"]');
    expect(widthYGroup).toBeInTheDocument();

    const textElem = widthYGroup?.querySelector('.dimension-text');
    expect(textElem).toBeInTheDocument();
    expect(textElem?.textContent).toBe('Width Y: 300 mm');
    expect(textElem).toHaveAttribute('text-anchor', 'middle');
    expect(textElem).toHaveAttribute('dominant-baseline', 'central');

    const transform = textElem?.getAttribute('transform');
    expect(transform).toMatch(/^rotate\(-90\s+-?\d+(\.\d+)?\s+-?\d+(\.\d+)?\)$/);
  });

  it('renders primary and secondary annotation text in SVG with appropriate classes (Phase 13A)', () => {
    const { container } = render(
      <TechnicalDrawingViewer
        geometryResult={validGeometryResult}
        unitSystem="metric"
        hasInputErrors={false}
        design={defaultDesign}
      />,
    );

    // Switch to Front view
    const frontTab = screen.getByRole('tab', { name: 'Front' });
    fireEvent.click(frontTab);

    const capturedWedgeElem = container.querySelector('#front-ann-captured-wedge');
    expect(capturedWedgeElem).toBeInTheDocument();

    const tspans = capturedWedgeElem?.querySelectorAll('tspan');
    expect(tspans?.length).toBe(2);
    expect(tspans?.[0]?.textContent).toBe('Captured wedge');
    expect(tspans?.[1]?.textContent).toBe('β = 10°');
    expect(tspans?.[1]).toHaveClass('drawing-annotation-secondary');

    // Body Height dimension is vertical
    const bodyHeightGroup = container.querySelector('[data-dimension="front-dim-body-height"]');
    expect(bodyHeightGroup).toBeInTheDocument();
    const bodyHeightText = bodyHeightGroup?.querySelector('.dimension-text');
    expect(bodyHeightText?.textContent).toBe('Body Height: 250 mm');
    expect(bodyHeightText?.getAttribute('transform')).toMatch(/^rotate\(-90/);
  });

  it('renders Phase 14A short dimensions and annotations on distinct vertical SVG Y rows in intended order', () => {
    const { container } = render(
      <TechnicalDrawingViewer
        geometryResult={validGeometryResult}
        unitSystem="metric"
        hasInputErrors={false}
        design={defaultDesign}
      />,
    );

    // Verify Inset I, Pocket, STOP END, Top Opening each appear exactly once
    const insetDimTexts = container.querySelectorAll(
      '[data-dimension="plan-dim-inset"] .dimension-text',
    );
    const pocketDimTexts = container.querySelectorAll(
      '[data-dimension="plan-dim-pocket-depth"] .dimension-text',
    );
    const openingDimTexts = container.querySelectorAll(
      '[data-dimension="plan-dim-opening-length"] .dimension-text',
    );
    const stopEndAnns = container.querySelectorAll('#plan-ann-stop-end');

    expect(insetDimTexts.length).toBe(1);
    expect(pocketDimTexts.length).toBe(1);
    expect(openingDimTexts.length).toBe(1);
    expect(stopEndAnns.length).toBe(1);

    expect(insetDimTexts[0]?.textContent).toBe('Inset I: 36 mm');
    expect(pocketDimTexts[0]?.textContent).toBe('Pocket: 30 mm');
    expect(openingDimTexts[0]?.textContent).toBe('Top Opening: 432 mm');
    expect(stopEndAnns[0]?.textContent).toBe('STOP END');

    // Parse numeric SVG Y coordinates
    const insetTextY = parseFloat(insetDimTexts[0]?.getAttribute('y') || '0');
    const pocketTextY = parseFloat(pocketDimTexts[0]?.getAttribute('y') || '0');
    const openingTextY = parseFloat(openingDimTexts[0]?.getAttribute('y') || '0');
    const stopEndTextY = parseFloat(stopEndAnns[0]?.getAttribute('y') || '0');

    // In SVG space, more negative Y is higher visually.
    // Order from visually highest to lowest: Top Opening < Inset I < Pocket < STOP END
    expect(openingTextY).toBeLessThan(insetTextY);
    expect(insetTextY).toBeLessThan(pocketTextY);
    expect(pocketTextY).toBeLessThan(stopEndTextY);

    // Each row has distinct deterministic SVG Y coordinate
    const yValues = [openingTextY, insetTextY, pocketTextY, stopEndTextY];
    const uniqueYValues = new Set(yValues);
    expect(uniqueYValues.size).toBe(4);
  });

  it('renders Phase 14A Imperial Plan view short dimensions on separate rows without truncation', () => {
    const imperialDesign = setDesignUnitSystem(defaultDesign, 'imperial');
    const imperialGeoResult = calculateToolboxGeometry(imperialDesign);

    const { container } = render(
      <TechnicalDrawingViewer
        geometryResult={imperialGeoResult}
        unitSystem="imperial"
        hasInputErrors={false}
        design={imperialDesign}
      />,
    );

    const insetText = container.querySelector('[data-dimension="plan-dim-inset"] .dimension-text');
    const pocketText = container.querySelector(
      '[data-dimension="plan-dim-pocket-depth"] .dimension-text',
    );

    expect(insetText).toBeInTheDocument();
    expect(pocketText).toBeInTheDocument();

    // 36 mm = 1 7/16", 30 mm = 1 3/16"
    expect(insetText?.textContent).toBe('Inset I: 1 7/16"');
    expect(pocketText?.textContent).toBe('Pocket: 1 3/16"');

    const insetTextY = parseFloat(insetText?.getAttribute('y') || '0');
    const pocketTextY = parseFloat(pocketText?.getAttribute('y') || '0');

    expect(insetTextY).not.toBe(pocketTextY);
    expect(insetTextY).toBeLessThan(pocketTextY); // Inset is higher row than Pocket
  });
});
