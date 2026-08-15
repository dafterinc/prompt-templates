import { error, fail } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { getDirectoryTemplate, addDirectoryTemplateToCollection } from '$lib/server/directory';
import { listCategories, createCategory } from '$lib/server/categories';
import { getUserFriendlyErrorMessage } from '$lib/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const result = await getDirectoryTemplate(params.id);
	if (!result) throw error(404, 'Template not found');
	const isAuthenticated = !!locals.user;
	const userCategories = isAuthenticated ? await listCategories(locals.user!.id) : [];
	return { template: result.template, variables: result.variables, isAuthenticated, userCategories };
};

export const actions: Actions = {
	addToCollection: async ({ locals, request, params }) => {
		const user = requireUser(locals);
		const form = await request.formData();
		const createNew = form.get('create_new') === 'true';
		const newCategoryName = String(form.get('new_category_name') ?? '').trim();
		let categoryId: string | null = String(form.get('category_id') ?? '') || null;

		try {
			if (createNew && newCategoryName) {
				categoryId = await createCategory(user.id, newCategoryName);
			}
			await addDirectoryTemplateToCollection(user.id, params.id, categoryId);
		} catch (e: any) {
			return fail(400, { error: getUserFriendlyErrorMessage(e?.message ?? e) });
		}
		return { success: true };
	}
};
