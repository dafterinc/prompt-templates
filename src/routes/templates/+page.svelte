<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import Check from 'svelte-radix/Check.svelte';
	import { getUserFriendlyErrorMessage, getErrorMessage } from '$lib/utils';
	import { logger } from '$lib/utils/logger';
	import Icon from '@iconify/svelte';

	interface Template {
		id: string;
		title: string;
		description: string | null;
		content: string;
		created_at: string;
		updated_at: string;
		category_id: string | null;
		categories?: { name: string };
		variables_count?: number | null;
		category_name?: string;
	}

	interface ImportedVariable {
		name: string;
		description: string;
		type: string;
		default_value: string;
		is_required: boolean;
	}

	interface Category {
		id: string;
		name: string;
		count?: number;
		checked?: boolean;
	}

	let templates: Template[] = [];
	let allTemplates: Template[] = [];
	let categories: Category[] = [];
	let loading = true;
	let error = '';
	let userId = '';

	// For filtering
	let searchTerm = '';
	let selectedCategoryIds: Set<string> = new Set();
	let drawerOpen = false;

	// For new category
	let newCategoryDialogOpen = false;
	let newCategoryName = '';
	let savingCategory = false;
	let categoryError = '';

	// For import/export
	let importExportDialogOpen = false;
	let importFile: File | null = null;
	let importError = '';
	let importSuccess = '';
	let importing = false;

	onMount(() => {
		loadTemplates();
	});

	async function loadTemplates() {
		try {
			const {
				data: { session }
			} = await supabase.auth.getSession();

			if (!session) {
				goto('/auth/login');
				return;
			}

			userId = session.user.id;
			await Promise.all([fetchTemplates(), fetchCategories()]);
		} catch (e) {
			error = getErrorMessage(e, 'Failed to load templates');
		} finally {
			loading = false;
		}
	}

	async function fetchTemplates() {
		const { data, error: fetchError } = await supabase
			.from('templates')
			.select(
				`
				*,
				categories(name)
			`
			)
			.order('updated_at', { ascending: false });

		if (fetchError) {
			error = fetchError.message;
			return;
		}

		// Also fetch variable count for each template
		if (data) {
			allTemplates = await Promise.all(
				data.map(async (template: Template) => {
					const { count } = await supabase
						.from('variables')
						.select('id', { count: 'exact', head: true })
						.eq('template_id', template.id);

					return {
						...template,
						category_name: template.categories?.name,
						variables_count: count
					};
				})
			);

			templates = [...allTemplates];
		}
	}

	async function fetchCategories() {
		const { data, error: fetchError } = await supabase.from('categories').select('*').order('name');

		if (fetchError) {
			logger.error('Error fetching categories', fetchError, 'templates');
			return;
		}

		if (data) {
			categories = data.map((cat) => ({
				...cat,
				checked: false,
				count: 0
			}));

			// Count templates in each category
			if (allTemplates.length > 0) {
				categories = categories.map((cat) => {
					const count = allTemplates.filter((t) => t.category_id === cat.id).length;
					return { ...cat, count };
				});
			}
		}
	}

	function applyFilters() {
		if (!searchTerm && selectedCategoryIds.size === 0) {
			templates = [...allTemplates];

			// Reset category counts to original values
			updateCategoryCounts(allTemplates);
			return;
		}

		templates = allTemplates.filter((template) => {
			// Filter by search term
			const matchesSearch = searchTerm
				? template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
					(template.description &&
						template.description.toLowerCase().includes(searchTerm.toLowerCase()))
				: true;

			// Filter by categories
			const matchesCategory =
				selectedCategoryIds.size > 0
					? template.category_id && selectedCategoryIds.has(template.category_id)
					: true;

			return matchesSearch && matchesCategory;
		});

		// Update counts based on filtered templates
		updateCategoryCounts(templates);
	}

	function updateCategoryCounts(templatesList: Template[]) {
		categories = categories.map((cat) => {
			const count = templatesList.filter((t) => t.category_id === cat.id).length;
			return { ...cat, count, checked: selectedCategoryIds.has(cat.id) };
		});
	}

	function toggleCategoryFilter(categoryId: string) {
		if (selectedCategoryIds.has(categoryId)) {
			selectedCategoryIds.delete(categoryId);
		} else {
			selectedCategoryIds.add(categoryId);
		}

		applyFilters();
	}

	function clearFilters() {
		searchTerm = '';
		selectedCategoryIds.clear();

		categories = categories.map((cat) => ({
			...cat,
			checked: false
		}));

		templates = [...allTemplates];
		updateCategoryCounts(allTemplates);
	}

	function handleCreateNew() {
		goto('/templates/new');
	}

	async function createCategory() {
		if (!newCategoryName.trim()) {
			categoryError = 'Category name is required';
			return;
		}

		try {
			savingCategory = true;
			categoryError = '';

			const { error: insertError } = await supabase
				.from('categories')
				.insert({
					name: newCategoryName.trim(),
					user_id: userId
				})
				.select()
				.single();

			if (insertError) {
				categoryError = getUserFriendlyErrorMessage(insertError);
				return;
			}

			// Close dialog and reset values
			newCategoryDialogOpen = false;
			newCategoryName = '';

			// Refresh categories list
			await fetchCategories();
		} catch (e) {
			categoryError = getUserFriendlyErrorMessage(e);
		} finally {
			savingCategory = false;
		}
	}

	function closeDrawer() {
		drawerOpen = false;
	}

	async function exportToCSV() {
		try {
			// Fetch all templates with their categories and variables
			const { data: templatesData, error: templatesError } = await supabase
				.from('templates')
				.select(
					`
					*,
					categories(name),
					variables(name, description, type, default_value, is_required)
				`
				)
				.order('title');

			if (templatesError) {
				error = templatesError.message;
				return;
			}

			if (!templatesData || templatesData.length === 0) {
				error = 'No templates to export';
				return;
			}

			// Create CSV headers
			const headers = [
				'Title',
				'Description',
				'Content',
				'Category Name',
				'Variables (JSON)',
				'Created At',
				'Updated At'
			];

			// Convert data to CSV rows
			const csvRows = templatesData.map((template) => {
				// Convert variables to JSON string
				const variablesJson = JSON.stringify(template.variables || []);

				// Escape CSV values (handle commas, quotes, newlines)
				const escapeCSV = (value: unknown) => {
					if (value === null || value === undefined) return '';
					const str = String(value);
					if (str.includes(',') || str.includes('"') || str.includes('\n')) {
						return `"${str.replace(/"/g, '""')}"`;
					}
					return str;
				};

				return [
					escapeCSV(template.title),
					escapeCSV(template.description),
					escapeCSV(template.content),
					escapeCSV(template.categories?.name || ''),
					escapeCSV(variablesJson),
					escapeCSV(template.created_at),
					escapeCSV(template.updated_at)
				].join(',');
			});

			// Combine headers and rows
			const csvContent = [headers.join(','), ...csvRows].join('\n');

			// Create and download file
			const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
			const link = document.createElement('a');
			const url = URL.createObjectURL(blob);
			link.setAttribute('href', url);
			link.setAttribute('download', `my-templates-${new Date().toISOString().split('T')[0]}.csv`);
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (e) {
			error = getErrorMessage(e, 'Failed to export templates');
		}
	}

	async function importFromCSV() {
		if (!importFile) {
			importError = 'Please select a CSV file to import';
			return;
		}

		try {
			importing = true;
			importError = '';
			importSuccess = '';

			// Read file content
			const fileContent = await importFile.text();

			// Parse CSV
			const lines = fileContent.split('\n').filter((line) => line.trim());
			if (lines.length < 2) {
				importError = 'CSV file must have at least a header row and one data row';
				return;
			}

			const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
			const dataRows = lines.slice(1);

			// Validate headers
			const requiredHeaders = ['Title', 'Description', 'Content', 'Category Name'];
			const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
			if (missingHeaders.length > 0) {
				importError = `Missing required headers: ${missingHeaders.join(', ')}`;
				return;
			}

			let successCount = 0;
			let errorCount = 0;
			const errors: string[] = [];

			// Process each row
			for (let i = 0; i < dataRows.length; i++) {
				try {
					const row = dataRows[i];
					const values = parseCSVRow(row);

					if (values.length !== headers.length) {
						errors.push(`Row ${i + 2}: Column count mismatch`);
						errorCount++;
						continue;
					}

					// Create row object
					const rowData: Record<string, string> = {};
					headers.forEach((header, index) => {
						rowData[header] = values[index] || '';
					});

					// Validate required fields
					if (!rowData['Title']?.trim() || !rowData['Content']?.trim()) {
						errors.push(`Row ${i + 2}: Title and Content are required`);
						errorCount++;
						continue;
					}

					// Find or create category
					let categoryId = null;
					if (rowData['Category Name']?.trim()) {
						const categoryName = rowData['Category Name'].trim();

						// Check if category exists
						const existingCategory = categories.find(
							(c) => c.name.toLowerCase() === categoryName.toLowerCase()
						);

						if (existingCategory) {
							categoryId = existingCategory.id;
						} else {
							// Create new category
							const { data: newCategory, error: categoryError } = await supabase
								.from('categories')
								.insert({
									name: categoryName,
									user_id: userId
								})
								.select()
								.single();

							if (categoryError) {
								errors.push(
									`Row ${i + 2}: Failed to create category "${categoryName}": ${categoryError.message}`
								);
								errorCount++;
								continue;
							}

							categoryId = newCategory.id;
							// Add to local categories array
							categories.push({ ...newCategory, checked: false, count: 0 });
						}
					}

					// Parse variables from JSON or extract from content
					let variables: ImportedVariable[] = [];

					// Try to parse variables from JSON first
					if (rowData['Variables (JSON)']?.trim()) {
						try {
							variables = JSON.parse(rowData['Variables (JSON)']);
						} catch {
							// If JSON parsing fails, extract from content
							variables = [];
						}
					}

					// Always extract variables from content to ensure we don't miss any
					const variableMatches = [...rowData['Content'].matchAll(/\{\{([^}]+)\}\}/g)];
					const contentVariables = variableMatches.map((match) => ({
						name: match[1].trim(),
						description: '',
						type: 'text',
						default_value: '',
						is_required: false
					}));

					// Merge variables from JSON with content variables
					// Use JSON variables as base and fill in missing ones from content
					const variableNames = new Set(variables.map((v) => v.name));
					const missingVariables = contentVariables.filter((v) => !variableNames.has(v.name));
					variables = [...variables, ...missingVariables];

					// Create template
					const { data: template, error: templateError } = await supabase
						.from('templates')
						.insert({
							title: rowData['Title'].trim(),
							description: rowData['Description']?.trim() || null,
							content: rowData['Content'].trim(),
							category_id: categoryId,
							user_id: userId
						})
						.select()
						.single();

					if (templateError) {
						errors.push(`Row ${i + 2}: Failed to create template: ${templateError.message}`);
						errorCount++;
						continue;
					}

					// Create variables if any
					if (variables.length > 0) {
						const variableInserts = variables.map((variable) => ({
							template_id: template.id,
							name: variable.name,
							description: variable.description || '',
							type: variable.type || 'text',
							default_value: variable.default_value || '',
							is_required: variable.is_required || false
						}));

						const { error: variablesError } = await supabase
							.from('variables')
							.insert(variableInserts);

						if (variablesError) {
							errors.push(
								`Row ${i + 2}: Template created but failed to create variables: ${variablesError.message}`
							);
						}
					}

					successCount++;
				} catch (rowError) {
					errors.push(`Row ${i + 2}: ${getErrorMessage(rowError)}`);
					errorCount++;
				}
			}

			// Set success/error messages
			if (successCount > 0) {
				importSuccess = `Successfully imported ${successCount} template(s)`;
				// Refresh data
				await loadTemplates();
			}

			if (errorCount > 0) {
				importError = `Failed to import ${errorCount} template(s):\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? `\n... and ${errors.length - 10} more errors` : ''}`;
			}
		} catch (e) {
			importError = getErrorMessage(e, 'Failed to import templates');
		} finally {
			importing = false;
		}
	}

	function parseCSVRow(row: string): string[] {
		const result: string[] = [];
		let current = '';
		let inQuotes = false;

		for (let i = 0; i < row.length; i++) {
			const char = row[i];

			if (char === '"') {
				if (inQuotes && row[i + 1] === '"') {
					// Escaped quote
					current += '"';
					i++; // Skip next quote
				} else {
					// Toggle quote state
					inQuotes = !inQuotes;
				}
			} else if (char === ',' && !inQuotes) {
				// End of field
				result.push(current.trim());
				current = '';
			} else {
				current += char;
			}
		}

		// Add last field
		result.push(current.trim());

		return result;
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			importFile = target.files[0];
		}
	}
