# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repository.

## What this is

A self-hostable SvelteKit app for creating reusable text templates containing
`{{variable}}` placeholders, filling those variables through a form UI, and copying the
generated text.

**Stack:** SvelteKit 2 + Svelte 5 (legacy syntax) + TypeScript + Tailwind 3, on a self-hosted
Postgres database (accessed with `postgres.js` through pgBouncer), with **Better Auth**
(email/password) for authentication and **Vercel Blob** for file storage. Deployed on Vercel via
`@sveltejs/adapter-vercel`.

The app **migrated off Supabase** (see "Migration outcome" below): Supabase supplied Postgres,
auth, storage, and RLS; those are now four separate answers. The most important structural
consequence is that **authorization is enforced in server code**, not by database policies.

Two parallel domains exist and are frequently confused:

| Domain | Tables | Routes | Access |
|---|---|---|---|
| Private user templates | `categories`, `templates`, `variables` | `/templates/*`, `/categories` | Owner-only via explicit `WHERE user_id = ...` in `$lib/server/{templates,categories}.ts` |
| Public directory | `directory_categories`, `directory_templates`, `directory_variables` | `/directory/*` (read), `/admin/directory/*` (write) | Public read (`$lib/server/directory.ts`), admin write (`$lib/server/admin-directory.ts`) |

They have near-identical shapes but **separate tables, separate server modules, and separate
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

`npm run lint` **fails on a clean checkout** and is not a usable gate yet: the repo has never been
formatted, so Prettier reports many unformatted files and ESLint reports many pre-existing errors
(`no-explicit-any`, unused imports, `svelte/require-each-key`). Do not fix these opportunistically
inside an unrelated change — the reformat alone would rewrite most of the codebase and destroy
`git blame`. Check your own files with `npx prettier --check <file>` and `npx eslint <file>`
instead.

## Landmines

Read this section before touching auth, admin, or the database.

### 1. Authentication is Better Auth (server-set sessions)

