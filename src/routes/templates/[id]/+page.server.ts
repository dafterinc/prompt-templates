import { error, fail, redirect } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { getTemplate, duplicateTemplate, deleteTemplate } from '$lib/server/templates';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = requireUser(locals);
	const result = await getTemplate(user.id, params.id);
	if (!result) throw error(404, 'Template not found');
	return { template: result.template, variables: result.variables };
};

export const actions: Actions = {
	duplicate: async ({ locals, params }) => {
		const user = requireUser(locals);
		let newId: string | null;
		try {
			newId = await duplicateTemplate(user.id, params.id);
		} catch (e: any) {
			return fail(400, { error: e?.message ?? 'Failed to duplicate template' });
		}
		if (!newId) throw error(404, 'Template not found');
		throw redirect(303, `/templates/${newId}`);
	},

	delete: async ({ locals, params }) => {
		const user = requireUser(locals);
		try {
			await deleteTemplate(user.id, params.id);
		} catch (e: any) {
			return fail(400, { error: e?.message ?? 'Failed to delete template' });
		}
		throw redirect(303, '/templates');
	}
};
