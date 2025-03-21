<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { ThemeToggle } from '$lib/components/ui/theme-toggle';
	import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '$lib/components/ui/dropdown-menu';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
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
	
	// Get user initials for avatar
	$: userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : '';
</script>

<div class="min-h-screen flex flex-col">
	<header class="py-4 px-6 border-b">
		<nav class="flex justify-between items-center max-w-7xl mx-auto">
			<a href="/" class="flex items-center gap-2">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
					<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
					<polyline points="14 2 14 8 20 8"></polyline>
					<path d="M8 13h2"></path>
					<path d="M8 17h2"></path>
					<path d="M14 13h2"></path>
					<path d="M14 17h2"></path>
				</svg>
				<span class="font-mono font-bold text-xl">Prompt Templates</span>
			</a>
			
			<div class="flex items-center gap-4">
				{#if user}
					{#if isHomepage}
						<a href="/templates">
							<Button variant="default" size="sm">My Templates</Button>
						</a>
					{:else}
						<a href="/templates" class:font-bold={$page.url.pathname.startsWith('/templates')}>
							<Button variant="ghost" size="sm" class="hover:underline">My Templates</Button>
						</a>
					{/if}
					
					<DropdownMenu>
						<DropdownMenuTrigger>
							<Avatar>
								<AvatarFallback>{userInitials}</AvatarFallback>
							</Avatar>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuLabel>My Account</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem>Profile</DropdownMenuItem>
							<DropdownMenuItem>Settings</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem on:click={() => supabase.auth.signOut()}>
								Sign Out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				{:else}
					<a href="/auth/login">
						<Button variant="default" size="sm">Sign In</Button>
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
