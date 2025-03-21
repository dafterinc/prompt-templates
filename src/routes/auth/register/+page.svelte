<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	
	onMount(() => {
		goto('/auth/login?tab=sign-up');
	});
</script>

<div class="flex justify-center items-center p-8">
	<p>Redirecting to sign up page...</p>
</div> 