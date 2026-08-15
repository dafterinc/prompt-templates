import { sql } from './db';
import { put, del } from '@vercel/blob';
import { env } from '$env/dynamic/private';

// Data-access for the current user's own profile. Every function is scoped to the caller's userId.
// Profile images live in Vercel Blob. is_admin is never written here — only the admin API sets it.

export interface Profile {
	id: string;
	is_admin: boolean;
	full_name: string | null;
	profile_image_url: string | null;
	company_name: string | null;
	industry: string | null;
	company_website: string | null;
	team_size: string | null;
	usage_purpose: string | null;
}

export async function getOrCreateProfile(userId: string): Promise<Profile> {
	const [existing] = await sql<Profile[]>`SELECT * FROM user_profiles WHERE id = ${userId}`;
	if (existing) return existing;
	const [created] = await sql<Profile[]>`
		INSERT INTO user_profiles (id) VALUES (${userId})
		ON CONFLICT (id) DO UPDATE SET updated_at = now()
		RETURNING *`;
	return created;
}

export interface ProfileInput {
	full_name: string | null;
	company_name: string | null;
	industry: string | null;
	company_website: string | null;
	team_size: string | null;
	usage_purpose: string | null;
}

export async function updateProfile(userId: string, input: ProfileInput): Promise<void> {
	await sql`
		UPDATE user_profiles SET ${sql(input)}, updated_at = now()
		WHERE id = ${userId}`;
}

/** Upload a profile image to Vercel Blob and record its URL. Returns the public URL. */
export async function uploadProfileImage(userId: string, file: File): Promise<string> {
	const ext = (file.name.split('.').pop() || 'png').toLowerCase();
	const pathname = `profile-images/${userId}/${Date.now()}.${ext}`;

	const { url } = await put(pathname, file, {
		access: 'public',
		contentType: file.type,
		token: env.BLOB_READ_WRITE_TOKEN
	});

	const [prev] = await sql<{ profile_image_url: string | null }[]>`
		SELECT profile_image_url FROM user_profiles WHERE id = ${userId}`;

	await sql`
		UPDATE user_profiles SET profile_image_url = ${url}, updated_at = now()
		WHERE id = ${userId}`;

	// Best-effort removal of the previous image.
	if (prev?.profile_image_url) {
		try {
			await del(prev.profile_image_url, { token: env.BLOB_READ_WRITE_TOKEN });
		} catch {
			/* ignore */
		}
	}

	return url;
}
