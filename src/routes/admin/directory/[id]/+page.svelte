<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Textarea } from '$lib/components/ui/textarea';
	import Icon from '@iconify/svelte';
	import type { PageData, ActionData } from './$types';

	type Variable = PageData['variables'][number];

	export let data: PageData;
	export let form: ActionData;

	$: categories = data.categories;
	$: variables = data.variables as Variable[];

	let title = data.template.title;
	let description = data.template.description ?? '';
	let content = data.template.content;
	let categoryId = data.template.category_id ?? '';
	let featured = !!data.template.featured;

	let saving = false;

	// Variable dialog
	let variableDialogOpen = false;
	let editingVariable: Variable | null = null;
	let newVariableName = '';
	let newVariableDescription = '';
	let newVariableDefaultValue = '';

	let deleteVariableDialogOpen = false;
	let deleteVariableId = '';

	// Category dialog
	let newCategoryDialogOpen = false;
	let newCategoryName = '';
	let newCategoryDescription = '';
	let savingCategory = false;

	$: templateError = form && form.scope === 'template' ? form.error : '';
	$: templateSaved = !!(form && form.scope === 'template' && form.success);
	$: variableError = form && form.scope === 'variable' ? form.error : '';
	$: categoryError = form && form.scope === 'category' ? form.error : '';

	function openVariableDialog(variable: Variable | null = null) {
		editingVariable = variable;
		newVariableName = variable?.name ?? '';
		newVariableDescription = variable?.description ?? '';
		newVariableDefaultValue = variable?.default_value ?? '';
		variableDialogOpen = true;
	}

	function confirmDeleteVariable(id: string) {
		deleteVariableId = id;
		deleteVariableDialogOpen = true;
	}
</script>

