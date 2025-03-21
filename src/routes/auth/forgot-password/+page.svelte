<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	
	let email = '';
	let loading = false;
	let error = '';
	let success = false;
	
	async function handleResetPassword() {
		if (!email) {
			error = 'Please enter your email address';
			return;
		}
		
		try {
			loading = true;
			error = '';
			success = false;
			
			const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: `${window.location.origin}/auth/reset-password`
			});
			
			if (resetError) {
				error = resetError.message;
				return;
			}
			
			success = true;
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
			<CardTitle class="text-center">Reset Password</CardTitle>
			<CardDescription class="text-center">
				Enter your email address and we'll send you a link to reset your password
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
						Password reset link sent! Please check your email for further instructions.
					</AlertDescription>
				</Alert>
			{/if}
			
			<form on:submit|preventDefault={handleResetPassword} class="space-y-4">
				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						type="email"
						bind:value={email}
						required
						placeholder="your@email.com"
					/>
				</div>
				
				<Button
					type="submit"
					disabled={loading}
					class="w-full"
				>
					{loading ? 'Sending...' : 'Send Reset Link'}
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