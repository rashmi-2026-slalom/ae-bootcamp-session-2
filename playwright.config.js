const { defineConfig, devices } = require('@playwright/test');

const FRONTEND_PORT = process.env.FRONTEND_PORT || '3000';
const BACKEND_PORT = process.env.BACKEND_PORT || '3030';
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${FRONTEND_PORT}`;

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run start --workspace=backend',
      url: `http://127.0.0.1:${BACKEND_PORT}`,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      env: {
        PORT: BACKEND_PORT,
      },
    },
    {
      command: 'npm run start --workspace=frontend',
      url: `http://127.0.0.1:${FRONTEND_PORT}`,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      env: {
        PORT: FRONTEND_PORT,
        BROWSER: 'none',
      },
    },
  ],
});
