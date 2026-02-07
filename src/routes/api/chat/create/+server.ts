import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ChatApi } from '$lib/api/chat';
import { db } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	// Verify session
	const session = await locals.auth.api.getSession({
		headers: request.headers
	});

	if (!session || !session.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (!platform?.env?.DB) {
		return json({ error: 'Database not available' }, { status: 500 });
	}

	const { message } = (await request.json()) as { message: string };
	const title = message ? message.slice(0, 50) : 'New Chat';

	const chatApi = new ChatApi(() => db(platform.env.DB));
	const newChat = await chatApi.createChat(session.user.id, title);

	return json(newChat);
};
