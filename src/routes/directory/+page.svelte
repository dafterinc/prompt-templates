<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { getErrorMessage } from '$lib/utils';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import Check from 'svelte-radix/Check.svelte';
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
	import * as Drawer from '$lib/components/ui/drawer';
	import { logger } from '$lib/utils/logger';

	interface Template {
		id: string;
		title: string;
		description: string | null;
		content: string;
		created_at: string;
		updated_at: string;
		category_id: string | null;
		categories?: { name: string };
		directory_categories?: { name: string };
		variables_count?: number | null;
		category_name?: string;
		featured?: boolean;
	}

	interface Category {
		id: string;
		name: string;
		count?: number;
		checked?: boolean;
	}

	let templates: Template[] = [];
	let allTemplates: Template[] = [];
	let categories: Category[] = [];
	let loading = true;
	let error = '';
	let isAuthenticated = false;

	// For filtering
	let searchTerm = '';
	let selectedCategoryIds: Set<string> = new Set();
	let drawerOpen = false;

	onMount(() => {
		loadTemplates();
	});

	async function loadTemplates() {
		try {
			// Check if user is authenticated
			const {
				data: { session }
			} = await supabase.auth.getSession();
			isAuthenticated = !!session;
			await Promise.all([fetchTemplates(), fetchCategories()]);
		} catch (e) {
			error = getErrorMessage(e, 'Failed to load templates');
		} finally {
			loading = false;
		}
	}

	async function fetchTemplates() {
		// For directory templates, we only fetch templates marked as public/directory
		const { data, error: fetchError } = await supabase
			.from('directory_templates')
			.select(
				`
				*,
				directory_categories(name)
			`
			)
			.order('featured', { ascending: false })
			.order('updated_at', { ascending: false });

		if (fetchError) {
			error = fetchError.message;
			return;
		}

		// Also fetch variable count for each template
		if (data) {
			allTemplates = await Promise.all(
				data.map(async (template: Template) => {
					const { count } = await supabase
						.from('directory_variables')
						.select('id', { count: 'exact', head: true })
						.eq('template_id', template.id);

					return {
						...template,
						category_name: template.directory_categories?.name,
						variables_count: count
					};
				})
			);

			templates = [...allTemplates];
		}
	}

	async function fetchCategories() {
		const { data, error: fetchError } = await supabase
			.from('directory_categories')
			.select('*')
			.order('name');

		if (fetchError) {
			logger.error('Error fetching categories:', fetchError, 'directory');
			return;
		}

		if (data) {
			categories = data.map((cat) => ({
				...cat,
				checked: false,
				count: 0
			}));

			// Count templates in each category
			if (allTemplates.length > 0) {
				categories = categories.map((cat) => {
					const count = allTemplates.filter((t) => t.category_id === cat.id).length;
					return { ...cat, count };
				});
			}
		}
	}

	function applyFilters() {
		if (!searchTerm && selectedCategoryIds.size === 0) {
			templates = [...allTemplates];

			// Reset category counts to original values
			updateCategoryCounts(allTemplates);
			return;
		}

		templates = allTemplates.filter((template) => {
			// Filter by search term
			const matchesSearch = searchTerm
				? template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
					(template.description &&
						template.description.toLowerCase().includes(searchTerm.toLowerCase()))
				: true;

			// Filter by categories
			const matchesCategory =
				selectedCategoryIds.size > 0
					? template.category_id && selectedCategoryIds.has(template.category_id)
					: true;

			return matchesSearch && matchesCategory;
		});

		// Update counts based on filtered templates
		updateCategoryCounts(templates);
	}

	function updateCategoryCounts(templatesList: Template[]) {
		categories = categories.map((cat) => {
			const count = templatesList.filter((t) => t.category_id === cat.id).length;
			return { ...cat, count, checked: selectedCategoryIds.has(cat.id) };
		});
	}

	function toggleCategoryFilter(categoryId: string) {
		if (selectedCategoryIds.has(categoryId)) {
			selectedCategoryIds.delete(categoryId);
		} else {
			selectedCategoryIds.add(categoryId);
		}

		applyFilters();
	}

	function clearFilters() {
		searchTerm = '';
		selectedCategoryIds.clear();

		categories = categories.map((cat) => ({
			...cat,
			checked: false
		}));

		templates = [...allTemplates];
		updateCategoryCounts(allTemplates);
	}

	function closeDrawer() {
		drawerOpen = false;
	}
