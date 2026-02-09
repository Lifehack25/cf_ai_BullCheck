interface Env {
	DB: D1Database;
	AI: import('@cloudflare/workers-types').Ai;
	ASSETS: Fetcher;
	BULLCHECK_AGENT: DurableObjectNamespace;
	BETTER_AUTH_URL: string;
	BETTER_AUTH_SECRET: string;
	AI_GATEWAY_ACCOUNT_ID: string;
	AI_GATEWAY_ID: string;
	AI_GATEWAY_TOKEN: string;
	WORKERS_AI_TOKEN: string;
	SOURCE_METADATA_CACHE: KVNamespace;
	SOURCE_RESPONSE_CACHE: KVNamespace;
}

declare module 'cloudflare:test' {
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	interface ProvidedEnv extends Env {}
}
