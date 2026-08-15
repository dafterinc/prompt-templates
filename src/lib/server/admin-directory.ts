import { sql } from './db';
import { extractVariableNames } from '$lib/utils/template';
import { parseCSV } from '$lib/utils/csv';

// Data-access for the admin-managed public directory. Authorization is by admin role, enforced at
// the route via requireAdmin (and hooks.server.ts); these functions do not filter by user.

// ---- Templates ----

export interface AdminDirectoryTemplateListItem {
	id: string;
	title: string;
	description: string | null;
	category_id: string | null;
	category_name: string | null;
	featured: boolean;
}

export async function listAdminDirectoryTemplates(): Promise<AdminDirectoryTemplateListItem[]> {
	const rows = await sql<
		{
			id: string;
			title: string;
			description: string | null;
			category_id: string | null;
			featured: boolean;
			category_name: string | null;
		}[]
	>`
		SELECT t.id, t.title, t.description, t.category_id, t.featured,
			c.name AS category_name
		FROM directory_templates t
		LEFT JOIN directory_categories c ON c.id = t.category_id
		ORDER BY t.title`;
	return rows.map((t) => ({
		id: t.id,
		title: t.title,
		description: t.description,
		category_id: t.category_id,
		featured: !!t.featured,
		category_name: t.category_name ?? null
	}));
}

export interface NewDirectoryTemplateInput {
	title: string;
	description: string | null;
	content: string;
	category_id: string | null;
	featured: boolean;
}

export async function createAdminDirectoryTemplate(
	input: NewDirectoryTemplateInput
): Promise<string> {
	const names = extractVariableNames(input.content);
	let newId = '';
	await sql.begin(async (tx) => {
		const [row] = await tx<{ id: string }[]>`
			INSERT INTO directory_templates ${tx(input)} RETURNING id`;
		newId = row.id;
		if (names.length > 0) {
			const rows = names.map((name) => ({
				template_id: row.id,
				name,
				description: '',
				default_value: ''
			}));
			await tx`INSERT INTO directory_variables ${tx(rows)}`;
		}
	});
	return newId;
}

export async function deleteAdminDirectoryTemplate(id: string): Promise<void> {
	// directory_variables.template_id is ON DELETE CASCADE.
	await sql`DELETE FROM directory_templates WHERE id = ${id}`;
}

export async function toggleDirectoryTemplateFeatured(
	id: string,
	featured: boolean
): Promise<void> {
	await sql`UPDATE directory_templates SET featured = ${featured}, updated_at = now() WHERE id = ${id}`;
}

// ---- Existing single-template helpers ----

export async function getAdminDirectoryTemplate(
	id: string
): Promise<{ template: any; variables: any[] } | null> {
	const [template] = await sql<any[]>`
		SELECT * FROM directory_templates WHERE id = ${id}`;
	if (!template) return null;

	const variables = await sql<any[]>`
		SELECT * FROM directory_variables WHERE template_id = ${id} ORDER BY name`;

	return { template, variables };
}

export interface DirectoryTemplateInput {
	title: string;
	description: string | null;
	content: string;
	category_id: string | null;
	featured: boolean;
}

/** Update a directory template and add any new variables found in its content (add-only; admins
 *  manage variables explicitly). */
export async function updateAdminDirectoryTemplate(
	id: string,
	input: DirectoryTemplateInput
): Promise<void> {
	await sql`UPDATE directory_templates SET ${sql(input)}, updated_at = now() WHERE id = ${id}`;

	const names = extractVariableNames(input.content);
	if (names.length === 0) return;
	const existing = await sql<{ name: string }[]>`
		SELECT name FROM directory_variables WHERE template_id = ${id}`;
	const existingNames = new Set(existing.map((v) => v.name));
	const toAdd = names.filter((n) => !existingNames.has(n));
	if (toAdd.length > 0) {
		const rows = toAdd.map((name) => ({ template_id: id, name, type: 'text', is_required: false }));
		await sql`INSERT INTO directory_variables ${sql(rows)}`;
	}
}

// ---- Variables ----

export async function createDirectoryVariable(
	templateId: string,
	input: { name: string; description: string | null; default_value: string | null }
): Promise<void> {
	await sql`INSERT INTO directory_variables ${sql({
		template_id: templateId,
		name: input.name,
		description: input.description,
		type: 'text',
		default_value: input.default_value,
		is_required: false
	})}`;
}

export async function updateDirectoryVariable(
	id: string,
	input: { name: string; description: string | null; default_value: string | null }
): Promise<void> {
	await sql`UPDATE directory_variables SET ${sql({
		name: input.name,
		description: input.description,
		default_value: input.default_value
	})}, updated_at = now() WHERE id = ${id}`;
}

export async function deleteDirectoryVariable(id: string): Promise<void> {
	await sql`DELETE FROM directory_variables WHERE id = ${id}`;
}

// ---- Categories ----

export async function listAdminDirectoryCategories(): Promise<
	{ id: string; name: string; description: string | null }[]
> {
	return await sql<{ id: string; name: string; description: string | null }[]>`
		SELECT id, name, description FROM directory_categories ORDER BY name`;
}

export async function createDirectoryCategory(
	name: string,
	description: string | null
): Promise<string> {
	const [row] = await sql<{ id: string }[]>`
		INSERT INTO directory_categories (name, description) VALUES (${name}, ${description}) RETURNING id`;
	return row.id;
}

