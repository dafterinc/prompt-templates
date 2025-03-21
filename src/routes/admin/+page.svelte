<script lang="ts">
	import { goto } from '$app/navigation';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
	<Card class="hover:shadow-md transition-shadow cursor-pointer" on:click={() => goto('/admin/directory')}>
		<CardHeader>
			<div class="flex justify-between">
				<CardTitle>Template Directory</CardTitle>
				<Icon icon="mdi:book-open-variant" class="h-6 w-6 text-primary" />
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
			<div class="flex justify-between">
				<CardTitle>User Management</CardTitle>
				<Icon icon="mdi:account-group" class="h-6 w-6 text-primary" />
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
			<div class="flex justify-between">
				<CardTitle>Site Settings</CardTitle>
				<Icon icon="mdi:cog" class="h-6 w-6 text-primary" />
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