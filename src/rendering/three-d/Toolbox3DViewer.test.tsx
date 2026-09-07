import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbox3DViewer } from './Toolbox3DViewer';
import { createDefaultToolboxDesign } from '../../domain/defaults';
import { calculateToolboxGeometry } from '../../domain/geometry';

// Mock Canvas and Scene for jsdom unit testing
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="mocked-three-canvas">{children}</div>
  ),
  useThree: () => ({
    camera: {
      position: { set: vi.fn() },
      up: { set: vi.fn() },
      lookAt: vi.fn(),
      updateProjectionMatrix: vi.fn(),
    },
  }),
}));

vi.mock('./Toolbox3DScene', () => ({
  Toolbox3DScene: () => <div data-testid="mocked-3d-scene" />,
}));

describe('Toolbox3DViewer Component (Requirements 45, 49, 50, 57, 58, 62, 74, 75, 76)', () => {
  const defaultDesign = createDefaultToolboxDesign();
  const validGeometryResult = calculateToolboxGeometry(defaultDesign);

  it('renders 3D viewer with default Perspective view and metadata attributes', () => {
    render(<Toolbox3DViewer geometryResult={validGeometryResult} unitSystem="metric" />);

    const viewer = screen.getByTestId('toolbox-3d-viewer');
    expect(viewer).toBeInTheDocument();
    expect(viewer).toHaveAttribute('data-model-part-count', '11');
    expect(viewer).toHaveAttribute('data-model-length', '600');
    expect(viewer).toHaveAttribute('data-model-width', '300');
    expect(viewer).toHaveAttribute('data-model-height', '250');
    expect(viewer).toHaveAttribute('data-camera-view', 'perspective');

    const perspectiveTab = screen.getByRole('tab', { name: 'Perspective' });
    expect(perspectiveTab).toHaveAttribute('aria-selected', 'true');
  });

  it('switches between standard camera views (Perspective, Front, End, Top)', () => {
    render(<Toolbox3DViewer geometryResult={validGeometryResult} unitSystem="metric" />);

    const viewer = screen.getByTestId('toolbox-3d-viewer');
    const frontTab = screen.getByRole('tab', { name: 'Front' });
    const endTab = screen.getByRole('tab', { name: 'End' });
    const topTab = screen.getByRole('tab', { name: 'Top' });
    const perspectiveTab = screen.getByRole('tab', { name: 'Perspective' });

    // Front view
    fireEvent.click(frontTab);
    expect(frontTab).toHaveAttribute('aria-selected', 'true');
    expect(viewer).toHaveAttribute('data-camera-view', 'front');

    // End view
    fireEvent.click(endTab);
    expect(endTab).toHaveAttribute('aria-selected', 'true');
    expect(viewer).toHaveAttribute('data-camera-view', 'end');

    // Top view
    fireEvent.click(topTab);
    expect(topTab).toHaveAttribute('aria-selected', 'true');
    expect(viewer).toHaveAttribute('data-camera-view', 'top');

    // Back to Perspective
    fireEvent.click(perspectiveTab);
    expect(perspectiveTab).toHaveAttribute('aria-selected', 'true');
    expect(viewer).toHaveAttribute('data-camera-view', 'perspective');
  });

  it('interacts with "Fit to view" button', () => {
    render(<Toolbox3DViewer geometryResult={validGeometryResult} unitSystem="metric" />);

    const fitBtn = screen.getByRole('button', { name: 'Fit to view' });
    expect(fitBtn).not.toBeDisabled();
    fireEvent.click(fitBtn);
  });

  it('displays unavailable state when input errors exist', () => {
    render(
      <Toolbox3DViewer
        geometryResult={validGeometryResult}
        unitSystem="metric"
        hasInputErrors={true}
      />,
    );

    expect(screen.getByTestId('3d-input-error')).toBeInTheDocument();
    expect(
      screen.getByText(/3D model unavailable until the input errors are corrected/i),
    ).toBeInTheDocument();

    const fitBtn = screen.getByRole('button', { name: 'Fit to view' });
    expect(fitBtn).toBeDisabled();
  });

  it('displays unavailable state when geometry calculation fails', () => {
    const invalidGeoResult = calculateToolboxGeometry({
      ...defaultDesign,
      dimensions: {
        ...defaultDesign.dimensions,
        length: 50, // Invalid small length
      },
    });

    render(<Toolbox3DViewer geometryResult={invalidGeoResult} unitSystem="metric" />);

    expect(screen.getByTestId('3d-geometry-error')).toBeInTheDocument();
    expect(
      screen.getByText(/3D model unavailable until the design geometry is valid/i),
    ).toBeInTheDocument();
  });

  it('updates live when canonical geometry changes', () => {
    const { rerender } = render(
      <Toolbox3DViewer geometryResult={validGeometryResult} unitSystem="metric" />,
    );

    const viewer = screen.getByTestId('toolbox-3d-viewer');
    expect(viewer).toHaveAttribute('data-model-length', '600');

    const updatedGeoResult = calculateToolboxGeometry({
      ...defaultDesign,
      dimensions: {
        ...defaultDesign.dimensions,
        length: 750,
      },
    });

    rerender(<Toolbox3DViewer geometryResult={updatedGeoResult} unitSystem="metric" />);

    expect(viewer).toHaveAttribute('data-model-length', '750');
  });
});
