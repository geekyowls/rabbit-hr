# Frontend Guidelines

## Stack

- Next.js 15 with static export (`output: "export"`), fully client-side rendered
- React 19, TypeScript
- Radix UI + shadcn components with Tailwind CSS
- class-variance-authority (CVA) for component variants
- next-themes for dark mode
- TanStack Query v5 (data fetching), TanStack Table v8 (data tables), recharts (charts), `@xyflow/react` (flow/hierarchy canvases)
- react-hook-form + zod v4 for forms
- GlitchTip (error reporting), OpenPanel (analytics)

## Hard Rules

- Every page and interactive component MUST use `'use client'`
- NEVER use `'use server'`, `cookies()` from `next/headers`, or Next.js API routes
- NEVER change `output: "export"` or `images.unoptimized: true` in `next.config.ts`
- Components using `useSearchParams()` MUST be wrapped in `<Suspense>`
- Auth protection via `AuthGuard` component, NEVER middleware
- NEVER hardcode API URLs. Use `API_ROUTES` from `src/config/api-routes.ts`
- NEVER use raw `fetch` for authenticated API calls. Use `fetchApi()` from `src/utils/api-client.ts`
- NEVER read/write tokens directly. Use `getToken()`, `setToken()`, etc. from `src/utils/cookies.ts`
- NEVER use dynamic routes (e.g. `[id]` folders), static export does not support them. Use query params instead (e.g. `/roles/edit?id=xxx` instead of `/roles/[id]/edit`)

## API Calls

There are two ways to make API calls. Know when to use which:

**`fetchApi(endpoint, options)`**: for all authenticated/data calls:
- Automatically attaches Bearer token from localStorage
- Automatically handles 401 → refresh token → retry
- Automatically unwraps `{ data: T }` response wrapper
- Pass `API_ROUTES.X.Y` directly (fetchApi prepends `API_URL` internally)

```typescript
const roles = await fetchApi<Role[]>(API_ROUTES.ROLES.LIST);
await fetchApi(API_ROUTES.ROLES.DELETE(id), { method: 'DELETE' });
```

**`fetch(buildApiUrl(route), options)`**: only for unauthenticated calls (login, register, signup OTP, forgot/reset password) or calls that bypass the refresh flow (session context refresh/logout):

```typescript
const response = await fetch(buildApiUrl(API_ROUTES.AUTH.LOGIN), { ... });
```

**NEVER combine both**: `fetchApi(buildApiUrl(...))` causes double URL prefix.

## API Routes Reference

All routes are defined in `src/config/api-routes.ts`. Here's what exists:

**App**
- `VERSION`: `GET /version`
- `HEALTH`: `GET /health`

**Auth**
- `AUTH.LOGIN`: `POST /auth/login` (unauthenticated)
- `AUTH.REGISTER`: `POST /auth/register` (unauthenticated)
- `AUTH.GOOGLE`: `POST /auth/google` (unauthenticated)
- `AUTH.SEND_SIGNUP_OTP`: `POST /auth/signup/send-otp` (unauthenticated)
- `AUTH.VERIFY_SIGNUP_OTP`: `POST /auth/signup/verify-otp` (unauthenticated)
- `AUTH.FORGOT_PASSWORD`: `POST /auth/reset/request` (unauthenticated)
- `AUTH.RESET_PASSWORD`: `POST /auth/reset` (unauthenticated)
- `AUTH.REFRESH`: `POST /auth/refresh`
- `AUTH.LOGOUT`: `POST /auth/logout`
- `AUTH.UPDATE_PASSWORD`: `POST /auth/update-password`
- `AUTH.ONBOARDING_CONTEXT`: `POST /auth/onboarding-context`
- `AUTH.IMPERSONATE`: `POST /auth/impersonate`

**Users** (authenticated, use `fetchApi(...)`)
- `USERS.ME`: `GET /users/me`
- `USERS.PROFILE`: `PUT /users/profile`
- `USERS.LIST`: `POST /users/list`, **paginated**, body: `{ page, limit, status?, search? }`
- `USERS.NAMES(teamOnly?)`: `GET /users/names`
- `USERS.INVITE`: `POST /users/invite`
- `USERS.CREATE`: `POST /users/create`
- `USERS.ACCEPT_INVITE`: `POST /users/accept-invite`
- `USERS.RESEND_INVITE`: `POST /users/resend-invite`
- `USERS.COMPLETE_TOUR`: `PUT /users/tour-complete`
- `USERS.UPDATE(id)`: `PUT /users/:id`
- `USERS.BLOCK(id)` / `USERS.UNBLOCK(id)`: `POST /users/:id/block|unblock`
- `USERS.HIERARCHY`: `GET /users/hierarchy`
- `USERS.SET_MANAGER(id)`: `POST /users/:id/set-manager`
- `USERS.DESCENDANTS(id)`: `GET /users/:id/descendants`
- `USERS.RESET_PASSWORD(id)`: `POST /users/:id/reset-password`
- `USERS.PAGE_PREFERENCES`: `PUT /users/me/page-preferences`

