import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  use: {
    baseURL: 'http://127.0.0.1:3101',
    channel: process.platform === 'win32' ? 'msedge' : undefined,
    headless: true,
    viewport: { width: 390, height: 844 },
    locale: 'pt-BR',
    timezoneId: 'America/Cuiaba',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/test-server.js',
    url: 'http://127.0.0.1:3101/api/health',
    reuseExistingServer: false,
    timeout: 20000,
  },
});
