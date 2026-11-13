# Backend Guidelines

## Stack

- NestJS 11 with TypeORM + PostgreSQL
- JWT authentication with access/refresh token rotation and per-device sessions
- BullMQ (Redis) queues, `@nestjs/event-emitter` domain events, `@nestjs/schedule` crons, `@nestjs/throttler` rate limiting
- Sentry for error reporting
- `@boilerplate/core` for shared commands, utilities, and services (re-exports `@boilerplate/shared`)

## Path Aliases

Use these TypeScript path aliases instead of verbose relative imports (`../../../`):

| Alias | Maps To | Use For |
|-------|---------|---------|
| `@db/*` | `./src/database/*` | Entities, repositories, enums |
| `@modules/*` | `./src/modules/*` | Feature modules |
| `@shared/*` | `./src/modules/shared/*` | Decorators, guards, commands, helpers |

**Examples**:
- `import { UserEntity } from '@db/entities'` instead of `../../../database/entities`
- `import { RequirePermissions } from '@shared/decorators'` instead of `../../shared/decorators`
- `import { AuthService } from '@modules/auth/services/auth.service'` instead of `../../../modules/auth/services/auth.service`

## Hard Rules

- All endpoints versioned under `/api/v1/`
- All responses wrapped in `{ data: T }` by `ResponseInterceptor`. NEVER wrap manually
- NEVER call `TypeOrmModule.forFeature()` in feature modules. The global `DatabaseModule` handles it
- NEVER write business logic in controllers. Use the command/usecase pattern
- NEVER hardcode secrets. Use `ConfigService` and `.env` files
- NEVER skip validation. Commands MUST use class-validator decorators
- Every protected endpoint MUST use `@RequireAuthentication()` or `@RequirePermissions()`
- Redis cache keys for org-scoped data MUST start with `organizationId` as the FIRST segment (e.g. `${organizationId}:team:descendants:${userId}`), so tenant isolation holds and all of an org's cache is scannable via `organizationId:*`. Never key solely on a userId or entity id, and never bury `organizationId` in the middle/end of the key. Invalidation helpers MUST take and pass `organizationId` too. Key builders and TTLs live in `src/modules/shared/cache-keys.ts` (`CACHE_KEYS`, `CACHE_TTL`).
- ALWAYS think about the WORKER process in parallel with the API. The backend runs as **two processes off the same image**: the API (`app.module.ts`) and a separate worker (`worker.module.ts`). They have **independent module graphs, DI containers, and in-process `EventEmitter2` buses.** When adding or changing anything, ask: "does the worker also need this?" See the checklist below before considering a change complete.

## Logging

### Request Context (AsyncLocalStorage)

Every HTTP request gets a `RequestContext` via `AsyncLocalStorage`, initialized by `RequestIdMiddleware`:
- `reqId`: unique `req_<id>` per request, also returned as `X-Request-ID` response header
- `userId`, `email`, `organizationId`, `clientId`: enriched by `LoggingInterceptor` after auth

### ContextLogger

Use `ContextLogger` instead of NestJS `Logger` when you want log lines to include request context automatically:

```typescript
import { ContextLogger } from '@shared/framework/context-logger';

export class MyUsecase {
  private readonly logger = new ContextLogger(MyUsecase.name);

  async execute(command: MyCommand) {
    this.logger.warn('Something happened');
    // Output: [req_abc123 user=xyz org=def] Something happened
  }
}
```

`ContextLogger` is a drop-in replacement for `Logger` (same API), it just adds the `[reqId user=x org=y]` prefix from AsyncLocalStorage context.

### JSON logs in production (Grafana/Loki)

In production (`NODE_ENV=production`) both the API and worker use `JsonLogger` (`@shared/framework/json-logger`), set via the `logger` option in `main.ts` / `worker.ts`. Every log line is emitted as single-line JSON so Loki/Grafana can query structured fields instead of regex-scraping strings:

```json
{"time":"...","level":"warn","context":"LoggingInterceptor","message":"← POST /api/v1/auth/login (req_x) - 429 (11ms)","reqId":"req_x","userId":"...","organizationId":"...","method":"POST","path":"/api/v1/auth/login","statusCode":429,"durationMs":11}
```

- `reqId`, `userId`/`clientId`, `organizationId` are auto-injected from the AsyncLocalStorage request context on EVERY log, no call-site changes needed.
- `LoggingInterceptor` additionally attaches flat `method`/`path`/`statusCode`/`durationMs` fields (prod only) so the error-rate and slow-request dashboards query real numbers.
- Errors go to `stderr`, everything else to `stdout`; both are captured by Promtail.
- In development the logger is unchanged (human-readable NestJS `ConsoleLogger`), the interceptor skips the structured meta so dev output is identical to before.
- Prod log levels: `log`, `warn`, `error` (debug/verbose suppressed).

### Slow Query Logging

TypeORM logs queries exceeding `maxQueryExecutionTime` (500ms dev, 1000ms prod). Production also logs errors and warnings.

### Log Viewer

Dozzle at `https://logs.rabbithr.co`: real-time searchable container logs (credentials are kept outside the repo). Docker log rotation: 3 files x 10MB per container (~2-3 days retention).

