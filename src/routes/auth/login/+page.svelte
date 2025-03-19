<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	
	let email = '';
	let password = '';
	let loading = false;
	let error = '';
	
	async function handleLogin() {
		if (!email || !password) {
			error = 'Please enter both email and password';
			return;
		}
		
		try {
			loading = true;
			error = '';
			
			const { error: signInError } = await supabase.auth.signInWithPassword({
				email,
				password
			});
			
			if (signInError) {
				error = signInError.message;
				return;
			}
			
			// Redirect to templates page on success
			goto('/templates');
		} catch (e: any) {
			error = e.message || 'An unexpected error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<div class="max-w-md mx-auto">
	<h1 class="text-2xl font-bold mb-6">Log In</h1>
	
	{#if error}
		<div class="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
			{error}
		</div>
	{/if}
	
	<form on:submit|preventDefault={handleLogin} class="space-y-4">
		<div>
			<label for="email" class="block text-sm font-medium mb-1">Email</label>
			<input
				id="email"
				type="email"
				bind:value={email}
				required
				class="w-full p-2 border rounded-md"
				placeholder="your@email.com"
			/>
		</div>
		
		<div>
			<label for="password" class="block text-sm font-medium mb-1">Password</label>
			<input
				id="password"
				type="password"
				bind:value={password}
				required
				class="w-full p-2 border rounded-md"
				placeholder="••••••••"
			/>
		</div>
		
		<div>
			<button
				type="submit"
				disabled={loading}
				class="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md disabled:opacity-70"
			>
				{loading ? 'Logging in...' : 'Log In'}
			</button>
		</div>
		
		<div class="text-center text-sm">
			<p>
				Don't have an account? <a href="/auth/register" class="text-primary hover:underline">Register</a>
			</p>
			<p class="mt-2">
				<a href="/auth/forgot-password" class="text-primary hover:underline">Forgot password?</a>
			</p>
		</div>
	</form>
</div> 