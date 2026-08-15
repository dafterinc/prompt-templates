<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import Check from 'svelte-radix/Check.svelte';
	import Icon from '@iconify/svelte';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	$: allTemplates = data.templates;
	$: baseCategories = data.categories;

	// Filtering (entirely client-side over the server-loaded list)
	let searchTerm = '';
	let selectedCategoryIds: Set<string> = new Set();
	let drawerOpen = false;

	function matches(t: (typeof allTemplates)[number], term: string, catIds: Set<string>) {
		const matchSearch = term
			? t.title.toLowerCase().includes(term.toLowerCase()) ||
				(t.description ? t.description.toLowerCase().includes(term.toLowerCase()) : false)
			: true;
		const matchCat = catIds.size > 0 ? !!t.category_id && catIds.has(t.category_id) : true;
		return matchSearch && matchCat;
	}

	$: templates = allTemplates.filter((t) => matches(t, searchTerm, selectedCategoryIds));
	$: categories = baseCategories.map((c) => ({
		id: c.id,
		name: c.name,
		count: templates.filter((t) => t.category_id === c.id).length,
		checked: selectedCategoryIds.has(c.id)
	}));

	function toggleCategoryFilter(id: string) {
		const next = new Set(selectedCategoryIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedCategoryIds = next;
	}

	function clearFilters() {
		searchTerm = '';
		selectedCategoryIds = new Set();
	}

	function closeDrawer() {
		drawerOpen = false;
	}

	// Dialogs
	let newCategoryDialogOpen = false;
	let newCategoryName = '';
	let savingCategory = false;

	let importExportDialogOpen = false;
	let importing = false;

	$: categoryError = form && form.scope === 'category' ? form.error : '';
	$: importResult = (form && form.scope === 'import' ? form : null) as
		| { successCount: number; errorCount: number; errors: string[] }
		| null;
</script>

<svelte:head>
	<title>My Templates | Prompt Templates</title>
</svelte:head>

<div>
	<div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
		<h1 class="text-2xl sm:text-3xl font-bold tracking-tight">My Templates</h1>
		<div class="flex flex-col sm:flex-row gap-2">
			<Button variant="outline" class="w-full" on:click={() => (importExportDialogOpen = true)}>
				<Icon icon="mdi:import" class="mr-2 h-4 w-4" />
				Import/Export
			</Button>
			<Button variant="outline" class="w-full" on:click={() => goto('/categories')}>Manage Categories</Button>
			<Button class="w-full" on:click={() => goto('/templates/new')}>Create New Template</Button>
		</div>
	</div>

	<!-- Mobile filter button -->
	<div class="md:hidden mb-4">
		<Button variant="outline" class="w-full" on:click={() => (drawerOpen = true)}>
			<Icon icon="heroicons:funnel" class="h-4 w-4 mr-2" />
			Search & Filter
		</Button>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
		<!-- Sidebar for categories - desktop -->
		<div class="hidden md:block space-y-4">
			<Card>
				<CardHeader class="pb-3">
					<CardTitle class="text-lg sm:text-xl">Filter Templates</CardTitle>
				</CardHeader>
				<CardContent class="space-y-2 p-4 sm:p-6">
					<div class="relative mb-4">
						<Icon icon="heroicons:magnifying-glass" class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input type="search" bind:value={searchTerm} placeholder="Search templates..." class="pl-10" />
					</div>

					<div class="space-y-2 max-h-[400px] overflow-y-auto">
						<div class="flex justify-between items-center">
							<h3 class="font-medium text-sm">Categories</h3>
							<Button variant="ghost" on:click={() => (newCategoryDialogOpen = true)} size="icon" class="h-6 w-6" title="Add New Category">
								<Icon icon="heroicons:plus" class="h-4 w-4" />
							</Button>
						</div>

						{#if categories.length > 0}
							<ul class="space-y-1">
								{#each categories as category (category.id)}
									<li>
										<button
											class="flex items-center w-full px-2 py-1.5 text-sm rounded-md hover:bg-muted/50 transition-colors {category.checked ? 'bg-muted' : ''}"
											on:click={() => toggleCategoryFilter(category.id)}
										>
											<div class="w-5 h-5 mr-2 flex items-center justify-center border rounded-sm {category.checked ? 'bg-primary border-primary' : 'border-muted-foreground/30'}">
												{#if category.checked}
													<Check class="h-3.5 w-3.5 text-primary-foreground" />
												{/if}
											</div>
											<span class="flex-1 text-left truncate">{category.name}</span>
											<span class="text-xs text-muted-foreground ml-1">({category.count})</span>
										</button>
									</li>
								{/each}
							</ul>
						{:else}
							<p class="text-sm text-muted-foreground">No categories available</p>
						{/if}
					</div>

					{#if searchTerm || selectedCategoryIds.size > 0}
						<div class="pt-2 border-t mt-4">
							<div class="flex justify-between items-center">
								<span class="text-sm">Active filters: {selectedCategoryIds.size + (searchTerm ? 1 : 0)}</span>
								<Button variant="ghost" on:click={clearFilters} size="sm" class="h-7 px-2 text-xs">Clear all</Button>
							</div>
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>

		<!-- Templates grid -->
		<div class="md:col-span-3 space-y-4">
			{#if templates.length === 0}
				<div class="w-full p-6 sm:p-8 text-center border rounded-lg">
					<div class="text-muted-foreground">
						{searchTerm || selectedCategoryIds.size > 0
							? 'No templates found matching your filters.'
							: 'Create your first template to get started'}
					</div>
					<div class="flex flex-col sm:flex-row gap-2 justify-center mt-4">
						{#if searchTerm || selectedCategoryIds.size > 0}
							<Button variant="outline" on:click={clearFilters} class="w-full sm:w-auto">Clear Filters</Button>
						{/if}
						<Button on:click={() => goto('/templates/new')} class="w-full sm:w-auto">Create New Template</Button>
					</div>
				</div>
			{:else}
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
					{#each templates as template (template.id)}
						<Card class="hover:shadow-md transition-shadow duration-200">
							<a href={`/templates/${template.id}`} class="block">
								<CardHeader class="mb-2">
									<CardTitle class="truncate">{template.title}</CardTitle>
									{#if template.description}
										<CardDescription class="line-clamp-2">{template.description}</CardDescription>
									{:else}
										<CardDescription class="italic">No description</CardDescription>
									{/if}
								</CardHeader>
								<CardFooter>
									{#if template.category_name}
										<Badge variant="secondary">{template.category_name}</Badge>
									{/if}
								</CardFooter>
							</a>
						</Card>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- New Category Dialog -->
<Dialog.Root bind:open={newCategoryDialogOpen}>
	<Dialog.Content>
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
					if (result.type === 'success') {
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

			<Dialog.Footer>
				<Button type="button" variant="outline" on:click={() => (newCategoryDialogOpen = false)}>Cancel</Button>
				<Button type="submit" disabled={savingCategory || !newCategoryName.trim()}>
					{savingCategory ? 'Creating...' : 'Create Category'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Mobile Drawer -->
<Drawer.Root bind:open={drawerOpen}>
	<Drawer.Portal>
		<Drawer.Overlay class="fixed inset-0 bg-black/40" />
		<Drawer.Content class="bg-background p-4 rounded-t-[10px] mt-24 fixed bottom-0 left-0 right-0 max-h-[85vh] flex flex-col">
			<div class="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-4"></div>
			<div class="max-w-md mx-auto w-full">
				<Drawer.Title class="font-medium mb-4 text-lg">Search & Filter</Drawer.Title>

				<div class="relative mb-4">
					<Icon icon="heroicons:magnifying-glass" class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input type="search" bind:value={searchTerm} placeholder="Search templates..." class="pl-10" />
				</div>

				<div class="mb-4">
					<h3 class="font-medium text-sm mb-2">Categories</h3>
					{#if categories.length > 0}
						<ul class="space-y-1 max-h-[40vh] overflow-y-auto">
							{#each categories as category (category.id)}
								<li>
									<button
										class="flex items-center w-full px-2 py-1.5 text-sm rounded-md hover:bg-muted/50 transition-colors {category.checked ? 'bg-muted' : ''}"
										on:click={() => toggleCategoryFilter(category.id)}
									>
										<div class="w-5 h-5 mr-2 flex items-center justify-center border rounded-sm {category.checked ? 'bg-primary border-primary' : 'border-muted-foreground/30'}">
											{#if category.checked}
												<Check class="h-3.5 w-3.5 text-primary-foreground" />
											{/if}
										</div>
										<span class="flex-1 text-left truncate">{category.name}</span>
										<span class="text-xs text-muted-foreground ml-1">({category.count})</span>
									</button>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-sm text-muted-foreground">No categories available</p>
					{/if}
				</div>

				<div class="mt-6 flex gap-2">
					<Button variant="outline" class="w-full" on:click={() => closeDrawer()}>Close</Button>
					<Button class="w-full" on:click={() => closeDrawer()}>Apply Filters</Button>
				</div>
			</div>
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>

<!-- Import/Export Dialog -->
<Dialog.Root bind:open={importExportDialogOpen}>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>Import/Export Templates</Dialog.Title>
			<Dialog.Description>Import templates from CSV or export your templates to CSV format</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-6 py-4">
			<div class="space-y-3">
				<h3 class="text-lg font-semibold">Export Templates</h3>
				<p class="text-sm text-muted-foreground">
					Download all your templates as a CSV file including categories and variables.
				</p>
				<a href="/templates/export" class="block">
					<Button class="w-full" type="button">
						<Icon icon="mdi:download" class="mr-2 h-4 w-4" />
						Export to CSV
					</Button>
				</a>
			</div>

			<div class="border-t pt-6">
				<div class="space-y-3">
					<h3 class="text-lg font-semibold">Import Templates</h3>
					<p class="text-sm text-muted-foreground">
						Upload a CSV file to import templates. Categories will be created automatically if they don't exist.
					</p>

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
							<Input
								id="csv-file"
								name="file"
								type="file"
								accept=".csv"
								class="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
							/>
						</div>

						<div class="bg-muted p-4 rounded-md">
							<h4 class="font-medium mb-2">CSV Format Requirements:</h4>
							<ul class="text-sm space-y-1 text-muted-foreground">
								<li>• <strong>Required columns:</strong> Title, Description, Content, Category Name</li>
								<li>• <strong>Optional columns:</strong> Variables (JSON)</li>
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