**Roles** (authenticated)
- `ROLES.LIST`: `GET /roles`, **not paginated**, returns all roles
- `ROLES.LIST_FULL`: `POST /roles/list`
- `ROLES.CREATE`: `POST /roles`
- `ROLES.GET(id)`: `GET /roles/:id`
- `ROLES.UPDATE(id)`: `PUT /roles/:id`
- `ROLES.DELETE(id)`: `DELETE /roles/:id`

**Audit** (authenticated)
- `AUDIT.LIST`: `POST /audit/list`, **paginated**
- `AUDIT.GET(id)`: `GET /audit/:id`

**Sessions** (authenticated)
- `SESSIONS.LIST`: `GET /sessions`
- `SESSIONS.REVOKE(id)`: `POST /sessions/:id/revoke`

**Notifications** (authenticated)
- `NOTIFICATION_FEED.FEED`: `GET /me/notifications`
- `NOTIFICATION_FEED.MARK_READ(id)`: `POST /me/notifications/:id/read`
- `NOTIFICATION_FEED.READ_ALL`: `POST /me/notifications/read-all`
- `NOTIFICATION_FEED.WEB_PUSH_PUBLIC_KEY` / `WEB_PUSH_SUBSCRIBE` / `WEB_PUSH_UNSUBSCRIBE`
- `NOTIFICATION_FEED.TEST`: `POST /me/notifications/dev/test`

**Integrations** (authenticated)
- `INTEGRATIONS.LIST`: `GET /integrations`
- `INTEGRATIONS.CONNECT(provider)`: `POST /integrations/:provider/connect`
- `INTEGRATIONS.DISCONNECT(provider)`: `DELETE /integrations/:provider`
- `INTEGRATIONS.CREDENTIALS(provider)`: `POST /integrations/:provider/credentials`
- `INTEGRATIONS.HEALTH_CHECK(provider)`: `POST /integrations/:provider/health-check`
- `INTEGRATIONS.RAZORPAY_WEBHOOK_TOKEN`, `INTEGRATIONS.RAZORPAY_WEBHOOK(token)`

**Organization** (authenticated)
- `ORGANIZATION.GET`: `GET /organization`
- `ORGANIZATION.UPDATE`: `PUT /organization`
- `ORGANIZATION_CONFIG.CREATE`: `POST /organization-config`

**Storage** (authenticated)
- `STORAGE.UPLOAD_URL`: `GET /storage/upload-url`

**System Admin** (authenticated, system org only)
- `SYSTEM_ADMIN.ORGANIZATIONS.LIST` / `CREATE` / `UPDATE_STATUS(id)` / `ACCESS(id)`
- `SYSTEM_ADMIN.RESET_LOGIN_LOCKOUT`
- `SYSTEM_ADMIN.SYNC_PERMISSIONS`

## Pagination

Not all list endpoints are paginated. Know the difference:

**Paginated** (user list): POST with body `{ page, limit }`, response includes metadata:
```typescript
const data = await fetchApi<{ data: UserListItem[] }>(
  API_ROUTES.USERS.LIST,
  { method: 'POST', body: JSON.stringify({ page: 1, limit: 50 }) },
);
// data.data = array of users
```
Response shape from backend: `{ data: T[], page, limit, total, totalPages, hasNextPage, hasPreviousPage }`

**Non-paginated** (role list): GET, returns all items as array:
```typescript
const roles = await fetchApi<Role[]>(API_ROUTES.ROLES.LIST);
// roles = array of all roles
```

When the backend wraps in `{ data: T }`, `fetchApi` unwraps it automatically. But for paginated responses that return `{ data: T[], page, total, ... }`, the outer `{ data: ... }` is unwrapped by fetchApi, so you receive `{ data: T[], page, total, ... }`, the inner `data` field is the actual array.

## Pagination Rules (IMPORTANT)

**ALL pagination uses 1-indexed page numbers. First page is page 1, NOT page 0.**

### Rules:

