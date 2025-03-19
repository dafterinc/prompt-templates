# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Created README.md with basic project description.
- Set up SvelteKit project with TypeScript
- Configured TailwindCSS for styling with default configuration
- Initialized ShadCN UI with New York style and Zinc color scheme
- Created basic component directory structure
- Implemented styled landing page with Tailwind classes
- Set up local Supabase instance for development
- Created Supabase client with local development credentials
- Created initial database schema with tables for templates, variables, and categories
- Implemented Row Level Security (RLS) policies for data protection
- Added test setup configuration with Vitest and Testing Library
- Created authentication system with login, registration, and password reset
- Set up navigation with conditional display based on auth state
- Updated app.d.ts with proper TypeScript declarations for SvelteKit modules
- Added global TypeScript declarations for Svelte HTML attributes
- Implemented template management with listing, creation, and viewing functionality
- Added template variables extraction and handling in the creation form
- Created detailed template view with variable substitution and copy to clipboard
- Implemented template editing with auto-detection of variable changes
- Added template deletion with confirmation modal
- Implemented user authentication with Supabase (login, registration, password reset)
- Created responsive landing page with hero section and features
- Added protected routes and authentication guards
- Implemented category management with CRUD operations
- Added template count tracking per category

### Fixed
- Fixed incorrect border color utility class in app.css that was causing Tailwind compilation errors
- Fixed Tailwind CSS module loading issue by reinstalling dependencies
- Added missing @tailwindcss/vite plugin dependency
- Fixed background and text color utility classes to properly use CSS variables
- Fixed PostCSS config compatibility by renaming to .cjs extension
- Cleaned up duplicate configuration files and rebuilt dependencies
- Consolidated duplicate CSS files to resolve Tailwind directive conflicts
- Fixed Tailwind configuration to use proper CommonJS syntax
- Reorganized CSS layers for proper Tailwind directive processing
- Updated PostCSS configuration to use explicit plugin syntax
- Fixed CSS file formatting and directive ordering
- Restructured CSS by separating variables into a dedicated file and simplifying app.css
- Fixed Vite configuration to use correct Tailwind import
- Added @testing-library/svelte for testing components
- Fixed testing configuration in vite.config.ts to use proper setup
- Fixed incorrect props usage in +layout.svelte by replacing $props() with standard Svelte slot
- Fixed TypeScript module resolution for SvelteKit imports
- Fixed svelteHTML type errors by adding global declarations
- Fixed Tailwind CSS and PostCSS configuration for proper compilation
- Resolved SvelteKit module resolution and TypeScript compilation errors
- Updated app.d.ts with proper TypeScript declarations for SvelteKit modules
- Added global TypeScript declarations for Svelte HTML attributes
- Fixed variable syntax display in template forms to prevent JavaScript errors
- Improved variable handling in template view for better user experience

### Changed
- Updated UI components to use Tailwind CSS for consistent styling
- Improved error handling and user feedback throughout the application
- Enhanced form validation for better user experience