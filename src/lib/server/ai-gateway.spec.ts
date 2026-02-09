import { afterEach, describe, expect, it, vi } from 'vitest';
import { runWorkersAiGateway } from './ai-gateway';

/**
 * Tests for Cloudflare AI Gateway Integration
 *
 * Verifies that the gateway client:
 * - Validates required environment variables
 * - Handles non-200 API responses correctly
 * - Passes user context (userId) in headers for logging
 */
describe('runWorkersAiGateway', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('throws when required env vars are missing', async () => {
		await expect(
			runWorkersAiGateway({
				env: {
					AI_GATEWAY_ACCOUNT_ID: '',
					AI_GATEWAY_ID: '',
					AI_GATEWAY_TOKEN: '',
					WORKERS_AI_TOKEN: ''
				},
				model: '@cf/meta/llama-3-8b-instruct',
				inputs: {}
			})
		).rejects.toThrow('AI Gateway account id or gateway id is missing.');
	});

	it('throws on non-200 responses', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 401,
				statusText: 'Unauthorized',
				text: async () => 'nope'
			})
		);

		await expect(
			runWorkersAiGateway({
				env: {
					AI_GATEWAY_ACCOUNT_ID: 'acct',
					AI_GATEWAY_ID: 'gw',
					AI_GATEWAY_TOKEN: 'token',
					WORKERS_AI_TOKEN: 'worker'
				},
				model: '@cf/meta/llama-3-8b-instruct',
				inputs: {}
			})
		).rejects.toThrow('AI Gateway request failed (401 Unauthorized)');
	});

	it('sends metadata header when userId is provided', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			statusText: 'OK',
			json: async () => ({ result: { response: 'ok' } })
		});
		vi.stubGlobal('fetch', fetchMock);

		await runWorkersAiGateway({
			env: {
				AI_GATEWAY_ACCOUNT_ID: 'acct',
				AI_GATEWAY_ID: 'gw',
				AI_GATEWAY_TOKEN: 'token',
				WORKERS_AI_TOKEN: 'worker'
			},
			model: '@cf/meta/llama-3-8b-instruct',
			inputs: { messages: [] },
			userId: 'user-123'
		});

		const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
		expect(headers['cf-aig-metadata']).toContain('user-123');
	});
});
