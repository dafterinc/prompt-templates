import { supabaseAdmin } from './supabase';

// Data-access for the current user's own profile. Every function is scoped to the caller's userId.
// Note: is_admin is never written here — it is protected by a column-level GRANT and only the
// service role (via admin flows) may change it.

export interface Profile {
	id: string;
	full_name: string | null;
	company_name: string | null;
	industry: string | null;
	company_website: string | null;
	team_size: string | null;
	usage_purpose: string | null;
	profile_image_url: string | null;
	is_admin: boolean;
}

export async function getOrCreateProfile(userId: string): Promise<Profile> {
	const { data, error } = await supabaseAdmin
		.from('user_profiles')
		.select('*')
		.eq('id', userId)
		.maybeSingle();
	if (error) throw error;
	if (data) return data as Profile;

	const { data: created, error: createError } = await supabaseAdmin
		.from('user_profiles')
		.insert({ id: userId })
		.select('*')
		.single();
	if (createError) throw createError;
	return created as Profile;
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
	const { error } = await supabaseAdmin
		.from('user_profiles')
		.update({ ...input, updated_at: new Date().toISOString() })
		.eq('id', userId);
	if (error) throw error;
}

/** Upload a profile image to the user's own folder and record its URL. Returns the public URL. */
export async function uploadProfileImage(userId: string, file: File): Promise<string> {
	const ext = (file.name.split('.').pop() || 'png').toLowerCase();
	const path = `${userId}/${Date.now()}.${ext}`;

	const { error: uploadError } = await supabaseAdmin.storage
		.from('profile_images')
		.upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: true });
	if (uploadError) throw uploadError;

	const { data } = supabaseAdmin.storage.from('profile_images').getPublicUrl(path);
	const url = data.publicUrl;

	const { error: updateError } = await supabaseAdmin
		.from('user_profiles')
		.update({ profile_image_url: url, updated_at: new Date().toISOString() })
		.eq('id', userId);
	if (updateError) throw updateError;

	return url;
}
