<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/horns.png';
	import { onMount } from 'svelte';

	import Sidebar from '$lib/components/Sidebar.svelte';

	import { authClient } from '$lib/auth-client';

	async function handleLogout() {
		await authClient.signOut();
		window.location.href = '/'; // Refresh to clear state
	}

	let { children, data } = $props();
	let isSidebarOpen = $state(false);

	function toggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}

	onMount(() => {
		const mediaQuery = window.matchMedia('(min-width: 768px)');

		const syncSidebarState = (event?: MediaQueryListEvent) => {
			const isDesktop = event ? event.matches : mediaQuery.matches;
			if (!isDesktop) {
				isSidebarOpen = false;
			}
		};

		syncSidebarState();

		if (mediaQuery.addEventListener) {
			mediaQuery.addEventListener('change', syncSidebarState);
		} else {
			mediaQuery.addListener(syncSidebarState);
		}

		return () => {
			if (mediaQuery.removeEventListener) {
				mediaQuery.removeEventListener('change', syncSidebarState);
			} else {
				mediaQuery.removeListener(syncSidebarState);
			}
		};
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<!-- Sidebar (Only if logged in) -->
{#if data.session}
	<Sidebar chats={data.chats} isOpen={isSidebarOpen} {toggleSidebar} />
{/if}

<nav class="isolate z-30 flex items-center px-6 py-3 transition-all duration-300 md:px-12">
	<div class="mt-2 flex w-full items-center gap-2">
		{#if data.session}
			<button
				onclick={toggleSidebar}
				class="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white/80 text-zinc-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-[#0c1719] md:hidden"
				aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
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
						d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
					/>
				</svg>
			</button>
		{/if}

		<!-- Left spacer to balance centered nav links -->
		<div class="flex-1"></div>

		<!-- Centered navigation links -->
		<div class="flex items-center justify-center gap-6 md:gap-8">
			<a
				href="/about"
				class="group relative text-sm font-medium text-zinc-600 transition-colors hover:text-[#0c1719]"
			>
				About
				<span
					class="absolute -bottom-1 left-0 h-0.5 w-0 bg-[#0c1719] transition-all duration-300 group-hover:w-full"
				></span>
			</a>
			<a
				href="/sources"
				class="group relative text-sm font-medium text-zinc-600 transition-colors hover:text-[#0c1719]"
			>
				Sources
				<span
					class="absolute -bottom-1 left-0 h-0.5 w-0 bg-[#0c1719] transition-all duration-300 group-hover:w-full"
				></span>
			</a>
		</div>

		<!-- Right auth controls -->
		<div class="flex flex-1 items-center justify-end gap-4">
			{#if data.session}
				<button
					onclick={handleLogout}
					class="group relative text-sm font-medium !text-[#0c1719] mix-blend-normal transition-colors hover:!text-[#0c1719]"
				>
					Sign Out
					<span
						class="absolute -bottom-1 left-0 h-0.5 w-0 bg-[#0c1719] transition-all duration-300 group-hover:w-full"
					></span>
				</button>
			{:else}
				<a href="/login" class="text-sm font-medium text-[#0c1719] hover:underline">Sign In</a>
			{/if}
		</div>
	</div>
</nav>

<div class="pt-4 transition-all duration-300">
	{@render children()}
</div>
