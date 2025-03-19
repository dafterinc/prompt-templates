<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	let password = '';
	let confirmPassword = '';
	let loading = false;
	let error = '';
	let success = false;
	
	onMount(() => {
		// Check if hash fragment exists in URL (this is set by Supabase)
		if (!window.location.hash) {
			error = 'Invalid or expired password reset link';
		}
	});
	
	async function handleResetPassword() {
		if (!password) {
			error = 'Please enter a new password';
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
			
			const { error: updateError } = await supabase.auth.updateUser({
				password
			});
			
			if (updateError) {
				error = updateError.message;
				return;
			}
			
			success = true;
			
			// Redirect to login after 3 seconds
			setTimeout(() => {
				goto('/auth/login');
			}, 3000);
		} catch (e: any) {
			error = e.message || 'An unexpected error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<div class="max-w-md mx-auto">
	<h1 class="text-2xl font-bold mb-6">Reset Your Password</h1>
	
	{#if success}
		<div class="bg-green-100 text-green-800 p-4 rounded-md mb-4">
			<p>Your password has been successfully reset!</p>
			<p class="mt-2">You will be redirected to the login page in a few seconds...</p>
		</div>
	{:else if error && error === 'Invalid or expired password reset link'}
		<div class="bg-destructive/10 text-destructive p-4 rounded-md">
			<p>{error}</p>
			<p class="mt-2">Please request a new password reset link.</p>
		</div>
		
		<div class="text-center mt-4">
			<a href="/auth/forgot-password" class="text-primary hover:underline">Request New Link</a>
		</div>
	{:else}
		{#if error}
			<div class="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
				{error}
			</div>
		{/if}
		
		<form on:submit|preventDefault={handleResetPassword} class="space-y-4">
			<div>
				<label for="password" class="block text-sm font-medium mb-1">New Password</label>
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
				<label for="confirmPassword" class="block text-sm font-medium mb-1">Confirm New Password</label>
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
					{loading ? 'Updating...' : 'Update Password'}
				</button>
			</div>
		</form>
	{/if}
</div> 