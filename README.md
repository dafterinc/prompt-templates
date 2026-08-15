# ✨ Prompt Templates

A self-hostable web application for building, managing, and generating text prompts with
customizable variables. Write a template once with `{{placeholders}}`, then fill them in through
a form whenever you need the text — useful for writers, marketers, developers, support teams, and
anyone who retypes the same structured text.

## 🚀 Features

### Templates

- ✏️ Create, edit, duplicate, and delete prompt templates
- 🔄 `{{variable}}` placeholders with description, type, default value, and required flag
- 🎯 Fill-in-the-blank interface that renders the finished text live
- 📋 One-click copy to clipboard
- 🏷️ Organize templates into personal categories
- 🔍 Search and multi-category filtering
- 📥 CSV import / export of your template library

### Public directory

- 🌐 Browse a shared, publicly readable directory of templates — no account required
- ⭐ Featured templates surfaced first
- 📄 Use any directory template directly, or save a copy into your own library
- 🛠️ Admin CRUD for directory templates, categories, and variables
- 📊 Bulk CSV import / export for the directory, with per-row progress and error reporting

### Accounts and admin

- 🔒 Email/password authentication via Supabase Auth
- 👤 User profiles with avatar upload, company, industry, team size, and usage purpose
- 👑 Admin dashboard: manage the directory, list users, and delete users with their content
- 🔐 Row Level Security enforced at the database level

### Experience

- 🌓 Dark / light mode with persisted preference
- 📱 Responsive layout for desktop, tablet, and mobile
- 🎨 Clean UI built on shadcn-svelte components

## 🛠️ Technology stack

### Frontend

