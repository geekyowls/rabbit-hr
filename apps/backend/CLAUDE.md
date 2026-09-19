# Backend Guidelines

## Stack

- NestJS 11 with TypeORM + PostgreSQL
- JWT authentication with access/refresh token rotation
- `@boilerplate/core` for shared commands, utilities, and services

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
- All responses wrapped in `{ data: T }` by `ResponseInterceptor` — NEVER wrap manually
- NEVER call `TypeOrmModule.forFeature()` in feature modules — the global `DatabaseModule` handles it
- NEVER write business logic in controllers — use the command/usecase pattern
- NEVER hardcode secrets — use `ConfigService` and `.env` files
- NEVER skip validation — commands MUST use class-validator decorators
- Every protected endpoint MUST use `@RequireAuthentication()` or `@RequirePermissions()`
- Redis cache keys for org-scoped data MUST start with `organizationId` as the FIRST segment (e.g. `${organizationId}:coverage:covered:${userId}`), so tenant isolation holds and all of an org's cache is scannable via `organizationId:*`. Never key solely on a userId or entity id, and never bury `organizationId` in the middle/end of the key. Invalidation helpers MUST take and pass `organizationId` too.
- ALWAYS think about the WORKER process in parallel with the API. The backend runs as **two processes off the same image** — the API (`app.module.ts`) and a separate worker (`worker.module.ts`). They have **independent module graphs, DI containers, and in-process `EventEmitter2` buses.** When adding or changing anything, ask: "does the worker also need this?" See the checklist below before considering a change complete.

## Logging

### Request Context (AsyncLocalStorage)

Every HTTP request gets a `RequestContext` via `AsyncLocalStorage`, initialized by `RequestIdMiddleware`:
- `reqId` — unique `req_<id>` per request, also returned as `X-Request-ID` response header
- `userId`, `email`, `organizationId`, `clientId` — enriched by `LoggingInterceptor` after auth

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

`ContextLogger` is a drop-in replacement for `Logger` — same API, just adds `[reqId user=x org=y]` prefix from AsyncLocalStorage context.

### JSON logs in production (Grafana/Loki)

In production (`NODE_ENV=production`) both the API and worker use `JsonLogger` (`@shared/framework/json-logger`), set via the `logger` option in `main.ts` / `worker.ts`. Every log line is emitted as single-line JSON so Loki/Grafana can query structured fields instead of regex-scraping strings:

```json
{"time":"...","level":"warn","context":"LoggingInterceptor","message":"← POST /api/v1/auth/login (req_x) - 429 (11ms)","reqId":"req_x","userId":"...","organizationId":"...","method":"POST","path":"/api/v1/auth/login","statusCode":429,"durationMs":11}
```

- `reqId`, `userId`/`clientId`, `organizationId` are auto-injected from the AsyncLocalStorage request context on EVERY log — no call-site changes needed.
- `LoggingInterceptor` additionally attaches flat `method`/`path`/`statusCode`/`durationMs` fields (prod only) so the error-rate and slow-request dashboards query real numbers.
- Errors go to `stderr`, everything else to `stdout`; both are captured by Promtail.
- In development the logger is unchanged (human-readable NestJS `ConsoleLogger`) — the interceptor skips the structured meta so dev output is identical to before.
- Prod log levels: `log`, `warn`, `error` (debug/verbose suppressed).

### Slow Query Logging

TypeORM logs queries exceeding `maxQueryExecutionTime` (500ms dev, 1000ms prod). Production also logs errors and warnings.

### Log Viewer

Dozzle at `https://logs.rabbithr.co` — real-time searchable container logs (admin/Chai@123). Docker log rotation: 3 files x 10MB per container (~2-3 days retention).

## Dual-Process Architecture (API + Worker)

The API and the worker are **separate processes** with separate module trees:

- **API** — `app.module.ts`. Serves HTTP, emits domain events, runs `@OnEvent` listeners registered in modules it imports (e.g. `EventsModule`, `UserNotificationsModule`).
- **Worker** — `worker.module.ts`. Runs BullMQ processors only. Imports a **subset**: `DatabaseModule`, `QueueModule`, `ExportsWorkerModule`, `RulesWorkerModule`. It does NOT import most feature modules, `EventsModule`, or their listeners.

Consequences you MUST account for:

