<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getUserFriendlyErrorMessage } from '$lib/utils';
	
	interface Category {
		id: string;
		name: string;
		description: string | null;
		created_at: string;
		updated_at: string;
		template_count?: number;
	}
	
	let categories: Category[] = [];
	let loading = true;
	let error = '';
	let newCategory = {
		name: '',
		description: ''
	};
	let saving = false;
	let editingCategory: Category | null = null;
	let deleteModalOpen = false;
	let categoryToDelete: Category | null = null;
	
	onMount(() => {
		checkAuth();
		fetchCategories();
	});
	
	async function checkAuth() {
		const { data: { session } } = await supabase.auth.getSession();
		
		if (!session) {
			goto('/auth/login');
		}
	}
	
	async function fetchCategories() {
		try {
			loading = true;
			error = '';
			
			// First get all categories
			const { data, error: fetchError } = await supabase
				.from('categories')
				.select('*')
				.order('name');
			
			if (fetchError) {
				error = fetchError.message;
				return;
			}
			
			// Then get template counts for each category
			const categoriesWithCounts = await Promise.all(
				(data || []).map(async (category) => {
					const { count } = await supabase
						.from('templates')
						.select('id', { count: 'exact', head: true })
						.eq('category_id', category.id);
					
					return {
						...category,
						template_count: count || 0
					};
				})
			);
			
			categories = categoriesWithCounts;
		} catch (e: any) {
			error = e.message;
		} finally {
			loading = false;
		}
	}
	
	async function handleCreateCategory() {
		if (!newCategory.name.trim()) {
			error = 'Category name is required';
			return;
		}
		
		try {
			saving = true;
			error = '';
			
			const { error: insertError } = await supabase
				.from('categories')
				.insert({
					name: newCategory.name.trim(),
					description: newCategory.description.trim() || null
				});
			
			if (insertError) {
				error = getUserFriendlyErrorMessage(insertError);
				return;
			}
			
			// Reset form and refresh categories
			newCategory.name = '';
			newCategory.description = '';
			await fetchCategories();
		} catch (e: any) {
			error = getUserFriendlyErrorMessage(e);
		} finally {
			saving = false;
		}
	}
	
	async function handleUpdateCategory() {
		if (!editingCategory || !editingCategory.name.trim()) {
			return;
		}
		
		try {
			saving = true;
			error = '';
			
			const { error: updateError } = await supabase
				.from('categories')
				.update({
					name: editingCategory.name.trim(),
					description: editingCategory.description?.trim() || null,
					updated_at: new Date().toISOString()
				})
				.eq('id', editingCategory.id);
			
			if (updateError) {
				error = getUserFriendlyErrorMessage(updateError);
				return;
			}
			
			// Reset edit mode and refresh categories
			editingCategory = null;
			await fetchCategories();
		} catch (e: any) {
			error = getUserFriendlyErrorMessage(e);
		} finally {
			saving = false;
		}
	}
	
	async function handleDeleteCategory() {
		if (!categoryToDelete) return;
		
		try {
			saving = true;
			error = '';
			
			// Check if category has templates
			if ((categoryToDelete.template_count || 0) > 0) {
				error = 'Cannot delete a category that has templates. Please reassign or delete the templates first.';
				deleteModalOpen = false;
				categoryToDelete = null;
				return;
			}
			
			const { error: deleteError } = await supabase
				.from('categories')
				.delete()
				.eq('id', categoryToDelete.id);
			
			if (deleteError) {
				error = deleteError.message;
				return;
			}
			
			// Close modal and refresh categories
			deleteModalOpen = false;
			categoryToDelete = null;
			await fetchCategories();
		} catch (e: any) {
			error = e.message;
		} finally {
			saving = false;
		}
	}
	
	function cancelEdit() {
		editingCategory = null;
		error = '';
	}
	
	function startEdit(category: Category) {
		// Create a copy to avoid directly modifying the list item
		editingCategory = { ...category };
	}
	
	function confirmDelete(category: Category) {
		categoryToDelete = category;
		deleteModalOpen = true;
	}
	
	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString();
	}
</script>

