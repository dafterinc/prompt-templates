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
		<Alert variant="destructive" class="mb-4">
			<AlertDescription>{error}</AlertDescription>
		</Alert>
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
			<a href={`/templates/${templateId}/edit`}>
				<Button>Edit Template</Button>
			</a>
		</div>
		
		{#if template.category}
			<div class="mb-4">
				<Badge variant="secondary">
					{template.category.name}
				</Badge>
			</div>
		{/if}
		
		<div class="flex flex-col md:flex-row gap-8">
			<div class="w-full md:w-1/3">
				<Card>
					<CardHeader>
						<CardTitle class="text-lg">Template Variables</CardTitle>
					</CardHeader>
					<CardContent>
						{#if variables.length === 0}
							<p class="text-muted-foreground">No variables found in this template.</p>
						{:else}
							<div class="space-y-4">
								{#each variables as variable}
									<div>
										<Label for={variable.id} class="block mb-1">
											{variable.name}
											{#if variable.is_required}
												<span class="text-destructive">*</span>
											{/if}
											{#if variable.description}
												<span class="text-xs text-muted-foreground block">
													{variable.description}
												</span>
											{/if}
										</Label>
										
										{#if variable.type === 'text'}
											<Input
												id={variable.id}
												type="text"
												value={variableValues[variable.name] || ''}
												on:input={(e) => handleVariableChange(variable, e.currentTarget.value)}
											/>
										{:else if variable.type === 'textarea'}
											<Textarea
												id={variable.id}
												value={variableValues[variable.name] || ''}
												on:input={(e) => handleVariableChange(variable, e.currentTarget.value)}
											/>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					</CardContent>
					
					<CardFooter>
						<div class="text-xs text-muted-foreground w-full">
							<p>Created: {formatDate(template.created_at)}</p>
							<p>Last updated: {formatDate(template.updated_at)}</p>
						</div>
					</CardFooter>
				</Card>
			</div>
			
			<div class="w-full md:w-2/3">
				<Card>
					<CardHeader>
						<div class="flex items-center justify-between">
							<CardTitle class="text-lg">Generated Text</CardTitle>
							<Button 
								variant="secondary" 
								size="sm"
								on:click={copyToClipboard}
							>
								{copySuccess ? 'Copied!' : 'Copy to Clipboard'}
							</Button>
						</div>
					</CardHeader>
					
					<CardContent>
						<div class="border rounded-md p-4 whitespace-pre-wrap font-mono bg-muted min-h-[200px]">
							{generatedText}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	{/if}
</div> 