</script>

<svelte:head>
	<title>My Templates | Prompt Templates</title>
</svelte:head>

<div>
	<div class="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<h1 class="text-2xl font-bold tracking-tight sm:text-3xl">My Templates</h1>
		<div class="flex flex-col gap-2 sm:flex-row">
			<Button variant="outline" class="w-full" on:click={() => (importExportDialogOpen = true)}>
				<Icon icon="mdi:import" class="mr-2 h-4 w-4" />
				Import/Export
			</Button>
			<Button variant="outline" class="w-full" on:click={() => goto('/categories')}>
				Manage Categories
			</Button>
			<Button class="w-full" on:click={handleCreateNew}>Create New Template</Button>
		</div>
	</div>

	<!-- Mobile filter button -->
	<div class="mb-4 md:hidden">
		<Button variant="outline" class="w-full" on:click={() => (drawerOpen = true)}>
			<Icon icon="heroicons:funnel" class="mr-2 h-4 w-4" />
			Search & Filter
		</Button>
	</div>

	{#if error}
		<Alert variant="destructive">
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}

	{#if loading}
		<div class="flex items-center justify-center p-8">
			<div class="mr-2 animate-spin">
				<Icon icon="heroicons:arrow-path" width="24" height="24" />
			</div>
			<span>Loading templates...</span>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6">
			<!-- Sidebar for categories - desktop -->
			<div class="hidden space-y-4 md:block">
				<Card>
					<CardHeader class="pb-3">
						<CardTitle class="text-lg sm:text-xl">Filter Templates</CardTitle>
					</CardHeader>
					<CardContent class="space-y-2 p-4 sm:p-6">
						<!-- Search input -->
						<div class="relative mb-4">
							<Icon
								icon="heroicons:magnifying-glass"
								class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
							/>
							<Input
								type="search"
								bind:value={searchTerm}
								placeholder="Search templates..."
								on:input={applyFilters}
								class="pl-10"
							/>
						</div>

						<!-- Categories section -->
						<div class="max-h-[400px] space-y-2 overflow-y-auto">
							<div class="flex items-center justify-between">
								<h3 class="text-sm font-medium">Categories</h3>
								<Button
									variant="ghost"
									on:click={() => (newCategoryDialogOpen = true)}
									size="icon"
									class="h-6 w-6"
									title="Add New Category"
								>
									<Icon icon="heroicons:plus" class="h-4 w-4" />
								</Button>
							</div>

							{#if categories.length > 0}
								<ul class="space-y-1">
									{#each categories as category (category.id)}
										<li>
											<button
												class="flex w-full items-center rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50 {category.checked
													? 'bg-muted'
													: ''}"
												on:click={() => toggleCategoryFilter(category.id)}
											>
												<div
													class="mr-2 flex h-5 w-5 items-center justify-center rounded-sm border {category.checked
														? 'border-primary bg-primary'
														: 'border-muted-foreground/30'}"
												>
													{#if category.checked}
														<Check class="h-3.5 w-3.5 text-primary-foreground" />
													{/if}
												</div>
												<span class="flex-1 truncate text-left">{category.name}</span>
												<span class="ml-1 text-xs text-muted-foreground">({category.count})</span>
											</button>
										</li>
									{/each}
								</ul>
							{:else}
								<p class="text-sm text-muted-foreground">No categories available</p>
							{/if}
						</div>

						<!-- Active filters indicator and clear button -->
						{#if searchTerm || selectedCategoryIds.size > 0}
							<div class="mt-4 border-t pt-2">
								<div class="flex items-center justify-between">
									<span class="text-sm"
										>Active filters: {selectedCategoryIds.size + (searchTerm ? 1 : 0)}</span
									>
									<Button
										variant="ghost"
										on:click={clearFilters}
										size="sm"
										class="h-7 px-2 text-xs"
									>
										Clear all
									</Button>
								</div>
							</div>
						{/if}
					</CardContent>
				</Card>
			</div>

			<!-- Templates grid -->
			<div class="space-y-4 md:col-span-3">
				{#if templates.length === 0}
					<div class="w-full rounded-lg border p-6 text-center sm:p-8">
						<div class="text-muted-foreground">
							{searchTerm || selectedCategoryIds.size > 0
								? 'No templates found matching your filters.'
								: 'Create your first template to get started'}
						</div>
						<div class="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
							{#if searchTerm || selectedCategoryIds.size > 0}
								<Button variant="outline" on:click={clearFilters} class="w-full sm:w-auto">
									Clear Filters
								</Button>
							{/if}
							<Button on:click={handleCreateNew} class="w-full sm:w-auto">
								Create New Template
							</Button>
						</div>
					</div>
				{:else}
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
						{#each templates as template (template.id)}
							<Card class="transition-shadow duration-200 hover:shadow-md">
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
	{/if}
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

		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="new-category-name">Name *</Label>
				<Input
					id="new-category-name"
					type="text"
					bind:value={newCategoryName}
					placeholder="Enter category name"
					required
				/>
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" on:click={() => (newCategoryDialogOpen = false)}>Cancel</Button>
			<Button
				type="button"
				disabled={savingCategory || !newCategoryName.trim()}
				on:click={createCategory}
			>
				{savingCategory ? 'Creating...' : 'Create Category'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Mobile Drawer -->
<Drawer.Root bind:open={drawerOpen}>
	<Drawer.Portal>
		<Drawer.Overlay class="fixed inset-0 bg-black/40"></Drawer.Overlay>
		<Drawer.Content
			class="fixed bottom-0 left-0 right-0 mt-24 flex max-h-[85vh] flex-col rounded-t-[10px] bg-background p-4"
		>
			<div class="mx-auto mb-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-muted"></div>
			<div class="mx-auto w-full max-w-md">
				<Drawer.Title class="mb-4 text-lg font-medium">Search & Filter</Drawer.Title>

				<!-- Search input -->
				<div class="relative mb-4">
					<Icon
						icon="heroicons:magnifying-glass"
						class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
					/>
					<Input
						type="search"
						bind:value={searchTerm}
						placeholder="Search templates..."
						class="pl-10"
					/>
				</div>

				<!-- Categories section -->
				<div class="mb-4">
					<div class="mb-2 flex items-center justify-between">
						<h3 class="text-sm font-medium">Categories</h3>
						<Button
							variant="ghost"
							on:click={() => {
								closeDrawer();
								setTimeout(() => (newCategoryDialogOpen = true), 300);
							}}
							size="icon"
							class="h-6 w-6"
							title="Add New Category"
						>
							<Icon icon="heroicons:plus" class="h-4 w-4" />
						</Button>
					</div>

					{#if categories.length > 0}
						<ul class="max-h-[40vh] space-y-1 overflow-y-auto">
							{#each categories as category (category.id)}
								<li>
									<button
										class="flex w-full items-center rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50 {category.checked
											? 'bg-muted'
											: ''}"
										on:click={() => toggleCategoryFilter(category.id)}
									>
										<div
											class="mr-2 flex h-5 w-5 items-center justify-center rounded-sm border {category.checked
												? 'border-primary bg-primary'
												: 'border-muted-foreground/30'}"
										>
											{#if category.checked}
												<Check class="h-3.5 w-3.5 text-primary-foreground" />
											{/if}
										</div>
										<span class="flex-1 truncate text-left">{category.name}</span>
										<span class="ml-1 text-xs text-muted-foreground">({category.count})</span>
									</button>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-sm text-muted-foreground">No categories available</p>
					{/if}
				</div>

				<!-- Active filters indicator and clear button -->
				{#if searchTerm || selectedCategoryIds.size > 0}
					<div class="border-t pt-2">
						<div class="flex items-center justify-between">
							<span class="text-sm"
								>Active filters: {selectedCategoryIds.size + (searchTerm ? 1 : 0)}</span
							>
							<Button variant="ghost" on:click={clearFilters} size="sm" class="h-7 px-2 text-xs">
								Clear all
							</Button>
						</div>
					</div>
				{/if}

				<div class="mt-6 flex gap-2">
					<Button variant="outline" class="w-full" on:click={() => closeDrawer()}>Close</Button>
					<Button
						class="w-full"
						on:click={() => {
							applyFilters();
							closeDrawer();
						}}
					>
						Apply Filters
					</Button>
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
			<Dialog.Description>
				Import templates from CSV or export your templates to CSV format
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-6 py-4">
			<!-- Export Section -->
			<div class="space-y-3">
				<h3 class="text-lg font-semibold">Export Templates</h3>
				<p class="text-sm text-muted-foreground">
					Download all your templates as a CSV file including categories and variables.
				</p>
				<Button on:click={exportToCSV} class="w-full">
					<Icon icon="mdi:download" class="mr-2 h-4 w-4" />
					Export to CSV
				</Button>
			</div>

			<div class="border-t pt-6">
				<!-- Import Section -->
				<div class="space-y-3">
					<h3 class="text-lg font-semibold">Import Templates</h3>
					<p class="text-sm text-muted-foreground">
						Upload a CSV file to import templates. Categories will be created automatically if they
						don't exist.
					</p>

					{#if importError}
						<Alert variant="destructive">
							<AlertDescription class="whitespace-pre-line">{importError}</AlertDescription>
						</Alert>
					{/if}

					{#if importSuccess}
						<Alert>
							<AlertDescription>{importSuccess}</AlertDescription>
						</Alert>
					{/if}

					<div class="space-y-2">
						<Label for="csv-file">CSV File</Label>
						<Input
							id="csv-file"
							type="file"
							accept=".csv"
							on:change={handleFileSelect}
							class="file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/80"
						/>
						{#if importFile}
							<p class="text-sm text-muted-foreground">Selected: {importFile.name}</p>
						{/if}
					</div>

					<div class="rounded-md bg-muted p-4">
						<h4 class="mb-2 font-medium">CSV Format Requirements:</h4>
						<ul class="space-y-1 text-sm text-muted-foreground">
							<li>
								• <strong>Required columns:</strong> Title, Description, Content, Category Name
							</li>
							<li>• <strong>Optional columns:</strong> Variables (JSON)</li>
							<li>• Categories will be created automatically if they don't exist</li>
							<li>
								• Variables can be included as JSON or will be extracted from template content
							</li>
						</ul>
					</div>

					<Button on:click={importFromCSV} disabled={!importFile || importing} class="w-full">
						<Icon icon="mdi:upload" class="mr-2 h-4 w-4" />
						{importing ? 'Importing...' : 'Import Templates'}
					</Button>
				</div>
			</div>
		</div>

		<Dialog.Footer>
			<Button
				variant="outline"
				on:click={() => {
					importExportDialogOpen = false;
					importFile = null;
					importError = '';
					importSuccess = '';
				}}
			>
				Close
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
