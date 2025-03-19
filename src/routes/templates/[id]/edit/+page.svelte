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
		<Alert variant="destructive" class="mb-4">
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{:else if template}
		<Card>
			<CardHeader>
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<a href={`/templates/${templateId}`} class="mr-4 text-muted-foreground hover:text-foreground">
							&larr; Back to Template
						</a>
						<CardTitle class="text-2xl">Edit Template</CardTitle>
					</div>
					<Button 
						variant="destructive"
						on:click={() => deleteModalOpen = true}
					>
						Delete Template
					</Button>
				</div>
			</CardHeader>
			
			<CardContent>
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
						<Label for="category">Category</Label>
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
					
					<div class="flex justify-end">
						<Button
							type="submit"
							disabled={saving}
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
				<CardFooter class="flex justify-end gap-3">
					<Button 
						variant="outline" 
						on:click={() => deleteModalOpen = false}
					>
						Cancel
					</Button>
					<Button 
						variant="destructive"
						on:click={handleDelete}
						disabled={saving}
					>
						{saving ? 'Deleting...' : 'Delete Template'}
					</Button>
				</CardFooter>
			</Card>
		</div>
	{/if}
</div> 