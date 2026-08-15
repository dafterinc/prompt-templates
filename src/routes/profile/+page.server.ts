import { fail } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { getOrCreateProfile, updateProfile, uploadProfileImage } from '$lib/server/profiles';
import type { Actions, PageServerLoad } from './$types';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const profile = await getOrCreateProfile(user.id);
	return { profile, email: user.email ?? '' };
};

export const actions: Actions = {
	update: async ({ locals, request }) => {
		const user = requireUser(locals);
		const form = await request.formData();
		const val = (k: string) => {
			const v = String(form.get(k) ?? '').trim();
			return v || null;
		};
		try {
			await updateProfile(user.id, {
				full_name: val('full_name'),
				company_name: val('company_name'),
				industry: val('industry'),
				company_website: val('company_website'),
				team_size: val('team_size'),
				usage_purpose: val('usage_purpose')
			});
		} catch (e: any) {
			return fail(400, { error: e?.message ?? 'Failed to update profile', scope: 'update' });
		}
		return { success: true, scope: 'update' };
	},

	uploadImage: async ({ locals, request }) => {
		const user = requireUser(locals);
		const file = (await request.formData()).get('file');
		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { error: 'Please choose an image', scope: 'image' });
		}
		if (!file.type.startsWith('image/')) {
			return fail(400, { error: 'File must be an image', scope: 'image' });
		}
		if (file.size > MAX_IMAGE_BYTES) {
			return fail(400, { error: 'Image must be less than 2MB', scope: 'image' });
		}
		try {
			await uploadProfileImage(user.id, file);
			return { success: true, scope: 'image' };
		} catch (e: any) {
			return fail(400, { error: e?.message ?? 'Failed to upload image', scope: 'image' });
		}
	}
};
