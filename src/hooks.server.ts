import { auth } from '$lib/auth';
import type { Handle } from '@sveltejs/kit';

/**
 * Server Hooks (SvelteKit)
 *
 * Handles authentication and request context population on the Edge.
 * - Initializes Better Auth with the D1 database binding.
 * - Resolves user sessions from headers.
 * - Populates `event.locals` for use in loaders and actions.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const db = event.platform?.env?.DB;
	if (db) {
		const authInstance = auth(
			db,
			event.platform?.env?.BETTER_AUTH_URL,
			event.platform?.env?.BETTER_AUTH_SECRET
		);
		event.locals.auth = authInstance;

		const session = await authInstance.api.getSession({
			headers: event.request.headers
		});

		if (session) {
			event.locals.user = session.user;
			event.locals.session = session.session;
		} else {
			event.locals.user = null;
			event.locals.session = null;
		}
	}

	return resolve(event);
};
