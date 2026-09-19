# Frontend Guidelines

## Stack

- Next.js 15 with static export (`output: "export"`) — fully client-side rendered
- Radix UI + shadcn components with Tailwind CSS
- class-variance-authority (CVA) for component variants
- next-themes for dark mode

## Hard Rules

- Every page and interactive component MUST use `'use client'`
- NEVER use `'use server'`, `cookies()` from `next/headers`, or Next.js API routes
- NEVER change `output: "export"` or `images.unoptimized: true` in `next.config.ts`
- Components using `useSearchParams()` MUST be wrapped in `<Suspense>`
- Auth protection via `AuthGuard` component, NEVER middleware
- NEVER hardcode API URLs — use `API_ROUTES` from `src/config/api-routes.ts`
- NEVER use raw `fetch` for authenticated API calls — use `fetchApi()` from `src/utils/api-client.ts`
- NEVER read/write tokens directly — use `getToken()`, `setToken()`, etc. from `src/utils/cookies.ts`
- NEVER use dynamic routes (e.g. `[id]` folders) — static export does not support them. Use query params instead (e.g. `/roles/edit?id=xxx` instead of `/roles/[id]/edit`)

## API Calls

There are two ways to make API calls. Know when to use which:

**`fetchApi(endpoint, options)`** — for all authenticated/data calls:
- Automatically attaches Bearer token from localStorage
- Automatically handles 401 → refresh token → retry
- Automatically unwraps `{ data: T }` response wrapper
- Pass `API_ROUTES.X.Y` directly (fetchApi prepends `API_URL` internally)

```typescript
const roles = await fetchApi<Role[]>(API_ROUTES.ROLES.LIST);
await fetchApi(API_ROUTES.ROLES.DELETE(id), { method: 'DELETE' });
```

**`fetch(buildApiUrl(route), options)`** — only for unauthenticated calls (login, register) or calls that bypass the refresh flow (session context refresh/logout):

```typescript
const response = await fetch(buildApiUrl(API_ROUTES.AUTH.LOGIN), { ... });
```

**NEVER combine both**: `fetchApi(buildApiUrl(...))` causes double URL prefix.

## API Routes Reference

All routes are defined in `src/config/api-routes.ts`. Here's what exists:

**Auth** (unauthenticated — use `fetch(buildApiUrl(...))`)
- `AUTH.LOGIN` — `POST /auth/login`
- `AUTH.REGISTER` — `POST /auth/register`
- `AUTH.REFRESH` — `POST /auth/refresh`
- `AUTH.LOGOUT` — `POST /auth/logout`
- `AUTH.FORGOT_PASSWORD` — `POST /auth/reset/request`
- `AUTH.RESET_PASSWORD` — `POST /auth/reset`
- `AUTH.UPDATE_PASSWORD` — `POST /auth/update-password`

**Users** (authenticated — use `fetchApi(...)`)
- `USERS.ME` — `GET /users/me`
- `USERS.PROFILE` — `PUT /users/profile`
- `USERS.LIST` — `POST /users/list` — **paginated**, body: `{ page, limit, status?, search? }`
- `USERS.INVITE` — `POST /users/invite`
- `USERS.RESEND_INVITE` — `POST /users/resend-invite`
- `USERS.UPDATE(id)` — `PUT /users/:id`
- `USERS.BLOCK(id)` — `POST /users/:id/block`
- `USERS.UNBLOCK(id)` — `POST /users/:id/unblock`

**Roles** (authenticated — use `fetchApi(...)`)
- `ROLES.LIST` — `GET /roles` — **not paginated**, returns all roles
- `ROLES.CREATE` — `POST /roles`
- `ROLES.GET(id)` — `GET /roles/:id`
- `ROLES.UPDATE(id)` — `PUT /roles/:id`
- `ROLES.DELETE(id)` — `DELETE /roles/:id`

**Leads** (authenticated)
- `LEADS.LIST` — `POST /leads/list` — **paginated**, body: `{ page, limit, status?, source?, assignedTo?, search? }`
- `LEADS.CREATE` — `POST /leads`
- `LEADS.GET(id)` — `GET /leads/:id`
- `LEADS.UPDATE(id)` — `PUT /leads/:id`
- `LEADS.UPDATE_STATUS(id)` — `PATCH /leads/:id/status`
- `LEADS.ASSIGN(id)` — `POST /leads/:id/assign`
- `LEADS.DELETE(id)` — `DELETE /leads/:id`

