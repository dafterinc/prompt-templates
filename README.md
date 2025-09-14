# ✨ Prompt Templates

A powerful, self-hostable web application for building, managing, and generating text prompts with customizable variables. Perfect for writers, marketers, developers, content creators, and anyone who regularly uses templates for communication!

## 🚀 Features

### Core Functionality
- ✏️ **Template Management**: Create, edit, duplicate, and organize prompt templates
- 🔄 **Dynamic Variables**: Define custom variables with types, descriptions, and default values
- 🎯 **Interactive Interface**: Fill-in-the-blank interface for easy template usage
- 📋 **One-Click Copy**: Copy generated content to clipboard instantly
- 🏷️ **Smart Organization**: Categorize templates for better organization
- 🔍 **Advanced Search**: Filter templates by category, content, or variables

### User Experience
- 🌓 **Dark/Light Mode**: Automatic theme switching with user preference
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- ⚡ **Fast Performance**: Optimized for speed with modern web technologies
- 🎨 **Beautiful UI**: Clean, intuitive interface built with ShadCN components

### Enterprise Features
- 🔒 **Secure Authentication**: User accounts with Supabase Auth
- 👑 **Admin Dashboard**: Manage public templates and users
- ☁️ **Cloud Sync**: Templates sync across devices
- 🔐 **Self-Hostable**: Complete control over your data and infrastructure
- 📊 **User Management**: Admin controls for user access and permissions

## 🛠️ Technology Stack

