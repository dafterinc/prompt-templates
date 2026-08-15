import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth';
import {
	listAdminDirectoryTemplates,
	listAdminDirectoryCategories,
	createAdminDirectoryTemplate,
	deleteAdminDirectoryTemplate,
	toggleDirectoryTemplateFeatured,
	createDirectoryCategory,
	updateDirectoryCategory,
	deleteDirectoryCategory,
	importAdminDirectoryTemplatesFromCSV
} from '$lib/server/admin-directory';
import { getUserFriendlyErrorMessage } from '$lib/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals);
	const [templates, categories] = await Promise.all([
		listAdminDirectoryTemplates(),
		listAdminDirectoryCategories()
	]);
	return { templates, categories };
};

export const actions: Actions = {
	createTemplate: async ({ locals, request }) => {
		requireAdmin(locals);
		const form = await request.formData();
		const title = String(form.get('title') ?? '').trim();
		const description = String(form.get('description') ?? '').trim();
		const content = String(form.get('content') ?? '');
		const categoryId = String(form.get('category_id') ?? '');
		if (!title || !content.trim() || !description || !categoryId) {
			return fail(400, { error: 'Please fill in all required fields', scope: 'template' });
		}
		try {
			await createAdminDirectoryTemplate({
				title,
				description,
				content,
				category_id: categoryId,
				featured: form.get('featured') === 'true'
			});
		} catch (e: any) {
			return fail(400, { error: getUserFriendlyErrorMessage(e?.message ?? e), scope: 'template' });
		}
		return { success: true, scope: 'template' };
	},

	deleteTemplate: async ({ locals, request }) => {
		requireAdmin(locals);
		const id = String((await request.formData()).get('id') ?? '');
		if (!id) return fail(400, { error: 'Missing template id' });
		try {
			await deleteAdminDirectoryTemplate(id);
		} catch (e: any) {
			return fail(400, { error: e?.message ?? 'Failed to delete template' });
		}
		return { success: true };
	},

	toggleFeatured: async ({ locals, request }) => {
		requireAdmin(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		if (!id) return fail(400, { error: 'Missing template id' });
		try {
			await toggleDirectoryTemplateFeatured(id, form.get('featured') === 'true');
		} catch (e: any) {
			return fail(400, { error: e?.message ?? 'Failed to update template' });
		}
		return { success: true };
	},

	createCategory: async ({ locals, request }) => {
		requireAdmin(locals);
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		if (!name) return fail(400, { error: 'Category name is required', scope: 'category' });
		try {
			await createDirectoryCategory(name, String(form.get('description') ?? '').trim() || null);
		} catch (e: any) {
			return fail(400, { error: getUserFriendlyErrorMessage(e?.message ?? e), scope: 'category' });
		}
		return { success: true, scope: 'category' };
	},

	updateCategory: async ({ locals, request }) => {
		requireAdmin(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const name = String(form.get('name') ?? '').trim();
		if (!id || !name) return fail(400, { error: 'Category name is required', scope: 'editCategory' });
		try {
			await updateDirectoryCategory(id, name, String(form.get('description') ?? '').trim() || null);
		} catch (e: any) {
			return fail(400, {
				error: getUserFriendlyErrorMessage(e?.message ?? e),
				scope: 'editCategory'
			});
		}
		return { success: true, scope: 'editCategory' };
	},

	deleteCategory: async ({ locals, request }) => {
		requireAdmin(locals);
		const id = String((await request.formData()).get('id') ?? '');
		if (!id) return fail(400, { error: 'Missing category id' });
		try {
			const result = await deleteDirectoryCategory(id);
			if (!result.ok) {
				return fail(400, {
					error: `Cannot delete a category that still contains ${result.count} template(s). Move or delete them first.`
				});
			}
		} catch (e: any) {
			return fail(400, { error: e?.message ?? 'Failed to delete category' });
		}
		return { success: true };
	},

	import: async ({ locals, request }) => {
		requireAdmin(locals);
		const file = (await request.formData()).get('file');
		if (!(file instanceof File) || file.size === 0) {
			return fail(400, {
				scope: 'import',
				successCount: 0,
				errorCount: 0,
				errors: ['Please select a CSV file to import']
			});
		}
		try {
			const result = await importAdminDirectoryTemplatesFromCSV(await file.text());
			return { scope: 'import', ...result };
		} catch (e: any) {
			return fail(400, {
				scope: 'import',
				successCount: 0,
				errorCount: 0,
				errors: [e?.message ?? 'Failed to import templates']
			});
		}
	}
};