- **[SvelteKit 2](https://kit.svelte.dev/)** with **[Svelte 5](https://svelte.dev/)** (legacy syntax)
- **[TypeScript](https://www.typescriptlang.org/)**
- **[TailwindCSS 3](https://tailwindcss.com/)**
- **[shadcn-svelte](https://shadcn-svelte.com/)** over [bits-ui](https://bits-ui.com/)
- **[Iconify](https://iconify.design/)** for icons, **[svelte-sonner](https://svelte-sonner.vercel.app/)** for toasts

### Backend

- **[Supabase](https://supabase.com/)** — Auth, Postgres, Storage
- **[PostgreSQL](https://postgresql.org/)** with [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- **[Vite 6](https://vitejs.dev/)**

### Tooling

- **[ESLint](https://eslint.org/)** + **[Prettier](https://prettier.io/)**
- **[Vitest](https://vitest.dev/)** (unit) and **[Playwright](https://playwright.dev/)** (e2e)

## 📁 Project structure

```
prompt-templates/
├── src/
│   ├── lib/
│   │   ├── components/ui/          # shadcn-svelte components (button, dialog, drawer, …)
│   │   ├── server/
│   │   │   └── middleware.ts       # rate limiting, HTTPS forcing
│   │   ├── utils/
│   │   │   └── logger.ts           # leveled logger used across the app
│   │   ├── supabase.ts             # browser Supabase client + cookie-mirroring session storage
│   │   └── utils.ts                # cn(), transitions, friendly DB error messages
│   ├── routes/
│   │   ├── admin/                  # admin dashboard (users, directory management)
│   │   ├── api/admin/users/        # server route: list / delete users (service role)
│   │   ├── auth/                   # login, register, forgot / reset password
│   │   ├── categories/             # personal category management
│   │   ├── directory/              # public template directory
│   │   ├── profile/                # profile + avatar upload
│   │   ├── templates/              # private template CRUD and usage
│   │   ├── +layout.svelte          # shell: nav, auth state, theme
│   │   ├── +layout.server.ts       # exposes locals.user / locals.isAdmin
│   │   └── +page.svelte            # landing page
│   ├── app.css                     # global styles and theme tokens
│   ├── app.d.ts                    # App.Locals / App.PageData declarations
│   ├── app.html                    # HTML shell
│   └── hooks.server.ts             # auth, admin gate, CORS, CSP, rate limiting
├── static/                         # favicon, og-image
├── supabase/
│   ├── migrations/                 # SQL schema and RLS policies
│   └── config.toml                 # Supabase local dev config
├── e2e/                            # Playwright tests
├── .env.example
├── components.json                 # shadcn-svelte config
├── svelte.config.js                # SvelteKit config (adapter-auto)
├── tailwind.config.js
└── vite.config.ts                  # Vite + Vitest config
```

Agent-facing engineering notes live in [`CLAUDE.md`](CLAUDE.md) and [`AGENTS.md`](AGENTS.md).

## 💻 Quick start

### Prerequisites

- **Node.js** 18+ and npm
- A **Supabase** project (the free tier is enough)
- **Git**

### 1. Clone and install

```bash
git clone https://github.com/dafterinc/prompt-templates.git
cd prompt-templates
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in your Supabase credentials (**Settings → API** in the Supabase dashboard):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 'development' or 'production' — controls security headers, CSP, CORS, rate limiting
APP_ENV=development
```

> The service role key bypasses Row Level Security. It is used only on the server
> (`src/hooks.server.ts` and `src/routes/api/admin/users/+server.ts`). Never expose it to the
> browser and never commit your `.env`.

### 3. Set up the database

Tables are **not** created automatically. Apply the migrations in `supabase/migrations/` in
filename order, either with `supabase db push` or by pasting them into the **SQL Editor** in the
Supabase dashboard:

1. `20250317_template_directory.sql` — directory tables, `user_profiles`, timestamp triggers
2. `20250318_initial_schema.sql` — `categories`, `templates`, `variables` + owner RLS
3. `20250322_user_profiles_update.sql` — profile fields, `profile_images` storage bucket
4. `20250323_fix_user_profiles_policies.sql` — `is_admin_user()` and non-recursive policies

> ⚠️ **Upgrading an existing deployment:** `20250317_template_directory.sql` was previously named
> `template_directory.sql`, which sorted _after_ the timestamped files and broke fresh installs.
> If your database already applied it under the old name, update the matching row in
> `supabase_migrations.schema_migrations` instead of re-running the migration.

### 4. Create an admin user

Register through the app first, then promote the account:

```sql
UPDATE user_profiles
SET is_admin = true
WHERE id = 'your-user-id-here';
```

You can find the id under **Authentication → Users** in the Supabase dashboard. Admin routes are
blocked server-side, so this must be set before `/admin` becomes reachable.

### 5. Run it

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## 🚀 Self-hosting

The project ships with `@sveltejs/adapter-auto`, which detects the target automatically on Vercel,
Netlify, and Cloudflare. For any other host — Docker, a VPS, bare Node — install and configure
`@sveltejs/adapter-node` first:

```bash
npm install -D @sveltejs/adapter-node
```

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-node';
```

`npm run build` then emits a Node server at `build/index.js`, run with `node build`.

### Option 1: Vercel / Netlify / Cloudflare

1. Connect the repository
2. Set the environment variables in the dashboard
3. Deploy — `adapter-auto` detects the platform

> On any serverless or multi-instance platform, the built-in rate limiter does nothing useful —
> it is an in-process `Map`. Put platform-level rate limiting in front instead.

### Option 2: Docker (requires `adapter-node`)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev
EXPOSE 3000
ENV PORT=3000
CMD ["node", "build"]
```

```bash
docker build -t prompt-templates .
docker run -p 3000:3000 --env-file .env prompt-templates
```

### Option 3: VPS with PM2 (requires `adapter-node`)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

git clone https://github.com/dafterinc/prompt-templates.git
cd prompt-templates
npm ci
npm run build
pm2 start build/index.js --name prompt-templates
pm2 save && pm2 startup
```

### Production environment

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

APP_ENV=production
FORCE_HTTPS=true
ALLOWED_ORIGINS=https://yourdomain.com

RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=60000
```

Security headers, CSP, CORS allowlisting, and rate limiting are **only active when
`APP_ENV` is not `development`**. Set `APP_ENV=production` locally to test them before shipping.

### Security notes

- ✅ HTTPS enforced via `FORCE_HTTPS` (skipped on localhost)
- ✅ CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` set in production mode
- ✅ CORS restricted to `ALLOWED_ORIGINS` in production; wide open in development
- ✅ Row Level Security on every application table
- ⚠️ Rate limiting is **in-memory per process** — it resets on restart and does not coordinate
  across instances. Put a proper limiter (reverse proxy, WAF, or Redis-backed) in front of any
  multi-instance or serverless deployment.

## 🏗️ Development

### Scripts

```bash
npm run dev          # dev server
npm run build        # production build
npm run preview      # preview the production build (port 4173)
npm run check        # type checking with svelte-check
npm run check:watch  # type checking in watch mode

npm run lint         # prettier --check . && eslint .
npm run format       # prettier --write .

npm run test:unit    # vitest
npm run test:e2e     # playwright
npm run test         # unit (single run) + e2e
```

> The current test suite is scaffolding only — a trivial arithmetic test, a smoke render, and one
> Playwright check. `npm run check` is the meaningful pre-commit gate.

### How the pieces fit together

**Authentication.** `src/lib/supabase.ts` installs a custom session storage adapter that writes
the Supabase session to `localStorage` and mirrors it into `sb-access-token` and `sb-auth-token`
cookies. `src/hooks.server.ts` reads those cookies, validates the token with a service-role
client, and populates `locals.user` / `locals.isAdmin`. `@supabase/ssr` is installed but not
currently used.

**Authorization.** `/admin/*` is blocked in the server hook, re-checked client-side in
`src/routes/admin/+layout.svelte`, and enforced in the database through RLS policies that call
the `is_admin_user()` SECURITY DEFINER function. Most data access happens directly from the
browser, so **RLS is the real authorization boundary** — any new table needs policies.

**Templates.** Content is stored as plain text with `{{variable}}` placeholders. Variables are
detected on save and stored in a `variables` row per placeholder, with a type, description,
default value, and required flag. At usage time the content is split into text and variable
segments, rendered as a form, and recombined.

### Database schema

| Table                  | Purpose                                            |
| ---------------------- | -------------------------------------------------- |
| `categories`           | Personal template categories (unique per user)     |
| `templates`            | User-owned templates                               |
| `variables`            | Placeholder definitions for a template             |
| `directory_categories` | Public directory categories                        |
| `directory_templates`  | Public directory templates, with a `featured` flag |
| `directory_variables`  | Placeholder definitions for directory templates    |
| `user_profiles`        | Profile fields and the `is_admin` flag             |

Plus the `profile_images` storage bucket (public read, 2 MB limit, owner-scoped writes) and the
`is_admin_user(uuid)` helper function.

## 🔧 Configuration

### Environment variables

| Variable                    | Description                                             | Required | Default                        |
| --------------------------- | ------------------------------------------------------- | -------- | ------------------------------ |
| `VITE_SUPABASE_URL`         | Supabase project URL                                    | Yes      | —                              |
| `VITE_SUPABASE_ANON_KEY`    | Supabase anonymous key                                  | Yes      | —                              |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side admin operations)         | Yes      | falls back to anon key         |
| `APP_ENV`                   | `development` or `production` — gates security features | No       | `NODE_ENV`, else `development` |
| `FORCE_HTTPS`               | Redirect HTTP → HTTPS (skipped on localhost)            | No       | `false`                        |
| `ALLOWED_ORIGINS`           | Comma-separated CORS allowlist (production only)        | No       | none                           |
| `RATE_LIMIT_MAX_REQUESTS`   | Requests per window per IP, `/api/*` only               | No       | `100`                          |
| `RATE_LIMIT_WINDOW_MS`      | Rate limit window in milliseconds                       | No       | `60000`                        |
| `PUBLIC_ENABLE_LOGGING`     | Emit logs to the console outside development            | No       | `false`                        |
| `MAX_FILE_SIZE_MB`          | Documented upload ceiling (bucket limit is set in SQL)  | No       | `2`                            |
| `ALLOWED_MIME_TYPES`        | Documented upload allowlist (bucket list is set in SQL) | No       | see `.env.example`             |

> `MAX_FILE_SIZE_MB` and `ALLOWED_MIME_TYPES` are declarative today — the effective limits are
> the ones on the `profile_images` bucket in `20250322_user_profiles_update.sql`.

### Customization

- **Theme tokens**: `src/app.css` and `src/variables.css`
- **Components**: `src/lib/components/ui/` (configured by `components.json`)
- **Pages**: `src/routes/`
- **Server endpoints**: `src/routes/api/`

## 🐛 Troubleshooting

**"Missing Supabase credentials"** — `.env` is absent or `VITE_SUPABASE_URL` /
`VITE_SUPABASE_ANON_KEY` are unset. Restart the dev server after editing `.env`; Vite only reads
it at startup.

**Logged in on the client but signed out on the server** — the server reads the `sb-access-token`
and `sb-auth-token` cookies written by the custom storage adapter in `src/lib/supabase.ts`.
Clear site data and sign in again. Note these cookies expire after 8 hours.

**`/admin` returns 403** — the server hook blocks it whenever `is_admin` is not `true` in
`user_profiles`. Confirm the row exists and the flag is set for your user id.

**"infinite recursion detected in policy"** — a policy on `user_profiles` is querying
`user_profiles` directly. Apply `20250323_fix_user_profiles_policies.sql` and use
`is_admin_user(auth.uid())` in any new policy.

**Migration errors on a clean database** — apply the migrations in filename order as listed in
[step 3](#3-set-up-the-database). If you are upgrading an instance created before
`template_directory.sql` was renamed, see the note in that step.

**Database connection issues** — free-tier Supabase projects pause after a period of inactivity.
Check the project is active and unpaused in the dashboard.

**Build errors** — `rm -rf node_modules && npm install`, confirm Node 18+, and run `npm run check`
for type errors.

## 🗺️ Roadmap

- **Move the database to [Neon](https://neon.tech/).** Free-tier Supabase projects pause when
  inactive, which makes a lightly used deployment unreliable. Neon replaces Postgres only, so
  Supabase Auth and Storage need separate replacements and Row Level Security stops being the
  authorization boundary — the browser-side queries would move to server routes with explicit
  ownership checks.
- **Fixes and cleanup**: extract the duplicated CSV import/export out of the two large page
  components, clear the Prettier/ESLint backlog, replace the in-memory rate limiter, and remove
  the hand-written module declarations in `src/app.d.ts` that shadow SvelteKit's real types.

## 🤝 Contributing

Issues and pull requests are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for setup,
conventions, and the workflow.

## 📄 License

MIT — see [LICENSE](LICENSE).

## 🙏 Acknowledgments

- [SvelteKit](https://kit.svelte.dev/) for the framework
- [Supabase](https://supabase.com/) for the backend infrastructure
- [shadcn-svelte](https://shadcn-svelte.com/) for the component library
- [TailwindCSS](https://tailwindcss.com/) for the styling system

---

**Made with ❤️ by [Dafter Inc.](https://dafterinc.com)**
