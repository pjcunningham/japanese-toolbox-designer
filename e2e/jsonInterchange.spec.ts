import { test, expect } from '@playwright/test';

test.describe('Phase 8 — JSON Import/Export End-to-End Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean localStorage for each test run
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('Workflow A — Export and import round trip', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.persistence-badge-not_saved')).toBeVisible();

    // 1. Rename to "Master Workshop Box"
    await page.getByRole('button', { name: 'Rename' }).click();
    const renameInput = page.getByLabel('Design name');
    await renameInput.fill('Master Workshop Box');
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Master Workshop Box' }),
    ).toBeVisible();

    // 2. Modify dimensions (Length = 725, Width = 320)
    const lengthInput = page.getByLabel(/^Length/i);
    await lengthInput.fill('725');
    const widthInput = page.getByLabel(/^Width/i);
    await widthInput.fill('320');

    // 3. Trigger JSON Export and intercept browser download
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export JSON' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('master-workshop-box.json');
    await expect(page.getByText('Design exported as JSON.')).toBeVisible();

    // Read the downloaded payload
    const downloadStream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of downloadStream) {
      chunks.push(Buffer.from(chunk));
    }
    const exportedContent = Buffer.concat(chunks).toString('utf-8');
    const parsedJson = JSON.parse(exportedContent);
    expect(parsedJson.name).toBe('Master Workshop Box');
    expect(parsedJson.dimensions.length).toBe(725);
    expect(parsedJson.dimensions.width).toBe(320);

    // 4. Create a fresh New design
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'New' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Japanese Toolbox' })).toBeVisible();
    await expect(lengthInput).toHaveValue('600');

    // 5. Import the exported file back
    page.once('dialog', (dialog) => dialog.accept());
    const fileInput = page.locator('input[data-testid="import-json-input"]');
    await fileInput.setInputFiles({
      name: 'master-workshop-box.json',
      mimeType: 'application/json',
      buffer: Buffer.from(exportedContent),
    });

    // 6. Verify all values restored
    await expect(
      page.getByRole('heading', { level: 2, name: 'Master Workshop Box' }),
    ).toBeVisible();
    await expect(lengthInput).toHaveValue('725');
    await expect(widthInput).toHaveValue('320');
    await expect(page.locator('.persistence-badge-not_saved')).toBeVisible();
    await expect(
      page.getByText('Design imported. Save it to keep it in this browser.'),
    ).toBeVisible();
  });

  test('Workflow B — ID conflict resolution and saving as new design', async ({ page }) => {
    // 1. Open application and save initial design
    await page.goto('/');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('.persistence-badge-saved')).toBeVisible();

    // 2. Export the saved design
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export JSON' }).click();
    const download = await downloadPromise;

    const downloadStream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of downloadStream) {
      chunks.push(Buffer.from(chunk));
    }
    const exportedContent = Buffer.concat(chunks).toString('utf-8');

    // 3. Import the exact same file back (has identical ID)
    const fileInput = page.locator('input[data-testid="import-json-input"]');
    await fileInput.setInputFiles({
      name: 'japanese-toolbox.json',
      mimeType: 'application/json',
      buffer: Buffer.from(exportedContent),
    });

    // 4. Verify conflict resolution message and Not saved badge
    await expect(page.locator('.persistence-badge-not_saved')).toBeVisible();
    await expect(
      page.getByText('Design imported as a new design. Save it to keep it in this browser.'),
    ).toBeVisible();

    // 5. Click Save to save the new identity
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('.persistence-badge-saved')).toBeVisible();

    // 6. Verify 2 saved designs exist in the dropdown
    const selector = page.getByLabel('Saved designs');
    const options = selector.locator('option');
    await expect(options).toHaveCount(2);
  });

  test('Workflow C — Rejection of malformed JSON import', async ({ page }) => {
    await page.goto('/');
    const lengthInput = page.getByLabel(/^Length/i);
    await expect(lengthInput).toHaveValue('600');

    // Attempt to upload malformed file
    const fileInput = page.locator('input[data-testid="import-json-input"]');
    await fileInput.setInputFiles({
      name: 'corrupted.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{ not valid json content'),
    });

    // Verify error message displayed and design preserved
    await expect(page.getByText('The file contains invalid or unparseable JSON.')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Japanese Toolbox' })).toBeVisible();
    await expect(lengthInput).toHaveValue('600');
  });

  test('Workflow D — Wood species JSON export and import restoration (Phase 11)', async ({
    page,
  }) => {
    await page.goto('/');

    // 1. Select Beech species
    const woodSelect = page.getByRole('combobox', { name: /Wood species/i });
    await woodSelect.selectOption('beech');
    await expect(woodSelect).toHaveValue('beech');

    // 2. Export JSON
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export JSON' }).click();
    const download = await downloadPromise;

    const downloadStream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of downloadStream) {
      chunks.push(Buffer.from(chunk));
    }
    const exportedContent = Buffer.concat(chunks).toString('utf-8');
    const parsed = JSON.parse(exportedContent);
    expect(parsed.wood.id).toBe('beech');

    // 3. Create a New design (defaults back to pine)
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'New' }).click();
    await expect(page.getByRole('combobox', { name: /Wood species/i })).toHaveValue('pine');

    // 4. Import the exported file
    page.once('dialog', (dialog) => dialog.accept());
    const fileInput = page.locator('input[data-testid="import-json-input"]');
    await fileInput.setInputFiles({
      name: 'japanese-toolbox.json',
      mimeType: 'application/json',
      buffer: Buffer.from(exportedContent),
    });

    // 5. Verify Beech is restored in Material selector and 3D viewer
    await expect(page.getByRole('combobox', { name: /Wood species/i })).toHaveValue('beech');
    await page.getByRole('tab', { name: /3D Model/i }).click();
    const viewer = page.locator('[data-testid="toolbox-3d-viewer"]');
    await expect(viewer).toHaveAttribute('data-wood-id', 'beech');
    await expect(
      viewer.getByRole('heading', { level: 2, name: /3D Interactive Model — Beech/i }),
    ).toBeVisible();
  });
});
