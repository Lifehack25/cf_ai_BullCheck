import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { ChatApi } from '$lib/api/chat';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	const session =
		locals.session && locals.user ? { session: locals.session, user: locals.user } : null;

	let chats: Record<string, unknown>[] = [];
	if (session && platform?.env?.DB) {
		const drizzleDb = db(platform.env.DB);
		const chatApi = new ChatApi(() => drizzleDb);
		chats = await chatApi.getChats(session.user.id);
	}

	return {
		session,
		chats
	};
};
