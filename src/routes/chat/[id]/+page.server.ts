import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { ChatApi } from '$lib/api/chat';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	// 1. Verify User Session
	// 1. Verify User Session
	await locals.auth.api.getSession({
		headers: new Headers()
	});

	// Check local session first
	if (!locals.session) {
		throw redirect(302, '/login');
	}

	if (!platform?.env?.DB || !platform?.env?.BULLCHECK_AGENT) {
		throw error(500, 'System unavailable');
	}

	const chatId = params.id;
	const chatApi = new ChatApi(() => db(platform.env.DB));

	// 2. Fetch Chat Metadata
	const chat = await chatApi.getChat(chatId);
	if (!chat) {
		throw error(404, 'Chat not found');
	}

	if (!locals.user) {
		throw redirect(302, '/login');
	}

	if (chat.userId !== locals.user.id) {
		throw error(403, 'Unauthorized');
	}

	// 3. Fetch History from Durable Object
	try {
		const doId = platform.env.BULLCHECK_AGENT.idFromName(chatId);
		const stub = platform.env.BULLCHECK_AGENT.get(doId);
		const response = await stub.fetch('http://dummy/history');

		interface Message {
			role: string;
			content: string;
		}
		let messages: Message[] = [];
		if (response.ok) {
			messages = (await response.json()) as Message[];
		}

		return {
			chat,
			messages
		};
	} catch (e: unknown) {
		console.error('Failed to fetch history:', e);
		return {
			chat,
			messages: []
		};
	}
};
