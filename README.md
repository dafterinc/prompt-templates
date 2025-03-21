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
   - Add your Supabase credentials to the `.env` file
   - NEVER commit your `.env` file to version control

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

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
