import { supabaseAdmin } from './supabase';
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
	const { data, error } = await supabaseAdmin
		.from('directory_templates')
		.select('id, title, description, category_id, featured, directory_categories(name)')
		.order('title');
	if (error) throw error;
	return (data ?? []).map((t: any) => ({
		id: t.id,
		title: t.title,
		description: t.description,
		category_id: t.category_id,
		featured: !!t.featured,
		category_name: t.directory_categories?.name ?? null
	}));
}

export interface NewDirectoryTemplateInput {
	title: string;
	description: string | null;
	content: string;
	category_id: string | null;
	featured: boolean;
}

export async function createAdminDirectoryTemplate(input: NewDirectoryTemplateInput): Promise<string> {
	const { data, error } = await supabaseAdmin
		.from('directory_templates')
		.insert(input)
		.select('id')
		.single();
	if (error) throw error;

	const names = extractVariableNames(input.content);
	if (names.length > 0) {
		const rows = names.map((name) => ({
			template_id: data.id,
			name,
			description: '',
			default_value: ''
		}));
		const { error: vErr } = await supabaseAdmin.from('directory_variables').insert(rows);
		if (vErr) throw vErr;
	}
	return data.id;
}

export async function deleteAdminDirectoryTemplate(id: string): Promise<void> {
	// directory_variables.template_id is ON DELETE CASCADE.
	const { error } = await supabaseAdmin.from('directory_templates').delete().eq('id', id);
	if (error) throw error;
}

export async function toggleDirectoryTemplateFeatured(id: string, featured: boolean): Promise<void> {
	const { error } = await supabaseAdmin
		.from('directory_templates')
		.update({ featured })
		.eq('id', id);
	if (error) throw error;
}

// ---- Existing single-template helpers ----

export async function getAdminDirectoryTemplate(
	id: string
): Promise<{ template: any; variables: any[] } | null> {
	const { data: template, error } = await supabaseAdmin
		.from('directory_templates')
		.select('*')
		.eq('id', id)
		.maybeSingle();
	if (error) throw error;
	if (!template) return null;

	const { data: variables, error: vErr } = await supabaseAdmin
		.from('directory_variables')
		.select('*')
		.eq('template_id', id)
		.order('name');
	if (vErr) throw vErr;

	return { template, variables: variables ?? [] };
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
	const { error } = await supabaseAdmin.from('directory_templates').update(input).eq('id', id);
	if (error) throw error;

	const names = extractVariableNames(input.content);
	if (names.length === 0) return;
	const { data: existing, error: exErr } = await supabaseAdmin
		.from('directory_variables')
		.select('name')
		.eq('template_id', id);
	if (exErr) throw exErr;
	const existingNames = new Set((existing ?? []).map((v: { name: string }) => v.name));
	const toAdd = names.filter((n) => !existingNames.has(n));
	if (toAdd.length > 0) {
		const rows = toAdd.map((name) => ({ template_id: id, name, type: 'text', is_required: false }));
		const { error: vErr } = await supabaseAdmin.from('directory_variables').insert(rows);
		if (vErr) throw vErr;
	}
}

// ---- Variables ----

export async function createDirectoryVariable(
	templateId: string,
	input: { name: string; description: string | null; default_value: string | null }
): Promise<void> {
	const { error } = await supabaseAdmin.from('directory_variables').insert({
		template_id: templateId,
		name: input.name,
		description: input.description,
		type: 'text',
		default_value: input.default_value,
		is_required: false
	});
	if (error) throw error;
}

export async function updateDirectoryVariable(
	id: string,
	input: { name: string; description: string | null; default_value: string | null }
): Promise<void> {
	const { error } = await supabaseAdmin
		.from('directory_variables')
		.update({ name: input.name, description: input.description, default_value: input.default_value })
		.eq('id', id);
	if (error) throw error;
}

export async function deleteDirectoryVariable(id: string): Promise<void> {
	const { error } = await supabaseAdmin.from('directory_variables').delete().eq('id', id);
	if (error) throw error;
}

// ---- Categories ----

export async function listAdminDirectoryCategories(): Promise<
	{ id: string; name: string; description: string | null }[]
> {
	const { data, error } = await supabaseAdmin
		.from('directory_categories')
		.select('id, name, description')
		.order('name');
	if (error) throw error;
	return data ?? [];
}

export async function createDirectoryCategory(
	name: string,
	description: string | null
): Promise<string> {
	const { data, error } = await supabaseAdmin
		.from('directory_categories')
		.insert({ name, description })
		.select('id')
		.single();
	if (error) throw error;
	return data.id;
}

export async function updateDirectoryCategory(
	id: string,
	name: string,
	description: string | null
): Promise<void> {
	const { error } = await supabaseAdmin
		.from('directory_categories')
		.update({ name, description })
		.eq('id', id);
	if (error) throw error;
}

/** Delete a directory category. Refuses if templates still reference it. */
export async function deleteDirectoryCategory(
	id: string
): Promise<{ ok: true } | { ok: false; count: number }> {
	const { count, error: countError } = await supabaseAdmin
		.from('directory_templates')
		.select('id', { count: 'exact', head: true })
		.eq('category_id', id);
	if (countError) throw countError;
	if ((count ?? 0) > 0) return { ok: false, count: count ?? 0 };

	const { error } = await supabaseAdmin.from('directory_categories').delete().eq('id', id);
	if (error) throw error;
	return { ok: true };
}

// ---- CSV ----

export async function getAdminDirectoryTemplatesForExport(): Promise<any[]> {
	const { data, error } = await supabaseAdmin
		.from('directory_templates')
		.select('*, directory_categories(name), directory_variables(name, description, type, default_value, is_required)')
		.order('title');
	if (error) throw error;
	return data ?? [];
}

export interface ImportResult {
	successCount: number;
	errorCount: number;
	errors: string[];
}

export async function importAdminDirectoryTemplatesFromCSV(csvText: string): Promise<ImportResult> {
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

	const { data: cats } = await supabaseAdmin.from('directory_categories').select('id, name');
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
				if (existing) {
					categoryId = existing;
				} else {
					categoryId = await createDirectoryCategory(catName, `Imported category for ${row['Title']}`);
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
					variables.push({ name, description: '', type: 'text', default_value: '', is_required: false });
					seen.add(name);
				}
			}

			const { data: tmpl, error: tErr } = await supabaseAdmin
				.from('directory_templates')
				.insert({
					title: row['Title'].trim(),
					description: row['Description']?.trim() || null,
					content: row['Content'].trim(),
					category_id: categoryId,
					featured:
						row['Featured']?.toLowerCase() === 'yes' || row['Featured']?.toLowerCase() === 'true'
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
				const { error: vErr } = await supabaseAdmin.from('directory_variables').insert(rows);
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
