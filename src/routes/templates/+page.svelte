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

<div class="flex">
	<!-- Desktop Sidebar -->
	<aside class="border-r bg-muted/10 w-64 flex-shrink-0 hidden md:block">
		<div class="p-4 sticky top-0">
			<div class="mb-6">
				<h2 class="text-lg font-semibold mb-2">Filters</h2>
				
				<!-- Search input -->
				<div class="relative mb-4">
					<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="11" cy="11" r="8"></circle>
							<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
						</svg>
					</div>
					<Input 
						type="text" 
						bind:value={searchTerm} 
						placeholder="Search templates..."
						on:input={applyFilters}
						class="pl-10"
					/>
				</div>
				
				<!-- Categories section -->
				<div class="mb-4">
					<div class="flex justify-between items-center mb-2">
						<h3 class="font-medium text-sm">Categories</h3>
						<Button 
							variant="ghost"
							on:click={() => newCategoryDialogOpen = true}
							size="icon"
							class="h-6 w-6"
							title="Add New Category"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<line x1="12" y1="5" x2="12" y2="19"></line>
								<line x1="5" y1="12" x2="19" y2="12"></line>
							</svg>
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
			</div>
		</div>
	</aside>
	
	<!-- Main content -->
	<main class="flex-1 p-6">
		<div class="max-w-6xl mx-auto">
			<div class="flex flex-col mb-6">
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
					<h1 class="text-2xl font-bold">My Templates</h1>
					<div class="flex gap-2">
						<Button variant="outline" on:click={() => goto('/categories')}>
							Manage Categories
						</Button>
						<Button on:click={handleCreateNew}>
							Create New Template
						</Button>
					</div>
				</div>
				
				<!-- Mobile filter button - on a new line -->
				<div class="md:hidden mb-2">
					<Button 
						variant="outline" 
						class="w-full"
						on:click={() => drawerOpen = true}
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
						</svg>
						Search & Filter
					</Button>
				</div>
			</div>
			
			{#if error}
				<Alert variant="destructive" class="mb-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			{/if}
			
			{#if loading}
				<div class="flex justify-center py-12">
					<div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
				</div>
			{:else if templates.length === 0}
				<div class="text-center py-12 border rounded-md bg-muted/20">
					<h2 class="text-xl font-medium mb-2">No templates found</h2>
					<p class="text-muted-foreground mb-4">
						{searchTerm || selectedCategoryIds.size > 0 
							? 'Try adjusting your filters or create a new template'
							: 'Create your first template to get started'}
					</p>
					<div class="flex gap-2 justify-center">
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
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
	</main>
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
					<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="11" cy="11" r="8"></circle>
							<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
						</svg>
					</div>
					<Input 
						type="text" 
						bind:value={searchTerm} 
						placeholder="Search templates..."
						on:input={applyFilters}
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
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<line x1="12" y1="5" x2="12" y2="19"></line>
								<line x1="5" y1="12" x2="19" y2="12"></line>
							</svg>
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