**Clients** (authenticated)
- `CLIENTS.LIST` — `POST /clients/list` — **paginated**, body: `{ page, limit, status?, assignedTo?, search? }`
- `CLIENTS.CREATE` — `POST /clients`
- `CLIENTS.GET(id)` — `GET /clients/:id`
- `CLIENTS.UPDATE(id)` — `PUT /clients/:id`
- `CLIENTS.UPDATE_STATUS(id)` — `PATCH /clients/:id/status`
- `CLIENTS.ASSIGN(id)` — `POST /clients/:id/assign`
- `CLIENTS.CONVERT_FROM_LEAD` — `POST /clients/convert-from-lead`

**Foods** (authenticated)
- `FOODS.LIST` — `POST /foods/list` — **paginated**, body: `{ page, limit, category?, search? }`
- `FOODS.CREATE` — `POST /foods`
- `FOODS.GET(id)` — `GET /foods/:id`
- `FOODS.UPDATE(id)` — `PUT /foods/:id`
- `FOODS.DELETE(id)` — `DELETE /foods/:id`

**Diet Templates** (authenticated)
- `DIET_TEMPLATES.LIST` — `POST /diet-templates/list` — **paginated**, body: `{ page, limit, tags?, search? }`
- `DIET_TEMPLATES.CREATE` — `POST /diet-templates`
- `DIET_TEMPLATES.GET(id)` — `GET /diet-templates/:id`
- `DIET_TEMPLATES.UPDATE(id)` — `PUT /diet-templates/:id`
- `DIET_TEMPLATES.DELETE(id)` — `DELETE /diet-templates/:id`

**Client Diet** (authenticated)
- `CLIENT_DIET.CREATE` — `POST /client-diet` — save single diet day
- `CLIENT_DIET.BULK_CREATE` — `POST /client-diet/bulk` — save multiple days
- `CLIENT_DIET.LIST` — `POST /client-diet/list` — **paginated** diet days for client
- `CLIENT_DIET.GET_BY_DATE(contactId, date)` — `GET /client-diet/:contactId/:date`
- `CLIENT_DIET.DELETE(contactId, date)` — `DELETE /client-diet/:contactId/:date`
- `CLIENT_DIET.EXPORT_PDF` — `POST /client-diet/export-pdf`

**Vitals** (authenticated)
- `VITALS.RECORD` — `POST /vitals` — record single vital
- `VITALS.RECORD_BULK` — `POST /vitals/bulk` — record multiple vitals
- `VITALS.LIST` — `POST /vitals/list` — **paginated**, body: `{ page, limit, contactId, vitalType? }`
- `VITALS.CHART` — `POST /vitals/chart` — get chart data for visualization
- `VITALS.LATEST(contactId)` — `GET /vitals/latest/:contactId`
- `VITALS.GET(id)` — `GET /vitals/:id`
- `VITALS.UPDATE(id)` — `PUT /vitals/:id`
- `VITALS.DELETE(id)` — `DELETE /vitals/:id`

**Subscriptions** (authenticated)
- `SUBSCRIPTIONS.LIST` — `POST /subscriptions/list` — **paginated**, body: `{ page, limit, clientId?, status? }`
- `SUBSCRIPTIONS.CREATE` — `POST /subscriptions`
- `SUBSCRIPTIONS.GET(id)` — `GET /subscriptions/:id`
- `SUBSCRIPTIONS.UPDATE(id)` — `PUT /subscriptions/:id`
- `SUBSCRIPTIONS.DELETE(id)` — `DELETE /subscriptions/:id`
- `SUBSCRIPTIONS.RECORD_PAYMENT(id)` — `POST /subscriptions/:id/payments`
- `SUBSCRIPTIONS.LIST_PAYMENTS(id)` — `GET /subscriptions/:id/payments`

**Payments** (authenticated)
- `PAYMENTS.UPDATE(id)` — `PUT /payments/:id`
- `PAYMENTS.DELETE(id)` — `DELETE /payments/:id`

**Contact Activities** (authenticated)
- `CONTACT_ACTIVITIES.LIST` — `POST /contact-activities/list` — **paginated**, body: `{ page, limit, contactId, activityType? }`
- `CONTACT_ACTIVITIES.CREATE` — `POST /contact-activities`

**Integrations** (authenticated)
- `INTEGRATIONS.LIST` — `GET /integrations`
- `INTEGRATIONS.CONNECT(provider)` — `POST /integrations/:provider/connect`
- `INTEGRATIONS.DISCONNECT(provider)` — `DELETE /integrations/:provider`

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

