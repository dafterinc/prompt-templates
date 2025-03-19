<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	
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
	<Card>
		<CardHeader>
			<CardTitle>Log In</CardTitle>
			<CardDescription>Enter your credentials to access your account</CardDescription>
		</CardHeader>
		
		<CardContent>
			{#if error}
				<Alert variant="destructive" class="mb-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			{/if}
			
			<form on:submit|preventDefault={handleLogin} class="space-y-4">
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
				
				<div class="space-y-2">
					<Label for="password">Password</Label>
					<Input
						id="password"
						type="password"
						bind:value={password}
						required
						placeholder="••••••••"
					/>
				</div>
				
				<Button
					type="submit"
					disabled={loading}
					class="w-full"
				>
					{loading ? 'Logging in...' : 'Log In'}
				</Button>
			</form>
		</CardContent>
		
		<CardFooter class="flex flex-col space-y-2">
			<div class="text-center text-sm">
				Don't have an account? <a href="/auth/register" class="text-primary hover:underline">Register</a>
			</div>
			<div class="text-center text-sm">
				<a href="/auth/forgot-password" class="text-primary hover:underline">Forgot password?</a>
			</div>
		</CardFooter>
	</Card>
</div> 