- **`@OnEvent` listeners only fire in the process where their module is loaded.** An event emitted in the API is NOT seen by the worker (different `EventEmitter2` instance), and vice-versa. If a producer runs in the worker (a cron/queue processor) but the listener only lives in an API-imported module, the listener never runs.
- **A service (and its config/env) only exists where its module is imported.** e.g. `WebPushService` lives in `UserNotificationsModule`, which only the API loads — so VAPID env is only strictly needed by the API today. But a **rules `send_notification` action runs in the worker** (`RulesWorkerModule`), so that same service + its env WILL be needed in the worker once wired.
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
- `id` — Always needed for references
- `firstName`, `lastName` — Display names
- `email` — Contact/identification
- `status` — If needed for filtering

Never select: `password`, `passwordResetToken`, `passwordResetExpires`, `inviteToken`, `inviteExpires`

### When You Need Sensitive Fields

Only in auth-related usecases (login, password reset). Use explicit `addSelect`:

```typescript
const user = await this.userRepository
  .createQueryBuilder('user')
  .addSelect('user.password')  // Explicit opt-in
  .where('user.email = :email', { email })
  .getOne();
```

## Command/Usecase Pattern

Every business operation follows this structure:

```
modules/<feature>/usecases/<operation>/
  <operation>.command.ts   — input class with validation decorators
  <operation>.usecase.ts   — @Injectable service with execute(command) method
```

**Commands**:
- Extend `OrganizationCommand` for org-scoped operations (provides `userId`, `organizationId`)
- Extend `AuthenticatedCommand` for auth-only operations (provides `userId`)
- Extend `BasePaginatedCommand` for paginated lists (provides `page`, `limit`)
- Use `class-validator` decorators: `@IsString()`, `@IsNotEmpty()`, `@IsOptional()`, etc.
- Instantiate with `MyCommand.create({ ...data })` — validates automatically, throws `CommandValidationException`

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
- Return DTOs or entities — ResponseInterceptor wraps in `{ data: T }`

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

- Use `@RequirePermissions(PERMISSIONS_ENUM.X)` for permission-gated endpoints
- Use `@RequireAuthentication()` for auth-only endpoints (no specific permission)
- Use `@UserSession()` to extract `{ userId, email, organizationId, permissions }` from JWT
- Use `@Body()` with DTO classes for request validation
- Controller methods just bridge HTTP to command/usecase — no logic

## Adding a New Entity

1. Create entity in `src/database/entities/` extending `BaseEntity`
2. Export it from `src/database/entities/index.ts`
3. Create repository in `src/database/repositories/` extending `Repository<Entity>`
4. Export it from `src/database/repositories/index.ts`
5. Add entity to `entities` array in `src/database/db.module.ts`
6. Add repository to `repositories` array in `src/database/db.module.ts`
7. Inject repository directly in usecases — no `forFeature` needed

## Adding a New Feature Module

1. Create directory: `src/modules/<feature>/`
2. Create module, controller, DTOs, and usecases following existing patterns
3. Register module in `src/app.module.ts` imports
4. Add controller endpoints with proper decorators
5. Update frontend `API_ROUTES` and types in the same commit

## Database

**Entities inherit from BaseEntity**:
- `id` — UUID primary key (auto-generated)
- `createdAt` — auto-generated timestamp
- `updatedAt` — auto-updated timestamp

**Core Entities**:
- `UserEntity` — email, password (hashed), firstName, lastName, organizationId, roleId, status, refreshToken (select: false)
- `OrganizationEntity` — name, slug (unique), domain (unique), status
- `RoleEntity` — name, permissions (JSONB string[]), organizationId, isDefault
- `AuditLogEntity` — action, method, path, actorId, organizationId, metadata, statusCode

**CRM Entities**:
- `LeadEntity` — contact info, source, status, assignedTo, organizationId
- `ClientEntity` — contactId, health profile (height, weightGoal, dietaryPreference, medicalConditions, allergies), assignedTo, organizationId (no status column — status was removed)
- `ContactEntity` — shared contact information (phone, email, address)
- `ContactActivityEntity` — activity type, contactId, metadata, createdBy
- `ContactInteractionEntity` — interaction records for contacts
- `ContactNoteEntity` — notes attached to contacts