</script>

<svelte:head>
	<title>Template Directory | Prompt Templates</title>
</svelte:head>

<div>
	<div class="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-2xl font-bold tracking-tight sm:text-3xl">Template Directory</h1>
		<div class="flex items-center gap-2">
			{#if isAuthenticated}
				<Button size="sm" on:click={() => goto('/templates')} class="w-full sm:w-auto">
					My Templates
				</Button>
			{:else}
				<Button size="sm" on:click={() => goto('/auth/login')} class="w-full sm:w-auto">
					Sign In
				</Button>
			{/if}
		</div>
	</div>

	<!-- Mobile filter button -->
	<div class="mb-4 md:hidden">
		<Button variant="outline" size="sm" class="w-full" on:click={() => (drawerOpen = true)}>
			<Icon icon="heroicons:funnel" class="mr-2 h-4 w-4" />
			Search & Filter
		</Button>
	</div>

	{#if loading}
		<div class="flex items-center justify-center p-8">
			<div class="mr-2 animate-spin">
				<Icon icon="heroicons:arrow-path" width="24" height="24" />
			</div>
			<span>Loading templates...</span>
		</div>
	{:else if error}
		<Alert variant="destructive">
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{:else}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6">
			<!-- Sidebar for categories - desktop -->
			<div class="hidden space-y-4 md:block">
				<Card>
					<CardHeader class="pb-3">
						<CardTitle class="text-lg sm:text-xl">Filter Templates</CardTitle>
					</CardHeader>
					<CardContent class="space-y-2 p-4 sm:p-6">
						<!-- Search input -->
						<div class="relative mb-4">
							<Icon
								icon="heroicons:magnifying-glass"
								class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
							/>
							<Input
								type="search"
								bind:value={searchTerm}
								placeholder="Search templates..."
								on:input={applyFilters}
								class="pl-10"
							/>
						</div>

						<!-- Categories section -->
						<div class="max-h-[400px] space-y-2 overflow-y-auto">
							<h3 class="text-sm font-medium">Categories</h3>

							{#if categories.length > 0}
								<ul class="space-y-1">
									{#each categories as category (category.id)}
										<li>
											<button
												class="flex w-full items-center rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50 {category.checked
													? 'bg-muted'
													: ''}"
												on:click={() => toggleCategoryFilter(category.id)}
											>
												<div
													class="mr-2 flex h-5 w-5 items-center justify-center rounded-sm border {category.checked
														? 'border-primary bg-primary'
														: 'border-muted-foreground/30'}"
												>
													{#if category.checked}
														<Check class="h-3.5 w-3.5 text-primary-foreground" />
													{/if}
												</div>
												<span class="flex-1 truncate text-left">{category.name}</span>
												<span class="ml-1 text-xs text-muted-foreground">({category.count})</span>
											</button>
										</li>
									{/each}
								</ul>
							{:else}
								<p class="text-sm text-muted-foreground">No categories available</p>
							{/if}
						</div>

						<!-- Active filters indicator and clear button -->
						{#if searchTerm || selectedCategoryIds.size > 0}
							<div class="mt-4 border-t pt-2">
								<div class="flex items-center justify-between">
									<span class="text-sm"
										>Active filters: {selectedCategoryIds.size + (searchTerm ? 1 : 0)}</span
									>
									<Button
										variant="ghost"
										on:click={clearFilters}
										size="sm"
										class="h-7 px-2 text-xs"
									>
										Clear all
									</Button>
								</div>
							</div>
						{/if}
					</CardContent>
				</Card>
			</div>

			<!-- Templates grid -->
			<div class="space-y-4 md:col-span-3">
				{#if templates.length === 0}
					<div class="w-full rounded-lg border p-6 text-center sm:p-8">
						<div class="text-muted-foreground">
							{searchTerm || selectedCategoryIds.size > 0
								? 'No templates found matching your filters.'
								: 'No templates are available in the directory yet.'}
						</div>
						{#if searchTerm || selectedCategoryIds.size > 0}
							<Button variant="outline" class="mt-4 w-full sm:w-auto" on:click={clearFilters}>
								Clear Filters
							</Button>
						{/if}
					</div>
				{:else}
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
						{#each templates as template (template.id)}
							<Card class="transition-shadow duration-200 hover:shadow-md">
								<a href={`/directory/${template.id}`} class="block">
									<CardHeader class="mb-2">
										{#if template.featured}
											<div class="mb-1 flex">
												<span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
													>Featured</span
												>
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
	{/if}
</div>

<!-- Mobile Drawer -->
<Drawer.Root bind:open={drawerOpen}>
	<Drawer.Portal>
		<Drawer.Overlay class="fixed inset-0 bg-black/40"></Drawer.Overlay>
		<Drawer.Content
			class="fixed bottom-0 left-0 right-0 mt-24 flex max-h-[85vh] flex-col rounded-t-[10px] bg-background p-4"
		>
			<div class="mx-auto mb-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-muted"></div>
			<div class="mx-auto w-full max-w-md">
				<Drawer.Title class="mb-4 text-lg font-medium">Search & Filter</Drawer.Title>

				<!-- Search input -->
				<div class="relative mb-4">
					<Icon
						icon="heroicons:magnifying-glass"
						class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
					/>
					<Input
						type="search"
						bind:value={searchTerm}
						placeholder="Search templates..."
						class="pl-10"
					/>
				</div>

				<!-- Categories section -->
				<div class="mb-4">
					<div class="mb-2 flex items-center justify-between">
						<h3 class="text-sm font-medium">Categories</h3>
					</div>

					{#if categories.length > 0}
						<ul class="max-h-[40vh] space-y-1 overflow-y-auto">
							{#each categories as category (category.id)}
								<li>
									<button
										class="flex w-full items-center rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50 {category.checked
											? 'bg-muted'
											: ''}"
										on:click={() => toggleCategoryFilter(category.id)}
									>
										<div
											class="mr-2 flex h-5 w-5 items-center justify-center rounded-sm border {category.checked
												? 'border-primary bg-primary'
												: 'border-muted-foreground/30'}"
										>
											{#if category.checked}
												<Check class="h-3.5 w-3.5 text-primary-foreground" />
											{/if}
										</div>
										<span class="flex-1 truncate text-left">{category.name}</span>
										<span class="ml-1 text-xs text-muted-foreground">({category.count})</span>
									</button>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-sm text-muted-foreground">No categories available</p>
					{/if}
				</div>

				<!-- Active filters indicator and clear button -->
				{#if searchTerm || selectedCategoryIds.size > 0}
					<div class="border-t pt-2">
						<div class="flex items-center justify-between">
							<span class="text-sm"
								>Active filters: {selectedCategoryIds.size + (searchTerm ? 1 : 0)}</span
							>
							<Button variant="ghost" on:click={clearFilters} size="sm" class="h-7 px-2 text-xs">
								Clear all
							</Button>
						</div>
					</div>
				{/if}

				<div class="mt-6 flex gap-2">
					<Button variant="outline" class="w-full" on:click={() => closeDrawer()}>Close</Button>
					<Button
						class="w-full"
						on:click={() => {
							applyFilters();
							closeDrawer();
						}}
					>
						Apply Filters
					</Button>
				</div>
			</div>
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>
