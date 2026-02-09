import { describe, expect, it, vi } from 'vitest';
import { POST } from '../../src/routes/api/chat/+server';

describe('api chat', () => {
	it('returns error when agent binding is missing', async () => {
		const request = new Request('http://localhost/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ chatId: 'chat-1', message: { role: 'user', content: 'Hi' } })
		});

		const response = await POST({
			request,
			locals: {} as unknown as App.Locals,
			platform: { env: {} } as unknown as App.Platform
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as unknown as import('@sveltejs/kit').RequestEvent<any, any>);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const json = (await response.json()) as any;
		expect(json.error).toBe('Agent binding not found');
	});

	it('returns error when chatId is missing', async () => {
		const request = new Request('http://localhost/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ message: { role: 'user', content: 'Hi' } })
		});

		const response = await POST({
			request,
			locals: {} as unknown as App.Locals,
			platform: {
				env: {
					BULLCHECK_AGENT: {
						idFromName: vi.fn(),
						get: vi.fn()
					}
				}
			} as unknown as App.Platform
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as unknown as import('@sveltejs/kit').RequestEvent<any, any>);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const json = (await response.json()) as any;
		expect(json.error).toBe('Chat ID required');
	});

	it('passes through durable object response', async () => {
		const responseBody = { response: 'Hello from DO' };
		const stub = {
			fetch: vi.fn().mockResolvedValue(
				new Response(JSON.stringify(responseBody), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
			)
		};
		const namespace = {
			idFromName: vi.fn().mockReturnValue('id-1'),
			get: vi.fn().mockReturnValue(stub)
		};

		const request = new Request('http://localhost/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				chatId: 'chat-1',
				message: { role: 'user', content: 'Hi' }
			})
		});

		const response = await POST({
			request,
			locals: {} as unknown as App.Locals,
			platform: { env: { BULLCHECK_AGENT: namespace } } as unknown as App.Platform
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as unknown as import('@sveltejs/kit').RequestEvent<any, any>);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const json = (await response.json()) as any;
		expect(json).toEqual(responseBody);
		expect(stub.fetch).toHaveBeenCalled();
	});
});
