# Prompt Templates

A web application for building, managing, and generating text prompts with customizable variables for day-to-day usage.

## Technologies Used

- [SvelteKit](https://kit.svelte.dev/) - Frontend framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [ShadCN UI](https://shadcn-svelte.com/) - Component library
- [Supabase](https://supabase.com/) - Backend services (Auth, Database)

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Supabase credentials

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Building for Production

To create a production build:

```bash
npm run build
```

You can preview the production build with:

```bash
npm run preview
```

## Features

- Create, edit, and manage prompt templates
- Define custom variables within templates
- Generate final text with variables substituted
- Cloud synchronization with offline support
