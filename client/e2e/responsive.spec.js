import { test, expect } from '@playwright/test';
import { mockBackend } from './fixtures/mock-backend.js';

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
};

test.describe('Responsive layout', () => {
  for (const [name, size] of Object.entries(VIEWPORTS)) {
    test(`no horizontal overflow at ${name} (${size.width}x${size.height})`, async ({ page }) => {
      await page.setViewportSize(size);
      await mockBackend(page);
      await page.goto('/');

      await expect(page.getByText('Google Chrome')).toBeVisible();

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));

      // Allow a 1px rounding tolerance from subpixel layout.
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });
  }

  test('sidebar navigation stays usable at mobile width', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await mockBackend(page);
    await page.goto('/');

    const storeTab = page.getByRole('button', { name: /Uygulama Mağazası/i });
    await expect(storeTab).toBeVisible();
    await storeTab.click();
    await expect(page.getByPlaceholder(/Uygulama ara/i)).toBeVisible();
  });
});