When the backend wraps in `{ data: T }`, `fetchApi` unwraps it automatically. But for paginated responses that return `{ data: T[], page, total, ... }`, the outer `{ data: ... }` is unwrapped by fetchApi, so you receive `{ data: T[], page, total, ... }` — the inner `data` field is the actual array.

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
3. Match the response type to the backend DTO
4. For paginated endpoints, send `{ page, limit }` in body and handle the pagination metadata

## Token Storage

Tokens are stored in **localStorage** (not cookies). The file is named `cookies.ts` for historical reasons but uses `localStorage` exclusively.

- `getToken()` / `setToken(token)` — access token
- `getRefreshToken()` / `setRefreshToken(token)` — refresh token
- `clearTokens()` — remove both

## Auto-Refresh Flow

The `fetchApi` client handles token refresh transparently:

1. Request returns 401
2. If refresh token exists and no refresh is in-flight, call `/auth/refresh`
3. If a refresh is already in-flight, queue the request (prevents thundering herd)
4. On success: store new tokens, retry original request
5. On failure: clear tokens, throw `ApiError(401)`

Session context also attempts refresh on app init when the access token is expired but refresh token exists.

## Session & Auth

- `useSession()` — returns `{ user, setUser, isLoading, isAuthenticated, logout }`
- `SessionProvider` wraps the entire app in root layout
- On mount: decodes access token → if expired, tries refresh → sets user or clears tokens
- `logout()` calls backend `/auth/logout`, clears tokens, redirects to `/`

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

## Permissions

- `usePermissions()` — returns `{ hasPermission, hasAnyPermission, hasAllPermissions, getScope }`
- Permission constants re-exported from `@boilerplate/shared` in `src/constants/permissions.constants.ts`
- Available exports: `PERMISSIONS_ENUM`, `ALL_PERMISSIONS`, `PERMISSION_GROUPS`, `PERMISSION_BASE`, `PermissionScope`
- `NEXT_PUBLIC_DEV_BYPASS_PERMISSIONS=true` bypasses all permission checks in development
- Scope support: `getScope(PERMISSION_BASE.CLIENT_LIST_READ)` returns `PermissionScope | null`
- NEVER hardcode scope strings (`'own'`, `'team'`, `'all'`) — use `PermissionScope.OWN`, `PermissionScope.TEAM`, `PermissionScope.ALL`
- NEVER hardcode base permission strings — use `PERMISSION_BASE.CLIENT_LIST_READ`, `PERMISSION_BASE.LEAD_UPDATE`, etc.

## Error Handling

- `fetchApi` throws `ApiError(message, statusCode)` on failures
- Catch in components with try/catch, show toast:
  ```typescript
  try {
    await fetchApi(API_ROUTES.ROLES.CREATE, { method: 'POST', body: JSON.stringify(data) });
    toast.success('Role created');
  } catch (err: any) {
    toast.error(err.message || 'Something went wrong');
  }
  ```
- Error boundary catches unhandled 401s, shows countdown, auto-logs out

## Component Library

This project uses **shadcn/ui** (new-york style) with **Radix UI** primitives and **Tailwind CSS**.

- Config: `components.json` (style: `new-york`, base color: `zinc`)
- Add new components: `npx shadcn@latest add <component>`
- NEVER modify existing `src/components/ui/` files unless fixing a bug — these are shadcn-managed
- Icons: `lucide-react`
- Class merging: `cn()` from `src/lib/utils.ts` (uses `clsx` + `tailwind-merge`)
- Variants: `class-variance-authority` (CVA) — used in Button, Badge, etc.

### Available UI Components

All in `src/components/ui/`:

- **Layout**: `card`, `separator`, `tabs`, `scroll-area`
- **Forms**: `input`, `label`, `button`, `checkbox`, `select`, `multi-select`, `switch`
- **Data Display**: `table`, `table-skeleton`, `badge`, `avatar`, `skeleton`
- **Feedback**: `toast`, `toaster`, `tooltip`, `alert-dialog`, `dialog`
- **Navigation**: `dropdown-menu`, `command`, `popover`
- **Status**: `status-select`

### Feature Components

