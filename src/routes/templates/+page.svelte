<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	
	interface Template {
		id: string;
		title: string;
		description: string | null;
		content: string;
		created_at: string;
		updated_at: string;
		category_id: string | null;
		categories?: { name: string };
		variables_count?: number;
		category_name?: string;
	}
	
	let templates: Template[] = [];
	let loading = true;
	let error = '';
	
	onMount(() => {
		loadTemplates();
		// No need to return anything from onMount
	});
	
	async function loadTemplates() {
		try {
			const { data: { session } } = await supabase.auth.getSession();
			
			if (!session) {
				goto('/auth/login');
				return;
			}
			
			await fetchTemplates();
		} catch (e: any) {
			error = e.message || 'Failed to load templates';
		} finally {
			loading = false;
		}
	}
	
	async function fetchTemplates() {
		const { data, error: fetchError } = await supabase
			.from('templates')
			.select(`
				*,
				categories(name)
			`)
			.order('updated_at', { ascending: false });
		
		if (fetchError) {
			error = fetchError.message;
			return;
		}
		
		// Also fetch variable count for each template
		if (data) {
			templates = await Promise.all(
				data.map(async (template: Template) => {
					const { count } = await supabase
						.from('variables')
						.select('id', { count: 'exact', head: true })
						.eq('template_id', template.id);
					
					return {
						...template,
						category_name: template.categories?.name,
						variables_count: count
					};
				})
			);
		}
	}
	
	function handleCreateNew() {
		goto('/templates/new');
	}
	
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div>
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-2xl font-bold">My Templates</h1>
		<button 
			on:click={handleCreateNew}
			class="px-4 py-2 bg-primary text-primary-foreground rounded-md"
		>
			Create New Template
		</button>
	</div>
	
	{#if error}
		<div class="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
			{error}
		</div>
	{/if}
	
	{#if loading}
		<div class="flex justify-center py-12">
			<div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
		</div>
	{:else if templates.length === 0}
		<div class="text-center py-12 border rounded-md bg-muted/20">
			<h2 class="text-xl font-medium mb-2">No templates yet</h2>
			<p class="text-muted-foreground mb-4">Create your first template to get started</p>
			<button 
				on:click={handleCreateNew}
				class="px-4 py-2 bg-primary text-primary-foreground rounded-md"
			>
				Create New Template
			</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each templates as template}
				<div class="border rounded-md p-4 transition-shadow hover:shadow-md">
					<a href={`/templates/${template.id}`} class="block">
						<h2 class="text-lg font-medium mb-1 truncate">{template.title}</h2>
						{#if template.description}
							<p class="text-muted-foreground text-sm mb-3 line-clamp-2">{template.description}</p>
						{:else}
							<p class="text-muted-foreground text-sm italic mb-3">No description</p>
						{/if}
						
						<div class="flex justify-between text-xs text-muted-foreground">
							<div class="flex gap-2">
								<span>{template.variables_count} variables</span>
								{#if template.category_name}
									<span>• {template.category_name}</span>
								{/if}
							</div>
							<span>Updated {formatDate(template.updated_at)}</span>
						</div>
					</a>
				</div>
			{/each}
		</div>
	{/if}
</div> 