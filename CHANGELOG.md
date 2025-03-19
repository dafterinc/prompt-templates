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