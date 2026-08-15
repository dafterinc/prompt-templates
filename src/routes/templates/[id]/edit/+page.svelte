<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Dialog from '$lib/components/ui/dialog';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	$: categories = data.categories;

	let title = data.template.title;
	let description = data.template.description ?? '';
	let content = data.template.content;
	let categoryId = data.template.category_id ?? '';
	const originalContent = data.template.content;
	const templateId = data.template.id;

	let saving = false;
	let deleting = false;
	let deleteModalOpen = false;

	// New category dialog
	let newCategoryDialogOpen = false;
	let newCategoryName = '';
	let savingCategory = false;

	$: updateError = form && form.scope !== 'category' ? form.error : '';
	$: categoryError = form && form.scope === 'category' ? form.error : '';
</script>

<svelte:head>
	<title>Edit {data.template.title} | Prompt Templates</title>
</svelte:head>

<div class="space-y-4">
	<div class="space-y-3">
		<div>
			<a href={`/templates/${templateId}`} class="text-muted-foreground hover:text-foreground inline-flex items-center">
				&larr; <span class="ml-1">Back to Template</span>
			</a>
		</div>

		<div>
			<h1 class="text-2xl sm:text-3xl font-bold tracking-tight">Edit Template</h1>
		</div>
	</div>

	{#if updateError}
		<Alert variant="destructive">
			<AlertDescription>{updateError}</AlertDescription>
		</Alert>
	{/if}

	<Card>
		<CardContent class="p-4 sm:p-6">
			<form
				method="POST"
				action="?/update"
				class="space-y-4 sm:space-y-6"
				use:enhance={() => {
					saving = true;
					return async ({ update }) => {
						await update({ reset: false });
						saving = false;
					};
				}}
			>
				<input type="hidden" name="previous_content" value={originalContent} />

				<div class="space-y-2">
					<Label for="title">Title *</Label>
					<Input id="title" name="title" type="text" bind:value={title} required placeholder="Enter template title" />
				</div>

				<div class="space-y-2">
					<Label for="description">Description</Label>
					<Textarea id="description" name="description" bind:value={description} placeholder="Enter optional description" />
				</div>

				<div class="space-y-2">
					<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
						<Label for="category">Category</Label>
						<Button type="button" variant="outline" size="sm" on:click={() => (newCategoryDialogOpen = true)} class="sm:w-auto w-full">
							+ New Category
						</Button>
					</div>
					<div class="w-full p-0 border rounded-md bg-background text-foreground">
						<select id="category" name="category_id" bind:value={categoryId} class="w-full p-2 bg-transparent border-0 outline-none focus:ring-0">
							<option value="" class="bg-background text-foreground">No Category</option>
							{#each categories as category}
								<option value={category.id} class="bg-background text-foreground">{category.name}</option>
							{/each}
						</select>
					</div>
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
						name="content"
						bind:value={content}
						required
						class="font-mono min-h-[200px]"
						placeholder="Enter template content with variables enclosed in double curly braces"
					/>
				</div>

				<div class="flex flex-col sm:flex-row sm:justify-between gap-3">
					<Button variant="destructive" type="button" on:click={() => (deleteModalOpen = true)} class="w-full sm:w-auto order-2 sm:order-1">
						Delete Template
					</Button>
					<Button type="submit" disabled={saving} class="w-full sm:w-auto order-1 sm:order-2">
						{saving ? 'Saving...' : 'Save Changes'}
					</Button>
				</div>
			</form>
		</CardContent>
	</Card>

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

	<!-- New Category Dialog -->
	<Dialog.Root bind:open={newCategoryDialogOpen}>
		<Dialog.Content class="sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title>Create New Category</Dialog.Title>
				<Dialog.Description>Add a new category to organize your templates.</Dialog.Description>
			</Dialog.Header>

			{#if categoryError}
				<Alert variant="destructive" class="mb-4">
					<AlertDescription>{categoryError}</AlertDescription>
				</Alert>
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
							newCategoryDialogOpen = false;
						}
						savingCategory = false;
					};
				}}
			>
				<div class="space-y-4 py-4">
					<div class="space-y-2">
						<Label for="new-category-name">Name *</Label>
						<Input id="new-category-name" name="name" type="text" bind:value={newCategoryName} placeholder="Enter category name" required />
					</div>
				</div>

				<Dialog.Footer class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 sm:justify-end">
					<Button type="button" variant="outline" on:click={() => (newCategoryDialogOpen = false)} class="sm:mr-2 w-full sm:w-auto">
						Cancel
					</Button>
					<Button type="submit" disabled={savingCategory || !newCategoryName.trim()} class="w-full sm:w-auto">
						{savingCategory ? 'Creating...' : 'Create Category'}
					</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
</div>
