import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	console.log(`[Page Load] Checking session. User: ${locals.user?.email}`);
	if (!locals.session) {
		console.log('[Page Load] No session, redirecting to /login');
		throw redirect(302, '/login');
	}
	return {};
};
