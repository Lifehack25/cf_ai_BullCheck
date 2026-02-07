<script lang="ts">
	import logo from '$lib/assets/logo.png';
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let visible = $state(false);
	let query = $state('');
	let loading = $state(false);

	onMount(() => {
		visible = true;
		// Check for ?q= from URL (if redirected)
		const q = $page.url.searchParams.get('q');
		if (q) query = q;
	});

	async function handleSearch() {
		if (!query.trim() || loading) return;
		loading = true;

		try {
			const res = await fetch('/api/chat/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: query })
			});

			if (res.ok) {
				const chat = (await res.json()) as { id: string };
				// Pass the initial message so the chat page can display/send it immediately
				goto(`/chat/${chat.id}?initialMessage=${encodeURIComponent(query)}`);
			} else {
				console.error('Failed to create chat');
				loading = false;
			}
		} catch (e) {
			console.error(e);
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && query.trim()) {
			handleSearch();
		}
	}
</script>

<div
	class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#FAFAFA] p-4 font-sans text-[#0c1719] selection:bg-zinc-200 selection:text-[#0c1719]"
>
	<!-- Dynamic Background Shapes -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div
			class="animate-pulse-slow absolute -top-[20%] -left-[10%] h-[70vw] w-[70vw] rounded-full bg-zinc-100/40 mix-blend-multiply blur-[120px]"
		></div>
		<div
			class="animate-float absolute top-[10%] -right-[10%] h-[60vw] w-[60vw] rounded-full bg-slate-100/40 mix-blend-multiply blur-[100px]"
		></div>
		<div
			class="absolute -bottom-[20%] left-[20%] h-[50vw] w-[50vw] rounded-full bg-zinc-50/60 mix-blend-multiply blur-[100px]"
		></div>
	</div>

	{#if visible}
		<div class="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
			<!-- Logo Section -->
			<div
				in:fly={{ y: -30, duration: 1200, delay: 0 }}
				class="relative transform transition-transform duration-700 ease-out hover:scale-105"
			>
				<div
					class="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50 blur-2xl"
				></div>
				<img src={logo} alt="BullCheck Logo" class="relative h-96 w-auto drop-shadow-xl" />
			</div>

			<!-- Mission Statement -->
			<div in:fly={{ y: 20, duration: 1000, delay: 400 }} class="relative z-10 -mt-10 space-y-4">
				<p
					class="md:2xl mx-auto max-w-lg text-xl leading-relaxed font-medium tracking-wide text-[#0c1719]/80"
				>
					Committed to the truth, the whole truth, and nothing but the truth.
				</p>
			</div>

			<!-- Interaction Area -->
			<div
				in:fly={{ y: 30, duration: 1000, delay: 700 }}
				class="group relative mt-12 w-full max-w-xl"
			>
				<!-- Detailed shadow/glow backing -->
				<div
					class="absolute -inset-1 rounded-2xl bg-gradient-to-r from-zinc-200 via-slate-100 to-zinc-200 opacity-40 blur-lg transition duration-700 group-focus-within:opacity-100 group-focus-within:blur-xl group-hover:opacity-70"
				></div>

				<div
					class="relative flex items-center rounded-2xl border border-white/50 bg-white/80 p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 group-focus-within:scale-[1.01] group-focus-within:shadow-[0_8px_40px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
				>
					<input
						bind:value={query}
						onkeydown={handleKeydown}
						type="text"
						placeholder="What stats would you like to know today?"
						class="w-full border-none bg-transparent px-2 py-3 text-lg font-medium text-[#0c1719] placeholder-zinc-400 outline-none focus:ring-0"
					/>

					<button
						onclick={handleSearch}
						disabled={loading}
						class="rounded-xl bg-[#307e4b] p-2 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-[#26633b] hover:shadow-[#307e4b]/30 active:scale-95 disabled:opacity-50"
						aria-label="Search"
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
								d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Minimal Footer -->
	<footer class="absolute bottom-6 w-full text-center">
		<p
			class="text-xs font-semibold tracking-widest text-zinc-400 uppercase opacity-60 transition-opacity hover:opacity-100"
		>
			Trusted Statistical Databases
		</p>
	</footer>

	<style>
		.animate-pulse-slow {
			animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
		}
		@keyframes pulse {
			0%,
			100% {
				opacity: 0.4;
				transform: scale(1);
			}
			50% {
				opacity: 0.6;
				transform: scale(1.05);
			}
		}
	</style>
</div>
