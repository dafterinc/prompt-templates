import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';
import { json } from '@sveltejs/kit';

// Create a server-side Supabase client with service role key
const serverSupabase = createClient(
	env.VITE_SUPABASE_URL || '',
	env.SUPABASE_SERVICE_ROLE_KEY || '',
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	}
);

export const GET: RequestHandler = async ({ locals }) => {
	// Check if user is admin (this should be set by hooks.server.ts)
	if (!locals.isAdmin) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	try {
		// Fetch users from auth API using service role key
		const { data: authUsers, error: authError } = await serverSupabase.auth.admin.listUsers();

		if (authError) {
			console.error('Auth API error:', authError);
			return json({ error: authError.message }, { status: 500 });
		}

		// Fetch user_profiles to check admin status
		const { data: profiles, error: profilesError } = await serverSupabase
			.from('user_profiles')
			.select('id, is_admin');

		if (profilesError) {
			console.error('Profiles error:', profilesError);
			return json({ error: profilesError.message }, { status: 500 });
		}

		// Fetch template counts for each user
		const { data: templateCounts, error: templateCountsError } = await serverSupabase
			.from('templates')
			.select('user_id')
			.then(({ data, error }) => {
				if (error) return { data: null, error };
				// Count templates per user
				const counts = data.reduce((acc, template) => {
					acc[template.user_id] = (acc[template.user_id] || 0) + 1;
					return acc;
				}, {} as Record<string, number>);
				return { data: counts, error: null };
			});

		if (templateCountsError) {
			console.error('Template counts error:', templateCountsError);
			return json({ error: templateCountsError.message }, { status: 500 });
		}

		// Fetch category counts for each user
		const { data: categoryCounts, error: categoryCountsError } = await serverSupabase
			.from('categories')
			.select('user_id')
			.then(({ data, error }) => {
				if (error) return { data: null, error };
				// Count categories per user
				const counts = data.reduce((acc, category) => {
					acc[category.user_id] = (acc[category.user_id] || 0) + 1;
					return acc;
				}, {} as Record<string, number>);
				return { data: counts, error: null };
			});

		if (categoryCountsError) {
			console.error('Category counts error:', categoryCountsError);
			return json({ error: categoryCountsError.message }, { status: 500 });
		}

		// Combine data
		const users = (authUsers?.users || []).map((user) => {
			const profile = profiles ? profiles.find((p) => p.id === user.id) : null;
			return {
				id: user.id,
				email: user.email || '',
				last_sign_in_at: user.last_sign_in_at || '',
				created_at: user.created_at,
				is_admin: profile ? profile.is_admin : false,
				has_profile: !!profile,
				template_count: templateCounts?.[user.id] || 0,
				category_count: categoryCounts?.[user.id] || 0
			};
		});

		return json({ users });
	} catch (error: any) {
		console.error('Unexpected error:', error);
		return json({ error: error.message || 'Failed to load users' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	// Check if user is admin
	if (!locals.isAdmin) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	try {
		const { userId } = await request.json();

		if (!userId) {
			return json({ error: 'User ID is required' }, { status: 400 });
		}

		// Prevent admin from deleting themselves
		if (userId === locals.user?.id) {
			return json({ error: 'You cannot delete your own account' }, { status: 400 });
		}

		// Delete user from auth (this will cascade delete all related data due to ON DELETE CASCADE)
		const { error: deleteError } = await serverSupabase.auth.admin.deleteUser(userId);

		if (deleteError) {
			console.error('User deletion error:', deleteError);
			return json({ error: deleteError.message }, { status: 500 });
		}

		return json({ success: true, message: 'User and all associated content deleted successfully' });
	} catch (error: any) {
		console.error('Unexpected error during user deletion:', error);
		return json({ error: error.message || 'Failed to delete user' }, { status: 500 });
	}
};
