import { fail } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import {
	listCategories,
	createCategory,
	updateCategory,
	deleteCategory
} from '$lib/server/categories';
import { getUserFriendlyErrorMessage } from '$lib/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	return { categories: await listCategories(user.id) };
};

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const user = requireUser(locals);
		const name = String((await request.formData()).get('name') ?? '').trim();
		if (!name) return fail(400, { error: 'Category name is required' });
		try {
			await createCategory(user.id, name);
		} catch (e: any) {
			return fail(400, { error: getUserFriendlyErrorMessage(e?.message ?? e) });
		}
		return { success: true };
	},

	update: async ({ locals, request }) => {
		const user = requireUser(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const name = String(form.get('name') ?? '').trim();
		if (!id) return fail(400, { error: 'Missing category id' });
		if (!name) return fail(400, { error: 'Category name is required' });
		try {
			await updateCategory(user.id, id, name);
		} catch (e: any) {
			return fail(400, { error: getUserFriendlyErrorMessage(e?.message ?? e) });
		}
		return { success: true };
	},

	delete: async ({ locals, request }) => {
		const user = requireUser(locals);
		const id = String((await request.formData()).get('id') ?? '');
		if (!id) return fail(400, { error: 'Missing category id' });
		try {
			const result = await deleteCategory(user.id, id);
			if (!result.ok) {
				return fail(400, {
					error:
						'Cannot delete a category that has templates. Please reassign or delete the templates first.'
				});
			}
		} catch (e: any) {
			return fail(400, { error: getUserFriendlyErrorMessage(e?.message ?? e) });
		}
		return { success: true };
	}
};
