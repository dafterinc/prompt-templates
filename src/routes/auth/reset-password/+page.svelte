<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	
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
	<Card>
		<CardHeader>
			<CardTitle>Reset Your Password</CardTitle>
			<CardDescription>Create a new password for your account</CardDescription>
		</CardHeader>
		
		<CardContent>
			{#if success}
				<Alert variant="default" class="bg-green-100 text-green-800">
					<AlertDescription>
						<p>Your password has been successfully reset!</p>
						<p class="mt-2">You will be redirected to the login page in a few seconds...</p>
					</AlertDescription>
				</Alert>
			{:else if error && error === 'Invalid or expired password reset link'}
				<Alert variant="destructive">
					<AlertDescription>
						<p>{error}</p>
						<p class="mt-2">Please request a new password reset link.</p>
					</AlertDescription>
				</Alert>
				
				<div class="text-center mt-4">
					<a href="/auth/forgot-password">
						<Button variant="outline">Request New Link</Button>
					</a>
				</div>
			{:else}
				{#if error}
					<Alert variant="destructive" class="mb-4">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				{/if}
				
				<form on:submit|preventDefault={handleResetPassword} class="space-y-4">
					<div class="space-y-2">
						<Label for="password">New Password</Label>
						<Input
							id="password"
							type="password"
							bind:value={password}
							required
							placeholder="••••••••"
						/>
						<p class="text-xs text-muted-foreground">
							Password must be at least 6 characters
						</p>
					</div>
					
					<div class="space-y-2">
						<Label for="confirmPassword">Confirm New Password</Label>
						<Input
							id="confirmPassword"
							type="password"
							bind:value={confirmPassword}
							required
							placeholder="••••••••"
						/>
					</div>
					
					<Button
						type="submit"
						disabled={loading}
						class="w-full"
					>
						{loading ? 'Updating...' : 'Update Password'}
					</Button>
				</form>
			{/if}
		</CardContent>
	</Card>
</div> 