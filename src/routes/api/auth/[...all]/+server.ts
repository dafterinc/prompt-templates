import { auth } from '$lib/server/better-auth';
import type { RequestHandler } from './$types';

// Better Auth's endpoints (sign-in, sign-up, sign-out, session, ...) are served here.
export const GET: RequestHandler = ({ request }) => auth.handler(request);
export const POST: RequestHandler = ({ request }) => auth.handler(request);
