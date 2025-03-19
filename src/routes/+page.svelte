<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { goto } from '$app/navigation';

	const handleGetStarted = () => {
		goto('/auth/login');
	};

	const handleGitHubView = () => {
		window.open('https://github.com/dafterinc/prompt-templates', '_blank', 'noopener,noreferrer');
	};
</script>

<!-- Hero Section -->
<section class="w-full py-24 bg-gradient-to-b from-background to-secondary/20">
	<div class="container px-4 md:px-6">
		<div class="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
			<div class="flex flex-col gap-6">
				<h1 class="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
					Prompt Templates for Everyday Workflows
				</h1>
				<p class="text-lg md:text-xl text-muted-foreground max-w-[600px]">
					Build, manage, and generate text prompts with customizable variables. Streamline your repetitive 
					text workflows and boost your productivity.
				</p>
				<div class="flex flex-col md:flex-row gap-4">
					<Button size="lg" class="w-full md:w-auto" on:click={handleGetStarted}>Get Started</Button>
					<Button size="lg" variant="outline" class="w-full md:w-auto" on:click={handleGitHubView}>View on GitHub</Button>
				</div>
			</div>
			<div class="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary/20 to-secondary/20">
				<div class="absolute inset-0 flex items-center justify-center">
					<div class="text-center p-6">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-primary mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<path d="M4 6h16M4 12h16M4 18h16"></path>
						</svg>
						<p class="text-xl font-medium">Prompt Templates</p>
						<p class="text-muted-foreground">Create, manage, and generate text with ease</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Features Section -->
<section class="w-full py-20 bg-background">
	<div class="container px-4 md:px-6">
		<div class="flex flex-col items-center text-center mb-16">
			<h2 class="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
			<p class="text-lg text-muted-foreground max-w-[800px]">
				Everything you need to create and manage your prompt templates efficiently.
			</p>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
			<Card>
				<CardHeader>
					<CardTitle>Customizable Variables</CardTitle>
					<CardDescription>Define reusable templates with customizable variables.</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Create templates with <code>{"{{variable_name}}"}</code> syntax. Fill them in when needed for quick text generation.</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Offline First</CardTitle>
					<CardDescription>Work without an internet connection, sync when online.</CardDescription>
				</CardHeader>
				<CardContent>
					<p>All your templates are stored locally for immediate access. Changes sync automatically when you reconnect.</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Secure Cloud Sync</CardTitle>
					<CardDescription>Your data, synced across all devices.</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Templates encrypted in transit and at rest. Access your prompts from any device, anywhere.</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Rich Text Formatting</CardTitle>
					<CardDescription>Create beautiful, formatted prompt templates.</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Use rich text formatting to create structured, visually appealing prompts that stand out.</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Template Organization</CardTitle>
					<CardDescription>Keep your templates organized and accessible.</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Categorize templates with folders and tags. Search and filter to find exactly what you need.</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Self-Hostable</CardTitle>
					<CardDescription>Use our cloud service or host your own instance.</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Open source and self-hostable. Take control of your data with your own deployment.</p>
				</CardContent>
			</Card>
		</div>
	</div>
</section>

<!-- Use Cases Section -->
<section class="w-full py-20 bg-secondary/20">
	<div class="container px-4 md:px-6">
		<div class="flex flex-col items-center text-center mb-16">
			<h2 class="text-3xl md:text-4xl font-bold mb-4">Perfect For</h2>
			<p class="text-lg text-muted-foreground max-w-[800px]">
				Streamline your workflow in these common scenarios and more.
			</p>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
			<div class="flex flex-col items-center text-center p-6">
				<div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 4.5v15m7.5-7.5h-15" />
					</svg>
				</div>
				<h3 class="text-xl font-semibold mb-2">AI Prompts</h3>
				<p class="text-muted-foreground">Create reusable AI prompt templates with placeholders for specific details.</p>
			</div>
			<div class="flex flex-col items-center text-center p-6">
				<div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M3 3h18v18H3z" />
					</svg>
				</div>
				<h3 class="text-xl font-semibold mb-2">Email Templates</h3>
				<p class="text-muted-foreground">Save time with reusable email templates for common situations.</p>
			</div>
			<div class="flex flex-col items-center text-center p-6">
				<div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M16 4v16M8 4v16M4 8h16M4 16h16" />
					</svg>
				</div>
				<h3 class="text-xl font-semibold mb-2">Support Responses</h3>
				<p class="text-muted-foreground">Standardize customer support responses while personalizing key details.</p>
			</div>
			<div class="flex flex-col items-center text-center p-6">
				<div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
					</svg>
				</div>
				<h3 class="text-xl font-semibold mb-2">Code Snippets</h3>
				<p class="text-muted-foreground">Store and customize frequently used code patterns with variable placeholders.</p>
			</div>
			<div class="flex flex-col items-center text-center p-6">
				<div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
					</svg>
				</div>
				<h3 class="text-xl font-semibold mb-2">Marketing Copy</h3>
				<p class="text-muted-foreground">Create consistent marketing messaging with customizable details for each campaign.</p>
			</div>
			<div class="flex flex-col items-center text-center p-6">
				<div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M4 6h16M4 12h8m-8 6h16" />
					</svg>
				</div>
				<h3 class="text-xl font-semibold mb-2">Documentation</h3>
				<p class="text-muted-foreground">Generate consistent documentation with placeholders for project-specific details.</p>
			</div>
		</div>
	</div>
</section>

<!-- CTA Section -->
<section class="w-full py-24 bg-primary text-primary-foreground">
	<div class="container px-4 md:px-6">
		<div class="flex flex-col items-center text-center max-w-[800px] mx-auto">
			<h2 class="text-3xl md:text-4xl font-bold mb-4">Ready to streamline your workflow?</h2>
			<p class="text-lg mb-8">
				Start creating your templates today and save time on repetitive text tasks.
			</p>
			<div class="flex flex-col sm:flex-row gap-4">
				<Button size="lg" variant="secondary" class="w-full sm:w-auto" on:click={handleGetStarted}>
					Get Started - It's Free
				</Button>
				<Button size="lg" variant="outline" class="bg-transparent border-primary-foreground w-full sm:w-auto" on:click={handleGitHubView}>
					View on GitHub
				</Button>
			</div>
			<p class="mt-6 text-sm text-primary-foreground/70">
				Available as a cloud service or self-hostable open source application.
			</p>
		</div>
	</div>
</section>