export async function updateDirectoryCategory(
	id: string,
	name: string,
	description: string | null
): Promise<void> {
	await sql`UPDATE directory_categories SET name = ${name}, description = ${description}, updated_at = now() WHERE id = ${id}`;
}

/** Delete a directory category. Refuses if templates still reference it. */
export async function deleteDirectoryCategory(
	id: string
): Promise<{ ok: true } | { ok: false; count: number }> {
	const [{ count }] = await sql<{ count: number }[]>`
		SELECT count(*)::int AS count FROM directory_templates WHERE category_id = ${id}`;
	if (count > 0) return { ok: false, count };

	await sql`DELETE FROM directory_categories WHERE id = ${id}`;
	return { ok: true };
}

// ---- CSV ----

export async function getAdminDirectoryTemplatesForExport(): Promise<any[]> {
	return await sql<any[]>`
		SELECT t.*,
			(SELECT json_build_object('name', c.name)
				FROM directory_categories c WHERE c.id = t.category_id) AS directory_categories,
			COALESCE(
				(SELECT json_agg(json_build_object(
					'name', v.name,
					'description', v.description,
					'type', v.type,
					'default_value', v.default_value,
					'is_required', v.is_required
				) ORDER BY v.name)
				FROM directory_variables v WHERE v.template_id = t.id),
				'[]'::json
			) AS directory_variables
		FROM directory_templates t
		ORDER BY t.title`;
}

export interface ImportResult {
	successCount: number;
	errorCount: number;
	errors: string[];
}

export async function importAdminDirectoryTemplatesFromCSV(csvText: string): Promise<ImportResult> {
	const records = parseCSV(csvText);
	if (records.length < 2) {
		return {
			successCount: 0,
			errorCount: 0,
			errors: ['CSV must have a header row and at least one data row']
		};
	}
	const headers = records[0].map((h) => h.trim());
	const dataRows = records.slice(1);
	const required = ['Title', 'Description', 'Content', 'Category Name'];
	const missing = required.filter((h) => !headers.includes(h));
	if (missing.length > 0) {
		return {
			successCount: 0,
			errorCount: 0,
			errors: [`Missing required headers: ${missing.join(', ')}`]
		};
	}

	const cats = await sql<{ id: string; name: string }[]>`
		SELECT id, name FROM directory_categories`;
	const categoriesByName = new Map<string, string>(
		cats.map((c: { id: string; name: string }) => [c.name.toLowerCase(), c.id])
	);

	let successCount = 0;
	let errorCount = 0;
	const errors: string[] = [];

	for (let i = 0; i < dataRows.length; i++) {
		const values = dataRows[i];
		try {
			if (values.length !== headers.length) {
				errors.push(`Row ${i + 2}: Column count mismatch`);
				errorCount++;
				continue;
			}
			const row: Record<string, string> = {};
			headers.forEach((h, idx) => (row[h] = values[idx] ?? ''));

			if (!row['Title']?.trim() || !row['Content']?.trim()) {
				errors.push(`Row ${i + 2}: Title and Content are required`);
				errorCount++;
				continue;
			}

			let categoryId: string | null = null;
			const catName = row['Category Name']?.trim();
			if (catName) {
				const existing = categoriesByName.get(catName.toLowerCase());
				if (existing) {
					categoryId = existing;
				} else {
					categoryId = await createDirectoryCategory(
						catName,
						`Imported category for ${row['Title']}`
					);
					categoriesByName.set(catName.toLowerCase(), categoryId);
				}
			}

			let variables: any[] = [];
			if (row['Variables (JSON)']?.trim()) {
				try {
					variables = JSON.parse(row['Variables (JSON)']);
				} catch {
					variables = [];
				}
			}
			const seen = new Set(variables.map((v) => v.name));
			for (const name of extractVariableNames(row['Content'])) {
				if (!seen.has(name)) {
					variables.push({
						name,
						description: '',
						type: 'text',
						default_value: '',
						is_required: false
					});
					seen.add(name);
				}
			}

			let tmplId: string;
			try {
				const [tmpl] = await sql<{ id: string }[]>`
					INSERT INTO directory_templates ${sql({
						title: row['Title'].trim(),
						description: row['Description']?.trim() || null,
						content: row['Content'].trim(),
						category_id: categoryId,
						featured:
							row['Featured']?.toLowerCase() === 'yes' ||
							row['Featured']?.toLowerCase() === 'true'
					})} RETURNING id`;
				tmplId = tmpl.id;
			} catch (tErr: any) {
				errors.push(`Row ${i + 2}: Failed to create template: ${tErr?.message ?? tErr}`);
				errorCount++;
				continue;
			}

			if (variables.length > 0) {
				const rows = variables.map((v) => ({
					template_id: tmplId,
					name: v.name,
					description: v.description || '',
					type: v.type || 'text',
					default_value: v.default_value || '',
					is_required: v.is_required || false
				}));
				try {
					await sql`INSERT INTO directory_variables ${sql(rows)}`;
				} catch (vErr: any) {
					errors.push(
						`Row ${i + 2}: Template created but variables failed: ${vErr?.message ?? vErr}`
					);
				}
			}
			successCount++;
		} catch (e: any) {
			errors.push(`Row ${i + 2}: ${e?.message ?? e}`);
			errorCount++;
		}
	}

	return { successCount, errorCount, errors };
}
