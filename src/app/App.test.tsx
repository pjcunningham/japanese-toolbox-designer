import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App Component', () => {
  it('renders the Japanese Toolbox Designer main heading and subtitle', () => {
    render(<App />);

    const headings = screen.getAllByRole('heading', { name: 'Japanese Toolbox Designer' });
    expect(headings.length).toBeGreaterThanOrEqual(1);

    const mainHeading = screen.getByRole('heading', {
      level: 1,
      name: 'Japanese Toolbox Designer',
    });
    expect(mainHeading).toBeInTheDocument();

    const subtitle = screen.getByText('Parametric Japanese toolbox design in your browser.');
    expect(subtitle).toBeInTheDocument();
  });

  it('renders the header brand and phase badge', () => {
    render(<App />);

    const phaseBadge = screen.getByText('Phase 1');
    expect(phaseBadge).toBeInTheDocument();
  });

  it('renders the foundation status card and footer', () => {
    render(<App />);

    const statusTitle = screen.getByRole('heading', {
      level: 2,
      name: 'Project Foundation Active',
    });
    expect(statusTitle).toBeInTheDocument();

    const currentYear = new Date().getFullYear().toString();
    const footer = screen.getByText(new RegExp(`Japanese Toolbox Designer © ${currentYear}`));
    expect(footer).toBeInTheDocument();
  });
});
