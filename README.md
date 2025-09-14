# ✨ Prompt Templates

A powerful web application for building, managing, and generating text prompts with customizable variables. Perfect for writers, marketers, developers, and anyone who regularly uses templates for communication!

## 🚀 Features

- ✏️ Create, edit, duplicate, and manage prompt templates
- 🔄 Define custom variables for dynamic content generation
- 🎯 Interactive "fill-in-the-blank" interface for template usage
- 📋 One-click copy to clipboard functionality
- 🏷️ Organize templates with categories
- 🔍 Advanced search and filtering options
- 🌓 Dark/light mode support
- ☁️ Cloud synchronization with offline support
- 🔒 Secure user authentication
- 👑 Admin dashboard for managing public templates

## 🛠️ Technologies Used

- [SvelteKit](https://kit.svelte.dev/) - Frontend framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [ShadCN UI](https://shadcn-svelte.com/) - Component library
- [Supabase](https://supabase.com/) - Backend services (Auth, Database)
- [Iconify](https://iconify.design/) - Comprehensive icon system

## 💻 Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables (IMPORTANT for security):
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials to the `.env` file:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
     - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (required for admin functionality)

3. Set up admin user:
   - Admin access is controlled through the `user_profiles` table in Supabase
   - To make a user an admin:
     1. Let the user sign up normally through the application
     2. In your Supabase dashboard, go to the SQL editor
     3. Run the following SQL to grant admin access (replace USER_ID with the actual user's ID):
        ```sql
        INSERT INTO user_profiles (id, is_admin)
        VALUES ('USER_ID', true)
        ON CONFLICT (id) DO UPDATE
        SET is_admin = true;
        ```
   - Admin users have access to:
     - Admin dashboard at `/admin`
     - Public template directory management
     - User management
     - System settings

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🏗️ Building for Production

To create a production build:

```bash
npm run build
```

You can preview the production build with:

```bash
npm run preview
```

## 🌟 What Makes This Special

- 💡 **Intuitive Design**: Clean, user-friendly interface with a responsive design
- 🧩 **Variable System**: Smart detection and management of template variables
- 🔄 **Seamless Experience**: Interactive variable editing directly within your templates
- 🎨 **Personalized**: Dark/light mode to match your preferences
- 🔐 **Self-hostable**: Run it on your own infrastructure for maximum privacy

## 📝 License

[MIT](LICENSE)
