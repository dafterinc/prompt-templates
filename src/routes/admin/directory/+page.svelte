<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Textarea } from '$lib/components/ui/textarea';
	import Icon from '@iconify/svelte';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	$: templates = data.templates;
	$: categories = data.categories;

	// Dialogs
	let newTemplateDialogOpen = false;
	let newCategoryDialogOpen = false;
	let editCategoryDialogOpen = false;
	let deleteTemplateDialogOpen = false;
	let deleteCategoryDialogOpen = false;
	let importExportDialogOpen = false;

	// New template
	let newTemplateTitle = '';
	let newTemplateDescription = '';
	let newTemplateContent = '';
	let newTemplateCategoryId = '';
	let newTemplateFeatured = false;
	let savingTemplate = false;
	$: if (categories.length > 0 && !newTemplateCategoryId) newTemplateCategoryId = categories[0].id;

	// New / edit category
	let newCategoryName = '';
	let newCategoryDescription = '';
	let savingCategory = false;
	let editCategoryId = '';
	let editCategoryName = '';
	let editCategoryDescription = '';
	let savingEditCategory = false;

	// Delete targets
	let deleteTemplateId = '';
	let deleteTemplateName = '';
	let deleteCategoryId = '';
	let deleteCategoryName = '';

	let importing = false;

	$: templateError = form && form.scope === 'template' ? form.error : '';
	$: categoryError = form && form.scope === 'category' ? form.error : '';
	$: editCategoryError = form && form.scope === 'editCategory' ? form.error : '';
	$: generalError = form && !form.scope ? form.error : '';
	$: importResult = (form && form.scope === 'import' ? form : null) as
		| { successCount: number; errorCount: number; errors: string[] }
		| null;

	function openEditCategory(category: { id: string; name: string; description: string | null }) {
		editCategoryId = category.id;
		editCategoryName = category.name;
		editCategoryDescription = category.description ?? '';
		editCategoryDialogOpen = true;
	}

	function confirmDeleteTemplate(t: { id: string; title: string }) {
		deleteTemplateId = t.id;
		deleteTemplateName = t.title;
		deleteTemplateDialogOpen = true;
	}

	function confirmDeleteCategory(c: { id: string; name: string }) {
		deleteCategoryId = c.id;
		deleteCategoryName = c.name;
		deleteCategoryDialogOpen = true;
	}
</script>