- `src/components/auth/` — `AuthGuard`, `PermissionGuard`, `LoginForm`, `ForgotPasswordForm`, `ResetPasswordForm`
- `src/components/dashboard/` — `DashboardContent`, `DashboardHeader`, `DashboardNav`
- `src/components/roles/` — `PermissionPicker`
- `src/components/leads/` — `LeadForm`, `CreateLeadDialog`, `EditLeadDialog`, `ViewLeadDialog`, `LeadStatusSelect`, `ConvertToClientDialog`
- `src/components/clients/` — `ClientForm`, `ClientProfileHeader`, `ClientStatusBadge`, dialogs, tab components (OverviewTab, DietPlansTab, VitalsTab, SubscriptionsTab, CounsellingTab, FollowupsTab)
- `src/components/foods/` — `FoodForm`, `CreateFoodDialog`, `EditFoodDialog`, `ViewFoodDialog`
- `src/components/diet-templates/` — `DietGrid`, `DietTemplateForm`, `MealCell`, `AddFoodDialog`
- `src/components/vitals/` — `RecordVitalsDialog`, `EditVitalDialog`, `DeleteVitalDialog`, `LatestVitalsCard`, `VitalsHistoryTable`, `VitalsProgressChart`
- `src/components/error-boundary.tsx` — global error boundary with 401 auto-logout
- `src/components/theme-provider.tsx` — next-themes wrapper

---

## Feature Pages

### Dashboard Overview (`/dashboard`)
Main dashboard with summary widgets and quick actions.

### Leads (`/dashboard/leads`)
Lead management with table listing, status filters, search, and assignment. Components: create/edit/view dialogs, convert-to-client flow.

### Clients (`/dashboard/clients`)
Client list with status badges and filtering.

**Client Details** (`/dashboard/clients/details?id=xxx`) — Tabbed interface:
- **Overview** — Profile info, health context panel, activity timeline
- **Diet Plans** — Diet grid editor, template import, PDF export
- **Vitals** — Record vitals, view history table, progress charts
- **Subscriptions** — Manage subscriptions, record payments
- **Counselling** — First consultation tracking
- **Follow-ups** — Recurring session management

### Food Database (`/dashboard/food-database`)
Food item management with nutrition data (calories, protein, carbs, fat, fiber). Search and category filtering.

### Diet Templates (`/dashboard/diet-templates`)
Reusable 7-day diet plan templates.

- **List** — Template cards with tags
- **New** (`/dashboard/diet-templates/new`) — Create template with meal grid
- **Edit** (`/dashboard/diet-templates/edit?id=xxx`) — Edit existing template
- **View** (`/dashboard/diet-templates/view?id=xxx`) — Read-only template view

**Diet Grid Interface**: 7 columns (days) × 4 rows (breakfast, lunch, dinner, snacks). Each cell shows food items with quantities. Add food via search dialog.

### Reports (`/dashboard/reports`)
Analytics and reporting dashboard.

### Settings (`/dashboard/settings`)

- **General** (`/dashboard/settings/general`) — Organization settings
- **Users** (`/dashboard/settings/users`) — User list, invite users, block/unblock
- **Roles** (`/dashboard/settings/roles`) — Role management with permission picker
- **Integrations** (`/dashboard/settings/integrations`) — OAuth connections (Google Calendar, etc.)
- **Audit** (`/dashboard/settings/audit`) — Activity logs with filters

---

## Data Tables

Tables use the composable shadcn `Table` component (`src/components/ui/table.tsx`), NOT a third-party data table library.

### Table Components

```typescript
import {
  Table, TableHeader, TableBody, TableRow,
  TableHead, TableCell,
} from '@/components/ui/table';
```

### Loading State

Use `TableSkeleton` from `src/components/ui/table-skeleton.tsx` as a placeholder while data loads.

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

Query client configured in `src/app/providers.tsx`. Wrap app with `QueryClientProvider`.

### Query Hooks

All query hooks live in `src/hooks/queries/`:

- `useVitalsQuery` — vitals CRUD with chart data
- `useActivitiesQuery` — infinite scroll for contact activities
- `useCounsellingQuery` — counselling sessions
- `useAttachmentsQuery` — file attachments
- `useSubscriptionsQuery` — subscription management
- `useFoodTagsQuery` — food tag autocomplete
- `useClientDietQuery` — diet day management
- `useFoodFacetsQuery` — Typesense facet counts
- `useDietTemplatesQuery` — diet template search
- `useTransformationsQuery` — client transformations

### Patterns

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const { data, isLoading, error } = useQuery({
  queryKey: ['vitals', contactId],
  queryFn: () => fetchApi<Vital[]>(API_ROUTES.VITALS.LIST),
});

