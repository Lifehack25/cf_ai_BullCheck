import { describe, expect, it, vi } from 'vitest';
import { env } from 'cloudflare:test';
import { load } from '../../src/routes/chat/[id]/+page.server';
import { insertChat, TEST_USER } from './setup';

describe('chat page load', () => {
	it('redirects to login when session is missing', async () => {
		await expect(
			load({
				params: { id: 'chat-1' },
				locals: {
					auth: { api: { getSession: vi.fn().mockResolvedValue(null) } },
					session: null
				} as unknown as App.Locals,
				platform: { env: {} } as unknown as App.Platform
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} as unknown as import('@sveltejs/kit').ServerLoadEvent<any, any, any>)
		).rejects.toMatchObject({ status: 302, location: '/login' });
	});

	it('throws 404 when chat is not found', async () => {
		await expect(
			load({
				params: { id: 'missing' },
				locals: {
					auth: { api: { getSession: vi.fn().mockResolvedValue({}) } },
					session: { id: 'sess-1' },
					user: { id: TEST_USER.id }
				} as unknown as App.Locals,
				platform: {
					env: { DB: env.DB, BULLCHECK_AGENT: { idFromName: vi.fn(), get: vi.fn() } }
				} as unknown as App.Platform
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} as unknown as import('@sveltejs/kit').ServerLoadEvent<any, any, any>)
		).rejects.toMatchObject({ status: 404 });
	});

	it('throws 403 when chat belongs to another user', async () => {
		await insertChat({ id: 'chat-2', userId: 'other-user' });

		await expect(
			load({
				params: { id: 'chat-2' },
				locals: {
					auth: { api: { getSession: vi.fn().mockResolvedValue({}) } },
					session: { id: 'sess-1' },
					user: { id: TEST_USER.id }
				} as unknown as App.Locals,
				platform: {
					env: { DB: env.DB, BULLCHECK_AGENT: { idFromName: vi.fn(), get: vi.fn() } }
				} as unknown as App.Platform
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} as unknown as import('@sveltejs/kit').ServerLoadEvent<any, any, any>)
		).rejects.toMatchObject({ status: 403 });
	});

	it('returns chat and messages when authorized', async () => {
		await insertChat({ id: 'chat-3', userId: TEST_USER.id });

		const namespace = {
			idFromName: vi.fn().mockReturnValue('do-id'),
			get: vi.fn().mockReturnValue({
				fetch: vi.fn().mockResolvedValue(
					new Response(JSON.stringify([{ role: 'assistant', content: 'Hi' }]), {
						status: 200,
						headers: { 'Content-Type': 'application/json' }
					})
				)
			})
		};

		const result = await load({
			params: { id: 'chat-3' },
			locals: {
				auth: { api: { getSession: vi.fn().mockResolvedValue({}) } },
				session: { id: 'sess-1' },
				user: { id: TEST_USER.id }
			} as unknown as App.Locals,
			platform: { env: { DB: env.DB, BULLCHECK_AGENT: namespace } } as unknown as App.Platform
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as unknown as import('@sveltejs/kit').ServerLoadEvent<any, any, any>);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const anyResult = result as any;

		expect(anyResult.chat.id).toBe('chat-3');
		expect(anyResult.messages).toHaveLength(1);
	});
});
