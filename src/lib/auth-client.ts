import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
	// baseURL is inferred from window.location in the browser
});
