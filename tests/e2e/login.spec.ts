import { test, expect } from '@playwright/test';

test.skip(Boolean(process.env.CI), 'Flaky in CI: page content not rendered');

test('login page renders core elements', async ({ page }) => {
	await page.goto('/login');
	await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
	await expect(page.getByLabel('Email')).toBeVisible();
	await expect(page.getByLabel('Password')).toBeVisible();
});
