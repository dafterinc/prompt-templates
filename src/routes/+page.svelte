<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	const handleGetStarted = () => {
		goto('/auth/login');
	};

	const handleGitHubView = () => {
		window.open('https://github.com/dafterinc/prompt-templates', '_blank', 'noopener,noreferrer');
	};
	
	// For scroll-based animations
	let isVisible = false;
	
	onMount(() => {
		const handleScroll = () => {
			// Simple check if user has scrolled down enough to trigger animations
			if (window.scrollY > 100) {
				isVisible = true;
			}
		};
		
		// Set initial state
		setTimeout(() => {
			handleScroll();
		}, 100);
		
		// Add scroll listener
		window.addEventListener('scroll', handleScroll);
		
		// Clean up
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});
	
	// Feature data
	const features = [
		{
			title: 'Customizable Variables',
			description: 'Define reusable templates with customizable variables.',
			content: 'Create templates with <code>{"{{variable_name}}"}</code> syntax. Fill them in when needed for quick text generation.',
			icon: 'mdi:variable'
		},
		{
			title: 'Offline First',
			description: 'Work without an internet connection, sync when online.',
			content: 'All your templates are stored locally for immediate access. Changes sync automatically when you reconnect.',
			icon: 'mdi:wifi-off'
		},
		{
			title: 'Secure Cloud Sync',
			description: 'Your data, synced across all devices.',
			content: 'Templates encrypted in transit and at rest. Access your prompts from any device, anywhere.',
			icon: 'mdi:cloud-sync'
		},
		{
			title: 'Rich Text Formatting',
			description: 'Create beautiful, formatted prompt templates.',
			content: 'Use rich text formatting to create structured, visually appealing prompts that stand out.',
			icon: 'mdi:format-text'
		},
		{
			title: 'Template Organization',
			description: 'Keep your templates organized and accessible.',
			content: 'Categorize templates with folders and tags. Search and filter to find exactly what you need.',
			icon: 'mdi:folder-multiple'
		},
		{
			title: 'Self-Hostable',
			description: 'Use our cloud service or host your own instance.',
			content: 'Open source and self-hostable. Take control of your data with your own deployment.',
			icon: 'mdi:server'
		}
	];
	
	// Use cases data
	const useCases = [
		{
			title: 'AI Prompts',
			description: 'Create reusable AI prompt templates with placeholders for specific details.',
			icon: 'mdi:robot'
		},
		{
			title: 'Email Templates',
			description: 'Save time with reusable email templates for common situations.',
			icon: 'mdi:email-outline'
		},
		{
			title: 'Support Responses',
			description: 'Standardize customer support responses while personalizing key details.',
			icon: 'mdi:account-check-outline'
		},
		{
			title: 'Code Snippets',
			description: 'Store and customize frequently used code patterns with variable placeholders.',
			icon: 'mdi:code-braces'
		},
		{
			title: 'Marketing Copy',
			description: 'Create consistent marketing messaging with customizable details for each campaign.',
			icon: 'mdi:chart-line'
		},
		{
			title: 'Documentation',
			description: 'Generate consistent documentation with placeholders for project-specific details.',
			icon: 'mdi:file-document-outline'
		}
	];
</script>

