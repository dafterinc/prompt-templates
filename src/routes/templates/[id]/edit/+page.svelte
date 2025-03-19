<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	
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
			console.error('Error fetching categories:', fetchError);
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
							console.error('Error creating variables:', variablesError);
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
								console.error(`Error deleting variable ${name}:`, deleteError);
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
</script>

<div>
	{#if loading}
		<div class="flex justify-center py-12">
			<div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
		</div>
	{:else if error}
		<div class="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
			{error}
		</div>
	{:else if template}
		<div class="flex items-center justify-between mb-6">
			<div class="flex items-center">
				<a href={`/templates/${templateId}`} class="mr-4 text-muted-foreground hover:text-foreground">
					&larr; Back to Template
				</a>
				<h1 class="text-2xl font-bold">Edit Template</h1>
			</div>
			<button 
				on:click={() => deleteModalOpen = true}
				class="px-4 py-2 bg-destructive text-destructive-foreground rounded-md"
			>
				Delete Template
			</button>
		</div>
		
		<form on:submit|preventDefault={handleSubmit} class="space-y-4 max-w-2xl">
			<div>
				<label for="title" class="block text-sm font-medium mb-1">Title *</label>
				<input
					id="title"
					type="text"
					bind:value={title}
					required
					class="w-full p-2 border rounded-md"
					placeholder="Enter template title"
				/>
			</div>
			
			<div>
				<label for="description" class="block text-sm font-medium mb-1">Description</label>
				<textarea
					id="description"
					bind:value={description}
					rows="3"
					class="w-full p-2 border rounded-md"
					placeholder="Enter optional description"
				></textarea>
			</div>
			
			<div>
				<label for="category" class="block text-sm font-medium mb-1">Category</label>
				<select
					id="category"
					bind:value={categoryId}
					class="w-full p-2 border rounded-md"
				>
					<option value="">No Category</option>
					{#each categories as category}
						<option value={category.id}>{category.name}</option>
					{/each}
				</select>
			</div>
			
			<div>
				<label for="content" class="block text-sm font-medium mb-1">
					Content *
					<span class="text-xs font-normal text-muted-foreground">
						(Use double curly braces syntax to define variables)
					</span>
				</label>
				<textarea
					id="content"
					bind:value={content}
					rows="10"
					required
					class="w-full p-2 border rounded-md font-mono"
					placeholder="Enter template content with variables enclosed in double curly braces"
				></textarea>
			</div>
			
			<div class="flex justify-end">
				<button
					type="submit"
					disabled={saving}
					class="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-70"
				>
					{saving ? 'Saving...' : 'Save Changes'}
				</button>
			</div>
		</form>
	{/if}
	
	{#if deleteModalOpen}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
			<div class="bg-background rounded-lg p-6 max-w-md w-full">
				<h2 class="text-xl font-bold mb-4">Delete Template</h2>
				<p class="mb-6">Are you sure you want to delete this template? This action cannot be undone.</p>
				<div class="flex justify-end gap-3">
					<button 
						on:click={() => deleteModalOpen = false}
						class="px-4 py-2 border rounded-md"
					>
						Cancel
					</button>
					<button 
						on:click={handleDelete}
						disabled={saving}
						class="px-4 py-2 bg-destructive text-destructive-foreground rounded-md disabled:opacity-70"
					>
						{saving ? 'Deleting...' : 'Delete Template'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div> 