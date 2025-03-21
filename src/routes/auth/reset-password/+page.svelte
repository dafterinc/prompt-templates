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
	
	onMount(async () => {
		// Check if we have a session already
		const { data } = await supabase.auth.getSession();
		if (!data.session) {
			error = 'Invalid or expired reset token. Please request a new password reset link.';
		}
	});
	
	async function handleResetPassword() {
		if (!password || !confirmPassword) {
			error = 'Please enter and confirm your new password';
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
			
			// Redirect after a short delay
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
			<CardTitle class="text-center">Reset Your Password</CardTitle>
			<CardDescription class="text-center">
				Enter a new password for your account
			</CardDescription>
		</CardHeader>
		
		<CardContent>
			{#if error}
				<Alert variant="destructive" class="mb-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			{/if}
			
			{#if success}
				<Alert class="mb-4">
					<AlertDescription>
						Your password has been successfully reset! You'll be redirected to the login page shortly.
					</AlertDescription>
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
						disabled={success || error.includes('Invalid or expired')}
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
						disabled={success || error.includes('Invalid or expired')}
					/>
				</div>
				
				<Button
					type="submit"
					disabled={loading || success || error.includes('Invalid or expired')}
					class="w-full"
				>
					{loading ? 'Resetting...' : 'Reset Password'}
				</Button>
			</form>
		</CardContent>
		
		<CardFooter class="flex justify-center">
			<div class="text-center text-sm">
				Remember your password? <a href="/auth/login" class="text-primary hover:underline">Sign In</a>
			</div>
		</CardFooter>
	</Card>
</div> 