**Diet & Nutrition Entities**:
- `FoodItemEntity` — name, calories, protein, carbs, fat, fiber, servingSize, servingUnit, dietType, foodType, category, servingTemperature, difficulty, cuisine, mealType, isTravelFriendly, tags
- `DietTemplateEntity` — name, description, tags, days (JSONB with meal grid)
- `ClientDietDayEntity` — contactId, date, meals (JSONB), organizationId
- `RecipeEntity` — foodItemId, title, slug, ingredients (JSONB), instructions, prepTimeMinutes, cookTimeMinutes, servings, images, isPublic, publishedAt, tags, seoTitle, seoDescription, isSystemRecipe, forkedFromId

**Health Tracking Entities**:
- `ClientVitalEntity` — contactId, vitalType, value, unit, recordedAt

**Subscription Entities**:
- `SubscriptionEntity` — clientId, planName, amount, startDate, endDate, status
- `PaymentEntity` — subscriptionId, amount, paymentMode, paidAt
- `SubscriptionPauseHistoryEntity` — pause/resume tracking

**Integration Entities**:
- `OrganizationIntegrationEntity` — provider, accessToken, refreshToken, organizationId
- `SupportedIntegrationEntity` — available integration providers

**Utility Entities**:
- `OrganizationCounterEntity` — auto-increment counters for IDs (lead numbers, client numbers)

**Enums** (`src/database/enums.ts`):
- `UserStatus`: invited, active, inactive, blocked
- `OrganizationStatus`: active, inactive, suspended
- `LeadStatus`: new, contacted, qualified, unqualified, converted, lost
- `SubscriptionStatus`: active, paused, expired, cancelled
- `PaymentMode`: cash, upi, card, bank_transfer, other
- `VitalType`: weight, height, bmi, body_fat, blood_pressure_systolic, blood_pressure_diastolic, blood_sugar_fasting, blood_sugar_pp, waist, hip, chest, arm
- `FoodType`: ingredient, prepared
- `ServingTemperature`: hot, warm, cold
- `FoodDifficulty`: easy, medium, hard
- `FoodCuisine`: general, north_indian, south_indian, chinese, italian, mexican, mediterranean, gujarati, maharashtrian, exotic
- `MealType`: main, snack
- `DietType`: veg, non_veg, vegan, eggetarian
- `OrgSubscriptionStatus`: trial, active, past_due, cancelled, expired
- `SystemBannerType`: alert, warning, info, success, feature
- `SystemBannerStatus`: draft, published, archived

**Multi-tenancy**: Most queries MUST filter by `organizationId` to enforce tenant isolation.

## Authentication

**Access Token** (1h expiry):
- Payload: `{ userId, email, organizationId, permissions[], firstName, lastName }`
- Sent as `Authorization: Bearer <token>`
- Validated by `JwtAuthGuard` on every protected request

**Refresh Token** (30d expiry):
- Payload: `{ userId, email, organizationId }` (no permissions)
- Stored in database (`refreshToken`, `refreshTokenExpires` columns, select: false)
- Sent in request body to `/auth/refresh`
- Token rotation: new refresh token issued on every refresh, old one invalidated

**Password hashing**: bcrypt with 10 salt rounds via `AuthService`

## Decorators

- `@RequireAuthentication()` — JWT guard + Swagger bearer auth
- `@RequirePermissions(...perms)` — JWT guard + permission guard + Swagger bearer auth
- `@UserSession()` — parameter decorator, extracts `UserSessionData` from request
- `@ApiResponse(dto, statusCode?, isArray?)` — Swagger response docs
- `@ApiCommonResponses()` — standard error responses in Swagger
- `@ApiOkPaginatedResponse(dto)` — paginated response Swagger docs
- `@ExcludeFromIdempotency()` — exclude endpoint from idempotency checks

## Shared Utilities

**Transformers** (`src/modules/shared/transformers/`):
- `@Trim()` — trims whitespace from string DTO fields
- `@TransformToBoolean()` — converts `"true"`/`"false"` strings to boolean

**Validators** (`src/modules/shared/validators/`):
- `@IsTime12HourFormat()` — validates `HH:MM AM/PM`

**Helpers** (`src/modules/shared/helpers/`):
- `createGuid()` — UUID v4
- `capitalize(text)`, `toSentenceCase(text)`
- `formatUserName(user)` — full name or email fallback
- `escapeRegExp(text)`

## API Endpoints

### Auth (`/api/v1/auth`) — Web Users Only

The auth module handles authentication for **web app users only** (dietitians, admins). Mobile app clients use the separate client-app module.

