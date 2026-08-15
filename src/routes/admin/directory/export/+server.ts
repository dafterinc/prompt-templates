import { requireAdmin } from '$lib/server/auth';
import { getAdminDirectoryTemplatesForExport } from '$lib/server/admin-directory';
import { toCSV } from '$lib/utils/csv';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	requireAdmin(locals);
	const templates = await getAdminDirectoryTemplatesForExport();

	const headers = [
		'Title',
		'Description',
		'Content',
		'Category Name',
		'Featured',
		'Variables (JSON)',
		'Created At',
		'Updated At'
	];
	const rows = templates.map((t: any) => [
		t.title,
		t.description,
		t.content,
		t.directory_categories?.name || '',
		t.featured ? 'Yes' : 'No',
		JSON.stringify(t.directory_variables || []),
		t.created_at,
		t.updated_at
	]);

	return new Response(toCSV(headers, rows), {
		headers: {
			'Content-Type': 'text/csv;charset=utf-8;',
			'Content-Disposition': 'attachment; filename="directory-templates.csv"'
		}
	});
};