## Dual-Process Architecture (API + Worker)

The API and the worker are **separate processes** with separate module trees:

- **API** (`app.module.ts`): serves HTTP, emits domain events, runs crons and `@OnEvent` listeners registered in modules it imports. Imports `DatabaseModule`, `SharedModule`, `EventsModule`, `AuthModule`, `UserModule`, `RoleModule`, `AuditModule`, `StorageModule`, `IntegrationModule`, `OrganizationModule`, `OrganizationConfigModule`, `SystemAdminModule`, `UserNotificationsModule`, `QueueModule`, `SessionModule`.
- **Worker** (`worker.module.ts`, started with `start:worker`): runs BullMQ processors only. Imports a **subset**: `DatabaseModule`, `QueueModule`, `NotificationsCoreModule`. It does NOT import feature modules, `EventsModule`, or their listeners.

Consequences you MUST account for:

- **`@OnEvent` listeners only fire in the process where their module is loaded.** An event emitted in the API is NOT seen by the worker (different `EventEmitter2` instance), and vice-versa. If a producer runs in the worker (a queue processor) but the listener only lives in an API-imported module, the listener never runs.
- **A service (and its config/env) only exists where its module is imported.** `NotificationsCoreModule` (`NotificationDispatcher`, `WebPushService`, in-app + web-push channels) is `@Global()` and loaded by BOTH processes, so VAPID env is needed on both. Anything in `UserNotificationsModule` (controller, usecases) is API-only.
- **Env vars must be set on BOTH containers in prod** (Dokploy) whenever the worker touches that config. Default to setting shared secrets on both to avoid a process silently no-op-ing.
- **New BullMQ queue/processor?** Register the processor in the worker module, not just `app.module.ts`.

**Checklist when adding a feature:** does the worker (a) need this module imported, (b) emit or consume this event, (c) run this service, (d) require this env var? If any is "yes", wire the worker too.

## Data Security - Preventing Sensitive Data Exposure

### Never Use These Patterns for UserEntity Relations

```typescript
// DANGEROUS - loads ALL user fields including password/tokens
relations: ['assignedUser']
relations: ['creator']
.leftJoinAndSelect('entity.user', 'user')
```

### Always Use This Pattern

```typescript
// SAFE - explicitly select only needed fields
.leftJoin('entity.assignedUser', 'assignedUser')
.addSelect([
  'assignedUser.id',
  'assignedUser.firstName',
  'assignedUser.lastName',
  'assignedUser.email',
])
```

### Safe User Fields Reference

When loading user relations, only select these fields:
- `id`: always needed for references
- `firstName`, `lastName`: display names
- `email`: contact/identification
- `status`: if needed for filtering

Never select: `password`, `passwordResetToken`, `passwordResetExpires`, `inviteToken`, `inviteExpires`, `refreshToken`, `refreshTokenExpires`, `refreshTokenJti`

### When You Need Sensitive Fields

Only in auth-related usecases (login, password reset). Use explicit `addSelect`:

```typescript
const user = await this.userRepository
  .createQueryBuilder('user')
  .addSelect('user.password')
  .where('user.email = :email', { email })
  .getOne();
```

## Command/Usecase Pattern

Every business operation follows this structure:

```
modules/<feature>/usecases/<operation>/
  <operation>.command.ts   - input class with validation decorators
  <operation>.usecase.ts   - @Injectable service with execute(command) method
```

**Commands** (`src/modules/shared/commands/`):
- Extend `OrganizationCommand` for org-scoped operations (provides `userId`, `organizationId`)
- Extend `AuthenticatedCommand` for auth-only operations (provides `userId`)
- Extend `BasePaginatedCommand` for paginated lists (provides `page`, `limit`)
- Use `class-validator` decorators: `@IsString()`, `@IsNotEmpty()`, `@IsOptional()`, etc.
- Instantiate with `MyCommand.create({ ...data })`: validates automatically, throws `CommandValidationException`

```typescript
export class CreateRoleCommand extends OrganizationCommand {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsArray()
  @IsString({ each: true })
  readonly permissions: string[];
}
```

**Usecases**:
- `@Injectable()` class with a single `execute(command)` method
- Inject repositories directly (no services wrapping repositories)
- Return DTOs or entities, `ResponseInterceptor` wraps in `{ data: T }`

```typescript
@Injectable()
export class CreateRole {
  constructor(private readonly roleRepository: RoleRepository) {}

  async execute(command: CreateRoleCommand): Promise<RoleEntity> {
    // validate, create, save, return
  }
}
```

## Controller Pattern

```typescript
@ApiTags('Roles')
@Controller('roles')
export class RoleController {
  @Post()
  @RequirePermissions(PERMISSIONS_ENUM.ROLE_CREATE)
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, type: RoleResponseDto })
  async create(
    @UserSession() user: UserSessionData,
    @Body() dto: CreateRoleDto,
  ) {
    return this.createRole.execute(
      CreateRoleCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        name: dto.name,
        permissions: dto.permissions,
      }),
    );
  }
}
```

