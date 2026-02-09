import { test, expect } from '@playwright/test';

test('about page renders headline', async ({ page }) => {
	await page.goto('/about');
	await expect(page.getByRole('heading', { name: 'About BullCheck' })).toBeVisible();
});
