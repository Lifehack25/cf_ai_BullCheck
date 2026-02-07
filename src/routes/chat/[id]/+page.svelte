<script lang="ts">
	import { page } from '$app/stores';
	import { onMount, tick } from 'svelte';
	import { fade, slide } from 'svelte/transition';

	let { data } = $props();

	// State
	let messages = $state(data.messages || []);
	let input = $state('');
	let loading = $state(false);
	let chatContainer: HTMLElement;

	// Scroll to bottom helper
	function scrollToBottom() {
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	$effect(() => {
		if (messages.length) {
			tick().then(scrollToBottom);
		}
	});

	onMount(() => {
		const initialMessage = $page.url.searchParams.get('initialMessage');
		if (initialMessage) {
			input = initialMessage;
			// Remove param from URL without reload to avoid double-send on refresh
			const newUrl = new URL($page.url);
			newUrl.searchParams.delete('initialMessage');
			window.history.replaceState({}, '', newUrl);

			handleSubmit();
		}
		scrollToBottom();
	});

	async function handleSubmit() {
		if (!input.trim() || loading) return;

		const userMsg = { role: 'user', content: input };
		const payload = { message: userMsg, chatId: data.chat.id };

		// Optimistic update
		messages = [...messages, userMsg];
		const currentInput = input;
		input = '';
		loading = true;

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (response.ok) {
				try {
					const data = (await response.json()) as any;
					const cleanText = data.response || data.details || JSON.stringify(data);
					messages = [...messages, { role: 'assistant', content: cleanText }];
				} catch (e) {
					// Fallback if not JSON
					const text = await response.text();
					messages = [...messages, { role: 'assistant', content: text }];
				}
			} else {
				console.error('Failed to send message');
				messages = [...messages, { role: 'system', content: 'Error: Failed to send message.' }];
				input = currentInput; // Restore input
			}
		} catch (e) {
			console.error(e);
			messages = [...messages, { role: 'system', content: 'Error: Connection failed.' }];
			input = currentInput;
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	}
</script>

<div class="flex h-[calc(100vh-64px)] flex-col bg-[#FAFAFA]">
	<!-- Chat Area -->
	<div bind:this={chatContainer} class="flex-1 overflow-y-auto scroll-smooth px-4 py-6">
		<div class="mx-auto max-w-3xl space-y-6">
			{#if messages.length === 0}
				<div class="flex h-full flex-col items-center justify-center text-center text-zinc-400">
					<p>Start a conversation with BullCheck Agent.</p>
				</div>
			{/if}

			{#each messages as msg, i (i)}
				<div
					in:slide|local={{ duration: 300, axis: 'y' }}
					class="flex flex-col gap-2 {msg.role === 'user' ? 'items-end' : 'items-start'}"
				>
					<div
						class="max-w-[85%] rounded-2xl px-5 py-3.5 leading-relaxed shadow-sm
                        {msg.role === 'user'
							? 'bg-[#0c1719] text-white'
							: 'border border-zinc-200 bg-white text-[#0c1719]'}"
					>
						<!-- Basic markdown-like rendering could go here, for now raw text -->
						<div class="whitespace-pre-wrap">{msg.content}</div>
					</div>
					<span class="px-1 text-[10px] font-medium tracking-wide text-zinc-300 uppercase">
						{msg.role}
					</span>
				</div>
			{/each}

			{#if loading}
				<div in:fade class="flex items-start gap-2">
					<div
						class="flex items-center gap-1 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
					>
						<div
							class="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]"
						></div>
						<div
							class="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]"
						></div>
						<div class="h-2 w-2 animate-bounce rounded-full bg-zinc-400"></div>
					</div>
				</div>
			{/if}

			<div class="h-4"></div>
			<!-- Spacer -->
		</div>
	</div>

	<!-- Input Area -->
	<div class="border-t border-zinc-200 bg-white/80 px-4 py-4 backdrop-blur-md">
		<div class="mx-auto max-w-3xl">
			<div
				class="relative flex items-end gap-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm focus-within:ring-2 focus-within:ring-[#0c1719]/10"
			>
				<textarea
					bind:value={input}
					onkeydown={handleKeydown}
					disabled={loading}
					rows="1"
					placeholder="Ask about clinical data..."
					class="max-h-48 min-h-[44px] w-full resize-none border-none bg-transparent px-3 py-2.5 text-[#0c1719] placeholder-zinc-400 outline-none focus:ring-0 disabled:opacity-50"
				></textarea>

				<button
					onclick={handleSubmit}
					disabled={!input.trim() || loading}
					class="mr-1 mb-1 rounded-xl bg-[#0c1719] p-2 text-white transition-all hover:bg-black active:scale-95 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:active:scale-100"
					aria-label="Send Message"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="h-5 w-5"
					>
						<path
							d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z"
						/>
					</svg>
				</button>
			</div>
			<p class="mt-2 text-center text-[10px] text-zinc-400">
				AI can make mistakes. Check important info.
			</p>
		</div>
	</div>
</div>