1. **State initialization**: `const [page, setPage] = useState(1)` (NEVER 0)
2. **API requests**: Send `{ page: 1, limit: 10 }` for first page
3. **Pagination controls**: Display "Page 1" for first page (not "Page 0")
4. **Navigation**:
   - Previous: `setPage(p => Math.max(1, p - 1))` (stop at 1)
   - Next: `setPage(p => p + 1)`
   - Disable previous when `page === 1`
   - Disable next when `page >= totalPages`

TanStack Table's internal `pageIndex` is 0-based. If you use it, convert at the API boundary (`page: pageIndex + 1`) and never send it raw.

### Why 1-indexed:

- Backend expects page ≥ 1
- Standard REST convention
- User-friendly display
- Sending page: 0 causes negative database OFFSET errors

### Response from backend:
```typescript
{
  data: T[],
  page: number,        // 1-indexed (1 = first page)
  limit: number,
  total: number,
  totalPages: number,
  hasNextPage: boolean,
  hasPreviousPage: boolean
}
```

### Common Mistakes:

❌ NEVER: `useState(0)`, `{ page: 0 }`, `page === 0`, `Math.max(0, ...)`
✅ ALWAYS: `useState(1)`, `{ page: 1 }`, `page === 1`, `Math.max(1, ...)`

## Adding a New API Endpoint

1. Add the route to `API_ROUTES` in `src/config/api-routes.ts`
2. Use `fetchApi(API_ROUTES.YOUR.ROUTE)` in your component
3. Match the response type to the backend DTO (types live in `src/types/`)
4. For paginated endpoints, send `{ page, limit }` in body and handle the pagination metadata

## Token Storage

Tokens are stored in **localStorage** (not cookies). The file is named `cookies.ts` for historical reasons but uses `localStorage` exclusively.

- `getToken()` / `setToken(token)`: access token
- `getRefreshToken()` / `setRefreshToken(token)`: refresh token
- `clearTokens()`: remove both
- `getActiveToken()`: the token currently in effect (accounts for system-admin access)
- Impersonation: `saveOriginalTokens()`, `getOriginalToken()`, `getOriginalRefreshToken()`, `clearOriginalTokens()`, `hasOriginalTokens()`
- System-admin org access: `setSystemAdminAccess()`, `isSystemAdminAccess()`, `getSystemAccessToken()`, `setSystemAccessToken()`, `clearSystemAccessToken()`

## Auto-Refresh Flow

The `fetchApi` client handles token refresh transparently:

1. Request returns 401
2. If refresh token exists and no refresh is in-flight, call `/auth/refresh`
3. If a refresh is already in-flight, queue the request (prevents thundering herd)
4. On success: store new tokens, retry original request
5. On failure: clear tokens, throw `ApiError(401)`

Session context also attempts refresh on app init when the access token is expired but refresh token exists.

## Session & Auth

- `useSession()` returns `{ user, organization, organizationConfig, userPreferences, pagePreferences, setUser, setOrganization, setOrganizationConfig, setUserPreferences, setPagePreferences, isLoading, isAuthenticated, isLoggingOut, logout, loadFullSession }`
- `SessionProvider` wraps the entire app in root layout
- On mount: decodes access token → if expired, tries refresh → sets user or clears tokens; `GET /users/me` fills organization, config and preferences
- `logout()` calls backend `/auth/logout`, clears tokens, redirects to `/`
- Auth screens: `/` (login), `/signup` (OTP signup stepper), `/forgot-password`, `/reset-password`, `/login/success` and `/oauth/callback` (OAuth returns), `/no-access`, `/no-access/pending`, `/no-access/suspended`

## Route Protection

```typescript
// Wrap protected layouts with AuthGuard
export default function DashboardLayout({ children }) {
  return <AuthGuard>{children}</AuthGuard>;
}

// Wrap permission-gated UI with PermissionGuard
<PermissionGuard permissions={PERMISSIONS_ENUM.ROLE_CREATE}>
  <Button>Create Role</Button>
</PermissionGuard>
```

`PermissionGuard` props: `permissions` (one or many), `requireAll?` (default any), `fallback?`.

## Permissions

- `usePermissions()` returns `{ hasPermission, hasAnyPermission, hasAllPermissions, getScope }`
- Permission constants re-exported from `@boilerplate/shared` in `src/constants/permissions.constants.ts`
- Available exports: `PERMISSIONS_ENUM`, `ALL_PERMISSIONS`, `PERMISSION_GROUPS`, `PERMISSION_BASE`, `PermissionScope`
- `NEXT_PUBLIC_DEV_BYPASS_PERMISSIONS=true` bypasses all permission checks in development
- Scope support: `getScope(PERMISSION_BASE.USER_LIST_READ)` returns `PermissionScope | null`
- NEVER hardcode scope strings (`'own'`, `'team'`, `'all'`). Use `PermissionScope.OWN`, `PermissionScope.TEAM`, `PermissionScope.ALL`
- NEVER hardcode base permission strings. Use `PERMISSION_BASE.USER_LIST_READ`, `PERMISSION_BASE.USER_UPDATE`, etc.

