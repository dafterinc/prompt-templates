<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { goto, invalidate } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { ThemeToggle } from '$lib/components/ui/theme-toggle';
	import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '$lib/components/ui/dropdown-menu';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import * as Sheet from '$lib/components/ui/sheet';
	import Icon from '@iconify/svelte';
	import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
	import { Toaster } from 'svelte-sonner';
	
	export let data;
	
	let user: User | null = null;
	let isAdmin = false;
	let profileImageUrl: string | null = null;
	
	function closeMenu() {
		// The sheet will close automatically with Sheet.Root
	}
	
	interface UserProfile {
		is_admin: boolean;
		profile_image_url: string | null;
	}
	
	async function getProfileImage(userId: string) {
		if (!userId) return null;
		
		try {
			const { data, error } = await supabase
				.from('user_profiles')
				.select('profile_image_url')
				.eq('id', userId)
				.maybeSingle<UserProfile>();
				
			if (error) {
				console.error('[Client] Error fetching profile image:', error);
				return null;
			}
			
			return data?.profile_image_url ?? null;
		} catch (err) {
			console.error('[Client] Exception fetching profile image:', err);
			return null;
		}
	}
	
	onMount(() => {
		// Get initial auth state
		supabase.auth.getSession().then(async ({ data: sessionData }) => {
			user = sessionData?.session?.user || null;
			if (user) {
				profileImageUrl = await getProfileImage(user.id);
			}
		}).catch(err => {
			console.error('[Client] Session fetch error:', err);
			user = null;
		});
		
		// Listen for auth changes
		const { data: authListener } = supabase.auth.onAuthStateChange(
			async (event: AuthChangeEvent, session: Session | null) => {
				user = session?.user || null;
				if (user) {
					profileImageUrl = await getProfileImage(user.id);
					// Invalidate any data that depends on the session
					await invalidate('supabase:auth');
				} else {
					profileImageUrl = null;
				}
			}
		);
		
		return () => {
			authListener?.subscription.unsubscribe();
		};
	});

	// Get values from server-side data
	$: ({ isAdmin } = data);
	$: if (data) {
		console.log('[Client] Full server data:', data);
		console.log('[Client] Server-provided admin status:', isAdmin === true);
	}

	// Check if we're on the homepage
	$: isHomepage = $page.url.pathname === '/';
	
	// Get user initials for avatar
	$: userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : '';
</script>

<div class="min-h-screen flex flex-col">
	<Toaster richColors />
	
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
			
			<!-- Desktop navigation -->
			<div class="hidden md:flex items-center gap-4">
				<a href="/directory" class:font-bold={$page.url.pathname.startsWith('/directory')}>
					<Button variant="ghost" size="sm" class="hover:underline">Template Directory</Button>
				</a>
				
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
								{#if profileImageUrl}
									<AvatarImage src={profileImageUrl} alt={user.email || 'User'} />
								{/if}
								<AvatarFallback>{userInitials}</AvatarFallback>
							</Avatar>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuLabel>My Account</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{#if isAdmin}
								<DropdownMenuItem on:click={() => goto('/admin')}>
									Admin Dashboard
								</DropdownMenuItem>
							{/if}
							<DropdownMenuItem on:click={() => goto('/profile')}>
								Account Settings
							</DropdownMenuItem>
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
			
			<!-- Mobile navigation -->
			<div class="flex md:hidden items-center gap-2">
				<ThemeToggle />
				
				<Sheet.Root>
					<Sheet.Trigger asChild let:builder>
						<Button builders={[builder]} variant="ghost" size="icon">
							<Icon icon="heroicons:bars-3" width="24" height="24" />
							<span class="sr-only">Menu</span>
						</Button>
					</Sheet.Trigger>
					<Sheet.Content side="right">
						<Sheet.Header>
							<Sheet.Title>Menu</Sheet.Title>
							<Sheet.Description>
								Navigate through the application
							</Sheet.Description>
						</Sheet.Header>
						<div class="mt-6">
							<nav class="flex flex-col gap-4">
								<a 
									href="/directory" 
									class="px-4 py-2 hover:bg-muted rounded-md transition-colors {$page.url.pathname.startsWith('/directory') ? 'font-bold' : ''}"
								>
									Template Directory
								</a>
								
								{#if user}
									<a 
										href="/templates" 
										class="px-4 py-2 hover:bg-muted rounded-md transition-colors {$page.url.pathname.startsWith('/templates') ? 'font-bold' : ''}"
									>
										My Templates
									</a>
									
									{#if isAdmin}
										<a 
											href="/admin" 
											class="px-4 py-2 hover:bg-muted rounded-md transition-colors {$page.url.pathname.startsWith('/admin') ? 'font-bold' : ''}"
										>
											Admin Dashboard
										</a>
									{/if}
									
									<Button 
										variant="ghost" 
										class="justify-start px-4 py-2 hover:bg-muted rounded-md transition-colors"
										on:click={() => { closeMenu(); goto('/profile'); }}
									>
										Account Settings
									</Button>
									
									<Button
										variant="ghost"
										class="justify-start px-4 py-2 hover:bg-muted rounded-md transition-colors text-destructive"
										on:click={() => supabase.auth.signOut()}
									>
										Sign Out
									</Button>
								{:else}
									<a 
										href="/auth/login" 
										class="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
									>
										Sign In
									</a>
								{/if}
							</nav>
						</div>
					</Sheet.Content>
				</Sheet.Root>
			</div>
		</nav>
	</header>
	
	<main class="flex-1 {isHomepage ? '' : 'p-4 sm:p-6'}">
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
