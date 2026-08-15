import { env } from '$env/dynamic/private';
import postgres from 'postgres';

// Postgres client for the migration off Supabase (Phase 2).
//
// The connection string is read from DATABASE_URL, which is SERVER-ONLY ($env/dynamic/private) —
// it must never be exposed to the browser bundle (no VITE_/public prefix).
//
// The database sits behind pgBouncer in transaction mode (port 6432), so prepared statements MUST
// be disabled (`prepare: false`) or connections will error. SSL is taken from the connection
// string's sslmode=require.
//
// NOTE: this client is not yet wired into the data-access modules. They still use
// $lib/server/supabase.ts until each is ported over to SQL in Phase 2.
export const sql = postgres(env.DATABASE_URL || '', {
  prepare: false,
  // The lab database presents a self-signed certificate; keep TLS but skip CA verification.
  // For production, pin the CA cert instead.
  ssl: { rejectUnauthorized: false }
});
