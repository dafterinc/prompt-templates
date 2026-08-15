// Shared constants for the hand-rolled auth transport.
//
// The client session adapter (src/lib/supabase.ts) mirrors the Supabase session into these
// cookies, and hooks.server.ts reads them to resolve locals.user / locals.isAdmin. Both sides
// MUST agree on these names — importing them from one place keeps that contract from silently
// drifting. See CLAUDE.md "Landmine #1".
export const ACCESS_TOKEN_COOKIE = 'sb-access-token';
export const AUTH_TOKEN_COOKIE = 'sb-auth-token';

// Cookie lifetime, in seconds (8 hours).
export const AUTH_COOKIE_MAX_AGE = 28800;
