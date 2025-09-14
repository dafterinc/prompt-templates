<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { getUserFriendlyErrorMessage } from '$lib/utils';
	import { logger } from '$lib/utils/logger';
	import Icon from '@iconify/svelte';
	
	interface Template {
		id: string;
		title: string;
		description: string | null;
		content: string;
		category_id: string | null;
	}
	
	interface Category {
		id: string;
		name: string;
	}
	
	interface Variable {
		id: string;
		name: string;
		description: string | null;
		type: string;
		default_value: string | null;
		is_required: boolean;
	}
	
	let template: Template | null = null;
	let originalContent = '';
	let title = '';
	let description = '';
	let content = '';
	let categoryId = '';
	let categories: Category[] = [];
	let loading = true;
	let saving = false;
	let error = '';
	let deleteModalOpen = false;
	let userId = '';
	
	// For new category dialog
	let newCategoryDialogOpen = false;
	let newCategoryName = '';
	let newCategoryDescription = '';
	let savingCategory = false;
	let categoryError = '';
	
	const templateId = $page.params.id;
	
	onMount(() => {
		checkAuth();
		fetchTemplate();
		fetchCategories();
	});
	
	async function checkAuth() {
		const { data: { session } } = await supabase.auth.getSession();
		
		if (!session) {
			goto('/auth/login');
		} else {
			userId = session.user.id;
		}
	}
	
	async function fetchTemplate() {
		try {
			// Fetch template details
			const { data, error: templateError } = await supabase
				.from('templates')
				.select('*')
				.eq('id', templateId)
				.single();
			
			if (templateError) {
				error = templateError.message;
				return;
			}
			
			if (data) {
				template = data;
				title = data.title;
				description = data.description || '';
				content = data.content;
				originalContent = data.content;
				categoryId = data.category_id || '';
			}
		} catch (e: any) {
			error = e.message || 'Failed to load template';
		} finally {
			loading = false;
		}
	}
	
	async function fetchCategories() {
		const { data, error: fetchError } = await supabase
			.from('categories')
			.select('*')
			.order('name');
		
		if (fetchError) {
			logger.error('Error fetching categories:', fetchError, 'templates');
			return;
		}
		
		if (data) {
			categories = data;
		}
	}
	
	async function handleSubmit() {
		if (!title || !content) {
			error = 'Title and content are required';
			return;
		}
		
		try {
			saving = true;
			error = '';
			
			// Update the template
			const { error: updateError } = await supabase
				.from('templates')
				.update({
					title,
					description: description || null,
					content,
					category_id: categoryId || null,
					updated_at: new Date().toISOString()
				})
				.eq('id', templateId);
			
			if (updateError) {
				error = updateError.message;
				return;
			}
			
			// Check if content changed to update variables
			if (content !== originalContent) {
				// Parse variables from content
				const variableMatches = content.match(/\{\{([^}]+)\}\}/g);
				
				if (variableMatches) {
					// Extract unique variable names
					const uniqueVars = [...new Set(
						variableMatches.map(match => {
							// Remove {{ and }} and trim whitespace
							return match.replace(/\{\{|\}\}/g, '').trim();
						})
					)];
					
					// Get existing variables
					const { data: existingVars } = await supabase
						.from('variables')
						.select('name')
						.eq('template_id', templateId);
					
					const existingVarNames = new Set((existingVars || []).map((v: any) => v.name));
					
					// Find new variables to add
					const newVars = uniqueVars.filter(name => !existingVarNames.has(name));
					
					// Create variables for the template
					if (newVars.length > 0) {
						const variables = newVars.map(name => ({
							template_id: templateId,
							name,
							type: 'text',
							is_required: false
						}));
						
						const { error: variablesError } = await supabase
							.from('variables')
							.insert(variables);
						
						if (variablesError) {
							logger.error('Error creating variables:', variablesError, 'templates');
						}
					}
					
					// Find variables to delete (they were in the original but not in the new content)
					const deletedVars = Array.from(existingVarNames).filter(name => !uniqueVars.includes(name));
					
					if (deletedVars.length > 0) {
						for (const name of deletedVars) {
							const { error: deleteError } = await supabase
								.from('variables')
								.delete()
								.eq('template_id', templateId)
								.eq('name', name);
							
							if (deleteError) {
								logger.error(`Error deleting variable ${name}:`, deleteError, 'templates');
							}
						}
					}
				}
			}
			
			// Redirect to the template detail page
			goto(`/templates/${templateId}`);
		} catch (e: any) {
			error = e.message || 'Failed to update template';
		} finally {
			saving = false;
		}
	}
	
	async function handleDelete() {
		try {
			saving = true;
			error = '';
			
			// Delete the template (variables will be deleted via cascade)
			const { error: deleteError } = await supabase
				.from('templates')
				.delete()
				.eq('id', templateId);
			
			if (deleteError) {
				error = deleteError.message;
				return;
			}
			
			// Redirect to templates list
			goto('/templates');
		} catch (e: any) {
			error = e.message || 'Failed to delete template';
		} finally {
			saving = false;
			deleteModalOpen = false;
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

<svelte:head>
	<title>{template?.title ? `Edit ${template.title} | Prompt Templates` : 'Edit Template | Prompt Templates'}</title>
</svelte:head>

<div class="space-y-4">
	{#if loading}
		<div class="flex items-center justify-center p-8">
			<div class="animate-spin mr-2">
				<Icon icon="heroicons:arrow-path" width="24" height="24" />
			</div>
			<span>Loading template...</span>
		</div>
	{:else if error && !template}
		<Alert variant="destructive">
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{:else if template}
		<div class="space-y-3">
			<div>
				<a href={`/templates/${templateId}`} class="text-muted-foreground hover:text-foreground inline-flex items-center">
					&larr; <span class="ml-1">Back to Template</span>
				</a>
			</div>
			
			<div>
				<h1 class="text-2xl sm:text-3xl font-bold tracking-tight">Edit Template</h1>
			</div>
		</div>
		
		{#if error}
			<Alert variant="destructive">
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		{/if}
		
		<Card>
			<CardContent class="p-4 sm:p-6">
				<form on:submit|preventDefault={handleSubmit} class="space-y-4 sm:space-y-6">
					<div class="space-y-2">
						<Label for="title">Title *</Label>
						<Input
							id="title"
							type="text"
							bind:value={title}
							required
							placeholder="Enter template title"
						/>
					</div>
					
					<div class="space-y-2">
						<Label for="description">Description</Label>
						<Textarea
							id="description"
							bind:value={description}
							placeholder="Enter optional description"
						/>
					</div>
					
					<div class="space-y-2">
						<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
							<Label for="category">Category</Label>
							<Button 
								type="button" 
								variant="outline" 
								size="sm" 
								on:click={() => newCategoryDialogOpen = true}
								class="sm:w-auto w-full"
							>
								+ New Category
							</Button>
						</div>
						<div class="w-full p-0 border rounded-md bg-background text-foreground">
							<select
								id="category"
								bind:value={categoryId}
								class="w-full p-2 bg-transparent border-0 outline-none focus:ring-0"
							>
								<option value="" class="bg-background text-foreground">No Category</option>
								{#each categories as category}
									<option value={category.id} class="bg-background text-foreground">{category.name}</option>
								{/each}
							</select>
						</div>
					</div>
					
					<div class="space-y-2">
						<Label for="content">
							Content *
							<span class="text-xs font-normal text-muted-foreground">
								(Use double curly braces syntax to define variables)
							</span>
						</Label>
						<Textarea
							id="content"
							bind:value={content}
							required
							class="font-mono min-h-[200px]"
							placeholder="Enter template content with variables enclosed in double curly braces"
						/>
					</div>
					
					<div class="flex flex-col sm:flex-row sm:justify-between gap-3">
						<Button
							variant="destructive"
							type="button"
							on:click={() => deleteModalOpen = true}
							class="w-full sm:w-auto order-2 sm:order-1"
						>
							Delete Template
						</Button>
						<Button
							type="submit"
							disabled={saving}
							class="w-full sm:w-auto order-1 sm:order-2"
						>
							{saving ? 'Saving...' : 'Save Changes'}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	{/if}
	
	{#if deleteModalOpen}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
			<Card class="max-w-md w-full">
				<CardHeader>
					<CardTitle>Delete Template</CardTitle>
				</CardHeader>
				<CardContent>
					<p>Are you sure you want to delete this template? This action cannot be undone.</p>
				</CardContent>
				<CardFooter class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 sm:justify-end">
					<Button 
						variant="outline" 
						on:click={() => deleteModalOpen = false}
						class="sm:mr-2 w-full sm:w-auto"
					>
						Cancel
					</Button>
					<Button 
						variant="destructive"
						on:click={handleDelete}
						disabled={saving}
						class="w-full sm:w-auto"
					>
						{saving ? 'Deleting...' : 'Delete Template'}
					</Button>
				</CardFooter>
			</Card>
		</div>
	{/if}
	
	<!-- New Category Dialog -->
	<Dialog.Root bind:open={newCategoryDialogOpen}>
		<Dialog.Content class="sm:max-w-md">
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
			
			<Dialog.Footer class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 sm:justify-end">
				<Button 
					variant="outline" 
					on:click={() => newCategoryDialogOpen = false}
					class="sm:mr-2 w-full sm:w-auto"
				>
					Cancel
				</Button>
				<Button 
					type="button" 
					disabled={savingCategory || !newCategoryName.trim()}
					on:click={createCategory}
					class="w-full sm:w-auto"
				>
					{savingCategory ? 'Creating...' : 'Create Category'}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</div> 