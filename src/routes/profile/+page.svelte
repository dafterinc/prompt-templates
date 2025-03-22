<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { Button } from '$lib/components/ui/button';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import Icon from '@iconify/svelte';
	import type { User } from '@supabase/supabase-js';
	import { toast } from 'svelte-sonner';
	
	let user: User | null = null;
	let userProfile: any = null;
	let loading = true;
	let saving = false;
	let uploading = false;
	let userInitials = '';
	let fullName = '';
	let companyName = '';
	let industry = '';
	let companyWebsite = '';
	let teamSize = '';
	let usagePurpose = '';
	let profileImageUrl: string | null = null;
	let profileImageFile: FileList | null = null;
	let updateSuccess = false;
	let updateError = '';
	
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
	
	// Fetch the current user and their profile data
	async function fetchUserProfile() {
		loading = true;
		updateSuccess = false;
		updateError = '';
		
		try {
			const { data: sessionData } = await supabase.auth.getSession();
			user = sessionData?.session?.user || null;
			
			if (user) {
				userInitials = user.email ? user.email.substring(0, 2).toUpperCase() : '';
				
				// Fetch user profile from the database
				const { data, error } = await supabase
					.from('user_profiles')
					.select('*')
					.eq('id', user.id)
					.single();
				
				if (error) {
					if (import.meta.env.DEV) {
						console.error('Error fetching user profile:', error);
					}
					
					// If no rows returned, create a new profile
					if (error.code === 'PGRST116') {
						// Create a new user profile
						const { data: newProfile, error: createError } = await supabase
							.from('user_profiles')
							.insert({
								id: user.id,
								full_name: '',
								is_admin: false,
								created_at: new Date(),
								updated_at: new Date()
							})
							.select('*')
							.single();
						
						if (createError) {
							console.error('Error creating user profile:', createError);
							updateError = 'Failed to create user profile';
						} else {
							userProfile = newProfile;
						}
					} else {
						updateError = 'Error loading profile data';
					}
				} else {
					userProfile = data;
					fullName = userProfile?.full_name || '';
					profileImageUrl = userProfile?.profile_image_url || null;
					companyName = userProfile?.company_name || '';
					industry = userProfile?.industry || '';
					companyWebsite = userProfile?.company_website || '';
					teamSize = userProfile?.team_size || '';
					usagePurpose = userProfile?.usage_purpose || '';
				}
			}
		} catch (err) {
			console.error('Failed to fetch profile:', err);
			updateError = 'An unexpected error occurred while loading profile';
		} finally {
			loading = false;
		}
	}
	
	// Upload profile image
	async function uploadProfileImage() {
		if (!user || !profileImageFile || profileImageFile.length === 0) return;
		
		uploading = true;
		updateError = '';
		
		try {
			const file = profileImageFile[0];
			const fileExt = file.name.split('.').pop();
			const filePath = `${user.id}/${Date.now()}.${fileExt}`;
			
			// Check file size
			if (file.size > 2 * 1024 * 1024) { // 2MB limit
				updateError = 'Image must be less than 2MB';
				toast.error('Image must be less than 2MB');
				uploading = false;
				return;
			}

			// First check if bucket exists, and if not, create it
			const { data: buckets } = await supabase.storage.listBuckets();
			
			// Delete previous file if it exists and is different
			if (profileImageUrl) {
				// Extract the path from the URL
				try {
					const url = new URL(profileImageUrl);
					const pathParts = url.pathname.split('/');
					const pathMatch = pathParts.indexOf('profile_images');
					
					if (pathMatch !== -1) {
						const oldPath = pathParts.slice(pathMatch + 1).join('/');
						
						const { error: removeError } = await supabase.storage
							.from('profile_images')
							.remove([oldPath]);
						
						if (removeError && import.meta.env.DEV) {
							console.error('Error removing old image (non-critical):', removeError);
						}
					}
				} catch (e) {
					if (import.meta.env.DEV) {
						console.error('Failed to parse previous image URL (non-critical):', e);
					}
				}
			}
			
			// Upload the file
			const { error: uploadError, data: uploadData } = await supabase.storage
				.from('profile_images')
				.upload(filePath, file, {
					cacheControl: '3600',
					upsert: true
				});
			
			if (uploadError) {
				updateError = 'Error uploading image: ' + uploadError.message;
				toast.error('Error uploading image');
				console.error('Error uploading image:', uploadError);
				return;
			}
			
			// Make the image public
			const { data: urlData } = supabase.storage
				.from('profile_images')
				.getPublicUrl(filePath);
			
			profileImageUrl = urlData.publicUrl;
			
			// Update the profile with the new image URL
			const { error: updateProfileError } = await supabase
				.from('user_profiles')
				.update({
					profile_image_url: profileImageUrl,
					updated_at: new Date()
				})
				.eq('id', user.id);
			
			if (updateProfileError) {
				updateError = 'Error updating profile: ' + updateProfileError.message;
				toast.error('Error updating profile image');
				console.error('Error updating profile:', updateProfileError);
			} else {
				toast.success('Profile image updated successfully');
			}
		} catch (err: any) {
			updateError = 'An unexpected error occurred during upload';
			toast.error('An unexpected error occurred during upload');
			console.error('Failed to upload image:', err);
		} finally {
			uploading = false;
		}
	}
	
	// Handle file input change
	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			profileImageFile = input.files;
			uploadProfileImage();
		}
	}
	
	// Handle select change
	function handleSelectChange(field: string, value: unknown) {
		if (typeof value !== 'string') return;
		
		if (field === 'industry') {
			industry = value;
		} else if (field === 'teamSize') {
			teamSize = value;
		} else if (field === 'usagePurpose') {
			usagePurpose = value;
		}
	}
	
	// Update the user profile
	async function updateProfile() {
		if (!user) return;
		
		saving = true;
		updateSuccess = false;
		updateError = '';
		
		try {
			const { error } = await supabase
				.from('user_profiles')
				.update({
					full_name: fullName,
					company_name: companyName,
					industry,
					company_website: companyWebsite,
					team_size: teamSize,
					usage_purpose: usagePurpose,
					updated_at: new Date()
				})
				.eq('id', user.id);
			
			if (error) {
				updateError = 'Failed to update profile: ' + error.message;
				toast.error('Failed to update profile');
				console.error('Error updating profile:', error);
			} else {
				updateSuccess = true;
				toast.success('Profile updated successfully');
			}
		} catch (err: any) {
			updateError = 'An unexpected error occurred';
			toast.error('An unexpected error occurred');
			console.error('Failed to update profile:', err);
		} finally {
			saving = false;
		}
	}
	
	onMount(() => {
		fetchUserProfile();
	});
