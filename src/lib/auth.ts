import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';

export const auth = (d1: D1Database, baseURL?: string, secret?: string) =>
	betterAuth({
		secret,
		database: drizzleAdapter(db(d1), {
			provider: 'sqlite',
			schema
		}),
		emailAndPassword: {
			enabled: true
		},
		baseURL,
		trustedOrigins: ['https://bullcheck.pontus-dorsay.workers.dev', 'http://localhost:5173'],
		advanced: {
			cookiePrefix: 'better-auth'
		}
	});
