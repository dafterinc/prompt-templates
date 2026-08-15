import { createAuthClient } from 'better-auth/svelte';

// Browser auth client (Better Auth). baseURL defaults to the current origin.
// Usage: authClient.signUp.email(...), authClient.signIn.email(...), authClient.signOut(),
// authClient.useSession().
export const authClient = createAuthClient();