Auth is [Better Auth](https://better-auth.com) with the email/password provider. There is no more
hand-rolled Supabase cookie-mirroring, no `localStorage` session, and no browser Supabase client.

- Config lives in `src/lib/server/better-auth.ts`: email/password enabled, a node-postgres (`pg`)
  `Pool` for its own storage, the `sveltekitCookies` plugin (so the session cookie is set
  **server-side**), and a `sendResetPassword` that emails through the **SMTP2GO** HTTP API.
- Better Auth **owns its own tables**: `"user"`, `"session"`, `"account"`, `"verification"`
  (quoted, camelCase columns like `"createdAt"`, `"userId"`). Generate/apply them with
  `npx @better-auth/cli generate` / `migrate` **before** applying `db/schema.sql` — the app tables
  reference `"user"(id)`.
- Better Auth's user id is **TEXT**. Every app `user_id` column and `user_profiles.id` is `TEXT`
  referencing `"user"(id)` (not a UUID, not `auth.users`).
- Its endpoints (sign-in/up/out, session, reset) are mounted at
  `src/routes/api/auth/[...all]/+server.ts` via `auth.handler`.
- `src/hooks.server.ts` resolves the session with `auth.api.getSession({ headers })` on each
  request and sets `locals.user` / `locals.session` / `locals.isAdmin`.

**`@opentelemetry/api` must stay a direct dependency.** Better Auth pulls it in transitively; if it
is not a direct dependency the tree-shaken Vercel bundle omits it and the deployed function crashes
at runtime on `trace.getTracer`. It is pinned in `package.json` `dependencies` for exactly this
reason — do not remove it.

### 2. Authorization is server-side; nothing touches the DB from the browser

There is **no RLS** and **no `supabase.from(...)` in components**. The database has no
authorization layer of its own — the server code is the entire boundary.

- All data access lives in `src/lib/server/*` (`categories.ts`, `templates.ts`, `directory.ts`,
  `profiles.ts`, `admin-directory.ts`), each querying through the single `postgres.js` client
  `sql` in `src/lib/server/db.ts`.
- Private-domain functions take the owning `userId` and filter on it explicitly
  (`WHERE ... AND user_id = ${userId}`), so ownership is enforced there, once per domain.
- Pages **load via `+page.server.ts`** and **mutate via form actions / server endpoints**. The
  browser never issues a query.
- Guards live in `src/lib/server/auth.ts`: `requireUser(locals)` (redirects to `/auth/login`) and
  `requireAdmin(locals)`. A protected load or action should start with one of these.

Consequence: a new table or domain needs a new `$lib/server/*` module with explicit ownership /
admin checks. There is no policy layer to catch a missing one — a query that forgets
`WHERE user_id = ...` silently leaks data across users.

### 3. The Postgres client, pgBouncer, and self-signed TLS

`src/lib/server/db.ts` exports `sql` = `postgres.js` reading `DATABASE_URL`. Two things are
load-bearing:

- `DATABASE_URL` is **server-only** (`$env/dynamic/private`). Never import `db.ts`, `better-auth.ts`,
  or anything under `src/lib/server/*` into a file a `.svelte` component can import — it would drag
  the connection string and service logic into the client bundle.
- The database sits **behind pgBouncer in transaction mode (port 6432)**, so prepared statements
  are disabled (`prepare: false`). Do not remove that — connections error without it.
- Two drivers hit the same database: `postgres.js` (app data) and node-postgres `Pool` (Better
  Auth).
- The lab database presents a **self-signed certificate**, so both drivers pass
  `ssl: { rejectUnauthorized: false }` (TLS stays on, CA verification is skipped). node-postgres
  additionally treats `sslmode=require` in the URL as verify-full and would reject the cert, so
  `better-auth.ts` strips `sslmode` from the URL before connecting. **Pin the CA cert for
  production** instead of skipping verification.

### 4. `APP_ENV`, not `NODE_ENV`

`hooks.server.ts` resolves the mode as `env.APP_ENV || process.env.NODE_ENV || 'production'`.
Security headers, rate limiting, and CORS all key off it — it **defaults to production (secure)**
when neither var is set, so a misconfigured deploy fails closed. `APP_ENV=production` is how you
test production security locally. Documentation or code that assumes `NODE_ENV` alone is wrong.

In development mode the security headers and rate limiting are **skipped entirely**. The
Content-Security-Policy is configured in `svelte.config.js` (`kit.csp`), not in the hook, so it
applies in all modes — but a CORS or rate-limit bug will not reproduce under `npm run dev`.

### 5. Admin access is gated server-side in two places

`user_profiles.is_admin` is the admin flag. It is written **only by server code** — the admin
users endpoint (`PATCH /api/admin/users`), which upserts the row. Bootstrap the very first admin
with a direct SQL update on `user_profiles.is_admin`. Users cannot grant themselves admin: there is
no browser DB access, so there is nothing to write the column from.

The flag is enforced at:

1. `src/hooks.server.ts` — returns `403` for any path under `/admin` or `/api/admin` when
   `locals.isAdmin` is false.
2. `src/routes/admin/+layout.server.ts` — `requireAdmin(locals)` in the layout load, redirecting
   non-admins before any admin page load runs.

The hook is the real boundary; the layout guard is defense-in-depth for loads/actions. Adding an
admin surface means considering both, and setting `is_admin` only through server code.

## Conventions

- **Svelte 5 running in legacy (Svelte 4) syntax**: `export let data`, `$:` reactive statements,
  `on:click`. Match the surrounding file. Do not introduce runes (`$state`, `$derived`) into an
  existing legacy component — mixing modes in one file is a compile error.
- **Indentation is inconsistent by file**: `src/routes/**` and `src/lib/components/**` use tabs, as
  do the `src/lib/server/*` data modules (`templates.ts`, `categories.ts`, `directory.ts`, …); but
  `src/hooks.server.ts`, `src/lib/server/db.ts`, `src/lib/server/auth.ts`,
  `src/lib/server/middleware.ts`, `src/lib/utils/logger.ts`, and `src/routes/admin/+layout.svelte`
  use 2 spaces. Follow the file you are in; `.prettierrc` governs formatting on `npm run format`.
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
  Both the `$lib/server/*` modules and the page components import these — change the syntax in one
  place. CSV import/export shares `src/lib/utils/csv.ts` similarly.

## Environment

All of the app's data/auth/storage secrets are **server-only** (no `VITE_`/public prefix):

- `DATABASE_URL` — Postgres connection string (point at the pgBouncer port).
- `BETTER_AUTH_SECRET` (32+ char random) and `BETTER_AUTH_URL` (the app's base URL).
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob store token (profile images).
- `SMTP2GO_API_KEY` and `EMAIL_FROM` — transactional email for password reset.

Plus the security/ops vars keyed off `APP_ENV`: `FORCE_HTTPS`, `ALLOWED_ORIGINS`,
`RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_MS`, and `PUBLIC_ENABLE_LOGGING`.

Note: `.env.example` still lists **stale Supabase entries** (`VITE_SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, …) at the top from the old stack. They are dead and slated for
cleanup — the real variables are the ones above.

## Migration outcome (off Supabase — done)

The migration off Supabase is **complete**; it is history, not a to-do. What replaced what:

| Was (Supabase) | Now |
|---|---|
| Postgres | Self-hosted Postgres via `postgres.js` + pgBouncer (`src/lib/server/db.ts`) |
| Auth (`auth.users`, JWTs, reset) | Better Auth, email/password (`src/lib/server/better-auth.ts`) |
| Storage (`profile_images` bucket) | Vercel Blob, private store (`src/lib/server/profiles.ts`, served via `/api/profile-image`) |
| RLS / `auth.uid()` authorization | Explicit ownership/admin checks in `src/lib/server/*` + `hooks.server.ts` |

The application schema is plain Postgres in `db/schema.sql` (no RLS; `user_id`/`user_profiles.id`
are `TEXT` referencing Better Auth's `"user"(id)`).

**Historical / dead code, pending cleanup — do not build on it:** the `supabase/` directory (old
migrations, `config.toml`), the `supabase` CLI in `devDependencies`, the stale `.env.example`
Supabase vars, and any Supabase references still lingering in `README.md`. A follow-up change will
remove them; don't reintroduce Supabase coupling.

## Known rough edges

Context, not a to-do list — do not fix these opportunistically as part of unrelated work.

- **Page components are very large**: `admin/directory/+page.svelte` and `templates/+page.svelte`
  still embed import/export, dialogs, and filtering inline, though the CSV parsing and
  `{{variable}}` logic come from shared `$lib/utils` modules and data access now lives in
  `$lib/server/*`.
- **Rate limiting is in-memory** (`Map` in `src/lib/server/middleware.ts`), so it resets on
  restart and does not hold across Vercel's serverless invocations — each cold start gets its own
  empty `Map`. Entries are swept periodically so the map stays bounded. A durable limiter (Vercel
  KV / Upstash Redis) is needed if rate limiting must actually hold.
- **`src/app.d.ts` hand-declares `$app/navigation`, `$app/stores`, and huge `svelteHTML`
  namespaces**, shadowing SvelteKit's real types. This masks type errors. Removing it is a
  standalone project. (`App.Locals` there is what types `locals.user` / `locals.session` /
  `locals.isAdmin` off Better Auth's `$Infer.Session`.)
- **Tailwind is v3 via PostCSS** (`postcss.config.cjs`, which also runs autoprefixer).
  `vite.config.ts` does not inline a `css.postcss` block (that used to override the config file and
  drop autoprefixer).
- **`@sveltejs/adapter-vercel`** is the committed deploy target. A local `npm run build` on Windows
  fails at the adapter's symlink step (`EPERM`) unless Developer Mode is on — this is local-only and
  does not affect Vercel's Linux builds. Use `npm run dev` / `npm run check` locally.

## Contributing workflow

Changes land through **pull requests** against `main` on
`github.com/dafterinc/prompt-templates`. Work on a branch; do not commit directly to `main`.
Keep a PR to one concern — a repo-wide reformat bundled with a behaviour change is unreviewable.
