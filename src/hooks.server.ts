import type { Handle, RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { applyRateLimit, forceHttps } from '$lib/server/middleware';
import { createClient } from '@supabase/supabase-js';
import { logger } from '$lib/utils/logger';
import { ACCESS_TOKEN_COOKIE, AUTH_TOKEN_COOKIE } from '$lib/constants';

// Create a server-side only Supabase client with service role key
const serverSupabase = createClient(
  env.VITE_SUPABASE_URL || '',
  env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || '', // Fallback to anon key if service role key not available
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Short-lived per-token cache so repeated requests from the same session don't each pay a
// getUser() + user_profiles round trip. Admin/identity changes take effect within the TTL.
interface AuthEntry {
  user: RequestEvent['locals']['user'];
  isAdmin: boolean;
  expires: number;
}
const authCache = new Map<string, AuthEntry>();
const AUTH_CACHE_TTL_MS = 60_000;

// Helper function to check admin status
async function checkAdminStatus(userId: string): Promise<boolean> {
  try {
    const { data, error } = await serverSupabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      logger.error('Error checking admin status', error, 'server');
      return false;
    }

    // Strictly check the is_admin flag. A missing profile row means "not admin"; the row is
    // provisioned when the user first visits their profile, not on every request.
    return data?.is_admin === true;
  } catch (err) {
    logger.error('Exception checking admin status', err, 'server');
    return false;
  }
}

async function resolveAuth(accessToken: string): Promise<{ user: AuthEntry['user']; isAdmin: boolean }> {
  const now = Date.now();
  const cached = authCache.get(accessToken);
  if (cached && cached.expires > now) {
    return { user: cached.user, isAdmin: cached.isAdmin };
  }

  let user: AuthEntry['user'] = null;
  let isAdmin = false;

  const { data: { user: authUser }, error } = await serverSupabase.auth.getUser(accessToken);
  if (error) {
    logger.error('Auth error', error, 'server');
  } else if (authUser) {
    user = authUser;
    isAdmin = await checkAdminStatus(authUser.id);
  }

  authCache.set(accessToken, { user, isAdmin, expires: now + AUTH_CACHE_TTL_MS });

  // Opportunistic eviction so the cache cannot grow without bound.
  if (authCache.size > 1000) {
    for (const [token, entry] of authCache) {
      if (entry.expires <= now) authCache.delete(token);
    }
  }

  return { user, isAdmin };
}

function getAccessToken(event: RequestEvent): string | null {
  const authCookie = event.cookies.get(AUTH_TOKEN_COOKIE);
  if (authCookie) {
    try {
      const parsed = JSON.parse(authCookie);
      if (parsed?.access_token) return parsed.access_token;
    } catch (e) {
      logger.error('Failed to parse auth cookie', e, 'server');
    }
  }
  return event.cookies.get(ACCESS_TOKEN_COOKIE) ?? null;
}

// Resolve the single cross-origin value used for both the preflight and the actual response.
// In development the request origin is reflected; in production only configured origins are allowed.
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
  // Secure by default: only an explicit 'development' mode disables the security controls below.
  const envMode = env.APP_ENV || process.env.NODE_ENV || 'production';
  const isDevMode = envMode === 'development';

  // Force HTTPS (in production mode) before doing any per-request work.
  const httpsRedirect = forceHttps(event);
  if (httpsRedirect) {
    return httpsRedirect;
  }

  const requestOrigin = event.request.headers.get('origin');
  const allowedOrigin = resolveAllowedOrigin(requestOrigin, isDevMode);

  // Answer CORS preflight before resolving auth or invoking the app.
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

  // Resolve the session from cookies (cached per access token).
  let user: AuthEntry['user'] = null;
  let isAdmin = false;
  const accessToken = getAccessToken(event);
  if (accessToken) {
    try {
      const resolved = await resolveAuth(accessToken);
      user = resolved.user;
      isAdmin = resolved.isAdmin;
    } catch (err) {
      logger.error('Exception processing auth', err, 'server');
    }
  }
  event.locals.user = user;
  event.locals.isAdmin = isAdmin;

  // Apply rate limiting for API routes in production mode. applyRateLimit throws error(429),
  // which SvelteKit renders as a 429 response.
  if (!isDevMode && event.url.pathname.startsWith('/api/')) {
    await applyRateLimit(event);
  }

  // Server boundary for admin surfaces — covers both the admin pages and the admin API.
  if (event.url.pathname.startsWith('/admin') || event.url.pathname.startsWith('/api/admin')) {
    if (!event.locals.isAdmin) {
      return new Response('Unauthorized', { status: 403 });
    }
  }

  const response = await resolve(event);

  // Security headers (Content-Security-Policy is configured in svelte.config.js kit.csp).
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
