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
	// Import individual components directly to avoid import errors
	import { Root, Trigger, Content } from '$lib/components/ui/popover/index';
	// Import Iconify
	import Icon from '@iconify/svelte';
	import { logger } from '$lib/utils/logger';
	
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
	let duplicating = false;
	let deleteModalOpen = false;
	let deleting = false;
	
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
	
	async function duplicateTemplate() {
		if (!template) return;
		
		try {
			duplicating = true;
			error = '';
			
			// Get current user's session
			const { data: { session } } = await supabase.auth.getSession();
			if (!session) {
				goto('/auth/login');
				return;
			}
			
			// Create a new template as a copy of the current one
			const { data: newTemplate, error: templateError } = await supabase
				.from('templates')
				.insert({
					title: `${template.title} (Copy)`,
					description: template.description,
					content: template.content,
					category_id: template.category?.id || null,
					user_id: session.user.id
				})
				.select()
				.single();
			
			if (templateError) {
				error = templateError.message;
				return;
			}
			
			// Duplicate variables for the new template
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
					logger.error('Error duplicating variables:', variablesError, 'templates');
				}
			}
			
			// Navigate to the new template
			if (newTemplate) {
				goto(`/templates/${newTemplate.id}`);
			}
		} catch (e: any) {
			error = e.message || 'Failed to duplicate template';
		} finally {
			duplicating = false;
		}
	}
	
	async function handleDelete() {
		try {
			deleting = true;
			error = '';
			
			// Delete associated variables first
			const { error: variablesError } = await supabase
				.from('variables')
				.delete()
				.eq('template_id', templateId);
			
			if (variablesError) {
				error = variablesError.message;
				return;
			}
			
			// Then delete the template
			const { error: templateError } = await supabase
				.from('templates')
				.delete()
				.eq('id', templateId);
			
			if (templateError) {
				error = templateError.message;
				return;
			}
			
			// Navigate back to templates list
			goto('/templates');
		} catch (e: any) {
			error = e.message || 'Failed to delete template';
		} finally {
			deleting = false;
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
			logger.error('Failed to copy: ', err, 'templates');
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

<svelte:head>
	<title>{template?.title ? `${template.title} | Prompt Templates` : 'Template | Prompt Templates'}</title>
</svelte:head>

<div class="space-y-4">
	{#if loading}
		<div class="flex items-center justify-center p-8">
			<div class="animate-spin mr-2">
				<Icon icon="heroicons:arrow-path" width="24" height="24" />
			</div>
			<span>Loading template...</span>
		</div>
	{:else if error}
		<Alert variant="destructive">
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{:else if template}
		<div class="space-y-3">
			<div>
				<a href="/templates" class="text-muted-foreground hover:text-foreground inline-flex items-center">
					&larr; <span class="ml-1">Back to Templates</span>
				</a>
			</div>
			
			<div>
				<h1 class="text-2xl sm:text-3xl font-bold tracking-tight">{template.title}</h1>
				{#if template.description}
					<p class="text-muted-foreground mt-1">{template.description}</p>
				{/if}
			</div>
		</div>
		
		{#if template.category}
			<div>
				<Badge variant="secondary">
					{template.category.name}
				</Badge>
			</div>
		{/if}
		
		<Card>
			<CardContent class="p-4 sm:p-6">
				<div class="text-lg sm:text-xl leading-relaxed whitespace-pre-wrap">
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
		
		<div class="text-sm text-muted-foreground">
			<p>Last updated: {formatDate(template.updated_at)}</p>
		</div>
		
		<div class="space-y-4">
			<div>
				<div class="text-center">
					<Button
						variant="default"
						size="lg"
						class="w-full sm:w-auto px-4 sm:px-8 py-3 sm:py-6"
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
				</div>
			</div>
			
			<div class="flex gap-2 sm:justify-center">
				<Button
					variant="outline"
					on:click={duplicateTemplate}
					disabled={duplicating}
					class="flex-1 sm:flex-none"
				>
					<Icon icon="mdi:content-duplicate" class="h-5 w-5 sm:mr-2" />
					<span class="hidden sm:inline">{duplicating ? 'Duplicating...' : 'Duplicate'}</span>
				</Button>
				<a href={`/templates/${templateId}/edit`} class="flex-1 sm:flex-none">
					<Button 
						variant="secondary" 
						class="w-full"
					>
						<Icon icon="mdi:pencil" class="h-5 w-5 sm:mr-2" />
						<span class="hidden sm:inline">Edit Template</span>
					</Button>
				</a>
				<Button
					variant="destructive"
					on:click={() => deleteModalOpen = true}
					class="flex-1 sm:flex-none"
				>
					<Icon icon="mdi:delete" class="h-5 w-5 sm:mr-2" />
					<span class="hidden sm:inline">Delete Template</span>
				</Button>
			</div>
		</div>
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
				<CardFooter class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 sm:justify-end">
					<Button 
						variant="outline" 
						on:click={() => deleteModalOpen = false}
						class="sm:mr-2 w-full sm:w-auto"
					>
						Cancel
					</Button>
					<Button 
						variant="destructive"
						on:click={handleDelete}
						disabled={deleting}
						class="w-full sm:w-auto"
					>
						{deleting ? 'Deleting...' : 'Delete Template'}
					</Button>
				</CardFooter>
			</Card>
		</div>
	{/if}
</div> 