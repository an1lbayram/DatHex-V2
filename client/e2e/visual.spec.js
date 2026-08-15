import { test, expect } from '@playwright/test';
import { mockBackend } from './fixtures/mock-backend.js';

// Runs only on the "visual-regression" project (see playwright.config.js) so
// baselines stay pinned to one browser/viewport instead of multiplying across
// every cross-browser/responsive project.
test.describe('Visual regression', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page);
  });

  test('upgrades tab (dark theme)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Google Chrome')).toBeVisible();
    await expect(page).toHaveScreenshot('upgrades-tab-dark.png', { fullPage: true });
  });

  test('store tab (dark theme)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Uygulama Mağazası/i }).click();
    await expect(page.getByPlaceholder(/Uygulama ara/i)).toBeVisible();
    await expect(page).toHaveScreenshot('store-tab-dark.png', { fullPage: true });
  });
});
