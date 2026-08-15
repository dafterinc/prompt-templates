import { requireAdmin } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

// Server-enforced admin gate for the whole /admin subtree (in addition to the check in
// hooks.server.ts). Redirects non-admins before any admin page load runs.
export const load: LayoutServerLoad = async ({ locals }) => {
	requireAdmin(locals);
	return {};
};
