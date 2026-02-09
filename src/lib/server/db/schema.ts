import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// --- Better Auth Schema ---

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull(),
	image: text('image'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	token: text('token').notNull().unique(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id')
		.notNull()
		.references(() => user.id)
});

export const account = sqliteTable('account', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
	refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
	scope: text('scope'),
	password: text('password'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const verification = sqliteTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
});

// --- Application Schema ---

export const chat = sqliteTable('chat', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	title: text('title').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const source = sqliteTable('source', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organization: text('organization').notNull(),
	key: text('key').notNull().unique(),
	apiUrl: text('api_url').notNull(),
	description: text('description').notNull(), // Full context for the agent (merged categories/queries)
	isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// --- Application Schema ---

/**
 * SCB Deterministic Tables Index
 *
 * This table acts as a local semantic index for Statistics Sweden (SCB) data.
 * Instead of searching the SCB API in real-time (which is slow and inconsistent),
 * we index table metadata here to allow for fast, deterministic "grounding" of user queries.
 */
export const scb_tables = sqliteTable('scb_tables', {
	id: text('id').primaryKey(), // e.g., 'TAB4392'
	title: text('title').notNull(),
	description: text('description'),
	api_path: text('api_path').notNull(), // e.g., 'tables/TAB4392'
	keywords: text('keywords'), // JSON array of searchable terms
	dimensions: text('dimensions'), // JSON cache of metadata
	last_updated: integer('last_updated', { mode: 'timestamp' })
});
