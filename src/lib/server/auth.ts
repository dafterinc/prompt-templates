import { redirect } from '@sveltejs/kit';
import type { User } from '@supabase/supabase-js';

// hooks.server.ts resolves locals.user / locals.isAdmin from the session cookie on every request.
// These guards turn that into the server-side authorization primitives every protected load and
// form action should start with.

/** Return the authenticated user, or redirect to the login page. */
export function requireUser(locals: App.Locals): User {
  if (!locals.user) {
    throw redirect(303, '/auth/login');
  }
  return locals.user;
}

/** Return the authenticated admin user, or redirect. The hook already 403s /admin and /api/admin,
 *  but load/action code should not assume that and re-check here. */
export function requireAdmin(locals: App.Locals): User {
  const user = requireUser(locals);
  if (!locals.isAdmin) {
    throw redirect(303, '/');
  }
  return user;
}
