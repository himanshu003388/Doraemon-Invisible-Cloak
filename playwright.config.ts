import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
    launchOptions: {
      args: ['--use-fake-device-for-media-stream'],
    },
  },
  webServer: {
    command: 'npm run dev',
    port: 8080,
    timeout: 15000,
    reuseExistingServer: !process.env.CI,
  },
});
