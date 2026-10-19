import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1',
    url: 'http://127.0.0.1:1420',
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://127.0.0.1:1420',
    channel: 'msedge',
    viewport: { width: 460, height: 705 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
});
