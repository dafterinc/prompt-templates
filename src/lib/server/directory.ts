import { supabaseAdmin } from './supabase';

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
	const { data, error } = await supabaseAdmin
		.from('directory_templates')
		.select('id, title, description, category_id, featured, updated_at, directory_categories(name), directory_variables(count)')
		.order('featured', { ascending: false })
		.order('updated_at', { ascending: false });
	if (error) throw error;
	return (data ?? []).map((t: any) => ({
		id: t.id,
		title: t.title,
		description: t.description,
		category_id: t.category_id,
		featured: !!t.featured,
		category_name: t.directory_categories?.name ?? null,
		variables_count: t.directory_variables?.[0]?.count ?? 0
	}));
}

export async function listDirectoryCategories(): Promise<{ id: string; name: string }[]> {
	const { data, error } = await supabaseAdmin
		.from('directory_categories')
		.select('id, name')
		.order('name');
	if (error) throw error;
	return data ?? [];
}

export async function getDirectoryTemplate(
	id: string
): Promise<{ template: any; variables: any[] } | null> {
	const { data: template, error } = await supabaseAdmin
		.from('directory_templates')
		.select('*, category:directory_categories(id, name)')
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

/** Copy a public directory template (and its variables) into the user's own collection. */
export async function addDirectoryTemplateToCollection(
	userId: string,
	directoryId: string,
	categoryId: string | null
): Promise<void> {
	const source = await getDirectoryTemplate(directoryId);
	if (!source) throw new Error('Template not found');
	const { template, variables } = source;

	const { data: created, error } = await supabaseAdmin
		.from('templates')
		.insert({
			title: template.title,
			description: template.description,
			content: template.content,
			category_id: categoryId,
			user_id: userId
		})
		.select('id')
		.single();
	if (error) throw error;

	if (variables.length > 0) {
		const rows = variables.map((v: any) => ({
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
}