- Use `@RequirePermissions(PERMISSIONS_ENUM.X)` for permission-gated endpoints (all listed permissions required)
- Use `@RequireAnyPermission(...)` when any one of several permissions is enough
- Use `@RequireAuthentication()` for auth-only endpoints (no specific permission)
- Use `@UserSession()` to extract `{ userId, email, organizationId, permissions }` from JWT
- Use `@Body()` with DTO classes for request validation
- Controller methods just bridge HTTP to command/usecase, no logic

## Adding a New Entity

1. Create entity in `src/database/entities/` extending `BaseEntity`
2. Export it from `src/database/entities/index.ts`
3. Create repository in `src/database/repositories/` extending `Repository<Entity>`
4. Export it from `src/database/repositories/index.ts`
5. Add entity to `entities` array in `src/database/db.module.ts`
6. Add repository to `repositories` array in `src/database/db.module.ts`
7. Inject repository directly in usecases, no `forFeature` needed

## Adding a New Feature Module

1. Create directory: `src/modules/<feature>/`
2. Create module, controller, DTOs, and usecases following existing patterns
3. Register module in `src/app.module.ts` imports (and in `worker.module.ts` if the worker needs it)
4. Add controller endpoints with proper decorators
5. Update frontend `API_ROUTES` and types in the same commit

## Database

**Entities inherit from BaseEntity**:
- `id`: UUID primary key (auto-generated)
- `createdAt`: auto-generated timestamp
- `updatedAt`: auto-updated timestamp

**Entities** (`src/database/entities/`):
- `UserEntity`: email, password (hashed), firstName, lastName, phone, phoneCountryCode, organizationId, roleId, status, isActive, onboarded, invite/reset/refresh token fields (select: false), invitedBy, managerId + `path` (materialized team hierarchy), tourCompleted, metadata
- `OrganizationEntity`: name, slug (unique), domain, status, logo, contact fields, address (JSONB), isSystemOrg, subscriptionStatus, trialEndsAt, subscriptionEndsAt, featureControls, metadata
- `RoleEntity`: name, permissions (JSONB string[]), organizationId, isDefault
- `AuditLogEntity`: action, method, path, actorId, impersonatedBy, organizationId, metadata, statusCode, ipAddress, userAgent, duration
- `UserSessionEntity`: userId, organizationId, jti, userAgent, ipAddress, expiresAt, lastUsedAt, revokedAt
- `NotificationEntity`: in-app feed item: organizationId, recipientUserId, type, title, body, link, priority, data, isRead, readAt
- `WebPushSubscriptionEntity`: organizationId, userId, endpoint, auth, userAgent
- `OrganizationConfigEntity`: organizationId, type (`OrganizationConfigType`), name, value (JSONB), isDefault
- `SupportedIntegrationEntity`: provider, name, description, iconUrl, category, authType, isActive, sortOrder
- `OrganizationIntegrationEntity`: organizationId, supportedIntegrationId, status, encryptedTokens, tokenExpiresAt, connectedBy, account info, webhookToken
- `OtpCodeEntity`, `EmailVerificationEntity`, `PasswordResetOtpEntity`: OTP flows (signup verification, password reset)

**Enums** (`src/database/enums.ts`), the ones used by foundation modules:
- `UserStatus`: invited, active, inactive, blocked
- `OrganizationStatus`: active, inactive, suspended
- `OrgSubscriptionStatus`: trial, active, past_due, cancelled, expired
- `IntegrationCategory`: calendar, video_conferencing, messaging, productivity, ai, telephony, payments
- `IntegrationAuthType`: oauth, api_key
- `OrganizationIntegrationStatus`: connected, disconnected, expired, error
- `OrganizationConfigType`

`enums.ts` and `@boilerplate/shared` still contain legacy enums/event names from a previous product (diet, food, lead, counselling, workout, article, etc.). They have no backing modules; do not build on them and do not document them as features.

**Multi-tenancy**: Most queries MUST filter by `organizationId` to enforce tenant isolation.

## Authentication

**Access Token** (1h expiry):
- Payload: `{ userId, email, organizationId, permissions[], firstName, lastName }`
- Sent as `Authorization: Bearer <token>`
- Validated by `JwtAuthGuard` on every protected request

**Refresh Token** (30d expiry):
- Payload: `{ userId, email, organizationId }` (no permissions)
- Stored in database (`refreshToken`, `refreshTokenExpires`, `refreshTokenJti` columns, select: false) and tracked per device in `UserSessionEntity`
- Sent in request body to `/auth/refresh`
- Token rotation: new refresh token issued on every refresh, old one invalidated

**Password hashing**: bcrypt with 10 salt rounds via `AuthService`

**Impersonation**: `POST /auth/impersonate` (permission `USER_IMPERSONATE`) and system-admin org access issue tokens for another user/org. `BlockImpersonationGuard` blocks sensitive actions (e.g. update-password) while impersonating; audit logs record `impersonatedBy`.

## Decorators

