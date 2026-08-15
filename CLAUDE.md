# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repository.

## What this is

A self-hostable SvelteKit app for creating reusable text templates containing
`{{variable}}` placeholders, filling those variables through a form UI, and copying the
generated text. Supabase provides auth, Postgres, and file storage.

Two parallel domains exist and are frequently confused:

| Domain | Tables | Routes | Access |
|---|---|---|---|
| Private user templates | `categories`, `templates`, `variables` | `/templates/*`, `/categories` | Owner-only via RLS |
| Public directory | `directory_categories`, `directory_templates`, `directory_variables` | `/directory/*` (read), `/admin/directory/*` (write) | Public read, admin write |

They have near-identical shapes but **separate tables, separate RLS policies, and separate
page components**. A change to one is not automatically a change to the other.

## Commands

```bash
npm run dev          # vite dev server on :5173
npm run build        # production build
npm run check        # svelte-kit sync && svelte-check (type checking)
npm run lint         # prettier --check . && eslint .
npm run format       # prettier --write .
npm run test:unit    # vitest
npm run test:e2e     # playwright
npm run test         # unit (once) + e2e
```

`npm run check` is the meaningful correctness gate and currently passes with **0 errors** — keep
it that way. The test suite is scaffolding only (`1 + 2 === 3`, "an h1 renders"); do not treat
green tests as evidence a change works.

`npm run lint` **fails on a clean checkout** and is not a usable gate yet: Prettier reports ~127
unformatted files (the repo has never been formatted) and ESLint reports ~178 errors, almost all
pre-existing `no-explicit-any`, unused imports, and `svelte/require-each-key`. Do not fix these
opportunistically inside an unrelated change — the reformat alone would rewrite most of the
codebase and destroy `git blame`. Check your own files with
`npx prettier --check <file>` and `npx eslint <file>` instead.

## Landmines

Read this section before touching auth, admin, or the database.

### 1. Authentication is hand-rolled, not `@supabase/ssr`

Auth is a custom cookie-mirroring flow (`@supabase/ssr` is **not** a dependency):

- The two cookie names (`sb-access-token`, `sb-auth-token`) and their max-age live in
  `src/lib/constants.ts` and are imported by both sides of the contract.
- `src/lib/supabase.ts` installs a custom `auth.storage` adapter that writes the session to
  `localStorage` *and* mirrors it into those two cookies: `sb-access-token` (raw JWT) and
  `sb-auth-token` (the full JSON session). The cookies are marked `Secure` over HTTPS.
- `src/hooks.server.ts` reads those cookies, extracts the access token, and validates it with
  `serverSupabase.auth.getUser(accessToken)` using a **service-role** client, then sets
  `locals.user` / `locals.isAdmin`. Resolved auth is cached per access token for 60s to avoid a
  round trip on every request.

Consequences:

- The cookies are set from JavaScript, so they cannot be `HttpOnly`. A full server-set session
  (the proper XSS-proof fix) is a dedicated change to the whole cookie/session path — do it all
  at once, not partially.
- The service-role key is used in the request hook on every authenticated request. Never
  import `$env/dynamic/private` or the server client into anything under `src/lib` that a
  `.svelte` file can import.

### 2. `APP_ENV`, not `NODE_ENV`

`hooks.server.ts` resolves the mode as `env.APP_ENV || process.env.NODE_ENV || 'production'`.
Security headers, rate limiting, and CORS all key off it — it now **defaults to production
(secure)** when neither var is set, so a misconfigured deploy fails closed. `APP_ENV=production`
is how you test production security locally. Documentation or code that assumes `NODE_ENV` alone
is wrong.

In development mode, the security headers and rate limiting are **skipped entirely**. The
Content-Security-Policy is configured in `svelte.config.js` (`kit.csp`), not in the hook, so it
applies in all modes — but a CORS or rate-limit bug will not reproduce under `npm run dev`.

### 3. Admin access is gated in three places