## Error Handling

- `fetchApi` throws `ApiError(message, statusCode)` on failures (`src/utils/error-class.ts`)
- Catch in components with try/catch, show toast:
  ```typescript
  try {
    await fetchApi(API_ROUTES.ROLES.CREATE, { method: 'POST', body: JSON.stringify(data) });
    toast.success('Role created');
  } catch (err: any) {
    toast.error(err.message || 'Something went wrong');
  }
  ```
- Error boundary (`src/components/error-boundary.tsx`) catches unhandled 401s, shows countdown, auto-logs out
- `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/dashboard/error.tsx` are route-level error screens
- `chunk-error-recovery.tsx` + `src/lib/chunk-reload.ts` reload the page once after a stale-deploy chunk load failure
- GlitchTip is initialised by `glitchtip-init.tsx` (`src/lib/glitchtip.ts`)

## Component Library

This project uses **shadcn/ui** (new-york style) with **Radix UI** primitives and **Tailwind CSS**.

- Config: `components.json` (style: `new-york`, base color: `zinc`)
- Add new components: `npx shadcn@latest add <component>`
- NEVER modify existing `src/components/ui/` files unless fixing a bug, these are shadcn-managed
- Icons: `lucide-react` (brand logos in `src/components/icons/brand-icons.tsx`)
- Class merging: `cn()` from `src/lib/utils.ts` (uses `clsx` + `tailwind-merge`)
- Variants: `class-variance-authority` (CVA), used in Button, Badge, etc.

### UI Primitives (`src/components/ui/`)

- **Layout**: `card`, `separator`, `tabs`, `scroll-area`, `accordion`, `collapsible`, `sheet`, `page-header`, `breadcrumb`
- **Forms**: `input`, `textarea`, `label`, `button`, `checkbox`, `select`, `multi-select`, `switch`, `toggle`, `calendar`, `date-picker`, `time-slot-select`, `phone-input`, `country-combobox`, `state-combobox`, `dynamic-tag-input`, `tag-input-with-suggestions`
- **Data Display**: `table`, `table-skeleton`, `list-page-skeleton`, `badge`, `avatar`, `initials-avatar`, `skeleton`, `progress`, `keyboard-shortcut`
- **Feedback**: `toast`, `toaster`, `use-toast`, `tooltip`, `alert-dialog`, `dialog`
- **Navigation**: `dropdown-menu`, `command`, `popover`
- **Status**: `status-select`

### Patterns (`src/components/patterns/`)

Reusable composites built on the primitives. Import from `@/components/patterns`. Live gallery at `/dashboard/components` (and `/dashboard/components/toolbars`), development only.

- `toolbar`: `FilterBar`, `SearchInput`, `SegmentedControl`, toolbar controls
- `data-table`: `DataTable` (TanStack Table), `DataTablePagination`, `DataTableToolbar`, `DataTableColumnToggle`, `StatusPill`, `AvatarStack`, `SortableHeader`, `RowActions`
- `data-grid`: `DataGrid` (+ `DataGridColumn`), `ColumnChooser`
- `detail-drawer`: side drawer for entity details
- `cards`: `EntityCard`, `SectionCard`, `SourceCard`
- `stats`: `StatTile`, `TrendStat`
- `charts`: chart wrappers, `FunnelChart`, `DeltaBadge`
- `analytics`, `kanban`, `timeline`, `rating` (`RatingStars`), `feedback` (`EmptyState`)

Before building a new table, toolbar, drawer, card or chart, check the patterns first.

### Feature Components