<!-- Hero Section -->
<section class="w-full py-24 bg-background relative overflow-hidden">
	<!-- Solid decorative elements instead of translucent ones -->
	<div class="absolute top-0 left-0 w-full h-full z-0">
		<div class="absolute top-10 left-10 w-64 h-64 rounded-full bg-accent"></div>
		<div class="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-muted"></div>
		<div class="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-secondary/40"></div>
	</div>

	<div class="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
		<div class="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
			<div class="flex flex-col gap-6 animate-slide-right">
				<h1 class="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary">
					Prompt Templates for Everyday Workflows
				</h1>
				<p class="text-lg md:text-xl text-muted-foreground max-w-[600px]">
					Build, manage, and generate text prompts with customizable variables. Streamline your repetitive 
					text workflows and boost your productivity.
				</p>
				<div class="flex flex-col md:flex-row gap-4 mt-4">
					<Button size="lg" class="w-full md:w-auto hover:scale-105 transition-transform" on:click={handleGetStarted}>
						Get Started
					</Button>
					<Button size="lg" variant="outline" class="w-full md:w-auto hover:scale-105 transition-transform" on:click={handleGitHubView}>
						<Icon icon="mdi:github" class="mr-2 h-5 w-5" />
						View on GitHub
					</Button>
				</div>
			</div>
			<div class="relative w-full p-4 flex items-center justify-center animate-slide-left">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" class="w-full max-w-[500px] drop-shadow-xl">
					<!-- Person -->
					<g transform="translate(320, 300)">
						<!-- Head -->
						<circle cx="0" cy="-100" r="35" fill="#E7B396" />
						<path d="M-15,-80 Q0,-70 15,-80" stroke="#333" fill="none" stroke-width="1.5" />
						<!-- Hair -->
						<path d="M-35,-105 Q-30,-140 0,-145 Q30,-140 35,-105" fill="#5D4037" />
						<!-- Body -->
						<path d="M0,-65 L0,30" stroke="#2D8A6D" stroke-width="40" stroke-linecap="round" />
						<!-- Arms -->
						<path d="M0,-40 L-70,20" stroke="#2D8A6D" stroke-width="12" stroke-linecap="round" />
						<path d="M0,-40 L60,40" stroke="#2D8A6D" stroke-width="12" stroke-linecap="round" />
						<!-- Hand on keyboard -->
						<circle cx="60" cy="40" r="10" fill="#E7B396" />
					</g>
					
					<!-- Desk -->
					<rect x="150" y="350" width="500" height="20" rx="2" fill="#8D6E63" />
					<rect x="180" y="370" width="15" height="100" fill="#6D4C41" />
					<rect x="605" y="370" width="15" height="100" fill="#6D4C41" />
					
					<!-- Laptop -->
					<g>
						<!-- Laptop base -->
						<rect x="280" y="300" width="240" height="15" rx="2" fill="#5D4037" />
						<rect x="290" y="315" width="220" height="35" rx="2" fill="#795548" />
						<!-- Laptop screen -->
						<rect x="300" y="180" width="200" height="120" rx="2" fill="#3E2723" />
						<rect x="310" y="190" width="180" height="100" rx="1" fill="#F5F5F5" />
						<!-- Connection -->
						<path d="M300,300 L300,180" stroke="#5D4037" stroke-width="3" />
						<path d="M500,300 L500,180" stroke="#5D4037" stroke-width="3" />
					</g>
					
					<!-- Template Document on Screen -->
					<g>
						<rect x="325" y="200" width="150" height="80" fill="#FFF" stroke="#BDBDBD" stroke-width="1" />
						<!-- Document Lines -->
						<line x1="335" y1="210" x2="425" y2="210" stroke="#2D8A6D" stroke-width="2" />
						<line x1="335" y1="220" x2="465" y2="220" stroke="#E0E0E0" stroke-width="2" />
						<line x1="335" y1="230" x2="465" y2="230" stroke="#E0E0E0" stroke-width="2" />
						
						<!-- Variable Placeholders -->
						<rect x="335" y="240" width="70" height="10" rx="2" fill="#2D8A6D" opacity="0.3" />
						<rect x="415" y="240" width="40" height="10" rx="2" fill="#2D8A6D" opacity="0.3" />
						
						<line x1="335" y1="260" x2="465" y2="260" stroke="#E0E0E0" stroke-width="2" />
						<line x1="335" y1="270" x2="435" y2="270" stroke="#E0E0E0" stroke-width="2" />
					</g>
					
					<!-- Flying Documents with variables -->
					<g transform="rotate(-15, 200, 200)" class="animate">
						<rect x="150" y="190" width="100" height="70" fill="#FFF" stroke="#BDBDBD" stroke-width="1" rx="2" filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.1))" />
						<rect x="160" y="205" width="40" height="8" rx="2" fill="#2D8A6D" opacity="0.3" />
						<rect x="160" y="220" width="80" height="8" rx="2" fill="#E0E0E0" />
						<rect x="160" y="235" width="60" height="8" rx="2" fill="#E0E0E0" />
					</g>
					
					<g transform="rotate(10, 590, 230)" class="animate">
						<rect x="540" y="200" width="100" height="70" fill="#FFF" stroke="#BDBDBD" stroke-width="1" rx="2" filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.1))" />
						<rect x="550" y="215" width="50" height="8" rx="2" fill="#2D8A6D" opacity="0.3" />
						<rect x="550" y="230" width="80" height="8" rx="2" fill="#E0E0E0" />
						<rect x="550" y="245" width="40" height="8" rx="2" fill="#2D8A6D" opacity="0.3" />
					</g>
				</svg>
			</div>
		</div>
	</div>
