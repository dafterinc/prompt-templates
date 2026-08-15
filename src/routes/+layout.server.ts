import type { LayoutServerLoad } from './$types';
import { sql } from '$lib/server/db';

export const load: LayoutServerLoad = async ({ locals }) => {
	// The Blob store is private, so avatars are served through the authenticated /api/profile-image
	// route rather than a public URL.
	let profileImageUrl: string | null = null;
	if (locals.user) {
		const rows = await sql<{ profile_image_url: string | null }[]>`
			SELECT profile_image_url FROM user_profiles WHERE id = ${locals.user.id}`;
		profileImageUrl = rows[0]?.profile_image_url ? '/api/profile-image' : null;
	}

	return {
		user: locals.user,
		isAdmin: locals.isAdmin,
		profileImageUrl
	};
};
