import { describe, expect, it, vi } from 'vitest';
import { env } from 'cloudflare:test';
import { POST } from '../../src/routes/api/chat/create/+server';
import { TEST_USER } from './setup';

describe('api chat create', () => {
	it('returns 401 when no session', async () => {
		const request = new Request('http://localhost/api/chat/create', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ message: 'Hello' })
		});

		const response = await POST({
			request,
			locals: {
				auth: { api: { getSession: vi.fn().mockResolvedValue(null) } }
			} as unknown as App.Locals,
			platform: { env } as unknown as App.Platform
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as unknown as import('@sveltejs/kit').RequestEvent<any, any>);

		expect(response.status).toBe(401);
	});

	it('returns 500 when database binding is missing', async () => {
		const request = new Request('http://localhost/api/chat/create', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ message: 'Hello' })
		});

		const response = await POST({
			request,
			locals: {
				auth: {
					api: { getSession: vi.fn().mockResolvedValue({ user: { id: TEST_USER.id } }) }
				}
			} as unknown as App.Locals,
			platform: { env: {} } as unknown as App.Platform
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as unknown as import('@sveltejs/kit').RequestEvent<any, any>);

		expect(response.status).toBe(500);
	});

	it('creates a chat and truncates the title', async () => {
		const message = 'This is a long message that should be truncated at fifty characters exactly.';
		const request = new Request('http://localhost/api/chat/create', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ message })
		});

		const response = await POST({
			request,
			locals: {
				auth: {
					api: { getSession: vi.fn().mockResolvedValue({ user: { id: TEST_USER.id } }) }
				}
			} as unknown as App.Locals,
			platform: { env } as unknown as App.Platform
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as unknown as import('@sveltejs/kit').RequestEvent<any, any>);

		expect(response.status).toBe(200);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const json = (await response.json()) as any;
		expect(json.title).toBe(message.slice(0, 50));
		expect(json.userId).toBe(TEST_USER.id);
	});
});
