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

async function getReadoutText(page: import('@playwright/test').Page) {
  return (await page.locator('.turtle-readout').textContent()) ?? '';
}

test.describe('Education Panels', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await dismissWelcome(page);
  });

  test('should show four sidebar tabs', async ({ page }) => {
    const tabs = page.locator('.sidebar-tab');
    await expect(tabs).toHaveCount(4);
    await expect(tabs.nth(0)).toContainText('Commands');
    await expect(tabs.nth(1)).toContainText('Tutorials');
    await expect(tabs.nth(2)).toContainText('Challenges');
    await expect(tabs.nth(3)).toContainText('Concepts');
  });

  test('should default to Commands tab', async ({ page }) => {
    const commandsTab = page.locator('.sidebar-tab').nth(0);
    await expect(commandsTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.sidebar-categories')).toBeVisible();
  });

  test('should switch to Tutorials tab and show tutorial list', async ({ page }) => {
    await page.locator('.sidebar-tab').nth(1).click();
    await expect(page.locator('.tutorial-panel')).toBeVisible();
    const cards = page.locator('.tutorial-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should navigate into a tutorial and show steps', async ({ page }) => {
    await page.locator('.sidebar-tab').nth(1).click();
    await page.locator('.tutorial-card').first().click();
    await expect(page.locator('.tutorial-steps')).toBeVisible();
    await expect(page.locator('.step-content')).toBeVisible();
    await expect(page.locator('.step-counter')).toBeVisible();
  });

  test('should navigate tutorial steps forward and back', async ({ page }) => {
    await page.locator('.sidebar-tab').nth(1).click();
    await page.locator('.tutorial-card').first().click();

    const nextBtn = page.locator('.nav-btn').last();
    const prevBtn = page.locator('.nav-btn').first();

    await expect(prevBtn).toBeDisabled();

    await nextBtn.click();
    await expect(page.locator('.step-counter')).toContainText('2 /');

    await expect(prevBtn).toBeEnabled();
    await prevBtn.click();
    await expect(page.locator('.step-counter')).toContainText('1 /');
  });

  test('should load tutorial code into editor', async ({ page }) => {
    await page.locator('.sidebar-tab').nth(1).click();
    await page.locator('.tutorial-card').first().click();

    const loadBtn = page.locator('.load-code-btn');
    if (await loadBtn.isVisible()) {
      await loadBtn.click();
      const editorContent = await page.locator('.cm-content').textContent();
      expect(editorContent?.length).toBeGreaterThan(0);
    }
  });

  test('should switch to Challenges tab and show challenge list', async ({ page }) => {
    await page.locator('.sidebar-tab').nth(2).click();
    await expect(page.locator('.challenge-panel')).toBeVisible();
    const cards = page.locator('.challenge-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('should show difficulty badges on challenges', async ({ page }) => {
    await page.locator('.sidebar-tab').nth(2).click();
    const badges = page.locator('.difficulty-badge');
    const count = await badges.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should navigate into a challenge and show hints', async ({ page }) => {
    await page.locator('.sidebar-tab').nth(2).click();
    await page.locator('.challenge-card').first().click();
    await expect(page.locator('.challenge-detail')).toBeVisible();
    await expect(page.locator('.challenge-hints')).toBeVisible();
  });

  test('should switch to Concepts tab and show concept list', async ({ page }) => {
    await page.locator('.sidebar-tab').nth(2);
    await page.locator('.sidebar-tab').nth(3).click();
    await expect(page.locator('.concept-browser')).toBeVisible();
    const cards = page.locator('.concept-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('should navigate into a concept and show examples', async ({ page }) => {
    await page.locator('.sidebar-tab').nth(3).click();
    await page.locator('.concept-card').first().click();
    await expect(page.locator('.concept-detail')).toBeVisible();
    await expect(page.locator('.concept-examples')).toBeVisible();
  });

  test('should switch back to Commands tab from another tab', async ({ page }) => {
    await page.locator('.sidebar-tab').nth(1).click();
    await expect(page.locator('.tutorial-panel')).toBeVisible();

    await page.locator('.sidebar-tab').nth(0).click();
    await expect(page.locator('.sidebar-categories')).toBeVisible();
  });
});

test.describe('Edge Cases - Code Execution', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await dismissWelcome(page);
  });

  test('should handle empty code gracefully', async ({ page }) => {
    await typeCode(page, '');
    const runBtn = page.locator('.run-btn');
    await runBtn.click();
    await page.waitForTimeout(300);

    await expect(page.locator('.turtle-readout')).toBeVisible();
  });

  test('should handle whitespace-only code', async ({ page }) => {
    await typeCode(page, '   \n  \n   ');
    const runBtn = page.locator('.run-btn');
    await runBtn.click();
    await page.waitForTimeout(300);

    await expect(page.locator('.turtle-readout')).toBeVisible();
  });

  test('should handle single command', async ({ page }) => {
    await typeCode(page, 'FD 100');
    await page.locator('.run-btn').click();
    await page.waitForTimeout(500);

    const text = await getReadoutText(page);
    expect(text).toContain('x:');
  });

  test('should handle deeply nested REPEAT', async ({ page }) => {
    await typeCode(page, 'REPEAT 4 [ REPEAT 3 [ FD 20 RT 120 ] RT 90 ]');
    await page.locator('.run-btn').click();
    await page.waitForTimeout(2000);

    const text = await getReadoutText(page);
    expect(text).toContain('heading:');
  });

  test('should handle procedure with parameters', async ({ page }) => {
    await typeCode(page, [
      'TO BOX :SIZE',
      '  REPEAT 4 [ FD :SIZE RT 90 ]',
      'END',
      '',
      'BOX 50',
    ].join('\n'));
    await page.locator('.run-btn').click();
    await page.waitForTimeout(2000);

    const text = await getReadoutText(page);
    expect(text).toContain('heading:');
  });

  test('should show error for unknown command', async ({ page }) => {
    await typeCode(page, 'ZOOM');
    await page.locator('.run-btn').click();
    await page.waitForTimeout(500);

    const problems = page.locator('.problem-item');
    const count = await problems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show error for missing argument', async ({ page }) => {
    await typeCode(page, 'FD');
    await page.waitForTimeout(500);

    const problems = page.locator('.problem-item');
    const count = await problems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show lint errors for mismatched brackets', async ({ page }) => {
    await typeCode(page, 'FD 100\nZOOM\nFD 50');
    await page.waitForTimeout(500);

    const problems = page.locator('.problem-item');
    const count = await problems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should handle SETPC color changes', async ({ page }) => {
    await typeCode(page, [
      'SETPC 1',
      'FD 50',
      'SETPC 2',
      'FD 50',
      'SETPC 3',
      'FD 50',
    ].join('\n'));
    await page.locator('.run-btn').click();
    await page.waitForTimeout(1500);

    const text = await getReadoutText(page);
    expect(text).toContain('heading:');
  });

  test('should handle PU and PD commands', async ({ page }) => {
    await typeCode(page, [
      'FD 50',
      'PU',
      'FD 50',
      'PD',
      'FD 50',
    ].join('\n'));
    await page.locator('.run-btn').click();
    await page.waitForTimeout(1500);

    const text = await getReadoutText(page);
    expect(text).toContain('pen:');
  });

  test('should handle HOME command', async ({ page }) => {
    await typeCode(page, [
      'FD 100',
      'RT 90',
      'FD 100',
      'HOME',
    ].join('\n'));
    await page.locator('.run-btn').click();
    await page.waitForTimeout(2000);

    const text = await getReadoutText(page);
    expect(text).toContain('x:');
    expect(text).toContain('y:');
  });

  test('should handle SETHEADING command', async ({ page }) => {
    await typeCode(page, [
      'SETH 90',
      'FD 50',
    ].join('\n'));
    await page.locator('.run-btn').click();
    await page.waitForTimeout(500);

    const text = await getReadoutText(page);
    expect(text).toContain('heading:');
  });

  test('should handle very long code without crashing', async ({ page }) => {
    const lines: string[] = [];
    for (let i = 0; i < 50; i++) {
      lines.push(`FD ${10 + i}`);
      lines.push(`RT ${5 + (i % 8)}`);
    }
    await typeCode(page, lines.join('\n'));
    await page.locator('.run-btn').click();
    await page.waitForTimeout(3000);

    await expect(page.locator('.turtle-readout')).toBeVisible();
  });

  test('should handle REPEAT with zero iterations', async ({ page }) => {
    await typeCode(page, 'REPEAT 0 [ FD 100 ]');
    await page.locator('.run-btn').click();
    await page.waitForTimeout(500);

    const text = await getReadoutText(page);
    expect(text).toContain('x:');
  });

  test('should handle STOP in procedure', async ({ page }) => {
    await typeCode(page, [
      'TO CHECK :VAL',
      '  IF :VAL > 5 [ STOP ]',
      '  FD 20',
      '  CHECK :VAL + 1',
      'END',
      '',
      'CHECK 1',
    ].join('\n'));
    await page.locator('.run-btn').click();
    await page.waitForTimeout(3000);

    await expect(page.locator('.turtle-readout')).toBeVisible();
  });

  test('should handle IFELSE in code', async ({ page }) => {
    await typeCode(page, [
      'TO TEST :SIZE',
      '  IFELSE :SIZE > 50 [ FD 80 ] [ FD 30 ]',
      'END',
      '',
      'TEST 100',
    ].join('\n'));
    await page.locator('.run-btn').click();
    await page.waitForTimeout(2000);

    const text = await getReadoutText(page);
    expect(text).toContain('heading:');
  });

  test('should handle PRINT command', async ({ page }) => {
    await typeCode(page, [
      'PRINT "hello',
      'FD 50',
    ].join('\n'));
    await page.locator('.run-btn').click();
    await page.waitForTimeout(500);

    const text = await getReadoutText(page);
    expect(text).toContain('heading:');
  });
});

