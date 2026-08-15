import { supabaseAdmin } from './supabase';
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
	const { data, error } = await supabaseAdmin
		.from('templates')
		.select('id, title, description, category_id, updated_at, categories(name), variables(count)')
		.eq('user_id', userId)
		.order('updated_at', { ascending: false });
	if (error) throw error;
	return (data ?? []).map((t: any) => ({
		id: t.id,
		title: t.title,
		description: t.description,
		category_id: t.category_id,
		updated_at: t.updated_at,
		category_name: t.categories?.name ?? null,
		variables_count: t.variables?.[0]?.count ?? 0
	}));
}

/** Full templates (with category name + variables) for CSV export. */
export async function getTemplatesForExport(userId: string): Promise<any[]> {
	const { data, error } = await supabaseAdmin
		.from('templates')
		.select('*, categories(name), variables(name, description, type, default_value, is_required)')
		.eq('user_id', userId)
		.order('title');
	if (error) throw error;
	return data ?? [];
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

	const { data: cats } = await supabaseAdmin
		.from('categories')
		.select('id, name')
		.eq('user_id', userId);
	const categoriesByName = new Map<string, string>(
		(cats ?? []).map((c: { id: string; name: string }) => [c.name.toLowerCase(), c.id])
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

			const { data: tmpl, error: tErr } = await supabaseAdmin
				.from('templates')
				.insert({
					title: row['Title'].trim(),
					description: row['Description']?.trim() || null,
					content: row['Content'].trim(),
					category_id: categoryId,
					user_id: userId
				})
				.select('id')
				.single();
			if (tErr) {
				errors.push(`Row ${i + 2}: Failed to create template: ${tErr.message}`);
				errorCount++;
				continue;
			}

			if (variables.length > 0) {
				const rows = variables.map((v) => ({
					template_id: tmpl.id,
					name: v.name,
					description: v.description || '',
					type: v.type || 'text',
					default_value: v.default_value || '',
					is_required: v.is_required || false
				}));
				const { error: vErr } = await supabaseAdmin.from('variables').insert(rows);
				if (vErr) errors.push(`Row ${i + 2}: Template created but variables failed: ${vErr.message}`);
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
	const { data: template, error } = await supabaseAdmin
		.from('templates')
		.select('*, category:categories(id, name)')
		.eq('id', id)
		.eq('user_id', userId)
		.maybeSingle();
	if (error) throw error;
	if (!template) return null;

	const { data: variables, error: vErr } = await supabaseAdmin
		.from('variables')
		.select('*')
		.eq('template_id', id)
		.order('name');
	if (vErr) throw vErr;

	return { template: template as TemplateRow, variables: (variables ?? []) as VariableRow[] };
}

async function insertVariables(templateId: string, names: string[]): Promise<void> {
	if (names.length === 0) return;
	const rows = names.map((name) => ({
		template_id: templateId,
		name,
		type: 'text',
		is_required: false
	}));
	const { error } = await supabaseAdmin.from('variables').insert(rows);
	if (error) throw error;
}

export async function createTemplate(userId: string, input: TemplateInput): Promise<string> {
	const { data, error } = await supabaseAdmin
		.from('templates')
		.insert({ ...input, user_id: userId })
		.select('id')
		.single();
	if (error) throw error;
	await insertVariables(data.id, extractVariableNames(input.content));
	return data.id;
}

/** Update a template the user owns, syncing variables when the content changed. */
export async function updateTemplate(
	userId: string,
	id: string,
	input: TemplateInput,
	previousContent: string
): Promise<void> {
	const { error } = await supabaseAdmin
		.from('templates')
		.update({ ...input, updated_at: new Date().toISOString() })
		.eq('id', id)
		.eq('user_id', userId);
	if (error) throw error;

	if (input.content === previousContent) return;

	const desired = extractVariableNames(input.content);
	const { data: existing, error: exErr } = await supabaseAdmin
		.from('variables')
		.select('name')
		.eq('template_id', id);
	if (exErr) throw exErr;

	const existingNames = new Set((existing ?? []).map((v: { name: string }) => v.name));
	const toAdd = desired.filter((n) => !existingNames.has(n));
	const toRemove = [...existingNames].filter((n) => !desired.includes(n));

	await insertVariables(id, toAdd);
	if (toRemove.length > 0) {
		const { error: delErr } = await supabaseAdmin
			.from('variables')
			.delete()
			.eq('template_id', id)
			.in('name', toRemove);
		if (delErr) throw delErr;
	}
}

/** Delete a template the user owns. variables.template_id is ON DELETE CASCADE. */
export async function deleteTemplate(userId: string, id: string): Promise<void> {
	const { error } = await supabaseAdmin
		.from('templates')
		.delete()
		.eq('id', id)
		.eq('user_id', userId);
	if (error) throw error;
}

/** Duplicate a template the user owns (with its variables). Returns the new id, or null. */
export async function duplicateTemplate(userId: string, id: string): Promise<string | null> {
	const owned = await getTemplate(userId, id);
	if (!owned) return null;
	const { template, variables } = owned;

	const { data: created, error } = await supabaseAdmin
		.from('templates')
		.insert({
			title: `${template.title} (Copy)`,
			description: template.description,
			content: template.content,
			category_id: template.category_id,
			user_id: userId
		})
		.select('id')
		.single();
	if (error) throw error;

	if (variables.length > 0) {
		const rows = variables.map((v) => ({
			template_id: created.id,
			name: v.name,
			description: v.description,
			type: v.type,
			default_value: v.default_value,
			is_required: v.is_required
		}));
		const { error: vErr } = await supabaseAdmin.from('variables').insert(rows);
		if (vErr) throw vErr;
	}
	return created.id;
}
