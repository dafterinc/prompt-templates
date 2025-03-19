<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	
	let email = '';
	let loading = false;
	let sent = false;
	let error = '';
	
	async function handleResetPassword() {
		if (!email) {
			error = 'Please enter your email address';
			return;
		}
		
		try {
			loading = true;
			error = '';
			
			const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: `${window.location.origin}/auth/reset-password`
			});
			
			if (resetError) {
				error = resetError.message;
				return;
			}
			
			sent = true;
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
			<CardTitle>Reset Password</CardTitle>
			<CardDescription>Enter your email to receive password reset instructions</CardDescription>
		</CardHeader>
		
		<CardContent>
			{#if sent}
				<Alert variant="default" class="bg-green-100 text-green-800 mb-4">
					<AlertDescription>
						<p>Password reset instructions have been sent to your email.</p>
						<p class="mt-2">Please check your inbox and follow the link to reset your password.</p>
					</AlertDescription>
				</Alert>
				
				<div class="text-center mt-4">
					<a href="/auth/login">
						<Button variant="outline">Return to Login</Button>
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
						<Label for="email">Email</Label>
						<Input
							id="email"
							type="email"
							bind:value={email}
							required
							placeholder="your@email.com"
						/>
						<p class="text-xs text-muted-foreground">
							Enter the email address associated with your account
						</p>
					</div>
					
					<Button
						type="submit"
						disabled={loading}
						class="w-full"
					>
						{loading ? 'Sending...' : 'Send Reset Instructions'}
					</Button>
				</form>
			{/if}
		</CardContent>
		
		{#if !sent}
			<CardFooter class="flex justify-center">
				<a href="/auth/login" class="text-primary hover:underline">Back to Login</a>
			</CardFooter>
		{/if}
	</Card>
</div> 