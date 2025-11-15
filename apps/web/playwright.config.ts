import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './playwright/tests',
  timeout: 30_000,
  workers: 1,

  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  reporter: [
    ['list'],

    [
      'junit',
      {
        outputFile: 'playwright/test-results/playwright-junit.xml',
      }
    ],

    [
      'html',
      {
        outputFolder: 'playwright/test-results/html-report',
        open: 'never',
      }
    ],
  ],

  projects: [
    {
      name: 'chromium',
      use: devices['Desktop Chrome'],
    }
  ],

  webServer: {
    command: 'pnpm ng serve',
    url: 'http://localhost:4200',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