- `@RequireAuthentication()`: JWT guard + Swagger bearer auth
- `@RequirePermissions(...perms)`: JWT guard + `PermissionsGuard` (all required) + Swagger bearer auth
- `@RequireAnyPermission(...perms)`: JWT guard + `AnyPermissionsGuard` (any one required)
- `@UserSession()`: parameter decorator, extracts `UserSessionData` from request
- `@ApiResponse(dto, statusCode?, isArray?)`: Swagger response docs
- `@ApiCommonResponses()`: standard error responses in Swagger
- `@ApiOkPaginatedResponse(dto)`: paginated response Swagger docs
- `@ExcludeFromIdempotency()`: exclude endpoint from idempotency checks

## Shared Utilities

**Transformers** (`src/modules/shared/transformers/`):
- `@Trim()`: trims whitespace from string DTO fields
- `@TransformToBoolean()`: converts `"true"`/`"false"` strings to boolean

**Validators** (`src/modules/shared/validators/`):
- `@IsTime12HourFormat()`: validates `HH:MM AM/PM`
- `@IsValidPhone()`, image validator, `is-enum-or-array`, `is-mongo-id-or-array-of-ids`, `weekly-schedule-disabled`

**Helpers** (`src/modules/shared/helpers/`):
- `user-name.utils.ts`: user display name helpers
- `date.utils.ts`, `html-escape.ts`, `regex.service.ts`, `cascade-delete.helper.ts`

**Services** (`src/modules/shared/services/`):
- `TeamScopeService`: team hierarchy resolution (see below)
- `DiscordNotifierService`: ops alerts to Discord

**Guards**: `BlockImpersonationGuard` (`src/modules/shared/guards/`), `SystemAdminGuard` (system-admin module)

## API Endpoints

### Auth (`/api/v1/auth`)

- `POST /signup/send-otp`: public, sends email verification OTP
- `POST /signup/verify-otp`: public, verifies signup OTP
- `POST /register`: public, creates user + org + default admin role
- `POST /login`: public, returns `{ accessToken, refreshToken, user, organization }`
- `POST /google`: public, Google sign-in
- `POST /refresh`: `RefreshJwtGuard`, body: `{ refreshToken }`, returns new token pair
- `POST /logout`: authenticated, body: `{ refreshToken }`, invalidates refresh token
- `POST /update-password`: authenticated (blocked while impersonating), body: `{ currentPassword, newPassword, confirmPassword }`
- `POST /reset/request`: public, body: `{ email }`, sends password reset email
- `POST /reset`: public, body: `{ password, token }`, resets password
- `POST /onboarding-context`: authenticated, saves onboarding answers
- `POST /impersonate`: permission `USER_IMPERSONATE`

### Users (`/api/v1/users`)

- `POST /list`: **paginated**, permission: `PERMISSION_BASE.USER_LIST_READ` (scoped)
  - Body: `{ page, limit, status?, search?, invitedBy? }`
  - Page is 1-indexed (first page = 1), limit default 10 (max 100)
- `GET /names`: user names for pickers (`?teamOnly=true` for own team)
- `GET /hierarchy`, `GET /:id/descendants`: team tree, permission `PERMISSION_BASE.USER_LIST_READ`
- `POST /invite`, `POST /create`, `POST /resend-invite`: permission `USER_CREATE`
- `POST /accept-invite`: public, body: `{ inviteToken, firstName, lastName, password }`
- `GET /me`: authenticated, returns current user with role and org
- `PUT /profile`, `PUT /tour-complete`, `PUT /me/page-preferences`: authenticated
- `PUT /:id`, `POST /:id/reset-password`: permission `PERMISSION_BASE.USER_UPDATE` (scoped)
- `POST /:id/block`, `POST /:id/unblock`: permission `USER_UPDATE_STATUS`
- `POST /:id/set-manager`: permission `TEAM_MANAGE`

### Roles (`/api/v1/roles`)

- `GET /`: **not paginated** (returns all)
- `POST /list`: permission `ROLE_LIST_READ`
- `POST /`: permission `ROLE_CREATE`, body: `{ name, permissions }`
- `GET /:id`: permission `ROLE_READ`
- `PUT /:id`: permission `ROLE_UPDATE`, body: `{ name, permissions }`
- `DELETE /:id`: permission `ROLE_UPDATE`

### Organization (`/api/v1/organization`, `/api/v1/organization-config`)

- `GET /organization`: authenticated, current org
- `PUT /organization`: permission `ORGANIZATION_UPDATE`
- `POST /organization-config`: permission `ORGANIZATION_SETTINGS`

### Sessions (`/api/v1/sessions`)

- `GET /`: permission `ORGANIZATION_SETTINGS`, active sessions
- `POST /:id/revoke`: permission `ORGANIZATION_SETTINGS`

### Notifications (`/api/v1/me/notifications`)

All authenticated:
- `GET /`: in-app feed
- `POST /:id/read`, `POST /read-all`
- `GET /web-push/public-key`, `POST /web-push/subscribe`, `POST /web-push/unsubscribe`
- `POST /dev/test`: send a test notification

### Integrations (`/api/v1/integrations`)

