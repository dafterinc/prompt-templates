import { supabaseAdmin } from './supabase';

// Data-access for the private "categories" domain. Every function takes the owning userId and
// filters on it explicitly, so ownership is enforced here in one place rather than relying on RLS.

export interface CategoryWithCount {
	id: string;
	name: string;
	created_at: string;
	updated_at: string;
	template_count: number;
}

export async function listCategories(userId: string): Promise<CategoryWithCount[]> {
	const { data, error } = await supabaseAdmin
		.from('categories')
		.select('*, templates(count)')
		.eq('user_id', userId)
		.order('name');
	if (error) throw error;
	return (data ?? []).map((c: any) => ({
		...c,
		template_count: c.templates?.[0]?.count ?? 0
	}));
}

export async function createCategory(userId: string, name: string): Promise<string> {
	const { data, error } = await supabaseAdmin
		.from('categories')
		.insert({ name, user_id: userId })
		.select('id')
		.single();
	if (error) throw error;
	return data.id;
}

export async function updateCategory(userId: string, id: string, name: string): Promise<void> {
	const { error } = await supabaseAdmin
		.from('categories')
		.update({ name, updated_at: new Date().toISOString() })
		.eq('id', id)
		.eq('user_id', userId);
	if (error) throw error;
}

/** Delete a category the user owns. Refuses if the category still has templates. */
export async function deleteCategory(
	userId: string,
	id: string
): Promise<{ ok: true } | { ok: false; reason: 'has-templates' }> {
	const { count, error: countError } = await supabaseAdmin
		.from('templates')
		.select('id', { count: 'exact', head: true })
		.eq('category_id', id)
		.eq('user_id', userId);
	if (countError) throw countError;
	if ((count ?? 0) > 0) {
		return { ok: false, reason: 'has-templates' };
	}

	const { error } = await supabaseAdmin
		.from('categories')
		.delete()
		.eq('id', id)
		.eq('user_id', userId);
	if (error) throw error;
	return { ok: true };
}
