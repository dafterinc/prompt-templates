import type { LayoutLoad } from './$types';
import { supabase } from '$lib/supabase';

export const load: LayoutLoad = async ({ data, depends }) => {
  // Mark this load function as dependent on auth changes
  depends('supabase:auth');

  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();

  // Return both the session and the server-provided admin status
  return {
    session,
    user: data?.user ?? null,
    isAdmin: data?.isAdmin ?? false
  };
}; 