- `src/components/auth/`: `AuthGuard`, `PermissionGuard`, `DemoGuard`, `LoginForm`, `SignupForm`, `SignupStepper`, `GoogleLoginButton`, `ForgotPasswordForm`, `ResetPasswordForm`
- `src/components/dashboard/`: `DashboardHeader`, `DashboardNav`, `MobileNav`, `BrandLockup`, `ProtectedNavLink`, `NotificationsBell`, `WebPushToggle`, `SupportFooter`
- `src/components/common/`: `CommandPalette`, `KeyboardShortcutsHelp`, `DisplaySettings`, `SavedViewsBar`, `AssignedToFilter`, `StickyTab`
- `src/components/roles/`: `PermissionPicker`, `PermissionSection`, `PermissionSubGroup`, `ScopeSelector`, `NotificationDigestPanel`, `permission-ui-config.ts`
- `src/components/users/`: `CreateUserDialog`, `EditUserDialog`, `SetManagerDialog`, `UserHierarchy` (xyflow tree)
- `src/components/audit/`: `AuditLogView`
- `src/components/integrations/`: `ApiKeyConnectionDialog`
- `src/components/system/`: `SystemHeader`, `SystemNav`
- `src/components/skeletons/`: `SettingsPageSkeleton`
- HR product UI: `candidates/`, `jobs/`, `pipeline/`, `interviews/`, `offers/`, `agents/`, `reports/` (see Feature Pages)
- `src/components/error-boundary.tsx`: global error boundary with 401 auto-logout
- `src/components/theme-provider.tsx`: next-themes wrapper

---

## Feature Pages

### HR product pages (UI only, no backend yet)

These pages are built on the patterns library with local/sample data (`*-data.ts`, in-file constants, `agent-store.ts`). None of them call `fetchApi` yet; there are no backend modules for them. When wiring one up, add the backend module + `API_ROUTES` + types in the same change.

- **Dashboard** (`/dashboard`): overview widgets
- **Candidates** (`/dashboard/candidates`): `DataGrid` list, add-candidate drawer, candidate detail drawer (resume preview via `docx-viewer`)
- **Jobs** (`/dashboard/jobs`): job list + `JobFormDrawer`
- **Pipeline** (`/dashboard/pipeline`): kanban board per job (`PipelineBoard`, `PipelineCard`, `JobSummary`)
- **Interviews** (`/dashboard/interviews`): schedule drawer, scorecard form
- **Offers** (`/dashboard/offers`): offer list + `OfferFormDrawer`
- **Agents** (`/dashboard/agents`, `/dashboard/agents/new`): AI agent builder with flow preview and test run
- **Reports** (`/dashboard/reports`): executive, pipeline, sourcing, outcome, team, compliance reports
- **Help** (`/dashboard/help`)

### Settings (`/dashboard/settings`), backed by the API

- **General** (`/dashboard/settings/general`): account settings
- **Organization** (`/dashboard/settings/organization`): organization profile
- **Users** (`/dashboard/settings/users`): user list (`DataTable`), invite/create, edit, block/unblock, set manager, hierarchy view
- **Roles** (`/dashboard/settings/roles`, `/new`, `/edit?id=xxx`): role management with permission picker and scopes
- **Integrations** (`/dashboard/settings/integrations`): OAuth and API-key connections
- **Audit** (`/dashboard/settings/audit`): activity logs with filters

### System admin (`/system`)

For users of the system org: `/system`, `/system/organizations` (org list, status, access), `/system/organizations/create`. `/auth/system-access` completes the system-admin org access handoff (`useSystemAdminAccess`).

---

## Data Tables

- List pages use `DataTable` from `@/components/patterns` (TanStack Table under the hood, with `DataTablePagination`, `SortableHeader`, `RowActions`, `StatusPill`). Spreadsheet-like lists use `DataGrid`.
- For a small static table, the composable shadcn `Table` (`src/components/ui/table.tsx`) is fine:

```typescript
import {
  Table, TableHeader, TableBody, TableRow,
  TableHead, TableCell,
} from '@/components/ui/table';
```

### Loading State

Use `TableSkeleton` (`src/components/ui/table-skeleton.tsx`) or `ListPageSkeleton` as a placeholder while data loads.

### Pattern for List Pages

```typescript
const [data, setData] = useState<Item[]>([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  fetchApi<Item[]>(API_ROUTES.ITEMS.LIST)
    .then(setData)
    .finally(() => setIsLoading(false));
}, []);

if (isLoading) return <TableSkeleton />;

return (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {data.map((item) => (
        <TableRow key={item.id}>
          <TableCell>{item.name}</TableCell>
          <TableCell><Badge>{item.status}</Badge></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);
```

## React Query (TanStack Query v5)

Data fetching and caching via **TanStack React Query v5**.

### Setup

Query client configured in `src/providers/query-provider.tsx` (`QueryClientProvider`), mounted from the root layout.

### Query Hooks

Query hooks live in `src/hooks/queries/` (exported from `index.ts`):

- `use-notifications-query.ts`: `notificationsKeys`, `useNotificationsFeedQuery`, `useMarkNotificationReadMutation`, `useMarkAllNotificationsReadMutation`, `useSendTestNotificationMutation`

