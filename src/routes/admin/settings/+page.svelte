<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	
	let saving = false;
	let saveSuccess = false;
	
	// Demo placeholder settings
	let siteName = 'Prompt Templates';
	let siteDescription = 'A collection of useful prompt templates for various AI models';
	let maxTemplatesPerUser = '10';
	
	async function saveSettings() {
		saving = true;
		
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		saveSuccess = true;
		saving = false;
		
		// Hide success message after 3 seconds
		setTimeout(() => {
			saveSuccess = false;
		}, 3000);
	}
</script>

<div>
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">Site Settings</h1>
		<div class="flex gap-2">
			<Button variant="outline" on:click={() => goto('/admin')}>
				<Icon icon="mdi:arrow-left" class="mr-2 h-4 w-4" />
				Back to Dashboard
			</Button>
			<Button on:click={saveSettings} disabled={saving}>
				{#if saving}
					<Icon icon="mdi:loading" class="mr-2 h-4 w-4 animate-spin" />
					Saving...
				{:else}
					<Icon icon="mdi:content-save" class="mr-2 h-4 w-4" />
					Save Changes
				{/if}
			</Button>
		</div>
	</div>
	
	{#if saveSuccess}
		<Alert class="mb-4 bg-green-50 border-green-500 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300">
			<AlertDescription>Settings saved successfully</AlertDescription>
		</Alert>
	{/if}
	
	<Card class="mb-6">
		<CardHeader>
			<CardTitle>General Settings</CardTitle>
			<CardDescription>Basic site configuration</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="site-name">Site Name</Label>
					<Input id="site-name" type="text" bind:value={siteName} />
				</div>
				
				<div class="space-y-2">
					<Label for="site-description">Site Description</Label>
					<Textarea id="site-description" bind:value={siteDescription} />
				</div>
			</div>
		</CardContent>
	</Card>
	
	<Card>
		<CardHeader>
			<CardTitle>Limits & Restrictions</CardTitle>
			<CardDescription>Configure usage limitations</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="max-templates">Maximum Templates Per User</Label>
					<Input
						id="max-templates"
						type="number"
						bind:value={maxTemplatesPerUser}
						min="1"
						max="100"
					/>
					<p class="text-xs text-muted-foreground">
						Set to 0 for unlimited templates per user
					</p>
				</div>
			</div>
		</CardContent>
		<CardFooter>
			<p class="text-sm text-muted-foreground">
				These settings will be applied to all users except administrators.
			</p>
		</CardFooter>
	</Card>
</div> 