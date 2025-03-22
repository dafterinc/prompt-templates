import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { applyRateLimit, forceHttps } from '$lib/server/middleware';
import { createClient } from '@supabase/supabase-js';

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
  console.log('[Server] ===== ADMIN CHECK START =====');
  console.log('[Server] Checking admin status for user:', userId);
  
  try {
    console.log('[Server] Querying user_profiles table...');
    const { data, error } = await serverSupabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
      
    if (error) {
      console.error('[Server] Error checking admin status:', error);
      console.error('[Server] Error details:', error.message, error.details, error.hint);
      return false;
    }

    // Only create admin profile for the specific admin user if it doesn't exist
    if (!data && userId === '74bcbf9c-00ea-47e3-8a96-b6d2b7e19a04') {
      console.log('[Server] Creating admin profile for user:', userId);
      const { data: newProfile, error: createError } = await serverSupabase
        .from('user_profiles')
        .insert({
          id: userId,
          is_admin: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (createError) {
        console.error('[Server] Error creating admin profile:', createError);
        return false;
      }
      
      console.log('[Server] Created admin profile:', newProfile);
      return true;
    }
    
    // For non-admin users or existing profiles, strictly check the is_admin flag
    console.log('[Server] Query result:', data);
    const isAdmin = data?.is_admin === true; // Strict equality check
    console.log('[Server] Admin status result:', isAdmin);
    console.log('[Server] ===== ADMIN CHECK END =====');
    return isAdmin;
  } catch (err) {
    console.error('[Server] Exception checking admin status:', err);
    console.error('[Server] Stack trace:', err instanceof Error ? err.stack : 'No stack trace');
    return false;
  }
}

export const handle: Handle = async ({ event, resolve }) => {
  console.log('\n[Server] ===== REQUEST START =====');
  console.log('[Server] Processing request:', event.url.pathname);
  console.log('[Server] Cookies present:', Object.fromEntries(event.cookies.getAll().map(c => [c.name, 'present'])));
  
  // Get the session from cookies
  const supabaseAuthCookie = event.cookies.get('sb-auth-token');
  const accessTokenCookie = event.cookies.get('sb-access-token');
  
  console.log('[Server] Auth cookie present:', !!supabaseAuthCookie);
  console.log('[Server] Access token cookie present:', !!accessTokenCookie);

  let user = null;
  let isAdmin = false;

  if (supabaseAuthCookie || accessTokenCookie) {
    try {
      let accessToken = null;

      if (supabaseAuthCookie) {
        try {
          const parsed = JSON.parse(supabaseAuthCookie);
          accessToken = parsed.access_token;
          console.log('[Server] Successfully parsed auth cookie');
        } catch (e) {
          console.error('[Server] Failed to parse auth cookie:', e);
        }
      }

      if (!accessToken && accessTokenCookie) {
        accessToken = accessTokenCookie;
        console.log('[Server] Using direct access token cookie');
      }

      if (accessToken) {
        console.log('[Server] Attempting to get user with token');
        const { data: { user: authUser }, error } = await serverSupabase.auth.getUser(accessToken);
        
        if (error) {
          console.error('[Server] Auth error:', error);
        } else if (authUser) {
          console.log('[Server] User authenticated:', authUser.id);
          user = authUser;
          isAdmin = await checkAdminStatus(authUser.id);
        }
      }
    } catch (err) {
      console.error('[Server] Exception processing auth:', err);
    }
  } else {
    console.log('[Server] No auth cookies found');
  }

  // Set locals regardless of auth outcome
  event.locals.user = user;
  event.locals.isAdmin = isAdmin;
  console.log('[Server] Final auth state - User:', user?.id, 'Admin:', isAdmin);

  const requestOrigin = event.request.headers.get('origin');
  const isLocalhost = event.url.hostname === 'localhost' || event.url.hostname === '127.0.0.1';
  
  // Use APP_ENV setting to allow testing production mode locally
  const envMode = env.APP_ENV || process.env.NODE_ENV || 'development';
  const isDevMode = envMode === 'development';
  
  console.log(`[Server] Running in ${envMode} mode with security ${isDevMode ? 'disabled' : 'enabled'}`);
  
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
    console.log('[Server] Checking admin route access');
    if (!event.locals.isAdmin) {
      console.log('[Server] Unauthorized admin access attempt');
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
  
  console.log('[Server] ===== REQUEST END =====\n');
  return response;
};