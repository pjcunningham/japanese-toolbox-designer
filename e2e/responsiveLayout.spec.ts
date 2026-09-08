import { test, expect, type Page } from '@playwright/test';

test.describe('Phase 14 — Responsive UI and Polish End-to-End Workflows', () => {
  // Helper to assert whole-page horizontal overflow
  async function assertNoHorizontalPageOverflow(page: Page) {
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    });
    expect(isOverflowing).toBe(false);
  }

  test('Wide Desktop (1920x1080): 3-column CAD workstation layout, fluid width, dominant viewer, full-width workshop', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Japanese Toolbox Designer' }),
    ).toBeVisible();

    // Verify main content uses >= 85% of viewport width (breaking the 960px limit)
    const mainBox = await page.locator('.app-main').boundingBox();
    expect(mainBox).not.toBeNull();
    if (mainBox) {
      expect(mainBox.width).toBeGreaterThanOrEqual(1920 * 0.85);
    }

    // Verify 3 columns exist and are displayed side-by-side
    const inputsCol = page.locator('.editor-inputs-column');
    const vizCol = page.locator('.editor-visualization-column');
    const calcCol = page.locator('.editor-calculated-column');
    const workshopSec = page.locator('.editor-workshop-section');

    await expect(inputsCol).toBeVisible();
    await expect(vizCol).toBeVisible();
    await expect(calcCol).toBeVisible();
    await expect(workshopSec).toBeVisible();

    const inputsBox = await inputsCol.boundingBox();
    const vizBox = await vizCol.boundingBox();
    const calcBox = await calcCol.boundingBox();
    const workshopBox = await workshopSec.boundingBox();

    expect(inputsBox).not.toBeNull();
    expect(vizBox).not.toBeNull();
    expect(calcBox).not.toBeNull();
    expect(workshopBox).not.toBeNull();

    if (inputsBox && vizBox && calcBox && workshopBox) {
      // Horizontal ordering: inputs < viz < calc
      expect(inputsBox.x).toBeLessThan(vizBox.x);
      expect(vizBox.x).toBeLessThan(calcBox.x);

      // Rails bounded and central viewer dominant
      expect(inputsBox.width).toBeLessThanOrEqual(420);
      expect(calcBox.width).toBeLessThanOrEqual(450);
      expect(vizBox.width).toBeGreaterThan(inputsBox.width);
      expect(vizBox.width).toBeGreaterThan(calcBox.width);

      // Workshop spans beneath and full width
      expect(workshopBox.y).toBeGreaterThan(inputsBox.y);
      expect(workshopBox.width).toBeGreaterThan(vizBox.width);
    }

    await assertNoHorizontalPageOverflow(page);
  });

  test('Ultra-wide Desktop (2560x1440): workspace expands, rails remain bounded, viewer absorbs width', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto('/');

    const mainBox = await page.locator('.app-main').boundingBox();
    expect(mainBox).not.toBeNull();
    if (mainBox) {
      expect(mainBox.width).toBeGreaterThan(2000);
    }

    const inputsBox = await page.locator('.editor-inputs-column').boundingBox();
    const vizBox = await page.locator('.editor-visualization-column').boundingBox();
    const calcBox = await page.locator('.editor-calculated-column').boundingBox();

    if (inputsBox && vizBox && calcBox) {
      // Side rails stay reasonably bounded (not stretching to thousands of pixels)
      expect(inputsBox.width).toBeLessThanOrEqual(420);
      expect(calcBox.width).toBeLessThanOrEqual(450);

      // Central visualizer receives the majority of space
      expect(vizBox.width).toBeGreaterThan(1200);
    }

    await assertNoHorizontalPageOverflow(page);
  });

  test('Normal Laptop (1366x768): 2-column layout active and accessible without overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');

    const inputsCol = page.locator('.editor-inputs-column');
    const vizCol = page.locator('.editor-visualization-column');
    const calcCol = page.locator('.editor-calculated-column');

    await expect(inputsCol).toBeVisible();
    await expect(vizCol).toBeVisible();
    await expect(calcCol).toBeVisible();

    const inputsBox = await inputsCol.boundingBox();
    const vizBox = await vizCol.boundingBox();
    const calcBox = await calcCol.boundingBox();

    if (inputsBox && vizBox && calcBox) {
      // Left rail: inputs. Right side: viz stacked above calc.
      expect(inputsBox.x).toBeLessThan(vizBox.x);
      expect(vizBox.x).toEqual(calcBox.x);
      expect(vizBox.y).toBeLessThan(calcBox.y);
    }

    await assertNoHorizontalPageOverflow(page);
  });

  test('Tablet (1024x768 and 768x1024): clean responsive layout, all controls usable', async ({
    page,
  }) => {
    // 1024x768 landscape
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');

    await expect(page.getByLabel(/^Length/i)).toBeVisible();
    await expect(page.getByRole('tab', { name: '2D Drawings' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Calculated design' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Workshop' })).toBeVisible();
    await assertNoHorizontalPageOverflow(page);

    // 768x1024 portrait
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();

    await expect(page.getByLabel(/^Length/i)).toBeVisible();
    await expect(page.getByRole('tab', { name: '2D Drawings' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Calculated design' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Workshop' })).toBeVisible();
    await assertNoHorizontalPageOverflow(page);
  });

  test('Mobile (390x844): single-column flow, wrapped actions, usable viewers and no whole-page scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    // Natural sequential vertical flow
    const designManager = page.locator('.design-manager');
    const topBar = page.locator('.editor-top-bar');
    const inputsCol = page.locator('.editor-inputs-column');
    const vizCol = page.locator('.editor-visualization-column');
    const calcCol = page.locator('.editor-calculated-column');
    const workshopSec = page.locator('.editor-workshop-section');

    const dmBox = await designManager.boundingBox();
    const topBarBox = await topBar.boundingBox();
    const inputsBox = await inputsCol.boundingBox();
    const vizBox = await vizCol.boundingBox();
    const calcBox = await calcCol.boundingBox();
    const workshopBox = await workshopSec.boundingBox();

    if (dmBox && topBarBox && inputsBox && vizBox && calcBox && workshopBox) {
      expect(dmBox.y).toBeLessThan(topBarBox.y);
      expect(topBarBox.y).toBeLessThan(inputsBox.y);
      expect(inputsBox.y).toBeLessThan(vizBox.y);
      expect(vizBox.y).toBeLessThan(calcBox.y);
      expect(calcBox.y).toBeLessThan(workshopBox.y);
    }

    // Form inputs and buttons usable
    const lengthInput = page.getByLabel(/^Length/i);
    await expect(lengthInput).toBeVisible();
    await lengthInput.fill('650');
    await expect(page.getByText('542 mm')).toBeVisible();

    // Cut List table container has contained scroll, no page-level overflow
    const cutlistContainer = page.locator('.workshop-cutlist-table-container');
    await expect(cutlistContainer).toBeVisible();

    await assertNoHorizontalPageOverflow(page);
  });

  test('Viewer height consistency: 2D drawings and 3D viewer maintain consistent heights', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // 2D Viewer height
    const drawingViewer = page.locator('.technical-drawing-viewer');
    await expect(drawingViewer).toBeVisible();
    const drawingBox = await drawingViewer.boundingBox();
    expect(drawingBox).not.toBeNull();

    // Switch to 3D Viewer
    await page.getByRole('tab', { name: '3D Model' }).click();
    const threeDCanvasWrapper = page.locator('.toolbox-3d-canvas-wrapper');
    await expect(threeDCanvasWrapper).toBeVisible();
    const threeDBox = await threeDCanvasWrapper.boundingBox();
    expect(threeDBox).not.toBeNull();

    if (drawingBox && threeDBox) {
      // Heights should match or have minimal difference (<= 10px) to prevent dramatic layout shift
      expect(Math.abs(drawingBox.height - threeDBox.height)).toBeLessThanOrEqual(10);
    }
  });

  test('Workshop responsive enhancements: wide cut list table and two-column process plan on desktop', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // Cut list table spans full workshop container width
    const cutlistTable = page.locator('.cutlist-table');
    await expect(cutlistTable).toBeVisible();
    const notesHeader = cutlistTable.locator('.col-notes');
    const notesBox = await notesHeader.boundingBox();
    expect(notesBox).not.toBeNull();
    if (notesBox) {
      // Notes column has comfortable width (>= 250px) preventing cramped wrapping
      expect(notesBox.width).toBeGreaterThanOrEqual(250);
    }

    // Switch to process plan
    await page.getByRole('tab', { name: 'Process plan' }).click();
    const processStepsList = page.locator('.process-steps-list');
    await expect(processStepsList).toBeVisible();

    // Step 1 and Step 2 displayed in 2-column grid side-by-side
    const step1 = page.locator('.process-step-card.step-prepare-stock');
    const step2 = page.locator('.process-step-card.step-cut-sides');
    await expect(step1).toBeVisible();
    await expect(step2).toBeVisible();

    const step1Box = await step1.boundingBox();
    const step2Box = await step2.boundingBox();

    if (step1Box && step2Box) {
      // Side by side on wide screens: step1.x < step2.x
      expect(step1Box.x).toBeLessThan(step2Box.x);
    }
  });
});