<div>
	<div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
		<div class="space-y-2">
			<Button variant="outline" on:click={() => goto('/admin/directory')} class="w-full sm:w-auto mb-2">
				<Icon icon="mdi:arrow-left" class="mr-2 h-4 w-4" />
				Back to Directory
			</Button>
			<h1 class="text-2xl sm:text-3xl font-bold">Edit Template</h1>
		</div>

		<div class="flex gap-2 lg:self-end md:self-end">
			<Button type="submit" form="template-form" disabled={saving} class="w-full sm:w-auto">
				{#if saving}
					<Icon icon="mdi:loading" class="mr-2 h-4 w-4 animate-spin" />
					Saving...
				{:else}
					<Icon icon="mdi:content-save" class="mr-2 h-4 w-4" />
					Save Changes
				{/if}
			</Button>
		</div>
	</div>

	{#if templateError}
		<Alert variant="destructive" class="mb-4"><AlertDescription>{templateError}</AlertDescription></Alert>
	{/if}
	{#if templateSaved}
		<Alert class="mb-4 bg-green-50 border-green-500 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300">
			<AlertDescription>Template saved successfully</AlertDescription>
		</Alert>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
		<div class="lg:col-span-2">
			<Card>
				<CardHeader>
					<CardTitle>Template Details</CardTitle>
					<CardDescription>Basic information about the template</CardDescription>
				</CardHeader>
				<CardContent class="p-4 sm:p-6">
					<form
						id="template-form"
						method="POST"
						action="?/saveTemplate"
						class="space-y-4"
						use:enhance={() => {
							saving = true;
							return async ({ update }) => {
								await update({ reset: false });
								saving = false;
							};
						}}
					>
						<input type="hidden" name="featured" value={featured ? 'true' : 'false'} />

						<div class="space-y-2">
							<Label for="title">Title *</Label>
							<Input id="title" name="title" type="text" bind:value={title} placeholder="Enter template title" />
						</div>

						<div class="space-y-2">
							<Label for="description">Description</Label>
							<Textarea id="description" name="description" bind:value={description} placeholder="Enter template description" />
						</div>

						<div class="space-y-2">
							<Label for="content">Content *</Label>
							<Textarea id="content" name="content" bind:value={content} placeholder="Enter template content with {'{{variables}}'}" class="min-h-[300px] font-mono" />
							<p class="text-xs text-muted-foreground">Use {'{{variable_name}}'} syntax to define variables</p>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div class="space-y-2">
								<Label for="category">Category</Label>
								<div class="flex gap-2">
									<select id="category" name="category_id" class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1" bind:value={categoryId}>
										<option value="">None</option>
										{#each categories as category (category.id)}
											<option value={category.id}>{category.name}</option>
										{/each}
									</select>
									<Button type="button" size="icon" variant="outline" title="Add Category" on:click={() => (newCategoryDialogOpen = true)}>
										<Icon icon="mdi:plus" class="h-4 w-4" />
									</Button>
								</div>
							</div>

							<div class="space-y-2 flex items-end">
								<div class="flex items-center space-x-2">
									<input type="checkbox" id="featured" bind:checked={featured} class="h-4 w-4 rounded border-gray-300 focus:ring-primary" />
									<label for="featured" class="text-sm font-medium">Feature this template</label>
								</div>
							</div>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>

		<div>
			<Card>
				<CardHeader>
					<div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
						<CardTitle>Variables</CardTitle>
						<Button size="sm" variant="outline" on:click={() => openVariableDialog()} class="w-full sm:w-auto">
							<Icon icon="mdi:plus" class="mr-2 h-4 w-4" />
							Add Variable
						</Button>
					</div>
					<CardDescription>Variables extracted from template content</CardDescription>
				</CardHeader>
				<CardContent class="p-4 sm:p-6">
					{#if variableError}
						<Alert variant="destructive" class="mb-3"><AlertDescription>{variableError}</AlertDescription></Alert>
					{/if}
					{#if variables.length === 0}
						<div class="text-center py-4 text-muted-foreground">
							No variables found. Add variables using {'{{variable_name}}'} syntax in your template content.
						</div>
					{:else}
						<div class="space-y-2">
							{#each variables as variable (variable.id)}
								<div class="flex justify-between items-center p-2 border rounded-md">
									<div>
										<div class="font-medium">{variable.name}</div>
										{#if variable.description}
											<div class="text-sm text-muted-foreground">{variable.description}</div>
										{/if}
										{#if variable.default_value}
											<div class="text-xs">Default: {variable.default_value}</div>
										{/if}
									</div>
									<div class="flex gap-1">
										<Button size="icon" variant="ghost" title="Edit" on:click={() => openVariableDialog(variable)}>
											<Icon icon="mdi:pencil" class="h-4 w-4" />
										</Button>
										<Button size="icon" variant="ghost" title="Delete" on:click={() => confirmDeleteVariable(variable.id)}>
											<Icon icon="mdi:delete" class="h-4 w-4" />
										</Button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
	</div>
</div>

<!-- Variable Dialog -->
<Dialog.Root bind:open={variableDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>{editingVariable ? 'Edit Variable' : 'Add Variable'}</Dialog.Title>
			<Dialog.Description>{editingVariable ? 'Update variable details' : 'Add a new variable to the template'}</Dialog.Description>
		</Dialog.Header>

		<form
			method="POST"
			action={editingVariable ? '?/updateVariable' : '?/createVariable'}
			use:enhance={() => {
				return async ({ result, update }) => {
					await update({ reset: false });
					if (result.type === 'success') variableDialogOpen = false;
				};
			}}
		>
			{#if editingVariable}
				<input type="hidden" name="id" value={editingVariable.id} />
			{/if}

			<div class="space-y-4 py-4">
				<div class="space-y-2">
					<Label for="variable-name">Name *</Label>
					<Input id="variable-name" name="name" type="text" bind:value={newVariableName} placeholder="variable_name" disabled={!!editingVariable} />
					{#if editingVariable}
						<input type="hidden" name="name" value={newVariableName} />
						<p class="text-xs text-muted-foreground">Variable name cannot be changed</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="variable-description">Description</Label>
					<Textarea id="variable-description" name="description" bind:value={newVariableDescription} placeholder="What this variable is used for" />
				</div>

				<div class="space-y-2">
					<Label for="variable-default">Default Value</Label>
					<Input id="variable-default" name="default_value" type="text" bind:value={newVariableDefaultValue} placeholder="Default value (optional)" />
				</div>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" on:click={() => (variableDialogOpen = false)}>Cancel</Button>
				<Button type="submit" disabled={!newVariableName.trim()}>{editingVariable ? 'Update' : 'Add'} Variable</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Variable Confirmation Dialog -->
<Dialog.Root bind:open={deleteVariableDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete Variable</Dialog.Title>
			<Dialog.Description>Are you sure you want to delete this variable? This will not remove it from your template content.</Dialog.Description>
		</Dialog.Header>

		<Dialog.Footer>
			<Button type="button" variant="outline" on:click={() => (deleteVariableDialogOpen = false)}>Cancel</Button>
			<form
				method="POST"
				action="?/deleteVariable"
				use:enhance={() => {
					return async ({ update }) => {
						await update({ reset: false });
						deleteVariableDialogOpen = false;
					};
				}}
			>
				<input type="hidden" name="id" value={deleteVariableId} />
				<Button type="submit" variant="destructive">Delete</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- New Category Dialog -->
<Dialog.Root bind:open={newCategoryDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Create New Category</Dialog.Title>
			<Dialog.Description>Add a new category to organize directory templates</Dialog.Description>
		</Dialog.Header>

		{#if categoryError}
			<Alert variant="destructive" class="mb-4"><AlertDescription>{categoryError}</AlertDescription></Alert>
		{/if}

		<form
			method="POST"
			action="?/createCategory"
			use:enhance={() => {
				savingCategory = true;
				return async ({ result, update }) => {
					await update({ reset: false });
					if (result.type === 'success' && result.data?.categoryId) {
						categoryId = String(result.data.categoryId);
						newCategoryName = '';
						newCategoryDescription = '';
						newCategoryDialogOpen = false;
					}
					savingCategory = false;
				};
			}}
		>
			<div class="space-y-4 py-4">
				<div class="space-y-2">
					<Label for="category-name">Name *</Label>
					<Input id="category-name" name="name" type="text" bind:value={newCategoryName} placeholder="Enter category name" />
				</div>

				<div class="space-y-2">
					<Label for="category-description">Description</Label>
					<Textarea id="category-description" name="description" bind:value={newCategoryDescription} placeholder="Enter category description (optional)" />
				</div>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" on:click={() => (newCategoryDialogOpen = false)}>Cancel</Button>
				<Button type="submit" disabled={savingCategory || !newCategoryName.trim()}>
					{savingCategory ? 'Creating...' : 'Create Category'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
