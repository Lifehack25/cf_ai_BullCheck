import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: true,
	timeout: 30_000,
	use: {
		baseURL: 'http://[::1]:5173'
	},
	projects: [
		{
			name: 'chromium',
			use: { browserName: 'chromium' }
		}
	],
	webServer: {
		command: 'pnpm dev -- --host localhost --port 5173 --strictPort',
		url: 'http://[::1]:5173/login',
		reuseExistingServer: !process.env.CI,
		env: {
			BETTER_AUTH_SECRET: 'test-secret-please-change-32-characters-min',
			BETTER_AUTH_URL: 'http://localhost:5173',
			WRANGLER_LOG: 'error'
		}
	}
});