const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: (data) => fetchApi(API_ROUTES.VITALS.RECORD, { method: 'POST', body: JSON.stringify(data) }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vitals'] }),
});
```

### Pagination

- Use `initialPageParam: 1` (1-indexed, not 0)
- Use `useInfiniteQuery` for infinite scroll

---

## Typesense Search Integration

Full-text search via Typesense with scoped API keys.

### Client Setup (`src/lib/typesense.ts`)

- `getTypesenseClient(collection?)` — get cached Typesense client
- Search key expires after 5 minutes, auto-refreshes
- Retry logic on 401 (expired key) errors

### Search Functions

```typescript
import { searchTypesense, searchTypesenseWithMeta, getTypesenseFacets } from '@/lib/typesense';

const results = await searchTypesense<Food>('foods', query, { limit: 10 });
const { hits, found } = await searchTypesenseWithMeta<Food>('foods', query);
const facets = await getTypesenseFacets('foods', 'dietType');
```

### Search Hooks (`src/hooks/use-typesense-search.ts`)

```typescript
import { useTypesenseSearch, useTypesenseSearchInfinite, useTypesenseFacets } from '@/hooks/use-typesense-search';

const { results, isLoading } = useTypesenseSearch<Food>('foods', query, { limit: 15, debounceMs: 500 });
const { results, hasMore, found } = useTypesenseSearchInfinite<Food>('foods', query, { page });
const { facets } = useTypesenseFacets('foods', 'cuisine');
```

### Collections

- `foods` — food items (queryBy: `name,description,tags`)
- `recipes` — recipes (queryBy: `title,description,tags`)
- `diet-templates` — templates (queryBy: `name,description,tags`)

---

## Forms (react-hook-form + zod)

All forms use **react-hook-form** with **zod v4** validation.

**IMPORTANT**: NEVER import `zodResolver` from `@hookform/resolvers/zod` — it doesn't support Zod v4 schemas. Always use the compatibility wrapper:

```typescript
// ❌ BAD - causes TS2769 overload error with Zod v4 schemas
import { zodResolver } from '@hookform/resolvers/zod';

