<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent, CardHeader, CardFooter, CardTitle } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	// Import individual components directly to avoid import errors
	import { Root, Trigger, Content } from '$lib/components/ui/popover/index';
	// Import Iconify
	import Icon from '@iconify/svelte';
	import { getUserFriendlyErrorMessage } from '$lib/utils';
	
	interface Template {
		id: string;
		title: string;
		description: string | null;
		content: string;
		category: {
			id: string;
			name: string;
		} | null;
		created_at: string;
		updated_at: string;
	}
	
	interface Variable {
		id: string;
		name: string;
		description: string | null;
		type: string;
		default_value: string | null;
		is_required: boolean;
		value?: string;
	}
	
	interface ContentSegment {
		type: 'text' | 'variable';
		content: string;
		variable?: Variable;
	}
	
	interface Category {
		id: string;
		name: string;
	}
	
	let template: Template | null = null;
	let variables: Variable[] = [];
	let variableValues: Record<string, string> = {};
	let generatedText = '';
	let loading = true;
	let error = '';
	let copySuccess = false;
	let templateSegments: ContentSegment[] = [];
	
	// Authentication state
	let isAuthenticated = false;
	let userId = '';
	
	// Add to collection dialog
	let addToCollectionDialogOpen = false;
	let userCategories: Category[] = [];
	let selectedCategoryId = '';
	let newCategoryName = '';
	let createNewCategory = false;
	let addingToCollection = false;
	let addToCollectionError = '';
	let addToCollectionSuccess = false;
	
	const templateId = $page.params.id;
	
	onMount(() => {
		checkAuth();
		fetchTemplateAndVariables();
	});
	
	async function checkAuth() {
		const { data: { session } } = await supabase.auth.getSession();
		
		isAuthenticated = !!session;
		if (session) {
			userId = session.user.id;
			// If user is authenticated, fetch their categories
			await fetchUserCategories();
		}
	}
	
	async function fetchTemplateAndVariables() {
		try {
			// Fetch template with category
			const { data: templateData, error: templateError } = await supabase
				.from('directory_templates')
				.select('*, category:directory_categories(*)')
				.eq('id', templateId)
				.single();
			
			if (templateError) {
				error = templateError.message;
				return;
			}
			
			template = templateData;
			
			// Fetch variables for this template
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
			
			// Initialize variable values with defaults
			variables.forEach(variable => {
				variableValues[variable.name] = variable.default_value || '';
			});
			
			// Parse template content into segments
			parseTemplateContent();
			
			// Generate initial text
			generateText();
		} catch (e: any) {
			error = e.message;
		} finally {
			loading = false;
		}
	}
	
	async function fetchUserCategories() {
		if (!isAuthenticated) return;
		
		const { data, error: fetchError } = await supabase
			.from('categories')
			.select('*')
			.order('name');
		
		if (fetchError) {
			console.error('Error fetching user categories:', fetchError);
			return;
		}
		
		userCategories = data || [];
		if (userCategories.length > 0) {
			selectedCategoryId = userCategories[0].id;
		}
	}
	
	function parseTemplateContent() {
		if (!template) return;
		
		const segments: ContentSegment[] = [];
		let content = template.content;
		let lastIndex = 0;
		
		// Regular expression to find variable placeholders like {{variable_name}}
		const regex = /\{\{([^}]+)\}\}/g;
		let match;
		
		while ((match = regex.exec(content)) !== null) {
			const variableName = match[1];
			const matchedVariable = variables.find(v => v.name === variableName);
			
			// Add text before the variable
			if (match.index > lastIndex) {
				segments.push({
					type: 'text',
					content: content.substring(lastIndex, match.index)
				});
			}
			
			// Add the variable
			if (matchedVariable) {
				segments.push({
					type: 'variable',
					content: variableName,
					variable: matchedVariable
				});
			} else {
				// If variable not found, treat it as text
				segments.push({
					type: 'text',
					content: match[0]
				});
			}
			
			lastIndex = match.index + match[0].length;
		}
		
		// Add remaining text
		if (lastIndex < content.length) {
			segments.push({
				type: 'text',
				content: content.substring(lastIndex)
			});
		}
		
		templateSegments = segments;
	}
	
	function generateText() {
		if (!template) return;
		
		let text = template.content;
		for (const variable of variables) {
			const value = variableValues[variable.name] || '';
			// Replace all occurrences of {{variable_name}} with the value
			const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
			text = text.replace(regex, value);
		}
		
		generatedText = text;
	}
	
	// TypeScript safe function to handle variable value changes
	function handleVariableChange(variableName: string, value: string) {
		variableValues[variableName] = value;
		generateText();
	}
	
	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(generatedText);
			copySuccess = true;
			setTimeout(() => {
				copySuccess = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy: ', err);
		}
	}
	
	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
	}
	
	function getVariableDisplayValue(variable: Variable) {
		const value = variableValues[variable.name];
		if (!value) return `[${variable.name}]`;
		return value;
	}
	
	function openAddToCollectionDialog() {
		if (!isAuthenticated) {
			goto('/auth/login');
			return;
		}
		
		addToCollectionDialogOpen = true;
	}
	
	async function addToCollection() {
		if (!template || !isAuthenticated) return;
		
		try {
			addingToCollection = true;
			addToCollectionError = '';
			addToCollectionSuccess = false;
			
			// If creating new category
			let categoryId = selectedCategoryId;
			if (createNewCategory && newCategoryName.trim()) {
				const { data: newCategory, error: categoryError } = await supabase
					.from('categories')
					.insert({
						name: newCategoryName.trim(),
						user_id: userId
					})
					.select()
					.single();
				
				if (categoryError) {
					addToCollectionError = getUserFriendlyErrorMessage(categoryError);
					return;
				}
				
				categoryId = newCategory.id;
			}
			
			// Create a copy of the template in the user's collection
			const { data: newTemplate, error: templateError } = await supabase
				.from('templates')
				.insert({
					title: template.title,
					description: template.description,
					content: template.content,
					category_id: categoryId,
					user_id: userId
				})
				.select()
				.single();
			
			if (templateError) {
				addToCollectionError = templateError.message;
				return;
			}
			
			// Copy variables for the new template
			if (variables.length > 0 && newTemplate) {
				const newVariables = variables.map(variable => ({
					template_id: newTemplate.id,
					name: variable.name,
					description: variable.description,
					type: variable.type,
					default_value: variable.default_value,
					is_required: variable.is_required
				}));
				
				const { error: variablesError } = await supabase
					.from('variables')
					.insert(newVariables);
				
				if (variablesError) {
					console.error('Error copying variables:', variablesError);
					addToCollectionError = 'Failed to copy all variables. Template may be incomplete.';
					return;
				}
			}
			
			// Success!
			addToCollectionSuccess = true;
			
			// Reset form
			setTimeout(() => {
				addToCollectionDialogOpen = false;
				addToCollectionSuccess = false;
				createNewCategory = false;
				newCategoryName = '';
			}, 2000);
			
		} catch (e: any) {
			addToCollectionError = e.message || 'Failed to add template to collection';
		} finally {
			addingToCollection = false;
		}
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	{#if loading}
		<div class="flex justify-center py-12">
			<div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
		</div>
	{:else if error}
		<Alert variant="destructive" class="mb-4">
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{:else if template}
		<div class="flex items-center justify-between mb-6">
			<div>
				<a href="/directory" class="text-muted-foreground hover:text-foreground">
					&larr; Back to Directory
				</a>
				<h1 class="text-2xl font-bold mt-2">{template.title}</h1>
				{#if template.description}
					<p class="text-muted-foreground mt-1">{template.description}</p>
				{/if}
			</div>
			<div class="flex gap-2">
				<Button
					variant="default"
					size="sm"
					on:click={copyToClipboard}
					class="font-medium min-w-[140px]"
				>
					{#if copySuccess}
						<Icon icon="mdi:check" class="mr-2 h-4 w-4" />
						Copied!
					{:else}
						<Icon icon="mdi:content-copy" class="mr-2 h-4 w-4" />
						Copy to Clipboard
					{/if}
				</Button>
				
				{#if isAuthenticated}
					<Button
						variant="secondary"
						size="sm"
						on:click={openAddToCollectionDialog}
						class="min-w-[160px]"
					>
						<Icon icon="mdi:plus" class="mr-2 h-4 w-4" />
						Add to My Collection
					</Button>
				{:else}
					<Button
						variant="secondary"
						size="sm"
						on:click={() => goto('/auth/login')}
						class="min-w-[120px]"
					>
						<Icon icon="mdi:login" class="mr-2 h-4 w-4" />
						Sign In
					</Button>
				{/if}
			</div>
		</div>
		
		{#if template.category}
			<div class="mb-4">
				<Badge variant="secondary">
					{template.category.name}
				</Badge>
			</div>
		{/if}
		
		<Card class="mb-8">
			<CardContent class="p-6">
				<div class="text-xl leading-relaxed whitespace-pre-wrap">
					{#each templateSegments as segment}
						{#if segment.type === 'text'}
							<span>{segment.content}</span>
						{:else if segment.type === 'variable' && segment.variable}
							<Root>
								<Trigger>
									<button 
										class="inline-flex px-1 py-0.5 rounded bg-primary/10 border border-primary/20 font-semibold text-primary hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30"
									>
										{getVariableDisplayValue(segment.variable)}
									</button>
								</Trigger>
								<Content class="w-72 p-4">
									<div class="space-y-2">
										<Label for={segment.variable.id} class="font-medium">
											{segment.variable.name}
											{#if segment.variable.is_required}
												<span class="text-destructive">*</span>
											{/if}
										</Label>
										
										{#if segment.variable.description}
											<p class="text-xs text-muted-foreground mb-2">
												{segment.variable.description}
											</p>
										{/if}
										
										{#if segment.variable!.type === 'text'}
											<Input
												id={segment.variable!.id}
												type="text"
												value={variableValues[segment.variable!.name] || ''}
												on:input={(e) => handleVariableChange(segment.variable!.name, e.currentTarget.value)}
											/>
										{:else if segment.variable!.type === 'textarea'}
											<Textarea
												id={segment.variable!.id}
												value={variableValues[segment.variable!.name] || ''}
												on:input={(e) => handleVariableChange(segment.variable!.name, e.currentTarget.value)}
											/>
										{/if}
									</div>
								</Content>
							</Root>
						{/if}
					{/each}
				</div>
			</CardContent>
		</Card>
		
		<div class="text-sm text-muted-foreground mb-8">
			<p>From the Public Template Directory</p>
		</div>
		
		<div class="sticky bottom-8 flex justify-center z-10">
			<div class="flex flex-col sm:flex-row gap-3">
				<Button
					variant="default"
					size="lg"
					class="shadow-lg px-8 py-6"
					on:click={copyToClipboard}
				>
					{#if copySuccess}
						<Icon icon="mdi:check" class="mr-2 h-5 w-5" />
						Copied to Clipboard! ✓
					{:else}
						<Icon icon="mdi:content-copy" class="mr-2 h-5 w-5" />
						Copy to Clipboard
					{/if}
				</Button>
				
				{#if isAuthenticated}
					<Button
						variant="secondary"
						size="lg"
						class="shadow-lg px-8 py-6"
						on:click={openAddToCollectionDialog}
					>
						<Icon icon="mdi:plus" class="mr-2 h-5 w-5" />
						Add to My Collection
					</Button>
				{:else}
					<Button
						variant="secondary"
						size="lg"
						class="shadow-lg px-8 py-6"
						on:click={() => goto('/auth/login')}
					>
						<Icon icon="mdi:login" class="mr-2 h-5 w-5" />
						Sign In to Save
					</Button>
				{/if}
			</div>
		</div>
	{/if}
</div>

<!-- Add to Collection Dialog -->
<Dialog.Root bind:open={addToCollectionDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Add to My Collection</Dialog.Title>
			<Dialog.Description>
				Add this template to your personal collection for easy access and customization.
			</Dialog.Description>
		</Dialog.Header>
		
		{#if addToCollectionError}
			<Alert variant="destructive" class="mb-4">
				<AlertDescription>{addToCollectionError}</AlertDescription>
			</Alert>
		{/if}
		
		{#if addToCollectionSuccess}
			<Alert class="mb-4 bg-green-50 text-green-800 border-green-300">
				<AlertDescription>
					Template successfully added to your collection!
				</AlertDescription>
			</Alert>
		{:else}
			<div class="space-y-4 py-4">
				<div class="space-y-2">
					<Label for="category-select">Add to Category</Label>
					<div class="grid grid-cols-1 gap-4">
						{#if !createNewCategory && userCategories.length > 0}
							<select
								id="category-select"
								class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1"
								bind:value={selectedCategoryId}
							>
								{#each userCategories as category}
									<option value={category.id}>{category.name}</option>
								{/each}
							</select>
						{/if}
						
						{#if !createNewCategory && userCategories.length === 0}
							<p class="text-sm text-muted-foreground">You don't have any categories yet</p>
						{/if}
						
						{#if createNewCategory || userCategories.length === 0}
							<div class="space-y-2">
								<Label for="new-category-name">New Category Name</Label>
								<Input
									id="new-category-name"
									type="text"
									bind:value={newCategoryName}
									placeholder="Enter category name"
								/>
							</div>
						{/if}
						
						{#if userCategories.length > 0}
							<div class="flex items-center space-x-2">
								<input
									type="checkbox"
									id="create-new-category"
									bind:checked={createNewCategory}
									class="h-4 w-4 rounded border-gray-300 focus:ring-primary"
								/>
								<label for="create-new-category" class="text-sm font-medium">
									Create a new category
								</label>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
		
		<Dialog.Footer>
			<Button 
				variant="outline" 
				on:click={() => addToCollectionDialogOpen = false}
				disabled={addingToCollection || addToCollectionSuccess}
			>
				{addToCollectionSuccess ? 'Close' : 'Cancel'}
			</Button>
			{#if !addToCollectionSuccess}
				<Button 
					type="button" 
					disabled={addingToCollection || (createNewCategory && !newCategoryName)}
					on:click={addToCollection}
				>
					{addingToCollection ? 'Adding...' : 'Add to Collection'}
				</Button>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root> 