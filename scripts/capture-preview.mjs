import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const url = 'http://127.0.0.1:1420';
let server;
try { await fetch(url, { signal: AbortSignal.timeout(1500) }); }
catch {
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1'], { windowsHide: true, stdio: 'ignore' });
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { await fetch(url, { signal: AbortSignal.timeout(500) }); ready = true; break; }
    catch { await new Promise(resolve => setTimeout(resolve, 150)); }
  }
  if (!ready) { server.kill(); throw new Error('Vite preview server did not start.'); }
}
const browser = await chromium.launch({ channel: 'msedge' });
await mkdir('docs/previews', { recursive: true });
try {
  for (const scale of [1, 1.25, 1.5]) {
    const context = await browser.newContext({ viewport: { width: 460, height: 640 }, deviceScaleFactor: scale, colorScheme: 'light' });
    const page = await context.newPage();
    await page.goto(url);
    await page.screenshot({ path: `docs/previews/light-${scale}.png`, animations: 'disabled' });
    if (scale === 1) {
      await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
      await page.getByRole('button', { name: 'Tối', exact: true }).click();
      await page.locator('html[data-theme="dark"]').waitFor();
      await page.keyboard.press('Escape');
      await page.screenshot({ path: 'docs/previews/dark.png', animations: 'disabled' });
      await page.getByRole('button', { name: 'Tra cứu ngày', exact: true }).click();
      await page.screenshot({ path: 'docs/previews/lookup.png', animations: 'disabled' });
    }
    await context.close();
  }
} finally { await browser.close(); server?.kill(); }
