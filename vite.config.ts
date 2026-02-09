import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineWorkersProject } from '@cloudflare/vitest-pool-workers/config';

const isCI = Boolean(process.env.CI);
const devHost = isCI ? '127.0.0.1' : 'localhost';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		host: devHost,
		port: 5173,
		strictPort: true
	},
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
							main: './src/worker.ts',
							wrangler: { configPath: './wrangler.jsonc' },
							remoteBindings: false,
							miniflare: {
								assets: {
									directory: 'static',
									binding: 'ASSETS'
								}
							}
						}
					},
					include: ['tests/workers/**/*.spec.ts'],
					setupFiles: ['./tests/workers/setup.ts']
				}
			})
		]
	}
});
