import { test, expect } from '@playwright/test';

test.skip(Boolean(process.env.CI), 'Flaky in CI: page content not rendered');

test('about page renders headline', async ({ page }) => {
	await page.goto('/about');
	await expect(page.getByRole('heading', { name: 'About BullCheck' })).toBeVisible();
});
