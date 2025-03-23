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

<div class="container mx-auto px-4 py-6 max-w-6xl">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
		<h1 class="text-xl sm:text-2xl font-bold">Categories</h1>
		<div>
			<a href="/templates" class="inline-flex items-center text-muted-foreground hover:text-foreground">
				&larr; <span class="ml-1">Back to Templates</span>
			</a>
		</div>
	</div>
	
	{#if error}
		<Alert variant="destructive" class="mb-4">
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}
	
	<div class="flex flex-col lg:flex-row gap-6">
		<div class="w-full lg:w-1/3">
			<Card>
				<CardHeader>
					<CardTitle>Add New Category</CardTitle>
				</CardHeader>
				<CardContent>
					<form on:submit|preventDefault={handleCreateCategory} class="space-y-4">
						<div>
							<label for="name" class="block text-sm font-medium mb-1">Name *</label>
							<input
								id="name"
								type="text"
								bind:value={newCategory.name}
								required
								class="w-full p-2 border rounded-md bg-background text-foreground"
								placeholder="Enter category name"
							/>
						</div>
						
						<div class="flex justify-end">
							<Button
								type="submit"
								disabled={saving || !newCategory.name.trim()}
							>
								{saving ? 'Creating...' : 'Create Category'}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
		
		<div class="w-full lg:w-2/3">
			{#if loading}
				<div class="flex justify-center py-12">
					<div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
				</div>
			{:else if categories.length === 0}
				<Card>
					<CardContent class="p-8 text-center">
						<p class="text-muted-foreground">No categories found. Create your first category to get started.</p>
					</CardContent>
				</Card>
			{:else}
				<Card>
					<CardContent class="p-0">
						<div class="overflow-hidden">
							<table class="w-full divide-y divide-border">
								<thead class="bg-muted/50">
									<tr>
										<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
											Name
										</th>
										<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
											Templates
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
												<td colspan="2" class="px-6 py-4">
													<form on:submit|preventDefault={handleUpdateCategory}>
														<input
															type="text"
															bind:value={editingCategory.name}
															required
															class="w-full p-2 border rounded-md bg-background text-foreground"
														/>
													</form>
												</td>
												<td class="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
													<Button
														variant="outline"
														size="icon"
														on:click={cancelEdit}
														title="Cancel"
													>
														<Icon icon="mdi:close" class="h-4 w-4" />
														<span class="sr-only">Cancel</span>
													</Button>
													<Button
														variant="default"
														size="icon"
														on:click={handleUpdateCategory}
														disabled={saving || !editingCategory.name.trim()}
														title="Save"
													>
														<Icon icon="mdi:check" class="h-4 w-4" />
														<span class="sr-only">Save</span>
													</Button>
												</td>
											{:else}
												<td class="px-6 py-4 whitespace-nowrap">
													<div class="text-sm font-medium">{category.name}</div>
												</td>
												<td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
													{category.template_count || 0}
												</td>
												<td class="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
													<Button
														variant="ghost"
														size="icon"
														on:click={() => startEdit(category)}
														title="Edit"
													>
														<Icon icon="mdi:pencil" class="h-4 w-4" />
														<span class="sr-only">Edit</span>
													</Button>
													<Button
														variant="ghost"
														size="icon"
														on:click={() => confirmDelete(category)}
														disabled={(category.template_count || 0) > 0}
														class="text-destructive hover:text-destructive"
														title="Delete"
													>
														<Icon icon="mdi:delete" class="h-4 w-4" />
														<span class="sr-only">Delete</span>
													</Button>
												</td>
											{/if}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			{/if}
		</div>
	</div>
	
	{#if deleteModalOpen && categoryToDelete}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
			<Card class="max-w-md w-full">
				<CardHeader>
					<CardTitle>Delete Category</CardTitle>
				</CardHeader>
				<CardContent>
					<p>Are you sure you want to delete the category "{categoryToDelete.name}"? This action cannot be undone.</p>
				</CardContent>
				<CardFooter class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 sm:justify-end">
					<Button 
						variant="outline" 
						on:click={() => { deleteModalOpen = false; categoryToDelete = null; }}
						class="sm:mr-2 w-full sm:w-auto"
					>
						Cancel
					</Button>
					<Button 
						variant="destructive"
						on:click={handleDeleteCategory}
						disabled={saving}
						class="w-full sm:w-auto"
					>
						{saving ? 'Deleting...' : 'Delete Category'}
					</Button>
				</CardFooter>
			</Card>
		</div>
	{/if}
</div> 