import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Desktop 1440x900',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 }
      },
    },
    {
      name: 'Laptop 1280x800',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 800 }
      },
    },
    {
      name: 'Desktop 1024x768',
      use: {
        browserName: 'chromium',
        viewport: { width: 1024, height: 768 }
      },
    },
    {
      name: 'Tablet 834x1194',
      use: {
        browserName: 'chromium',
        viewport: { width: 834, height: 1194 }
      },
    },
    {
      name: 'Tablet 768x1024',
      use: {
        browserName: 'chromium',
        viewport: { width: 768, height: 1024 }
      },
    },
    {
      name: 'Mobile 430x932',
      use: {
        browserName: 'chromium',
        viewport: { width: 430, height: 932 },
        isMobile: true
      },
    },
    {
      name: 'Mobile 390x844',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        isMobile: true
      },
    },
    {
      name: 'Mobile 375x667',
      use: {
        browserName: 'chromium',
        viewport: { width: 375, height: 667 },
        isMobile: true
      },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