// ✅ GOOD - Zod v4 compatible wrapper
import { zodResolver } from '@/lib/zod-resolver';
```

### Zod Schemas

Schemas live in `src/schemas/`:

- `auth.schema.ts` — `loginSchema`, `forgotPasswordSchema`, `resetPasswordSchema`
- `role.schema.ts` — `roleSchema`

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
    {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
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

- NEVER use raw `useState` for form fields — use `useForm` + zod
- NEVER use manual `isLoading` state for form submission — use `isSubmitting` from `formState`
- Always provide `defaultValues` in `useForm`
- Use `reset()` to populate form with fetched data (edit pages)
- Show field errors with `errors.fieldName?.message`
- For cross-field validation (e.g. confirm password), use `.refine()` on the schema

## Component Conventions

- UI primitives in `src/components/ui/` (shadcn pattern — do not modify unless necessary)
- Feature components in `src/components/<feature>/`
- Use `cn()` from `src/lib/utils.ts` for merging Tailwind classes
- Use `toast.success()`, `toast.error()`, `toast.info()` from `src/lib/toast.ts`
- Use `formatDateTime()`, `formatDate()` from `src/lib/utils.ts`

## Key Utilities

### API & Data

- `fetchApi<T>(endpoint, options?)` — `src/utils/api-client.ts`
- `fetchApiBlob(endpoint, options?)` — binary response handling for PDFs
- `useSession()` — `src/contexts/session-context.tsx`
- `usePermissions()` — `src/hooks/use-permissions.ts`

### Keyboard Navigation Hooks

- `useKeyboardShortcuts()` — multiple shortcuts with modifier keys
- `useKeyboardShortcut()` — single shortcut
- `useDietGridNavigation()` — 2D grid navigation for diet editor
- `useArrowNavigation()` — generic list/grid navigation
- `useInfiniteScroll()` — intersection observer for lazy loading

### Advanced Hooks

- `useClientDiet(contactId)` — diet management with save/export
- `useImpersonation()` — admin impersonation workflow
- `useDebounce(value, delay)` — debounce any value

### Utility Files

- `src/utils/nutrition-colors.ts` — `MACRO_COLORS` with dark mode variants
- `src/utils/diet-compatibility.ts` — dietary restriction checking
- `src/lib/form-utils.ts` — `getNumberFieldError()`
- `src/lib/zod-resolver.ts` — Zod v4 compatibility wrapper

## Dark Mode Styling

This app supports dark mode via `next-themes`. **Always include dark mode variants** when using custom colors.

### Rules

- NEVER use light-only backgrounds like `bg-blue-50` without a `dark:` variant
- NEVER use light-only text colors like `text-blue-600` without a `dark:` variant
- Use semantic colors (`text-muted-foreground`, `bg-muted`, `border-border`) when possible — they auto-adapt
- For custom status/badge colors, always pair light and dark variants

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
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const debouncedSearch = useDebounce(search, 500);

  const loadData = useCallback(async () => {
    const body = {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    };
    if (debouncedSearch) body.search = debouncedSearch;
    if (statusFilter !== 'all') body.status = statusFilter;

    const data = await fetchApi(API_ROUTES.ITEMS.LIST, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
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

## Types

**Core Types**
- `JWTPayload` — decoded access token: `{ userId, email, organizationId, permissions[], firstName?, lastName? }`
- `LoginResponse` — `{ accessToken, refreshToken, user, organization }`
- `Role` — `{ id, name, permissions[], organizationId, isDefault, createdAt, updatedAt }`
- `PaginatedResponse<T>` — `{ data: T[], page, limit, total, totalPages, hasNextPage, hasPreviousPage }`
- `Permission` — union type of all `PERMISSIONS_ENUM` values
- `UserBasic` — `{ id, firstName, lastName, email }` for dropdowns/assignments

**Lead Types** (`src/types/lead.ts`)
- `LeadStatus` — new, contacted, qualified, unqualified, converted, lost
- `LeadSource` — website, referral, social_media, advertisement, walk_in, other
- `Lead` — full lead object with contact info, status, source, assignedTo
- `LeadListResponse` — paginated response with Lead[]

**Client Types** (`src/types/client.ts`)
- `Gender` — male, female, other
- `DietaryPreference` — vegetarian, non_vegetarian, vegan, eggetarian
- `Client` — full client with health profile (age, weight, height, conditions, allergies)
- `ClientListResponse` — paginated response with Client[]

**Food Types** (`src/types/food.ts`)
- `FoodItem` — name, category, calories, protein, carbs, fat, fiber, servingSize, servingUnit
- `FoodListResponse` — paginated response with FoodItem[]

**Diet Template Types** (`src/types/diet-template.ts`)
- `MealItem` — foodId, foodName, quantity, unit, calories, protein, carbs, fat
- `Meal` — array of MealItem (breakfast, lunch, dinner, snacks)
- `DietDay` — dayNumber, meals object with breakfast/lunch/dinner/snacks
- `DietTemplate` — name, description, tags, days[]
- `DietTemplateListResponse` — paginated response

**Client Diet Types** (`src/types/client-diet.ts`)
- `ClientDietMeal` — meal items for a specific meal slot
- `ClientDietDay` — contactId, date, meals, totals (calories, protein, carbs, fat)
- `SaveDietDaysBulkRequest` — bulk save request shape

**Vital Types** (`src/types/vital.ts`)
- `VitalType` — weight, height, bmi, body_fat, blood_pressure_systolic, blood_pressure_diastolic, blood_sugar_fasting, blood_sugar_pp, waist, hip, chest, arm
- `Vital` — id, contactId, vitalType, value, unit, recordedAt
- `VitalChartPoint` — date, value for chart visualization
- `RecordVitalRequest`, `RecordVitalsBulkRequest` — request shapes

**Subscription Types** (`src/types/subscription.ts`)
- `SubscriptionStatus` — active, paused, expired, cancelled
- `PaymentMode` — cash, upi, card, bank_transfer, other
- `Subscription` — clientId, planName, amount, startDate, endDate, status, payments[]
- `Payment` — subscriptionId, amount, paymentMode, paidAt

**Contact Activity Types** (`src/types/contact-activity.ts`)
- `ActivityType` — note, call, email, meeting, status_change, assignment, subscription_created, diet_plan_created, vital_recorded, etc.
- `ContactActivity` — contactId, activityType, title, description, metadata, createdBy, createdAt

## Environment Variables

- `NEXT_PUBLIC_API_URL` — backend base URL (default: `http://localhost:4000`)
- `NEXT_PUBLIC_DEV_BYPASS_PERMISSIONS` — set to `'true'` to bypass permission checks

## Linting

- ESLint with `next/core-web-vitals`, `next/typescript`, and `prettier`
- Run: `pnpm --filter frontend lint`
- TypeScript: `pnpm --filter frontend exec tsc --noEmit`
