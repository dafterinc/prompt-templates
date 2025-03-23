<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getUserFriendlyErrorMessage } from '$lib/utils';
	import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import Icon from '@iconify/svelte';
	
	interface Category {
		id: string;
		name: string;
		created_at: string;
		updated_at: string;
		template_count?: number;
	}
	
	let categories: Category[] = [];
	let loading = true;
	let error = '';
	let newCategory = {
		name: ''
	};
	let saving = false;
	let editingCategory: Category | null = null;
	let deleteModalOpen = false;
	let categoryToDelete: Category | null = null;
	let userId = '';
	
	onMount(() => {
		checkAuth();
		fetchCategories();
	});
	
	async function checkAuth() {
		const { data: { session } } = await supabase.auth.getSession();
		
		if (!session) {
			goto('/auth/login');
		} else {
			userId = session.user.id;
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
					user_id: userId
				});
			
			if (insertError) {
				error = getUserFriendlyErrorMessage(insertError);
				return;
			}
			
			// Reset form and refresh categories
			newCategory.name = '';
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
	
	{#if loading}
		<div class="flex items-center justify-center p-8">
			<div class="animate-spin mr-2">
				<Icon icon="heroicons:arrow-path" width="24" height="24" />
			</div>
			<span>Loading categories...</span>
		</div>
	{:else if error}
		<Alert variant="destructive">
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{:else}
		<div class="grid grid-cols-1 gap-6">
			<!-- Create new category form -->
			<Card>
				<CardHeader>
					<CardTitle>Add New Category</CardTitle>
				</CardHeader>
				<CardContent>
					<form class="space-y-4" on:submit|preventDefault={handleCreateCategory}>
						<div class="grid grid-cols-1 md:grid-cols-5 gap-4">
							<div class="md:col-span-4">
								<input
									type="text"
									placeholder="Enter category name"
									class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
									bind:value={newCategory.name}
									disabled={saving}
								/>
							</div>
							<div class="md:col-span-1">
								<Button type="submit" class="w-full" disabled={saving || !newCategory.name.trim()}>
									{saving ? 'Creating...' : 'Create Category'}
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
									{#each categories as category}
										<tr class="hover:bg-muted/30">
											<td class="px-4 py-3">
												{#if editingCategory && editingCategory.id === category.id}
													<input
														type="text"
														class="w-full px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
														bind:value={editingCategory.name}
														on:keydown={(e) => {
															if (e instanceof KeyboardEvent && e.key === 'Enter') {
																handleUpdateCategory();
															}
														}}
													/>
												{:else}
													{category.name}
												{/if}
											</td>
											<td class="px-4 py-3 text-center">{category.template_count}</td>
											<td class="px-4 py-3 text-right">
												<div class="flex justify-end gap-1">
													{#if editingCategory && editingCategory.id === category.id}
														<Button 
															variant="ghost" 
															size="sm"
															class="h-8 w-8 p-0"
															title="Save"
															on:click={handleUpdateCategory}
														>
															<Icon icon="heroicons:check" class="h-4 w-4 text-green-500" />
														</Button>
														<Button 
															variant="ghost" 
															size="sm"
															class="h-8 w-8 p-0"
															title="Cancel"
															on:click={() => editingCategory = null}
														>
															<Icon icon="heroicons:x-mark" class="h-4 w-4 text-red-500" />
														</Button>
													{:else}
														<Button 
															variant="ghost" 
															size="sm"
															class="h-8 w-8 p-0"
															title="Edit"
															on:click={() => editingCategory = { ...category }}
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
	{/if}
</div>

<!-- Delete Modal -->
{#if deleteModalOpen && categoryToDelete}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
		<div class="bg-background rounded-lg shadow-lg p-6 max-w-md w-full">
			<h3 class="text-xl font-semibold mb-4">Delete Category</h3>
			<p class="mb-6">
				Are you sure you want to delete "{categoryToDelete.name}"? This action cannot be undone.
				{#if categoryToDelete.template_count && categoryToDelete.template_count > 0}
					<span class="block mt-2 text-red-500">
						This category contains {categoryToDelete.template_count} templates. Deleting it will remove the category from these templates.
					</span>
				{/if}
			</p>
			<div class="flex justify-end gap-2">
				<Button 
					variant="outline" 
					on:click={() => { deleteModalOpen = false; categoryToDelete = null; }}
				>
					Cancel
				</Button>
				<Button 
					variant="destructive" 
					on:click={handleDeleteCategory}
				>
					Delete
				</Button>
			</div>
		</div>
	</div>
{/if} 