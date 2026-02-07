import { auth } from '$lib/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, platform }) => {
	if (!platform?.env?.DB) {
		return new Response('Database not available', { status: 500 });
	}
	return auth(
		platform.env.DB,
		platform.env.BETTER_AUTH_URL,
		platform.env.BETTER_AUTH_SECRET
	).handler(request);
};

export const POST: RequestHandler = async ({ request, platform }) => {
	if (!platform?.env?.DB) {
		return new Response('Database not available', { status: 500 });
	}
	return auth(
		platform.env.DB,
		platform.env.BETTER_AUTH_URL,
		platform.env.BETTER_AUTH_SECRET
	).handler(request);
};
