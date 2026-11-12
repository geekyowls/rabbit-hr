# RabbitHR

Multi-tenant SaaS **boilerplate** (pnpm monorepo). It provides the product-agnostic foundation — auth, RBAC, organizations, integrations, audit, notifications, storage, mail — plus a reusable UI pattern library. Build the product domain on top of this base.

## Architecture

- **Monorepo**: `apps/backend` (NestJS 11 + TypeORM/Postgres), `apps/frontend` (Next.js 15, static export / CSR), `packages/shared` (frontend-safe types/permissions/utils/events), `packages/core` (backend services + re-exports shared), `cli`.
- Packages must be built before apps run: `pnpm build:packages`.

## Thinking before doing

- ALWAYS read existing code before modifying; reuse existing utilities, hooks, and patterns before creating new ones.
- ALWAYS check how the backend wraps responses (`{ data: T }`) before writing frontend fetch logic.
- When changing a backend DTO or JWT payload, update the corresponding frontend type in the SAME change.
- Run `tsc --noEmit` on both apps before considering a task done. Zero TS errors is mandatory before commit.

## Code style

- No comments in the codebase; write self-documenting code.
- DRY, minimal-surface changes, no over-engineering.

## UI copy

- NEVER use em-dashes or en-dashes (`—`, `–`) anywhere in copy, labels, or strings. Use a plain hyphen (`-`), a comma, a colon, or reword. This applies to code comments and commit messages too.
- Do NOT put a trailing period on short UI microcopy: titles, subtitles, card descriptions, tooltips, button labels, table headers/cells, empty-state text, toasts, nav items. Periods are only for multi-sentence body/help paragraphs.
- Keep microcopy terse and sentence-case; avoid decorative punctuation.

## Backend (see `apps/backend/CLAUDE.md`)

- All endpoints under `/api/v1/`; responses wrapped in `{ data: T }` by `ResponseInterceptor`.
- Command/usecase pattern for all business logic. Commands extend `OrganizationCommand` / `AuthenticatedCommand` / `BasePaginatedCommand`.
- `DatabaseModule` is `@Global()` and owns entity registration — feature modules NEVER call `TypeOrmModule.forFeature()`.
- Adding an entity: create entity + repository, export from both `database/entities/index.ts` and `database/repositories/index.ts`, add both to the arrays in `database/db.module.ts`.
- Two processes off one image: the API (`app.module.ts`) and the worker (`worker.module.ts`) have separate DI graphs and event buses — when adding a feature, ask whether the worker needs it too.
- Path aliases: `@db/*`, `@modules/*`, `@shared/*`.
- Org-scoped Redis cache keys MUST start with `organizationId`.

### Foundation modules

auth · user · role · organization · organization-config · system-admin · integration · audit · user-notifications (+ `NotificationsCoreModule`) · session · storage · mail · queue · events · shared.

ATS modules: client, job, candidate, application, pipeline-stage, activity, task, document, email-template, custom-field, interview, interview-booking, offer, report, ats-dashboard, ats-settings, careers, candidate-portal, mailbox, inbox, call, whatsapp, job-feed. The Agents page is still UI on sample data.

### Auth

- Web users log in via `/api/v1/auth/*` (login, register, refresh, logout, update-password, reset).
- Access token payload: `{ userId, email, organizationId, permissions[], firstName, lastName }`; refresh token rotates on use.

### Permissions (RBAC with scopes)

- `PERMISSIONS_ENUM`, `ALL_PERMISSIONS`, `PERMISSION_GROUPS`, `PERMISSION_BASE`, `PermissionScope` from `@boilerplate/shared`.
- Scoped permissions follow `base:scope` (`own`/`team`/`all`). Use `getPermissionScope(permissions, PERMISSION_BASE.X)`; never hardcode scope or base strings.
- `@RequirePermissions(...)` / `@RequireAuthentication()` on controllers; `@UserSession()` for the session payload.

## Frontend (see `apps/frontend/CLAUDE.md`)

- Every page and interactive component is `'use client'`. No SSR, no server actions, no Next API routes. No dynamic `[id]` routes — use query params.
- Auth calls: `fetchApi(API_ROUTES.X.Y)` (attaches token, unwraps `{ data }`, auto-refreshes on 401). Unauthenticated calls (login/register): `fetch(buildApiUrl(...))`. Never combine both.
- Tokens via `getToken`/`setToken`/`clearTokens` in `utils/cookies.ts` (localStorage).
- Route protection via `AuthGuard`; permission-gated UI via `PermissionGuard` / `usePermissions()`.
- All list pagination is 1-indexed.
- Forms: react-hook-form + zod v4 via `@/lib/zod-resolver` (NOT `@hookform/resolvers/zod`). Use `isSubmitting`, never manual loading state.
- Always include dark-mode variants for custom colors, or use semantic tokens.
- Debounce search inputs (`useDebounce`, 500ms).

### UI components

- Primitives: `src/components/ui/` (shadcn/new-york) — do not modify except to fix bugs.
- Reusable composites: `src/components/patterns/` — `toolbar`, `data-table` (+ `StatusPill`/`AvatarStack`/`SortableHeader`/`RowActions`), `detail-drawer`, `cards`, `stats`, `charts`, `kanban`, `timeline`, `rating`, `feedback`. Import from `@/components/patterns`.
- Live gallery: `/dashboard/components` (development only).

### UI density & spacing

- Keep padding proportional to content — no unnecessary empty space. Padding should hug the content, not float it in a large void.
- Do NOT self-pad a page's root element: the dashboard `<main>` already applies the page gutter (`p-4` = 16px, the reference set by the Candidates page). Pages start with `space-y-*` only, never an outer padding of their own (that double-pads). Full-height table pages that need internal scroll use `-m-4 ... p-4 h-[calc(100vh-6rem)] flex flex-col` to net the same 16px while filling height.
- Compact control rows (filter toolbars, single-line headers) get tight container padding (≈`p-4`/`px-4 py-3`), not the roomy `p-6`. A short row inside a big-padded card reads as empty — tighten the container or drop the card.
- Never render the same element twice from different layers (e.g. breadcrumbs live in the dashboard header via `useBreadcrumbContext`; pages must not also render their own).
- Prefer semantic spacing scales already in use (`space-y-4`/`space-y-6`, `gap-2`/`gap-4`) over ad-hoc large margins.

## Running locally

```bash
pnpm build:packages
cp apps/backend/.env.example apps/backend/.env    # set DB_URL + JWT secrets
pnpm --filter backend seed                        # admin@rabbithr.test / Admin@123
pnpm --filter backend dev                         # :4000 (Swagger /api/docs)
pnpm --filter frontend dev                        # :3000
```

Dev creates tables via TypeORM `synchronize`. Generate a baseline migration before the first production deploy (`pnpm --filter backend migration:generate`).

## Git

- Never push directly to `main`; branch (`feat/…`, `fix/…`, `chore/…`, `docs/…`) and open a PR.
- Conventional commit messages, lowercase, one line.
- Zero TS errors before commit; husky runs lint-staged + `tsc --noEmit` on both apps.
