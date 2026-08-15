import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
  projects: [
    // Functional QA / accessibility / SEO run across every target browser
    // and viewport so real cross-browser + responsive coverage comes for
    // free from the same spec files.
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /visual\.spec\.js/,
    },
    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: /visual\.spec\.js/,
    },
    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'] },
      testIgnore: /visual\.spec\.js/,
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      testIgnore: /visual\.spec\.js/,
    },
    {
      name: 'tablet-safari',
      use: { ...devices['iPad Mini'] },
      testIgnore: /visual\.spec\.js/,
    },
    // Visual regression baselines are captured on a single fixed browser +
    // viewport only — running it across every project would multiply the
    // baseline PNGs and make diffs noisy without adding real coverage.
    {
      name: 'visual-regression',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /visual\.spec\.js/,
    },
  ],
});
