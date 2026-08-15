import { sql } from './db';
import { createCategory } from './categories';
import { extractVariableNames } from '$lib/utils/template';
import { parseCSV } from '$lib/utils/csv';

// Data-access for the private "templates" domain. Every function takes the owning userId and
// filters on it explicitly, so ownership is enforced here rather than by RLS. Variable rows are
// derived from `{{placeholder}}` content via the shared extractVariableNames helper.

export interface TemplateRow {
	id: string;
	title: string;
	description: string | null;
	content: string;
	category_id: string | null;
	created_at: string;
	updated_at: string;
	category?: { id: string; name: string } | null;
}

export interface VariableRow {
	id: string;
	template_id: string;
	name: string;
	description: string | null;
	type: string;
	default_value: string | null;
	is_required: boolean;
}

export interface TemplateInput {
	title: string;
	description: string | null;
	content: string;
	category_id: string | null;
}

export interface TemplateListItem {
	id: string;
	title: string;
	description: string | null;
	category_id: string | null;
	category_name: string | null;
	variables_count: number;
	updated_at: string;
}

/** List the user's templates for the list page: displayed columns + variable count, no content. */
export async function listTemplates(userId: string): Promise<TemplateListItem[]> {
	return await sql<TemplateListItem[]>`
		SELECT t.id, t.title, t.description, t.category_id,
			c.name AS category_name,
			(SELECT count(*)::int FROM variables v WHERE v.template_id = t.id) AS variables_count,
			t.updated_at
		FROM templates t
		LEFT JOIN categories c ON c.id = t.category_id
		WHERE t.user_id = ${userId}
		ORDER BY t.updated_at DESC`;
}

/** Full templates (with category name + variables) for CSV export. */
export async function getTemplatesForExport(userId: string): Promise<any[]> {
	return await sql<any[]>`
		SELECT t.*,
			CASE WHEN c.id IS NULL THEN NULL ELSE json_build_object('name', c.name) END AS categories,
			(
				SELECT coalesce(
					json_agg(json_build_object(
						'name', v.name,
						'description', v.description,
						'type', v.type,
						'default_value', v.default_value,
						'is_required', v.is_required
					)),
					'[]'::json
				)
				FROM variables v WHERE v.template_id = t.id
			) AS variables
		FROM templates t
		LEFT JOIN categories c ON c.id = t.category_id
		WHERE t.user_id = ${userId}
		ORDER BY t.title`;
}

export interface ImportResult {
	successCount: number;
	errorCount: number;
	errors: string[];
}