1. `src/hooks.server.ts` — returns `403` for any `/admin/*` path when `locals.isAdmin` is false.
2. `src/routes/admin/+layout.svelte` — client-side re-check that redirects to `/`.
3. RLS policies — `is_admin_user(auth.uid())` guards writes to directory tables.

Adding an admin surface means considering all three. The server hook is the real boundary; the
other two are UX and defense-in-depth.

### 4. RLS must use `is_admin_user()`, never an inline subquery

`supabase/migrations/template_directory.sql` originally wrote admin checks as
`EXISTS (SELECT 1 FROM user_profiles WHERE ...)` inside a policy **on `user_profiles`**, which
causes infinite recursion. `20250323_fix_user_profiles_policies.sql` replaced them with a
`SECURITY DEFINER` function:

```sql
USING (is_admin_user(auth.uid()))
```

Any new admin-gated policy must use that function. Reintroducing the inline `EXISTS` form will
deadlock reads on `user_profiles`.

### 5. Migration ordering (fixed — but read this before deploying an existing instance)

`template_directory.sql` had **no timestamp prefix**, so it sorted *after* the `2025xxxx_` files
even though it is the file that **creates** `user_profiles`, which
`20250322_user_profiles_update.sql` and `20250323_fix_user_profiles_policies.sql` then alter.
`supabase db push` against a clean database failed.

It has been renamed to `20250317_template_directory.sql`, so filename order is now correct:

1. `20250317_template_directory.sql`
2. `20250318_initial_schema.sql`
3. `20250322_user_profiles_update.sql`
4. `20250323_fix_user_profiles_policies.sql`

**Any deployment that already applied the file under the old name** has a stale row in
`supabase_migrations.schema_migrations`; update that row rather than re-running the migration.

New migrations must use the `YYYYMMDD_description.sql` convention.

### 6. Data access happens in the browser

Almost every page calls `supabase.from(...)` directly inside `onMount`. There is exactly one
meaningful server route: `src/routes/api/admin/users/+server.ts` (list/delete users, requires
the service role). This means **RLS is the authorization model**. A new table without policies
is either invisible or world-writable — there is no server layer to catch the mistake.

Because RLS is the whole boundary, be careful with privileged columns. `user_profiles.is_admin`
is protected by a column-level `GRANT` (see `20260815_security_and_performance.sql`):
`authenticated` may update its profile fields but **not** `is_admin`. Without that, any user
could grant themselves admin by writing their own row from the browser. Admin promotion happens
via the service-role client, which bypasses the grant.

## Conventions

- **Svelte 5 running in legacy (Svelte 4) syntax**: `export let data`, `$:` reactive statements,
  `on:click`. Match the surrounding file. Do not introduce runes (`$state`, `$derived`) into an
  existing legacy component — mixing modes in one file is a compile error.
- **Indentation is inconsistent by area**: `src/routes/**` and `src/lib/components/**` use tabs;
  `src/hooks.server.ts`, `src/lib/supabase.ts`, `src/lib/utils/logger.ts`, and
  `src/routes/admin/+layout.svelte` use 2 spaces. Follow the file you are in; `.prettierrc`
  governs formatting on `npm run format`.
- **Logging**: use `logger` from `$lib/utils/logger` (`logger.error(msg, data, context)`), not
  `console.*`. Pass a context string as the third argument (`'server'`, `'client'`,
  `'api:admin/users'`).
- **DB errors shown to users** go through `getUserFriendlyErrorMessage()` in `$lib/utils`, which
  maps Postgres unique-constraint messages to readable text. Add new mappings there.
- **UI components** come from `src/lib/components/ui/*` (shadcn-svelte over bits-ui). Import the
  barrel (`import { Button } from '$lib/components/ui/button'`) or the namespace
  (`import * as Dialog from '$lib/components/ui/dialog'`). Do not add raw bits-ui imports in
  route files.
- **Icons**: `@iconify/svelte` with Iconify names (`heroicons:arrow-path`). Iconify API hosts are
  already allowlisted in the CSP; a different icon CDN would need a CSP change.
