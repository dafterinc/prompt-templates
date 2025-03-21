<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { ThemeToggle } from '$lib/components/ui/theme-toggle';
	import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
	
	let user: User | null = null;
	
	onMount(() => {
		// Get initial auth state
		supabase.auth.getSession().then(({ data: sessionData }) => {
			user = sessionData?.session?.user || null;
		});
		
		// Listen for auth changes
		const { data: authListener } = supabase.auth.onAuthStateChange(
			(event: AuthChangeEvent, session: Session | null) => {
				user = session?.user || null;
			}
		);
		
		return () => {
			authListener?.subscription.unsubscribe();
		};
	});

	// Check if we're on the homepage
	$: isHomepage = $page.url.pathname === '/';
</script>

<div class="min-h-screen flex flex-col">
	<header class="py-4 px-6 border-b">
		<nav class="flex justify-between items-center max-w-7xl mx-auto">
			<a href="/" class="font-bold text-xl">Prompt Templates</a>
			
			<div class="flex items-center gap-4">
				<a href="/" class:font-bold={$page.url.pathname === '/'}>
					<Button variant="ghost" size="sm" class="hover:underline">Home</Button>
				</a>
				{#if user}
					<a href="/templates" class:font-bold={$page.url.pathname.startsWith('/templates')}>
						<Button variant="ghost" size="sm" class="hover:underline">My Templates</Button>
					</a>
					<Button 
						variant="ghost" 
						size="sm"
						on:click={() => supabase.auth.signOut()}
						class="hover:underline"
					>
						Sign Out
					</Button>
				{:else}
					<a href="/auth/login" class:font-bold={$page.url.pathname === '/auth/login'}>
						<Button variant="ghost" size="sm" class="hover:underline">Login</Button>
					</a>
					<a href="/auth/register" class:font-bold={$page.url.pathname === '/auth/register'}>
						<Button variant="ghost" size="sm" class="hover:underline">Register</Button>
					</a>
				{/if}
				<ThemeToggle />
			</div>
		</nav>
	</header>
	
	<main class="flex-1 {isHomepage ? '' : 'p-6'}">
		{#if isHomepage}
			<slot />
		{:else}
			<div class="max-w-7xl mx-auto">
				<slot />
			</div>
		{/if}
	</main>
	
	<footer class="py-4 px-6 border-t text-center text-sm text-muted-foreground">
		<div class="max-w-7xl mx-auto">
			<p>© {new Date().getFullYear()} Prompt Templates. All rights reserved.</p>
			<p class="mt-2">
				Made with ❤️ by <a href="https://dafterinc.com?utm_source=prompt_templates&utm_medium=footer&utm_campaign=product" class="font-medium underline underline-offset-4 hover:text-primary" target="_blank" rel="noopener noreferrer">Dafter</a>
			</p>
		</div>
	</footer>
</div>
