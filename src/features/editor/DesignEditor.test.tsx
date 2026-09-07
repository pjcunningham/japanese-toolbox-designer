import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { DesignEditor } from './DesignEditor';
import { createDefaultToolboxDesign, type ToolboxDesign } from '../../domain';

// Wrapper component to manage state in tests
const EditorTestWrapper: React.FC<{
  initialDesign?: ToolboxDesign;
  onDesignChangeSpy?: (design: ToolboxDesign) => void;
}> = ({ initialDesign, onDesignChangeSpy }) => {
  const [design, setDesign] = useState<ToolboxDesign>(
    () => initialDesign ?? createDefaultToolboxDesign(),
  );

  const handleChange = (updated: ToolboxDesign) => {
    setDesign(updated);
    onDesignChangeSpy?.(updated);
  };

  return <DesignEditor design={design} onDesignChange={handleChange} />;
};

describe('DesignEditor Component', () => {
  // 40. Default rendering
  it('renders application heading, basic dimension fields, default metric mode, calculated section, and valid status', () => {
    render(<EditorTestWrapper />);

    // Basic fields
    expect(screen.getByLabelText(/^Length/i)).toHaveValue('600');
    expect(screen.getByLabelText(/^Width/i)).toHaveValue('300');
    expect(screen.getByLabelText(/^Height/i)).toHaveValue('250');
    expect(screen.getByLabelText(/^Stock thickness/i)).toHaveValue('18');

    // Default metric mode
    const metricButton = screen.getByRole('radio', { name: 'Metric' });
    const imperialButton = screen.getByRole('radio', { name: 'Imperial' });
    expect(metricButton).toHaveAttribute('aria-checked', 'true');
    expect(imperialButton).toHaveAttribute('aria-checked', 'false');

    // Calculated section
    expect(
      screen.getByRole('heading', { level: 2, name: 'Calculated design' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Design is geometrically valid')).toBeInTheDocument();

    // Internal box dimensions displayed
    expect(screen.getByText('492 mm')).toBeInTheDocument(); // 600 - 2*(36 + 18) = 492
  });

  // 41. Metric edit
  it('updates canonical design and calculated dimensions on valid metric edit', async () => {
    const user = userEvent.setup();
    const onDesignChangeSpy = vi.fn();
    render(<EditorTestWrapper onDesignChangeSpy={onDesignChangeSpy} />);

    const lengthInput = screen.getByLabelText(/Length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, '700');

    expect(onDesignChangeSpy).toHaveBeenCalled();
    const lastCallArg = onDesignChangeSpy.mock.lastCall?.[0];
    expect(lastCallArg?.dimensions.length).toBe(700);

    // Calculated internal length updates: 700 - 2*(36 + 18) = 592 mm
    expect(screen.getByText('592 mm')).toBeInTheDocument();
  });

  // 42. Invalid metric input
  it('shows parser error, does not corrupt canonical design, marks calculated panel unavailable, and recovers when corrected', async () => {
    const user = userEvent.setup();
    const onDesignChangeSpy = vi.fn();
    render(<EditorTestWrapper onDesignChangeSpy={onDesignChangeSpy} />);

    const lengthInput = screen.getByLabelText(/Length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, '600.5');

    // Field marked invalid with parse error
    expect(lengthInput).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Metric dimensions must be whole millimetres.')).toBeInTheDocument();

    // Calculated section is marked unavailable
    expect(
      screen.getByText('Calculated dimensions are not current while input errors exist.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Input needs attention')).toBeInTheDocument();

    // Recover with valid input
    await user.clear(lengthInput);
    await user.type(lengthInput, '650');

    expect(lengthInput).toHaveAttribute('aria-invalid', 'false');
    expect(
      screen.queryByText('Metric dimensions must be whole millimetres.'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Design is geometrically valid')).toBeInTheDocument();
    expect(screen.getByText('542 mm')).toBeInTheDocument(); // 650 - 2*(36 + 18) = 542
  });

  // 43. Imperial switching
  it('switches to imperial mode and reformats fields to woodworking fractions without altering physical geometry', async () => {
    const user = userEvent.setup();
    const onDesignChangeSpy = vi.fn();
    render(<EditorTestWrapper onDesignChangeSpy={onDesignChangeSpy} />);

    const imperialButton = screen.getByRole('radio', { name: 'Imperial' });
    await user.click(imperialButton);

    expect(imperialButton).toHaveAttribute('aria-checked', 'true');
    expect(onDesignChangeSpy).toHaveBeenCalled();
    const lastCallArg = onDesignChangeSpy.mock.lastCall?.[0];
    expect(lastCallArg?.unitSystem).toBe('imperial');

    // Length 600 mm formatted to nearest 1/16" -> 23 5/8
    expect(screen.getByLabelText(/^Length/i)).toHaveValue('23 5/8');
    // Width 300 mm -> 11 13/16
    expect(screen.getByLabelText(/^Width/i)).toHaveValue('11 13/16');
    // Stock thickness 18 mm -> 11/16
    expect(screen.getByLabelText(/^Stock thickness/i)).toHaveValue('11/16');

    // Calculated results displayed in imperial with quotes
    expect(screen.getByText('Design is geometrically valid')).toBeInTheDocument();
    expect(screen.getByText('19 3/8"')).toBeInTheDocument(); // 492 mm in imperial = 19 3/8"
  });

  // 44. Imperial editing
  it('accepts valid imperial fractions and rejects invalid fractions', async () => {
    const user = userEvent.setup();
    const onDesignChangeSpy = vi.fn();
    render(<EditorTestWrapper onDesignChangeSpy={onDesignChangeSpy} />);

    // Switch to imperial
    await user.click(screen.getByRole('radio', { name: 'Imperial' }));

    const lengthInput = screen.getByLabelText(/Length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, '24 1/2');

    expect(lengthInput).toHaveAttribute('aria-invalid', 'false');
    const lastCallArg = onDesignChangeSpy.mock.lastCall?.[0];
    // 24.5 inches * 25.4 = 622.3 mm
    expect(lastCallArg?.dimensions.length).toBe(622.3);

    // Reject 24 1/32
    await user.clear(lengthInput);
    await user.type(lengthInput, '24 1/32');

    expect(lengthInput).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.getByText(/Imperial fractions must use denominators of 2, 4, 8, or 16/i),
    ).toBeInTheDocument();
  });

  // 45. Invalid drafts block unit switch
  it('blocks unit switching when invalid drafts exist and explains why', async () => {
    const user = userEvent.setup();
    render(<EditorTestWrapper />);

    const lengthInput = screen.getByLabelText(/Length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, 'invalid');

    const imperialButton = screen.getByRole('radio', { name: 'Imperial' });
    await user.click(imperialButton);

    // Unit switch blocked
    expect(screen.getByRole('radio', { name: 'Metric' })).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByText('Correct invalid dimensions before changing units.'),
    ).toBeInTheDocument();

    // Draft preserved
    expect(lengthInput).toHaveValue('invalid');

    // Fix draft
    await user.clear(lengthInput);
    await user.type(lengthInput, '600');

    // Switch succeeds
    await user.click(imperialButton);
    expect(imperialButton).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.queryByText('Correct invalid dimensions before changing units.'),
    ).not.toBeInTheDocument();
  });

  // 46. Geometry validation
  it('displays authoritative geometry errors when individually valid fields create impossible physical geometry', async () => {
    const user = userEvent.setup();
    render(<EditorTestWrapper />);

    const lengthInput = screen.getByLabelText(/Length/i);
    // Set toolbox length smaller than 2 * fixedTopBattenWidth (2 * 54 = 108)
    await user.clear(lengthInput);
    await user.type(lengthInput, '100');

    // Syntax is valid
    expect(lengthInput).toHaveAttribute('aria-invalid', 'false');

    // Geometry error is displayed
    expect(screen.getByText('Design needs attention')).toBeInTheDocument();
    expect(
      screen.getAllByText(/Combined fixed top batten widths must be less than toolbox length/i)
        .length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText('Calculated dimensions will appear when the design is valid.'),
    ).toBeInTheDocument();
  });

  // 47. Advanced parameter
  it('updates calculated lid values when editing advanced parameters and shows geometry error for excessive overlap', async () => {
    const user = userEvent.setup();
    render(<EditorTestWrapper />);

    const overlapInput = screen.getByLabelText(/Desired overlap/i);
    await user.clear(overlapInput);
    await user.type(overlapInput, '14');

    // Lid panel length: X - 2R + 2O = 600 - 168 + 28 = 460 mm
    expect(screen.getByText('460 mm')).toBeInTheDocument();

    // Set excessive overlap that violates release travel: 2*O >= R - I - T (2*25 = 50 >= 84 - 36 - 18 = 30)
    await user.clear(overlapInput);
    await user.type(overlapInput, '25');

    expect(screen.getByText('Design needs attention')).toBeInTheDocument();
    expect(
      screen.getAllByText(/Lid overlap requires more travel than available pocket depth/i).length,
    ).toBeGreaterThanOrEqual(1);
  });

  // 48. Angles
  it('handles decimal angle input, invalid non-numeric angles, and geometry limits', async () => {
    const user = userEvent.setup();
    const onDesignChangeSpy = vi.fn();
    render(<EditorTestWrapper onDesignChangeSpy={onDesignChangeSpy} />);

    const taperAngleInput = screen.getByLabelText(/Wedge taper angle/i);
    await user.clear(taperAngleInput);
    await user.type(taperAngleInput, '2.5');

    expect(taperAngleInput).toHaveAttribute('aria-invalid', 'false');
    const lastCallArg = onDesignChangeSpy.mock.lastCall?.[0];
    expect(lastCallArg?.constructionParameters.wedgeTaperAngle).toBe(2.5);

    // Non-numeric angle
    await user.clear(taperAngleInput);
    await user.type(taperAngleInput, 'abc');
    expect(taperAngleInput).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/Invalid angle/i)).toBeInTheDocument();

    // Recover and enter angle that causes geometry error (e.g. 45 degrees taper)
    await user.clear(taperAngleInput);
    await user.type(taperAngleInput, '45');

    expect(screen.getByText('Design needs attention')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Wedge taper angle must be a finite number greater than 0 and less than 45 degrees/i,
      ),
    ).toBeInTheDocument();
  });

  // 49. Canonical precision during unit switch
  it('preserves exact canonical millimetre precision when cycling metric -> imperial -> metric -> imperial', async () => {
    const user = userEvent.setup();
    const initialDesign = createDefaultToolboxDesign();
    // 12.7 mm is exactly 0.5 inches
    initialDesign.dimensions.stockThickness = 12.7;

    const onDesignChangeSpy = vi.fn();
    render(
      <EditorTestWrapper initialDesign={initialDesign} onDesignChangeSpy={onDesignChangeSpy} />,
    );

    const imperialButton = screen.getByRole('radio', { name: 'Imperial' });
    const metricButton = screen.getByRole('radio', { name: 'Metric' });

    // Switch to imperial: 12.7 mm = 1/2 in
    await user.click(imperialButton);
    expect(screen.getByLabelText(/^Stock thickness/i)).toHaveValue('1/2');
    let lastCall = onDesignChangeSpy.mock.lastCall?.[0];
    expect(lastCall?.dimensions.stockThickness).toBe(12.7);

    // Switch to metric: rounded display is 13, but canonical remains 12.7
    await user.click(metricButton);
    expect(screen.getByLabelText(/^Stock thickness/i)).toHaveValue('13');
    lastCall = onDesignChangeSpy.mock.lastCall?.[0];
    expect(lastCall?.dimensions.stockThickness).toBe(12.7);

    // Switch back to imperial: displays 1/2 again without drift
    await user.click(imperialButton);
    expect(screen.getByLabelText(/^Stock thickness/i)).toHaveValue('1/2');
    lastCall = onDesignChangeSpy.mock.lastCall?.[0];
    expect(lastCall?.dimensions.stockThickness).toBe(12.7);
  });

  // Phase 10: 2D vs 3D Visualization mode switching
  it('switches between 2D Technical Drawings and 3D Interactive Model views', async () => {
    const user = userEvent.setup();
    render(<EditorTestWrapper initialDesign={createDefaultToolboxDesign()} />);

    // 2D Drawings active by default
    const twoDTab = screen.getByRole('tab', { name: /2D Drawings/i });
    const threeDTab = screen.getByRole('tab', { name: /3D Model/i });
    expect(twoDTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: /Technical drawings/i })).toBeInTheDocument();

    // Switch to 3D Model
    await user.click(threeDTab);
    expect(threeDTab).toHaveAttribute('aria-selected', 'true');
    expect(
      await screen.findByRole('heading', { name: /3D Interactive Model/i }),
    ).toBeInTheDocument();

    // Switch back to 2D
    await user.click(twoDTab);
    expect(twoDTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: /Technical drawings/i })).toBeInTheDocument();
  });

  // Phase 10B Requirements 50-54: Carcass & Handles fields and calculations
  it('Requirement 50 & 54: renders Carcass & Handles fields and calculated Carcass construction section with blanks', () => {
    render(<EditorTestWrapper />);

    // Carcass fields
    expect(screen.getByLabelText(/Bottom thickness/i)).toHaveValue('12');
    expect(screen.getByLabelText(/End handle depth \/ wall inset/i)).toHaveValue('36');
    expect(screen.getByLabelText(/End handle height/i)).toHaveValue('72');
    expect(screen.getByLabelText(/Housing dado depth/i)).toHaveValue('3');
    expect(screen.getByLabelText(/End cap width/i)).toHaveValue('84');

    // Calculated Carcass Construction section
    expect(screen.getByRole('heading', { name: /Carcass construction/i })).toBeInTheDocument();
    expect(screen.getByText('270 × 238 × 18 mm')).toBeInTheDocument(); // End wall blank
    expect(screen.getByText('264 × 72 × 36 mm')).toBeInTheDocument(); // Handle blank
    expect(screen.getByText('600 × 300 × 12 mm')).toBeInTheDocument(); // Bottom board

    // Calculated default V2 values
    expect(screen.getByText('492 mm')).toBeInTheDocument(); // Internal length
    expect(screen.getAllByText('30 mm').length).toBeGreaterThanOrEqual(1); // Pocket depth
    expect(screen.getAllByText('3 mm').length).toBeGreaterThanOrEqual(1); // Release margin / Dado depth
  });

  it('Requirement 51: updates calculated internal length, pocket depth, and release margin when editing end handle depth', async () => {
    const user = userEvent.setup();
    const onDesignChangeSpy = vi.fn();
    render(<EditorTestWrapper onDesignChangeSpy={onDesignChangeSpy} />);

    const handleDepthInput = screen.getByLabelText(/End handle depth \/ wall inset/i);
    await user.clear(handleDepthInput);
    await user.type(handleDepthInput, '37'); // I changed from 36 to 37 (retains valid geometry)

    // Internal length: 600 - 2*(37 + 18) = 490 mm
    expect(screen.getByText('490 mm')).toBeInTheDocument();
    // Pocket depth: 84 - 37 - 18 = 29 mm
    expect(screen.getAllByText('29 mm').length).toBeGreaterThanOrEqual(1);
    // Release margin: 29 - 27 = 2 mm
    expect(screen.getByText('2 mm')).toBeInTheDocument();
  });

  it('Requirement 52: displays geometry validation error when housing dado depth is greater than or equal to stock thickness', async () => {
    const user = userEvent.setup();
    render(<EditorTestWrapper />);

    const dadoInput = screen.getByLabelText(/Housing dado depth/i);
    await user.clear(dadoInput);
    await user.type(dadoInput, '18'); // G = 18 mm >= T = 18 mm

    expect(dadoInput).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByText('Design needs attention')).toBeInTheDocument();
    expect(
      screen.getAllByText(/Housing dado depth must be less than/i).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('Requirement 53: displays geometry validation error when handle height is excessive', async () => {
    const user = userEvent.setup();
    render(<EditorTestWrapper />);

    const handleHeightInput = screen.getByLabelText(/End handle height/i);
    await user.clear(handleHeightInput);
    await user.type(handleHeightInput, '300'); // H = 300 mm > internalHeight = 238 mm

    expect(handleHeightInput).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByText('Design needs attention')).toBeInTheDocument();
    expect(
      screen.getAllByText(/End handle height must be less than internal body height/i).length,
    ).toBeGreaterThanOrEqual(1);
  });
});
