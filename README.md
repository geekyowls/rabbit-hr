# Full-Stack Monorepo Boilerplate

A production-ready monorepo with Next.js 15 frontend (shadcn/ui + authentication) and NestJS backend foundation. Built with pnpm workspaces, Docker support, and GitHub Actions CI.

## What's Included

### Frontend (Next.js 15)
- **29 shadcn/ui components** - Complete design system with Radix UI
- **Authentication pages** - Login, forgot password, reset password, access control
- **Dashboard layout** - Responsive navigation, header, and content structure
- **Dark mode** - Built-in theme switching
- **TypeScript** - Full type safety
- **Tailwind CSS** - Utility-first styling with custom animations

### Backend (NestJS)
- Ready to add your NestJS application

### Shared Package
- **@boilerplate/core** - Unified package for frontend/backend utilities
  - **Types**: Standardized `ApiResponse<T>` and `PaginatedResponse<T>` with `payload` + `metadata`
  - **Pagination**: `createPaginationMetadata()` - Auto-calculates totalPages, hasNextPage, hasPreviousPage
  - **Services**: Cache (Redis), Mail (SES/Resend), Storage (S3/GCS), AI
  - **Integrations**: Zoom, Google Calendar, Slack, Messaging
  - **Utils**: Date helpers, encryption, email validation, slug builder, token generator
  - **Commands**: Base NestJS command patterns (authenticated, paginated, base)

### Infrastructure
- **pnpm workspaces** - Efficient monorepo management
- **Docker** - Multi-stage builds for production
- **Docker Compose** - Development and production environments
- **GitHub Actions** - Automated CI/CD pipeline

## Project Structure

```
.
├── apps/
│   ├── frontend/          # Next.js 15 with shadcn/ui + auth
│   └── backend/           # NestJS (empty, ready for your app)
├── packages/
│   └── core/              # @boilerplate/core - Shared utilities & types
├── docker/
│   ├── frontend.Dockerfile
│   ├── backend.Dockerfile
│   └── .dockerignore
├── .github/workflows/ci.yml
├── docker-compose.yml
├── docker-compose.dev.yml
├── pnpm-workspace.yaml
├── tsconfig.json
├── package.json
├── .npmrc
└── README.md
```

## Frontend Structure

```
apps/frontend/src/
├── app/                   # Next.js App Router
│   ├── dashboard/         # Dashboard layout & page
│   ├── login/            # Authentication pages
│   ├── forgot-password/
│   ├── reset-password/
│   ├── no-access/
│   └── api/auth/         # Auth API routes
├── components/
│   ├── ui/               # 29 shadcn/ui components
│   ├── auth/             # Auth forms & guards
│   └── dashboard/        # Layout components
├── lib/                  # Utilities (utils, toast)
├── hooks/                # Custom hooks (use-debounce, use-permissions)
├── utils/                # Auth & API utilities
├── types/                # TypeScript types
├── constants/            # App constants
└── contexts/             # React contexts (session)
```

## Prerequisites

- Node.js >= 20.0.0 (LTS recommended)
- pnpm >= 9.0.0 (install with `npm install -g pnpm` or `corepack enable`)
- Docker & Docker Compose (for containerized deployment)

## Getting Started

### 1. Clone and Install

```bash
# Install dependencies
pnpm install
```

### 2. Configure Environment

Create `.env.local` in `apps/frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
SERVER_URL=http://localhost:4000

# Your environment variables
```

See `apps/frontend/.env.template` for all available variables.

### 3. Development

Run all apps in development mode:
```bash
pnpm dev
```

Run specific app:
```bash
pnpm dev:frontend
pnpm dev:backend
```

### 4. Build

Build all apps:
```bash
pnpm build
```

Build specific app:
```bash
pnpm build:frontend
pnpm build:backend
```

### 5. Linting and Testing

```bash
# Lint all apps
pnpm lint

# Run tests
pnpm test
```

## Docker Deployment

### Development Mode (with hot-reload)

```bash
pnpm docker:dev
# or
docker-compose -f docker-compose.dev.yml up
```

This will:
- Mount your source code as volumes
- Enable hot-reload for both frontend and backend
- Install dependencies inside containers

### Production Mode

Build and run production containers:

```bash
# Build images
pnpm docker:build

# Start containers
pnpm docker:up

# Stop containers
pnpm docker:down
```

Or using docker-compose directly:

```bash
docker-compose up --build
```

Access the applications:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## Environment Variables

Create `.env` files in each app directory:

**apps/frontend/.env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**apps/backend/.env:**
```env
PORT=4000
DATABASE_URL=postgresql://...
```

For Docker deployment, update `docker-compose.yml` with your environment variables.

## GitHub Actions CI