- `POST /register` — public, creates user + org + default admin role
- `POST /login` — public, returns `{ accessToken, refreshToken, user, organization }`
- `POST /refresh` — RefreshJwtGuard, body: `{ refreshToken }`, returns new token pair
- `POST /logout` — authenticated, body: `{ refreshToken }`, invalidates refresh token
- `POST /update-password` — authenticated, body: `{ currentPassword, newPassword, confirmPassword }`
- `POST /reset/request` — public, body: `{ email }`, sends password reset email (web users only)
- `POST /reset` — public, body: `{ password, token }`, resets password (web users only)

### Client App (`/api/v1/client-app`) — Mobile Clients Only

The client-app module is **completely self-contained** and handles ALL mobile client authentication, profile, and data access. It has its own JWT strategy, guards, and password reset flow (OTP-based). NEVER add client-related logic to the auth module.

**Auth endpoints:**
- `POST /auth/login` — client login with email/phone + password
- `POST /auth/register` — client registration
- `POST /auth/refresh` — refresh client access token
- `POST /auth/logout` — invalidate client refresh token
- `POST /auth/google` — Google OAuth sign-in
- `POST /auth/apple` — Apple OAuth sign-in
- `POST /auth/forgot-password` — sends OTP to email
- `POST /auth/verify-otp` — verifies OTP, returns reset token
- `POST /auth/reset-password` — resets password using reset token
- `POST /auth/update-password` — change password (authenticated)

**Profile & data endpoints:**
- `GET /profile` — get client profile
- `PUT /profile` — update client profile
- `POST /diet/list` — get diet days for client
- `GET /vitals/latest` — latest vital values
- `POST /vitals/chart` — vital chart data
- `POST /vitals/list` — paginated vitals history
- `POST /vitals` — record a vital
- `GET /organization/legal` — privacy policy and terms URLs
- `GET /counselling` — upcoming counselling sessions

**Module separation rules:**
- Client credentials stored in `ClientCredentialsEntity`, NOT `UserEntity`
- Uses `ClientJwtAuthGuard` and `ClientRefreshJwtGuard`, NOT the auth module guards
- Password reset uses OTP flow, NOT token-based email links
- NEVER import client repositories or services into the auth module

### Users (`/api/v1/users`)

- `POST /list` — **paginated**, permission: `USER_LIST_READ`
  - Body: `{ page, limit, status?, search?, invitedBy? }`
  - Page is 1-indexed (first page = 1), limit default 10 (max 100)
  - Response: `{ data: User[], page, limit, total, totalPages, hasNextPage, hasPreviousPage }`
- `POST /invite` — permission: `USER_CREATE`, body: `{ email, firstName, lastName }`
- `POST /resend-invite` — permission: `USER_CREATE`, body: `{ userId }`
- `POST /accept-invite` — public, body: `{ inviteToken, firstName, lastName, password }`
- `GET /me` — authenticated, returns current user with role and org
- `PUT /profile` — authenticated, body: `{ firstName, lastName }`
- `PUT /:id` — permission: `USER_UPDATE`, body: `{ firstName, lastName }`
- `POST /:id/block` — permission: `USER_UPDATE_STATUS`
- `POST /:id/unblock` — permission: `USER_UPDATE_STATUS`

### Roles (`/api/v1/roles`)

- `GET /` — **not paginated** (returns all), permission: `ROLE_LIST_READ`
- `POST /` — permission: `ROLE_CREATE`, body: `{ name, permissions }`
- `GET /:id` — permission: `ROLE_READ`
- `PUT /:id` — permission: `ROLE_UPDATE`, body: `{ name, permissions }`
- `DELETE /:id` — permission: `ROLE_UPDATE`

### Audit (`/api/v1/audit`)

- `POST /list` — **paginated**, permission: `AUDIT_LIST_READ`
  - Body: `{ page, limit, actorId?, action?, method?, startDate?, endDate? }`
- `GET /:id` — permission: `AUDIT_READ`

### Pagination Pattern

User list uses POST with pagination. Roles return all items via GET. When adding a new paginated endpoint:

1. Create command extending `BasePaginatedCommand` (provides `page`, `limit`)
2. Create DTO extending `ListPaginationDto` (provides `page`, `limit` with validation)
3. In usecase, use `calculateSkip(page, limit)` for offset and `calculatePaginationMetadata(page, limit, total)` for response
4. Use `@ApiOkPaginatedResponse(YourDto)` on the controller method
5. Response shape: `{ data: T[], page, limit, total, totalPages, hasNextPage, hasPreviousPage }`