- `GET /`: permission `INTEGRATION_LIST_READ`, available and connected integrations
- `POST /:provider/connect`: permission `INTEGRATION_CONNECT`, initiate OAuth flow
- `GET /callback`: OAuth callback handler
- `POST /:provider/credentials`: permission `INTEGRATION_CONNECT`, save API-key credentials
- `POST /:provider/health-check`: permission `INTEGRATION_CONNECT`
- `POST /razorpay/webhook-token`: permission `INTEGRATION_CONNECT`
- `POST /razorpay/webhook/:token`: public webhook receiver
- `DELETE /:provider`: permission `INTEGRATION_DISCONNECT`

Provider adapters live in `src/modules/integration/adapters/`.

### Storage (`/api/v1/storage`)

- `GET /upload-url`: authenticated, presigned S3 upload URL (query: `extension`, `type`)

### Audit (`/api/v1/audit`)

- `POST /list`: **paginated**, permission: `AUDIT_LIST_READ`
  - Body: `{ page, limit, actorId?, action?, method?, startDate?, endDate? }`
- `GET /:id`: permission `AUDIT_READ`

### Billing (`/api/v1/billing`)

Plans live in ONE shared config (`packages/shared/src/billing.ts`: `PLANS`, `PlanFeature`, `resolveBillingAccess`). Payments go through the `PaymentProvider` interface (`modules/billing/services/payment-provider.interface.ts`, token `PAYMENT_PROVIDER`); Dodo is the only implementation today.

- Plans: `free` (1 member, 3 active jobs, core ATS only), `starter` (adds `inbox`, `offerEsign`, `candidatePortal`), `growth`/`scale`/`enterprise` (everything). Active jobs are `ACTIVE_JOB_STATUSES` (published, on hold); drafts do not count
- New orgs (signup, Google, system admin) start on `free` with status active. `resolveEffectivePlan` drops a lapsed paid plan (expired, cancelled past period end, trial ended) to `free` with full access; only `past_due` beyond grace is read only
- `GET /`: authenticated, plan, effective plan, status, access (`full`/`read_only`/`needs_plan`), features, member and active job usage, `overLimit`, checkout options
- `POST /checkout`, `/change-plan`, `/portal`, `/cancel`, `/resume`, `/sync`: permission `BILLING_MANAGE`
- `POST /webhooks/dodo`: public, Standard Webhooks signature verified, idempotent via `billing_webhook_events`
- `BillingEntitlementsService` (global `BillingCoreModule`, API + worker): `assertFeature`, `assertMemberCapacity`, `assertActiveJobCapacity` (409 `ACTIVE_JOB_LIMIT_REACHED`), cached org billing state (`${organizationId}:billing:state`)
- `PortalAvailabilityService` (shared): portal is on only when the org setting is on AND the plan has `candidatePortal`. Offers sent without `offerEsign` go out as a letter with no signing link. Mailbox connect/sync and inbox threads require `inbox`
- `@RequirePlanFeature(PlanFeature.X)` gates Growth features; `IntegrationCapabilitiesService` masks calls, WhatsApp, calendar and job feed by plan
- `BillingAccessInterceptor` (APP_INTERCEPTOR) returns 402 on mutations when access is not `full`, except billing, auth, `users/me`, `me/*`, system admin and read-only POSTs (`/list`, `/board`, `/preview`)
- Enforcement is off when Dodo env is missing or `BILLING_ENFORCEMENT_DISABLED=true`; the system org is always exempt

### Onboarding (`/api/v1/onboarding`)

All need `ORGANIZATION_UPDATE`. State lives in `organizations.metadata` (`agencySize`, `onboardingDismissedAt`, `sampleData` ids).

- `GET /checklist`: setup steps computed from real data, cached 30s (`${organizationId}:onboarding:checklist`). Team step is `upgradeRequired` (excluded from progress) when the member limit is 1; inbox step is hidden without `inbox`
- `POST /dismiss`: hide the checklist for the org
- `POST /sample-data`, `DELETE /sample-data`: add or remove a labelled demo set (clients and draft jobs suffixed `(sample)`, candidates tagged `sample-data` with `@example.com` emails)

### System Admin (`/api/v1/system-admin`)

