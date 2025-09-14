import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { applyRateLimit, forceHttps } from '$lib/server/middleware';
import { createClient } from '@supabase/supabase-js';
import { logger } from '$lib/utils/logger';

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

// Helper function to check admin status
async function checkAdminStatus(userId: string) {
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

    // If no profile exists, create one with default non-admin status
    if (!data) {
      const { error: createError } = await serverSupabase
        .from('user_profiles')
        .insert({
          id: userId,
          is_admin: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (createError) {
        logger.error('Error creating user profile', createError, 'server');
      }
      return false;
    }
    
    // Strictly check the is_admin flag
    return data.is_admin === true;
  } catch (err) {
    logger.error('Exception checking admin status', err, 'server');
    return false;
  }
}

export const handle: Handle = async ({ event, resolve }) => {
  // Get the session from cookies
  const supabaseAuthCookie = event.cookies.get('sb-auth-token');
  const accessTokenCookie = event.cookies.get('sb-access-token');

  let user = null;
  let isAdmin = false;

  if (supabaseAuthCookie || accessTokenCookie) {
    try {
      let accessToken = null;

      if (supabaseAuthCookie) {
        try {
          const parsed = JSON.parse(supabaseAuthCookie);
          accessToken = parsed.access_token;
        } catch (e) {
          logger.error('Failed to parse auth cookie', e, 'server');
        }
      }

      if (!accessToken && accessTokenCookie) {
        accessToken = accessTokenCookie;
      }

      if (accessToken) {
        const { data: { user: authUser }, error } = await serverSupabase.auth.getUser(accessToken);
        
        if (error) {
          logger.error('Auth error', error, 'server');
        } else if (authUser) {
          user = authUser;
          isAdmin = await checkAdminStatus(authUser.id);
        }
      }
    } catch (err) {
      logger.error('Exception processing auth', err, 'server');
    }
  }

  // Set locals regardless of auth outcome
  event.locals.user = user;
  event.locals.isAdmin = isAdmin;

  const requestOrigin = event.request.headers.get('origin');
  const isLocalhost = event.url.hostname === 'localhost' || event.url.hostname === '127.0.0.1';
  
  // Use APP_ENV setting to allow testing production mode locally
  const envMode = env.APP_ENV || process.env.NODE_ENV || 'development';
  const isDevMode = envMode === 'development';
  
  // Force HTTPS if enabled (in production mode)
  const httpsRedirect = forceHttps(event);
  if (httpsRedirect) {
    return httpsRedirect;
  }
  
  // For CORS preflight requests
  if (event.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      }
    });
  }

  // Apply rate limiting for API routes in production mode
  if (!isDevMode) {
    try {
      if (event.url.pathname.startsWith('/api/')) {
        await applyRateLimit(event);
      }
    } catch (e) {
      if (e instanceof Response && e.status === 429) {
        return e;
      }
      throw e;
    }
  }

  // Check for protected admin routes
  if (event.url.pathname.startsWith('/admin')) {
    if (!event.locals.isAdmin) {
      return new Response('Unauthorized', { status: 403 });
    }
  }

  const response = await resolve(event);
  
  // Skip security headers in development mode
  if (!isDevMode) {
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    if (isLocalhost) {
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; " +
        "connect-src 'self' http://*.supabase.co https://*.supabase.co https://api.iconify.design https://api.simplesvg.com https://api.unisvg.com " +
        "ws://localhost:* wss://localhost:* ws://127.0.0.1:* wss://127.0.0.1:* http://localhost:* https://localhost:* http://127.0.0.1:* https://127.0.0.1:*;"
      );
    } else {
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; " +
        "connect-src 'self' http://*.supabase.co https://*.supabase.co https://api.iconify.design https://api.simplesvg.com https://api.unisvg.com;"
      );
    }
  }
  
  // CORS headers for non-OPTIONS requests
  if (requestOrigin) {
    if (isDevMode) {
      response.headers.set('Access-Control-Allow-Origin', '*');
    } else {
      const allowedOrigins = (env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim());
      if (allowedOrigins.includes(requestOrigin)) {
        response.headers.set('Access-Control-Allow-Origin', requestOrigin);
      }
    }
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  return response;
};