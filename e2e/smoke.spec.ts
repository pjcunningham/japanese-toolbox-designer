import { test, expect } from '@playwright/test';

test.describe('Application Shell & Design Editor Smoke Tests', () => {
  test('loads the application and displays the main heading and default valid design', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Japanese Toolbox Designer/);

    const heading = page.getByRole('heading', { level: 1, name: 'Japanese Toolbox Designer' });
    await expect(heading).toBeVisible();

    const subtitle = page.getByText(/Parametric Japanese toolbox design in your browser/i);
    await expect(subtitle).toBeVisible();

    await expect(page.getByText('Design is geometrically valid')).toBeVisible();
    await expect(page.getByText('492 mm')).toBeVisible();
  });

  test('interactively edits dimensions, switches to imperial units, and inspects advanced parameters', async ({
    page,
  }) => {
    await page.goto('/');

    const lengthInput = page.getByLabel(/^Length/i);
    await expect(lengthInput).toHaveValue('600');

    // Edit basic dimension
    await lengthInput.fill('700');
    await expect(page.getByText('592 mm')).toBeVisible();

    // Switch to Imperial
    const imperialRadio = page.getByRole('radio', { name: 'Imperial' });
    await imperialRadio.click();
    await expect(imperialRadio).toHaveAttribute('aria-checked', 'true');

    // Verify imperial formatting in input and calculated panels
    await expect(page.getByLabel(/^Stock thickness/i)).toHaveValue('11/16');
    await expect(page.getByText('23 5/16"')).toBeVisible(); // 592 mm = 23 5/16"

    // Open advanced lid & locking parameters
    const advancedDetails = page.locator('.advanced-details');
    await expect(advancedDetails).toBeVisible();
    await expect(page.getByLabel(/Desired overlap/i)).toBeVisible();
  });

  test('handles invalid input and recovers live', async ({ page }) => {
    await page.goto('/');

    const lengthInput = page.getByLabel(/^Length/i);
    await lengthInput.fill('600.5');

    await expect(page.getByText('Metric dimensions must be whole millimetres.')).toBeVisible();
    await expect(
      page.getByText('Calculated dimensions are not current while input errors exist.'),
    ).toBeVisible();

    // Recover with valid input
    await lengthInput.fill('650');
    await expect(page.getByText('Metric dimensions must be whole millimetres.')).not.toBeVisible();
    await expect(page.getByText('Design is geometrically valid')).toBeVisible();
    await expect(page.getByText('542 mm')).toBeVisible();
  });
});
