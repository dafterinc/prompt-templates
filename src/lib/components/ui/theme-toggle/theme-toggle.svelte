<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';

	// Theme state
	let theme: 'light' | 'dark' = 'light';

	// Initialize theme on mount
	onMount(() => {
		// Check if user has already set a theme preference
		const storedTheme = localStorage.getItem('theme');
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		
		// Set initial theme based on stored preference or system preference
		if (storedTheme) {
			theme = storedTheme as 'light' | 'dark';
		} else {
			theme = prefersDark ? 'dark' : 'light';
		}
		
		// Apply the current theme
		applyTheme(theme);
	});

	// Toggle theme function
	function toggleTheme() {
		theme = theme === 'light' ? 'dark' : 'light';
		localStorage.setItem('theme', theme);
		applyTheme(theme);
	}

	// Apply theme to document
	function applyTheme(mode: 'light' | 'dark') {
		if (mode === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}
</script>

<Button variant="ghost" size="icon" on:click={toggleTheme} aria-label="Toggle theme">
	{#if theme === 'light'}
		<!-- Moon icon for dark mode -->
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
	{:else}
		<!-- Sun icon for light mode -->
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
	{/if}
</Button> 