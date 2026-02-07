<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import logo from '$lib/assets/logo.png';
	import { fade, fly } from 'svelte/transition';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let loading = $state(false);

	async function handleRegister() {
		loading = true;
		error = null;
		const { error: err } = await authClient.signUp.email({
			email,
			password,
			name
		});

		if (err) {
			error = err.message || 'Registration failed';
			loading = false;
		} else {
			goto('/');
		}
	}
</script>

<div
	class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FAFAFA] text-[#0c1719]"
>
	<!-- Animated Background -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div
			class="animate-pulse-slow absolute top-[10%] left-[20%] h-[70vw] w-[70vw] rounded-full bg-zinc-100/60 mix-blend-multiply blur-[100px]"
		></div>
		<div
			class="animate-float absolute -right-[10%] bottom-[10%] h-[60vw] w-[60vw] rounded-full bg-[#307e4b]/5 mix-blend-multiply blur-[120px]"
		></div>
	</div>

	<div class="relative z-10 w-full max-w-md p-6" in:fly={{ y: 20, duration: 1000 }}>
		<div class="mb-8 text-center">
			<img src={logo} alt="BullCheck" class="mx-auto h-20 w-auto drop-shadow-xl" />
			<h1 class="mt-6 text-3xl font-bold tracking-tighter text-[#0c1719]">Join BullCheck</h1>
			<p class="mt-2 text-zinc-500">Start verifying facts with precision.</p>
		</div>

		<div
			class="group relative rounded-3xl border border-white/50 bg-white/60 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)]"
		>
			<div class="space-y-5">
				<div>
					<label for="name" class="mb-1 block text-sm font-medium text-zinc-600">Full Name</label>
					<input
						id="name"
						type="text"
						bind:value={name}
						class="w-full rounded-xl border-zinc-200 bg-white/80 px-4 py-3 text-[#0c1719] placeholder-zinc-400 shadow-sm transition-all focus:border-[#307e4b] focus:ring-[#307e4b]/20"
						placeholder="Jane Doe"
					/>
				</div>

				<div>
					<label for="email" class="mb-1 block text-sm font-medium text-zinc-600">Email</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						class="w-full rounded-xl border-zinc-200 bg-white/80 px-4 py-3 text-[#0c1719] placeholder-zinc-400 shadow-sm transition-all focus:border-[#307e4b] focus:ring-[#307e4b]/20"
						placeholder="researcher@institute.com"
					/>
				</div>

				<div>
					<label for="password" class="mb-1 block text-sm font-medium text-zinc-600">Password</label
					>
					<input
						id="password"
						type="password"
						bind:value={password}
						class="w-full rounded-xl border-zinc-200 bg-white/80 px-4 py-3 text-[#0c1719] placeholder-zinc-400 shadow-sm transition-all focus:border-[#307e4b] focus:ring-[#307e4b]/20"
						placeholder="••••••••"
					/>
				</div>

				{#if error}
					<div class="rounded-lg bg-red-50 p-3 text-sm text-red-600" in:fade>
						{error}
					</div>
				{/if}

				<button
					onclick={handleRegister}
					disabled={loading}
					class="w-full rounded-xl bg-[#0c1719] py-3.5 font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-black hover:shadow-xl disabled:opacity-70"
				>
					{#if loading}
						Creating Account...
					{:else}
						Sign Up
					{/if}
				</button>
			</div>

			<div class="mt-6 text-center text-sm">
				<span class="text-zinc-500">Already a member?</span>
				<a href="/login" class="font-semibold text-[#307e4b] hover:underline">Sign in</a>
			</div>
		</div>
	</div>

	<style>
		.animate-pulse-slow {
			animation: pulse 10s cubic-bezier(0.4, 0, 0.6, 1) infinite;
		}
		@keyframes pulse {
			0%,
			100% {
				opacity: 0.5;
				transform: scale(1);
			}
			50% {
				opacity: 0.8;
				transform: scale(1.05);
			}
		}
	</style>
</div>
