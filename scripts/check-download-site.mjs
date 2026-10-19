import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'msedge' });
try {
  await mkdir('docs/previews', { recursive: true });
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('http://127.0.0.1:4174');
    await page.waitForFunction(() => document.querySelector('[data-download="installer"]').href.endsWith('Lich-am-1.1.0-setup.exe'));
    assert.equal(await page.title(), 'Lịch âm — Một góc lịch nhỏ trên desktop');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal(await page.locator('[data-download="portable"]').getAttribute('href'), 'https://github.com/Phuc776/lunar_calendar/releases/download/v1.1.0/Lich-am.exe');
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `docs/previews/download-site-${width}.png`, fullPage: true });
    await page.close();
  }
  console.log('Download site: desktop/mobile layout, CSP and download links passed.');
} finally { await browser.close(); }
