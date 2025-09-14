<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Textarea } from '$lib/components/ui/textarea';
	import Icon from '@iconify/svelte';
	import { getUserFriendlyErrorMessage } from '$lib/utils';
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
		variables_count?: number | null;
		category_name?: string;
		featured?: boolean;
	}
	
	interface Category {
		id: string;
		name: string;
		description?: string | null;
	}
	
	let templates: Template[] = [];
	let categories: Category[] = [];
	let loading = true;
	let error = '';
	
	// For dialogs
	let newTemplateDialogOpen = false;
	let newCategoryDialogOpen = false;
	let deleteTemplateDialogOpen = false;
	let deleteTemplateName = '';
	let deleteTemplateId = '';
	
	// For new template
	let newTemplateTitle = '';
	let newTemplateDescription = '';
	let newTemplateContent = '';
	let newTemplateCategoryId = '';
	let newTemplateFeatured = false;
	let savingTemplate = false;
	let templateError = '';
	
	// For new category
	let newCategoryName = '';
	let newCategoryDescription = '';
	let savingCategory = false;
	let categoryError = '';
	
	onMount(() => {
		loadData();
	});
	
	async function loadData() {
		try {
			loading = true;
			await Promise.all([fetchTemplates(), fetchCategories()]);
		} catch (e: any) {
			error = e.message || 'Failed to load data';
		} finally {
			loading = false;
		}
	}
	
	async function fetchTemplates() {
		const { data, error: fetchError } = await supabase
			.from('directory_templates')
			.select(`
				*,
				directory_categories(name)
			`)
			.order('title');
		
		if (fetchError) {
			error = fetchError.message;
			return;
		}
		
		if (data) {
			templates = data.map(template => ({
				...template,
				category_name: template.directory_categories?.name
			}));
		}
	}
	
	async function fetchCategories() {
		const { data, error: fetchError } = await supabase
			.from('directory_categories')
			.select('*')
			.order('name');
		
		if (fetchError) {
			logger.error('Error fetching categories:', fetchError, 'admin');
			return;
		}
		
		categories = data || [];
		
		// Set default category for new template if categories exist
		if (categories.length > 0 && !newTemplateCategoryId) {
			newTemplateCategoryId = categories[0].id;
		}
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
				.from('directory_categories')
				.insert({
					name: newCategoryName.trim(),
					description: newCategoryDescription?.trim() || null
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
	
	async function createTemplate() {
		try {
			savingTemplate = true;
			templateError = '';
			
			if (!newTemplateTitle.trim() || !newTemplateContent.trim() || !newTemplateDescription.trim() || !newTemplateCategoryId) {
				templateError = 'Please fill in all required fields';
				return;
			}
			
			// Extract variables from the content
			const variableMatches = [...newTemplateContent.matchAll(/\{\{([^}]+)\}\}/g)];
			const extractedVariables = variableMatches.map(match => match[1].trim());
			const uniqueVariables = [...new Set(extractedVariables)];
			
			// Insert the template first
			const { data: template, error: insertError } = await supabase
				.from('directory_templates')
				.insert({
					title: newTemplateTitle,
					description: newTemplateDescription,
					content: newTemplateContent,
					category_id: newTemplateCategoryId,
					featured: newTemplateFeatured
				})
				.select('*')
				.single();

			if (insertError) {
				templateError = insertError.message;
				return;
			}
			
			// Then insert the variables
			if (uniqueVariables.length > 0) {
				const variableInserts = uniqueVariables.map(variable_name => ({
					template_id: template.id,
					name: variable_name,
					description: '',
					default_value: ''
				}));
				
				const { error: variablesError } = await supabase
					.from('directory_variables')
					.insert(variableInserts);
				
				if (variablesError) {
					templateError = variablesError.message;
				}
			}
			
			// Reset form and refresh templates
			if (!templateError) {
				newTemplateDialogOpen = false;
				newTemplateTitle = '';
				newTemplateDescription = '';
				newTemplateContent = '';
				newTemplateCategoryId = categories.length > 0 ? categories[0].id : '';
				newTemplateFeatured = false;
				await fetchTemplates();
			}
		} catch (e: any) {
			templateError = e.message || 'Failed to create template';
		} finally {
			savingTemplate = false;
		}
	}
	
	function confirmDeleteTemplate(template: Template) {
		deleteTemplateId = template.id;
		deleteTemplateName = template.title;
		deleteTemplateDialogOpen = true;
	}
	
	async function deleteTemplate() {
		try {
			// Delete the template (variables will cascade delete due to FK constraint)
			const { error: deleteError } = await supabase
				.from('directory_templates')
				.delete()
				.eq('id', deleteTemplateId);
				
			if (deleteError) {
				error = deleteError.message;
				return;
			}
			
			// Close dialog and refresh
			deleteTemplateDialogOpen = false;
			await fetchTemplates();
		} catch (e: any) {
			error = e.message || 'Failed to delete template';
		}
	}
	
	async function toggleFeatured(template: Template) {
		try {
			const { error: updateError } = await supabase
				.from('directory_templates')
				.update({ featured: !template.featured })
				.eq('id', template.id);
				
			if (updateError) {
				error = updateError.message;
				return;
			}
			
			// Refresh templates list
			await fetchTemplates();
		} catch (e: any) {
			error = e.message || 'Failed to update template';
		}
	}
	
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div>
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">Template Directory Admin</h1>
		<div class="flex gap-2">
			<Button on:click={() => goto('/admin')} variant="outline">
				<Icon icon="mdi:arrow-left" class="mr-2 h-4 w-4" />
				Back to Dashboard
			</Button>
			<Button on:click={() => newCategoryDialogOpen = true} variant="outline">
				<Icon icon="mdi:folder-plus" class="mr-2 h-4 w-4" />
				New Category
			</Button>
			<Button on:click={() => newTemplateDialogOpen = true}>
				<Icon icon="mdi:file-plus" class="mr-2 h-4 w-4" />
				New Template
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
	{:else}
		<Tabs.Root value="templates" class="w-full">
			<Tabs.List>
				<Tabs.Trigger value="templates">Templates</Tabs.Trigger>
				<Tabs.Trigger value="categories">Categories</Tabs.Trigger>
			</Tabs.List>
			
			<div class="mt-4">
				<Tabs.Content value="templates">
					{#if templates.length === 0}
						<div class="text-center py-12 border rounded-md bg-muted/20">
							<h2 class="text-xl font-medium mb-2">No templates</h2>
							<p class="text-muted-foreground mb-4">
								Create your first directory template to get started
							</p>
							<Button on:click={() => newTemplateDialogOpen = true}>
								<Icon icon="mdi:file-plus" class="mr-2 h-4 w-4" />
								New Template
							</Button>
						</div>
					{:else}
						<div class="grid gap-4">
							{#each templates as template}
								<Card>
									<CardHeader>
										<div class="flex justify-between items-start">
											<div>
												<CardTitle>{template.title}</CardTitle>
												{#if template.description}
													<CardDescription>{template.description}</CardDescription>
												{/if}
											</div>
											<div class="flex gap-1">
												<Button size="icon" variant={template.featured ? "default" : "outline"} title={template.featured ? "Unfeature" : "Feature"} on:click={() => toggleFeatured(template)}>
													<Icon icon="mdi:star" class="h-4 w-4" />
												</Button>
												<Button size="icon" variant="outline" title="Edit" on:click={() => goto(`/admin/directory/${template.id}`)}>
													<Icon icon="mdi:pencil" class="h-4 w-4" />
												</Button>
												<Button size="icon" variant="destructive" title="Delete" on:click={() => confirmDeleteTemplate(template)}>
													<Icon icon="mdi:delete" class="h-4 w-4" />
												</Button>
											</div>
										</div>
									</CardHeader>
									<CardFooter>
										<div class="flex justify-between w-full text-sm">
											<div class="flex gap-2 items-center">
												{#if template.category_name}
													<Badge variant="secondary">{template.category_name}</Badge>
												{/if}
												{#if template.featured}
													<Badge variant="default">Featured</Badge>
												{/if}
											</div>
											<span class="text-muted-foreground text-xs">Updated {formatDate(template.updated_at)}</span>
										</div>
									</CardFooter>
								</Card>
							{/each}
						</div>
					{/if}
				</Tabs.Content>
				
				<Tabs.Content value="categories">
					{#if categories.length === 0}
						<div class="text-center py-12 border rounded-md bg-muted/20">
							<h2 class="text-xl font-medium mb-2">No categories</h2>
							<p class="text-muted-foreground mb-4">
								Create your first directory category to get started
							</p>
							<Button on:click={() => newCategoryDialogOpen = true}>
								<Icon icon="mdi:folder-plus" class="mr-2 h-4 w-4" />
								New Category
							</Button>
						</div>
					{:else}
						<div class="grid gap-4">
							{#each categories as category}
								<Card>
									<CardHeader>
										<div class="flex justify-between items-start">
											<div>
												<CardTitle>{category.name}</CardTitle>
												{#if category.description}
													<CardDescription>{category.description}</CardDescription>
												{/if}
											</div>
										</div>
									</CardHeader>
									<CardContent class="pt-0">
										<div class="flex justify-between items-center">
											<div class="text-sm text-muted-foreground">
												{templates.filter(t => t.category_id === category.id).length} templates
											</div>
										</div>
									</CardContent>
								</Card>
							{/each}
						</div>
					{/if}
				</Tabs.Content>
			</div>
		</Tabs.Root>
	{/if}
</div>

<!-- New Template Dialog -->
<Dialog.Root bind:open={newTemplateDialogOpen}>
	<Dialog.Content class="max-w-3xl">
		<Dialog.Header>
			<Dialog.Title>Create New Directory Template</Dialog.Title>
			<Dialog.Description>
				Add a new template to the public directory
			</Dialog.Description>
		</Dialog.Header>
		
		{#if templateError}
			<Alert variant="destructive" class="mb-4">
				<AlertDescription>{templateError}</AlertDescription>
			</Alert>
		{/if}
		
		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="title">Title *</Label>
				<Input
					id="title"
					type="text"
					bind:value={newTemplateTitle}
					placeholder="Enter template title"
				/>
			</div>
			
			<div class="space-y-2">
				<Label for="description">Description</Label>
				<Textarea
					id="description"
					bind:value={newTemplateDescription}
					placeholder="Enter template description"
				/>
			</div>
			
			<div class="space-y-2">
				<Label for="content">Content *</Label>
				<Textarea
					id="content"
					bind:value={newTemplateContent}
					placeholder="Enter template content with &#123;&#123;variables&#125;&#125;"
					class="min-h-[200px] font-mono"
				/>
				<p class="text-xs text-muted-foreground">
					Use "&#123;&#123;variable_name&#125;&#125;" syntax to define variables
				</p>
			</div>
			
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="category">Category</Label>
					<select
						id="category"
						class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1"
						bind:value={newTemplateCategoryId}
					>
						<option value="">None</option>
						{#each categories as category}
							<option value={category.id}>{category.name}</option>
						{/each}
					</select>
				</div>
				
				<div class="space-y-2 flex items-end">
					<div class="flex items-center space-x-2">
						<input
							type="checkbox"
							id="featured"
							bind:checked={newTemplateFeatured}
							class="h-4 w-4 rounded border-gray-300 focus:ring-primary"
						/>
						<label for="featured" class="text-sm font-medium">
							Feature this template
						</label>
					</div>
				</div>
			</div>
		</div>
		
		<Dialog.Footer>
			<Button 
				variant="outline" 
				on:click={() => newTemplateDialogOpen = false}
			>
				Cancel
			</Button>
			<Button 
				type="button" 
				disabled={savingTemplate || !newTemplateTitle.trim() || !newTemplateContent.trim()}
				on:click={createTemplate}
			>
				{savingTemplate ? 'Creating...' : 'Create Template'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- New Category Dialog -->
<Dialog.Root bind:open={newCategoryDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Create New Category</Dialog.Title>
			<Dialog.Description>
				Add a new category to organize directory templates
			</Dialog.Description>
		</Dialog.Header>
		
		{#if categoryError}
			<Alert variant="destructive" class="mb-4">
				<AlertDescription>{categoryError}</AlertDescription>
			</Alert>
		{/if}
		
		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="category-name">Name *</Label>
				<Input
					id="category-name"
					type="text"
					bind:value={newCategoryName}
					placeholder="Enter category name"
				/>
			</div>
			
			<div class="space-y-2">
				<Label for="category-description">Description</Label>
				<Textarea
					id="category-description"
					bind:value={newCategoryDescription}
					placeholder="Enter category description (optional)"
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

<!-- Delete Template Confirmation Dialog -->
<Dialog.Root bind:open={deleteTemplateDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete Template</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete this template? This action cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		
		<div class="py-4">
			<p>You are about to delete: <strong>{deleteTemplateName}</strong></p>
		</div>
		
		<Dialog.Footer>
			<Button 
				variant="outline" 
				on:click={() => deleteTemplateDialogOpen = false}
			>
				Cancel
			</Button>
			<Button 
				variant="destructive"
				on:click={deleteTemplate}
			>
				Delete
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root> 