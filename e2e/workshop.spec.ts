import { test, expect } from '@playwright/test';

test.describe('Phase 12 — Workshop Cut List and Construction Process Plan', () => {
  test('Workflow A: displays Cut List by default with all 8 line items and summary counts', async ({
    page,
  }) => {
    await page.goto('/');

    const workshopHeading = page.getByRole('heading', { level: 2, name: 'Workshop' });
    await expect(workshopHeading).toBeVisible();

    const cutListTab = page.getByRole('tab', { name: 'Cut list' });
    await expect(cutListTab).toHaveAttribute('aria-selected', 'true');

    // Verify summary pills
    await expect(page.getByText('8 line items')).toBeVisible();
    await expect(page.getByText('12 stock blanks')).toBeVisible();
    await expect(page.getByText('13 finished parts')).toBeVisible();

    // Verify all 8 line items
    const cutListTable = page.getByRole('table', { name: 'Workshop Cut List' });
    await expect(cutListTable).toBeVisible();

    await expect(page.getByTestId('cutlist-row-side')).toBeVisible();
    await expect(page.getByTestId('cutlist-row-end-wall')).toBeVisible();
    await expect(page.getByTestId('cutlist-row-bottom')).toBeVisible();
    await expect(page.getByTestId('cutlist-row-handle')).toBeVisible();
    await expect(page.getByTestId('cutlist-row-end-cap')).toBeVisible();
    await expect(page.getByTestId('cutlist-row-lid-panel')).toBeVisible();
    await expect(page.getByTestId('cutlist-row-straight-lid-batten')).toBeVisible();
    await expect(page.getByTestId('cutlist-row-locking-set-blank')).toBeVisible();

    // Verify locking set combined blank explanation
    await expect(page.getByText(/Locking batten \+ wedge blank/i)).toBeVisible();
    await expect(page.getByText(/This single blank is machined to produce both/i)).toBeVisible();
  });

  test('Workflow B: switches to Process Plan and displays key construction steps', async ({
    page,
  }) => {
    await page.goto('/');

    const processPlanTab = page.getByRole('tab', { name: 'Process plan' });
    await processPlanTab.click();
    await expect(processPlanTab).toHaveAttribute('aria-selected', 'true');

    await expect(page.getByTestId('workshop-processplan-view')).toBeVisible();
    await expect(page.getByText('23 construction steps')).toBeVisible();

    // Verify key steps
    await expect(page.getByTestId('process-step-cut-housing-dados')).toBeVisible();
    await expect(page.getByText('Cut the end-wall housing dados')).toBeVisible();

    await expect(page.getByTestId('process-step-fit-handles')).toBeVisible();
    await expect(page.getByText('Fit grab handles')).toBeVisible();

    await expect(page.getByTestId('process-step-prepare-locking-blank')).toBeVisible();
    await expect(page.getByText('Prepare the locking batten/wedge blank')).toBeVisible();

    await expect(page.getByTestId('process-step-verify-lid-operation')).toBeVisible();
    await expect(page.getByText('Verify lid operation')).toBeVisible();
  });

  test('Workflow C: updates workshop live on dimension edits and switches units cleanly', async ({
    page,
  }) => {
    await page.goto('/');

    // Open advanced carcass details
    const carcassDetails = page.locator('details:has-text("Carcass & handles")');
    await carcassDetails.click();

    // Edit End handle depth / wall inset (I) from 36 to 37 (preserving valid lid release condition)
    const handleDepthInput = page.getByLabel(/End handle depth \/ wall inset/i);
    await handleDepthInput.fill('37');

    // Switch to Process plan tab to verify live measurement update
    const processPlanTab = page.getByRole('tab', { name: 'Process plan' });
    await processPlanTab.click();

    const markStep = page.getByTestId('process-step-mark-end-walls');
    await expect(markStep.getByText('37 mm')).toBeVisible();

    // Switch to Imperial
    const imperialRadio = page.getByRole('radio', { name: 'Imperial' });
    await imperialRadio.click();

    // Verify Cut list dimensions in imperial
    const cutListTab = page.getByRole('tab', { name: 'Cut list' });
    await cutListTab.click();

    await expect(page.getByTestId('cutlist-row-side').getByText('23 5/8"')).toBeVisible();
    await expect(page.getByTestId('cutlist-row-side').getByText('11/16"')).toBeVisible();
  });
});
