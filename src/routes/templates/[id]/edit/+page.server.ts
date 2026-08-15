import { error, fail, redirect } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { getTemplate, updateTemplate, deleteTemplate } from '$lib/server/templates';
import { listCategories, createCategory } from '$lib/server/categories';
import { getUserFriendlyErrorMessage } from '$lib/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = requireUser(locals);
	const result = await getTemplate(user.id, params.id);
	if (!result) throw error(404, 'Template not found');
	return { template: result.template, categories: await listCategories(user.id) };
};

export const actions: Actions = {
	update: async ({ locals, request, params }) => {
		const user = requireUser(locals);
		const form = await request.formData();
		const title = String(form.get('title') ?? '').trim();
		const description = String(form.get('description') ?? '').trim();
		const content = String(form.get('content') ?? '');
		const categoryId = String(form.get('category_id') ?? '');
		const previousContent = String(form.get('previous_content') ?? '');

		if (!title || !content.trim()) {
			return fail(400, { error: 'Title and content are required' });
		}

		try {
			await updateTemplate(
				user.id,
				params.id,
				{ title, description: description || null, content, category_id: categoryId || null },
				previousContent
			);
		} catch (e: any) {
			return fail(400, { error: getUserFriendlyErrorMessage(e?.message ?? e) });
		}
		throw redirect(303, `/templates/${params.id}`);
	},

	delete: async ({ locals, params }) => {
		const user = requireUser(locals);
		try {
			await deleteTemplate(user.id, params.id);
		} catch (e: any) {
			return fail(400, { error: e?.message ?? 'Failed to delete template' });
		}
		throw redirect(303, '/templates');
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
