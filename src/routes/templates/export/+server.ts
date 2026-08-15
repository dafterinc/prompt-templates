import { requireUser } from '$lib/server/auth';
import { getTemplatesForExport } from '$lib/server/templates';
import { toCSV } from '$lib/utils/csv';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const user = requireUser(locals);
	const templates = await getTemplatesForExport(user.id);

	const headers = [
		'Title',
		'Description',
		'Content',
		'Category Name',
		'Variables (JSON)',
		'Created At',
		'Updated At'
	];
	const rows = templates.map((t: any) => [
		t.title,
		t.description,
		t.content,
		t.categories?.name || '',
		JSON.stringify(t.variables || []),
		t.created_at,
		t.updated_at
	]);

	return new Response(toCSV(headers, rows), {
		headers: {
			'Content-Type': 'text/csv;charset=utf-8;',
			'Content-Disposition': 'attachment; filename="my-templates.csv"'
		}
	});
};
