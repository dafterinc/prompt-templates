<script lang="ts">
	import { supabase } from '$lib/supabase';
	
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
	<h1 class="text-2xl font-bold mb-6">Reset Password</h1>
	
	{#if sent}
		<div class="bg-green-100 text-green-800 p-4 rounded-md mb-4">
			<p>Password reset instructions have been sent to your email.</p>
			<p class="mt-2">Please check your inbox and follow the link to reset your password.</p>
		</div>
		
		<div class="text-center mt-4">
			<a href="/auth/login" class="text-primary hover:underline">Return to Login</a>
		</div>
	{:else}
		{#if error}
			<div class="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
				{error}
			</div>
		{/if}
		
		<form on:submit|preventDefault={handleResetPassword} class="space-y-4">
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
				<p class="text-xs text-muted-foreground mt-1">
					Enter the email address associated with your account
				</p>
			</div>
			
			<div>
				<button
					type="submit"
					disabled={loading}
					class="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md disabled:opacity-70"
				>
					{loading ? 'Sending...' : 'Send Reset Instructions'}
				</button>
			</div>
			
			<div class="text-center text-sm">
				<p>
					<a href="/auth/login" class="text-primary hover:underline">Back to Login</a>
				</p>
			</div>
		</form>
	{/if}
</div> 