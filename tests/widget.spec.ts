import { expect, test } from '@playwright/test';

test('widget stays compact and its transparent page has no opaque body', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-19T08:00:00Z') });
  await page.setViewportSize({ width: 360, height: 480 });
  await page.goto('/?widget=1');
  await expect(page.getByRole('main', { name: 'Widget Lịch âm' })).toBeVisible();
  await expect(page.locator('.widget-lunar-number')).toContainText('10');
  await expect(page.getByRole('button', { name: 'Mở lịch đầy đủ' })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  expect(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  await page.screenshot({ path: 'test-results/widget-light.png', omitBackground: true, animations: 'disabled' });
});

test('settings synchronize transparency and lock to another window and survive reload', async ({ page, context }) => {
  await page.goto('/?settings=1');
  const widget = await context.newPage();
  await widget.setViewportSize({ width: 360, height: 480 });
  await widget.goto('/?widget=1');
  const slider = page.getByRole('slider', { name: 'Độ trong suốt của nền' });
  await slider.focus();
  await page.keyboard.press('End');
  await expect(page.locator('output')).toHaveText('100%');
  await expect(widget.locator('.desktop-widget')).toHaveCSS('background-color', 'rgba(247, 245, 240, 0)');
  await expect(widget.locator('.widget-today-info')).toHaveCSS('opacity', '1');
  await page.getByLabel('Khóa vị trí widget', { exact: true }).check();
  await expect(widget.getByLabel('Đã khóa vị trí')).toBeVisible();
  await widget.reload();
  await expect(widget.getByLabel('Đã khóa vị trí')).toBeVisible();
  await slider.focus(); await page.keyboard.press('Home');
  await expect(widget.locator('.desktop-widget')).toHaveCSS('background-color', 'rgb(247, 245, 240)');
  await expect(page.getByRole('checkbox', { name: 'Khởi động cùng Windows', exact: true })).toBeDisabled();
});

test('widget tracks the new day when following today', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-19T16:59:59Z') });
  await page.goto('/?widget=1');
  await page.clock.runFor(16_000);
  await expect(page.locator('.widget-lunar-number')).toContainText('11');
  await expect(page.getByRole('gridcell', { selected: true })).toHaveAccessibleName(/20\/10\/2026/);
});
