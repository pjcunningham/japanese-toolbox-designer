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
});
