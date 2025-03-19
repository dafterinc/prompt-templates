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
	<Card>
		<CardHeader>
			<CardTitle>Create an Account</CardTitle>
			<CardDescription>Enter your details to create a new account</CardDescription>
		</CardHeader>
		
		<CardContent>
			{#if error}
				<Alert variant="destructive" class="mb-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			{/if}
			
			<form on:submit|preventDefault={handleRegister} class="space-y-4">
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
					<p class="text-xs text-muted-foreground">
						Password must be at least 6 characters
					</p>
				</div>
				
				<div class="space-y-2">
					<Label for="confirmPassword">Confirm Password</Label>
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
					{loading ? 'Registering...' : 'Register'}
				</Button>
			</form>
		</CardContent>
		
		<CardFooter class="flex justify-center">
			<div class="text-center text-sm">
				Already have an account? <a href="/auth/login" class="text-primary hover:underline">Log In</a>
			</div>
		</CardFooter>
	</Card>
</div> 