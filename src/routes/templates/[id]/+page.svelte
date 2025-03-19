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
		created_at: string;
		updated_at: string;
		category_id: string | null;
		category_name?: string;
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
	let variables: Variable[] = [];
	let variableValues: Record<string, string> = {};
	let generatedText = '';
	let loading = true;
	let error = '';
	let copied = false;
	
	const templateId = $page.params.id;
	
	onMount(() => {
		checkAuth();
		fetchTemplate();
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
				.select(`
					*,
					categories(name)
				`)
				.eq('id', templateId)
				.single();
			
			if (templateError) {
				error = templateError.message;
				return;
			}
			
			if (data) {
				template = {
					...data,
					category_name: data.categories?.name
				};
				
				// Fetch variables
				const { data: variablesData, error: variablesError } = await supabase
					.from('variables')
					.select('*')
					.eq('template_id', templateId)
					.order('name');
				
				if (variablesError) {
					console.error('Error fetching variables:', variablesError);
				} else if (variablesData) {
					variables = variablesData;
					
					// Initialize variable values with defaults
					variablesData.forEach(variable => {
						variableValues[variable.name] = variable.default_value || '';
					});
					
					// Generate the initial text
					generateText();
				}
			}
		} catch (e: any) {
			error = e.message || 'Failed to load template';
		} finally {
			loading = false;
		}
	}
	
	function generateText() {
		if (!template) return;
		
		let text = template.content;
		
		// Replace variables with their values
		for (const [name, value] of Object.entries(variableValues)) {
			const regex = new RegExp(`\\{\\{${name}\\}\\}`, 'g');
			text = text.replace(regex, value || `{{${name}}}`);
		}
		
		generatedText = text;
	}
	
	function handleVariableChange() {
		generateText();
	}
	
	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(generatedText);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (e) {
			console.error('Failed to copy text:', e);
		}
	}
	
	function handleEdit() {
		goto(`/templates/${templateId}/edit`);
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
				<a href="/templates" class="mr-4 text-muted-foreground hover:text-foreground">
					&larr; Back to Templates
				</a>
				<h1 class="text-2xl font-bold">{template.title}</h1>
			</div>
			<button 
				on:click={handleEdit}
				class="px-4 py-2 bg-secondary text-secondary-foreground rounded-md"
			>
				Edit Template
			</button>
		</div>
		
		{#if template.description}
			<p class="text-muted-foreground mb-6">{template.description}</p>
		{/if}
		
		<div class="flex flex-col lg:flex-row gap-6">
			<div class="w-full lg:w-1/2 space-y-4">
				<div class="border rounded-md p-4">
					<h2 class="text-lg font-medium mb-4">Variables</h2>
					
					{#if variables.length === 0}
						<p class="text-muted-foreground">No variables defined in this template.</p>
					{:else}
						<div class="space-y-3">
							{#each variables as variable}
								<div>
									<label for={variable.name} class="block text-sm font-medium mb-1">
										{variable.name}
										{#if variable.is_required}<span class="text-destructive">*</span>{/if}
									</label>
									<input
										id={variable.name}
										type="text"
										bind:value={variableValues[variable.name]}
										on:input={handleVariableChange}
										class="w-full p-2 border rounded-md"
										placeholder={variable.description || `Enter value for ${variable.name}`}
									/>
								</div>
							{/each}
						</div>
					{/if}
				</div>
				
				<div class="border rounded-md p-4">
					<div class="flex justify-between items-center mb-2">
						<h2 class="text-lg font-medium">Template Information</h2>
					</div>
					<div class="text-sm text-muted-foreground">
						<p>Created: {formatDate(template.created_at)}</p>
						<p>Last Updated: {formatDate(template.updated_at)}</p>
						{#if template.category_name}
							<p>Category: {template.category_name}</p>
						{/if}
					</div>
				</div>
			</div>
			
			<div class="w-full lg:w-1/2">
				<div class="border rounded-md p-4 h-full flex flex-col">
					<div class="flex justify-between items-center mb-4">
						<h2 class="text-lg font-medium">Generated Text</h2>
						<button 
							on:click={copyToClipboard}
							class="text-sm px-3 py-1 bg-primary text-primary-foreground rounded-md"
						>
							{copied ? 'Copied!' : 'Copy to Clipboard'}
						</button>
					</div>
					
					<div class="flex-grow bg-muted/20 p-3 rounded-md whitespace-pre-wrap font-mono text-sm overflow-y-auto">
						{generatedText}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div> 