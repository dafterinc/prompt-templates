<script lang="ts">
  // Admin access is enforced server-side: hooks.server.ts returns 403 for /admin, and
  // +layout.server.ts calls requireAdmin(). No client-side auth check is needed here.
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <h1 class="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
  </div>

  <main>
    <slot />
  </main>
</div>