For simple lists that don't need pagination (like roles), just return the array directly — ResponseInterceptor wraps it in `{ data: T[] }`.

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

Complex list endpoints use raw SQL with dynamic WHERE clauses for performance. Follow these patterns:

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

**Rule**: Each filter value MUST be mutually exclusive. If "Expired" is a valid filter option, expired records should ONLY appear when that filter is selected, never under "No Plan" or other filters.

### Filter Clause Pattern

Build filter clauses conditionally and append to WHERE:

```typescript
let subscriptionClause = '';
let phaseClause = '';
let statusClause = '';

if (command.subscriptionStatus) {
  if (command.subscriptionStatus === 'none') {
    subscriptionClause = `AND ls.status IS NULL`;
  } else {
    subscriptionClause = `AND ls.status = ${addParam(command.subscriptionStatus)}`;
  }
}

if (command.phase) {
  phaseClause = `AND calculated_phase = ${addParam(command.phase)}`;
}

// Apply in SQL
WHERE ${whereClause}
${subscriptionClause}
${phaseClause}
${statusClause}
```

### CTE Pattern for Complex Queries

Use CTEs (Common Table Expressions) for readability when joining multiple aggregations:

```typescript
const sql = `
  WITH latest_subscriptions AS (
    SELECT DISTINCT ON (s."contactId")
      s."contactId", s.status, s."endDate"
    FROM subscriptions s
    WHERE s."organizationId" = ${orgIdParam}
    ORDER BY s."contactId", s."createdAt" DESC
  ),
  status_agg AS (
    SELECT "contactId", calculated_status
    FROM some_aggregation
    WHERE "organizationId" = ${orgIdParam}
  )
  SELECT c.*, ls.status, sa.calculated_status
  FROM clients c
  LEFT JOIN latest_subscriptions ls ON ls."contactId" = c."contactId"
  LEFT JOIN status_agg sa ON sa."contactId" = c."contactId"
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

- Defined in `@boilerplate/core` as `PERMISSIONS_ENUM`
- Stored in `RoleEntity.permissions` as JSONB string array
- Included in JWT access token payload
- Checked per-endpoint via `@RequirePermissions()` decorator
- `PermissionsGuard` skips checks when `NODE_ENV=development` (logs warning)

### Permission Scopes (RBAC)

Scoped permissions follow the pattern `base:scope` (e.g. `client:list:read:own`, `client:list:read:team`, `client:list:read:all`). Use the shared enums and constants — NEVER hardcode scope or base permission strings.

**Constants** (from `@boilerplate/core`):

```typescript
import { PermissionScope, PERMISSION_BASE, getPermissionScope } from '@boilerplate/core';
```

- `PermissionScope` enum — `OWN = 'own'`, `TEAM = 'team'`, `ALL = 'all'`
- `PERMISSION_BASE` const — maps like `CLIENT_LIST_READ: 'client:list:read'`, `LEAD_UPDATE: 'lead:update'`, etc.
- `getPermissionScope(permissions[], basePermission)` — returns the user's highest scope (`PermissionScope | null`)

**In controllers** — use `PERMISSION_BASE` for scoped endpoints, `PERMISSIONS_ENUM` for non-scoped:

```typescript
@RequirePermissions(PERMISSION_BASE.CLIENT_LIST_READ)   // scoped (own/team/all)
@RequirePermissions(PERMISSIONS_ENUM.CLIENT_CREATE)      // non-scoped (exact match)
```

**In usecases** — resolve scope once, compare with enum:

```typescript
const scope = getPermissionScope(command.permissions || [], PERMISSION_BASE.CLIENT_LIST_READ);
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
const scope = getPermissionScope(permissions, 'client:list:read');
if (scope === 'own') { ... }

// GOOD - use enums and constants
const scope = getPermissionScope(permissions, PERMISSION_BASE.CLIENT_LIST_READ);
if (scope === PermissionScope.OWN) { ... }
```

### TeamScopeService

For `team` scope, use `TeamScopeService` (globally available via `SharedModule`):

```typescript
constructor(private readonly teamScopeService: TeamScopeService) {}

const teamIds = await this.teamScopeService.getTeamMemberIds(userId, organizationId);
```

- Returns `[self + all descendant user IDs]` based on the user hierarchy (materialized path)
- Results cached in Redis for 5 minutes (`CACHE_TTL.TEAM_DESCENDANTS`)
- Cache auto-invalidated on `USER_MANAGER_CHANGED` and `USER_BLOCKED` events
- Graceful fallback to DB if Redis is unavailable

