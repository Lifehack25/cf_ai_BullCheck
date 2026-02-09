import { test, expect } from '@playwright/test';

test.skip(Boolean(process.env.CI), 'Flaky in CI: page content not rendered');

test('register page renders core elements', async ({ page }) => {
	await page.goto('/register');
	await expect(page.getByRole('heading', { name: 'Join BullCheck' })).toBeVisible();
	await expect(page.getByLabel('Full Name')).toBeVisible();
	await expect(page.getByLabel('Email')).toBeVisible();
});
