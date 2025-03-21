<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Textarea } from '$lib/components/ui/textarea';
	import Icon from '@iconify/svelte';
	import { getUserFriendlyErrorMessage } from '$lib/utils';
	
	interface Template {
		id: string;
		title: string;
		description: string | null;
		content: string;
		created_at: string;
		updated_at: string;
		category_id: string | null;
		featured: boolean;
	}
	
	interface Category {
		id: string;
		name: string;
		description?: string | null;
	}
	
	interface Variable {
		id: string;
		template_id: string;
		name: string;
		description: string | null;
		type: string;
		default_value: string | null;
		is_required: boolean;
	}
	
	let template: Template | null = null;
	let categories: Category[] = [];
	let variables: Variable[] = [];
	let loading = true;
	let error = '';
	let saving = false;
	let saveSuccess = false;
	
	// For template editing
	let title = '';
	let description = '';
	let content = '';
	let categoryId = '';
	let featured = false;
	
	// For variable management
	let newVariableName = '';
	let newVariableDescription = '';
	let newVariableDefaultValue = '';
	let editingVariable: Variable | null = null;
	let variableDialogOpen = false;
	let deleteVariableDialogOpen = false;
	let deleteVariableId = '';
	
	// For new category
	let newCategoryDialogOpen = false;
	let newCategoryName = '';
	let newCategoryDescription = '';
	let savingCategory = false;
	let categoryError = '';
	
	const templateId = $page.params.id;
	
	onMount(() => {
		loadData();
	});
	
	async function loadData() {
		try {
			loading = true;
			
			// Fetch the template
			const { data: templateData, error: templateError } = await supabase
				.from('directory_templates')
				.select('*')
				.eq('id', templateId)
				.single();
			
			if (templateError) {
				error = templateError.message;
				return;
			}
			
			template = templateData;
			title = template!.title;
			description = template!.description || '';
			content = template!.content;
			categoryId = template!.category_id || '';
			featured = template!.featured;
			
			// Fetch categories
			await fetchCategories();
			
			// Fetch variables
			const { data: variablesData, error: variablesError } = await supabase
				.from('directory_variables')
				.select('*')
				.eq('template_id', templateId)
				.order('name');
			
			if (variablesError) {
				error = variablesError.message;
				return;
			}
			
			variables = variablesData || [];
		} catch (e: any) {
			error = e.message || 'Failed to load template data';
		} finally {
			loading = false;
		}
	}
	
	async function fetchCategories() {
		const { data, error: fetchError } = await supabase
			.from('directory_categories')
			.select('*')
			.order('name');
		
		if (fetchError) {
			error = fetchError.message;
			return;
		}
		
		categories = data || [];
	}
	
	async function saveTemplate() {
		try {
			saving = true;
			saveSuccess = false;
			
			// Validate form
			if (!title.trim() || !content.trim()) {
				error = 'Title and content are required';
				return;
			}
			
			// Update the template
			const { error: updateError } = await supabase
				.from('directory_templates')
				.update({
					title: title.trim(),
					description: description.trim() || null,
					content: content.trim(),
					category_id: categoryId || null,
					featured: featured
				})
				.eq('id', templateId);
			
			if (updateError) {
				error = updateError.message;
				return;
			}
			
			// Find new variables in the content
			const variableMatches = [...content.matchAll(/\{\{([^}]+)\}\}/g)];
			const extractedVariables = variableMatches.map(match => match[1].trim());
			const uniqueVariables = [...new Set(extractedVariables)];
			
			// Check for new variables that don't exist yet
			const newVariables = uniqueVariables.filter(varName => 
				!variables.some(v => v.name === varName)
			);
			
			// Add new variables
			if (newVariables.length > 0) {
				const variableInserts = newVariables.map(variable_name => ({
					template_id: templateId,
					name: variable_name,
					description: '',
					type: 'text',
					default_value: '',
					is_required: false
				}));
				
				const { error: variablesError } = await supabase
					.from('directory_variables')
					.insert(variableInserts);
				
				if (variablesError) {
					error = variablesError.message;
					return;
				}
			}
			
			saveSuccess = true;
			await loadData();
		} catch (e: any) {
			error = e.message || 'Failed to save template';
		} finally {
			saving = false;
		}
	}
	
	function openVariableDialog(variable: Variable | null = null) {
		editingVariable = variable;
		
		if (variable) {
			newVariableName = variable.name;
			newVariableDescription = variable.description || '';
			newVariableDefaultValue = variable.default_value || '';
		} else {
			newVariableName = '';
			newVariableDescription = '';
			newVariableDefaultValue = '';
		}
		
		variableDialogOpen = true;
	}
	
	async function saveVariable() {
		try {
			if (!newVariableName.trim()) {
				error = 'Variable name is required';
				return;
			}
			
			if (editingVariable) {
				// Update existing variable
				const { error: updateError } = await supabase
					.from('directory_variables')
					.update({
						name: newVariableName.trim(),
						description: newVariableDescription.trim() || null,
						default_value: newVariableDefaultValue.trim() || null
					})
					.eq('id', editingVariable.id);
				
				if (updateError) {
					error = updateError.message;
					return;
				}
			} else {
				// Create new variable
				const { error: insertError } = await supabase
					.from('directory_variables')
					.insert({
						template_id: templateId,
						name: newVariableName.trim(),
						description: newVariableDescription.trim() || null,
						type: 'text',
						default_value: newVariableDefaultValue.trim() || null,
						is_required: false
					});
				
				if (insertError) {
					error = insertError.message;
					return;
				}
			}
			
			variableDialogOpen = false;
			await loadData();
		} catch (e: any) {
			error = e.message || 'Failed to save variable';
		}
	}
	
	function confirmDeleteVariable(variableId: string) {
		deleteVariableId = variableId;
		deleteVariableDialogOpen = true;
	}
	
	async function deleteVariable() {
		try {
			const { error: deleteError } = await supabase
				.from('directory_variables')
				.delete()
				.eq('id', deleteVariableId);
			
			if (deleteError) {
				error = deleteError.message;
				return;
			}
			
			deleteVariableDialogOpen = false;
			await loadData();
		} catch (e: any) {
			error = e.message || 'Failed to delete variable';
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
			
			// Refresh categories and select the new one
			await fetchCategories();
			
			if (data) {
				if (template) {
					template.category_id = data.id;
				}
			}
		} catch (e: any) {
			categoryError = getUserFriendlyErrorMessage(e);
		} finally {
			savingCategory = false;
		}
	}
