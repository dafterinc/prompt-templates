-- Application schema for plain Postgres (Phase 2 migration off Supabase).
--
-- IMPORTANT ordering: run Better Auth's schema generation FIRST so the "user" table exists, then
-- run this file:
--   1) npx @better-auth/cli@latest generate   (creates user/session/account/verification)
--      then apply that output to the database (or `npx @better-auth/cli@latest migrate`).
--   2) psql "$DATABASE_URL" -f db/schema.sql
--
-- Differences from the Supabase schema:
--   * No RLS / no auth.uid() — authorization is enforced server-side in $lib/server/*.
--   * user_id / user_profiles.id are TEXT and reference Better Auth's "user"(id), not auth.users.
--   * is_admin is a plain column; only server code (requireAdmin + the admin API) writes it.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

-- Shared updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---- Private user domain ----

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (name, user_id)
);

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'text',
  default_value TEXT,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (template_id, name)
);

CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates (user_id);
CREATE INDEX IF NOT EXISTS idx_templates_category_id ON templates (category_id);
CREATE INDEX IF NOT EXISTS idx_templates_updated_at ON templates (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories (user_id);

-- ---- Public directory domain ----

CREATE TABLE IF NOT EXISTS directory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS directory_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category_id UUID REFERENCES directory_categories(id) ON DELETE SET NULL,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS directory_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES directory_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'text',
  default_value TEXT,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_directory_templates_category_id ON directory_templates (category_id);
CREATE INDEX IF NOT EXISTS idx_directory_templates_featured ON directory_templates (featured);
CREATE INDEX IF NOT EXISTS idx_directory_variables_template_id ON directory_variables (template_id);

-- ---- Profiles ----

CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  full_name TEXT,
  profile_image_url TEXT,
  company_name TEXT,
  industry TEXT,
  company_website TEXT,
  team_size TEXT,
  usage_purpose TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at triggers
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_variables_updated_at BEFORE UPDATE ON variables
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_directory_categories_updated_at BEFORE UPDATE ON directory_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_directory_templates_updated_at BEFORE UPDATE ON directory_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_directory_variables_updated_at BEFORE UPDATE ON directory_variables
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
