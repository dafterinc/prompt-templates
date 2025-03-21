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
	
	onMount(() => {
		loadUsers();
	});
	
	async function loadUsers() {
		try {
			loading = true;
			error = '';
			
			// Fetch users from auth API
			const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
			
			if (authError) {
				error = authError.message;
				return;
			}
			
			// Fetch user_profiles to check admin status
			const { data: profiles, error: profilesError } = await supabase
				.from('user_profiles')
				.select('id, is_admin');
			
			if (profilesError) {
				error = profilesError.message;
				return;
			}
			
			// Combine data
			users = (authUsers?.users || []).map(user => {
				const profile = profiles ? profiles.find(p => p.id === user.id) : null;
				return {
					id: user.id,
					email: user.email || '',
					last_sign_in_at: user.last_sign_in_at || '',
					created_at: user.created_at,
					is_admin: profile ? profile.is_admin : false,
					has_profile: !!profile
				};
			});
			
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
										<Button size="sm" variant="outline" on:click={() => openEditDialog(user)}>
											<Icon icon="mdi:pencil" class="h-4 w-4" />
										</Button>
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