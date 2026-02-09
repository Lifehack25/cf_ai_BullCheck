import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineWorkersProject } from '@cloudflare/vitest-pool-workers/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				resolve: {
					conditions: ['browser']
				},
				test: {
					name: 'client',
					environment: 'jsdom',
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			},
			defineWorkersProject({
				extends: './vite.config.ts',
				test: {
					name: 'workers',
					pool: '@cloudflare/vitest-pool-workers',
					poolOptions: {
						workers: {
							wrangler: { configPath: './wrangler.jsonc' }
						}
					},
					include: ['tests/workers/**/*.spec.ts'],
					setupFiles: ['./tests/workers/setup.ts']
				}
			})
		]
	}
});
