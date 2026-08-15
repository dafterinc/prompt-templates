<script lang="ts">
	import { enhance } from '$app/forms';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import Icon from '@iconify/svelte';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	$: categories = data.categories;

	let newName = '';
	let submitting = false;

	// Inline edit state
	let editingId: string | null = null;
	let editingName = '';

	// Delete confirmation
	let deleteModalOpen = false;
	let categoryToDelete: { id: string; name: string; template_count: number } | null = null;

	function startEdit(category: { id: string; name: string }) {
		editingId = category.id;
		editingName = category.name;
	}

	function cancelEdit() {
		editingId = null;
		editingName = '';
	}

	function confirmDelete(category: { id: string; name: string; template_count: number }) {
		categoryToDelete = category;
		deleteModalOpen = true;
	}
</script>

<svelte:head>
	<title>Categories | Prompt Templates</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex justify-between items-center">
		<h1 class="text-3xl font-bold tracking-tight">Categories</h1>
		<div class="flex items-center gap-2">
			<a href="/templates">
				<Button variant="outline" size="sm">
					<Icon icon="heroicons:arrow-left" class="h-4 w-4 mr-2" />
					Back to Templates
				</Button>
			</a>
		</div>
	</div>

	{#if form?.error}
		<Alert variant="destructive">
			<AlertDescription>{form.error}</AlertDescription>
		</Alert>
	{/if}

	<div class="grid grid-cols-1 gap-6">
		<!-- Create new category form -->
		<Card>
			<CardHeader>
				<CardTitle>Add New Category</CardTitle>
			</CardHeader>
			<CardContent>
				<form
					method="POST"
					action="?/create"
					class="space-y-4"
					use:enhance={() => {
						submitting = true;
						return async ({ result, update }) => {
							await update({ reset: false });
							if (result.type === 'success') newName = '';
							submitting = false;
						};
					}}
				>
					<div class="grid grid-cols-1 md:grid-cols-5 gap-4">
						<div class="md:col-span-4">
							<input
								type="text"
								name="name"
								placeholder="Enter category name"
								class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
								bind:value={newName}
								disabled={submitting}
							/>
						</div>
						<div class="md:col-span-1">
							<Button type="submit" class="w-full" disabled={submitting || !newName.trim()}>
								{submitting ? 'Creating...' : 'Create Category'}
							</Button>
						</div>
					</div>
				</form>
			</CardContent>
		</Card>

		<!-- Categories list -->
		<Card>
			<CardHeader>
				<CardTitle>Manage Categories</CardTitle>
			</CardHeader>
			<CardContent>
				{#if categories.length === 0}
					<div class="text-center py-8">
						<p class="text-muted-foreground">No categories found. Create your first category above.</p>
					</div>
				{:else}
					<div class="border rounded-md overflow-hidden">
						<table class="w-full">
							<thead class="bg-muted">
								<tr>
									<th class="px-4 py-3 text-left font-medium">Name</th>
									<th class="px-4 py-3 text-center font-medium">Templates</th>
									<th class="px-4 py-3 text-right font-medium">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y">
								{#each categories as category (category.id)}
									<tr class="hover:bg-muted/30">
										<td class="px-4 py-3">
											{#if editingId === category.id}
												<form
													id={`edit-${category.id}`}
													method="POST"
													action="?/update"
													use:enhance={() => {
														submitting = true;
														return async ({ result, update }) => {
															await update({ reset: false });
															if (result.type === 'success') cancelEdit();
															submitting = false;
														};
													}}
												>
													<input type="hidden" name="id" value={category.id} />
													<input
														type="text"
														name="name"
														class="w-full px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
														bind:value={editingName}
													/>
												</form>
											{:else}
												{category.name}
											{/if}
										</td>
										<td class="px-4 py-3 text-center">{category.template_count}</td>
										<td class="px-4 py-3 text-right">
											<div class="flex justify-end gap-1">
												{#if editingId === category.id}
													<Button
														variant="ghost"
														size="sm"
														class="h-8 w-8 p-0"
														title="Save"
														type="submit"
														form={`edit-${category.id}`}
														disabled={submitting || !editingName.trim()}
													>
														<Icon icon="heroicons:check" class="h-4 w-4 text-green-500" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														class="h-8 w-8 p-0"
														title="Cancel"
														on:click={cancelEdit}
													>
														<Icon icon="heroicons:x-mark" class="h-4 w-4 text-red-500" />
													</Button>
												{:else}
													<Button
														variant="ghost"
														size="sm"
														class="h-8 w-8 p-0"
														title="Edit"
														on:click={() => startEdit(category)}
													>
														<Icon icon="heroicons:pencil-square" class="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														class="h-8 w-8 p-0"
														title="Delete"
														on:click={() => confirmDelete(category)}
													>
														<Icon icon="heroicons:trash" class="h-4 w-4 text-red-500" />
													</Button>
												{/if}
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>

<!-- Delete Modal -->
{#if deleteModalOpen && categoryToDelete}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
		<div class="bg-background rounded-lg shadow-lg p-6 max-w-md w-full">
			<h3 class="text-xl font-semibold mb-4">Delete Category</h3>
			<p class="mb-6">
				Are you sure you want to delete "{categoryToDelete.name}"? This action cannot be undone.
				{#if categoryToDelete.template_count > 0}
					<span class="block mt-2 text-red-500">
						This category contains {categoryToDelete.template_count} template(s); it cannot be deleted until they are reassigned or removed.
					</span>
				{/if}
			</p>
			<div class="flex justify-end gap-2">
				<Button
					variant="outline"
					on:click={() => {
						deleteModalOpen = false;
						categoryToDelete = null;
					}}
				>
					Cancel
				</Button>
				<form
					method="POST"
					action="?/delete"
					use:enhance={() => {
						submitting = true;
						return async ({ update }) => {
							await update({ reset: false });
							deleteModalOpen = false;
							categoryToDelete = null;
							submitting = false;
						};
					}}
				>
					<input type="hidden" name="id" value={categoryToDelete.id} />
					<Button variant="destructive" type="submit" disabled={submitting}>Delete</Button>
				</form>
			</div>
		</div>
	</div>
{/if}
