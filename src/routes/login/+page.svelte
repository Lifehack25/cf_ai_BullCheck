<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import logo from '$lib/assets/logo.png';
	import { fade, fly } from 'svelte/transition';

	let email = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let loading = $state(false);

	async function handleLogin() {
		loading = true;
		error = null;

		try {
			const response = await authClient.signIn.email({
				email,
				password
			});

			const { error: err } = response;

			if (err) {
				error = err.message || 'Login failed';
				loading = false;
			} else {
				// Force a full page reload to ensure cookies are sent and server session is recognized
				window.location.href = '/';
			}
		} catch (e) {
			console.error('Unexpected error during login:', e);
			error = 'An unexpected error occurred';
			loading = false;
		}
	}
</script>

<div
	class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FAFAFA] text-[#0c1719]"
>
	<!-- Animated Background -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div
			class="animate-pulse-slow absolute -top-[30%] -left-[10%] h-[90vw] w-[90vw] rounded-full bg-zinc-100/60 mix-blend-multiply blur-[120px]"
		></div>
		<div
			class="animate-float absolute top-[20%] -right-[20%] h-[80vw] w-[80vw] rounded-full bg-slate-100/50 mix-blend-multiply blur-[120px]"
		></div>
	</div>

	<div class="relative z-10 w-full max-w-md p-6" in:fly={{ y: 20, duration: 1000 }}>
		<div class="mb-8 text-center">
			<img src={logo} alt="BullCheck" class="mx-auto h-24 w-auto drop-shadow-xl" />
			<h1 class="mt-6 text-3xl font-bold tracking-tighter text-[#0c1719]">Welcome Back</h1>
			<p class="mt-2 text-zinc-500">Sign in if you can handle the truth.</p>
		</div>

		<div
			class="group relative rounded-3xl border border-white/50 bg-white/60 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)]"
		>
			<div class="space-y-5">
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
					onclick={handleLogin}
					disabled={loading}
					class="w-full rounded-xl bg-[#0c1719] py-3.5 font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-black hover:shadow-xl disabled:opacity-70"
				>
					{#if loading}
						Thinking...
					{:else}
						Sign In
					{/if}
				</button>
			</div>

			<div class="mt-6 text-center text-sm">
				<span class="text-zinc-500">New around here?</span>
				<a href="/register" class="font-semibold text-[#307e4b] hover:underline"
					>Create an account</a
				>
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
