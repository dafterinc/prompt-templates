import { error, fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth';
import {
	getAdminDirectoryTemplate,
	updateAdminDirectoryTemplate,
	createDirectoryVariable,
	updateDirectoryVariable,
	deleteDirectoryVariable,
	listAdminDirectoryCategories,
	createDirectoryCategory
} from '$lib/server/admin-directory';
import { getUserFriendlyErrorMessage } from '$lib/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	requireAdmin(locals);
	const result = await getAdminDirectoryTemplate(params.id);
	if (!result) throw error(404, 'Template not found');
	return {
		template: result.template,
		variables: result.variables,
		categories: await listAdminDirectoryCategories()
	};
};

export const actions: Actions = {
	saveTemplate: async ({ locals, request, params }) => {
		requireAdmin(locals);
		const form = await request.formData();
		const title = String(form.get('title') ?? '').trim();
		const content = String(form.get('content') ?? '');
		if (!title || !content.trim()) {
			return fail(400, { error: 'Title and content are required', scope: 'template' });
		}
		try {
			await updateAdminDirectoryTemplate(params.id, {
				title,
				description: String(form.get('description') ?? '').trim() || null,
				content,
				category_id: String(form.get('category_id') ?? '') || null,
				featured: form.get('featured') === 'true'
			});
		} catch (e: any) {
			return fail(400, { error: getUserFriendlyErrorMessage(e?.message ?? e), scope: 'template' });
		}
		return { success: true, scope: 'template' };
	},

	createVariable: async ({ locals, request, params }) => {
		requireAdmin(locals);
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		if (!name) return fail(400, { error: 'Variable name is required', scope: 'variable' });
		try {
			await createDirectoryVariable(params.id, {
				name,
				description: String(form.get('description') ?? '').trim() || null,
				default_value: String(form.get('default_value') ?? '').trim() || null
			});
		} catch (e: any) {
			return fail(400, { error: e?.message ?? 'Failed to add variable', scope: 'variable' });
		}
		return { success: true, scope: 'variable' };
	},

	updateVariable: async ({ locals, request }) => {
		requireAdmin(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const name = String(form.get('name') ?? '').trim();
		if (!id || !name) return fail(400, { error: 'Missing variable', scope: 'variable' });
		try {
			await updateDirectoryVariable(id, {
				name,
				description: String(form.get('description') ?? '').trim() || null,
				default_value: String(form.get('default_value') ?? '').trim() || null
			});
		} catch (e: any) {
			return fail(400, { error: e?.message ?? 'Failed to update variable', scope: 'variable' });
		}
		return { success: true, scope: 'variable' };
	},

	deleteVariable: async ({ locals, request }) => {
		requireAdmin(locals);
		const id = String((await request.formData()).get('id') ?? '');
		if (!id) return fail(400, { error: 'Missing variable', scope: 'variable' });
		try {
			await deleteDirectoryVariable(id);
		} catch (e: any) {
			return fail(400, { error: e?.message ?? 'Failed to delete variable', scope: 'variable' });
		}
		return { success: true, scope: 'variable' };
	},

	createCategory: async ({ locals, request }) => {
		requireAdmin(locals);
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		if (!name) return fail(400, { error: 'Category name is required', scope: 'category' });
		let categoryId: string;
		try {
			categoryId = await createDirectoryCategory(
				name,
				String(form.get('description') ?? '').trim() || null
			);
		} catch (e: any) {
			return fail(400, { error: getUserFriendlyErrorMessage(e?.message ?? e), scope: 'category' });
		}
		return { success: true, scope: 'category', categoryId };
	}
};
