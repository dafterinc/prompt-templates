# Contributing

Thanks for your interest in Prompt Templates. Issues and pull requests are welcome.

## Getting set up

```bash
git clone https://github.com/dafterinc/prompt-templates.git
cd prompt-templates
npm install
cp .env.example .env    # fill in your Supabase credentials
npm run dev
```

You need your own Supabase project to run the app — see
[Quick start](README.md#-quick-start) in the README, and apply the migrations in the order given
there (they are **not** alphabetical).

## Before you write code

Read [`CLAUDE.md`](CLAUDE.md). It documents the parts of this codebase that behave unexpectedly —
hand-rolled cookie auth rather than `@supabase/ssr`, `APP_ENV` instead of `NODE_ENV`, admin
gating in three separate places, the RLS recursion trap, and migration ordering. Most review
comments on a first PR would otherwise be about one of those.

## Workflow

1. Fork the repository and branch off `main`: `git checkout -b feature/your-change`
2. Make your change, matching the conventions of the file you are editing
3. Verify with `npm run check` — it currently passes with zero errors, so any error you see is
   yours
4. Check the files you touched:
   ```bash
   npx prettier --check <your files>
   npx eslint <your files>
   ```
5. Commit with a descriptive message and open a pull request against `main`

> `npm run lint` across the whole repo currently fails: the codebase has never been
> Prettier-formatted (~127 files) and ESLint reports ~178 pre-existing errors. Cleaning that up
> is worthwhile, but as its own dedicated pull request — please don't bundle a repo-wide reformat
> with a behaviour change.

Please keep pull requests focused. A change that fixes a bug plus reformats a 1000-line component
is very hard to review.

## Conventions

- **Svelte 5 in legacy syntax.** Components use `export let`, `$:`, and `on:click`. Do not
  introduce runes (`$state`, `$derived`) into an existing component — mixing modes in one file is
  a compile error.
- **Indentation varies by directory.** Tabs in `src/routes/**` and `src/lib/components/**`,
  two spaces in parts of `src/lib`. Match the file you are in; `npm run format` handles the rest.
- **Use `logger`** from `$lib/utils/logger` rather than `console.*`.
- **User-facing database errors** go through `getUserFriendlyErrorMessage()` in `$lib/utils`.
- **UI components** come from `src/lib/components/ui/`. Do not import bits-ui directly in routes.
- **New tables need RLS policies.** Data access happens from the browser, so RLS is the actual
  authorization boundary. Admin checks in policies must use `is_admin_user(auth.uid())`, never an
  inline `EXISTS` subquery against `user_profiles` — that causes infinite recursion.
- **New migrations** use the `YYYYMMDD_description.sql` naming convention.

## Testing

The current suite is scaffolding — a trivial unit test and one smoke check each for Vitest and
Playwright. `npm run check` (svelte-check) is the meaningful correctness gate today.

Tests for new behaviour are very welcome. Unit tests live beside the code as `*.spec.ts` or
`*.test.ts`; end-to-end tests live in `e2e/`.

## Security

Please do not open a public issue for a security vulnerability. Report it privately to
[Dafter Inc.](https://dafterinc.com) instead.

Never commit a `.env` file or a Supabase service role key — that key bypasses Row Level Security
entirely.

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE).
