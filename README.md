# RabbitHR

A multi-tenant SaaS boilerplate: **NestJS + PostgreSQL** backend, **Next.js (CSR/static export)** frontend, shared TypeScript packages, in a pnpm monorepo. It ships the product-agnostic foundation — auth, users, roles + permissions (RBAC with scopes), organizations, org config, integrations, audit log, notifications, storage, mail, and a reusable UI pattern library — ready to build a product on top of.

## Stack

- **Backend** — NestJS 11, TypeORM, PostgreSQL. Command/usecase pattern, JWT access/refresh, request-scoped logging.
- **Frontend** — Next.js 15 (`output: export`, fully client-side), shadcn/ui + Radix + Tailwind, TanStack Query + Table, react-hook-form + zod.
- **Packages** — `@boilerplate/shared` (frontend-safe types, permissions, utils, events) and `@boilerplate/core` (backend services: mail, storage, AI, cache, integrations + re-exports shared).
- **Package manager** — pnpm 9.

## Structure

```
apps/
  backend/     NestJS API + worker
  frontend/    Next.js dashboard (CSR)
packages/
  shared/      frontend-safe types, permissions, utils, events
  core/        backend services + shared re-exports
cli/           helper CLI
```

## Getting started

```bash
pnpm install
pnpm build:packages                 # build shared + core first

cp apps/backend/.env.example apps/backend/.env   # set DB_URL + JWT secrets
pnpm --filter backend seed          # creates admin@rabbithr.test / Admin@123

pnpm --filter backend dev           # http://localhost:4000  (Swagger: /api/docs)
pnpm --filter frontend dev          # http://localhost:3000
```

In development the backend uses TypeORM `synchronize` to create tables from entities. Generate a baseline migration before the first production deploy.

## Foundation modules (backend)

auth · user · role · organization · organization-config · system-admin (org management + impersonation) · integration · audit · notifications / user-notifications · session · storage · mail · queue · events · shared.

## Reusable UI patterns (frontend)

`src/components/patterns/` — composable building blocks on top of the shadcn primitives in `src/components/ui/`:

- **toolbar** — `FilterBar`, `FilterDropdown`, `ToggleControl`, `RefreshButton`
- **data-table** — TanStack `DataTable` + toolbar, plus `StatusPill`, `AvatarStack`, `SortableHeader`, `RowActions`
- **detail-drawer** — `DetailDrawer`, `DetailPanel`, `PanelSection`
- **cards** — `SectionCard`, `SourceCard`
- **stats** — `StatTile`, `StatTileRow`
- **feedback** — `EmptyState`

A live gallery of every pattern is at `/dashboard/components` (visible only in development).

## Conventions

See `CLAUDE.md` (root) plus `apps/backend/CLAUDE.md` and `apps/frontend/CLAUDE.md` for the API-client, command/usecase, pagination, permissions, and form conventions.
