import { beforeEach } from 'vitest';
import { env } from 'cloudflare:test';

const FIXED_NOW = 1700000000000;

export const TEST_USER = {
	id: 'user-1',
	name: 'Test User',
	email: 'test@example.com'
};

async function ensureSchema() {
	await env.DB.prepare(
		`CREATE TABLE IF NOT EXISTS user (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		email TEXT NOT NULL UNIQUE,
		email_verified INTEGER NOT NULL,
		image TEXT,
		created_at INTEGER NOT NULL,
		updated_at INTEGER NOT NULL
	);`
	).run();

	await env.DB.prepare(
		`CREATE TABLE IF NOT EXISTS chat (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		title TEXT NOT NULL,
		created_at INTEGER NOT NULL,
		updated_at INTEGER NOT NULL
	);`
	).run();

	await env.DB.prepare(
		`CREATE TABLE IF NOT EXISTS scb_tables (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		description TEXT,
		api_path TEXT NOT NULL,
		keywords TEXT,
		dimensions TEXT,
		last_updated INTEGER
	);`
	).run();
}

export async function seedBase() {
	await ensureSchema();
	await env.DB.prepare('DELETE FROM chat;').run();
	await env.DB.prepare('DELETE FROM user;').run();
	await env.DB.prepare('DELETE FROM scb_tables;').run();

	await env.DB.prepare(
		`INSERT INTO user (id, name, email, email_verified, image, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?);`
	)
		.bind(TEST_USER.id, TEST_USER.name, TEST_USER.email, 1, null, FIXED_NOW, FIXED_NOW)
		.run();
}

export async function insertChat(params?: { id?: string; userId?: string; title?: string }) {
	const id = params?.id ?? 'chat-1';
	const userId = params?.userId ?? TEST_USER.id;
	const title = params?.title ?? 'Test Chat';
	await env.DB.prepare(
		`INSERT INTO chat (id, user_id, title, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?);`
	)
		.bind(id, userId, title, FIXED_NOW, FIXED_NOW)
		.run();
	return { id, userId, title };
}

export async function insertScbTable(params?: {
	id?: string;
	title?: string;
	apiPath?: string;
	keywords?: string[];
}) {
	const id = params?.id ?? 'TABTEST';
	const title = params?.title ?? 'Test Table';
	const apiPath = params?.apiPath ?? 'tables/TABTEST';
	const keywords = params?.keywords ?? ['deaths', 'mortality'];
	await env.DB.prepare(
		`INSERT INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
		 VALUES (?, ?, ?, ?, ?, ?, ?);`
	)
		.bind(id, title, 'Test description', apiPath, JSON.stringify(keywords), null, FIXED_NOW)
		.run();
	return { id, title, apiPath };
}

beforeEach(async () => {
	await seedBase();
});
