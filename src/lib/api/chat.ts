import { db } from '$lib/server/db';
import { chat } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Chat management API for database operations
 * Handles creating and retrieving chat sessions
 */
export class ChatApi {
	constructor(private getDb: () => ReturnType<typeof db>) {}

	private get database() {
		return this.getDb();
	}

	/**
	 * Creates a new chat session for the user
	 * @param userId - The user's unique identifier
	 * @param title - The chat title/name
	 * @returns The created chat object with ID and timestamps
	 */
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

	/**
	 * Retrieves all chat sessions for a user
	 * @param userId - The user's unique identifier
	 * @returns Array of chat objects ordered by most recent first
	 */
	async getChats(userId: string) {
		return this.database
			.select()
			.from(chat)
			.where(eq(chat.userId, userId))
			.orderBy(desc(chat.updatedAt));
	}

	/**
	 * Retrieves a specific chat session
	 * @param chatId - The chat's unique identifier
	 * @returns The chat object or undefined if not found
	 */
	async getChat(chatId: string) {
		return this.database.query.chat.findFirst({
			where: eq(chat.id, chatId)
		});
	}
}
