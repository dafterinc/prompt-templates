import { fail, redirect } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { listCategories, createCategory } from '$lib/server/categories';
import { createTemplate } from '$lib/server/templates';
import { getUserFriendlyErrorMessage } from '$lib/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	return { categories: await listCategories(user.id) };
};

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const user = requireUser(locals);
		const form = await request.formData();
		const title = String(form.get('title') ?? '').trim();
		const description = String(form.get('description') ?? '').trim();
		const content = String(form.get('content') ?? '');
		const categoryId = String(form.get('category_id') ?? '');

		if (!title || !content.trim()) {
			return fail(400, { error: 'Title and content are required' });
		}

		let newId: string;
		try {
			newId = await createTemplate(user.id, {
				title,
				description: description || null,
				content,
				category_id: categoryId || null
			});
		} catch (e: any) {
			return fail(400, { error: getUserFriendlyErrorMessage(e?.message ?? e) });
		}
		throw redirect(303, `/templates/${newId}`);
	},

	createCategory: async ({ locals, request }) => {
		const user = requireUser(locals);
		const name = String((await request.formData()).get('name') ?? '').trim();
		if (!name) return fail(400, { error: 'Category name is required', scope: 'category' });
		let categoryId: string;
		try {
			categoryId = await createCategory(user.id, name);
		} catch (e: any) {
			return fail(400, { error: getUserFriendlyErrorMessage(e?.message ?? e), scope: 'category' });
		}
		return { success: true, scope: 'category', categoryId };
	}
};