Add new hooks here, one file per resource, with a `<resource>Keys` factory for query keys.

### Patterns

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const { data, isLoading, error } = useQuery({
  queryKey: ['roles'],
  queryFn: () => fetchApi<Role[]>(API_ROUTES.ROLES.LIST),
});

const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: (data) => fetchApi(API_ROUTES.ROLES.CREATE, { method: 'POST', body: JSON.stringify(data) }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
});
```

### Pagination

- Use `initialPageParam: 1` (1-indexed, not 0)
- Use `useInfiniteQuery` for infinite scroll

---

## Forms (react-hook-form + zod)

All forms use **react-hook-form** with **zod v4** validation.

**IMPORTANT**: NEVER import `zodResolver` from `@hookform/resolvers/zod`, it doesn't support Zod v4 schemas. Always use the compatibility wrapper:

```typescript
// ❌ BAD - causes TS2769 overload error with Zod v4 schemas
import { zodResolver } from '@hookform/resolvers/zod';

// ✅ GOOD - Zod v4 compatible wrapper
import { zodResolver } from '@/lib/zod-resolver';
```

### Zod Schemas

Schemas live in `src/schemas/`:

- `auth.schema.ts`: `loginSchema`, `forgotPasswordSchema`, `resetPasswordSchema`, `sendOtpSchema`, `verifyOtpSchema`, `signupDetailsSchema`, `signupSchema`
- `user.schema.ts`: `inviteUserSchema`, `createUserSchema`, `editUserSchema`, `acceptInviteSchema`, `updateProfileSchema`
- `role.schema.ts`: `roleSchema`
- `organization.schema.ts`: `organizationSchema`, `addressSchema`, `invoiceSettingsSchema`, `pdfTemplateSchema`
- `helpers.ts`: `strongPasswordSchema`, `PASSWORD_REGEX`, `PASSWORD_COMPLEXITY_MESSAGE`, `optionalNumber`, `requiredNumber`

When adding a new form, create a schema in the appropriate file (or a new file in `src/schemas/`). Always export the inferred type alongside the schema:

```typescript
import { z } from 'zod/v4';

export const mySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email'),
});

export type MyFormData = z.infer<typeof mySchema>;
```

### Form Pattern

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zod-resolver';
import { mySchema, MyFormData } from '@/schemas/my.schema';

const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
} = useForm<MyFormData>({
  resolver: zodResolver(mySchema),
  defaultValues: { name: '', email: '' },
});

const onSubmit = async (data: MyFormData) => {
  await fetchApi(API_ROUTES.MY.CREATE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

return (
  <form onSubmit={handleSubmit(onSubmit)}>
    <Input {...register('name')} />
    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
    <Button type="submit" disabled={isSubmitting}>Submit</Button>
  </form>
);
```

### Controller Pattern (for non-native inputs)

Use `Controller` for components that don't support `ref` (like `PermissionPicker`, custom selects):

```typescript
import { Controller } from 'react-hook-form';

<Controller
  name="permissions"
  control={control}
  render={({ field }) => (
    <PermissionPicker
      selected={field.value}
      onChange={field.onChange}
    />
  )}
/>
```

### Form Rules

- NEVER use raw `useState` for form fields. Use `useForm` + zod
- NEVER use manual `isLoading` state for form submission. Use `isSubmitting` from `formState`
- Always provide `defaultValues` in `useForm`
- Use `reset()` to populate form with fetched data (edit pages)
- Show field errors with `errors.fieldName?.message`
- For cross-field validation (e.g. confirm password), use `.refine()` on the schema

## Component Conventions

- UI primitives in `src/components/ui/` (shadcn pattern, do not modify unless necessary)
- Reusable composites in `src/components/patterns/`
- Feature components in `src/components/<feature>/`
- Use `cn()` from `src/lib/utils.ts` for merging Tailwind classes
- Use `toast.success()`, `toast.error()`, `toast.info()` from `src/lib/toast.ts`
- Use `formatDateTime()`, `formatDate()` from `src/lib/utils.ts`
- Breadcrumbs are set with `useBreadcrumb()` from `src/contexts/breadcrumb-context.tsx` and rendered only by the dashboard header

## Key Utilities

### API & Data

- `fetchApi<T>(endpoint, options?)`: `src/utils/api-client.ts`
- `fetchApiBlob(endpoint, options?)`: binary responses (files, PDFs)
- `useSession()`: `src/contexts/session-context.tsx`
- `usePermissions()`: `src/hooks/use-permissions.ts`

