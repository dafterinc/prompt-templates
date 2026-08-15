import { error } from '@sveltejs/kit';
import { get } from '@vercel/blob';
import { env } from '$env/dynamic/private';
import { requireUser } from '$lib/server/auth';
import { getProfileImageUrl } from '$lib/server/profiles';
import type { RequestHandler } from './$types';

// Streams the signed-in user's profile image out of the PRIVATE Blob store. Because the store is
// private, the raw blob URL is not browser-accessible — the avatar's <img src> points here instead.
export const GET: RequestHandler = async ({ locals }) => {
	const user = requireUser(locals);
	const stored = await getProfileImageUrl(user.id);
	if (!stored) throw error(404, 'No image');

	const pathname = new URL(stored).pathname.replace(/^\//, '');
	const result = await get(pathname, { access: 'private', token: env.BLOB_READ_WRITE_TOKEN });
	if (!result || result.statusCode !== 200 || !result.stream) {
		throw error(404, 'Not found');
	}

	return new Response(result.stream, {
		headers: {
			'Content-Type': result.blob.contentType,
			'X-Content-Type-Options': 'nosniff',
			'Cache-Control': 'private, no-cache'
		}
	});
};