</section>

<!-- Features Section -->
<section class="w-full py-20 bg-muted relative overflow-hidden">
	<!-- Solid background instead of gradient -->
	<div class="absolute top-0 left-0 w-full h-20 bg-accent"></div>

	<div class="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
		<div class="flex flex-col items-center text-center mb-16 animate-fade-in">
			<div class="inline-block px-6 py-2 bg-primary rounded-full mb-4">
				<h2 class="text-sm font-semibold text-primary-foreground">Why Choose Us?</h2>
			</div>
			<h2 class="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
			<p class="text-lg text-muted-foreground max-w-[800px]">
				Everything you need to create and manage your prompt templates efficiently.
			</p>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
			{#each features as feature, i}
				<Card class="group hover:shadow-lg transition-all duration-300 border border-border hover:border-primary animate-slide-up animate-delay-{i * 100 % 500}">
					<CardHeader>
						<div class="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4 group-hover:bg-primary/80 transition-colors">
							<Icon icon={feature.icon} class="h-6 w-6 text-primary-foreground" />
						</div>
						<CardTitle>{feature.title}</CardTitle>
						<CardDescription>{feature.description}</CardDescription>
					</CardHeader>
					<CardContent>
						<p>{@html feature.content}</p>
					</CardContent>
				</Card>
			{/each}
		</div>
	</div>
</section>

<!-- Use Cases Section -->
<section class="w-full py-20 bg-accent relative overflow-hidden">
	<!-- Solid background element instead of gradient -->
	<div class="absolute top-0 right-0 w-1/3 h-full bg-secondary/20"></div>

	<div class="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
		<div class="flex flex-col items-center text-center mb-16 animate-fade-in">
			<div class="inline-block px-6 py-2 bg-primary rounded-full mb-4">
				<h2 class="text-sm font-semibold text-primary-foreground">Use Cases</h2>
			</div>
			<h2 class="text-3xl md:text-4xl font-bold mb-4">Perfect For</h2>
			<p class="text-lg text-muted-foreground max-w-[800px]">
				Streamline your workflow in these common scenarios and more.
			</p>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
			{#each useCases as useCase, i}
				<div class="flex flex-col items-center text-center p-6 bg-background rounded-xl shadow-sm hover:shadow-md hover:scale-105 transition-all animate-slide-up animate-delay-{i * 100 % 500}">
					<div class="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4 hover:bg-primary/80 transition-colors">
						<Icon icon={useCase.icon} class="h-8 w-8 text-primary-foreground" />
					</div>
					<h3 class="text-xl font-semibold mb-2">{useCase.title}</h3>
					<p class="text-muted-foreground">{useCase.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- CTA Section -->
<section class="w-full py-24 bg-primary text-primary-foreground relative overflow-hidden">
	<!-- Solid background elements instead of gradients -->
	<div class="absolute top-0 left-0 w-full h-full">
		<div class="absolute top-0 right-0 w-1/3 h-full bg-primary-foreground/5"></div>
		<div class="absolute bottom-0 left-0 w-full h-1/3 bg-secondary/20"></div>
	</div>

	<div class="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
		<div class="flex flex-col items-center text-center max-w-[800px] mx-auto animate-fade-in">
			<div class="inline-block px-6 py-2 bg-secondary rounded-full mb-6">
				<h2 class="text-sm font-semibold text-secondary-foreground">Get Started Today</h2>
			</div>
			<h2 class="text-3xl md:text-4xl font-bold mb-4">Ready to streamline your workflow?</h2>
			<p class="text-lg mb-8">
				Start creating your templates today and save time on repetitive text tasks.
			</p>
			<div class="flex flex-col sm:flex-row gap-4">
				<Button size="lg" variant="secondary" class="w-full sm:w-auto hover:scale-105 transition-transform animate-bounce-subtle" on:click={handleGetStarted}>
					<Icon icon="mdi:rocket-launch-outline" class="mr-2 h-5 w-5" />
					Get Started - It's Free
				</Button>
				<Button size="lg" variant="outline" class="bg-transparent border-primary-foreground w-full sm:w-auto hover:scale-105 transition-transform" on:click={handleGitHubView}>
					<Icon icon="mdi:github" class="mr-2 h-5 w-5" />
					View on GitHub
				</Button>
			</div>
			<p class="mt-6 text-sm text-primary-foreground/70">
				Available as a cloud service or self-hostable open source application.
			</p>
		</div>
	</div>
</section>
