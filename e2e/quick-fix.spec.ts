import { test, expect } from '@playwright/test';

async function dismissWelcome(page: import('@playwright/test').Page) {
  const modal = page.locator('[role="dialog"]');
  if (await modal.isVisible()) {
    await modal.locator('button:has-text("Start")').click();
    await expect(modal).not.toBeVisible();
  }
}

async function typeCode(page: import('@playwright/test').Page, code: string) {
  const editor = page.locator('.cm-content');
  await editor.click();
  await page.keyboard.press('Control+a');
  await page.keyboard.type(code, { delay: 10 });
}

async function getEditorText(page: import('@playwright/test').Page) {
  return (await page.locator('.cm-content').textContent()) ?? '';
}

test.describe('Quick Fixes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await dismissWelcome(page);
  });

  test('shows a Fix it for me button when there are fixable problems', async ({ page }) => {
    await typeCode(page, 'fd');
    await page.waitForTimeout(600);

    const fixAll = page.locator('.fix-all-btn');
    await expect(fixAll).toBeVisible();
  });

  test('fixes a missing argument with the Fix it for me button', async ({ page }) => {
    await typeCode(page, 'FD');
    await page.waitForTimeout(600);

    await page.locator('.fix-all-btn').click();
    await page.waitForTimeout(300);

    const text = await getEditorText(page);
    expect(text).toContain('FD 50');
  });

  test('fixes lowercase keywords and missing brackets together', async ({ page }) => {
    await typeCode(page, 'repeat 4 fd 100 rt 90');
    await page.waitForTimeout(600);

    await page.locator('.fix-all-btn').click();
    await page.waitForTimeout(300);

    const text = await getEditorText(page);
    expect(text).toContain('REPEAT 4 [ FD 100 RT 90 ]');
  });

  test('fixes an unclosed procedure with END', async ({ page }) => {
    await typeCode(page, 'TO SQUARE\n  FD 100');
    await page.waitForTimeout(600);

    await page.locator('.fix-all-btn').click();
    await page.waitForTimeout(300);

    const text = await getEditorText(page);
    expect(text).toContain('END');
  });

  test('offers a per-problem Fix it button', async ({ page }) => {
    await typeCode(page, 'FD');
    await page.waitForTimeout(600);

    const fixBtn = page.locator('.problem-fix-btn').first();
    await expect(fixBtn).toBeVisible();
    await fixBtn.click();
    await page.waitForTimeout(300);

    const text = await getEditorText(page);
    expect(text).toContain('FD 50');
  });

  test('suggests the closest command for a misspelled command', async ({ page }) => {
    await typeCode(page, 'FWD 100');
    await page.waitForTimeout(600);

    const fixBtn = page.locator('.problem-fix-btn').first();
    await expect(fixBtn).toBeVisible();
    await expect(fixBtn).toContainText('FD');

    await fixBtn.click();
    await page.waitForTimeout(300);

    const text = await getEditorText(page);
    expect(text).toContain('FD 100');
  });

  test('hides the Fix it for me button when code is valid', async ({ page }) => {
    await typeCode(page, 'REPEAT 4 [ FD 100 RT 90 ]');
    await page.waitForTimeout(600);

    await expect(page.locator('.fix-all-btn')).toHaveCount(0);
  });
});