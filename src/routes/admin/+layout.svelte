<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import Icon from '@iconify/svelte';

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

<div class="space-y-6">
  {#if loading}
    <div class="flex items-center justify-center p-8">
      <div class="animate-spin mr-2">
        <Icon icon="heroicons:arrow-path" width="24" height="24" />
      </div>
      <span>Loading admin dashboard...</span>
    </div>
  {:else if error}
    <Alert variant="destructive">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  {:else if isAdmin}
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
    </div>
    
    <main>
      <slot />
    </main>
  {/if}
</div> 