The repository includes a CI workflow that:
- Runs on push/PR to `main` and `develop` branches
- Installs dependencies with pnpm
- Lints both frontend and backend
- Runs type checks
- Builds both applications
- Runs tests
- Builds Docker images

The workflow file is located at `.github/workflows/ci.yml`.

## Workspace Commands

The root `package.json` includes these workspace commands:

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run all apps in dev mode |
| `pnpm dev:frontend` | Run frontend only |
| `pnpm dev:backend` | Run backend only |
| `pnpm dev:packages` | Watch and rebuild packages on changes |
| `pnpm build` | Build packages + all apps |
| `pnpm build:packages` | Build shared packages only |
| `pnpm build:frontend` | Build frontend only |
| `pnpm build:backend` | Build backend only |
| `pnpm start` | Start all apps in production mode |
| `pnpm lint` | Lint all apps |
| `pnpm test` | Test all apps |
| `pnpm clean` | Clean all dependencies and build outputs |

## Adding Shared Packages

To create shared packages (e.g., shared UI components, utilities):

1. Create a new package in `packages/`:
```bash
mkdir packages/shared-ui
cd packages/shared-ui
pnpm init
```

2. Update `pnpm-workspace.yaml` (already configured to include `packages/*`)

3. Use the shared package in your apps:
```json
{
  "dependencies": {
    "shared-ui": "workspace:*"
  }
}
```

## Available UI Components

The frontend includes 29 shadcn/ui components ready to use:

**Layout & Navigation**
- Card, Separator, Tabs, Scroll Area

**Forms & Inputs**
- Button, Input, Label, Checkbox, Switch, Select, Calendar, Date Picker

**Feedback & Overlays**
- Dialog, Alert Dialog, Toast, Tooltip, Popover

**Data Display**
- Table, Avatar, Badge, Skeleton

**Advanced**
- Command (⌘K menu), Dropdown Menu, Multi-Select

**Custom**
- Initials Avatar, Status Select, Table Skeleton

All components support dark mode and are fully accessible.

## Adding Your Backend

To add your NestJS backend:

1. Copy your NestJS project to `apps/backend/`
2. Ensure `package.json` has:
   ```json
   {
     "name": "backend",
     "scripts": {
       "dev": "nest start --watch",
       "build": "nest build",
       "start": "node dist/main",
       "lint": "eslint \"{src,apps,libs,test}/**/*.ts\""
     },
     "dependencies": {
       "@boilerplate/core": "workspace:*"
     }
   }
   ```
3. Run `pnpm install` from root
4. Start development with `pnpm dev`

### Using Shared Packages in Backend

Import from shared packages in your NestJS code:

```typescript
// Import everything from @boilerplate/core
import {
  // Types
  ApiResponse,
  PaginatedResponse,
  // Utilities
  createPaginationMetadata,
  // Services
  MailService,
  SESMailService,
  StorageService,
  RedisCacheService,
} from '@boilerplate/core';

// Example: Return standardized paginated API responses
async findAll(page = 1, limit = 10): Promise<PaginatedResponse<User>> {
  const total = await this.userRepository.count();
  const users = await this.userRepository.find({
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    success: true,
    payload: users,
    metadata: createPaginationMetadata(page, limit, total),
  };
}

// Example: Simple API response
async findOne(id: string): Promise<ApiResponse<User>> {
  const user = await this.userRepository.findOne(id);
  return {
    success: true,
    payload: user,
  };
}
```

## Tips

- Use `pnpm --filter <package-name> <command>` to run commands in specific packages
- Add `--parallel` flag to run commands in parallel: `pnpm --parallel dev`
- Use `workspace:*` protocol for internal dependencies
- The `.npmrc` file configures pnpm behavior for the monorepo

## Customization

### Adding More Components
```bash
cd apps/frontend
npx shadcn@latest add [component-name]
```

### Extending the Dashboard
- Edit `src/components/dashboard/dashboard-nav.tsx` for navigation
- Edit `src/app/dashboard/page.tsx` for dashboard content
- Add new routes in `src/app/dashboard/`

### Customizing Authentication
- Auth forms are in `src/components/auth/`
- Auth API routes are in `src/app/api/auth/`
- Update `src/contexts/session-context.tsx` for user session management

## Troubleshooting

**Issue: Module not found errors**
```bash
pnpm install
```

**Issue: Docker build fails**
- Ensure your apps have proper `build` scripts in their package.json
- For Next.js, ensure `output: 'standalone'` is set in `next.config.ts`

**Issue: Hot reload not working in Docker dev mode**
- Ensure WATCHPACK_POLLING is set to true in docker-compose.dev.yml

**Issue: Peer dependency warnings**
- The project uses React 19 RC which may show warnings with some packages
- These are safe to ignore - all packages work correctly

## License

MIT