All guarded by `SystemAdminGuard` (user's organization has `isSystemOrg = true`):
- `POST /organizations/list`: paginated org list with status/subscription filters
- `POST /organizations`: create org with admin user
- `PATCH /organizations/:id/status`: update org status (active/inactive/suspended)
- `POST /organizations/:id/access`: generate access token for impersonation
- `POST /reset-login-lockout`: clear a login lockout
- `POST /sync-permissions`: sync role permissions with `ALL_PERMISSIONS`
- `PATCH /organizations/:id/billing`: set plan (incl. enterprise), status, member limit, trial and access dates

### Pagination Pattern

User list uses POST with pagination. Roles return all items via GET. When adding a new paginated endpoint:

1. Create command extending `BasePaginatedCommand` (provides `page`, `limit`)
2. Create DTO extending `ListPaginationDto` (provides `page`, `limit` with validation)
3. In usecase, use `calculateSkip(page, limit)` for offset and `calculatePaginationMetadata(page, limit, total)` (or `createPaginationMetadata`) for response, from `@boilerplate/core`
4. Use `@ApiOkPaginatedResponse(YourDto)` on the controller method
5. Response shape: `{ data: T[], page, limit, total, totalPages, hasNextPage, hasPreviousPage }`

For simple lists that don't need pagination (like roles), just return the array directly, `ResponseInterceptor` wraps it in `{ data: T[] }`.

## Pagination Rules

**ALL pagination MUST use 1-indexed page numbers. This is non-negotiable.**

### Backend Requirements:

1. **Commands** extending `BasePaginatedCommand`:
   - page is validated with `@Min(1)` (already enforced in base class)
   - DO NOT override with `@Min(0)`

2. **DTOs** extending `ListPaginationDto`:
   - Default page is 1 (already enforced)
   - DO NOT change default to 0

3. **Usecases**:
   - Use `calculateSkip(page, limit)` for database offset
   - This function expects 1-indexed pages (page 1 = skip 0)
   - Use `createPaginationMetadata(page, limit, total)` for response

4. **Response shape**:
   ```typescript
   {
     data: T[],
     page: number,        // 1-indexed
     limit: number,
     total: number,
     totalPages: number,
     hasNextPage: boolean,
     hasPreviousPage: boolean
   }
   ```

### Why 1-indexed:

- Standard REST API convention (first page is "page 1")
- Matches `calculateSkip()` implementation
- User-friendly (no confusion about "page 0")
- Database offset is calculated as `(page - 1) * limit`

### Common Mistakes:

❌ `@Min(0)` on page field
❌ `page: number = 0` as default
❌ Frontend `useState(0)` for page
❌ Sending `{ page: 0 }` in API requests

✅ `@Min(1)` on page field
✅ `page: number = 1` as default
✅ Frontend `useState(1)` for page
✅ Sending `{ page: 1 }` in API requests

## Server-Side Filtering

Complex list endpoints should use raw SQL with dynamic WHERE clauses for performance. Follow these patterns (examples use illustrative tables):

### Parameterized Queries

Always use parameterized queries to prevent SQL injection:

```typescript
const params: (string | number)[] = [];
let paramIndex = 1;

const addParam = (value: string | number): string => {
  params.push(value);
  return `$${paramIndex++}`;
};

let whereClause = `c."organizationId" = ${addParam(command.organizationId)}`;

if (command.search) {
  const searchParam = addParam(`%${command.search}%`);
  whereClause += ` AND name ILIKE ${searchParam}`;
}

const rows = await this.dataSource.query(sql, params);
```

### Special Filter Values

When a filter has a "none" or "empty" option, map it to `IS NULL`:

```typescript
// CORRECT - 'none' means truly no value
if (command.status === 'none') {
  statusClause = `AND s.status IS NULL`;
}

// WRONG - don't conflate 'none' with other statuses
if (command.status === 'none') {
  statusClause = `AND (s.status IS NULL OR s.status = 'expired')`;  // BUG!
}
```

**Rule**: Each filter value MUST be mutually exclusive. If "Expired" is a valid filter option, expired records should ONLY appear when that filter is selected, never under "None" or other filters.

### Filter Clause Pattern

Build filter clauses conditionally and append to WHERE:

```typescript
let stageClause = '';
let statusClause = '';

if (command.stage) {
  if (command.stage === 'none') {
    stageClause = `AND ls.stage IS NULL`;
  } else {
    stageClause = `AND ls.stage = ${addParam(command.stage)}`;
  }
}

// Apply in SQL
WHERE ${whereClause}
${stageClause}
${statusClause}
```

### CTE Pattern for Complex Queries

Use CTEs (Common Table Expressions) for readability when joining multiple aggregations:

```typescript
const sql = `
  WITH latest_records AS (
    SELECT DISTINCT ON (r."parentId")
      r."parentId", r.status, r."createdAt"
    FROM records r
    WHERE r."organizationId" = ${orgIdParam}
    ORDER BY r."parentId", r."createdAt" DESC
  )
  SELECT p.*, lr.status
  FROM parents p
  LEFT JOIN latest_records lr ON lr."parentId" = p.id
  WHERE ${whereClause}
  ${filterClauses}
`;
```

### Common Mistakes

❌ Combining unrelated statuses in filter logic (`IS NULL OR status = 'expired'`)
❌ String concatenation without parameterization
❌ Forgetting to handle NULL in LEFT JOIN results
❌ Not using `DISTINCT ON` for "latest record" queries

✅ Each filter value maps to exactly one condition
✅ All user input parameterized via `addParam()`
✅ NULL handling explicit in filter clauses
✅ CTEs for complex multi-join queries

## Response Format

```
// Success (single)
{ "data": { "id": "...", "name": "..." } }

// Success (array)
{ "data": [{ "id": "..." }, { "id": "..." }] }

// Success (paginated)
{ "data": [...], "page": 1, "limit": 10, "total": 25, "totalPages": 3, "hasNextPage": true, "hasPreviousPage": false }

// Error
{ "statusCode": 400, "message": "Validation failed", "errors": { ... }, "timestamp": "...", "path": "/api/v1/..." }
```

## Permissions

- Defined in `@boilerplate/shared` (re-exported by `@boilerplate/core`) as `PERMISSIONS_ENUM`
- Stored in `RoleEntity.permissions` as JSONB string array
- Included in JWT access token payload
- Checked per-endpoint via `@RequirePermissions()` / `@RequireAnyPermission()`
- `PermissionsGuard` skips checks when env `DEV_BYPASS_PERMISSIONS=true` (logs a `[DEV]` warning)
- When a role's permissions change, `RolePermissionListener` (`ROLE_UPDATED`) clears refresh tokens for every user on that role, forcing a re-login with fresh permissions

### Permission Scopes (RBAC)

Scoped permissions follow the pattern `base:scope` (e.g. `user:list:read:own`, `user:list:read:team`, `user:list:read:all`). Use the shared enums and constants, NEVER hardcode scope or base permission strings.

**Constants** (from `@boilerplate/core`):

```typescript
import { PermissionScope, PERMISSION_BASE, getPermissionScope } from '@boilerplate/core';
```

- `PermissionScope` enum: `OWN = 'own'`, `TEAM = 'team'`, `ALL = 'all'`
- `PERMISSION_BASE` const: maps like `USER_LIST_READ: 'user:list:read'`, `USER_UPDATE: 'user:update'`, etc.
- `getPermissionScope(permissions[], basePermission)`: returns the user's highest scope (`PermissionScope | null`)

**In controllers**: use `PERMISSION_BASE` for scoped endpoints, `PERMISSIONS_ENUM` for non-scoped:

```typescript
@RequirePermissions(PERMISSION_BASE.USER_LIST_READ)   // scoped (own/team/all)
@RequirePermissions(PERMISSIONS_ENUM.USER_CREATE)      // non-scoped (exact match)
```

**In usecases**: resolve scope once, compare with enum:

```typescript
const scope = getPermissionScope(command.permissions || [], PERMISSION_BASE.USER_LIST_READ);
if (scope === PermissionScope.OWN) {
  qb.andWhere('entity.assignedTo = :userId', { userId: command.userId });
} else if (scope === PermissionScope.TEAM) {
  const teamIds = await this.teamScopeService.getTeamMemberIds(command.userId, command.organizationId);
  qb.andWhere('entity.assignedTo IN (:...teamIds)', { teamIds });
}
// scope === ALL → no filter needed
```

**NEVER do this**:

```typescript
// BAD - hardcoded strings
const scope = getPermissionScope(permissions, 'user:list:read');
if (scope === 'own') { ... }

// GOOD - use enums and constants
const scope = getPermissionScope(permissions, PERMISSION_BASE.USER_LIST_READ);
if (scope === PermissionScope.OWN) { ... }
```

### TeamScopeService

For `team` scope, use `TeamScopeService` (globally available via `SharedModule`):

```typescript
constructor(private readonly teamScopeService: TeamScopeService) {}

const teamIds = await this.teamScopeService.getTeamMemberIds(userId, organizationId);
```

- Returns `[self + all descendant user IDs]` based on the user hierarchy (`managerId` + materialized `path`)
- Results cached in Redis for 5 minutes (`CACHE_TTL.TEAM_DESCENDANTS`)
- Cache auto-invalidated by `TeamHierarchyListener` on `USER_MANAGER_CHANGED` and `USER_BLOCKED` events
- Graceful fallback to DB if Redis is unavailable

## Event System

The app uses `@nestjs/event-emitter` for decoupled event-driven architecture. Events are defined in `@boilerplate/shared` and emitted from usecases.

### Architecture

- **EventsModule** (`src/modules/events/`): global module that configures event emitter and registers listeners (API process only)
- **AppEventEmitter**: wrapper service for emitting typed events
- **Listeners**: handle events asynchronously (e.g., send emails)

### Emitting Events

Inject `AppEventEmitter` and emit typed events from usecases:

```typescript
import { AppEventEmitter, EventName, UserInvitedEvent } from '@boilerplate/core';

@Injectable()
export class InviteUser {
  constructor(private readonly eventEmitter: AppEventEmitter) {}

  async execute(command: InviteUserCommand) {
    // ... create user
    this.eventEmitter.emit<UserInvitedEvent>({
      eventName: EventName.USER_INVITED,
      userId: user.id,
      organizationId: command.organizationId,
      invitedBy: command.userId,
      inviteLink: inviteUrl,
      timestamp: new Date(),
    });
  }
}
```

### Event Names

Defined in `@boilerplate/shared` (`packages/shared/src/events/event-names.ts`, `EventName` enum). Foundation events:

- **User**: `USER_REGISTERED`, `USER_INVITED`, `USER_INVITE_RESENT`, `USER_INVITE_ACCEPTED`, `USER_CREATED`, `USER_BLOCKED`, `USER_UNBLOCKED`, `USER_PASSWORD_RESET_REQUESTED`, `USER_PASSWORD_RESET`, `USER_PASSWORD_UPDATED`, `USER_PASSWORD_ADMIN_RESET`, `USER_CREDENTIALS_SENT`, `USER_LOGGED_IN`, `USER_LOGGED_OUT`, `USER_IMPERSONATED`, `USER_MANAGER_CHANGED`
- **Signup**: `SIGNUP_OTP_REQUESTED`, `SIGNUP_WAITLIST_JOINED`
- **Organization**: `ORGANIZATION_CREATED`, `ORGANIZATION_PAYMENT_RECEIVED`
- **Role**: `ROLE_CREATED`, `ROLE_UPDATED`, `ROLE_DELETED`

The enum also holds legacy names (client, lead, diet, food, workout, recipe, counselling, etc.) with no emitters or listeners.

### Listeners

Listeners are in `src/modules/events/listeners/`. Use `@OnEvent()` decorator:

```typescript
@Injectable()
export class UserEmailListener {
  @OnEvent(EventName.USER_INVITED, { async: true })
  async handleUserInvited(event: UserInvitedEvent): Promise<void> {
    // send invitation email
  }
}
```

Current listeners:
- **UserEmailListener**: invitation, invite resent, welcome (invite accepted / registered), password reset, signup OTP, waitlist, credentials sent, admin password reset emails
- **OrganizationEmailListener**: `ORGANIZATION_CREATED` emails
- **RolePermissionListener**: `ROLE_UPDATED` (invalidates refresh tokens of users on the role)
- **TeamHierarchyListener**: `USER_MANAGER_CHANGED`, `USER_BLOCKED` (team cache invalidation)

### Adding a New Event

1. Add event name to `EventName` enum in `packages/shared/src/events/event-names.ts`
2. Create event interface in appropriate file (`user.events.ts`, `role.events.ts`, etc.)
3. Export from `packages/shared/src/events/index.ts`
4. Emit from usecase using `AppEventEmitter.emit<YourEvent>(...)`
5. Create listener if needed in `src/modules/events/listeners/`
6. Rebuild packages (`pnpm build:packages`)

## Mail Module

The mail module (`src/modules/mail/`) provides email sending capabilities via `@boilerplate/core` MailService.

### Email Templates

Templates are in `@boilerplate/core` (`packages/core/src/services/mail/templates/`): user invite, welcome, org welcome, password reset, admin password reset, user credentials, signup OTP, signup waitlist, re-engagement, invoice, daily summary report, form submission notification.

### Sending Emails

Emails are sent reactively via event listeners (see Event System above), mainly `UserEmailListener` and `OrganizationEmailListener`.

## Notifications

- **NotificationsCoreModule** (`@Global()`, loaded by API AND worker): `NotificationDispatcher` fans a notification out over `NOTIFICATION_CHANNELS` (`InAppNotificationChannel` writes `NotificationEntity`, `WebPushNotificationChannel` uses `WebPushService` + VAPID keys)
- **UserNotificationsModule** (API only): the `/me/notifications` controller and usecases
- To send a notification from anywhere, inject `NotificationDispatcher`; do not write to `NotificationRepository` directly

## Audit Module

The audit module automatically logs all POST/PUT/PATCH/DELETE requests via `AuditInterceptor`. GET requests are not logged.

### How It Works

- **AuditInterceptor** (`src/modules/shared/framework/audit.interceptor.ts`): global interceptor registered in `main.ts`
- Captures: method, path, action, actor, impersonator, organization, IP, user agent, request body (sanitized), status code, duration
- Saves asynchronously (fire-and-forget) to not block responses
- Sensitive fields (password, token, etc.) are automatically redacted from metadata

### AuditLogEntity

- `organizationId`: tenant isolation
- `actorId`: user who performed the action (nullable for unauthenticated requests)
- `impersonatedBy`: real user when the action happened under impersonation
- `method`: HTTP method (POST, PUT, PATCH, DELETE)
- `path`: actual URL with IDs (e.g., `/api/v1/users/abc-123/block`)
- `action`: semantic action name (e.g., `users.block`, `roles.update`)
- `statusCode`: HTTP response status
- `metadata`: `{ params: {...}, body: {...} }` with sensitive fields redacted
- `ipAddress`, `userAgent`, `duration`

### Action Naming Convention

Derived from route path:
- `POST /users/invite` → `users.invite`
- `PUT /roles/:id` → `roles.update`
- `DELETE /roles/:id` → `roles.delete`
- `POST /auth/login` → `auth.login`

## Rate Limiting

`ThrottlerModule` is configured in `app.module.ts` with three windows: `short` (10 req / 1s), `medium` (50 / 10s), `long` (200 / 60s).

## Linting

- ESLint 9 flat config with TypeScript and Prettier
- Run: `pnpm --filter backend lint`
- TypeScript: `pnpm --filter backend exec tsc --noEmit`

## Swagger

- Available at `/api/docs` in development
- All endpoints documented with `@ApiOperation`, `@ApiResponse`, `@ApiTags`
- Bearer auth configured globally

## Scripts

**Database Seed** (`scripts/seed.ts`):
```bash
pnpm --filter backend seed
```
- Upserts supported integrations and creates the system org, its admin role, and the admin user (`admin@rabbithr.test` / `Admin@123`)

**Worker**:
```bash
pnpm --filter backend start:worker        # dev
pnpm --filter backend start:worker:prod   # from dist
```

**Migrations**:
```bash
pnpm --filter backend migration:generate src/database/migrations/<Name>
pnpm --filter backend migration:run
pnpm --filter backend migration:revert
pnpm --filter backend migration:show
```
