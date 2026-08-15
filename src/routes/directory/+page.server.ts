import { listDirectoryTemplates, listDirectoryCategories } from '$lib/server/directory';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [templates, categories] = await Promise.all([
		listDirectoryTemplates(),
		listDirectoryCategories()
	]);
	return { templates, categories, isAuthenticated: !!locals.user };
};
