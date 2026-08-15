import { fail } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { listCategories, createCategory } from '$lib/server/categories';
import { listTemplates, importTemplatesFromCSV } from '$lib/server/templates';
import { getUserFriendlyErrorMessage } from '$lib/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const [templates, categories] = await Promise.all([
		listTemplates(user.id),
		listCategories(user.id)
	]);
	return { templates, categories };
};

export const actions: Actions = {
	createCategory: async ({ locals, request }) => {
		const user = requireUser(locals);
		const name = String((await request.formData()).get('name') ?? '').trim();
		if (!name) return fail(400, { error: 'Category name is required', scope: 'category' });
		try {
			await createCategory(user.id, name);
		} catch (e: any) {
			return fail(400, { error: getUserFriendlyErrorMessage(e?.message ?? e), scope: 'category' });
		}
		return { success: true, scope: 'category' };
	},

	import: async ({ locals, request }) => {
		const user = requireUser(locals);
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
			const result = await importTemplatesFromCSV(user.id, await file.text());
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
