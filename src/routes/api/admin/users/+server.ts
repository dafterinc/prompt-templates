import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { logger } from '$lib/utils/logger';

interface AdminUserRow {
	id: string;
	email: string;
	created_at: string;
	last_sign_in_at: string | null;
	is_admin: boolean;
	has_profile: boolean;
	template_count: number;
	category_count: number;
}

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.isAdmin) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	try {
		const users = await sql<AdminUserRow[]>`
			SELECT
				u.id,
				u.email,
				u."createdAt" AS created_at,
				(SELECT max(s."createdAt") FROM "session" s WHERE s."userId" = u.id) AS last_sign_in_at,
				coalesce(up.is_admin, false) AS is_admin,
				(up.id IS NOT NULL) AS has_profile,
				(SELECT count(*)::int FROM templates t WHERE t.user_id = u.id) AS template_count,
				(SELECT count(*)::int FROM categories c WHERE c.user_id = u.id) AS category_count
			FROM "user" u
			LEFT JOIN user_profiles up ON up.id = u.id
			ORDER BY u."createdAt" DESC`;

		return json({ users });
	} catch (error) {
		logger.error('Unexpected error listing users', error, 'api:admin/users');
		const message = error instanceof Error ? error.message : 'Failed to load users';
		return json({ error: message }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
	if (!locals.isAdmin) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	try {
		const { userId, isAdmin } = await request.json();

		if (!userId || typeof isAdmin !== 'boolean') {
			return json({ error: 'userId and isAdmin (boolean) are required' }, { status: 400 });
		}

		await sql`
			INSERT INTO user_profiles (id, is_admin) VALUES (${userId}, ${isAdmin})
			ON CONFLICT (id) DO UPDATE SET is_admin = ${isAdmin}, updated_at = now()`;

		return json({ success: true });
	} catch (error) {
		logger.error('Unexpected error updating user', error, 'api:admin/users');
		const message = error instanceof Error ? error.message : 'Failed to update user';
		return json({ error: message }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.isAdmin) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	try {
		const { userId } = await request.json();

		if (!userId) {
			return json({ error: 'User ID is required' }, { status: 400 });
		}
		if (userId === locals.user?.id) {
			return json({ error: 'You cannot delete your own account' }, { status: 400 });
		}

		// Deleting the user cascades to their categories/templates/variables and user_profiles
		// (FKs to "user"). Better Auth's session/account rows are removed first to be safe.
		await sql.begin(async (tx) => {
			await tx`DELETE FROM "session" WHERE "userId" = ${userId}`;
			await tx`DELETE FROM "account" WHERE "userId" = ${userId}`;
			await tx`DELETE FROM "user" WHERE id = ${userId}`;
		});

		return json({ success: true, message: 'User and all associated content deleted successfully' });
	} catch (error) {
		logger.error('Unexpected error during user deletion', error, 'api:admin/users');
		const message = error instanceof Error ? error.message : 'Failed to delete user';
		return json({ error: message }, { status: 500 });
	}
};
