<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import * as Dialog from '$lib/components/ui/dialog';
	import Icon from '@iconify/svelte';
	
	interface User {
		id: string;
		email: string;
		last_sign_in_at: string;
		created_at: string;
		is_admin: boolean;
		has_profile: boolean;
		template_count: number;
		category_count: number;
	}
	
	let users: User[] = [];
	let loading = true;
	let error = '';
	
	// For edit dialog
	let editDialogOpen = false;
	let editingUserId = '';
	let editingUserEmail = '';
	let isAdmin = false;
	let saving = false;
	let saveSuccess = false;
	
	// For delete dialog
	let deleteDialogOpen = false;
	let deletingUserId = '';
	let deletingUserEmail = '';
	let deletingUserTemplateCount = 0;
	let deletingUserCategoryCount = 0;
	let deleting = false;
	let deleteSuccess = false;
	
	onMount(() => {
		loadUsers();
	});
	
	async function loadUsers() {
		try {
			loading = true;
			error = '';
			
			// Fetch users from our API endpoint
			const response = await fetch('/api/admin/users');
			const data = await response.json();
			
			if (!response.ok) {
				error = data.error || 'Failed to load users';
				return;
			}
			
			users = data.users || [];
			
		} catch (e: any) {
			error = e.message || 'Failed to load users';
		} finally {
			loading = false;
		}
	}
	
	function openEditDialog(user: User) {
		editingUserId = user.id;
		editingUserEmail = user.email;
		isAdmin = user.is_admin;
		editDialogOpen = true;
	}
	
	function openDeleteDialog(user: User) {
		deletingUserId = user.id;
		deletingUserEmail = user.email;
		deletingUserTemplateCount = user.template_count;
		deletingUserCategoryCount = user.category_count;
		deleteDialogOpen = true;
	}
	
	async function saveUser() {
		try {
			saving = true;
			saveSuccess = false;
			error = '';
			
			if (isAdmin) {
				// Check if profile exists, if not create it
				if (!users.find(u => u.id === editingUserId)?.has_profile) {
					const { error: insertError } = await supabase
						.from('user_profiles')
						.insert({
							id: editingUserId,
							is_admin: true
						});
					
					if (insertError) {
						error = insertError.message;
						return;
					}
				} else {
					// Update existing profile
					const { error: updateError } = await supabase
						.from('user_profiles')
						.update({ is_admin: true })
						.eq('id', editingUserId);
					
					if (updateError) {
						error = updateError.message;
						return;
					}
				}
			} else {
				// If user has a profile, update it to remove admin status
				if (users.find(u => u.id === editingUserId)?.has_profile) {
					const { error: updateError } = await supabase
						.from('user_profiles')
						.update({ is_admin: false })
						.eq('id', editingUserId);
					
					if (updateError) {
						error = updateError.message;
						return;
					}
				}
			}
			
			saveSuccess = true;
			await loadUsers();
			// Close dialog after a short delay
			setTimeout(() => {
				editDialogOpen = false;
			}, 1000);
			
		} catch (e: any) {
			error = e.message || 'Failed to update user';
		} finally {
			saving = false;
		}
	}
	
	async function deleteUser() {
		try {
			deleting = true;
			deleteSuccess = false;
			error = '';
			
			const response = await fetch('/api/admin/users', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ userId: deletingUserId })
			});
			
			const data = await response.json();
			
			if (!response.ok) {
				error = data.error || 'Failed to delete user';
				return;
			}
			
			deleteSuccess = true;
			await loadUsers();
			// Close dialog after a short delay
			setTimeout(() => {
				deleteDialogOpen = false;
			}, 1500);
			
		} catch (e: any) {
			error = e.message || 'Failed to delete user';
		} finally {
			deleting = false;
		}
	}
</script>

