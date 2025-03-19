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
	import { Textarea } from '$lib/components/ui/textarea';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import Check from "svelte-radix/Check.svelte";
	
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
	let showFilters = false;
	
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
	}
	
	function toggleCategoryFilter(categoryId: string) {
		if (selectedCategoryIds.has(categoryId)) {
			selectedCategoryIds.delete(categoryId);
		} else {
			selectedCategoryIds.add(categoryId);
		}
		
		// Update the categories list for UI
		categories = categories.map(cat => ({
			...cat,
			checked: selectedCategoryIds.has(cat.id)
		}));
		
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
				categoryError = insertError.message;
				return;
			}
			
			// Close dialog and reset values
			newCategoryDialogOpen = false;
			newCategoryName = '';
			newCategoryDescription = '';
			
			// Refresh categories list
			await fetchCategories();
		} catch (e: any) {
			categoryError = e.message || 'Failed to create category';
		} finally {
			savingCategory = false;
		}
	}
</script>

<div>
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-2xl font-bold">My Templates</h1>
		<div class="flex gap-2">
			<Button 
				variant="outline" 
				on:click={() => showFilters = !showFilters}
			>
				{showFilters ? 'Hide Filters' : 'Show Filters'}
			</Button>
			<Button on:click={handleCreateNew}>
				Create New Template
			</Button>
		</div>
	</div>
	
	{#if showFilters}
		<div class="mb-6 p-4 bg-muted/20 rounded-md border">
			<div class="flex items-center gap-4">
				<div class="relative flex-1">
					<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<!-- Search icon (you can replace with an actual icon component) -->
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
				
				{#if categories.length > 0}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger asChild let:builder>
							<Button 
								variant="outline" 
								builders={[builder]}
							>
								Categories
								{#if selectedCategoryIds.size > 0}
									<span class="ml-1.5 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs">
										{selectedCategoryIds.size}
									</span>
								{/if}
							</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-56">
							<DropdownMenu.Label>Filter by Category</DropdownMenu.Label>
							<DropdownMenu.Separator />
							
							{#each categories as category}
								<DropdownMenu.CheckboxItem
									checked={category.checked}
									onCheckedChange={() => toggleCategoryFilter(category.id)}
								>
									{category.name}
									<span class="ml-auto text-xs text-muted-foreground">({category.count})</span>
								</DropdownMenu.CheckboxItem>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{/if}
				
				<Button 
					variant="outline"
					on:click={() => newCategoryDialogOpen = true}
					size="icon"
					title="Add New Category"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="12" y1="5" x2="12" y2="19"></line>
						<line x1="5" y1="12" x2="19" y2="12"></line>
					</svg>
				</Button>
				
				{#if searchTerm || selectedCategoryIds.size > 0}
					<Button 
						variant="ghost"
						on:click={clearFilters}
						size="sm"
					>
						Clear
					</Button>
				{/if}
			</div>
		</div>
	{/if}
	
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