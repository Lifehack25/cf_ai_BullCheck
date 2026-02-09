import { defineConfig } from '@playwright/test';

const isCI = Boolean(process.env.CI);
const webHost = isCI ? '127.0.0.1' : 'localhost';

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: true,
	timeout: 30_000,
	use: {
		baseURL: `http://${webHost}:5173`
	},
	projects: [
		{
			name: 'chromium',
			use: { browserName: 'chromium' }
		}
	],
	webServer: {
		command: `pnpm dev -- --host ${webHost} --port 5173 --strictPort`,
		url: `http://${webHost}:5173`,
		timeout: 120_000,
		reuseExistingServer: !process.env.CI,
		stdout: 'pipe',
		stderr: 'pipe',
		env: {
			BETTER_AUTH_SECRET: 'test-secret-please-change-32-characters-min',
			BETTER_AUTH_URL: 'http://localhost:5173',
			WRANGLER_LOG: 'error'
		}
	}
});