- **Variable syntax** is `{{variable_name}}`, parsed and rendered by the shared helpers in
  `src/lib/utils/template.ts` (`extractVariableNames`, `parseTemplateContent`, `generateText`).
  All routes import these — change the syntax in one place. CSV import/export shares
  `src/lib/utils/csv.ts` similarly.

## Known rough edges

Context, not a to-do list — do not fix these opportunistically as part of unrelated work.

- **Page components are very large**: `admin/directory/+page.svelte` and `templates/+page.svelte`
  still embed import/export, dialogs, and filtering inline, though the CSV parsing and
  `{{variable}}` logic now come from shared `$lib/utils` modules.
- **Rate limiting is in-memory** (`Map` in `src/lib/server/middleware.ts`), so it resets on
  restart and does not work across multiple instances or serverless invocations. Entries are
  now swept periodically so the map stays bounded.
- **`src/app.d.ts` hand-declares `$app/navigation`, `$app/stores`, and huge `svelteHTML`
  namespaces**, shadowing SvelteKit's real types. This masks type errors. Removing it is a
  standalone project.
- **Tailwind is v3 via PostCSS** (`postcss.config.cjs`, which also runs autoprefixer). `vite.config.ts`
  no longer inlines a `css.postcss` block (that used to override the config file and drop autoprefixer).
- **`@sveltejs/adapter-vercel`** is the committed deploy target. Note: a local `npm run build`
  on Windows fails at the adapter's symlink step (`EPERM`) unless Developer Mode is on — this is
  local-only and does not affect Vercel's Linux builds. Use `npm run dev`/`npm run check` locally.

## Planned direction

### Off Supabase, onto Neon

Free-tier Supabase projects idle/pause when inactive, which makes the hosted app unreliable. The
intended replacement database is **[Neon](https://neon.tech/)** (serverless Postgres). This has
**not started** — do not begin it without an explicit request — but prefer changes that reduce
Supabase coupling over ones that deepen it.

The important thing to understand about this migration: **Neon replaces the database only.**
Supabase currently supplies three things, and the other two need separate answers:

| Supabase provides | Neon equivalent |
|---|---|
| Postgres | Neon (direct replacement; `@neondatabase/serverless` or any Postgres driver) |
| Auth (`auth.users`, JWTs, password reset) | **None** — needs Auth.js, Lucia, Better Auth, or similar |
| Storage (`profile_images` bucket) | **None** — needs S3/R2/Cloudinary/UploadThing or similar |

Two structural consequences:

- **RLS stops being the authorization boundary.** Policies depend on `auth.uid()` from Supabase's
  JWT claims. Without it, every one of the browser-side `supabase.from(...)` calls has to become a
  server route or server action that checks ownership explicitly. This is the largest part of the
  work by far — not the connection string.
- **`auth.users` foreign keys break.** `categories.user_id`, `templates.user_id`, and
  `user_profiles.id` all reference `auth.users(id)`, a table Supabase owns. A local `users` table
  has to take its place.

The coupling currently lives in:

- `src/lib/supabase.ts` (client + custom cookie storage adapter)
- `src/hooks.server.ts` (service-role client, `auth.getUser`, `user_profiles` lookup)
- `src/routes/api/admin/users/+server.ts` (`auth.admin.listUsers` / `deleteUser`)
- Every route component's inline `supabase.from(...)` calls
- `supabase/migrations/*` (RLS policies are Supabase-flavored Postgres)
- Profile image upload → the `profile_images` storage bucket (`src/routes/profile/+page.svelte`)

### Hosting

**Vercel.** `@sveltejs/adapter-vercel` is committed (the earlier Cloudflare idea is dropped). On
Vercel the app runs as serverless functions, so the in-memory rate limiter in
`src/lib/server/middleware.ts` does **not** work across invocations — each cold start gets its own
empty `Map`. A durable limiter (Vercel KV / Upstash Redis) is needed if rate limiting must hold.

## Contributing workflow

Changes land through **pull requests** against `main` on
`github.com/dafterinc/prompt-templates`. Work on a branch; do not commit directly to `main`.
Keep a PR to one concern — a repo-wide reformat bundled with a behaviour change is unreviewable.
