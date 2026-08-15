import { test, expect } from '@playwright/test';
import { mockBackend } from './fixtures/mock-backend.js';

test.describe('Basic SEO checks', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page);
    await page.goto('/');
  });

  test('has a non-empty, descriptive <title>', async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(10);
    expect(title).toMatch(/DatHex/i);
  });

  test('has a meta description', async ({ page }) => {
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    expect(description.length).toBeGreaterThan(20);
  });

  test('declares an html lang attribute', async ({ page }) => {
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
  });

  test('has a responsive viewport meta tag', async ({ page }) => {
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });

  test('renders exactly one <h1>', async ({ page }) => {
    await expect(page.locator('h1')).toHaveCount(1);
  });
});