## Event System

The app uses `@nestjs/event-emitter` for decoupled event-driven architecture. Events are defined in `@boilerplate/shared` and emitted from usecases.

### Architecture

- **EventsModule** (`src/modules/events/`) — global module that configures event emitter and registers listeners
- **AppEventEmitter** — wrapper service for emitting typed events
- **Listeners** — handle events asynchronously (e.g., send emails)

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

Defined in `@boilerplate/shared` (`EventName` enum):

- **User events**: `USER_REGISTERED`, `USER_INVITED`, `USER_INVITE_RESENT`, `USER_INVITE_ACCEPTED`, `USER_CREATED`, `USER_BLOCKED`, `USER_UNBLOCKED`, `USER_PASSWORD_RESET_REQUESTED`, `USER_PASSWORD_RESET`, `USER_PASSWORD_UPDATED`, `USER_LOGGED_IN`, `USER_LOGGED_OUT`
- **Organization events**: `ORGANIZATION_CREATED`
- **Role events**: `ROLE_CREATED`, `ROLE_UPDATED`, `ROLE_DELETED`

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
- **UserEmailListener** — sends invitation, welcome, and password reset emails

### Adding a New Event

1. Add event name to `EventName` enum in `packages/shared/src/events/event-names.ts`
2. Create event interface in appropriate file (`user.events.ts`, `role.events.ts`, etc.)
3. Export from `packages/shared/src/events/index.ts`
4. Emit from usecase using `AppEventEmitter.emit<YourEvent>(...)`
5. Create listener if needed in `src/modules/events/listeners/`

## Mail Module

The mail module (`src/modules/mail/`) provides email sending capabilities via `@boilerplate/core` MailService.

### Email Templates

Templates are in `@boilerplate/core` (`packages/core/src/services/mail/templates/`):
- `buildUserInviteEmail()` — invitation email with invite link
- `buildWelcomeEmail()` — welcome email after registration/invite acceptance
- `buildPasswordResetEmail()` — password reset link email

### Sending Emails

Emails are sent reactively via event listeners (see Event System above). The `UserEmailListener` handles:
- `USER_INVITED` → sends invitation email
- `USER_INVITE_RESENT` → resends invitation email
- `USER_INVITE_ACCEPTED` → sends welcome email
- `USER_REGISTERED` → sends welcome email
- `USER_PASSWORD_RESET_REQUESTED` → sends password reset email

## Audit Module

The audit module automatically logs all POST/PUT/PATCH/DELETE requests via `AuditInterceptor`. GET requests are not logged.

### How It Works

- **AuditInterceptor** (`src/modules/shared/framework/audit.interceptor.ts`) — global interceptor registered in `main.ts`
- Captures: method, path, action, actor, organization, IP, user agent, request body (sanitized), status code, duration
- Saves asynchronously (fire-and-forget) to not block responses
- Sensitive fields (password, token, etc.) are automatically redacted from metadata

### AuditLogEntity

- `organizationId` — tenant isolation
- `actorId` — user who performed the action (nullable for unauthenticated requests)
- `method` — HTTP method (POST, PUT, PATCH, DELETE)
- `path` — actual URL with IDs (e.g., `/api/v1/users/abc-123/block`)
- `action` — semantic action name (e.g., `users.block`, `roles.update`)
- `statusCode` — HTTP response status
- `metadata` — `{ params: {...}, body: {...} }` with sensitive fields redacted
- `ipAddress`, `userAgent`, `duration`

### API Endpoints (`/api/v1/audit`)

- `POST /list` — **paginated**, permission: `AUDIT_LIST_READ`
  - Body: `{ page, limit, actorId?, action?, method?, startDate?, endDate? }`
- `GET /:id` — permission: `AUDIT_READ`

### Action Naming Convention

Derived from route path:
- `POST /users/invite` → `users.invite`
- `PUT /roles/:id` → `roles.update`
- `DELETE /roles/:id` → `roles.delete`
- `POST /auth/login` → `auth.login`

---

## Search Module (Typesense)

Global module for full-text search via Typesense (`src/modules/search/`).

**Architecture**:
- `@Global()` module — search services available throughout the app
- Graceful fallback if Typesense unavailable (check `isEnabled()`)
- Three search services: `FoodSearchService`, `RecipeSearchService`, `DietTemplateSearchService`
- Collection schemas in `src/modules/search/collections/`