</script>

<svelte:head>
	<title>User Profile | Prompt Templates</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex justify-between items-center">
		<h1 class="text-3xl font-bold tracking-tight">Profile</h1>
	</div>
	
	{#if loading}
		<div class="flex items-center justify-center p-8">
			<div class="animate-spin mr-2">
				<Icon icon="heroicons:arrow-path" width="24" height="24" />
			</div>
			<span>Loading profile...</span>
		</div>
	{:else if !user}
		<Card>
			<CardHeader>
				<CardTitle>Not Signed In</CardTitle>
				<CardDescription>
					Please sign in to view and edit your profile.
				</CardDescription>
			</CardHeader>
			<CardFooter>
				<a href="/auth/login">
					<Button>Sign In</Button>
				</a>
			</CardFooter>
		</Card>
	{:else}
		<Tabs value="profile" class="w-full">
			<TabsList class="grid w-full md:w-[400px] grid-cols-2">
				<TabsTrigger value="profile">Profile</TabsTrigger>
				<TabsTrigger value="account">Account</TabsTrigger>
			</TabsList>
			
			<TabsContent value="profile" class="space-y-4">
				<Card>
					<CardHeader>
						<CardTitle>Profile</CardTitle>
						<CardDescription>
							Manage your public profile information.
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-6">
						<div class="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
							<div class="relative">
								<Avatar class="w-24 h-24 text-2xl">
									{#if profileImageUrl}
										<AvatarImage src={profileImageUrl} alt={fullName || user.email || 'User'} />
									{/if}
									<AvatarFallback>{userInitials}</AvatarFallback>
								</Avatar>
								
								<label for="profile-image" class="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-primary text-primary-foreground cursor-pointer hover:bg-primary/80 transition-colors">
									<Icon icon="heroicons:camera" width="16" height="16" />
									<span class="sr-only">Upload Image</span>
								</label>
								
								<input 
									id="profile-image" 
									type="file" 
									accept="image/*" 
									class="hidden" 
									on:change={handleFileChange}
								/>
							</div>
							
							<div class="space-y-1 text-center sm:text-left">
								<h3 class="text-xl font-medium">{fullName || user.email || 'User'}</h3>
								<p class="text-sm text-muted-foreground">
									{user.email}
								</p>
								{#if userProfile?.is_admin}
									<div class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
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
							</div>
						</div>
						
						<div class="space-y-4">
							{#if updateSuccess}
								<div class="bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400 p-3 rounded-md text-sm">
									Profile updated successfully!
								</div>
							{/if}
							
							{#if updateError}
								<div class="bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400 p-3 rounded-md text-sm">
									{updateError}
								</div>
							{/if}
							
							<div class="grid w-full items-center gap-1.5">
								<Label for="fullName">Full Name</Label>
								<Input id="fullName" bind:value={fullName} placeholder="Enter your full name" />
							</div>
							
							<div class="grid w-full items-center gap-1.5">
								<Label for="companyName">Company Name</Label>
								<Input id="companyName" bind:value={companyName} placeholder="Enter your company name" />
							</div>
							
							<div class="grid w-full items-center gap-1.5">
								<Label for="industry">Industry</Label>
								<Select.Root 
                                    selected={{ value: industry, label: industry }}
                                    onSelectedChange={(e) => e && handleSelectChange('industry', e.value)}
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
                                    selected={{ value: teamSize, label: teamSize }}
                                    onSelectedChange={(e) => e && handleSelectChange('teamSize', e.value)}
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
                                    selected={{ value: usagePurpose, label: usagePurpose }}
                                    onSelectedChange={(e) => e && handleSelectChange('usagePurpose', e.value)}
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
								<Input id="companyWebsite" bind:value={companyWebsite} placeholder="https://example.com" />
							</div>
						</div>
					</CardContent>
					<CardFooter>
						<Button on:click={updateProfile} disabled={saving}>
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
						<CardDescription>
							Manage your account settings and preferences.
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="space-y-2">
							<h3 class="font-medium">Email Address</h3>
							<p class="text-sm text-muted-foreground">{user.email}</p>
						</div>
						
						<div class="space-y-2">
							<h3 class="font-medium">Password</h3>
							<p class="text-sm text-muted-foreground">
								Change your password to keep your account secure.
							</p>
							<Button variant="outline">
								Change Password
							</Button>
						</div>
						
						<div class="space-y-2">
							<h3 class="font-medium">Account Deletion</h3>
							<p class="text-sm text-muted-foreground">
								Permanently delete your account and all your data.
							</p>
							<Button variant="destructive">
								Delete Account
							</Button>
						</div>
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>
	{/if}
</div> 