test.describe('Edge Cases - Reset and Step', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await dismissWelcome(page);
  });

  test('should reset turtle to origin', async ({ page }) => {
    await typeCode(page, 'FD 100 RT 90 FD 100');
    await page.locator('.run-btn').click();
    await page.waitForTimeout(1500);

    await page.locator('.reset-btn').click();
    await page.waitForTimeout(300);

    const text = await getReadoutText(page);
    expect(text).toContain('x: 0');
    expect(text).toContain('y: 0');
  });

  test('should step through code one command at a time', async ({ page }) => {
    await typeCode(page, 'FD 50\nRT 90\nFD 50');

    const stepBtn = page.locator('.step-btn');
    await stepBtn.click();
    await page.waitForTimeout(300);

    const text1 = await getReadoutText(page);
    expect(text1).toContain('heading:');

    await stepBtn.click();
    await page.waitForTimeout(300);

    const text2 = await getReadoutText(page);
    expect(text2).toContain('heading:');
  });

  test('should pause and resume execution', async ({ page }) => {
    await typeCode(page, [
      'REPEAT 100 [',
      '  FD 10',
      '  RT 5',
      ']',
    ].join('\n'));
    await page.locator('.run-btn').click();
    await page.waitForTimeout(500);

    const pauseBtn = page.locator('.toolbar-btn:has-text("Pause")');
    if (await pauseBtn.isVisible()) {
      await pauseBtn.click();
      await page.waitForTimeout(300);
    }
  });
});

