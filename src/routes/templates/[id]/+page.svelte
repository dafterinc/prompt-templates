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
	
	interface ContentSegment {
		type: 'text' | 'variable';
		content: string;
		variable?: Variable;
	}
	
	let template: Template | null = null;
	let variables: Variable[] = [];
	let variableValues: Record<string, string> = {};
	let generatedText = '';
	let loading = true;
	let error = '';
	let copySuccess = false;
	let templateSegments: ContentSegment[] = [];
	let activeVariable: Variable | null = null;
	
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
	
	// Function to safely handle variables
	function safeHandleVariableClick(variable: Variable | undefined) {
		if (variable) {
			setActiveVariable(variable);
		}
	}
	
	function handleVariableChange(variable: Variable, value: string) {
		variableValues[variable.name] = value;
		generateText();
	}
	
	function setActiveVariable(variable: Variable | null) {
		activeVariable = variable;
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
				<a href="/templates" class="text-muted-foreground hover:text-foreground">
					&larr; Back to Templates
				</a>
				<h1 class="text-2xl font-bold mt-2">{template.title}</h1>
				{#if template.description}
					<p class="text-muted-foreground mt-1">{template.description}</p>
				{/if}
			</div>
			<div class="flex gap-2">
				<Button
					variant="secondary"
					size="sm"
					on:click={copyToClipboard}
				>
					{copySuccess ? 'Copied!' : 'Copy to Clipboard'}
				</Button>
				<a href={`/templates/${templateId}/edit`}>
					<Button size="sm">Edit Template</Button>
				</a>
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
							<button 
								class="inline-flex px-1 py-0.5 rounded bg-primary/10 border border-primary/20 font-semibold text-primary hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30"
								on:click={() => safeHandleVariableClick(segment.variable)}
							>
								{getVariableDisplayValue(segment.variable)}
							</button>
						{/if}
					{/each}
				</div>
				
				{#if activeVariable}
					<div class="mt-6 p-4 border border-primary/20 rounded-md bg-primary/5">
						<div class="flex items-center justify-between mb-2">
							<Label for={activeVariable.id} class="font-medium text-base">
								{activeVariable.name}
								{#if activeVariable.is_required}
									<span class="text-destructive">*</span>
								{/if}
							</Label>
							<button 
								class="text-sm text-muted-foreground hover:text-foreground"
								on:click={() => setActiveVariable(null)}
							>
								Close
							</button>
						</div>
						
						{#if activeVariable.description}
							<p class="text-sm text-muted-foreground mb-2">
								{activeVariable.description}
							</p>
						{/if}
						
						{#if activeVariable.type === 'text'}
							<Input
								id={activeVariable.id}
								type="text"
								value={variableValues[activeVariable.name] || ''}
								on:input={(e) => handleVariableChange(activeVariable, e.currentTarget.value)}
							/>
						{:else if activeVariable.type === 'textarea'}
							<Textarea
								id={activeVariable.id}
								value={variableValues[activeVariable.name] || ''}
								on:input={(e) => handleVariableChange(activeVariable, e.currentTarget.value)}
							/>
						{/if}
					</div>
				{/if}
			</CardContent>
		</Card>
		
		<div class="text-sm text-muted-foreground">
			<p>Last updated: {formatDate(template.updated_at)}</p>
		</div>
	{/if}
</div> 