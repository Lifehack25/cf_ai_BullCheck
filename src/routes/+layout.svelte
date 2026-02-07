<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	import Sidebar from '$lib/components/Sidebar.svelte';

	import { authClient } from '$lib/auth-client';

	async function handleLogout() {
		await authClient.signOut();
		window.location.href = '/'; // Refresh to clear state
	}

	let { children, data } = $props();
	let isSidebarOpen = $state(true);

	function toggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<!-- Sidebar (Only if logged in) -->
{#if data.session}
	<Sidebar chats={data.chats} isOpen={isSidebarOpen} {toggleSidebar} />
{/if}

<nav
	class="fixed top-0 right-0 left-0 z-30 flex items-center justify-between px-6 py-4 transition-all duration-300 md:px-12 {isSidebarOpen &&
	data.session
		? 'pl-72'
		: ''}"
>
	<a
		href="/"
		class="text-xl font-bold tracking-tighter text-[#0c1719] transition-opacity hover:opacity-80"
	>
		BullCheck
	</a>

	<div class="flex items-center gap-6 md:gap-8">
		{#if data.session}
			<div class="flex items-center gap-4">
				<span class="hidden text-sm font-medium text-zinc-600 md:inline-block">
					{data.session.user.name}
				</span>
				<button onclick={handleLogout} class="text-sm font-medium text-[#0c1719] hover:underline">
					Sign Out
				</button>
			</div>
		{:else}
			<a href="/login" class="text-sm font-medium text-[#0c1719] hover:underline">Sign In</a>
		{/if}

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
</nav>

<div class="pt-16 transition-all duration-300 {isSidebarOpen && data.session ? 'pl-64' : ''}">
	{@render children()}
</div>
