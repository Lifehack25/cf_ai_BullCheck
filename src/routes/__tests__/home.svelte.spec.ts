import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Home from '../+page.svelte';
import { goto } from '$app/navigation';

vi.mock('$app/stores', async () => {
	const { writable } = await import('svelte/store');
	return {
		page: writable({ url: new URL('http://localhost/') })
	};
});

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
	vi.unstubAllGlobals();
});

/**
 * Tests for Home Page Interaction
 *
 * Verifies key user flows on the landing page:
 * - Submitting a question creates a new chat and redirects
 * - UI state (loading/disabled) updates correctly during submission
 */
describe('home page', () => {
	it('posts to create chat and navigates on Enter', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ id: 'chat-123' })
		});
		vi.stubGlobal('fetch', fetchMock);

		render(Home);
		const input = screen.getByPlaceholderText('What stats would you like to know today?');
		await userEvent.type(input, 'Hello{enter}');

		expect(fetchMock).toHaveBeenCalled();
		expect(goto).toHaveBeenCalledWith('/chat/chat-123?initialMessage=Hello');
	});

	it('disables the search button while loading', async () => {
		const pending = new Promise(() => {});
		const fetchMock = vi.fn().mockReturnValue(pending);
		vi.stubGlobal('fetch', fetchMock);

		render(Home);
		const input = screen.getByPlaceholderText('What stats would you like to know today?');
		const button = screen.getByRole('button', { name: /search/i });

		await userEvent.type(input, 'Hello');
		await userEvent.click(button);

		expect(button).toBeDisabled();
	});
});
