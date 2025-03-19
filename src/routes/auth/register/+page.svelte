<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	
	let email = '';
	let password = '';
	let confirmPassword = '';
	let loading = false;
	let error = '';
	
	async function handleRegister() {
		if (!email || !password) {
			error = 'Please enter both email and password';
			return;
		}
		
		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}
		
		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			return;
		}
		
		try {
			loading = true;
			error = '';
			
			const { error: signUpError } = await supabase.auth.signUp({
				email,
				password
			});
			
			if (signUpError) {
				error = signUpError.message;
				return;
			}
			
			// Redirect to login page with success message
			goto('/auth/login?registered=true');
		} catch (e: any) {
			error = e.message || 'An unexpected error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<div class="max-w-md mx-auto">
	<h1 class="text-2xl font-bold mb-6">Create an Account</h1>
	
	{#if error}
		<div class="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
			{error}
		</div>
	{/if}
	
	<form on:submit|preventDefault={handleRegister} class="space-y-4">
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
			<p class="text-xs text-muted-foreground mt-1">
				Password must be at least 6 characters
			</p>
		</div>
		
		<div>
			<label for="confirmPassword" class="block text-sm font-medium mb-1">Confirm Password</label>
			<input
				id="confirmPassword"
				type="password"
				bind:value={confirmPassword}
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
				{loading ? 'Registering...' : 'Register'}
			</button>
		</div>
		
		<div class="text-center text-sm">
			<p>
				Already have an account? <a href="/auth/login" class="text-primary hover:underline">Log In</a>
			</p>
		</div>
	</form>
</div> 