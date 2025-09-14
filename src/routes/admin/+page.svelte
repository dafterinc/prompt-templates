<script lang="ts">
	import { goto } from '$app/navigation';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
</script>

<svelte:head>
	<title>Admin Dashboard | Prompt Templates</title>
</svelte:head>

<div class="space-y-4 px-4 py-4 sm:px-6 sm:py-6">
	<p class="text-muted-foreground">Manage your site content and settings</p>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
		<Card class="hover:shadow-md transition-shadow cursor-pointer" on:click={() => goto('/admin/directory')}>
			<CardHeader>
				<div class="flex items-center justify-between">
					<CardTitle>Template Directory</CardTitle>
					<div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
						<Icon icon="mdi:book-open-variant" class="h-5 w-5 text-primary" />
					</div>
				</div>
				<CardDescription>Manage template directory categories and entries</CardDescription>
			</CardHeader>
			<CardContent>
				<p>Create, edit, and organize templates in the public directory.</p>
			</CardContent>
			<CardFooter>
				<Button variant="outline" class="w-full" on:click={() => goto('/admin/directory')}>
					<Icon icon="mdi:arrow-right" class="mr-2 h-4 w-4" />
					Manage Directory
				</Button>
			</CardFooter>
		</Card>

		<Card class="hover:shadow-md transition-shadow cursor-pointer" on:click={() => goto('/admin/users')}>
			<CardHeader>
				<div class="flex items-center justify-between">
					<CardTitle>User Management</CardTitle>
					<div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
						<Icon icon="mdi:account-group" class="h-5 w-5 text-primary" />
					</div>
				</div>
				<CardDescription>Manage user accounts and permissions</CardDescription>
			</CardHeader>
			<CardContent>
				<p>View, edit, and assign admin privileges to users.</p>
			</CardContent>
			<CardFooter>
				<Button variant="outline" class="w-full" on:click={() => goto('/admin/users')}>
					<Icon icon="mdi:arrow-right" class="mr-2 h-4 w-4" />
					Manage Users
				</Button>
			</CardFooter>
		</Card>

		<Card class="hover:shadow-md transition-shadow cursor-pointer" on:click={() => goto('/admin/settings')}>
			<CardHeader>
				<div class="flex items-center justify-between">
					<CardTitle>Site Settings</CardTitle>
					<div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
						<Icon icon="mdi:cog" class="h-5 w-5 text-primary" />
					</div>
				</div>
				<CardDescription>Configure application settings</CardDescription>
			</CardHeader>
			<CardContent>
				<p>Update site configuration and global parameters.</p>
			</CardContent>
			<CardFooter>
				<Button variant="outline" class="w-full" on:click={() => goto('/admin/settings')}>
					<Icon icon="mdi:arrow-right" class="mr-2 h-4 w-4" />
					Site Settings
				</Button>
			</CardFooter>
		</Card>
	</div>
</div> 