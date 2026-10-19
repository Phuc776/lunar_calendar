// Windows integration test for the built app. No browser server is needed.
// Starts only this executable with a temporary localhost WebView2 debug port.
import { chromium } from '@playwright/test';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
const exec = promisify(execFile);
const exe = resolve(process.env.LICH_AM_NATIVE_EXE || 'src-tauri/target/release/lich-am.exe');
const preferences = join(process.env.APPDATA, 'vn.licham.desktop', 'preferences.json');
const backup = await readFile(preferences).catch(() => null);
const port = 9224;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let child;
let browser;
let main;
let original;
const rpc = (page, command, args = {}) => page.evaluate(({ command, args }) => window.__TAURI_INTERNALS__.invoke(command, args), { command, args });
async function launch() {
  child = spawn(exe, ['--autostart'], { windowsHide: true, stdio: 'ignore', env: { ...process.env, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${port}` } });
  for (let i = 0; i < 100; i++) {
    try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); break; }
    catch { await delay(150); }
  }
  assert(browser, 'Native WebView2 debug endpoint did not start');
  for (let i = 0; i < 100; i++) {
    const pages = browser.contexts().flatMap(context => context.pages());
    const found = {};
    for (const page of pages) {
      const kind = await page.evaluate(() => document.documentElement.dataset.window).catch(() => '');
      if (kind) found[kind] = page;
    }
    if (found.main && found.widget) { main = found.main; return found; }
    await delay(100);
  }
  throw new Error('Expected main and widget webviews');
}
async function quit() {
  await rpc(main, 'quit_app').catch(() => {});
  for (let i = 0; i < 60 && child.exitCode === null; i++) await delay(100);
  assert.notEqual(child.exitCode, null, 'Native application did not exit');
  await browser?.close().catch(() => {});
  browser = undefined;
}
try {
  let pages = await launch();
  original = await rpc(main, 'get_desktop_settings');
  assert.equal(await rpc(main, 'plugin:window|is_visible', { label: 'main' }), false, 'Startup must keep main hidden');
  assert.equal(await rpc(main, 'plugin:window|is_visible', { label: 'widget' }), true);
  await rpc(main, 'update_desktop_settings', { patch: { transparency: 100, locked: true, alwaysOnTop: true } });
  await pages.widget.waitForFunction(() => getComputedStyle(document.querySelector('.desktop-widget')).backgroundColor.endsWith(', 0)'));
  assert.equal(await pages.widget.locator('.widget-today-info').evaluate(el => getComputedStyle(el).opacity), '1');
  await pages.widget.getByLabel('Đã khóa vị trí').waitFor();
  assert.equal((await rpc(main, 'get_desktop_settings')).alwaysOnTop, true);
  await rpc(main, 'update_desktop_settings', { patch: { widgetEnabled: false } });
  assert.equal(await rpc(main, 'plugin:window|is_visible', { label: 'widget' }), false);
  await rpc(main, 'update_desktop_settings', { patch: { widgetEnabled: true, startup: true } });
  const registration = await exec('reg.exe', ['query', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', '/v', 'Lịch âm'], { windowsHide: true });
  assert(registration.stdout.toLowerCase().includes(`"${exe}" --autostart`.toLowerCase()), 'Startup executable must be quoted');
  assert.equal((await rpc(main, 'get_desktop_settings')).startup, true);
  await rpc(main, 'update_desktop_settings', { patch: { startup: false } });
  let registrationRemoved = false;
  try { await exec('reg.exe', ['query', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', '/v', 'Lịch âm'], { windowsHide: true }); }
  catch { registrationRemoved = true; }
  assert(registrationRemoved, 'Disabling startup must remove the registry value');
  await rpc(main, 'reset_widget_position');
  const before = await rpc(main, 'plugin:window|outer_position', { label: 'widget' });
  await exec(exe, ['--widget'], { windowsHide: true, timeout: 10_000 });
  assert.equal(child.exitCode, null, 'The original process must remain running');
  await rpc(main, 'update_desktop_settings', { patch: { transparency: 37, locked: true, alwaysOnTop: false } });
  await quit();
  pages = await launch();
  const restored = await rpc(main, 'get_desktop_settings');
  assert.equal(restored.transparency, 37);
  assert.equal(restored.locked, true);
  assert.deepEqual(await rpc(main, 'plugin:window|outer_position', { label: 'widget' }), before);
  assert.equal(await rpc(main, 'plugin:window|is_visible', { label: 'main' }), false);
  await rpc(main, 'update_desktop_settings', { patch: { ...original, startup: process.env.LICH_AM_TEST_LEAVE_STARTUP === '1' ? true : original.startup } });
  await quit();
  console.log('Native integration passed: widget-only startup, transparency/text, lock, show/hide, startup registration/disable, quoted path, single instance, persistence and position restore.');
} finally {
  if (browser && main) {
    if (original) await rpc(main, 'update_desktop_settings', { patch: original }).catch(() => {});
    await quit().catch(() => {});
  }
  // The test owns this child only; never stop another user's app process.
  if (child && child.exitCode === null) child.kill();
  if (backup) await writeFile(preferences, backup);
}
