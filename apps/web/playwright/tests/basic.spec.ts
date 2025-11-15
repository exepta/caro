import { test, expect } from '@playwright/test';

test('Homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Web/i);
});
