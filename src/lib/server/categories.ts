import { sql } from './db';

// Data-access for the private "categories" domain. Every function takes the owning userId and
// filters on it explicitly, so ownership is enforced here in one place.

export interface CategoryWithCount {
	id: string;
	name: string;
	created_at: string;
	updated_at: string;
	template_count: number;
}

export async function listCategories(userId: string): Promise<CategoryWithCount[]> {
	return await sql<CategoryWithCount[]>`
		SELECT c.id, c.name, c.created_at, c.updated_at,
			(SELECT count(*)::int FROM templates t WHERE t.category_id = c.id) AS template_count
		FROM categories c
		WHERE c.user_id = ${userId}
		ORDER BY c.name`;
}

export async function createCategory(userId: string, name: string): Promise<string> {
	const [row] = await sql<{ id: string }[]>`
		INSERT INTO categories (name, user_id) VALUES (${name}, ${userId}) RETURNING id`;
	return row.id;
}

export async function updateCategory(userId: string, id: string, name: string): Promise<void> {
	await sql`
		UPDATE categories SET name = ${name}, updated_at = now()
		WHERE id = ${id} AND user_id = ${userId}`;
}

/** Delete a category the user owns. Refuses if the category still has templates. */
export async function deleteCategory(
	userId: string,
	id: string
): Promise<{ ok: true } | { ok: false; reason: 'has-templates' }> {
	const [{ count }] = await sql<{ count: number }[]>`
		SELECT count(*)::int AS count FROM templates WHERE category_id = ${id} AND user_id = ${userId}`;
	if (count > 0) {
		return { ok: false, reason: 'has-templates' };
	}

	await sql`DELETE FROM categories WHERE id = ${id} AND user_id = ${userId}`;
	return { ok: true };
}