<div class="container mx-auto px-4 py-6 max-w-6xl">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
		<h1 class="text-xl sm:text-2xl font-bold">Categories</h1>
		<div>
			<a href="/templates" class="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md">
				&larr; <span class="ml-1">Back to Templates</span>
			</a>
		</div>
	</div>
	
	{#if error}
		<div class="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
			{error}
		</div>
	{/if}
	
	<div class="flex flex-col lg:flex-row gap-6">
		<div class="w-full lg:w-1/3">
			<div class="bg-card rounded-md border p-4">
				<h2 class="font-semibold mb-4">Add New Category</h2>
				<form on:submit|preventDefault={handleCreateCategory} class="space-y-4">
					<div>
						<label for="name" class="block text-sm font-medium mb-1">Name *</label>
						<input
							id="name"
							type="text"
							bind:value={newCategory.name}
							required
							class="w-full p-2 border rounded-md"
							placeholder="Enter category name"
						/>
					</div>
					
					<div>
						<label for="description" class="block text-sm font-medium mb-1">Description</label>
						<textarea
							id="description"
							bind:value={newCategory.description}
							rows="3"
							class="w-full p-2 border rounded-md"
							placeholder="Enter optional description"
						></textarea>
					</div>
					
					<div class="flex justify-end">
						<button
							type="submit"
							disabled={saving || !newCategory.name.trim()}
							class="w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-70"
						>
							{saving ? 'Creating...' : 'Create Category'}
						</button>
					</div>
				</form>
			</div>
		</div>
		
		<div class="w-full lg:w-2/3">
			{#if loading}
				<div class="flex justify-center py-12">
					<div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
				</div>
			{:else if categories.length === 0}
				<div class="bg-card rounded-md border p-8 text-center">
					<p class="text-muted-foreground">No categories found. Create your first category to get started.</p>
				</div>
			{:else}
				<div class="bg-card rounded-md border overflow-hidden overflow-x-auto">
					<table class="min-w-full divide-y divide-border">
						<thead class="bg-muted/50">
							<tr>
								<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Name
								</th>
								<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Templates
								</th>
								<th scope="col" class="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Created
								</th>
								<th scope="col" class="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody class="bg-background divide-y divide-border">
							{#each categories as category}
								<tr>
									{#if editingCategory && editingCategory.id === category.id}
										<td colspan="3" class="px-6 py-4">
											<form on:submit|preventDefault={handleUpdateCategory} class="flex flex-col gap-4">
												<div>
													<label for="edit-name" class="sr-only">Name</label>
													<input
														id="edit-name"
														type="text"
														bind:value={editingCategory.name}
														required
														class="w-full p-2 border rounded-md"
													/>
												</div>
												
												<div>
													<label for="edit-description" class="sr-only">Description</label>
													<textarea
														id="edit-description"
														bind:value={editingCategory.description}
														rows="2"
														class="w-full p-2 border rounded-md"
														placeholder="No description"
													></textarea>
												</div>
											</form>
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
											<button
												on:click={cancelEdit}
												class="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
											>
												Cancel
											</button>
											<button
												on:click={handleUpdateCategory}
												disabled={saving || !editingCategory.name.trim()}
												class="px-3 py-1 bg-primary text-primary-foreground rounded-md text-xs disabled:opacity-70"
											>
												Save
											</button>
										</td>
									{:else}
										<td class="px-6 py-4 whitespace-nowrap">
											<div class="text-sm font-medium">{category.name}</div>
											{#if category.description}
												<div class="text-sm text-muted-foreground">{category.description}</div>
											{/if}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
											{category.template_count || 0}
										</td>
										<td class="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
											{formatDate(category.created_at)}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
											<button
												on:click={() => startEdit(category)}
												class="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
											>
												Edit
											</button>
											<button
												on:click={() => confirmDelete(category)}
												disabled={category.template_count && category.template_count > 0}
												class="px-3 py-1 bg-destructive text-destructive-foreground rounded-md text-xs disabled:opacity-70"
											>
												Delete
											</button>
										</td>
									{/if}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
	
	{#if deleteModalOpen && categoryToDelete}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
			<div class="bg-background rounded-lg p-6 max-w-md w-full">
				<h2 class="text-xl font-bold mb-4">Delete Category</h2>
				<p class="mb-6">Are you sure you want to delete the category "{categoryToDelete.name}"? This action cannot be undone.</p>
				<div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
					<button 
						on:click={() => { deleteModalOpen = false; categoryToDelete = null; }}
						class="px-4 py-2 border rounded-md w-full sm:w-auto"
					>
						Cancel
					</button>
					<button 
						on:click={handleDeleteCategory}
						disabled={saving}
						class="px-4 py-2 bg-destructive text-destructive-foreground rounded-md disabled:opacity-70 w-full sm:w-auto"
					>
						{saving ? 'Deleting...' : 'Delete Category'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div> 