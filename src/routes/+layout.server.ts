import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  console.log('[Server Load] Locals:', {
    userId: locals.user?.id,
    isAdmin: locals.isAdmin
  });

  // Return the user and admin status from server-side checks
  return {
    user: locals.user,
    isAdmin: locals.isAdmin
  };
}; 