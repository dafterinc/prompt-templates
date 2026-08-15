import { createClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';
import { logger } from '$lib/utils/logger';
import { ACCESS_TOKEN_COOKIE, AUTH_TOKEN_COOKIE, AUTH_COOKIE_MAX_AGE } from '$lib/constants';

// Mirror the Supabase session into the two cookies hooks.server.ts reads. document.cookie cannot
// set HttpOnly (that needs a server-set cookie / the full @supabase/ssr flow — see CLAUDE.md
// Landmine #1), but we can at least mark them Secure over HTTPS so tokens are never sent in
// cleartext. On http://localhost during development the Secure flag is omitted so login still works.
function writeSessionCookies(rawSession: string, accessToken: string | undefined) {
  const secure = browser && window.location.protocol === 'https:' ? ' Secure;' : '';
  const attrs = `path=/; max-age=${AUTH_COOKIE_MAX_AGE}; SameSite=Lax;${secure}`;
  if (accessToken) {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=${accessToken}; ${attrs}`;
  }
  document.cookie = `${AUTH_TOKEN_COOKIE}=${rawSession}; ${attrs}`;
}

function clearSessionCookies() {
  const expires = 'path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; ${expires}`;
  document.cookie = `${AUTH_TOKEN_COOKIE}=; ${expires}`;
}

/** Best-effort parse of the stored session; returns null instead of throwing on corruption. */
function safeParseSession(value: string): { access_token?: string } | null {
  try {
    return JSON.parse(value);
  } catch (e) {
    logger.error('Failed to parse stored session', e, 'supabase');
    return null;
  }
}

// Use environment variables for Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check for required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  logger.error(
    'Missing Supabase credentials. Please set the following environment variables:',
    {
      missing: {
        VITE_SUPABASE_URL: !supabaseUrl,
        VITE_SUPABASE_ANON_KEY: !supabaseAnonKey
      }
    },
    'supabase'
  );
}

// Create the Supabase client with browser-safe configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => {
        if (browser) {
          const value = localStorage.getItem(key);
          if (value) {
            const session = safeParseSession(value);
            writeSessionCookies(value, session?.access_token);
          }
          return value;
        }
        return null;
      },
      setItem: (key, value) => {
        if (browser) {
          localStorage.setItem(key, value);
          const session = safeParseSession(value);
          writeSessionCookies(value, session?.access_token);
        }
      },
      removeItem: (key) => {
        if (browser) {
          localStorage.removeItem(key);
          clearSessionCookies();
        }
      }
    }
  }
}); 