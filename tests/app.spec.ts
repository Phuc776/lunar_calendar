import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-19T08:00:00Z') });
  await page.goto('/');
});

test('shows today, navigates months and returns to today', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Lịch âm', exact: true })).toBeVisible();
  await expect(page.locator('.lunar-number')).toHaveText('10');
  await expect(page.locator('.lunar-month')).toContainText('Tháng 9');
  await expect(page.getByRole('gridcell', { selected: true })).toHaveAttribute('aria-current', 'date');
  await page.getByRole('button', { name: 'Tháng sau', exact: true }).click();
  await expect(page.getByRole('grid')).toHaveAttribute('aria-label', 'Tháng 11 năm 2026');
  await page.getByRole('button', { name: 'Về hôm nay', exact: true }).click();
  await expect(page.getByRole('grid')).toHaveAttribute('aria-label', 'Tháng 10 năm 2026');
  await expect(page.getByRole('gridcell', { selected: true })).toHaveAccessibleName(/19\/10\/2026/);
});

test('converts Tet and opens the result in the calendar', async ({ page }) => {
  await page.getByRole('button', { name: 'Tra cứu ngày', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Ngày', { exact: true }).fill('17');
  await dialog.getByLabel('Tháng', { exact: true }).selectOption('2-0');
  await dialog.getByLabel('Năm', { exact: true }).fill('2026');
  await dialog.getByRole('button', { name: 'Chuyển đổi', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('1/1/2026');
  await expect(dialog.getByRole('status')).toContainText('Bính Ngọ');
  await dialog.getByRole('button', { name: 'Xem trên lịch' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('region', { name: 'Chi tiết ngày đang chọn' })).toContainText('Mùng 1 Tết Nguyên đán');
});

test('offers only the actual leap month and converts it', async ({ page }) => {
  await page.getByRole('button', { name: 'Tra cứu ngày', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Âm → Dương' }).click();
  await expect(dialog.getByLabel('Tháng', { exact: true }).locator('option')).toHaveCount(12);
  await dialog.getByLabel('Năm', { exact: true }).fill('2023');
  await expect(dialog.getByLabel('Tháng', { exact: true }).locator('option')).toHaveCount(13);
  await dialog.getByLabel('Tháng', { exact: true }).selectOption('2-1');
  await dialog.getByLabel('Ngày', { exact: true }).fill('1');
  await dialog.getByRole('button', { name: 'Chuyển đổi', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('22/03/2023');
  await dialog.getByLabel('Ngày', { exact: true }).fill('30');
  await dialog.getByRole('button', { name: 'Chuyển đổi', exact: true }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(dialog.getByRole('status')).not.toBeVisible();
});

test('invalid solar dates and empty inputs get useful errors', async ({ page }) => {
  await page.getByRole('button', { name: 'Tra cứu ngày', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Ngày', { exact: true }).fill('31');
  await dialog.getByLabel('Tháng', { exact: true }).selectOption('4-0');
  await dialog.getByRole('button', { name: 'Chuyển đổi', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('không tồn tại');
  await dialog.getByLabel('Năm', { exact: true }).fill('');
  await dialog.getByRole('button', { name: 'Chuyển đổi', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('nhập đầy đủ');
});

test('limits calendar navigation at both ends of the supported range', async ({ page }) => {
  for (const [year, month, disabled] of [['1900', 'Tháng 1', 'Tháng trước'], ['2100', 'Tháng 12', 'Tháng sau']]) {
    await page.getByRole('button', { name: /Chọn tháng và năm/ }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Năm', { exact: true }).fill(year);
    await dialog.getByRole('button', { name: month, exact: true }).click();
    await dialog.getByRole('button', { name: 'Xem tháng này' }).click();
    await expect(page.getByRole('button', { name: disabled, exact: true })).toBeDisabled();
  }
});

test('supports keyboard calendar navigation and lookup shortcut', async ({ page }) => {
  await page.getByRole('gridcell', { selected: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('gridcell', { selected: true })).toHaveAccessibleName(/20\/10\/2026/);
  await expect(page.getByRole('gridcell', { selected: true })).toBeFocused();
  await page.keyboard.press('PageDown');
  await expect(page.getByRole('gridcell', { selected: true })).toHaveAccessibleName(/20\/11\/2026/);
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('persists theme across reloads', async ({ page }) => {
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Tối', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
  await dialog.getByRole('button', { name: 'Sáng', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('refreshes today after midnight in Vietnam', async ({ page }) => {
  await page.clock.pauseAt(new Date('2026-10-19T16:59:59Z'));
  await page.clock.runFor(16_000);
  await expect(page.locator('.solar-today')).toContainText('20/10/2026');
  await expect(page.locator('.lunar-number')).toHaveText('11');
  await page.getByRole('button', { name: 'Về hôm nay', exact: true }).click();
  await expect(page.getByRole('gridcell', { selected: true })).toHaveAccessibleName(/20\/10\/2026/);
});

test('fits the default viewport and narrow layout without horizontal overflow', async ({ page }) => {
  const actions = page.locator('.main-actions');
  const bounds = await actions.boundingBox();
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(705);
  await page.screenshot({ path: 'test-results/main-light.png', fullPage: true });
  await page.setViewportSize({ width: 460, height: 640 });
  const compactBounds = await actions.boundingBox();
  expect(compactBounds!.y + compactBounds!.height).toBeLessThanOrEqual(640);
  for (const width of [360, 460, 680]) {
    await page.setViewportSize({ width, height: 640 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Tra cứu ngày', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Chuyển đổi', exact: true })).toBeVisible();
    expect(await page.getByRole('dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.keyboard.press('Escape');
  }
});

test('renders all functions offline after initial load', async ({ page, context }) => {
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Tháng sau', exact: true }).click();
  await page.getByRole('button', { name: 'Tra cứu ngày', exact: true }).click();
  await page.getByRole('button', { name: 'Chuyển đổi', exact: true }).click();
  await expect(page.getByRole('status')).toBeVisible();
  await context.setOffline(false);
});