**Service Methods** (same pattern across all services):
- `isEnabled()` — check if Typesense is configured
- `ensureCollection()` — create collection if missing
- `upsertFoodById(foodId)` / `upsertRecipeById(recipeId)` — sync single document
- `deleteFoodById(foodId)` / `deleteRecipeById(recipeId)` — remove document
- `indexFoods(foods)` — batch index (100 items per batch)
- `dropCollection()` — delete entire collection
- `getCollectionStats()` — document count and status

**API Endpoints** (`/api/v1/search`):
- `GET /key` — get scoped search key (5min expiry) for frontend Typesense client
- `GET /key/:collection` — get collection-specific search key
- `POST /sync` — reindex all data for current organization

**Environment Variables**:
```
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_API_KEY=xyz123
TYPESENSE_SEARCH_KEY=search_key
TYPESENSE_PROTOCOL=http
```

---

## System Admin Module

Super-admin functionality for managing organizations and system-wide features (`src/modules/system-admin/`).

**Guard**: `SystemAdminGuard` — checks if user's organization is the system admin org (first org created)

**API Endpoints** (`/api/v1/system-admin`):
- `POST /organizations/list` — paginated org list with status/subscription filters
- `POST /organizations` — create org with admin user
- `PATCH /organizations/:id/status` — update org status (active/inactive/suspended)
- `POST /organizations/:id/access` — generate access token for impersonation
- `POST /organizations/:id/subscription` — add/extend subscription

**Banners**:
- `GET /banners` — get current system banner
- `PUT /banners` — create/update system banner (type, status, scheduling, targeting)

**Search Management**:
- `GET /search/status` — get Typesense collection stats across all orgs
- `POST /search/sync-all?forceRecreate=true` — reindex all collections (optional recreation)

**Food Overview**:
- `GET /foods/stats-by-org` — food counts per organization
- `POST /foods/list` — paginated foods by organization

---

## Feature Modules

### Leads (`/api/v1/leads`)

CRM lead capture and pipeline management. Leads can be converted to clients after qualification.

- `POST /` — create lead (permission: `LEAD_CREATE`)
- `POST /list` — **paginated** list with filters (status, source, assignedTo, search)
- `GET /:id` — get lead details
- `PUT /:id` — update lead
- `PATCH /:id/status` — update lead status only
- `POST /:id/assign` — assign lead to user
- `DELETE /:id` — soft delete lead

**Statuses**: new, contacted, qualified, unqualified, converted, lost

### Clients (`/api/v1/clients`)

Client profile management with health data. Clients are converted leads or directly created contacts.

- `POST /` — create client (permission: `CLIENT_CREATE`)
- `POST /list` — **paginated** list with filters (status, assignedTo, search)
- `GET /:id` — get client with health profile
- `PUT /:id` — update client
- `PATCH /:id/status` — update client status
- `POST /:id/assign` — assign client to dietitian
- `POST /convert-from-lead` — convert lead to client

**Statuses**: active, inactive, on_hold

### Contact Activities (`/api/v1/contact-activities`)

Activity timeline for leads and clients — tracks all interactions, notes, and system events.

- `POST /` — create activity (note, call, email, meeting, etc.)
- `POST /list` — **paginated** list filtered by contactId and activityType

**Activity Types**: note, call, email, meeting, status_change, assignment, subscription events, diet plan events, vital records

### Food Database (`/api/v1/foods`)

Nutrition database with food items and macro/micro nutrient data.

- `POST /` — create food item (permission: `FOOD_CREATE`)
- `POST /list` — **paginated** list with search and category filter
- `GET /:id` — get food details with full nutrition info
- `PUT /:id` — update food item
- `DELETE /:id` — delete food item

**Nutrition Fields**: calories, protein, carbs, fat, fiber, serving size, serving unit
**Enhanced Fields**: category, servingTemperature, difficulty, cuisine, mealType, isTravelFriendly

### Recipes (`/api/v1/recipes`)

Recipe management with public sharing and forking capabilities.

- `POST /` — create recipe linked to food item
- `POST /list` — **paginated** org recipes with search/tags filter
- `GET /:id` — get recipe with full details
- `PUT /:id` — update recipe
- `DELETE /:id` — delete recipe
- `POST /:id/publish` — make recipe public
- `POST /:id/unpublish` — make recipe private
- `POST /:id/fork` — copy public recipe to your org

