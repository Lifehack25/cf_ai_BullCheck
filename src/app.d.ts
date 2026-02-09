// See https://svelte.dev/docs/kit/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: import('better-auth').User | null;
			session: import('better-auth').Session | null;
			auth: ReturnType<typeof import('$lib/auth').auth>;
		}
		// interface PageData {}
		interface Platform {
			env: {
				DB: D1Database;
				AI: import('@cloudflare/workers-types').Ai;
				AI_GATEWAY_ACCOUNT_ID: string;
				AI_GATEWAY_ID: string;
				AI_GATEWAY_TOKEN: string;
				WORKERS_AI_TOKEN: string;
				BULLCHECK_AGENT: DurableObjectNamespace;
				BETTER_AUTH_URL: string;
				BETTER_AUTH_SECRET: string;
				SOURCE_METADATA_CACHE: KVNamespace;
				SOURCE_RESPONSE_CACHE: KVNamespace;
			};
			context: {
				waitUntil(promise: Promise<unknown>): void;
			};
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
