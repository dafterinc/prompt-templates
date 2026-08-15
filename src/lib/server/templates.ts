import { supabaseAdmin } from './supabase';
import { extractVariableNames } from '$lib/utils/template';

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
