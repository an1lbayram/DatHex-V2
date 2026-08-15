import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockBackend } from './fixtures/mock-backend.js';

const TABS = [
  { name: /^Güncellemeler$/i, label: 'upgrades' },
  { name: /Uygulama Mağazası/i, label: 'store' },
  { name: /Yüklü Uygulamalar/i, label: 'installed' },
  { name: /Yedekle & Geri Yükle/i, label: 'backup' },
];

test.describe('Accessibility (axe)', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page);
    await page.goto('/');
  });

  for (const tab of TABS) {
    test(`${tab.label} tab has no serious/critical axe violations`, async ({ page }) => {
      await page.getByRole('button', { name: tab.name }).click();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const seriousOrWorse = results.violations.filter((v) =>
        ['serious', 'critical'].includes(v.impact)
      );

      expect(
        seriousOrWorse,
        JSON.stringify(seriousOrWorse.map((v) => ({ id: v.id, help: v.help, nodes: v.nodes.length })), null, 2)
      ).toEqual([]);
    });
  }
});
