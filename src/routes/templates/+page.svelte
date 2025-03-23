<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import Check from "svelte-radix/Check.svelte";
	import { getUserFriendlyErrorMessage } from '$lib/utils';
	import Icon from '@iconify/svelte';
	
	interface Template {
		id: string;
		title: string;
		description: string | null;
		content: string;
		created_at: string;
		updated_at: string;
		category_id: string | null;
		categories?: { name: string };
		variables_count?: number | null;
		category_name?: string;
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
	let userId = '';
	
	// For filtering
	let searchTerm = '';
	let selectedCategoryIds: Set<string> = new Set();
	let showSidebar = true;
	let drawerOpen = false;
	
	// For new category
	let newCategoryDialogOpen = false;
	let newCategoryName = '';
	let newCategoryDescription = '';
	let savingCategory = false;
	let categoryError = '';
	
	onMount(() => {
		loadTemplates();
	});
	
	async function loadTemplates() {
		try {
			const { data: { session } } = await supabase.auth.getSession();
			
			if (!session) {
				goto('/auth/login');
				return;
			}
			
			userId = session.user.id;
			await Promise.all([fetchTemplates(), fetchCategories()]);
		} catch (e: any) {
			error = e.message || 'Failed to load templates';
		} finally {
			loading = false;
		}
	}
	
	async function fetchTemplates() {
		const { data, error: fetchError } = await supabase
			.from('templates')
			.select(`
				*,
				categories(name)
			`)
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
						.from('variables')
						.select('id', { count: 'exact', head: true })
						.eq('template_id', template.id);
					
					return {
						...template,
						category_name: template.categories?.name,
						variables_count: count
					};
				})
			);
			
			templates = [...allTemplates];
		}
	}
	
	async function fetchCategories() {
		const { data, error: fetchError } = await supabase
			.from('categories')
			.select('*')
			.order('name');
		
		if (fetchError) {
			console.error('Error fetching categories:', fetchError);
			return;
		}
		
		if (data) {
			categories = data.map(cat => ({
				...cat,
				checked: false,
				count: 0
			}));
			
			// Count templates in each category
			if (allTemplates.length > 0) {
				categories = categories.map(cat => {
					const count = allTemplates.filter(t => t.category_id === cat.id).length;
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
		
		templates = allTemplates.filter(template => {
			// Filter by search term
			const matchesSearch = searchTerm 
				? template.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
				  (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
				: true;
			
			// Filter by categories
			const matchesCategory = selectedCategoryIds.size > 0
				? template.category_id && selectedCategoryIds.has(template.category_id)
				: true;
			
			return matchesSearch && matchesCategory;
		});
		
		// Update counts based on filtered templates
		updateCategoryCounts(templates);
	}
	
	function updateCategoryCounts(templatesList: Template[]) {
		categories = categories.map(cat => {
			const count = templatesList.filter(t => t.category_id === cat.id).length;
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
		
		categories = categories.map(cat => ({
			...cat,
			checked: false
		}));
		
		templates = [...allTemplates];
		updateCategoryCounts(allTemplates);
	}
	
	function handleCreateNew() {
		goto('/templates/new');
	}
	
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
	
	async function createCategory() {
		if (!newCategoryName.trim()) {
			categoryError = 'Category name is required';
			return;
		}
		
		try {
			savingCategory = true;
			categoryError = '';
			
			const { data, error: insertError } = await supabase
				.from('categories')
				.insert({
					name: newCategoryName.trim(),
					user_id: userId
				})
				.select()
				.single();
			
			if (insertError) {
				categoryError = getUserFriendlyErrorMessage(insertError);
				return;
			}
			
			// Close dialog and reset values
			newCategoryDialogOpen = false;
			newCategoryName = '';
			newCategoryDescription = '';
			
			// Refresh categories list
			await fetchCategories();
		} catch (e: any) {
			categoryError = getUserFriendlyErrorMessage(e);
		} finally {
			savingCategory = false;
		}
	}
	
	function closeDrawer() {
		drawerOpen = false;
	}
</script>

<svelte:head>
	<title>My Templates | Prompt Templates</title>
</svelte:head>

<div class="space-y-6">
	<div class="space-y-4">
		<h1 class="text-3xl font-bold tracking-tight">My Templates</h1>
		<div class="space-y-2">
			<Button variant="outline" class="w-full" on:click={() => goto('/categories')}>
				Manage Categories
			</Button>
			<Button class="w-full" on:click={handleCreateNew}>
				Create New Template
			</Button>
		</div>
	</div>
	
	<!-- Mobile filter button -->
	<div class="md:hidden">
		<Button 
			variant="outline" 
			class="w-full"
			on:click={() => drawerOpen = true}
		>
			<Icon icon="heroicons:funnel" class="h-4 w-4 mr-2" />
			Search & Filter
		</Button>
	</div>
	
	{#if error}
		<Alert variant="destructive">
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}
	
	{#if loading}
		<div class="flex items-center justify-center p-8">
			<div class="animate-spin mr-2">
				<Icon icon="heroicons:arrow-path" width="24" height="24" />
			</div>
			<span>Loading templates...</span>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
			<!-- Sidebar for categories - desktop -->
			<div class="hidden md:block space-y-4">
				<Card>
					<CardHeader class="pb-3">
						<CardTitle class="text-xl">Filter Templates</CardTitle>
					</CardHeader>
					<CardContent class="space-y-2">
						<!-- Search input -->
						<div class="relative mb-4">
							<Icon icon="heroicons:magnifying-glass" class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input 
								type="search" 
								bind:value={searchTerm} 
								placeholder="Search templates..."
								on:input={applyFilters}
								class="pl-10"
							/>
						</div>
						
						<!-- Categories section -->
						<div class="space-y-2 max-h-[400px] overflow-y-auto">
							<div class="flex justify-between items-center">
								<h3 class="font-medium text-sm">Categories</h3>
								<Button 
									variant="ghost"
									on:click={() => newCategoryDialogOpen = true}
									size="icon"
									class="h-6 w-6"
									title="Add New Category"
								>
									<Icon icon="heroicons:plus" class="h-4 w-4" />
								</Button>
							</div>
							
							{#if categories.length > 0}
								<ul class="space-y-1">
									{#each categories as category}
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
						
						<!-- Active filters indicator and clear button -->
						{#if searchTerm || selectedCategoryIds.size > 0}
							<div class="pt-2 border-t mt-4">
								<div class="flex justify-between items-center">
									<span class="text-sm">Active filters: {selectedCategoryIds.size + (searchTerm ? 1 : 0)}</span>
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
			<div class="md:col-span-3 space-y-4">
				{#if templates.length === 0}
					<div class="w-full p-8 text-center border rounded-lg">
						<div class="text-muted-foreground">
							{searchTerm || selectedCategoryIds.size > 0 
								? 'No templates found matching your filters.'
								: 'Create your first template to get started'}
						</div>
						<div class="flex gap-2 justify-center mt-4">
							{#if searchTerm || selectedCategoryIds.size > 0}
								<Button variant="outline" on:click={clearFilters}>
									Clear Filters
								</Button>
							{/if}
							<Button on:click={handleCreateNew}>
								Create New Template
							</Button>
						</div>
					</div>
				{:else}
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{#each templates as template}
							<Card>
								<a href={`/templates/${template.id}`} class="block">
									<CardHeader>
										<CardTitle class="truncate">{template.title}</CardTitle>
										{#if template.description}
											<CardDescription class="line-clamp-2">{template.description}</CardDescription>
										{:else}
											<CardDescription class="italic">No description</CardDescription>
										{/if}
									</CardHeader>
									<CardFooter>
										<div class="flex justify-between w-full text-xs text-muted-foreground">
											<div class="flex gap-2">
												<span>{template.variables_count} variables</span>
												{#if template.category_name}
													<span>• {template.category_name}</span>
												{/if}
											</div>
											<span>Updated {formatDate(template.updated_at)}</span>
										</div>
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

<!-- New Category Dialog -->
<Dialog.Root bind:open={newCategoryDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Create New Category</Dialog.Title>
			<Dialog.Description>
				Add a new category to organize your templates.
			</Dialog.Description>
		</Dialog.Header>
		
		{#if categoryError}
			<Alert variant="destructive" class="mb-4">
				<AlertDescription>{categoryError}</AlertDescription>
			</Alert>
		{/if}
		
		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="new-category-name">Name *</Label>
				<Input
					id="new-category-name"
					type="text"
					bind:value={newCategoryName}
					placeholder="Enter category name"
					required
				/>
			</div>
		</div>
		
		<Dialog.Footer>
			<Button 
				variant="outline" 
				on:click={() => newCategoryDialogOpen = false}
			>
				Cancel
			</Button>
			<Button 
				type="button" 
				disabled={savingCategory || !newCategoryName.trim()}
				on:click={createCategory}
			>
				{savingCategory ? 'Creating...' : 'Create Category'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root> 

<!-- Mobile Drawer -->
<Drawer.Root bind:open={drawerOpen}>
	<Drawer.Portal>
		<Drawer.Overlay class="fixed inset-0 bg-black/40"></Drawer.Overlay>
		<Drawer.Content class="bg-background p-4 rounded-t-[10px] mt-24 fixed bottom-0 left-0 right-0 max-h-[85vh] flex flex-col">
			<div class="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-4"></div>
			<div class="max-w-md mx-auto w-full">
				<Drawer.Title class="font-medium mb-4 text-lg">Search & Filter</Drawer.Title>
				
				<!-- Search input -->
				<div class="relative mb-4">
					<Icon icon="heroicons:magnifying-glass" class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input 
						type="search" 
						bind:value={searchTerm} 
						placeholder="Search templates..."
						class="pl-10"
					/>
				</div>
				
				<!-- Categories section -->
				<div class="mb-4">
					<div class="flex justify-between items-center mb-2">
						<h3 class="font-medium text-sm">Categories</h3>
						<Button 
							variant="ghost"
							on:click={() => {
								closeDrawer();
								setTimeout(() => newCategoryDialogOpen = true, 300);
							}}
							size="icon"
							class="h-6 w-6"
							title="Add New Category"
						>
							<Icon icon="heroicons:plus" class="h-4 w-4" />
						</Button>
					</div>
					
					{#if categories.length > 0}
						<ul class="space-y-1 max-h-[40vh] overflow-y-auto">
							{#each categories as category}
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
				
				<!-- Active filters indicator and clear button -->
				{#if searchTerm || selectedCategoryIds.size > 0}
					<div class="pt-2 border-t">
						<div class="flex justify-between items-center">
							<span class="text-sm">Active filters: {selectedCategoryIds.size + (searchTerm ? 1 : 0)}</span>
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
				
				<div class="mt-6 flex gap-2">
					<Button 
						variant="outline" 
						class="w-full" 
						on:click={() => closeDrawer()}
					>
						Close
					</Button>
					<Button 
						class="w-full" 
						on:click={() => { applyFilters(); closeDrawer(); }}
					>
						Apply Filters
					</Button>
				</div>
			</div>
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root> 