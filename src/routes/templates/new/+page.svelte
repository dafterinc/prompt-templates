<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
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
</script>

<div>
	<div class="flex items-center mb-6">
		<a href="/templates" class="mr-4 text-muted-foreground hover:text-foreground">
			&larr; Back to Templates
		</a>
		<h1 class="text-2xl font-bold">Create New Template</h1>
	</div>
	
	{#if error}
		<div class="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
			{error}
		</div>
	{/if}
	
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
		
		<div>
			<button
				type="submit"
				disabled={loading}
				class="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-70"
			>
				{loading ? 'Creating...' : 'Create Template'}
			</button>
		</div>
	</form>
</div> 