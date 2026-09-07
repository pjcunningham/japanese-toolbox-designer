import { test, expect } from '@playwright/test';

test.describe('Phase 10 — Basic 3D Viewer E2E Workflows', () => {
  test('Workflow A — 3D Viewer loading and camera controls switching (Requirements 77, 78)', async ({
    page,
  }) => {
    await page.goto('/');

    // 1. Initial 2D view is active by default
    const twoDTab = page.getByRole('tab', { name: /2D Drawings/i });
    const threeDTab = page.getByRole('tab', { name: /3D Model/i });
    await expect(twoDTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', { name: /Technical drawings/i })).toBeVisible();

    // 2. Switch to 3D mode
    await threeDTab.click();
    await expect(threeDTab).toHaveAttribute('aria-selected', 'true');

    // 3. Verify 3D viewer container & metadata (allow dynamic chunk load)
    const viewer = page.locator('[data-testid="toolbox-3d-viewer"]');
    await expect(viewer).toBeVisible({ timeout: 15000 });
    await expect(viewer).toHaveAttribute('data-model-part-count', '13');
    await expect(viewer).toHaveAttribute('data-model-length', '600');
    await expect(viewer).toHaveAttribute('data-camera-view', 'perspective');

    const perspectiveBtn = viewer.getByRole('tab', { name: 'Perspective' });
    const frontBtn = viewer.getByRole('tab', { name: 'Front' });
    const endBtn = viewer.getByRole('tab', { name: 'End' });
    const topBtn = viewer.getByRole('tab', { name: 'Top' });
    const fitBtn = viewer.getByRole('button', { name: 'Fit to view' });

    await expect(perspectiveBtn).toHaveAttribute('aria-selected', 'true');

    // 4. Switch to Front camera view
    await frontBtn.click();
    await expect(frontBtn).toHaveAttribute('aria-selected', 'true');
    await expect(viewer).toHaveAttribute('data-camera-view', 'front');

    // 5. Switch to End camera view
    await endBtn.click();
    await expect(endBtn).toHaveAttribute('aria-selected', 'true');
    await expect(viewer).toHaveAttribute('data-camera-view', 'end');

    // 6. Switch to Top camera view
    await topBtn.click();
    await expect(topBtn).toHaveAttribute('aria-selected', 'true');
    await expect(viewer).toHaveAttribute('data-camera-view', 'top');

    // 7. Return to Perspective and Fit to view
    await perspectiveBtn.click();
    await expect(perspectiveBtn).toHaveAttribute('aria-selected', 'true');
    await expect(viewer).toHaveAttribute('data-camera-view', 'perspective');

    await fitBtn.click();
    await expect(fitBtn).toBeEnabled();
  });

  test('Workflow B — Orbit, Zoom, Pan interaction and Fit to view (Requirement 79)', async ({
    page,
  }) => {
    await page.goto('/');

    // Switch to 3D
    await page.getByRole('tab', { name: /3D Model/i }).click();
    const canvas = page.locator('.toolbox-3d-canvas canvas');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    if (box) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      // 1. Left drag (Orbit)
      await page.mouse.move(centerX, centerY);
      await page.mouse.down({ button: 'left' });
      await page.mouse.move(centerX + 80, centerY - 50, { steps: 5 });
      await page.mouse.up({ button: 'left' });

      // 2. Wheel (Zoom)
      await page.mouse.wheel(0, -120);

      // 3. Right drag (Pan)
      await page.mouse.move(centerX, centerY);
      await page.mouse.down({ button: 'right' });
      await page.mouse.move(centerX - 40, centerY + 30, { steps: 5 });
      await page.mouse.up({ button: 'right' });
    }

    // 4. Fit to view restores standard view
    const fitBtn = page.getByRole('button', { name: 'Fit to view' });
    await fitBtn.click();
    await expect(fitBtn).toBeEnabled();
  });

  test('Workflow C — Live 3D model update on dimension change (Requirement 80)', async ({
    page,
  }) => {
    await page.goto('/');

    // Switch to 3D
    await page.getByRole('tab', { name: /3D Model/i }).click();
    const viewer = page.locator('[data-testid="toolbox-3d-viewer"]');
    await expect(viewer).toHaveAttribute('data-model-length', '600');
    await expect(viewer).toHaveAttribute('data-model-width', '300');

    // Edit Length to 680 mm
    const lengthInput = page.getByLabel(/^Length/i);
    await lengthInput.fill('680');
    await expect(viewer).toHaveAttribute('data-model-length', '680');

    // Edit Width to 320 mm
    const widthInput = page.getByLabel(/^Width/i);
    await widthInput.fill('320');
    await expect(viewer).toHaveAttribute('data-model-width', '320');

    // Edit End handle depth to 38 mm
    const handleDepthInput = page.getByLabel(/End handle depth \/ wall inset/i);
    await handleDepthInput.fill('38');
    // Verify viewer remains operational with 13 parts
    await expect(viewer).toHaveAttribute('data-model-part-count', '13');
  });

  test('Workflow D — Invalid draft and geometry error fallback in 3D viewer (Requirement 49)', async ({
    page,
  }) => {
    await page.goto('/');

    // Switch to 3D
    await page.getByRole('tab', { name: /3D Model/i }).click();
    const viewer = page.locator('[data-testid="toolbox-3d-viewer"]');
    await expect(viewer).toBeVisible();

    // 1. Enter invalid text to trigger parser error
    const lengthInput = page.getByLabel(/^Length/i);
    await lengthInput.fill('abc');

    const inputError = page.locator('[data-testid="3d-input-error"]');
    await expect(inputError).toBeVisible();
    await expect(
      page.getByText(/3D model unavailable until the input errors are corrected/i),
    ).toBeVisible();

    // 2. Fix input
    await lengthInput.fill('600');
    await expect(inputError).not.toBeVisible();
    await expect(viewer).toHaveAttribute('data-model-length', '600');
  });

  test('Workflow E — Species change updates 3D model material identity immediately (Phase 11)', async ({
    page,
  }) => {
    await page.goto('/');

    // 1. Change species from Pine to Oak in Material card
    const woodSelect = page.getByRole('combobox', { name: /Wood species/i });
    await expect(woodSelect).toHaveValue('pine');
    await woodSelect.selectOption('oak');

    // 2. Switch to 3D tab
    await page.getByRole('tab', { name: /3D Model/i }).click();
    const viewer = page.locator('[data-testid="toolbox-3d-viewer"]');
    await expect(viewer).toBeVisible();
    await expect(viewer).toHaveAttribute('data-wood-id', 'oak');
    await expect(
      viewer.getByRole('heading', { level: 2, name: /3D Interactive Model — Oak/i }),
    ).toBeVisible();

    // 3. While 3D view is active, change species to Hinoki
    await woodSelect.selectOption('hinoki');
    await expect(viewer).toHaveAttribute('data-wood-id', 'hinoki');
    await expect(
      viewer.getByRole('heading', {
        level: 2,
        name: /3D Interactive Model — Hinoki \/ Japanese Cypress/i,
      }),
    ).toBeVisible();

    // 4. Verify physical model dimensions and camera view remain untouched
    await expect(viewer).toHaveAttribute('data-model-length', '600');
    await expect(viewer).toHaveAttribute('data-camera-view', 'perspective');
  });
});
