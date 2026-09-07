import { test, expect } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

test.describe('Phase 13 — Workshop PDF Export End-to-End Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.locator('.persistence-badge-not_saved')).toBeVisible();
  });

  test('Workflow A — Export PDF from default design', async ({ page }) => {
    const exportPdfBtn = page.getByRole('button', { name: 'Export PDF' });
    await expect(exportPdfBtn).toBeVisible();
    await expect(exportPdfBtn).toBeEnabled();

    // Trigger PDF Export and wait for browser download
    const downloadPromise = page.waitForEvent('download');
    await exportPdfBtn.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('japanese-toolbox-workshop-plan.pdf');
    await expect(page.getByText('Workshop PDF exported.')).toBeVisible();

    // Read the downloaded payload
    const downloadStream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of downloadStream) {
      chunks.push(Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    expect(pdfBuffer.length).toBeGreaterThan(5000);

    // Verify PDF header %PDF-
    const headerString = pdfBuffer.subarray(0, 5).toString('ascii');
    expect(headerString).toBe('%PDF-');

    // Parse with pdf-lib to verify structural validity
    const doc = await PDFDocument.load(pdfBuffer);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(6);
    expect(doc.getTitle()).toContain('Japanese Toolbox Workshop Plan');
    expect(doc.getAuthor()).toBe('Japanese Toolbox Designer');
  });

  test('Workflow B — Export PDF with modified design name, dimensions and wood species', async ({
    page,
  }) => {
    await page.goto('/');

    // 1. Rename to "Oak Master Toolbox"
    await page.getByRole('button', { name: 'Rename' }).click();
    const renameInput = page.getByLabel('Design name');
    await renameInput.fill('Oak Master Toolbox');
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Oak Master Toolbox' })).toBeVisible();

    // 2. Change length to 650
    const lengthInput = page.getByLabel(/^Length/i);
    await lengthInput.fill('650');

    // 3. Select Oak wood
    const woodSelect = page.getByRole('combobox', { name: /Wood species/i });
    await woodSelect.selectOption('oak');

    // 4. Export PDF
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export PDF' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('oak-master-toolbox-workshop-plan.pdf');
    await expect(page.getByText('Workshop PDF exported.')).toBeVisible();

    const downloadStream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of downloadStream) {
      chunks.push(Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);
    const doc = await PDFDocument.load(pdfBuffer);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(6);
    expect(doc.getTitle()).toBe('Oak Master Toolbox - Japanese Toolbox Workshop Plan');
  });

  test('Workflow C — Export PDF is disabled when input draft is invalid or geometry is invalid', async ({
    page,
  }) => {
    await page.goto('/');

    const exportPdfBtn = page.getByRole('button', { name: 'Export PDF' });
    await expect(exportPdfBtn).toBeEnabled();

    // Enter parse-invalid draft
    const lengthInput = page.getByLabel(/^Length/i);
    await lengthInput.fill('invalid');

    await expect(exportPdfBtn).toBeDisabled();
    await expect(exportPdfBtn).toHaveAttribute(
      'title',
      'Resolve invalid field values before exporting PDF',
    );

    // Enter physically invalid geometry (e.g. length = 100)
    await lengthInput.fill('100');
    await expect(exportPdfBtn).toBeDisabled();
    await expect(exportPdfBtn).toHaveAttribute('title', 'Cannot export PDF with geometry errors');
  });
});