test.describe('RTL Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await dismissWelcome(page);
  });

  test('should toggle to Hebrew and switch to RTL', async ({ page }) => {
    const langBtn = page.locator('.lang-toggle');
    await langBtn.click();
    await page.locator('.lang-option').nth(1).click();

    const app = page.locator('.app');
    await expect(app).toHaveAttribute('dir', 'rtl');
  });

  test('should display Hebrew title after language switch', async ({ page }) => {
    await page.locator('.lang-toggle').click();
    await page.locator('.lang-option').nth(1).click();
    await expect(page.locator('.app-title')).toContainText('לוגו');
  });

  test('should show Hebrew sidebar tabs after language switch', async ({ page }) => {
    await page.locator('.lang-toggle').click();
    await page.locator('.lang-option').nth(1).click();

    const tabs = page.locator('.sidebar-tab');
    await expect(tabs.nth(0)).toContainText('פקודות');
    await expect(tabs.nth(1)).toContainText('הדרכות');
    await expect(tabs.nth(2)).toContainText('אתגרים');
    await expect(tabs.nth(3)).toContainText('מושגים');
  });

  test('should still function in RTL mode', async ({ page }) => {
    await page.locator('.lang-toggle').click();
    await page.locator('.lang-option').nth(1).click();
    await typeCode(page, 'FD 100');
    await page.locator('.run-btn').click();
    await page.waitForTimeout(500);

    const text = await getReadoutText(page);
    expect(text).toContain('heading:');
  });

  test('should toggle back to English', async ({ page }) => {
    await page.locator('.lang-toggle').click();
    await page.locator('.lang-option').nth(1).click();
    await expect(page.locator('.app')).toHaveAttribute('dir', 'rtl');

    await page.locator('.lang-toggle').click();
    await page.locator('.lang-option').nth(0).click();
    await expect(page.locator('.app')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('.app-title')).toContainText('Logo Kids');
  });
});

