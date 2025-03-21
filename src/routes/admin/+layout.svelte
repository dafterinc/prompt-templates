<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';

  let loading = true;
  let error = '';
  let isAdmin = false;

  onMount(() => {
    checkAdminAccess();
  });

  async function checkAdminAccess() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        goto('/auth/login');
        return;
      }
      
      // Check if user is an admin
      const { data, error: userError } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
          
      if (userError || !data || !data.is_admin) {
        error = 'You do not have permission to access this area';
        goto('/');
        return;
      }
      
      isAdmin = true;
    } catch (e: any) {
      error = e.message || 'Failed to load admin interface';
      goto('/');
    } finally {
      loading = false;
    }
  }
</script>

<div class="container mx-auto py-8">
  {#if loading}
    <div class="flex justify-center">
      <div class="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
    </div>
  {:else if error}
    <Alert variant="destructive">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  {:else if isAdmin}
    <header class="mb-8">
      <h1 class="text-3xl font-bold">Admin Dashboard</h1>
      <p class="text-muted-foreground">Manage your site content and settings</p>
    </header>
    
    <main>
      <slot />
    </main>
  {/if}
</div> 