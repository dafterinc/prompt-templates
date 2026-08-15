# AGENTS.md

**[`CLAUDE.md`](CLAUDE.md) is the single source of truth for agent guidance in this repo.**
Read it before making changes. This file exists so agents that look for `AGENTS.md` by
convention find their way there, and it duplicates only the essentials.

## Stack

SvelteKit 2 + Svelte 5 (legacy syntax) · TypeScript · TailwindCSS 3 · shadcn-svelte (bits-ui) ·
Supabase (auth, Postgres, storage) · Vitest + Playwright.

## Setup

```bash
npm install
cp .env.example .env   # fill in Supabase URL, anon key, service role key
npm run dev
```

Database migrations must be applied manually and **not in filename order** — see
[README.md](README.md#3-set-up-the-database) and the migration-ordering landmine in
[`CLAUDE.md`](CLAUDE.md).

## Commands

```bash
npm run check        # type checking — the real correctness gate
npm run lint         # prettier --check . && eslint .
npm run format       # prettier --write .
npm run test:unit    # vitest
npm run test:e2e     # playwright
```

`npm run check`, `npm run lint`, and `npm run test:unit` all pass clean — keep them that way.
Coverage is still thin (the CSV module is the only well-tested unit), so green tests alone do not
mean a change works; verify in the browser too.

`npm run build` requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to be set, even though
the build never queries the database.

## Before you change anything

Five things in this codebase behave unexpectedly. All are documented in detail in
[`CLAUDE.md`](CLAUDE.md):

1. Auth is hand-rolled cookie mirroring, **not** `@supabase/ssr` (which is installed but unused).
2. Environment mode is read from `APP_ENV`, not `NODE_ENV`.
3. Admin access is gated in three separate places.
4. RLS admin checks must use the `is_admin_user()` function, never an inline `EXISTS` subquery.
5. Migration files do not apply in alphabetical order.

## Planned direction

The database is intended to move from Supabase to **[Neon](https://neon.tech/)** — free-tier
Supabase projects pause when idle. This has **not started**; do not begin it without an explicit
request, but prefer changes that reduce Supabase coupling.

Neon replaces Postgres only. Supabase Auth and Storage would both need separate replacements, and
RLS would stop being the authorization boundary — meaning the browser-side `supabase.from(...)`
calls would have to become server routes with explicit ownership checks. Details are in
[`CLAUDE.md`](CLAUDE.md#planned-direction).

Changes land through pull requests against `main`. Work on a branch; do not commit to `main`
directly.

## House style

Match the file you are editing — indentation varies by directory (tabs in `src/routes`, 2 spaces
in parts of `src/lib`). Use `logger` from `$lib/utils/logger` rather than `console`. Use existing
UI components from `src/lib/components/ui/`. Do not introduce Svelte 5 runes into legacy-syntax
components.
