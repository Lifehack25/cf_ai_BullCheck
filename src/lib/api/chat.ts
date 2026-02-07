// @ts-nocheck
import { db } from '$lib/server/db';
import { chat, source } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export class ChatApi {
	constructor(private getDb: () => ReturnType<typeof db>) { }

	private get database() {
		return this.getDb();
	}

	async createChat(userId: string, title: string) {
		const [newChat] = await this.database
			.insert(chat)
			.values({
				userId,
				title
			})
			.returning();
		return newChat;
	}

	async getChats(userId: string) {
		return this.database
			.select()
			.from(chat)
			.where(eq(chat.userId, userId))
			.orderBy(desc(chat.updatedAt));
	}

	async getChat(chatId: string) {
		return this.database.query.chat.findFirst({
			where: eq(chat.id, chatId)
		});
	}

	// async addSource(userId: string, url: string, title?: string, snippet?: string) {
	// 	await this.database.insert(source).values({
	// 		userId,
	// 		url,
	// 		title,
	// 		snippet
	// 	});
	// }

	// async getSources(userId: string) {
	// 	return this.database.select().from(source).where(eq(source.userId, userId));
	// }
}
