import { describe, expect, it, vi } from 'vitest';
import { handle } from '../../src/hooks.server';

const getSession = vi.hoisted(() => vi.fn());

vi.mock('$lib/auth', () => ({
	auth: () => ({
		api: { getSession }
	})
}));

describe('hooks handle', () => {
	it('sets locals when session exists', async () => {
		getSession.mockResolvedValueOnce({
			user: { id: 'user-1', email: 'test@example.com' },
			session: { id: 'sess-1' }
		});

		const event = {
			request: new Request('http://localhost'),
			locals: {} as unknown as App.Locals,
			platform: {
				env: {
					DB: {} as unknown as D1Database,
					BETTER_AUTH_URL: 'http://localhost',
					BETTER_AUTH_SECRET: 'secret'
				}
			}
		} as unknown as import('@sveltejs/kit').RequestEvent;

		const resolve = vi.fn().mockResolvedValue(new Response('ok'));
		await handle({ event, resolve });

		expect(event.locals.user).toEqual({ id: 'user-1', email: 'test@example.com' });
		expect(event.locals.session).toEqual({ id: 'sess-1' });
	});

	it('clears locals when session is missing', async () => {
		getSession.mockResolvedValueOnce(null);

		const event = {
			request: new Request('http://localhost'),
			locals: {} as unknown as App.Locals,
			platform: {
				env: {
					DB: {} as unknown as D1Database,
					BETTER_AUTH_URL: 'http://localhost',
					BETTER_AUTH_SECRET: 'secret'
				}
			}
		} as unknown as import('@sveltejs/kit').RequestEvent;

		const resolve = vi.fn().mockResolvedValue(new Response('ok'));
		await handle({ event, resolve });

		expect(event.locals.user).toBeNull();
		expect(event.locals.session).toBeNull();
	});
});
