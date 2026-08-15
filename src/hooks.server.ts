import type { Handle, RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { applyRateLimit, forceHttps } from '$lib/server/middleware';
import { logger } from '$lib/utils/logger';
import { auth } from '$lib/server/better-auth';
import { sql } from '$lib/server/db';

// Resolve the user's admin flag from user_profiles, provisioning the row on first sight.
async function resolveIsAdmin(userId: string): Promise<boolean> {
  try {
    const rows = await sql<{ is_admin: boolean }[]>`
      SELECT is_admin FROM user_profiles WHERE id = ${userId}`;
    if (rows.length === 0) {
      await sql`INSERT INTO user_profiles (id) VALUES (${userId}) ON CONFLICT (id) DO NOTHING`;
      return false;
    }
    return rows[0].is_admin === true;
  } catch (err) {
    logger.error('Error resolving admin status', err, 'server');
    return false;
  }
}

// Single cross-origin value for both the preflight and the actual response.
function resolveAllowedOrigin(origin: string | null, isDevMode: boolean): string | null {
  if (!origin) return null;
  if (isDevMode) return origin;
  const allowed = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return allowed.includes(origin) ? origin : null;
}

export const handle: Handle = async ({ event, resolve }) => {
  // Secure by default: only an explicit 'development' mode disables the controls below.
  const envMode = env.APP_ENV || process.env.NODE_ENV || 'production';
  const isDevMode = envMode === 'development';

  // Force HTTPS (in production) before any per-request work.
  const httpsRedirect = forceHttps(event);
  if (httpsRedirect) {
    return httpsRedirect;
  }

  const requestOrigin = event.request.headers.get('origin');
  const allowedOrigin = resolveAllowedOrigin(requestOrigin, isDevMode);

  // Answer CORS preflight before resolving the session or invoking the app.
  if (event.request.method === 'OPTIONS') {
    const headers: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    if (allowedOrigin) {
      headers['Access-Control-Allow-Origin'] = allowedOrigin;
      headers['Access-Control-Allow-Credentials'] = 'true';
      headers['Vary'] = 'Origin';
    }
    return new Response(null, { headers });
  }

  // Resolve the Better Auth session from the request cookies.
  let user: (RequestEvent['locals']['user']) = null;
  let session: (RequestEvent['locals']['session']) = null;
  let isAdmin = false;
  try {
    const result = await auth.api.getSession({ headers: event.request.headers });
    if (result) {
      user = result.user;
      session = result.session;
      isAdmin = await resolveIsAdmin(result.user.id);
    }
  } catch (err) {
    logger.error('Exception resolving session', err, 'server');
  }
  event.locals.user = user;
  event.locals.session = session;
  event.locals.isAdmin = isAdmin;

  // Rate limit API routes in production. applyRateLimit throws error(429) which SvelteKit renders.
  if (!isDevMode && event.url.pathname.startsWith('/api/')) {
    await applyRateLimit(event);
  }

  // Server boundary for admin surfaces.
  if (event.url.pathname.startsWith('/admin') || event.url.pathname.startsWith('/api/admin')) {
    if (!event.locals.isAdmin) {
      return new Response('Unauthorized', { status: 403 });
    }
  }

  const response = await resolve(event);

  // Security headers (CSP is configured in svelte.config.js kit.csp).
  if (!isDevMode) {
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  }

  // CORS headers for the actual (non-preflight) response.
  if (allowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.append('Vary', 'Origin');
  }

  return response;
};
