import { test, expect } from '@playwright/test';
import { mockBackend, SAMPLE_APPS } from './fixtures/mock-backend.js';

test.describe('Functional QA smoke flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page);
    await page.goto('/');
  });

  test('loads the app shell and lists mocked upgrades', async ({ page }) => {
    await expect(page).toHaveTitle(/DatHex/);
    await expect(page.getByText('Google Chrome')).toBeVisible();
    await expect(page.getByText('7-Zip')).toBeVisible();
  });

  test('navigates between sidebar tabs', async ({ page }) => {
    await page.getByRole('button', { name: /Uygulama Mağazası/i }).click();
    await expect(page.getByPlaceholder(/Uygulama ara/i)).toBeVisible();

    await page.getByRole('button', { name: /Yedekle & Geri Yükle/i }).click();
    await expect(page.getByText(/Yedeği Dışa Aktar/i)).toBeVisible();

    await page.getByRole('button', { name: /^Güncellemeler$/i }).click();
    await expect(page.getByText('Google Chrome')).toBeVisible();
  });

  test('selecting/deselecting an app updates the selected counter', async ({ page }) => {
    const selectedCount = page.locator('.stat-card').nth(1).locator('p');
    await expect(selectedCount).toHaveText(String(SAMPLE_APPS.length));

    await page.getByLabel('Google Chrome seç').uncheck();
    await expect(selectedCount).toHaveText(String(SAMPLE_APPS.length - 1));
  });

  test('toggles between dark and light theme', async ({ page }) => {
    const html = page.locator('html');
    const initialTheme = await html.getAttribute('data-theme');

    await page.getByRole('button', { name: /^(Açık|Karanlık) Mod$/i }).click();

    await expect(html).not.toHaveAttribute('data-theme', initialTheme ?? '');
  });
});