**Public Recipes** (no auth):
- `GET /public` — list public recipes
- `GET /public/:slug` — get public recipe by slug

**Recipe Fields**: title, slug, ingredients (JSONB), instructions, prepTimeMinutes, cookTimeMinutes, servings, images[], tags[], isPublic, seoTitle, seoDescription

### Diet Templates (`/api/v1/diet-templates`)

Reusable 7-day diet plan templates that can be applied to clients.

- `POST /` — create template (permission: `DIET_TEMPLATE_CREATE`)
- `POST /list` — **paginated** list with search and tags filter
- `GET /:id` — get template with full meal grid
- `PUT /:id` — update template
- `DELETE /:id` — delete template

**Structure**: Template contains 7 days, each day has meals (breakfast, lunch, dinner, snacks), each meal has food items with quantities

### Client Diet (`/api/v1/client-diet`)

Assign and manage daily diet plans for individual clients.

- `POST /` — save single diet day for client
- `POST /bulk` — save multiple diet days at once
- `POST /list` — **paginated** list of diet days for a client
- `GET /:contactId/:date` — get specific day's diet plan
- `DELETE /:contactId/:date` — delete diet day
- `POST /export-pdf` — export diet plan as PDF

### Vitals (`/api/v1/vitals`)

Health vitals tracking with progress visualization.

- `POST /` — record single vital measurement
- `POST /bulk` — record multiple vitals at once
- `POST /list` — **paginated** list filtered by contactId and vitalType
- `POST /chart` — get chart data for progress visualization
- `GET /latest/:contactId` — get latest value for each vital type
- `GET /:id` — get specific vital record
- `PUT /:id` — update vital record
- `DELETE /:id` — delete vital record

**Vital Types**: weight, height, bmi, body_fat, blood_pressure_systolic, blood_pressure_diastolic, blood_sugar_fasting, blood_sugar_pp, waist, hip, chest, arm

### Subscriptions (`/api/v1/subscriptions`)

Client subscription and payment management.

- `POST /` — create subscription (permission: `SUBSCRIPTION_CREATE`)
- `POST /list` — **paginated** list filtered by clientId, status
- `GET /:id` — get subscription with payment history
- `PUT /:id` — update subscription
- `DELETE /:id` — cancel subscription
- `POST /:id/payments` — record payment for subscription
- `GET /:id/payments` — list payments for subscription

**Payment endpoints** (`/api/v1/payments`):
- `PUT /:id` — update payment
- `DELETE /:id` — delete payment

**Subscription Statuses**: active, paused, expired, cancelled
**Payment Modes**: cash, upi, card, bank_transfer, other

### Integrations (`/api/v1/integrations`)

OAuth integrations with external services (Google Calendar, etc.).

- `GET /` — list available and connected integrations
- `POST /:provider/connect` — initiate OAuth flow
- `GET /callback` — OAuth callback handler
- `DELETE /:provider` — disconnect integration

### Storage (`/api/v1/storage`)

Secure file upload via presigned URLs.

- `GET /upload-url` — get presigned S3 upload URL (query: `extension`, `type`)

### Internal Modules (No REST Endpoints)

**Counselling** — First consultation session tracking. Usecases: schedule, conduct, list, complete counselling sessions.

**Follow-ups** — Recurring diet consultation sessions. Usecases: schedule, conduct, list, complete follow-up sessions.

**Reports** — Report generation for clients and organizations. Framework in place for multiple report types.

**Dashboard** — Analytics aggregation. Structure in place for dashboard widgets and metrics.

---

## Linting

- ESLint 9 flat config with TypeScript and Prettier
- Run: `pnpm --filter backend lint`
- TypeScript: `pnpm --filter backend exec tsc --noEmit`

## Swagger

- Available at `/api/docs` in development
- All endpoints documented with `@ApiOperation`, `@ApiResponse`, `@ApiTags`
- Bearer auth configured globally

## Scripts

**Recipe Import** (`scripts/seed-recipes.ts`):
```bash
pnpm --filter backend run seed:recipes
```
- Bulk import recipes from `dataset/recipe.json`
- Uses `scripts/utils/recipe-scraper.ts` for HTML parsing
- Creates food items and linked recipes

**Database Seed** (`scripts/seed.ts`):
```bash
pnpm --filter backend seed
```
- Populates test data (users, leads, clients, foods, templates)
