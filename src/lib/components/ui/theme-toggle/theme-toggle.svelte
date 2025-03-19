<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';

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

<Button variant="ghost" size="icon" on:click={toggleTheme} aria-label="Toggle theme" class="relative">
	{#if theme === 'light'}
		<!-- Moon icon for dark mode -->
		<Icon icon="mdi:moon-waning-crescent" width="20" height="20" />
	{:else}
		<!-- Sun icon for light mode -->
		<Icon icon="mdi:white-balance-sunny" width="20" height="20" />
	{/if}
</Button> 