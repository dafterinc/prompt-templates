import { createClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';

// Use environment variables for Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check for required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase credentials. Please set the following environment variables:',
    '\n- VITE_SUPABASE_URL: Your Supabase project URL',
    '\n- VITE_SUPABASE_ANON_KEY: Your Supabase anonymous key'
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
            // Set both cookie formats for compatibility
            const session = JSON.parse(value);
            document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=28800; SameSite=Lax`;
            document.cookie = `sb-auth-token=${value}; path=/; max-age=28800; SameSite=Lax`;
          }
          return value;
        }
        return null;
      },
      setItem: (key, value) => {
        if (browser) {
          localStorage.setItem(key, value);
          // Set both cookie formats for compatibility
          const session = JSON.parse(value);
          document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=28800; SameSite=Lax`;
          document.cookie = `sb-auth-token=${value}; path=/; max-age=28800; SameSite=Lax`;
        }
      },
      removeItem: (key) => {
        if (browser) {
          localStorage.removeItem(key);
          // Remove both cookie formats
          document.cookie = `sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
          document.cookie = `sb-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
        }
      }
    }
  }
}); 