### Contexts (`src/contexts/`)

- `SessionProvider` / `useSession`
- `BreadcrumbProvider` / `useBreadcrumb`, `useBreadcrumbContext`
- `SidebarProvider` / `useSidebar`
- `KeyboardProvider` / `useKeyboardContext`, `useKeyboardEnabled`, `useRegisteredShortcuts`, `useShortcutsByContext`
- `DisplayPrefsProvider` / `useDisplayPrefs` (text size etc., stored in localStorage)
- `FocusModeProvider` / `useFocusMode`
- `UnsavedChangesProvider` / `useUnsavedChanges`

### Hooks (`src/hooks/`)

- `useKeyboardShortcuts()`: multiple shortcuts with modifier keys; `useKeyboardShortcut()`: single shortcut; `formatShortcut()`
- `useArrowNavigation()`: generic list/grid navigation
- `useInfiniteScroll()`: intersection observer for lazy loading
- `useDebounce(value, delay)`: debounce any value
- `useSavedViews()`: saved list views backed by page preferences
- `useImpersonation()`: admin impersonation workflow
- `useSystemAdminAccess()`: system-admin org access flow
- `useAnalytics()`: OpenPanel event tracking

### Utility Files

- `src/lib/utils.ts`: `cn`, `formatDateTime`, `formatDate`, `generateAvatarColors`, `getInitials`, `getCurrencySymbol`, `formatCurrency`, `formatBytes`, `formatPhone`
- `src/lib/text.ts`: `formatFreeTextLabel`, `titleCaseTag`, `formatTagListDisplay`
- `src/lib/export-csv.ts`: `downloadCsv`, `CsvColumn`
- `src/lib/web-push.ts`: push support/permission/subscribe helpers
- `src/lib/form-utils.ts`: `getNumberFieldError()`
- `src/lib/zod-resolver.ts`: Zod v4 compatibility wrapper

## Dark Mode Styling

This app supports dark mode via `next-themes`. **Always include dark mode variants** when using custom colors.

### Rules

- NEVER use light-only backgrounds like `bg-blue-50` without a `dark:` variant
- NEVER use light-only text colors like `text-blue-600` without a `dark:` variant
- Use semantic colors (`text-muted-foreground`, `bg-muted`, `border-border`) when possible, they auto-adapt
- For custom status/badge colors, always pair light and dark variants (or use `StatusPill` tones)

### Pattern for Custom Color Badges

```typescript
// ❌ BAD - Only works in light mode
className="bg-blue-50 text-blue-600 border-blue-200"

// ✅ GOOD - Works in both modes
className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800"
```

### Color Pairing Guide

| Light Mode | Dark Mode |
|------------|-----------|
| `bg-*-50` | `dark:bg-*-950` |
| `text-*-600` | `dark:text-*-400` |
| `border-*-200` | `dark:border-*-800` |

### Example: Status Badge Config

```typescript
const STATUS_CONFIG = {
  active: {
    className: 'bg-green-50 text-green-600 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
  },
  pending: {
    className: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
  },
  inactive: {
    className: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  },
};
```

### Semantic Colors (Auto-Adapt)

Prefer these when you don't need specific status colors:
- `text-foreground` / `text-muted-foreground`
- `bg-background` / `bg-muted` / `bg-card`
- `border-border` / `border-input`
- `text-primary` / `text-destructive`

## Search Input Debouncing

All search inputs that trigger API calls MUST use debouncing to prevent excessive API requests on every keystroke.

### The Problem

Without debouncing, every keystroke in a search input triggers an immediate API call:

```typescript
const [search, setSearch] = useState('');

const loadData = useCallback(async () => {
  const body = { page: 1, limit: 10 };
  if (search) body.search = search;
  const data = await fetchApi(API_ROUTES.ITEMS.LIST, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}, [search]);

useEffect(() => {
  loadData();
}, [loadData]);
```

This causes:
- Excessive server load
- Poor user experience (constant loading states)
- Race conditions (responses may arrive out of order)
- Wasted API quota

### The Solution

Use the `useDebounce` hook from `src/hooks/use-debounce.ts`:

```typescript
import { useDebounce } from '@/hooks/use-debounce';

const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 500);

const loadData = useCallback(async () => {
  const body = { page: 1, limit: 10 };
  if (debouncedSearch) body.search = debouncedSearch;
  const data = await fetchApi(API_ROUTES.ITEMS.LIST, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}, [debouncedSearch]);

useEffect(() => {
  loadData();
}, [loadData]);
```

