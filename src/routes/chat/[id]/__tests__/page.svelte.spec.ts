import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import ChatPage from '../+page.svelte';
import { page } from '$app/stores';

vi.mock('$app/stores', async () => {
	const { writable } = await import('svelte/store');
	return {
		page: writable({
			url: new URL('http://localhost/chat/abc?initialMessage=Hello')
		})
	};
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

/**
 * Tests for Chat Interface
 *
 * Verifies the core conversational UI:
 * - Initial message processing from URL params
 * - Rendering user and assistant messages
 * - Graceful error handling for failed API requests
 */
describe('chat page', () => {
	it('sends initialMessage and renders assistant response', async () => {
		vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ response: 'Hi there' })
		});
		vi.stubGlobal('fetch', fetchMock);
		(page as unknown as import('svelte/store').Writable<unknown>).set({
			url: new URL('http://localhost/chat/abc?initialMessage=Hello')
		});

		render(ChatPage, {
			props: {
				data: {
					session: null,
					chats: [],
					chat: {
						id: 'chat-abc',
						createdAt: new Date(),
						updatedAt: new Date(),
						userId: 'user-1',
						title: 'Test Chat'
					},
					messages: []
				}
			}
		});

		await waitFor(() => expect(fetchMock).toHaveBeenCalled());
		expect(await screen.findByText('Hello')).toBeInTheDocument();
		expect(await screen.findByText('Hi there')).toBeInTheDocument();
	});

	it('shows an error message when the API fails', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
		const fetchMock = vi.fn().mockResolvedValue({
			ok: false
		});
		vi.stubGlobal('fetch', fetchMock);
		(page as unknown as import('svelte/store').Writable<unknown>).set({
			url: new URL('http://localhost/chat/abc?initialMessage=Fail')
		});

		render(ChatPage, {
			props: {
				data: {
					session: null,
					chats: [],
					chat: {
						id: 'chat-abc',
						createdAt: new Date(),
						updatedAt: new Date(),
						userId: 'user-1',
						title: 'Test Chat'
					},
					messages: []
				}
			}
		});

		expect(await screen.findByText('Error: Failed to send message.')).toBeInTheDocument();
	});
});