/** Create templates (and any missing categories/variables) for the user from CSV text. */
export async function importTemplatesFromCSV(userId: string, csvText: string): Promise<ImportResult> {
	const records = parseCSV(csvText);
	if (records.length < 2) {
		return { successCount: 0, errorCount: 0, errors: ['CSV must have a header row and at least one data row'] };
	}

	const headers = records[0].map((h) => h.trim());
	const dataRows = records.slice(1);
	const required = ['Title', 'Description', 'Content', 'Category Name'];
	const missing = required.filter((h) => !headers.includes(h));
	if (missing.length > 0) {
		return { successCount: 0, errorCount: 0, errors: [`Missing required headers: ${missing.join(', ')}`] };
	}

	const cats = await sql<{ id: string; name: string }[]>`
		SELECT id, name FROM categories WHERE user_id = ${userId}`;
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
				categoryId = existing ?? (await createCategory(userId, catName));
				if (!existing) categoriesByName.set(catName.toLowerCase(), categoryId);
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
					variables.push({ name, description: '', type: 'text', default_value: '', is_required: false });
					seen.add(name);
				}
			}

			let templateId: string;
			try {
				const [tmpl] = await sql<{ id: string }[]>`
					INSERT INTO templates ${sql({
						title: row['Title'].trim(),
						description: row['Description']?.trim() || null,
						content: row['Content'].trim(),
						category_id: categoryId,
						user_id: userId
					})} RETURNING id`;
				templateId = tmpl.id;
			} catch (tErr: any) {
				errors.push(`Row ${i + 2}: Failed to create template: ${tErr?.message ?? tErr}`);
				errorCount++;
				continue;
			}

			if (variables.length > 0) {
				const rows = variables.map((v) => ({
					template_id: templateId,
					name: v.name,
					description: v.description || '',
					type: v.type || 'text',
					default_value: v.default_value || '',
					is_required: v.is_required || false
				}));
				try {
					await sql`INSERT INTO variables ${sql(rows)}`;
				} catch (vErr: any) {
					errors.push(`Row ${i + 2}: Template created but variables failed: ${vErr?.message ?? vErr}`);
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

/** Fetch a template the user owns, with its category and variables. Null if not found/owned. */
export async function getTemplate(
	userId: string,
	id: string
): Promise<{ template: TemplateRow; variables: VariableRow[] } | null> {
	const [template] = await sql<TemplateRow[]>`
		SELECT t.id, t.title, t.description, t.content, t.category_id, t.created_at, t.updated_at,
			CASE WHEN c.id IS NULL THEN NULL ELSE json_build_object('id', c.id, 'name', c.name) END AS category
		FROM templates t
		LEFT JOIN categories c ON c.id = t.category_id
		WHERE t.id = ${id} AND t.user_id = ${userId}`;
	if (!template) return null;

	const variables = await sql<VariableRow[]>`
		SELECT id, template_id, name, description, type, default_value, is_required
		FROM variables WHERE template_id = ${id} ORDER BY name`;

	return { template, variables };
}

async function insertVariables(templateId: string, names: string[]): Promise<void> {
	if (names.length === 0) return;
	const rows = names.map((name) => ({
		template_id: templateId,
		name,
		type: 'text',
		is_required: false
	}));
	await sql`INSERT INTO variables ${sql(rows)}`;
}

export async function createTemplate(userId: string, input: TemplateInput): Promise<string> {
	const names = extractVariableNames(input.content);
	return await sql.begin(async (tx) => {
		const [row] = await tx<{ id: string }[]>`
			INSERT INTO templates ${tx({ ...input, user_id: userId })} RETURNING id`;
		if (names.length > 0) {
			const rows = names.map((name) => ({
				template_id: row.id,
				name,
				type: 'text',
				is_required: false
			}));
			await tx`INSERT INTO variables ${tx(rows)}`;
		}
		return row.id;
	});
}

/** Update a template the user owns, syncing variables when the content changed. */
export async function updateTemplate(
	userId: string,
	id: string,
	input: TemplateInput,
	previousContent: string
): Promise<void> {
	await sql`
		UPDATE templates SET ${sql(input)}, updated_at = now()
		WHERE id = ${id} AND user_id = ${userId}`;

	if (input.content === previousContent) return;

	const desired = extractVariableNames(input.content);
	const existing = await sql<{ name: string }[]>`
		SELECT name FROM variables WHERE template_id = ${id}`;

	const existingNames = new Set(existing.map((v: { name: string }) => v.name));
	const toAdd = desired.filter((n) => !existingNames.has(n));
	const toRemove = [...existingNames].filter((n) => !desired.includes(n));

	await insertVariables(id, toAdd);
	if (toRemove.length > 0) {
		await sql`DELETE FROM variables WHERE template_id = ${id} AND name = ANY(${toRemove})`;
	}
}

/** Delete a template the user owns. variables.template_id is ON DELETE CASCADE. */
export async function deleteTemplate(userId: string, id: string): Promise<void> {
	await sql`DELETE FROM templates WHERE id = ${id} AND user_id = ${userId}`;
}

/** Duplicate a template the user owns (with its variables). Returns the new id, or null. */
export async function duplicateTemplate(userId: string, id: string): Promise<string | null> {
	const owned = await getTemplate(userId, id);
	if (!owned) return null;
	const { template, variables } = owned;

	return await sql.begin(async (tx) => {
		const [created] = await tx<{ id: string }[]>`
			INSERT INTO templates ${tx({
				title: `${template.title} (Copy)`,
				description: template.description,
				content: template.content,
				category_id: template.category_id,
				user_id: userId
			})} RETURNING id`;

		if (variables.length > 0) {
			const rows = variables.map((v) => ({
				template_id: created.id,
				name: v.name,
				description: v.description,
				type: v.type,
				default_value: v.default_value,
				is_required: v.is_required
			}));
			await tx`INSERT INTO variables ${tx(rows)}`;
		}
		return created.id;
	});
}
