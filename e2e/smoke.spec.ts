import { test, expect } from '@playwright/test';

test.describe('Application Shell Smoke Test', () => {
  test('loads the application and displays the main heading', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Japanese Toolbox Designer/);

    const heading = page.getByRole('heading', { level: 1, name: 'Japanese Toolbox Designer' });
    await expect(heading).toBeVisible();

    const subtitle = page.getByText(/Parametric Japanese toolbox design in your browser/i);
    await expect(subtitle).toBeVisible();
  });
});
