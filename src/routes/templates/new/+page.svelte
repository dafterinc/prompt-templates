<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardHeader, CardFooter } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { getUserFriendlyErrorMessage } from '$lib/utils';
	
	interface Category {
		id: string;
		name: string;
	}
	
	let title = '';
	let description = '';
	let content = '';
	let categoryId = '';
	let categories: Category[] = [];
	let loading = false;
	let error = '';
	let userId = '';
	
	// For new category dialog
	let newCategoryDialogOpen = false;
	let newCategoryName = '';
	let newCategoryDescription = '';
	let savingCategory = false;
	let categoryError = '';
	
	onMount(() => {
		checkAuth();
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
	
	async function fetchCategories() {
		const { data, error: fetchError } = await supabase
			.from('categories')
			.select('*')
			.order('name');
		
		if (fetchError) {
			error = fetchError.message;
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
			loading = true;
			error = '';
			
			// Create the template
			const { data: template, error: templateError } = await supabase
				.from('templates')
				.insert({
					title,
					description: description || null,
					content,
					category_id: categoryId || null,
					user_id: userId
				})
				.select()
				.single();
			
			if (templateError) {
				error = templateError.message;
				return;
			}
			
			// Parse variables from content
			const variableMatches = content.match(/\{\{([^}]+)\}\}/g);
			
			if (variableMatches && template) {
				// Extract unique variable names
				const uniqueVars = [...new Set(
					variableMatches.map(match => {
						// Remove {{ and }} and trim whitespace
						return match.replace(/\{\{|\}\}/g, '').trim();
					})
				)];
				
				// Create variables for the template
				if (uniqueVars.length > 0) {
					const variables = uniqueVars.map(name => ({
						template_id: template.id,
						name,
						type: 'text',
						is_required: false
					}));
					
					const { error: variablesError } = await supabase
						.from('variables')
						.insert(variables);
					
					if (variablesError) {
						console.error('Error creating variables:', variablesError);
					}
				}
			}
			
			// Redirect to the template detail page
			if (template) {
				goto(`/templates/${template.id}`);
			}
		} catch (e: any) {
			error = e.message || 'Failed to create template';
		} finally {
			loading = false;
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
			newCategoryDescription = '';
			
			// Refresh categories and select the new one
			await fetchCategories();
			
			if (data) {
				categoryId = data.id;
			}
		} catch (e: any) {
			categoryError = getUserFriendlyErrorMessage(e);
		} finally {
			savingCategory = false;
		}
	}
</script>

<div class="container mx-auto px-4 py-6 max-w-4xl">
	<Card>
		<CardHeader>
			<div class="flex flex-col gap-4">
				<div>
					<a href="/templates" class="text-muted-foreground hover:text-foreground inline-flex items-center">
						&larr; <span class="ml-1">Back to Templates</span>
					</a>
				</div>
				<div class="flex justify-between items-center">
					<h1 class="text-xl sm:text-2xl font-bold">Create New Template</h1>
				</div>
			</div>
		</CardHeader>
		
		<CardContent>
			{#if error}
				<Alert variant="destructive" class="mb-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			{/if}
			
			<form on:submit|preventDefault={handleSubmit} class="space-y-6 max-w-2xl">
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
				
				<div>
					<Button
						type="submit"
						disabled={loading}
						class="w-full sm:w-auto"
					>
						{loading ? 'Creating...' : 'Create Template'}
					</Button>
				</div>
			</form>
		</CardContent>
	</Card>
</div>

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