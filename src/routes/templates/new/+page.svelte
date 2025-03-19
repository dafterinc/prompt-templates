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
	<Card>
		<CardHeader>
			<div class="flex items-center mb-2">
				<a href="/templates" class="mr-4 text-muted-foreground hover:text-foreground">
					&larr; Back to Templates
				</a>
				<h1 class="text-2xl font-bold">Create New Template</h1>
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
				
				<div>
					<Button
						type="submit"
						disabled={loading}
					>
						{loading ? 'Creating...' : 'Create Template'}
					</Button>
				</div>
			</form>
		</CardContent>
	</Card>
</div> 