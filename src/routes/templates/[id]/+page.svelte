<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	
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
	
	let template: Template | null = null;
	let variables: Variable[] = [];
	let variableValues: Record<string, string> = {};
	let generatedText = '';
	let loading = true;
	let error = '';
	let copySuccess = false;
	
	const templateId = $page.params.id;
	
	onMount(() => {
		checkAuth();
		fetchTemplateAndVariables();
	});
	
	async function checkAuth() {
		const { data: { session } } = await supabase.auth.getSession();
		
		if (!session) {
			goto('/auth/login');
		}
	}
	
	async function fetchTemplateAndVariables() {
		try {
			// Fetch template with category
			const { data: templateData, error: templateError } = await supabase
				.from('templates')
				.select('*, category:categories(*)')
				.eq('id', templateId)
				.single();
			
			if (templateError) {
				error = templateError.message;
				return;
			}
			
			template = templateData;
			
			// Fetch variables for this template
			const { data: variablesData, error: variablesError } = await supabase
				.from('variables')
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
			
			// Generate initial text
			generateText();
		} catch (e: any) {
			error = e.message;
		} finally {
			loading = false;
		}
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
	
	function handleVariableChange(variable: Variable, value: string) {
		variableValues[variable.name] = value;
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
			<div>
				<a href="/templates" class="text-muted-foreground hover:text-foreground">
					&larr; Back to Templates
				</a>
				<h1 class="text-2xl font-bold mt-2">{template.title}</h1>
				{#if template.description}
					<p class="text-muted-foreground mt-1">{template.description}</p>
				{/if}
			</div>
			<a 
				href={`/templates/${templateId}/edit`}
				class="px-4 py-2 bg-primary text-primary-foreground rounded-md"
			>
				Edit Template
			</a>
		</div>
		
		{#if template.category}
			<div class="mb-4">
				<span class="inline-block px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
					{template.category.name}
				</span>
			</div>
		{/if}
		
		<div class="flex flex-col md:flex-row gap-8">
			<div class="w-full md:w-1/3">
				<div class="bg-card rounded-md border p-4">
					<h2 class="font-semibold mb-4">Template Variables</h2>
					
					{#if variables.length === 0}
						<p class="text-muted-foreground">No variables found in this template.</p>
					{:else}
						<div class="space-y-4">
							{#each variables as variable}
								<div>
									<label for={variable.id} class="block text-sm font-medium mb-1">
										{variable.name}
										{#if variable.is_required}
											<span class="text-destructive">*</span>
										{/if}
										{#if variable.description}
											<span class="text-xs text-muted-foreground block">
												{variable.description}
											</span>
										{/if}
									</label>
									
									{#if variable.type === 'text'}
										<input
											id={variable.id}
											type="text"
											class="w-full p-2 border rounded-md"
											value={variableValues[variable.name] || ''}
											on:input={(e) => handleVariableChange(variable, e.currentTarget.value)}
										/>
									{:else if variable.type === 'textarea'}
										<textarea
											id={variable.id}
											class="w-full p-2 border rounded-md"
											rows="3"
											value={variableValues[variable.name] || ''}
											on:input={(e) => handleVariableChange(variable, e.currentTarget.value)}
										></textarea>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
				
				<div class="text-xs text-muted-foreground mt-2">
					<p>Created: {formatDate(template.created_at)}</p>
					<p>Last updated: {formatDate(template.updated_at)}</p>
				</div>
			</div>
			
			<div class="w-full md:w-2/3">
				<div class="bg-card rounded-md border p-4">
					<div class="flex items-center justify-between mb-4">
						<h2 class="font-semibold">Generated Text</h2>
						<button
							on:click={copyToClipboard}
							class="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
						>
							{copySuccess ? 'Copied!' : 'Copy to Clipboard'}
						</button>
					</div>
					
					<div class="border rounded-md p-4 whitespace-pre-wrap font-mono bg-muted min-h-[200px]">
						{generatedText}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div> 