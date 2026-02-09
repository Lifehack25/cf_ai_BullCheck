<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import scbLogo from '$lib/assets/scb-logo.svg';

	let visible = $state(false);

	onMount(() => {
		visible = true;
	});

	const scbSource = {
		name: 'SCB (Statistiska centralbyrån)',
		type: 'Administrative Agency',
		queries:
			'Population demographics, immigration/emigration flows, inflation (KPI), and unemployment figures.',
		trust:
			"One of the oldest and most rigorous statistical bureaus in the world, supplying data for Sweden's national policy.",
		link: 'https://www.scb.se/'
	};
</script>

<div
	class="relative min-h-screen overflow-hidden bg-[#FAFAFA] text-[#0c1719] selection:bg-zinc-200 selection:text-[#0c1719]"
>
	<!-- Background Elements -->
	<div class="pointer-events-none fixed inset-0 overflow-hidden">
		<div
			class="animate-float absolute top-[10%] left-[5%] h-[40vw] w-[40vw] rounded-full bg-zinc-100/60 mix-blend-multiply blur-[90px] filter"
		></div>
		<div
			class="animate-pulse-slow absolute right-[10%] bottom-[20%] h-[50vw] w-[50vw] rounded-full bg-slate-50/60 mix-blend-multiply blur-[110px] filter"
		></div>
	</div>

	<div class="relative mx-auto max-w-5xl px-6 py-24 md:py-32">
		{#if visible}
			<!-- Header -->
			<header class="mb-24 text-center">
				<h1
					in:fly={{ y: 30, duration: 1000, delay: 0 }}
					class="mb-6 text-4xl font-bold tracking-tight md:text-6xl"
				>
					Compromising on Opinions. <br />
					<span class="bg-gradient-to-r from-[#0c1719] to-zinc-500 bg-clip-text text-transparent">
						Never on Data.
					</span>
				</h1>
				<p
					in:fade={{ duration: 1000, delay: 300 }}
					class="mx-auto max-w-2xl text-lg leading-relaxed text-zinc-600 md:text-xl"
				>
					We verify every claim against the most rigorous statistical databases available.
				</p>
				<p
					in:fade={{ duration: 1000, delay: 500 }}
					class="mx-auto mt-6 max-w-2xl text-base font-medium text-[#0c1719]/70 md:text-lg"
				>
					Currently we are just connected to SCB as a source, we are looking to add more over time.
				</p>
			</header>

			<!-- Sources Lists -->
			<div class="mb-32">
				<section in:fly={{ y: 40, duration: 1000, delay: 400 }}>
					<div class="mb-10 border-b border-zinc-200 pb-4">
						<h2 class="mb-2 text-2xl font-bold tracking-wide text-[#0c1719] uppercase">
							Primary Source
						</h2>
						<p class="font-medium text-zinc-500">The database we currently trust and query.</p>
					</div>

					<div class="grid gap-6 md:grid-cols-2">
						<a
							href={scbSource.link}
							target="_blank"
							rel="noopener noreferrer"
							class="group block rounded-2xl border border-zinc-100 bg-white p-8 shadow-sm transition-all duration-300 hover:border-zinc-200 hover:shadow-md"
						>
							<div class="mb-6 flex items-center justify-between">
								<div>
									<h3
										class="text-xl font-semibold text-[#0c1719] transition-colors group-hover:text-[#307e4b]"
									>
										{scbSource.name}
									</h3>
									<p class="mt-1 text-sm font-medium text-zinc-400">{scbSource.type}</p>
								</div>
								<img src={scbLogo} alt="SCB logo" class="h-10 w-auto opacity-80" />
							</div>
							<div class="space-y-4">
								<div>
									<span class="text-xs font-bold tracking-wider text-zinc-400 uppercase"
										>What we query</span
									>
									<p class="text-zinc-600">{scbSource.queries}</p>
								</div>
								<div>
									<span class="text-xs font-bold tracking-wider text-zinc-400 uppercase"
										>Why we trust it</span
									>
									<p class="text-zinc-600 italic">{scbSource.trust}</p>
								</div>
							</div>
						</a>
					</div>
				</section>
			</div>

			<!-- Call to Action -->
			<section in:fade={{ duration: 1000, delay: 1200 }} class="mx-auto max-w-2xl text-center">
				<h2 class="mb-6 text-2xl font-bold">Is there a database we missed?</h2>
				<p class="mb-8 text-zinc-600">
					We are constantly expanding our reach. If you know of a trusted, high-quality statistical
					database that contains important public data, let us know.
				</p>
				<button
					class="rounded-full bg-[#307e4b] px-8 py-4 font-semibold text-white shadow-lg shadow-[#307e4b]/20 transition-all duration-300 hover:scale-105 hover:bg-[#26633b] active:scale-95"
				>
					Suggest a Source
				</button>
			</section>
		{/if}
	</div>
</div>

<style>
	.animate-float {
		animation: float 20s ease-in-out infinite;
	}

	.animate-pulse-slow {
		animation: pulse 15s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-20px);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.4;
		}
		50% {
			opacity: 0.6;
		}
	}
</style>
