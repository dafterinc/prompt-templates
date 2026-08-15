import { supabaseAdmin } from './supabase';
import { extractVariableNames } from '$lib/utils/template';

// Data-access for the admin-managed public directory. Authorization is by admin role, enforced at
// the route via requireAdmin (and hooks.server.ts); these functions do not filter by user.

// ---- Templates ----

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
