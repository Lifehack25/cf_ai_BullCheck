<script lang="ts">
	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';

	let { chats = [], isOpen = true, toggleSidebar } = $props();

	function formatDate(date: Date) {
		return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
			new Date(date)
		);
	}
</script>

{#if isOpen}
	<div
		transition:slide={{ axis: 'x', duration: 300 }}
		class="fixed top-0 left-0 z-40 h-screen w-64 border-r border-zinc-200 bg-[#FAFAFA]/95 pt-20 backdrop-blur-md transition-all duration-300"
	>
		<div class="flex items-center justify-between px-4 py-2">
			<h2 class="text-xs font-semibold tracking-wider text-zinc-400 uppercase">History</h2>
			<button
				onclick={toggleSidebar}
				class="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
				aria-label="Close Sidebar"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="h-4 w-4"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
				</svg>
			</button>
		</div>

		<div class="px-4 pb-2">
			<button
				onclick={() => /* Start new chat navigation */ (window.location.href = '/')}
				class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0c1719] px-4 py-3 font-medium text-white shadow-lg transition-all hover:bg-black active:scale-95"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="h-4 w-4"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
				New Chat
			</button>
		</div>

		<div class="mt-4 h-[calc(100vh-8rem)] overflow-y-auto px-2">
			<div class="space-y-1">
				{#if chats.length === 0}
					<div class="px-4 py-8 text-center text-sm text-zinc-400">No history yet.</div>
				{/if}

				{#each chats as chat (chat.id)}
					<a
						href="/chat/{chat.id}"
						class="group relative block rounded-lg px-3 py-3 transition-colors hover:bg-white hover:shadow-sm
                        {$page.url.pathname.includes(chat.id)
							? 'bg-white shadow-sm ring-1 ring-black/5'
							: ''}"
					>
						<p class="truncate text-sm font-medium text-[#0c1719]">{chat.title}</p>
						<p class="truncate text-xs text-zinc-400">{formatDate(chat.updatedAt)}</p>
					</a>
				{/each}
			</div>
		</div>

		<!-- User Profile Area could go here -->
	</div>
{/if}

<!-- Toggle Button (Visible when closed) -->
{#if !isOpen}
	<div class="fixed top-24 left-6 z-50">
		<button
			onclick={toggleSidebar}
			class="rounded-lg bg-white p-2 text-zinc-600 shadow-md transition-all hover:text-[#0c1719]"
			aria-label="Open Sidebar"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				class="h-5 w-5"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
				/>
			</svg>
		</button>
	</div>
{/if}
