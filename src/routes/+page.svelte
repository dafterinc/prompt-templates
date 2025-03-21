<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';

	const handleGetStarted = () => {
		goto('/auth/login');
	};

	const handleGitHubView = () => {
		window.open('https://github.com/dafterinc/prompt-templates', '_blank', 'noopener,noreferrer');
	};
</script>

<!-- Hero Section -->
<section class="w-full py-24 bg-gradient-to-b from-background to-secondary/20">
	<div class="max-w-7xl mx-auto px-4 md:px-6">
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
			<div class="relative w-full p-4 flex items-center justify-center">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" class="w-full max-w-[500px]">
					<!-- Person -->
					<g transform="translate(320, 300)">
						<!-- Head -->
						<circle cx="0" cy="-100" r="35" fill="#F8B1A1" />
						<path d="M-15,-80 Q0,-70 15,-80" stroke="#333" fill="none" stroke-width="1.5" />
						<!-- Hair -->
						<path d="M-35,-105 Q-30,-140 0,-145 Q30,-140 35,-105" fill="#333" />
						<!-- Body -->
						<path d="M0,-65 L0,30" stroke="#5E72E4" stroke-width="40" stroke-linecap="round" />
						<!-- Arms -->
						<path d="M0,-40 L-70,20" stroke="#5E72E4" stroke-width="12" stroke-linecap="round" />
						<path d="M0,-40 L60,40" stroke="#5E72E4" stroke-width="12" stroke-linecap="round" />
						<!-- Hand on keyboard -->
						<circle cx="60" cy="40" r="10" fill="#F8B1A1" />
					</g>
					
					<!-- Desk -->
					<rect x="150" y="350" width="500" height="20" rx="2" fill="#B0BEC5" />
					<rect x="180" y="370" width="15" height="100" fill="#78909C" />
					<rect x="605" y="370" width="15" height="100" fill="#78909C" />
					
					<!-- Laptop -->
					<g>
						<!-- Laptop base -->
						<rect x="280" y="300" width="240" height="15" rx="2" fill="#455A64" />
						<rect x="290" y="315" width="220" height="35" rx="2" fill="#546E7A" />
						<!-- Laptop screen -->
						<rect x="300" y="180" width="200" height="120" rx="2" fill="#263238" />
						<rect x="310" y="190" width="180" height="100" rx="1" fill="#ECEFF1" />
						<!-- Connection -->
						<path d="M300,300 L300,180" stroke="#455A64" stroke-width="3" />
						<path d="M500,300 L500,180" stroke="#455A64" stroke-width="3" />
					</g>
					
					<!-- Template Document on Screen -->
					<g>
						<rect x="325" y="200" width="150" height="80" fill="#FFF" stroke="#BDBDBD" stroke-width="1" />
						<!-- Document Lines -->
						<line x1="335" y1="210" x2="425" y2="210" stroke="#5E72E4" stroke-width="2" />
						<line x1="335" y1="220" x2="465" y2="220" stroke="#E0E0E0" stroke-width="2" />
						<line x1="335" y1="230" x2="465" y2="230" stroke="#E0E0E0" stroke-width="2" />
						
						<!-- Variable Placeholders -->
						<rect x="335" y="240" width="70" height="10" rx="2" fill="#5E72E4" opacity="0.3" />
						<rect x="415" y="240" width="40" height="10" rx="2" fill="#5E72E4" opacity="0.3" />
						
						<line x1="335" y1="260" x2="465" y2="260" stroke="#E0E0E0" stroke-width="2" />
						<line x1="335" y1="270" x2="435" y2="270" stroke="#E0E0E0" stroke-width="2" />
					</g>
					
					<!-- Flying Documents with variables -->
					<g transform="rotate(-15, 200, 200)">
						<rect x="150" y="190" width="100" height="70" fill="#FFF" stroke="#BDBDBD" stroke-width="1" rx="2" filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.1))" />
						<rect x="160" y="205" width="40" height="8" rx="2" fill="#5E72E4" opacity="0.3" />
						<rect x="160" y="220" width="80" height="8" rx="2" fill="#E0E0E0" />
						<rect x="160" y="235" width="60" height="8" rx="2" fill="#E0E0E0" />
					</g>
					
					<g transform="rotate(10, 590, 230)">
						<rect x="540" y="200" width="100" height="70" fill="#FFF" stroke="#BDBDBD" stroke-width="1" rx="2" filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.1))" />
						<rect x="550" y="215" width="50" height="8" rx="2" fill="#5E72E4" opacity="0.3" />
						<rect x="550" y="230" width="80" height="8" rx="2" fill="#E0E0E0" />
						<rect x="550" y="245" width="40" height="8" rx="2" fill="#5E72E4" opacity="0.3" />
					</g>
				</svg>
			</div>
		</div>
	</div>
</section>

<!-- Features Section -->
<section class="w-full py-20 bg-background">
	<div class="max-w-7xl mx-auto px-4 md:px-6">
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
	<div class="max-w-7xl mx-auto px-4 md:px-6">
		<div class="flex flex-col items-center text-center mb-16">
			<h2 class="text-3xl md:text-4xl font-bold mb-4">Perfect For</h2>
			<p class="text-lg text-muted-foreground max-w-[800px]">
				Streamline your workflow in these common scenarios and more.
			</p>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
			<div class="flex flex-col items-center text-center p-6">
				<div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
					<Icon icon="mdi:robot" class="h-8 w-8 text-primary" />
				</div>
				<h3 class="text-xl font-semibold mb-2">AI Prompts</h3>
				<p class="text-muted-foreground">Create reusable AI prompt templates with placeholders for specific details.</p>
			</div>
			<div class="flex flex-col items-center text-center p-6">
				<div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
					<Icon icon="mdi:email-outline" class="h-8 w-8 text-primary" />
				</div>
				<h3 class="text-xl font-semibold mb-2">Email Templates</h3>
				<p class="text-muted-foreground">Save time with reusable email templates for common situations.</p>
			</div>
			<div class="flex flex-col items-center text-center p-6">
				<div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
					<Icon icon="mdi:account-check-outline" class="h-8 w-8 text-primary" />
				</div>
				<h3 class="text-xl font-semibold mb-2">Support Responses</h3>
				<p class="text-muted-foreground">Standardize customer support responses while personalizing key details.</p>
			</div>
			<div class="flex flex-col items-center text-center p-6">
				<div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
					<Icon icon="mdi:code-braces" class="h-8 w-8 text-primary" />
				</div>
				<h3 class="text-xl font-semibold mb-2">Code Snippets</h3>
				<p class="text-muted-foreground">Store and customize frequently used code patterns with variable placeholders.</p>
			</div>
			<div class="flex flex-col items-center text-center p-6">
				<div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
					<Icon icon="mdi:chart-line" class="h-8 w-8 text-primary" />
				</div>
				<h3 class="text-xl font-semibold mb-2">Marketing Copy</h3>
				<p class="text-muted-foreground">Create consistent marketing messaging with customizable details for each campaign.</p>
			</div>
			<div class="flex flex-col items-center text-center p-6">
				<div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
					<Icon icon="mdi:file-document-outline" class="h-8 w-8 text-primary" />
				</div>
				<h3 class="text-xl font-semibold mb-2">Documentation</h3>
				<p class="text-muted-foreground">Generate consistent documentation with placeholders for project-specific details.</p>
			</div>
		</div>
	</div>
</section>

<!-- CTA Section -->
<section class="w-full py-24 bg-primary text-primary-foreground">
	<div class="max-w-7xl mx-auto px-4 md:px-6">
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
