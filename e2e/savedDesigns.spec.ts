import { test, expect } from '@playwright/test';

test.describe('Phase 7 — Saved Designs End-to-End Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean localStorage for each test run
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('Workflow A — Persistence across page reload', async ({ page }) => {
    // 1. Open application
    await page.goto('/');
    await expect(page.locator('.persistence-badge-not_saved')).toBeVisible();

    // 2. Edit design length to 750
    const lengthInput = page.getByLabel(/^Length/i);
    await lengthInput.fill('750');

    // 3. Save
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('.persistence-badge-saved')).toBeVisible();
    await expect(page.getByText('Design saved.')).toBeVisible();

    // 4. Reload page
    await page.reload();

    // 5. Verify saved design and value are restored
    await expect(page.locator('.persistence-badge-saved')).toBeVisible();
    await expect(page.getByLabel(/^Length/i)).toHaveValue('750');
    await expect(page.getByText('714 mm')).toBeVisible(); // Internal length

    // 6. Further edit after saving now transitions to Unsaved changes
    await lengthInput.fill('780');
    await expect(page.locator('.persistence-badge-unsaved_changes')).toBeVisible();
  });

  test('Workflow B — Multiple designs and opening saved designs', async ({ page }) => {
    // 1. Save initial design (Length 600) as Japanese Toolbox
    await page.goto('/');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('.persistence-badge-saved')).toBeVisible();

    // 2. New design
    await page.getByRole('button', { name: 'New' }).click();
    await expect(page.locator('.persistence-badge-not_saved')).toBeVisible();

    // 3. Rename to "Long Tool Chest"
    await page.getByRole('button', { name: 'Rename' }).click();
    const renameInput = page.getByLabel('Design name');
    await renameInput.fill('Long Tool Chest');
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Long Tool Chest' })).toBeVisible();

    // 4. Change dimension and Save
    const lengthInput = page.getByLabel(/^Length/i);
    await lengthInput.fill('850');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('.persistence-badge-saved')).toBeVisible();

    // 5. Open first design from selector
    const selector = page.getByLabel('Saved designs');
    await selector.selectOption({ label: 'Japanese Toolbox' });
    await page.getByRole('button', { name: 'Open' }).click();

    // 6. Verify dimensions switch back
    await expect(page.getByRole('heading', { level: 2, name: 'Japanese Toolbox' })).toBeVisible();
    await expect(page.getByLabel(/^Length/i)).toHaveValue('600');
  });

  test('Workflow C — Duplicate and delete design', async ({ page }) => {
    // 1. Open application and Save initial design
    await page.goto('/');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('.persistence-badge-saved')).toBeVisible();

    // 2. Duplicate
    await page.getByRole('button', { name: 'Duplicate' }).click();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Japanese Toolbox (copy)' }),
    ).toBeVisible();
    await expect(page.locator('.persistence-badge-not_saved')).toBeVisible();

    // 3. Save the copy
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('.persistence-badge-saved')).toBeVisible();

    // 4. Delete the copy (handle window.confirm)
    page.on('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Delete' }).click();

    // 5. Verify original remains and is open
    await expect(page.getByRole('heading', { level: 2, name: 'Japanese Toolbox' })).toBeVisible();
    await expect(page.locator('.persistence-badge-saved')).toBeVisible();
  });
});