</script>

<div class="container mx-auto py-8">
	<div class="flex justify-between items-center mb-6">
		<div>
			<Button variant="outline" on:click={() => goto('/admin/directory')} class="mb-2">
				<Icon icon="mdi:arrow-left" class="mr-2 h-4 w-4" />
				Back to Directory
			</Button>
			<h1 class="text-3xl font-bold">Edit Template</h1>
		</div>
		
		<div class="flex gap-2">
			<Button on:click={saveTemplate} disabled={saving}>
				{#if saving}
					<Icon icon="mdi:loading" class="mr-2 h-4 w-4 animate-spin" />
					Saving...
				{:else}
					<Icon icon="mdi:content-save" class="mr-2 h-4 w-4" />
					Save Changes
				{/if}
			</Button>
		</div>
	</div>
	
	{#if error}
		<Alert variant="destructive" class="mb-4">
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}
	
	{#if saveSuccess}
		<Alert class="mb-4 bg-green-50 border-green-500 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300">
			<AlertDescription>Template saved successfully</AlertDescription>
		</Alert>
	{/if}
	
	{#if loading}
		<div class="flex justify-center py-12">
			<div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
		</div>
	{:else if template}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<div class="lg:col-span-2">
				<Card>
					<CardHeader>
						<CardTitle>Template Details</CardTitle>
						<CardDescription>Basic information about the template</CardDescription>
					</CardHeader>
					<CardContent>
						<div class="space-y-4">
							<div class="space-y-2">
								<Label for="title">Title *</Label>
								<Input
									id="title"
									type="text"
									bind:value={title}
									placeholder="Enter template title"
								/>
							</div>
							
							<div class="space-y-2">
								<Label for="description">Description</Label>
								<Textarea
									id="description"
									bind:value={description}
									placeholder="Enter template description"
								/>
							</div>
							
							<div class="space-y-2">
								<Label for="content">Content *</Label>
								<Textarea
									id="content"
									bind:value={content}
									placeholder="Enter template content with &#123;&#123;variables&#125;&#125;"
									class="min-h-[300px] font-mono"
								/>
								<p class="text-xs text-muted-foreground">
									Use "&#123;&#123;variable_name&#125;&#125;" syntax to define variables
								</p>
							</div>
							
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div class="space-y-2">
									<Label for="category">Category</Label>
									<div class="flex gap-2">
										<select
											id="category"
											class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1"
											bind:value={categoryId}
										>
											<option value="">None</option>
											{#each categories as category}
												<option value={category.id}>{category.name}</option>
											{/each}
										</select>
										<Button size="icon" variant="outline" title="Add Category" on:click={() => newCategoryDialogOpen = true}>
											<Icon icon="mdi:plus" class="h-4 w-4" />
										</Button>
									</div>
								</div>
								
								<div class="space-y-2 flex items-end">
									<div class="flex items-center space-x-2">
										<input
											type="checkbox"
											id="featured"
											bind:checked={featured}
											class="h-4 w-4 rounded border-gray-300 focus:ring-primary"
										/>
										<label for="featured" class="text-sm font-medium">
											Feature this template
										</label>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
			
			<div>
				<Card>
					<CardHeader>
						<div class="flex justify-between items-center">
							<CardTitle>Variables</CardTitle>
							<Button size="sm" variant="outline" on:click={() => openVariableDialog()}>
								<Icon icon="mdi:plus" class="mr-2 h-4 w-4" />
								Add Variable
							</Button>
						</div>
						<CardDescription>Variables extracted from template content</CardDescription>
					</CardHeader>
					<CardContent>
						{#if variables.length === 0}
							<div class="text-center py-4 text-muted-foreground">
								No variables found. Add variables using &#123;&#123;variable_name&#125;&#125; syntax in your template content.
							</div>
						{:else}
							<div class="space-y-2">
								{#each variables as variable}
									<div class="flex justify-between items-center p-2 border rounded-md">
										<div>
											<div class="font-medium">{variable.name}</div>
											{#if variable.description}
												<div class="text-sm text-muted-foreground">{variable.description}</div>
											{/if}
											{#if variable.default_value}
												<div class="text-xs">Default: {variable.default_value}</div>
											{/if}
										</div>
										<div class="flex gap-1">
											<Button size="icon" variant="ghost" title="Edit" on:click={() => openVariableDialog(variable)}>
												<Icon icon="mdi:pencil" class="h-4 w-4" />
											</Button>
											<Button size="icon" variant="ghost" title="Delete" on:click={() => confirmDeleteVariable(variable.id)}>
												<Icon icon="mdi:delete" class="h-4 w-4" />
											</Button>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</CardContent>
				</Card>
			</div>
		</div>
	{:else}
		<Alert variant="destructive">
			<AlertDescription>Template not found</AlertDescription>
		</Alert>
	{/if}
</div>

<!-- Variable Dialog -->
<Dialog.Root bind:open={variableDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>{editingVariable ? 'Edit Variable' : 'Add Variable'}</Dialog.Title>
			<Dialog.Description>
				{editingVariable ? 'Update variable details' : 'Add a new variable to the template'}
			</Dialog.Description>
		</Dialog.Header>
		
		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="variable-name">Name *</Label>
				<Input
					id="variable-name"
					type="text"
					bind:value={newVariableName}
					placeholder="variable_name"
					disabled={!!editingVariable}
				/>
				{#if editingVariable}
					<p class="text-xs text-muted-foreground">Variable name cannot be changed</p>
				{/if}
			</div>
			
			<div class="space-y-2">
				<Label for="variable-description">Description</Label>
				<Textarea
					id="variable-description"
					bind:value={newVariableDescription}
					placeholder="What this variable is used for"
				/>
			</div>
			
			<div class="space-y-2">
				<Label for="variable-default">Default Value</Label>
				<Input
					id="variable-default"
					type="text"
					bind:value={newVariableDefaultValue}
					placeholder="Default value (optional)"
				/>
			</div>
		</div>
		
		<Dialog.Footer>
			<Button 
				variant="outline" 
				on:click={() => variableDialogOpen = false}
			>
				Cancel
			</Button>
			<Button 
				type="button" 
				disabled={!newVariableName.trim()}
				on:click={saveVariable}
			>
				{editingVariable ? 'Update' : 'Add'} Variable
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Variable Confirmation Dialog -->
<Dialog.Root bind:open={deleteVariableDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete Variable</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete this variable? This will not remove it from your template content.
			</Dialog.Description>
		</Dialog.Header>
		
		<Dialog.Footer>
			<Button 
				variant="outline" 
				on:click={() => deleteVariableDialogOpen = false}
			>
				Cancel
			</Button>
			<Button 
				variant="destructive"
				on:click={deleteVariable}
			>
				Delete
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