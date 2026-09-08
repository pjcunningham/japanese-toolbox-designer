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
});
