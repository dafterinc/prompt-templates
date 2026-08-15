<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import Icon from '@iconify/svelte';
	import { toast } from 'svelte-sonner';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	$: email = data.email;
	$: isAdmin = data.profile.is_admin;

	let fullName = data.profile.full_name ?? '';
	let companyName = data.profile.company_name ?? '';
	let industry = data.profile.industry ?? '';
	let companyWebsite = data.profile.company_website ?? '';
	let teamSize = data.profile.team_size ?? '';
	let usagePurpose = data.profile.usage_purpose ?? '';
	let profileImageUrl = data.profile.profile_image_url ?? null;

	let saving = false;
	let uploading = false;

	$: userInitials = email ? email.substring(0, 2).toUpperCase() : '';
	$: updateError = form && form.scope === 'update' ? form.error : '';
	$: imageError = form && form.scope === 'image' ? form.error : '';

	const teamSizeOptions = [
		'Just me',
		'2-10 employees',
		'11-50 employees',
		'51-200 employees',
		'201-500 employees',
		'501-1000 employees',
		'1001+ employees'
	];
	const industryOptions = [
		'Technology',
		'Healthcare',
		'Education',
		'Finance',
		'Marketing',
		'Retail',
		'Manufacturing',
		'Legal',
		'Creative',
		'Consulting',
		'Non-profit',
		'Government',
		'Other'
	];
	const usagePurposeOptions = [
		'Customer Support',
		'Content Creation',
		'Marketing',
		'Product Documentation',
		'Internal Communication',
		'Knowledge Management',
		'Other'
	];
</script>