<div>
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">User Management</h1>
		<div class="flex gap-2">
			<Button variant="outline" on:click={() => goto('/admin')}>
				<Icon icon="mdi:arrow-left" class="mr-2 h-4 w-4" />
				Back to Dashboard
			</Button>
			<Button variant="outline" on:click={loadUsers}>
				<Icon icon="mdi:refresh" class="mr-2 h-4 w-4" />
				Refresh
			</Button>
		</div>
	</div>
	
	{#if error}
		<Alert variant="destructive" class="mb-4">
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}
	
	{#if loading}
		<div class="flex justify-center py-12">
			<div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
		</div>
	{:else if users.length === 0}
		<Alert class="mb-4">
			<AlertDescription>No users found</AlertDescription>
		</Alert>
	{:else}
		<Card>
			<CardHeader>
				<CardTitle>Users</CardTitle>
				<CardDescription>Manage user accounts and permissions</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="overflow-x-auto">
					<table class="w-full border-collapse">
						<thead>
							<tr class="bg-muted/50">
								<th class="text-left p-2 font-medium">Email</th>
								<th class="text-left p-2 font-medium">Created</th>
								<th class="text-left p-2 font-medium">Last Sign In</th>
								<th class="text-center p-2 font-medium">Templates</th>
								<th class="text-center p-2 font-medium">Categories</th>
								<th class="text-center p-2 font-medium">Admin</th>
								<th class="text-right p-2 font-medium">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each users as user}
								<tr class="border-b hover:bg-muted/20">
									<td class="p-2">{user.email}</td>
									<td class="p-2">{new Date(user.created_at).toLocaleDateString()}</td>
									<td class="p-2">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}</td>
									<td class="p-2 text-center">
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300">
											{user.template_count}
										</span>
									</td>
									<td class="p-2 text-center">
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-800/20 dark:text-purple-300">
											{user.category_count}
										</span>
									</td>
									<td class="p-2 text-center">
										{#if user.is_admin}
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300">
												Admin
											</span>
										{:else}
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300">
												User
											</span>
										{/if}
									</td>
									<td class="p-2 text-right">
										<div class="flex gap-1 justify-end">
											<Button size="sm" variant="outline" on:click={() => openEditDialog(user)}>
												<Icon icon="mdi:pencil" class="h-4 w-4" />
											</Button>
											<Button 
												size="sm" 
												variant="destructive" 
												on:click={() => openDeleteDialog(user)}
												disabled={user.is_admin}
												title={user.is_admin ? 'Cannot delete admin users' : 'Delete user and all content'}
											>
												<Icon icon="mdi:delete" class="h-4 w-4" />
											</Button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>

<!-- Edit User Dialog -->
<Dialog.Root bind:open={editDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Edit User</Dialog.Title>
			<Dialog.Description>
				Update user permissions
			</Dialog.Description>
		</Dialog.Header>
		
		{#if error && editDialogOpen}
			<Alert variant="destructive" class="mb-4">
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		{/if}
		
		{#if saveSuccess}
			<Alert class="mb-4 bg-green-50 border-green-500 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300">
				<AlertDescription>User updated successfully</AlertDescription>
			</Alert>
		{/if}
		
		<div class="space-y-4 py-4">
			<div>
				<p class="text-sm text-muted-foreground mb-1">Email</p>
				<p class="font-medium">{editingUserEmail}</p>
			</div>
			
			<div class="flex items-center space-x-2">
				<input
					type="checkbox"
					id="is-admin"
					bind:checked={isAdmin}
					class="h-4 w-4 rounded border-gray-300 focus:ring-primary"
				/>
				<label for="is-admin" class="text-sm font-medium">
					Administrator
				</label>
			</div>
		</div>
		
		<Dialog.Footer>
			<Button 
				variant="outline" 
				on:click={() => editDialogOpen = false}
			>
				Cancel
			</Button>
			<Button 
				type="button" 
				disabled={saving}
				on:click={saveUser}
			>
				{#if saving}
					<Icon icon="mdi:loading" class="mr-2 h-4 w-4 animate-spin" />
					Saving...
				{:else}
					Save Changes
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete User Dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete User</Dialog.Title>
			<Dialog.Description>
				This action cannot be undone. All user data and content will be permanently deleted.
			</Dialog.Description>
		</Dialog.Header>
		
		{#if error && deleteDialogOpen}
			<Alert variant="destructive" class="mb-4">
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		{/if}
		
		{#if deleteSuccess}
			<Alert class="mb-4 bg-green-50 border-green-500 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300">
				<AlertDescription>User deleted successfully</AlertDescription>
			</Alert>
		{/if}
		
		<div class="space-y-4 py-4">
			<div>
				<p class="text-sm text-muted-foreground mb-1">Email</p>
				<p class="font-medium">{deletingUserEmail}</p>
			</div>
			
			<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
				<p class="text-sm text-red-800 dark:text-red-300 font-medium mb-2">Content that will be deleted:</p>
				<ul class="text-sm text-red-700 dark:text-red-400 space-y-1">
					<li>• {deletingUserTemplateCount} template(s)</li>
					<li>• {deletingUserCategoryCount} category/categories</li>
					<li>• All template variables</li>
					<li>• User profile and settings</li>
				</ul>
			</div>
			
			<div class="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
				<Icon icon="mdi:warning" class="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
				<p class="text-sm text-yellow-800 dark:text-yellow-300">
					This action is permanent and cannot be undone.
				</p>
			</div>
		</div>
		
		<Dialog.Footer>
			<Button 
				variant="outline" 
				on:click={() => deleteDialogOpen = false}
				disabled={deleting}
			>
				Cancel
			</Button>
			<Button 
				type="button" 
				variant="destructive"
				disabled={deleting}
				on:click={deleteUser}
			>
				{#if deleting}
					<Icon icon="mdi:loading" class="mr-2 h-4 w-4 animate-spin" />
					Deleting...
				{:else}
					<Icon icon="mdi:delete" class="mr-2 h-4 w-4" />
					Delete User
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root> 