### Frontend
- **[SvelteKit](https://kit.svelte.dev/)** - Modern full-stack framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[TailwindCSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[ShadCN UI](https://shadcn-svelte.com/)** - High-quality component library
- **[Iconify](https://iconify.design/)** - Comprehensive icon system

### Backend & Infrastructure
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service (Auth, Database, Storage)
- **[PostgreSQL](https://postgresql.org/)** - Robust relational database
- **[Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)** - Database-level security
- **[Vite](https://vitejs.dev/)** - Fast build tool and dev server

### Development & Quality
- **[ESLint](https://eslint.org/)** - Code linting and formatting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Vitest](https://vitest.dev/)** - Unit testing framework
- **[Playwright](https://playwright.dev/)** - End-to-end testing

## 📁 Project Structure

```
prompt-templates/
├── 📁 src/                          # Source code
│   ├── 📁 lib/                      # Shared libraries and utilities
│   │   ├── 📁 components/           # Reusable UI components
│   │   │   └── 📁 ui/              # ShadCN UI components
│   │   ├── 📁 server/              # Server-side utilities
│   │   │   └── middleware.ts       # Rate limiting, HTTPS, CORS
│   │   ├── 📁 utils/               # Utility functions
│   │   │   └── logger.ts           # Centralized logging system
│   │   ├── index.ts                # Library exports
│   │   ├── supabase.ts             # Supabase client configuration
│   │   └── utils.ts                # Common utility functions
│   ├── 📁 routes/                  # SvelteKit routes (file-based routing)
│   │   ├── 📁 admin/               # Admin dashboard routes
│   │   ├── 📁 api/                 # API endpoints
│   │   ├── 📁 auth/                # Authentication pages
│   │   ├── 📁 categories/          # Category management
│   │   ├── 📁 directory/           # Public template directory
│   │   ├── 📁 profile/             # User profile management
│   │   ├── 📁 templates/           # Template management
│   │   ├── +layout.svelte          # Root layout component
│   │   ├── +layout.server.ts       # Server-side layout logic
│   │   └── +page.svelte            # Homepage
│   ├── 📁 static/                  # Static assets
│   ├── app.css                     # Global styles
│   ├── app.d.ts                    # TypeScript declarations
│   ├── app.html                    # HTML template
│   └── hooks.server.ts             # Server hooks (auth, middleware)
├── 📁 supabase/                    # Supabase configuration
│   ├── 📁 migrations/              # Database migrations
│   └── config.toml                 # Supabase local development config
├── 📁 e2e/                         # End-to-end tests
├── 📁 node_modules/                # Dependencies
├── .env.example                    # Environment variables template
├── components.json                 # ShadCN UI configuration
├── eslint.config.js                # ESLint configuration
├── package.json                    # Dependencies and scripts
├── playwright.config.ts            # Playwright test configuration
├── postcss.config.cjs              # PostCSS configuration
├── svelte.config.js                # SvelteKit configuration
├── tailwind.config.cjs             # TailwindCSS configuration
├── tsconfig.json                   # TypeScript configuration
└── vite.config.ts                  # Vite configuration
```

## 💻 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Supabase account** (free tier available)
- **Git** for version control

### 1. Clone and Install
```bash
# Clone the repository
git clone https://github.com/your-username/prompt-templates.git
cd prompt-templates

# Install dependencies
npm install
```

### 2. Set Up Supabase

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (usually 2-3 minutes)
3. Go to **Settings** → **API** to get your credentials

#### Configure Environment Variables
```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Environment
NODE_ENV=development
MODE=development

# Logging Configuration
PUBLIC_ENABLE_LOGGING=true

# Security Configuration (Production)
FORCE_HTTPS=false
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com

# Rate Limiting (Production)
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

#### Set Up Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Run the database migrations from `supabase/migrations/` (if any)
3. The application will automatically create necessary tables on first run

### 3. Set Up Admin User
After your first user signs up:

1. Go to **Supabase Dashboard** → **Table Editor** → `user_profiles`
2. Find your user and set `is_admin` to `true`
3. Or run this SQL in the **SQL Editor**:
```sql
UPDATE user_profiles 
SET is_admin = true 
WHERE id = 'your-user-id-here';
```

### 4. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) to see your application!

## 🚀 Self-Hosting Guide

### Production Deployment Options

#### Option 1: Vercel (Recommended)
1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel handles everything automatically

#### Option 2: Docker Deployment
```bash
# Build the application
npm run build

# Create a simple Dockerfile
cat > Dockerfile << EOF
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
EOF

# Build and run
docker build -t prompt-templates .
docker run -p 3000:3000 prompt-templates
```

#### Option 3: Traditional VPS
1. **Set up a VPS** (Ubuntu 20.04+ recommended)
2. **Install Node.js** and PM2:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

3. **Deploy your application**:
```bash
git clone https://github.com/your-username/prompt-templates.git
cd prompt-templates
npm install
npm run build
pm2 start npm --name "prompt-templates" -- start
pm2 save
pm2 startup
```

### Production Environment Variables
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Environment
NODE_ENV=production
MODE=production

# Security Configuration
FORCE_HTTPS=true
ALLOWED_ORIGINS=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=60000

# Optional: External Services
# OPENAI_API_KEY=your-openai-key
# SENDGRID_API_KEY=your-sendgrid-key
```

### Security Considerations
- ✅ **HTTPS**: Always use HTTPS in production
- ✅ **Environment Variables**: Never commit `.env` files
- ✅ **Rate Limiting**: Configured to prevent abuse
- ✅ **CORS**: Properly configured for your domain
- ✅ **Row Level Security**: Database-level security with Supabase
- ✅ **Input Validation**: All user inputs are validated

## 🏗️ Development

### Available Scripts
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Type checking with Svelte
npm run check:watch  # Type checking in watch mode

# Code Quality
npm run lint         # Lint and format code
npm run format       # Format code with Prettier

# Testing
npm run test         # Run all tests
npm run test:unit    # Run unit tests
npm run test:e2e     # Run end-to-end tests
```

### Key Features Explained

#### Template System
- **Dynamic Variables**: Templates support variables with types (text, number, boolean, select)
- **Smart Detection**: Automatically detects variables in template content
- **Default Values**: Set default values for variables
- **Validation**: Required fields and input validation

#### User Management
- **Authentication**: Secure user registration and login
- **Profiles**: User profile management with avatar uploads
- **Admin System**: Role-based access control
- **Public Directory**: Share templates with the community

#### Security Features
- **Row Level Security**: Database-level security policies
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Sanitization**: All user inputs are sanitized
- **CORS Protection**: Properly configured cross-origin policies

### Database Schema
The application uses the following main tables:
- `templates` - User-created prompt templates
- `variables` - Template variables and their configurations
- `categories` - Template organization categories
- `user_profiles` - User profile information and admin status
- `directory_categories` - Public template directory categories
- `directory_templates` - Public templates in the directory

## 🔧 Configuration

### Environment Variables
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | - |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes | - |
| `NODE_ENV` | Environment mode | No | development |
| `FORCE_HTTPS` | Force HTTPS redirects | No | false |
| `ALLOWED_ORIGINS` | CORS allowed origins | No | * |
| `RATE_LIMIT_MAX_REQUESTS` | Rate limit max requests | No | 100 |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | No | 60000 |
| `PUBLIC_ENABLE_LOGGING` | Enable client-side logging | No | false |

### Customization
- **Themes**: Modify `src/app.css` for custom styling
- **Components**: Add new UI components in `src/lib/components/`
- **Routes**: Add new pages in `src/routes/`
- **API**: Add new endpoints in `src/routes/api/`

## 🐛 Troubleshooting

### Common Issues

#### "Missing Supabase credentials" Error
- Ensure your `.env` file exists and contains the correct Supabase credentials
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

#### Database Connection Issues
- Verify your Supabase project is active
- Check that your database is not paused (free tier limitation)
- Ensure your IP is not blocked in Supabase dashboard

#### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)
- Run type checking: `npm run check`

#### Admin Access Issues
- Verify the user exists in the `user_profiles` table
- Check that `is_admin` is set to `true`
- Ensure you're using the correct user ID

### Getting Help
- Check the [Issues](https://github.com/your-username/prompt-templates/issues) page
- Review the [Supabase documentation](https://supabase.com/docs)
- Check [SvelteKit documentation](https://kit.svelte.dev/docs)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [SvelteKit](https://kit.svelte.dev/) for the amazing framework
- [Supabase](https://supabase.com/) for the backend infrastructure
- [ShadCN](https://shadcn-svelte.com/) for the beautiful UI components
- [TailwindCSS](https://tailwindcss.com/) for the utility-first CSS framework

---

**Made with ❤️ by [Dafter Inc.](https://dafterinc.com)**
