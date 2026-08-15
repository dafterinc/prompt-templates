import { env } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';

// Service-role Supabase client for server-side data access. It lives under $lib/server, so
// SvelteKit guarantees it can never be imported into browser code.
//
// Server routes pair this client with EXPLICIT ownership checks (see the sibling data-access
// modules, e.g. categories.ts). RLS remains as a backstop while we are on Supabase, but it is no
// longer the authorization boundary — which is precisely what makes an eventual move to plain
// Postgres (Neon or self-hosted) a matter of swapping these modules rather than rewriting pages.
export const supabaseAdmin = createClient(
  env.VITE_SUPABASE_URL || '',
  env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