<div>
	<div class="flex flex-col gap-4 mb-4">
		<h1 class="text-2xl sm:text-3xl font-bold">Template Directory Admin</h1>
		<div class="flex flex-col md:flex-row gap-2 w-full sm:justify-end">
			<Button on:click={() => goto('/admin')} variant="outline" class="w-full sm:w-auto">
				<Icon icon="mdi:arrow-left" class="mr-2 h-4 w-4" />
				Back to Dashboard
			</Button>
			<Button on:click={() => (importExportDialogOpen = true)} variant="outline" class="w-full sm:w-auto">
				<Icon icon="mdi:import" class="mr-2 h-4 w-4" />
				Import/Export
			</Button>
			<Button on:click={() => (newCategoryDialogOpen = true)} variant="outline" class="w-full sm:w-auto">
				<Icon icon="mdi:folder-plus" class="mr-2 h-4 w-4" />
				New Category
			</Button>
			<Button on:click={() => (newTemplateDialogOpen = true)} class="w-full sm:w-auto">
				<Icon icon="mdi:file-plus" class="mr-2 h-4 w-4" />
				New Template
			</Button>
		</div>
	</div>

	{#if generalError}
		<Alert variant="destructive" class="mb-4"><AlertDescription>{generalError}</AlertDescription></Alert>
	{/if}

	<Tabs.Root value="templates" class="w-full">
		<Tabs.List>
			<Tabs.Trigger value="templates">Templates</Tabs.Trigger>
			<Tabs.Trigger value="categories">Categories</Tabs.Trigger>
		</Tabs.List>

		<div class="mt-4">
			<Tabs.Content value="templates">
				{#if templates.length === 0}
					<div class="text-center py-12 border rounded-md bg-muted/20">
						<h2 class="text-xl font-medium mb-2">No templates</h2>
						<p class="text-muted-foreground mb-4">Create your first directory template to get started</p>
						<Button on:click={() => (newTemplateDialogOpen = true)}>
							<Icon icon="mdi:file-plus" class="mr-2 h-4 w-4" />
							New Template
						</Button>
					</div>
				{:else}
					<div class="grid gap-4">
						{#each templates as template (template.id)}
							<Card class="hover:shadow-md transition-shadow duration-200">
								<CardHeader>
									<div class="flex justify-between items-start">
										<div>
											<CardTitle>{template.title}</CardTitle>
											{#if template.description}
												<CardDescription>{template.description}</CardDescription>
											{/if}
										</div>
										<div class="flex gap-1">
											<form method="POST" action="?/toggleFeatured" use:enhance>
												<input type="hidden" name="id" value={template.id} />
												<input type="hidden" name="featured" value={template.featured ? 'false' : 'true'} />
												<Button size="icon" type="submit" variant={template.featured ? 'default' : 'outline'} title={template.featured ? 'Unfeature' : 'Feature'}>
													<Icon icon="mdi:star" class="h-4 w-4" />
												</Button>
											</form>
											<Button size="icon" variant="outline" title="Edit" on:click={() => goto(`/admin/directory/${template.id}`)}>
												<Icon icon="mdi:pencil" class="h-4 w-4" />
											</Button>
											<Button size="icon" variant="destructive" title="Delete" on:click={() => confirmDeleteTemplate(template)}>
												<Icon icon="mdi:delete" class="h-4 w-4" />
											</Button>
										</div>
									</div>
								</CardHeader>
								<CardFooter>
									<div class="flex gap-2 items-center">
										{#if template.category_name}
											<Badge variant="secondary">{template.category_name}</Badge>
										{/if}
										{#if template.featured}
											<Badge variant="default">Featured</Badge>
										{/if}
									</div>
								</CardFooter>
							</Card>
						{/each}
					</div>
				{/if}
			</Tabs.Content>

			<Tabs.Content value="categories">
				{#if categories.length === 0}
					<div class="text-center py-12 border rounded-md bg-muted/20">
						<h2 class="text-xl font-medium mb-2">No categories</h2>
						<p class="text-muted-foreground mb-4">Create your first directory category to get started</p>
						<Button on:click={() => (newCategoryDialogOpen = true)}>
							<Icon icon="mdi:folder-plus" class="mr-2 h-4 w-4" />
							New Category
						</Button>
					</div>
				{:else}
					<div class="grid gap-4">
						{#each categories as category (category.id)}
							<Card class="hover:shadow-md transition-shadow duration-200">
								<CardHeader>
									<div class="flex justify-between items-start">
										<div>
											<CardTitle>{category.name}</CardTitle>
											{#if category.description}
												<CardDescription>{category.description}</CardDescription>
											{/if}
										</div>
										<div class="flex gap-1">
											<Button size="icon" variant="outline" title="Edit" on:click={() => openEditCategory(category)}>
												<Icon icon="mdi:pencil" class="h-4 w-4" />
											</Button>
											<Button size="icon" variant="destructive" title="Delete" on:click={() => confirmDeleteCategory(category)}>
												<Icon icon="mdi:delete" class="h-4 w-4" />
											</Button>
										</div>
									</div>
								</CardHeader>
								<CardContent class="pt-0">
									<div class="text-sm text-muted-foreground">
										{templates.filter((t) => t.category_id === category.id).length} templates
									</div>
								</CardContent>
							</Card>
						{/each}
					</div>
				{/if}
			</Tabs.Content>
		</div>
	</Tabs.Root>
</div>

<!-- New Template Dialog -->
<Dialog.Root bind:open={newTemplateDialogOpen}>
	<Dialog.Content class="max-w-3xl">
		<Dialog.Header>
			<Dialog.Title>Create New Directory Template</Dialog.Title>
			<Dialog.Description>Add a new template to the public directory</Dialog.Description>
		</Dialog.Header>

		{#if templateError}
			<Alert variant="destructive" class="mb-4"><AlertDescription>{templateError}</AlertDescription></Alert>
		{/if}

		<form
			method="POST"
			action="?/createTemplate"
			use:enhance={() => {
				savingTemplate = true;
				return async ({ result, update }) => {
					await update({ reset: false });
					if (result.type === 'success') {
						newTemplateDialogOpen = false;
						newTemplateTitle = '';
						newTemplateDescription = '';
						newTemplateContent = '';
						newTemplateFeatured = false;
					}
					savingTemplate = false;
				};
			}}
		>
			<input type="hidden" name="featured" value={newTemplateFeatured ? 'true' : 'false'} />
			<div class="space-y-4 py-4">
				<div class="space-y-2">
					<Label for="title">Title *</Label>
					<Input id="title" name="title" type="text" bind:value={newTemplateTitle} placeholder="Enter template title" />
				</div>

				<div class="space-y-2">
					<Label for="description">Description *</Label>
					<Textarea id="description" name="description" bind:value={newTemplateDescription} placeholder="Enter template description" />
				</div>

				<div class="space-y-2">
					<Label for="content">Content *</Label>
					<Textarea id="content" name="content" bind:value={newTemplateContent} placeholder="Enter template content with {'{{variables}}'}" class="min-h-[200px] font-mono" />
					<p class="text-xs text-muted-foreground">Use {'{{variable_name}}'} syntax to define variables</p>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="category">Category *</Label>
						<select id="category" name="category_id" class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1" bind:value={newTemplateCategoryId}>
							<option value="">None</option>
							{#each categories as category (category.id)}
								<option value={category.id}>{category.name}</option>
							{/each}
						</select>
					</div>

					<div class="space-y-2 flex items-end">
						<div class="flex items-center space-x-2">
							<input type="checkbox" id="featured" bind:checked={newTemplateFeatured} class="h-4 w-4 rounded border-gray-300 focus:ring-primary" />
							<label for="featured" class="text-sm font-medium">Feature this template</label>
						</div>
					</div>
				</div>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" on:click={() => (newTemplateDialogOpen = false)}>Cancel</Button>
				<Button type="submit" disabled={savingTemplate || !newTemplateTitle.trim() || !newTemplateContent.trim()}>
					{savingTemplate ? 'Creating...' : 'Create Template'}
				</Button>
			</Dialog.Footer>
		</form>
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
					if (result.type === 'success') {
						newCategoryDialogOpen = false;
						newCategoryName = '';
						newCategoryDescription = '';
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

<!-- Edit Category Dialog -->
<Dialog.Root bind:open={editCategoryDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Edit Category</Dialog.Title>
			<Dialog.Description>Update the category name and description</Dialog.Description>
		</Dialog.Header>

		{#if editCategoryError}
			<Alert variant="destructive" class="mb-4"><AlertDescription>{editCategoryError}</AlertDescription></Alert>
		{/if}

		<form
			method="POST"
			action="?/updateCategory"
			use:enhance={() => {
				savingEditCategory = true;
				return async ({ result, update }) => {
					await update({ reset: false });
					if (result.type === 'success') editCategoryDialogOpen = false;
					savingEditCategory = false;
				};
			}}
		>
			<input type="hidden" name="id" value={editCategoryId} />
			<div class="space-y-4 py-4">
				<div class="space-y-2">
					<Label for="edit-category-name">Name *</Label>
					<Input id="edit-category-name" name="name" type="text" bind:value={editCategoryName} placeholder="Enter category name" />
				</div>
				<div class="space-y-2">
					<Label for="edit-category-description">Description</Label>
					<Textarea id="edit-category-description" name="description" bind:value={editCategoryDescription} placeholder="Enter category description (optional)" />
				</div>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" on:click={() => (editCategoryDialogOpen = false)}>Cancel</Button>
				<Button type="submit" disabled={savingEditCategory || !editCategoryName.trim()}>
					{savingEditCategory ? 'Updating...' : 'Update Category'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Template Confirmation Dialog -->
<Dialog.Root bind:open={deleteTemplateDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete Template</Dialog.Title>
			<Dialog.Description>Are you sure you want to delete this template? This action cannot be undone.</Dialog.Description>
		</Dialog.Header>

		<div class="py-4">
			<p>You are about to delete: <strong>{deleteTemplateName}</strong></p>
		</div>

		<Dialog.Footer>
			<Button variant="outline" on:click={() => (deleteTemplateDialogOpen = false)}>Cancel</Button>
			<form
				method="POST"
				action="?/deleteTemplate"
				use:enhance={() => {
					return async ({ update }) => {
						await update({ reset: false });
						deleteTemplateDialogOpen = false;
					};
				}}
			>
				<input type="hidden" name="id" value={deleteTemplateId} />
				<Button type="submit" variant="destructive">Delete</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Category Confirmation Dialog -->
<Dialog.Root bind:open={deleteCategoryDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete Category</Dialog.Title>
			<Dialog.Description>Are you sure you want to delete this category? This action cannot be undone.</Dialog.Description>
		</Dialog.Header>

		<div class="py-4">
			<p>You are about to delete: <strong>{deleteCategoryName}</strong></p>
			<p class="text-sm text-muted-foreground mt-2">
				Note: Categories that contain templates cannot be deleted. You must first move or delete the templates.
			</p>
		</div>

		<Dialog.Footer>
			<Button variant="outline" on:click={() => (deleteCategoryDialogOpen = false)}>Cancel</Button>
			<form
				method="POST"
				action="?/deleteCategory"
				use:enhance={() => {
					return async ({ update }) => {
						await update({ reset: false });
						deleteCategoryDialogOpen = false;
					};
				}}
			>
				<input type="hidden" name="id" value={deleteCategoryId} />
				<Button type="submit" variant="destructive">Delete</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Import/Export Dialog -->
<Dialog.Root bind:open={importExportDialogOpen}>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>Import/Export Templates</Dialog.Title>
			<Dialog.Description>Import templates from CSV or export existing templates to CSV format</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-6 py-4">
			<div class="space-y-3">
				<h3 class="text-lg font-semibold">Export Templates</h3>
				<p class="text-sm text-muted-foreground">Download all directory templates as a CSV file including categories and variables.</p>
				<a href="/admin/directory/export" class="block">
					<Button class="w-full" type="button">
						<Icon icon="mdi:download" class="mr-2 h-4 w-4" />
						Export to CSV
					</Button>
				</a>
			</div>

			<div class="border-t pt-6">
				<div class="space-y-3">
					<h3 class="text-lg font-semibold">Import Templates</h3>
					<p class="text-sm text-muted-foreground">Upload a CSV file to import templates. Categories will be created automatically if they don't exist.</p>

					{#if importResult && importResult.successCount > 0}
						<Alert><AlertDescription>Successfully imported {importResult.successCount} template(s).</AlertDescription></Alert>
					{/if}
					{#if importResult && importResult.errors && importResult.errors.length > 0}
						<Alert variant="destructive">
							<AlertDescription class="whitespace-pre-line">
								{importResult.errors.slice(0, 10).join('\n')}{importResult.errors.length > 10 ? `\n... and ${importResult.errors.length - 10} more` : ''}
							</AlertDescription>
						</Alert>
					{/if}

					<form
						method="POST"
						action="?/import"
						enctype="multipart/form-data"
						class="space-y-3"
						use:enhance={() => {
							importing = true;
							return async ({ update }) => {
								await update({ reset: false });
								importing = false;
							};
						}}
					>
						<div class="space-y-2">
							<Label for="csv-file">CSV File</Label>
							<Input id="csv-file" name="file" type="file" accept=".csv" class="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80" />
						</div>

						<div class="bg-muted p-4 rounded-md">
							<h4 class="font-medium mb-2">CSV Format Requirements:</h4>
							<ul class="text-sm space-y-1 text-muted-foreground">
								<li>• <strong>Required columns:</strong> Title, Description, Content, Category Name</li>
								<li>• <strong>Optional columns:</strong> Featured (Yes/No), Variables (JSON)</li>
								<li>• Categories will be created automatically if they don't exist</li>
							</ul>
						</div>

						<Button type="submit" disabled={importing} class="w-full">
							<Icon icon="mdi:upload" class="mr-2 h-4 w-4" />
							{importing ? 'Importing...' : 'Import Templates'}
						</Button>
					</form>
				</div>
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" on:click={() => (importExportDialogOpen = false)}>Close</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
