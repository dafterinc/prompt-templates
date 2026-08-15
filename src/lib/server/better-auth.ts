import { betterAuth } from 'better-auth';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { Pool } from 'pg';
import { env } from '$env/dynamic/private';

// Better Auth replaces Supabase Auth in Phase 2. It owns the user/session/account/verification
// tables and uses node-postgres (Kysely under the hood). The app's own data still uses postgres.js
// ($lib/server/db.ts); both talk to the same database through pgBouncer.
//
// Env: BETTER_AUTH_SECRET (32+ char random), BETTER_AUTH_URL (the app's base URL), DATABASE_URL.
//
// NOTE: not yet wired into hooks.server.ts — the auth cutover is a separate step. Generate the
// schema with `npx @better-auth/cli@latest generate` before first use.
export const auth = betterAuth({
	database: new Pool({ connectionString: env.DATABASE_URL }),
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	emailAndPassword: {
		enabled: true
	},
	plugins: [sveltekitCookies(getRequestEvent)]
});
