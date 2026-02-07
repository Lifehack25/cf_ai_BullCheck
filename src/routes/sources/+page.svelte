<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';

	let visible = $state(false);

	onMount(() => {
		visible = true;
	});

	const categories = [
		{
			title: 'CRIME & JUSTICE',
			description: 'Where we verify safety, violence, and legal statistics.',
			sources: [
				{
					name: 'Brå (Brottsförebyggande rådet)',
					type: 'National Government Agency',
					queries:
						'Reported crimes, lethal violence statistics, conviction rates, and the National Security Survey (NTU).',
					trust:
						'Brå is the official authority for judicial statistics in Sweden, operating under the Ministry of Justice.',
					link: 'https://bra.se/'
				},
				{
					name: 'Kriminalvården (Swedish Prison and Probation Service)',
					type: 'Government Agency',
					queries: 'Incarceration numbers, prison capacity, and recidivism rates.',
					trust: '',
					link: 'https://www.kriminalvarden.se/'
				}
			]
		},
		{
			title: 'ECONOMY & DEMOGRAPHICS',
			description: 'Where we verify inflation, population changes, and employment.',
			sources: [
				{
					name: 'SCB (Statistiska centralbyrån)',
					type: 'Administrative Agency',
					queries:
						'Population demographics, immigration/emigration flows, inflation (KPI), and unemployment figures.',
					trust:
						"One of the oldest and most rigorous statistical bureaus in the world, supplying data for Sweden's national policy.",
					link: 'https://www.scb.se/'
				}
			]
		},
		{
			title: 'SOCIETY & WELFARE',
			description: 'Where we verify integration, health, and government spending.',
			sources: [
				{
					name: 'Socialstyrelsen (National Board of Health and Welfare)',
					type: 'Government Agency',
					queries:
						'Cause of death registry, social assistance (bidrag) dependency, and public health wait times.',
					trust: '',
					link: 'https://www.socialstyrelsen.se/'
				},
				{
					name: 'Migrationsverket (Migration Agency)',
					type: 'Government Agency',
					queries: 'Asylum applications, residence permits, and deportation statistics.',
					trust: '',
					link: 'https://www.migrationsverket.se/'
				}
			]
		}
	];
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
			</header>

			<!-- Sources Lists -->
			<div class="mb-32 space-y-24">
				{#each categories as category, i (category.title)}
					<section in:fly={{ y: 40, duration: 1000, delay: 400 + i * 200 }}>
						<div class="mb-10 border-b border-zinc-200 pb-4">
							<h2 class="mb-2 text-2xl font-bold tracking-wide text-[#0c1719] uppercase">
								{category.title}
							</h2>
							<p class="font-medium text-zinc-500">{category.description}</p>
						</div>

						<div class="grid gap-6 md:grid-cols-2">
							{#each category.sources as source (source.name)}
								<a
									href={source.link}
									target="_blank"
									rel="noopener noreferrer"
									class="group block rounded-xl border border-zinc-100 bg-white p-8 shadow-sm transition-all duration-300 hover:border-zinc-200 hover:shadow-md"
								>
									<div class="mb-4 flex items-start justify-between">
										<h3
											class="text-xl font-semibold text-[#0c1719] transition-colors group-hover:text-[#307e4b]"
										>
											{source.name}
										</h3>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke-width="2"
											stroke="currentColor"
											class="h-5 w-5 text-zinc-300 transition-colors group-hover:text-[#307e4b]"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
											/>
										</svg>
									</div>
									<div class="space-y-4">
										<div>
											<span class="text-xs font-bold tracking-wider text-zinc-400 uppercase"
												>Type</span
											>
											<p class="text-zinc-700">{source.type}</p>
										</div>
										<div>
											<span class="text-xs font-bold tracking-wider text-zinc-400 uppercase"
												>What we query</span
											>
											<p class="text-zinc-600">{source.queries}</p>
										</div>
										{#if source.trust}
											<div>
												<span class="text-xs font-bold tracking-wider text-zinc-400 uppercase"
													>Why we trust it</span
												>
												<p class="text-zinc-600 italic">{source.trust}</p>
											</div>
										{/if}
									</div>
								</a>
							{/each}
						</div>
					</section>
				{/each}
			</div>

			<!-- Methodology Section -->
			<section
				in:fly={{ y: 30, duration: 1000, delay: 1000 }}
				class="relative mb-24 overflow-hidden rounded-3xl bg-[#0c1719] p-10 text-white md:p-16"
			>
				<div
					class="abslute pointer-events-none top-0 right-0 h-64 w-64 rounded-full bg-[#307e4b] opacity-10 blur-[80px]"
				></div>

				<h2 class="mb-10 text-center text-3xl font-bold">Our Data Methodology</h2>

				<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
					<div>
						<h3 class="mb-3 text-lg font-bold text-zinc-100">Direct Connection</h3>
						<p class="text-sm leading-relaxed text-zinc-400">
							Whenever possible, we use APIs to fetch live data directly from these databases.
						</p>
					</div>
					<div>
						<h3 class="mb-3 text-lg font-bold text-zinc-100">No Smoothing</h3>
						<p class="text-sm leading-relaxed text-zinc-400">
							We do not remove outliers or "smooth" curves. If the graph spikes, we show the spike.
						</p>
					</div>
					<div>
						<h3 class="mb-3 text-lg font-bold text-zinc-100">Updates</h3>
						<p class="text-sm leading-relaxed text-zinc-400">
							Our system checks for updates on a daily basis to ensure you aren't seeing last year's
							reality.
						</p>
					</div>
					<div>
						<h3 class="mb-3 text-lg font-bold text-zinc-100">Citations</h3>
						<p class="text-sm leading-relaxed text-zinc-400">
							Every answer generated by BullCheck includes a direct footnote back to the specific
							table.
						</p>
					</div>
				</div>
			</section>

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
