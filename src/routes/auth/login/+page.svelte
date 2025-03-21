<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	
	let email = '';
	let password = '';
	let confirmPassword = '';
	let loading = false;
	let error = '';
	let activeTab = ($page.url.searchParams.get('tab') || 'sign-in') as string;
	
	// Check for registered param
	$: if ($page.url.searchParams.get('registered') === 'true' && !error) {
		error = 'Registration successful! Please check your email to verify your account before logging in.';
	}
	
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
			
			// Update URL to show registered message
			activeTab = 'sign-in';
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
			<CardTitle class="text-center">Welcome to Prompt Templates</CardTitle>
			<CardDescription class="text-center">Manage and use your templates efficiently</CardDescription>
		</CardHeader>
		
		<CardContent>
			<Tabs value={activeTab === 'sign-up' ? 'sign-up' : 'sign-in'} onValueChange={(value) => activeTab = value} class="w-full">
				<TabsList class="grid w-full grid-cols-2">
					<TabsTrigger value="sign-in">Sign In</TabsTrigger>
					<TabsTrigger value="sign-up">Sign Up</TabsTrigger>
				</TabsList>
				
				{#if error}
					<Alert variant={error.includes('successful') ? 'default' : 'destructive'} class="mt-4 mb-2">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				{/if}
				
				<TabsContent value="sign-in" class="mt-4">
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
							{loading ? 'Signing in...' : 'Sign In'}
						</Button>
						
						<div class="text-center text-sm mt-2">
							<a href="/auth/forgot-password" class="text-primary hover:underline">Forgot password?</a>
						</div>
					</form>
				</TabsContent>
				
				<TabsContent value="sign-up" class="mt-4">
					<form on:submit|preventDefault={handleRegister} class="space-y-4">
						<div class="space-y-2">
							<Label for="register-email">Email</Label>
							<Input
								id="register-email"
								type="email"
								bind:value={email}
								required
								placeholder="your@email.com"
							/>
						</div>
						
						<div class="space-y-2">
							<Label for="register-password">Password</Label>
							<Input
								id="register-password"
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
							<Label for="confirm-password">Confirm Password</Label>
							<Input
								id="confirm-password"
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
							{loading ? 'Signing up...' : 'Sign Up'}
						</Button>
					</form>
				</TabsContent>
			</Tabs>
		</CardContent>
		
		<CardFooter>
			<p class="w-full text-center text-sm text-muted-foreground">
				By signing in/up, you agree to our Terms of Service and Privacy Policy
			</p>
		</CardFooter>
	</Card>
</div> 