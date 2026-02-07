import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		console.log('Chat API called');
		const env = platform?.env;

		if (!env || !env.BULLCHECK_AGENT) {
			console.error('Agent binding missing');
			return json({ error: 'Agent binding not found' }, { status: 200 });
		}

		// Use Chat ID for the Durable Object to isolate conversations
		const { chatId, message } = (await request.json()) as { chatId: string; message: string };

		if (!chatId) {
			return json({ error: 'Chat ID required' }, { status: 200 }); // Status 200 to see error
		}

		const id = env.BULLCHECK_AGENT.idFromName(chatId);
		const stub = env.BULLCHECK_AGENT.get(id);

		// Forward the request
		const body = { message };
		// Use a fully qualified URL for the DO fetch
		const agentUrl = new URL('https://dummy-host/chat');

		console.log('Fetching DO...');
		try {
			const response = await stub.fetch(agentUrl.toString(), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			if (!response.ok) {
				const text = await response.text();
				return json(
					{ error: `DO Error: ${response.status} ${response.statusText}`, details: text },
					{ status: 200 }
				);
			}

			return response;
		} catch (fetchError: unknown) {
			const error = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
			console.error('Stub fetch error:', error);
			return json(
				{ error: 'Stub Fetch Failed', message: error.message, stack: error.stack },
				{ status: 200 }
			);
		}
	} catch (e: unknown) {
		const error = e instanceof Error ? e : new Error(String(e));
		console.error('Global API Error:', error);
		return json(
			{ error: 'Global API Error', message: error.message, stack: error.stack },
			{ status: 200 }
		);
	}
};
