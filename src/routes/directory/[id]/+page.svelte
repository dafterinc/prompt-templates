<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
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
	$: variables = data.variables as Variable[];
	$: isAuthenticated = data.isAuthenticated;
	$: userCategories = data.userCategories;

	let variableValues: Record<string, string> = {};
	let generatedText = '';
	let templateSegments: ContentSegment<Variable>[] = [];
	let copySuccess = false;

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
			logger.error('Failed to copy: ', err, 'directory');
		}
	}

	function getVariableDisplayValue(variable: Variable) {
		const value = variableValues[variable.name];
		if (!value) return `[${variable.name}]`;
		return value;
	}

	// Add to collection dialog
	let dialogOpen = false;
	let createNew = false;
	let selectedCategoryId = '';
	let newCategoryName = '';
	let adding = false;

	$: if (userCategories.length > 0 && !selectedCategoryId) {
		selectedCategoryId = userCategories[0].id;
	}

	function openDialog() {
		if (!isAuthenticated) {
			goto('/auth/login');
			return;
		}
		if (userCategories.length === 0) createNew = true;
		dialogOpen = true;
	}
</script>

<div class="space-y-4 px-4 py-4 sm:px-6 sm:py-6 max-w-4xl mx-auto">
	{#if template}
		<div class="space-y-3">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<div>
					<a href="/directory" class="text-muted-foreground hover:text-foreground inline-flex items-center">
						&larr; <span class="ml-1">Back to Directory</span>
					</a>
				</div>
				<div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
					<Button variant="default" size="sm" on:click={copyToClipboard} class="font-medium min-w-0 sm:min-w-[140px] flex-1 sm:flex-none">
						{#if copySuccess}
							<Icon icon="mdi:check" class="mr-2 h-4 w-4" />
							Copied!
						{:else}
							<Icon icon="mdi:content-copy" class="mr-2 h-4 w-4" />
							Copy to Clipboard
						{/if}
					</Button>

					{#if isAuthenticated}
						<Button variant="secondary" size="sm" on:click={openDialog} class="min-w-0 sm:min-w-[160px] flex-1 sm:flex-none">
							<Icon icon="mdi:plus" class="mr-2 h-4 w-4" />
							Add to My Collection
						</Button>
					{:else}
						<Button variant="secondary" size="sm" on:click={() => goto('/auth/login')} class="min-w-0 sm:min-w-[120px] flex-1 sm:flex-none">
							<Icon icon="mdi:login" class="mr-2 h-4 w-4" />
							Sign In
						</Button>
					{/if}
				</div>
			</div>
			<div>
				<h1 class="text-xl sm:text-2xl font-bold">{template.title}</h1>
				{#if template.description}
					<p class="text-muted-foreground mt-1">{template.description}</p>
				{/if}
			</div>
		</div>

		{#if template.category}
			<div class="mb-4">
				<Badge variant="secondary">{template.category.name}</Badge>
			</div>
		{/if}

		<Card class="mb-2">
			<CardContent class="p-6">
				<div class="text-xl leading-relaxed whitespace-pre-wrap">
					{#each templateSegments as segment}
						{#if segment.type === 'text'}
							<span>{segment.content}</span>
						{:else if segment.type === 'variable' && segment.variable}
							<Root>
								<Trigger>
									<button class="inline-flex px-1 py-0.5 rounded bg-primary/10 border border-primary/20 font-semibold text-primary hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30">
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

		<div class="text-sm text-muted-foreground mb-8">
			<p>From the Public Template Directory</p>
		</div>

		<div class="sticky bottom-8 flex justify-center z-10">
			<div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
				<Button variant="default" size="lg" class="shadow-lg px-4 sm:px-8 py-6" on:click={copyToClipboard}>
					{#if copySuccess}
						<Icon icon="mdi:check" class="mr-2 h-5 w-5" />
						Copied to Clipboard! ✓
					{:else}
						<Icon icon="mdi:content-copy" class="mr-2 h-5 w-5" />
						Copy to Clipboard
					{/if}
				</Button>

				{#if isAuthenticated}
					<Button variant="secondary" size="lg" class="shadow-lg px-4 sm:px-8 py-6" on:click={openDialog}>
						<Icon icon="mdi:plus" class="mr-2 h-5 w-5" />
						Add to My Collection
					</Button>
				{:else}
					<Button variant="secondary" size="lg" class="shadow-lg px-4 sm:px-8 py-6" on:click={() => goto('/auth/login')}>
						<Icon icon="mdi:login" class="mr-2 h-5 w-5" />
						Sign In to Save
					</Button>
				{/if}
			</div>
		</div>
	{/if}
</div>

<!-- Add to Collection Dialog -->
<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Add to My Collection</Dialog.Title>
			<Dialog.Description>Add this template to your personal collection for easy access and customization.</Dialog.Description>
		</Dialog.Header>

		{#if form?.error}
			<Alert variant="destructive" class="mb-4"><AlertDescription>{form.error}</AlertDescription></Alert>
		{/if}

		<form
			method="POST"
			action="?/addToCollection"
			use:enhance={() => {
				adding = true;
				return async ({ result, update }) => {
					await update({ reset: false });
					if (result.type === 'success') {
						dialogOpen = false;
						createNew = false;
						newCategoryName = '';
					}
					adding = false;
				};
			}}
		>
			<input type="hidden" name="create_new" value={createNew || userCategories.length === 0 ? 'true' : 'false'} />

			<div class="space-y-4 py-4">
				<div class="space-y-2">
					<Label for="category-select">Add to Category</Label>
					<div class="grid grid-cols-1 gap-4">
						{#if !createNew && userCategories.length > 0}
							<select
								id="category-select"
								name="category_id"
								class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1"
								bind:value={selectedCategoryId}
							>
								{#each userCategories as category (category.id)}
									<option value={category.id}>{category.name}</option>
								{/each}
							</select>
						{/if}

						{#if !createNew && userCategories.length === 0}
							<p class="text-sm text-muted-foreground">You don't have any categories yet</p>
						{/if}

						{#if createNew || userCategories.length === 0}
							<div class="space-y-2">
								<Label for="new-category-name">New Category Name</Label>
								<Input id="new-category-name" name="new_category_name" type="text" bind:value={newCategoryName} placeholder="Enter category name" />
							</div>
						{/if}

						{#if userCategories.length > 0}
							<div class="flex items-center space-x-2">
								<input type="checkbox" id="create-new-category" bind:checked={createNew} class="h-4 w-4 rounded border-gray-300 focus:ring-primary" />
								<label for="create-new-category" class="text-sm font-medium">Create a new category</label>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<Dialog.Footer class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 sm:justify-end">
				<Button type="button" variant="outline" on:click={() => (dialogOpen = false)} disabled={adding} class="sm:mr-2 w-full sm:w-auto">Cancel</Button>
				<Button type="submit" disabled={adding || ((createNew || userCategories.length === 0) && !newCategoryName.trim())} class="w-full sm:w-auto">
					{adding ? 'Adding...' : 'Add to Collection'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