### Pattern Breakdown

1. **Import the hook**: `import { useDebounce } from '@/hooks/use-debounce';`
2. **Keep the original state**: `const [search, setSearch] = useState('');`
3. **Create debounced value**: `const debouncedSearch = useDebounce(search, 500);`
4. **Use debounced value in API calls**: `if (debouncedSearch) body.search = debouncedSearch;`
5. **Use debounced value in dependencies**: Include `debouncedSearch` in `useCallback` and `useEffect` dependencies, NOT `search`
6. **Bind original state to input**: `<Input value={search} onChange={(e) => setSearch(e.target.value)} />`

### Key Points

- **Delay**: Use 500ms for search inputs (good balance between responsiveness and reducing requests)
- **Original state for input**: The input should bind to the original `search` state for immediate visual feedback
- **Debounced value for API**: The API call should use the `debouncedSearch` value
- **Dependencies**: All callbacks and effects that trigger API calls must depend on the debounced value, NOT the original state
- **Reset pagination**: If resetting pagination on search change, use the debounced value there too

### Complete Example (with Pagination Reset)

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

function MyListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const debouncedSearch = useDebounce(search, 500);

  const loadData = useCallback(async () => {
    const body: Record<string, unknown> = { page, limit };
    if (debouncedSearch) body.search = debouncedSearch;
    if (statusFilter !== 'all') body.status = statusFilter;

    const data = await fetchApi(API_ROUTES.ITEMS.LIST, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }, [page, limit, debouncedSearch, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  return (
    <Input
      placeholder="Search..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  );
}
```

### When to Use Debouncing

✅ Search inputs that trigger API calls
✅ Autocomplete fields
✅ Filter inputs that trigger server-side filtering
✅ Any text input that triggers expensive operations

❌ Form inputs that don't trigger immediate API calls (validation only)
❌ Single-click actions (buttons, links)
❌ Select/dropdown changes (these are discrete, not continuous)

## Types (`src/types/`)

- `user.type.ts`: `UserStatus`, `User`, `Organization`, `JWTPayload` (`{ userId, email, organizationId, permissions[], firstName?, lastName? }`), `LoginResponse` (`{ accessToken, refreshToken, user, organization }`), `GoogleLoginResponse`, `UserDropdown`, `HierarchyUser`, `getFullName`
- `common.type.ts`: `UserBasic` (`{ id, firstName, lastName, email }` for dropdowns/assignments), `PaginatedResponse<T>`
- `pagination.type.ts`: `PaginatedResponse<T>` (`{ data: T[], page, limit, total, totalPages, hasNextPage, hasPreviousPage }`)
- `role.type.ts`: `Role` (`{ id, name, permissions[], organizationId, isDefault, createdAt, updatedAt }`), `RoleDropdown`
- `permissions.type.ts`: `Permission` (union of all `PERMISSIONS_ENUM` values)
- `organization.type.ts`: `Organization`, `OrganizationAddress`, `InvoiceSettings`, `UpdateOrganizationRequest`, feature controls
- `organization-config.type.ts`: `OrganizationConfigType`, `ConfigItem`, `OrganizationConfig`
- `integration.type.ts`: `IntegrationCategory`, `IntegrationAuthType`, `IntegrationStatus`, `IntegrationListItem`, `SaveCredentialsResponse`, `HealthCheckResponse`
- `notification.ts`: `NotificationPriority`, `NotificationFeedItem`, `NotificationFeedResponse`
- `session.ts`: `ActiveSession`
- `page-preferences.type.ts`: `SavedView`, `PagePreference`, `PagePreferences`

`PaginatedResponse<T>` is declared in both `common.type.ts` and `pagination.type.ts`; prefer `pagination.type.ts` for new code.

## Environment Variables

- `NEXT_PUBLIC_API_URL`: backend base URL (default: `http://localhost:4000`)
- `NEXT_PUBLIC_DEV_BYPASS_PERMISSIONS`: set to `'true'` to bypass permission checks
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Google sign-in
- `NEXT_PUBLIC_GLITCHTIP_DSN`, `NEXT_PUBLIC_GLITCHTIP_ENV`: error reporting
- `NEXT_PUBLIC_OPENPANEL_DASHBOARD_CLIENT_ID`: analytics
- `NEXT_PUBLIC_APP_VERSION`: build version shown in the app

## Linting

- ESLint with `next/core-web-vitals`, `next/typescript`, and `prettier`
- Run: `pnpm --filter frontend lint`
- TypeScript: `pnpm --filter frontend exec tsc --noEmit`
