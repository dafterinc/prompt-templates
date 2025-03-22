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
    detectSessionInUrl: true
  }
}); 