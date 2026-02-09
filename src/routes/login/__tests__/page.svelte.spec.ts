import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Login from '../+page.svelte';

const signInEmail = vi.hoisted(() => vi.fn());

vi.mock('$lib/auth-client', () => ({
	authClient: {
		signIn: { email: signInEmail }
	}
}));

afterEach(() => {
	vi.clearAllMocks();
});

/**
 * Tests for Login Page
 *
 * Verifies the authentication flow:
 * - Handling invalid credentials
 * - Displaying loading states during API calls
 * - Showing error feedback to the user
 */
describe('login page', () => {
	it('shows loading state and error on failed login', async () => {
		let resolvePromise!: (value: { error: { message: string } }) => void;
		const pending = new Promise<{ error: { message: string } }>((resolve) => {
			resolvePromise = resolve;
		});
		signInEmail.mockReturnValueOnce(pending);

		render(Login);
		await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
		await userEvent.type(screen.getByLabelText('Password'), 'password');
		const button = screen.getByRole('button', { name: /sign in/i });
		await userEvent.click(button);

		expect(button).toHaveTextContent('Thinking...');

		resolvePromise({ error: { message: 'Invalid credentials' } });

		await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument());
		expect(button).toHaveTextContent('Sign In');
	});
});
