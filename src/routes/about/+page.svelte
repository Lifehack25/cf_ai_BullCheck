<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';

	let visible = $state(false);

	onMount(() => {
		visible = true;
	});
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
	</div>

	<div class="relative mx-auto max-w-4xl px-6 py-24 md:py-32">
		{#if visible}
			<!-- Header Section -->
			<header class="mb-24 text-center">
				<h1
					in:fly={{ y: 30, duration: 1000, delay: 0 }}
					class="mb-6 text-4xl font-bold tracking-tight md:text-6xl"
				>
					Reality Doesn’t Take Sides. <br />
					<span class="bg-gradient-to-r from-[#0c1719] to-zinc-500 bg-clip-text text-transparent">
						Neither Do We.
					</span>
				</h1>
				<p
					in:fade={{ duration: 1000, delay: 300 }}
					class="mx-auto max-w-2xl text-lg leading-relaxed text-zinc-600 md:text-xl"
				>
					In an era of curated feeds and safety-filtered AI, finding the unvarnished truth has
					become a revolutionary act.
				</p>
			</header>

			<!-- Philosophy Section -->
			<section class="mb-32 grid items-center gap-12 md:grid-cols-2">
				<div in:fly={{ x: -30, duration: 1000, delay: 500 }}>
					<h2 class="mb-6 flex items-center text-2xl font-semibold md:text-3xl">
						<span class="mr-4 h-[2px] w-8 bg-[#0c1719]"></span>
						Our Philosophy
					</h2>
					<p class="mb-6 leading-relaxed text-zinc-600">
						Mainstream models are designed to be polite, often prioritizing political correctness
						over raw accuracy. They sanitize reality to protect you from the "ugly" parts of the
						world.
					</p>
					<p class="text-xl font-medium text-[#0c1719]">We believe you can handle the truth.</p>
				</div>
				<div
					in:fade={{ duration: 1200, delay: 700 }}
					class="relative flex h-full min-h-[300px] transform items-center justify-center rounded-2xl border border-zinc-100 bg-white p-8 shadow-sm transition-transform duration-500 hover:scale-[1.02]"
				>
					<div class="text-center">
						<p class="mb-4 font-serif text-3xl text-zinc-300 italic md:text-4xl">"</p>
						<p class="mb-4 text-lg font-medium text-[#0c1719] md:text-xl">
							Facts do not have feelings.<br />They do not have an agenda.<br />They simply are.
						</p>
					</div>
				</div>
			</section>

			<!-- Mission Section -->
			<section class="mb-32">
				<div class="mx-auto max-w-3xl text-center" in:fly={{ y: 30, duration: 1000, delay: 900 }}>
					<h2 class="mb-8 text-2xl font-semibold md:text-3xl">Our Mission</h2>
					<p class="mb-8 text-xl font-light text-[#0c1719] md:text-2xl">
						To democratize access to objective reality by providing unfiltered answers based solely
						on verifiable data.
					</p>
					<div class="mx-auto prose prose-lg text-zinc-600">
						<p class="mb-6">
							We strip away the editorializing, the "safety" filters, and the bias. When you ask a
							question, we query trusted statistical databases to give you the raw
							numbers—regardless of how uncomfortable, controversial, or "ugly" the answer might be.
						</p>
						<p class="font-medium text-[#0c1719]">
							We don't tell you how to feel about the data. We just make sure you have the right to
							see it.
						</p>
					</div>
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
