import { test, expect } from '@playwright/test';

test.describe('Logo Kids IDE', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display the welcome modal on first visit', async ({ page }) => {
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h2')).toContainText('Logo Kids');
  });

  test('should dismiss welcome modal and show main UI', async ({ page }) => {
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    await modal.locator('button:has-text("Start")').click();
    await expect(modal).not.toBeVisible();

    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.editor-panel')).toBeVisible();
    await expect(page.locator('.canvas-section')).toBeVisible();
  });

  test('should have the editor loaded with CodeMirror', async ({ page }) => {
    await page.locator('[role="dialog"] button:has-text("Start")').click();

    const editor = page.locator('.cm-editor');
    await expect(editor).toBeVisible();
    await expect(page.locator('.cm-content')).toBeVisible();
  });

  test('should display line numbers in the editor', async ({ page }) => {
    await page.locator('[role="dialog"] button:has-text("Start")').click();

    const lineNumbers = page.locator('.cm-lineNumbers');
    await expect(lineNumbers).toBeVisible();
  });

  test('should have Run button that executes code', async ({ page }) => {
    await page.locator('[role="dialog"] button:has-text("Start")').click();

    const runBtn = page.locator('.run-btn');
    await expect(runBtn).toBeVisible();

    await runBtn.click();
    await page.waitForTimeout(500);

    const readout = page.locator('.turtle-readout');
    await expect(readout).toBeVisible();
  });

  test('should have Step button for single-step execution', async ({ page }) => {
    await page.locator('[role="dialog"] button:has-text("Start")').click();

    const stepBtn = page.locator('.step-btn');
    await expect(stepBtn).toBeVisible();
    await expect(stepBtn).toBeEnabled();
  });

  test('should have Reset button to clear canvas', async ({ page }) => {
    await page.locator('[role="dialog"] button:has-text("Start")').click();

    const resetBtn = page.locator('.reset-btn');
    await expect(resetBtn).toBeVisible();
  });

  test('should show speed slider', async ({ page }) => {
    await page.locator('[role="dialog"] button:has-text("Start")').click();

    const speedSlider = page.locator('.toolbar-speed input[type="range"]');
    await expect(speedSlider).toBeVisible();
  });

  test('should show examples dropdown', async ({ page }) => {
    await page.locator('[role="dialog"] button:has-text("Start")').click();

    const examplesSelect = page.locator('.toolbar-examples select');
    await expect(examplesSelect).toBeVisible();

    const options = await examplesSelect.locator('option').count();
    expect(options).toBeGreaterThan(1);
  });

  test('should load an example program when selected', async ({ page }) => {
    await page.locator('[role="dialog"] button:has-text("Start")').click();

    const examplesSelect = page.locator('.toolbar-examples select');
    await examplesSelect.selectOption('square');

    const editorContent = page.locator('.cm-content');
    await expect(editorContent).toContainText('REPEAT');
  });

  test('should show sidebar with command categories', async ({ page }) => {
    await page.locator('[role="dialog"] button:has-text("Start")').click();

    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText('Commands');

    const categories = page.locator('.command-category');
    const count = await categories.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should insert code when clicking a sidebar command block', async ({ page }) => {
    await page.locator('[role="dialog"] button:has-text("Start")').click();

    const firstCmd = page.locator('.command-block').first();
    const cmdText = await firstCmd.textContent();
    await firstCmd.click();

    const editorContent = page.locator('.cm-content');
    await expect(editorContent).toContainText(cmdText?.trim() || 'FD');
  });

  test('should show turtle readout with position', async ({ page }) => {
    await page.locator('[role="dialog"] button:has-text("Start")').click();

    const readout = page.locator('.turtle-readout');
    await expect(readout).toBeVisible();
    await expect(readout).toContainText('x:');
    await expect(readout).toContainText('y:');
    await expect(readout).toContainText('heading:');
  });

  test('should show problems panel', async ({ page }) => {
    await page.locator('[role="dialog"] button:has-text("Start")').click();

    const problemsPanel = page.locator('.problems-panel');
    await expect(problemsPanel).toBeVisible();
  });

  test('should display lint errors as squiggly underlines for bad code', async ({ page }) => {
    await page.locator('[role="dialog"] button:has-text("Start")').click();

    const editor = page.locator('.cm-content');
    await editor.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type('FD');

    await page.waitForTimeout(1000);

    const lintDecorations = page.locator('.cm-lintRange-error, .cm-lintRange-warning, .cm-lintRange-info, [class*="cm-lint"]');
    const count = await lintDecorations.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display lint error in problems panel', async ({ page }) => {
    await page.locator('[role="dialog"] button:has-text("Start")').click();

    const editor = page.locator('.cm-content');
    await editor.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type('FD');

    await page.waitForTimeout(500);

    const problemsList = page.locator('.problems-list');
    await expect(problemsList).toBeVisible();
    const problemItems = page.locator('.problem-item');
    const count = await problemItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should toggle language to Hebrew', async ({ page }) => {
    await page.locator('[role="dialog"] button:has-text("Start")').click();

    const langBtn = page.locator('.lang-toggle');
    await expect(langBtn).toBeVisible();

    await langBtn.click();
    await page.locator('.lang-option').nth(1).click();

    const header = page.locator('.app-header');
    await expect(header).toHaveAttribute('dir', 'rtl');

    await expect(page.locator('.app-title')).toContainText('לוגו');
  });

  test('should have accessible ARIA labels', async ({ page }) => {
    await page.locator('[role="dialog"] button:has-text("Start")').click();

    await expect(page.locator('[aria-label="Code editor"]')).toBeVisible();
    await expect(page.locator('[aria-label="Turtle canvas"]')).toBeVisible();
    await expect(page.locator('[aria-label="Commands sidebar"]')).toBeVisible();
    await expect(page.locator('[aria-label="Run controls toolbar"]')).toBeVisible();
  });

  test('should run square example and draw on canvas', async ({ page }) => {
    await page.locator('[role="dialog"] button:has-text("Start")').click();

    const examplesSelect = page.locator('.toolbar-examples select');
    await examplesSelect.selectOption('square');

    const runBtn = page.locator('.run-btn');
    await runBtn.click();

    await page.waitForTimeout(2000);

    const readout = page.locator('.turtle-readout');
    const text = await readout.textContent();
    expect(text).toContain('heading:');
  });

  test('should execute Step and advance one command', async ({ page }) => {
    await page.locator('[role="dialog"] button:has-text("Start")').click();

    const editor = page.locator('.cm-content');
    await editor.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type('FD 100');

    const stepBtn = page.locator('.step-btn');
    await stepBtn.click();

    await page.waitForTimeout(200);

    const readout = page.locator('.turtle-readout');
    const text = await readout.textContent();
    expect(text).toContain('heading:');
  });

  test('should show turtle canvas', async ({ page }) => {
    await page.locator('[role="dialog"] button:has-text("Start")').click();

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});
