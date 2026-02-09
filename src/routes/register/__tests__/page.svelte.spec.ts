import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Register from '../+page.svelte';

const signUpEmail = vi.hoisted(() => vi.fn());

vi.mock('$lib/auth-client', () => ({
	authClient: {
		signUp: { email: signUpEmail }
	}
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

afterEach(() => {
	vi.clearAllMocks();
});

/**
 * Tests for Registration Page
 *
 * Verifies the user sign-up flow:
 * - Form submission handling
 * - Error state management (e.g., existing user)
 * - Loading indicator feedback
 */
describe('register page', () => {
	it('shows loading state and error on failed registration', async () => {
		let resolvePromise!: (value: { error: { message: string } }) => void;
		const pending = new Promise<{ error: { message: string } }>((resolve) => {
			resolvePromise = resolve;
		});
		signUpEmail.mockReturnValueOnce(pending);

		render(Register);
		await userEvent.type(screen.getByLabelText('Full Name'), 'Test User');
		await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
		await userEvent.type(screen.getByLabelText('Password'), 'password');

		const button = screen.getByRole('button', { name: /sign up/i });
		await userEvent.click(button);

		expect(button).toHaveTextContent('Creating Account...');

		resolvePromise({ error: { message: 'Registration failed' } });

		await waitFor(() => expect(screen.getByText('Registration failed')).toBeInTheDocument());
		expect(button).toHaveTextContent('Sign Up');
	});
});
