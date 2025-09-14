import type { LayoutServerLoad } from './$types';
import { logger } from '$lib/utils/logger';

export const load: LayoutServerLoad = async ({ locals }) => {
  logger.debug('Server Load - Locals', {
    userId: locals.user?.id,
    isAdmin: locals.isAdmin
  }, 'server');

  // Return the user and admin status from server-side checks
  return {
    user: locals.user,
    isAdmin: locals.isAdmin
  };
}; 