<svelte:head>
	<title>User Profile | Prompt Templates</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex justify-between items-center">
		<h1 class="text-3xl font-bold tracking-tight">Profile</h1>
	</div>

	<Tabs value="profile" class="w-full">
		<TabsList class="grid w-full md:w-[400px] grid-cols-2">
			<TabsTrigger value="profile">Profile</TabsTrigger>
			<TabsTrigger value="account">Account</TabsTrigger>
		</TabsList>

		<TabsContent value="profile" class="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Profile</CardTitle>
					<CardDescription>Manage your public profile information.</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					<div class="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
						<div class="relative">
							<Avatar class="w-24 h-24 text-2xl">
								{#if profileImageUrl}
									<AvatarImage src={profileImageUrl} alt={fullName || email || 'User'} />
								{/if}
								<AvatarFallback>{userInitials}</AvatarFallback>
							</Avatar>

							<form
								method="POST"
								action="?/uploadImage"
								enctype="multipart/form-data"
								use:enhance={() => {
									uploading = true;
									return async ({ result, update }) => {
										await update({ reset: false });
										if (result.type === 'success' && result.data?.imageUrl) {
											profileImageUrl = String(result.data.imageUrl);
											toast.success('Profile image updated');
										} else if (result.type === 'failure') {
											toast.error('Error updating profile image');
										}
										uploading = false;
									};
								}}
							>
								<label for="profile-image" class="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-primary text-primary-foreground cursor-pointer hover:bg-primary/80 transition-colors">
									<Icon icon="heroicons:camera" width="16" height="16" />
									<span class="sr-only">Upload Image</span>
								</label>
								<input
									id="profile-image"
									name="file"
									type="file"
									accept="image/*"
									class="hidden"
									on:change={(e) => e.currentTarget.form?.requestSubmit()}
								/>
							</form>
						</div>

						<div class="space-y-1 text-center sm:text-left">
							<h3 class="text-xl font-medium">{fullName || email || 'User'}</h3>
							<p class="text-sm text-muted-foreground">{email}</p>
							{#if isAdmin}
								<div class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-primary text-primary-foreground">
									Admin
								</div>
							{/if}
							{#if uploading}
								<div class="flex items-center mt-2">
									<div class="animate-spin mr-2">
										<Icon icon="heroicons:arrow-path" width="16" height="16" />
									</div>
									<span class="text-sm">Uploading image...</span>
								</div>
							{/if}
							{#if imageError}
								<p class="text-sm text-destructive mt-2">{imageError}</p>
							{/if}
						</div>
					</div>

					<form
						id="profile-form"
						method="POST"
						action="?/update"
						class="space-y-4"
						use:enhance={() => {
							saving = true;
							return async ({ result, update }) => {
								await update({ reset: false });
								if (result.type === 'success') toast.success('Profile updated successfully');
								saving = false;
							};
						}}
					>
						{#if form && form.scope === 'update' && form.success}
							<div class="bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400 p-3 rounded-md text-sm">
								Profile updated successfully!
							</div>
						{/if}
						{#if updateError}
							<div class="bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400 p-3 rounded-md text-sm">{updateError}</div>
						{/if}

						<input type="hidden" name="industry" value={industry} />
						<input type="hidden" name="team_size" value={teamSize} />
						<input type="hidden" name="usage_purpose" value={usagePurpose} />

						<div class="grid w-full items-center gap-1.5">
							<Label for="fullName">Full Name</Label>
							<Input id="fullName" name="full_name" bind:value={fullName} placeholder="Enter your full name" />
						</div>

						<div class="grid w-full items-center gap-1.5">
							<Label for="companyName">Company Name</Label>
							<Input id="companyName" name="company_name" bind:value={companyName} placeholder="Enter your company name" />
						</div>

						<div class="grid w-full items-center gap-1.5">
							<Label for="industry">Industry</Label>
							<Select.Root
								selected={industry ? { value: industry, label: industry } : undefined}
								onSelectedChange={(e) => e && (industry = String(e.value))}
							>
								<Select.Trigger id="industry" class="w-full">
									<Select.Value placeholder="Select your industry" />
								</Select.Trigger>
								<Select.Content>
									{#each industryOptions as industryOption}
										<Select.Item value={industryOption}>{industryOption}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>

						<div class="grid w-full items-center gap-1.5">
							<Label for="teamSize">Team Size</Label>
							<Select.Root
								selected={teamSize ? { value: teamSize, label: teamSize } : undefined}
								onSelectedChange={(e) => e && (teamSize = String(e.value))}
							>
								<Select.Trigger id="teamSize" class="w-full">
									<Select.Value placeholder="Select your team size" />
								</Select.Trigger>
								<Select.Content>
									{#each teamSizeOptions as sizeOption}
										<Select.Item value={sizeOption}>{sizeOption}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>

						<div class="grid w-full items-center gap-1.5">
							<Label for="usagePurpose">What are you primarily using this app for?</Label>
							<Select.Root
								selected={usagePurpose ? { value: usagePurpose, label: usagePurpose } : undefined}
								onSelectedChange={(e) => e && (usagePurpose = String(e.value))}
							>
								<Select.Trigger id="usagePurpose" class="w-full">
									<Select.Value placeholder="Select primary usage" />
								</Select.Trigger>
								<Select.Content>
									{#each usagePurposeOptions as purposeOption}
										<Select.Item value={purposeOption}>{purposeOption}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>

						<div class="grid w-full items-center gap-1.5">
							<Label for="companyWebsite">Company Website</Label>
							<Input id="companyWebsite" name="company_website" bind:value={companyWebsite} placeholder="https://example.com" />
						</div>
					</form>
				</CardContent>
				<CardFooter>
					<Button type="submit" form="profile-form" disabled={saving}>
						{#if saving}
							<Icon icon="heroicons:arrow-path" class="mr-2 h-4 w-4 animate-spin" />
							<span>Saving...</span>
						{:else}
							<span>Save Changes</span>
						{/if}
					</Button>
				</CardFooter>
			</Card>
		</TabsContent>

		<TabsContent value="account" class="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Account Settings</CardTitle>
					<CardDescription>Manage your account settings and preferences.</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="space-y-2">
						<h3 class="font-medium">Email Address</h3>
						<p class="text-sm text-muted-foreground">{email}</p>
					</div>

					<div class="space-y-2">
						<h3 class="font-medium">Password</h3>
						<p class="text-sm text-muted-foreground">Change your password to keep your account secure.</p>
						<Button variant="outline" href="/auth/forgot-password">Change Password</Button>
					</div>
				</CardContent>
			</Card>
		</TabsContent>
	</Tabs>
</div>
