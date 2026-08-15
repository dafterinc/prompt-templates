<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import Check from 'svelte-radix/Check.svelte';
	import Icon from '@iconify/svelte';
	import * as Drawer from '$lib/components/ui/drawer';
	import type { PageData } from './$types';

	export let data: PageData;

	$: allTemplates = data.templates;
	$: baseCategories = data.categories;
	$: isAuthenticated = data.isAuthenticated;

	let searchTerm = '';
	let selectedCategoryIds: Set<string> = new Set();
	let drawerOpen = false;

	function matches(t: (typeof allTemplates)[number], term: string, catIds: Set<string>) {
		const matchSearch = term
			? t.title.toLowerCase().includes(term.toLowerCase()) ||
				(t.description ? t.description.toLowerCase().includes(term.toLowerCase()) : false)
			: true;
		const matchCat = catIds.size > 0 ? !!t.category_id && catIds.has(t.category_id) : true;
		return matchSearch && matchCat;
	}

	$: templates = allTemplates.filter((t) => matches(t, searchTerm, selectedCategoryIds));
	$: categories = baseCategories.map((c) => ({
		id: c.id,
		name: c.name,
		count: templates.filter((t) => t.category_id === c.id).length,
		checked: selectedCategoryIds.has(c.id)
	}));

	function toggleCategoryFilter(id: string) {
		const next = new Set(selectedCategoryIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedCategoryIds = next;
	}

	function clearFilters() {
		searchTerm = '';
		selectedCategoryIds = new Set();
	}

	function closeDrawer() {
		drawerOpen = false;
	}
</script>

<svelte:head>
	<title>Template Directory | Prompt Templates</title>
</svelte:head>

<div>
	<div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
		<h1 class="text-2xl sm:text-3xl font-bold tracking-tight">Template Directory</h1>
		<div class="flex items-center gap-2">
			{#if isAuthenticated}
				<Button size="sm" on:click={() => goto('/templates')} class="w-full sm:w-auto">My Templates</Button>
			{:else}
				<Button size="sm" on:click={() => goto('/auth/login')} class="w-full sm:w-auto">Sign In</Button>
			{/if}
		</div>
	</div>

	<div class="md:hidden mb-4">
		<Button variant="outline" size="sm" class="w-full" on:click={() => (drawerOpen = true)}>
			<Icon icon="heroicons:funnel" class="h-4 w-4 mr-2" />
			Search & Filter
		</Button>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
		<div class="hidden md:block space-y-4">
			<Card>
				<CardHeader class="pb-3">
					<CardTitle class="text-lg sm:text-xl">Filter Templates</CardTitle>
				</CardHeader>
				<CardContent class="space-y-2 p-4 sm:p-6">
					<div class="relative mb-4">
						<Icon icon="heroicons:magnifying-glass" class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input type="search" bind:value={searchTerm} placeholder="Search templates..." class="pl-10" />
					</div>

					<div class="space-y-2 max-h-[400px] overflow-y-auto">
						<h3 class="font-medium text-sm">Categories</h3>
						{#if categories.length > 0}
							<ul class="space-y-1">
								{#each categories as category (category.id)}
									<li>
										<button
											class="flex items-center w-full px-2 py-1.5 text-sm rounded-md hover:bg-muted/50 transition-colors {category.checked ? 'bg-muted' : ''}"
											on:click={() => toggleCategoryFilter(category.id)}
										>
											<div class="w-5 h-5 mr-2 flex items-center justify-center border rounded-sm {category.checked ? 'bg-primary border-primary' : 'border-muted-foreground/30'}">
												{#if category.checked}
													<Check class="h-3.5 w-3.5 text-primary-foreground" />
												{/if}
											</div>
											<span class="flex-1 text-left truncate">{category.name}</span>
											<span class="text-xs text-muted-foreground ml-1">({category.count})</span>
										</button>
									</li>
								{/each}
							</ul>
						{:else}
							<p class="text-sm text-muted-foreground">No categories available</p>
						{/if}
					</div>

					{#if searchTerm || selectedCategoryIds.size > 0}
						<div class="pt-2 border-t mt-4">
							<div class="flex justify-between items-center">
								<span class="text-sm">Active filters: {selectedCategoryIds.size + (searchTerm ? 1 : 0)}</span>
								<Button variant="ghost" on:click={clearFilters} size="sm" class="h-7 px-2 text-xs">Clear all</Button>
							</div>
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>

		<div class="md:col-span-3 space-y-4">
			{#if templates.length === 0}
				<div class="w-full p-6 sm:p-8 text-center border rounded-lg">
					<div class="text-muted-foreground">
						{searchTerm || selectedCategoryIds.size > 0
							? 'No templates found matching your filters.'
							: 'No templates are available in the directory yet.'}
					</div>
					{#if searchTerm || selectedCategoryIds.size > 0}
						<Button variant="outline" class="mt-4 w-full sm:w-auto" on:click={clearFilters}>Clear Filters</Button>
					{/if}
				</div>
			{:else}
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
					{#each templates as template (template.id)}
						<Card class="hover:shadow-md transition-shadow duration-200">
							<a href={`/directory/${template.id}`} class="block">
								<CardHeader class="mb-2">
									{#if template.featured}
										<div class="flex mb-1">
											<span class="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Featured</span>
										</div>
									{/if}
									<CardTitle class="truncate">{template.title}</CardTitle>
									{#if template.description}
										<CardDescription class="line-clamp-2">{template.description}</CardDescription>
									{:else}
										<CardDescription class="italic">No description</CardDescription>
									{/if}
								</CardHeader>
								<CardFooter>
									{#if template.category_name}
										<Badge variant="secondary">{template.category_name}</Badge>
									{/if}
								</CardFooter>
							</a>
						</Card>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Mobile Drawer -->
<Drawer.Root bind:open={drawerOpen}>
	<Drawer.Portal>
		<Drawer.Overlay class="fixed inset-0 bg-black/40" />
		<Drawer.Content class="bg-background p-4 rounded-t-[10px] mt-24 fixed bottom-0 left-0 right-0 max-h-[85vh] flex flex-col">
			<div class="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-4"></div>
			<div class="max-w-md mx-auto w-full">
				<Drawer.Title class="font-medium mb-4 text-lg">Search & Filter</Drawer.Title>

				<div class="relative mb-4">
					<Icon icon="heroicons:magnifying-glass" class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input type="search" bind:value={searchTerm} placeholder="Search templates..." class="pl-10" />
				</div>

				<div class="mb-4">
					<h3 class="font-medium text-sm mb-2">Categories</h3>
					{#if categories.length > 0}
						<ul class="space-y-1 max-h-[40vh] overflow-y-auto">
							{#each categories as category (category.id)}
								<li>
									<button
										class="flex items-center w-full px-2 py-1.5 text-sm rounded-md hover:bg-muted/50 transition-colors {category.checked ? 'bg-muted' : ''}"
										on:click={() => toggleCategoryFilter(category.id)}
									>
										<div class="w-5 h-5 mr-2 flex items-center justify-center border rounded-sm {category.checked ? 'bg-primary border-primary' : 'border-muted-foreground/30'}">
											{#if category.checked}
												<Check class="h-3.5 w-3.5 text-primary-foreground" />
											{/if}
										</div>
										<span class="flex-1 text-left truncate">{category.name}</span>
										<span class="text-xs text-muted-foreground ml-1">({category.count})</span>
									</button>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-sm text-muted-foreground">No categories available</p>
					{/if}
				</div>

				<div class="mt-6 flex gap-2">
					<Button variant="outline" class="w-full" on:click={() => closeDrawer()}>Close</Button>
					<Button class="w-full" on:click={() => closeDrawer()}>Apply Filters</Button>
				</div>
			</div>
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>
