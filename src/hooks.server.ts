import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { applyRateLimit, forceHttps } from '$lib/server/middleware';

// Parse allowed origins from environment variable
const getAllowedOrigins = (): string[] => {
  const originsString = env.ALLOWED_ORIGINS || '';
  return originsString ? originsString.split(',') : [];
};

const allowedOrigins = getAllowedOrigins();

// Check if the origin is allowed
const isOriginAllowed = (origin: string | null): boolean => {
  if (!origin) return false;
  if (allowedOrigins.length === 0) return true; // No restrictions if no origins specified
  return allowedOrigins.includes(origin);
};

export const handle: Handle = async ({ event, resolve }) => {
  const requestOrigin = event.request.headers.get('origin');
  const isLocalhost = event.url.hostname === 'localhost' || event.url.hostname === '127.0.0.1';
  
  // Force HTTPS if enabled (in production)
  const httpsRedirect = forceHttps(event);
  if (httpsRedirect) {
    return httpsRedirect;
  }
  
  // For CORS preflight requests
  if (event.request.method === 'OPTIONS') {
    // In development, allow all origins
    const corsOrigin = isLocalhost ? '*' : (isOriginAllowed(requestOrigin) ? requestOrigin : null);
    
    if (!corsOrigin) {
      return new Response(null, { status: 403 }); // Forbidden if origin not allowed
    }
    
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '3600'
      }
    });
  }

  // Apply rate limiting for API routes
  try {
    // Only apply rate limiting to API routes
    if (event.url.pathname.startsWith('/api/')) {
      await applyRateLimit(event);
    }
  } catch (e) {
    // If it's a 429 error from our middleware, return it directly
    if (e instanceof Response && e.status === 429) {
      return e;
    }
    throw e;
  }

  const response = await resolve(event);
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://*.supabase.co;"
  );
  
  // CORS headers for non-OPTIONS requests
  if (requestOrigin) {
    if (isLocalhost) {
      // More permissive in development
      response.headers.set('Access-Control-Allow-Origin', '*');
    } else if (isOriginAllowed(requestOrigin)) {
      // Only set specific origins in production
      response.headers.set('Access-Control-Allow-Origin', requestOrigin);
    }
  }
  
  return response;
}; 