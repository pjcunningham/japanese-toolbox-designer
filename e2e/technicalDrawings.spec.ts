import { test, expect } from '@playwright/test';

test.describe('Phase 9 — Technical Drawings E2E Workflows', () => {
  test('Workflow A — view tabs switching (Requirements 45, 76)', async ({ page }) => {
    await page.goto('/');

    // 1. Verify Technical Drawings heading and Plan view active by default
    const heading = page.getByRole('heading', { level: 2, name: /Technical drawings/i });
    await expect(heading).toBeVisible();

    const planTab = page.getByRole('tab', { name: 'Plan', exact: true });
    const frontTab = page.getByRole('tab', { name: 'Front', exact: true });
    const endTab = page.getByRole('tab', { name: 'End', exact: true });

    await expect(planTab).toHaveAttribute('aria-selected', 'true');
    const svg = page.locator('.technical-drawing-svg');
    await expect(svg).toHaveAttribute('data-view', 'plan');
    await expect(svg.getByText('STOP END')).toBeVisible();
    await expect(svg.getByText('LOCKING END')).toBeVisible();
    await expect(svg.getByText(/Inset housed end wall/i)).toBeVisible();
    await expect(svg.getByText(/Grab handle below end cap/i)).toBeVisible();

    // 2. Switch to Front elevation
    await frontTab.click();
    await expect(frontTab).toHaveAttribute('aria-selected', 'true');
    await expect(svg).toHaveAttribute('data-view', 'front');
    await expect(svg.locator('#front-ann-captured-wedge')).toBeVisible();
    await expect(svg.locator('#front-ann-grab-handle')).toBeVisible();
    await expect(svg.locator('#front-ann-inset-end-wall')).toBeVisible();

    // 3. Switch to End elevation
    await endTab.click();
    await expect(endTab).toHaveAttribute('aria-selected', 'true');
    await expect(svg).toHaveAttribute('data-view', 'end');
    await expect(svg.locator('#end-ann-clearance')).toBeVisible();
    await expect(svg.locator('#end-ann-grab-handle')).toBeVisible();
    await expect(svg.locator('#end-ann-inset-end-wall')).toBeVisible();
  });

  test('Workflow B — zoom and pan interactions (Requirements 46–52, 77)', async ({ page }) => {
    await page.goto('/');

    const svg = page.locator('.technical-drawing-svg');
    await expect(svg).toBeVisible();

    // Capture initial fitted viewBox
    const initialViewBox = await svg.getAttribute('viewBox');
    expect(initialViewBox).toBeTruthy();

    // Zoom In
    const zoomInBtn = page.getByRole('button', { name: 'Zoom in' });
    await zoomInBtn.click();
    const zoomedViewBox = await svg.getAttribute('viewBox');
    expect(zoomedViewBox).not.toBe(initialViewBox);

    // Drag / pan drawing
    const boundingBox = await svg.boundingBox();
    if (boundingBox) {
      await page.mouse.move(
        boundingBox.x + boundingBox.width / 2,
        boundingBox.y + boundingBox.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(
        boundingBox.x + boundingBox.width / 2 + 60,
        boundingBox.y + boundingBox.height / 2 + 40,
        { steps: 5 },
      );
      await page.mouse.up();
    }

    const pannedViewBox = await svg.getAttribute('viewBox');
    expect(pannedViewBox).not.toBe(zoomedViewBox);

    // Fit to view
    const fitBtn = page.getByRole('button', { name: 'Fit to view' });
    await fitBtn.click();
    const restoredViewBox = await svg.getAttribute('viewBox');
    expect(restoredViewBox).toBe(initialViewBox);
  });

  test('Workflow C — live design update & unit switching (Requirements 15, 39, 78)', async ({
    page,
  }) => {
    await page.goto('/');

    // 1. Initial Plan view length dimension
    await expect(page.getByText(/Length X: 600 mm/i)).toBeVisible();

    // 2. Change length to 680 mm
    const lengthInput = page.getByLabel(/^Length/i);
    await lengthInput.fill('680');
    await expect(page.getByText(/Length X: 680 mm/i)).toBeVisible();

    // 3. Switch to Imperial
    const imperialRadio = page.getByRole('radio', { name: 'Imperial' });
    await imperialRadio.click();

    // 4. Verify drawing dimension updates to imperial fractions (680 mm = 26 3/4")
    await expect(page.getByText(/Length X: 26 3\/4"/i)).toBeVisible();
  });

  test('Workflow D — Phase 13A vertical dimensions and annotation layout', async ({ page }) => {
    await page.goto('/');

    const svg = page.locator('.technical-drawing-svg');
    await expect(svg).toBeVisible();

    // 1. Plan drawing: Width Y is vertically oriented
    const widthYDim = svg.locator('[data-dimension="plan-dim-overall-width"] text.dimension-text');
    await expect(widthYDim).toBeVisible();
    await expect(widthYDim).toHaveText('Width Y: 300 mm');
    const widthYTransform = await widthYDim.getAttribute('transform');
    expect(widthYTransform).toMatch(/^rotate\(-90/);

    // 2. Switch to Front elevation
    const frontTab = page.getByRole('tab', { name: 'Front', exact: true });
    await frontTab.click();

    // 3. Front drawing: Body Height is vertically oriented
    const bodyHeightDim = svg.locator(
      '[data-dimension="front-dim-body-height"] text.dimension-text',
    );
    await expect(bodyHeightDim).toBeVisible();
    await expect(bodyHeightDim).toHaveText('Body Height: 250 mm');
    const bodyHeightTransform = await bodyHeightDim.getAttribute('transform');
    expect(bodyHeightTransform).toMatch(/^rotate\(-90/);

    // 4. Front drawing: LOCKING END and Captured wedge annotations both visible and distinct
    const lockingEndAnn = svg.locator('#front-ann-locking-end');
    const capturedWedgeAnn = svg.locator('#front-ann-captured-wedge');
    await expect(lockingEndAnn).toBeVisible();
    await expect(lockingEndAnn).toHaveText('LOCKING END');

    await expect(capturedWedgeAnn).toBeVisible();
    const primaryTspan = capturedWedgeAnn.locator('tspan').first();
    const secondaryTspan = capturedWedgeAnn.locator('tspan.drawing-annotation-secondary');
    await expect(primaryTspan).toHaveText('Captured wedge');
    await expect(secondaryTspan).toHaveText('β = 10°');
  });
});
