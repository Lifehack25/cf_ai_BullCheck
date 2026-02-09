<script lang="ts">
	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';
	import horns from '$lib/assets/horns.png';

	let { chats = [], isOpen = true, toggleSidebar } = $props();

	function formatDate(date: Date) {
		return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
			new Date(date)
		);
	}
	/** Navigate to the landing page to start a brand new chat */
	function startNewChat() {
		window.location.href = '/';
	}

	function handleMobileSelect() {
		if (typeof toggleSidebar === 'function') {
			toggleSidebar();
		}
	}
</script>

<!-- Sidebar shell: compact rail + sliding history panel -->
<div class="fixed top-0 left-0 z-40 flex h-screen">
	<!-- Compact vertical rail -->
	<div
		class="hidden h-full w-16 flex-col items-center justify-between border-r border-zinc-200 bg-[#FAFAFA]/95 pt-2 pb-6 text-[#0c1719] shadow-sm md:flex"
	>
		<div class="flex flex-col items-center gap-3">
			<a
				href="/"
				class="group transition-transform duration-300 hover:-translate-y-0.5"
				aria-label="BullCheck home"
			>
				<img src={horns} alt="BullCheck logo" class="h-10 w-10 rounded-xl object-contain" />
			</a>

			<button
				onclick={startNewChat}
				class="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#307e4b] text-white shadow-lg ring-1 shadow-[#307e4b]/30 ring-[#307e4b]/40 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#26633b] hover:ring-[#26633b]/50 active:scale-95"
				aria-label="Start new chat"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="h-5 w-5"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
			</button>

			<button
				onclick={toggleSidebar}
				class="mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-[#0c1719] active:scale-95"
				aria-label={isOpen ? 'Hide chat history' : 'Show chat history'}
			>
				{#if isOpen}
					<!-- Collapse arrow (points left, towards rail) -->
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
				{:else}
					<!-- Expand arrow (same icon, opposite direction) -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="h-4 w-4"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
					</svg>
				{/if}
			</button>
		</div>

		<!-- Future profile / settings slot -->
		<div class="flex flex-col items-center gap-3 text-[10px] text-zinc-400">
			<span class="rounded-full bg-zinc-100 px-2 py-1 backdrop-blur-sm">v1</span>
		</div>
	</div>

	{#if isOpen}
		<aside
			transition:slide={{ axis: 'x', duration: 260 }}
			class="hidden h-full w-64 border-r border-zinc-200 bg-[#FAFAFA]/95 pt-20 backdrop-blur-md transition-all duration-300 md:block"
		>
			<div class="flex items-center justify-between px-4 py-2">
				<h2 class="text-xs font-semibold tracking-wider text-zinc-400 uppercase">History</h2>
			</div>

			<div class="mt-4 h-[calc(100vh-8rem)] overflow-y-auto px-2">
				{@render historyItems(false)}
			</div>

			<!-- User Profile Area could go here -->
		</aside>
	{/if}
</div>

{#if isOpen}
	<div class="fixed inset-0 z-50 md:hidden">
		<button
			class="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
			aria-label="Close menu"
			onclick={toggleSidebar}
		></button>

		<aside
			transition:slide={{ axis: 'x', duration: 260 }}
			class="absolute top-0 left-0 flex h-full w-72 max-w-[85vw] flex-col border-r border-zinc-200 bg-[#FAFAFA]/95 pt-4 shadow-2xl"
		>
			<div class="flex items-center justify-between px-4">
				<div class="flex items-center gap-3">
					<img src={horns} alt="BullCheck logo" class="h-9 w-9 rounded-xl object-contain" />
					<span class="text-sm font-semibold text-[#0c1719]">BullCheck</span>
				</div>
				<button
					onclick={toggleSidebar}
					class="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-zinc-600 ring-1 ring-zinc-200 transition-all duration-200 hover:text-[#0c1719]"
					aria-label="Close menu"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="h-4 w-4"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="mt-4 px-4">
				<button
					onclick={startNewChat}
					class="flex w-full items-center justify-center rounded-2xl bg-[#307e4b] py-3 text-sm font-semibold text-white shadow-lg shadow-[#307e4b]/30 transition-all duration-300 hover:bg-[#26633b]"
				>
					New chat
				</button>
			</div>

			<div class="mt-4 h-[calc(100vh-12rem)] overflow-y-auto px-2">
				{@render historyItems(true)}
			</div>
		</aside>
	</div>
{/if}

{#snippet historyItems(isMobile: boolean)}
	<div class="space-y-1">
		{#if chats.length === 0}
			<div class="px-4 py-8 text-center text-sm text-zinc-400">No history yet.</div>
		{/if}

		{#each chats as chat (chat.id)}
			<a
				href="/chat/{chat.id}"
				onclick={() => {
					if (isMobile) handleMobileSelect();
				}}
				class="group relative block rounded-lg px-3 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm
                        {$page.url.pathname.includes(chat.id)
					? 'bg-white shadow-sm ring-1 ring-black/5'
					: ''}"
			>
				<p class="truncate text-sm font-medium text-[#0c1719] group-hover:text-black">
					{chat.title}
				</p>
				<p class="truncate text-xs text-zinc-400 group-hover:text-zinc-500">
					{formatDate(chat.updatedAt)}
				</p>
			</a>
		{/each}
	</div>
{/snippet}
