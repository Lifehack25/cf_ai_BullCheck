<script lang="ts">
	let visible = $state(true);

	const sections = [
		{
			title: 'Why BullCheck',
			body: "In an era where misinformation spreads faster than ever, access to reliable facts has become essential. BullCheck was created to tackle this challenge head-on by giving people a fast and transparent way to verify statistical claims using up-to-date data from trusted public databases. Whether you're fact-checking a statement you've seen online or simply trying to better understand the world around you, BullCheck makes credible statistics easy to find, verify, and understand."
		},
		{
			title: 'A Single Place For Evidence',
			body: "Our goal is simple: make high-quality statistical information accessible to everyone. BullCheck brings together data from reputable statistical agencies and presents it in a clear, neutral way, helping users move beyond speculation and toward evidence-based understanding. It's a single place where journalists, students, researchers, and curious minds alike can quickly ground discussions in real numbers."
		},
		{
			title: 'Clear Data, Not Softened Answers',
			body: "Many mainstream AI systems are designed with very strict safety filters around sensitive or controversial topics. While these safeguards serve important purposes, they can sometimes result in answers being limited, softened, or withheld entirely&mdash;even when the underlying information comes from publicly available statistics. BullCheck takes a different approach. We focus specifically on verifiable statistical data from trusted sources and present it as clearly and directly as possible. We don't sidestep uncomfortable questions&mdash;if reliable data exists, we show it. How that information is interpreted is ultimately up to the user."
		},
		{
			title: 'Always Current',
			body: 'Unlike general-purpose AI tools that rely on static training data and knowledge cut-off dates, BullCheck retrieves up-to-date statistics directly from relevant databases. This ensures answers are grounded in the most current available data rather than summaries that may already be outdated.'
		},
		{
			title: 'Committed To Open Facts',
			body: 'We believe open access to reliable statistics is fundamental to a well-informed society. BullCheck is committed to presenting factual data clearly, transparently, and without distortion&mdash;even when the numbers are complex or controversial. Our mission is not to tell people what to think, but to give them the evidence they need to think for themselves.'
		}
	];
</script>

<div
	class="relative min-h-screen overflow-hidden bg-[#FAFAFA] text-[#0c1719] selection:bg-zinc-200 selection:text-[#0c1719]"
>
	<!-- Background Elements -->
	<div class="pointer-events-none fixed inset-0 overflow-hidden">
		<div
			class="animate-float absolute -top-[10%] -right-[5%] h-[50vw] w-[50vw] rounded-full bg-zinc-100/60 mix-blend-multiply blur-[100px] filter"
		></div>
		<div
			class="animate-pulse-slow absolute top-[40%] -left-[10%] h-[40vw] w-[40vw] rounded-full bg-slate-50/60 mix-blend-multiply blur-[80px] filter"
		></div>
		<div
			class="animate-drift absolute bottom-[-20%] left-[30%] h-[45vw] w-[45vw] rounded-full bg-white/70 blur-[120px]"
		></div>
	</div>

	<div class="relative mx-auto max-w-5xl px-6 py-24 md:py-32">
		{#if visible}
			<!-- Header Section -->
			<header class="relative mb-20 text-center md:mb-28">
				<h1
					class="reveal mb-6 text-4xl font-semibold tracking-tight md:text-6xl"
					style="--delay: 0ms"
				>
					About BullCheck
				</h1>
				<p
					class="reveal mx-auto max-w-3xl text-lg leading-relaxed text-zinc-600 md:text-xl"
					style="--delay: 160ms"
				>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html sections[0].body}
				</p>
			</header>

			<section class="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
				<div class="lg:sticky lg:top-24">
					<div
						class="reveal rounded-3xl border border-white/60 bg-white/70 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur-xl"
						style="--delay: 260ms"
					>
						<p class="text-xs font-semibold tracking-[0.3em] text-zinc-400 uppercase">Manifesto</p>
						<h2 class="mt-4 text-2xl font-semibold text-[#0c1719] md:text-3xl">
							{sections[1].title}
						</h2>
						<p class="mt-4 text-base leading-relaxed text-zinc-600 md:text-lg">
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html sections[1].body}
						</p>
					</div>
				</div>

				<div class="space-y-6">
					{#each sections.slice(2) as section, i (section.title)}
						<article
							class="chapter-card group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white/80 p-8 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)]"
							style={`--delay: ${350 + i * 120}ms`}
						>
							<div
								class="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-white/60 to-zinc-50/70 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
							></div>
							<div class="relative">
								<div
									class="flex items-center gap-3 text-xs tracking-[0.3em] text-zinc-400 uppercase"
								>
									<span class="h-px w-8 bg-[#0c1719]/15"></span>
									<span>Chapter {String(i + 2).padStart(2, '0')}</span>
								</div>
								<h3 class="mt-4 text-xl font-semibold text-[#0c1719] md:text-2xl">
									{section.title}
								</h3>
								<p class="mt-4 text-base leading-relaxed text-zinc-600 md:text-lg">
									<!-- eslint-disable-next-line svelte/no-at-html-tags -->
									{@html section.body}
								</p>
							</div>
						</article>
					{/each}
				</div>
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

	.animate-drift {
		animation: drift 18s ease-in-out infinite;
	}

	.chapter-card {
		opacity: 0;
		transform: translateY(26px) scale(0.98);
		animation: chapter-reveal 800ms ease forwards;
		animation-delay: var(--delay, 0ms);
		will-change: transform, opacity;
	}

	@media (prefers-reduced-motion: reduce) {
		.reveal {
			animation: none;
			opacity: 1;
			transform: none;
		}

		.chapter-card {
			animation: none;
			opacity: 1;
			transform: none;
		}
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

	@keyframes drift {
		0%,
		100% {
			transform: translateY(0) scale(1);
		}
		50% {
			transform: translateY(-18px) scale(1.03);
		}
	}

	.reveal {
		opacity: 0;
		transform: translateY(22px);
		animation: reveal-up 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
		animation-delay: var(--delay, 0ms);
		will-change: transform, opacity;
	}

	@keyframes reveal-up {
		from {
			opacity: 0;
			transform: translateY(22px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes chapter-reveal {
		from {
			opacity: 0;
			transform: translateY(26px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>