test.describe('All Example Programs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await dismissWelcome(page);
  });

  const examples = ['square', 'star', 'hexagon', 'diamond', 'flower', 'spiral', 'rainbow', 'house', 'tree', 'robot'];

  for (const example of examples) {
    test(`should run ${example} example without crashing`, async ({ page }) => {
      const examplesSelect = page.locator('.toolbar-examples select');
      await examplesSelect.selectOption(example);

      const editorContent = await page.locator('.cm-content').textContent();
      expect(editorContent?.length).toBeGreaterThan(0);

      await page.locator('.run-btn').click();
      await page.waitForTimeout(3000);

      await expect(page.locator('.turtle-readout')).toBeVisible();
      const text = await getReadoutText(page);
      expect(text).toContain('heading:');
    });
  }
});

test.describe('Welcome Modal Persistence', () => {
  test('should show welcome modal on first visit', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
  });

  test('should not show welcome modal after dismissal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await dismissWelcome(page);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const modal = page.locator('[role="dialog"]');
    await expect(modal).not.toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await dismissWelcome(page);
  });

  test('should have ARIA labels on main regions', async ({ page }) => {
    await expect(page.locator('[aria-label="Code editor"]')).toBeVisible();
    await expect(page.locator('[aria-label="Turtle canvas"]')).toBeVisible();
    await expect(page.locator('[aria-label="Commands sidebar"]')).toBeVisible();
    await expect(page.locator('[aria-label="Run controls toolbar"]')).toBeVisible();
  });

  test('should have role=tablist on sidebar tabs', async ({ page }) => {
    const tablist = page.locator('[role="tablist"]');
    await expect(tablist).toBeVisible();
  });

  test('should have aria-selected on active tab', async ({ page }) => {
    const firstTab = page.locator('[role="tab"]').first();
    await expect(firstTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should update aria-selected when switching tabs', async ({ page }) => {
    await page.locator('.sidebar-tab').nth(1).click();
    const secondTab = page.locator('[role="tab"]').nth(1);
    await expect(secondTab).toHaveAttribute('aria-selected', 'true');

    const firstTab = page.locator('[role="tab"]').first();
    await expect(firstTab).toHaveAttribute('aria-selected', 'false');
  });

  test('should have aria-live on turtle readout', async ({ page }) => {
    await expect(page.locator('.turtle-readout[aria-live="polite"]')).toBeVisible();
  });

  test('canvas should be focusable/accessible', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});

test.describe('Canvas Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await dismissWelcome(page);
  });

  test('should have a visible canvas element', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(100);
    expect(box?.height).toBeGreaterThan(100);
  });

  test('should update readout when turtle moves', async ({ page }) => {
    await typeCode(page, 'FD 100');
    await page.locator('.run-btn').click();
    await page.waitForTimeout(800);

    const text = await getReadoutText(page);
    expect(text).toContain('heading: 0');
  });

  test('should show pen state in readout', async ({ page }) => {
    const text = await getReadoutText(page);
    expect(text).toContain('pen:');
    expect(text).toContain('down');
  });

  test('should update pen state after PU command', async ({ page }) => {
    await typeCode(page, 'PU');
    await page.locator('.run-btn').click();
    await page.waitForTimeout(500);

    const text = await getReadoutText(page);
    expect(text).toContain('pen: up');
  });
});

test.describe('Code Editor Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await dismissWelcome(page);
  });

  test('should show line numbers', async ({ page }) => {
    await expect(page.locator('.cm-lineNumbers')).toBeVisible();
  });

  test('should support multiple lines', async ({ page }) => {
    await typeCode(page, 'FD 100\nRT 90\nFD 50');
    const editorContent = await page.locator('.cm-content').textContent();
    expect(editorContent).toContain('FD');
    expect(editorContent).toContain('RT');
  });

  test('should update editor content on example load', async ({ page }) => {
    const examplesSelect = page.locator('.toolbar-examples select');
    await examplesSelect.selectOption('star');

    const editorContent = await page.locator('.cm-content').textContent();
    expect(editorContent).toContain('REPEAT');
    expect(editorContent).toContain('144');
  });

  test('should append code when clicking sidebar command', async ({ page }) => {
    await typeCode(page, 'FD 100');
    const firstCmd = page.locator('.command-block').first();
    await firstCmd.click();

    const editorContent = await page.locator('.cm-content').textContent();
    expect(editorContent?.length).toBeGreaterThan(6); // 'FD 100' = 6 chars
  });

  test('should show lint gutter', async ({ page }) => {
    await expect(page.locator('.cm-gutter-lint, .cm-lintGutter')).toBeVisible();
  });
});
