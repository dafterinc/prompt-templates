import { sql } from './db';

// Data-access for the public directory. Reads are public (no ownership); the only write is copying
// a directory template into the calling user's own collection, which is ownership-scoped to them.

export interface DirectoryListItem {
	id: string;
	title: string;
	description: string | null;
	category_id: string | null;
	category_name: string | null;
	featured: boolean;
	variables_count: number;
}

export async function listDirectoryTemplates(): Promise<DirectoryListItem[]> {
	return await sql<DirectoryListItem[]>`
		SELECT t.id, t.title, t.description, t.category_id, t.featured,
			c.name AS category_name,
			(SELECT count(*)::int FROM directory_variables v WHERE v.template_id = t.id) AS variables_count
		FROM directory_templates t
		LEFT JOIN directory_categories c ON c.id = t.category_id
		ORDER BY t.featured DESC, t.updated_at DESC`;
}

export async function listDirectoryCategories(): Promise<{ id: string; name: string }[]> {
	return await sql<{ id: string; name: string }[]>`
		SELECT id, name FROM directory_categories ORDER BY name`;
}

export async function getDirectoryTemplate(
	id: string
): Promise<{ template: any; variables: any[] } | null> {
	const [template] = await sql<any[]>`
		SELECT t.*,
			CASE WHEN c.id IS NOT NULL THEN json_build_object('id', c.id, 'name', c.name) ELSE NULL END AS category
		FROM directory_templates t
		LEFT JOIN directory_categories c ON c.id = t.category_id
		WHERE t.id = ${id}`;
	if (!template) return null;

	const variables = await sql<any[]>`
		SELECT * FROM directory_variables WHERE template_id = ${id} ORDER BY name`;

	return { template, variables: variables ?? [] };
}

/** Copy a public directory template (and its variables) into the user's own collection. */
export async function addDirectoryTemplateToCollection(
	userId: string,
	directoryId: string,
	categoryId: string | null
): Promise<void> {
	const source = await getDirectoryTemplate(directoryId);
	if (!source) throw new Error('Template not found');
	const { template, variables } = source;

	await sql.begin(async (tx) => {
		const [created] = await tx<{ id: string }[]>`
			INSERT INTO templates ${tx({
				title: template.title,
				description: template.description,
				content: template.content,
				category_id: categoryId,
				user_id: userId
			})} RETURNING id`;

		if (variables.length > 0) {
			const rows = variables.map((v: any) => ({
				template_id: created.id,
				name: v.name,
				description: v.description,
				type: v.type,
				default_value: v.default_value,
				is_required: v.is_required
			}));
			await tx`INSERT INTO variables ${tx(rows)}`;
		}
	});
}
