<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent, CardHeader, CardFooter, CardTitle } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';
	import { Root, Trigger, Content } from '$lib/components/ui/popover/index';
	import Icon from '@iconify/svelte';
	import { logger } from '$lib/utils/logger';
	import {
		parseTemplateContent as parseSegments,
		generateText as renderText,
		type ContentSegment
	} from '$lib/utils/template';
	import type { PageData, ActionData } from './$types';

	type Variable = PageData['variables'][number];

	export let data: PageData;
	export let form: ActionData;

	$: template = data.template;
	$: variables = data.variables;

	let variableValues: Record<string, string> = {};
	let generatedText = '';
	let templateSegments: ContentSegment<Variable>[] = [];
	let copySuccess = false;
	let duplicating = false;
	let deleting = false;
	let deleteModalOpen = false;

	// Initialise the fill-in state once per loaded template.
	let initializedId: string | null = null;
	$: if (template && template.id !== initializedId) {
		initializedId = template.id;
		variableValues = {};
		for (const variable of variables) {
			variableValues[variable.name] = variable.default_value || '';
		}
		templateSegments = parseSegments(template.content, variables);
		generatedText = renderText(template.content, variableValues);
	}

	function handleVariableChange(variableName: string, value: string) {
		variableValues[variableName] = value;
		generatedText = renderText(template.content, variableValues);
	}

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(generatedText);
			copySuccess = true;
			setTimeout(() => (copySuccess = false), 2000);
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
	{#if form?.error}
		<Alert variant="destructive">
			<AlertDescription>{form.error}</AlertDescription>
		</Alert>
	{/if}

	{#if template}
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
				<Badge variant="secondary">{template.category.name}</Badge>
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
											<p class="text-xs text-muted-foreground mb-2">{segment.variable.description}</p>
										{/if}

										{#if segment.variable.type === 'text'}
											<Input
												id={segment.variable.id}
												type="text"
												value={variableValues[segment.variable.name] || ''}
												on:input={(e) => handleVariableChange(segment.variable!.name, e.currentTarget.value)}
											/>
										{:else if segment.variable.type === 'textarea'}
											<Textarea
												id={segment.variable.id}
												value={variableValues[segment.variable.name] || ''}
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
				<form
					method="POST"
					action="?/duplicate"
					use:enhance={() => {
						duplicating = true;
						return async ({ update }) => {
							await update();
							duplicating = false;
						};
					}}
					class="flex-1 sm:flex-none"
				>
					<Button variant="outline" type="submit" disabled={duplicating} class="w-full">
						<Icon icon="mdi:content-duplicate" class="h-5 w-5 sm:mr-2" />
						<span class="hidden sm:inline">{duplicating ? 'Duplicating...' : 'Duplicate'}</span>
					</Button>
				</form>
				<a href={`/templates/${template.id}/edit`} class="flex-1 sm:flex-none">
					<Button variant="secondary" class="w-full">
						<Icon icon="mdi:pencil" class="h-5 w-5 sm:mr-2" />
						<span class="hidden sm:inline">Edit Template</span>
					</Button>
				</a>
				<Button variant="destructive" on:click={() => (deleteModalOpen = true)} class="flex-1 sm:flex-none">
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
					<Button variant="outline" on:click={() => (deleteModalOpen = false)} class="sm:mr-2 w-full sm:w-auto">
						Cancel
					</Button>
					<form
						method="POST"
						action="?/delete"
						use:enhance={() => {
							deleting = true;
							return async ({ update }) => {
								await update();
								deleting = false;
							};
						}}
						class="w-full sm:w-auto"
					>
						<Button variant="destructive" type="submit" disabled={deleting} class="w-full">
							{deleting ? 'Deleting...' : 'Delete Template'}
						</Button>
					</form>
				</CardFooter>
			</Card>
		</div>
	{/if}
</div>
