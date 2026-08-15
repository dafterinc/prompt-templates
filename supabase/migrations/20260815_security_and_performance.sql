-- Security and performance hardening.
--
-- 1. Privilege-escalation fix: the "Users can update their own profile" policy on
--    user_profiles gates only on row ownership (auth.uid() = id) and never restricts
--    which columns change. Because every page writes user_profiles directly from the
--    browser with the anon key (RLS is the whole authorization model), any authenticated
--    user could run `update({ is_admin: true }).eq('id', <their id>)` and become an admin.
--    Column-level privileges close this: authenticated keeps UPDATE on the profile fields
--    it legitimately edits, but loses UPDATE on is_admin. The service_role client used by
--    hooks.server.ts and the admin API bypasses these grants, so admin provisioning still
--    works. RLS continues to enforce row ownership.
-- 2. is_admin_user() is pinned to a fixed search_path (SECURITY DEFINER hardening).
-- 3. Indexes for the private-domain columns every query filters/orders on.

BEGIN;

-- 1. Restrict which user_profiles columns authenticated users may update.
REVOKE UPDATE ON public.user_profiles FROM authenticated;
GRANT UPDATE (
  full_name,
  profile_image_url,
  company_name,
  industry,
  company_website,
  team_size,
  usage_purpose,
  updated_at
) ON public.user_profiles TO authenticated;

-- Anonymous users never write profiles.
REVOKE UPDATE, INSERT, DELETE ON public.user_profiles FROM anon;

-- 2. Pin the SECURITY DEFINER admin-check function's search_path.
ALTER FUNCTION public.is_admin_user(UUID) SET search_path = public, pg_temp;

-- 3. Indexes on the columns RLS, filtering and ordering use on the private tables.
--    (variables.template_id is already covered by the UNIQUE (template_id, name) index.)
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates (user_id);
CREATE INDEX IF NOT EXISTS idx_templates_category_id ON public.templates (category_id);
CREATE INDEX IF NOT EXISTS idx_templates_updated_at ON public.templates (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories (user_id);

COMMIT;
