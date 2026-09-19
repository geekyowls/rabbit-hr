export enum PERMISSIONS_ENUM {
  USER_CREATE = 'user:create',
  USER_LIST_READ_OWN = 'user:list:read:own',
  USER_LIST_READ_TEAM = 'user:list:read:team',
  USER_LIST_READ_ALL = 'user:list:read:all',
  USER_READ_OWN = 'user:read:own',
  USER_READ_TEAM = 'user:read:team',
  USER_READ_ALL = 'user:read:all',
  USER_UPDATE_OWN = 'user:update:own',
  USER_UPDATE_TEAM = 'user:update:team',
  USER_UPDATE_ALL = 'user:update:all',
  USER_UPDATE_STATUS = 'user:update-status',
  USER_IMPERSONATE = 'user:impersonate',

  ROLE_CREATE = 'role:create',
  ROLE_UPDATE_STATUS = 'role:update-status',
  ROLE_READ = 'role:read',
  ROLE_LIST_READ = 'role:list:read',
  ROLE_UPDATE = 'role:update',

  ORGANIZATION_READ = 'organization:read',
  ORGANIZATION_UPDATE = 'organization:update',
  ORGANIZATION_SETTINGS = 'organization:settings',

  AUDIT_LIST_READ = 'audit:list:read',
  AUDIT_READ = 'audit:read',

  INTEGRATION_LIST_READ = 'integration:list:read',
  INTEGRATION_CONNECT = 'integration:connect',
  INTEGRATION_DISCONNECT = 'integration:disconnect',

  TEAM_MANAGE = 'team:manage',

  NOTIFICATION_SEND = 'notification:send',
  NOTIFICATION_LIST_READ = 'notification:list:read',

  NOTIFICATION_DAILY_DIGEST_SCOPE_ASSIGNED = 'notification:daily-digest:scope:assigned',
  NOTIFICATION_DAILY_DIGEST_SCOPE_ALL = 'notification:daily-digest:scope:all',
  NOTIFICATION_DAILY_DIGEST_SLOT_MORNING = 'notification:daily-digest:slot:morning',
  NOTIFICATION_DAILY_DIGEST_SLOT_AFTERNOON = 'notification:daily-digest:slot:afternoon',
  NOTIFICATION_DAILY_DIGEST_SLOT_EVENING = 'notification:daily-digest:slot:evening',
}

export const ALL_PERMISSIONS = Object.values(PERMISSIONS_ENUM);

export enum PermissionScope {
  OWN = 'own',
  TEAM = 'team',
  ALL = 'all',
}

export const PERMISSION_BASE = {
  USER_LIST_READ: 'user:list:read',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
} as const;

export function getPermissionScope(
  permissions: string[],
  basePermission: string,
): PermissionScope | null {
  if (
    permissions.includes(`${basePermission}:${PermissionScope.ALL}`) ||
    permissions.includes(basePermission)
  ) {
    return PermissionScope.ALL;
  }
  if (permissions.includes(`${basePermission}:${PermissionScope.TEAM}`)) {
    return PermissionScope.TEAM;
  }
  if (permissions.includes(`${basePermission}:${PermissionScope.OWN}`)) {
    return PermissionScope.OWN;
  }
  return null;
}

export const PERMISSION_GROUPS: Record<
  string,
  { label: string; permissions: PERMISSIONS_ENUM[] }
> = {
  users: {
    label: 'Users',
    permissions: [
      PERMISSIONS_ENUM.USER_CREATE,
      PERMISSIONS_ENUM.USER_LIST_READ_OWN,
      PERMISSIONS_ENUM.USER_LIST_READ_TEAM,
      PERMISSIONS_ENUM.USER_LIST_READ_ALL,
      PERMISSIONS_ENUM.USER_READ_OWN,
      PERMISSIONS_ENUM.USER_READ_TEAM,
      PERMISSIONS_ENUM.USER_READ_ALL,
      PERMISSIONS_ENUM.USER_UPDATE_OWN,
      PERMISSIONS_ENUM.USER_UPDATE_TEAM,
      PERMISSIONS_ENUM.USER_UPDATE_ALL,
      PERMISSIONS_ENUM.USER_UPDATE_STATUS,
      PERMISSIONS_ENUM.USER_IMPERSONATE,
    ],
  },
  roles: {
    label: 'Roles',
    permissions: [
      PERMISSIONS_ENUM.ROLE_CREATE,
      PERMISSIONS_ENUM.ROLE_LIST_READ,
      PERMISSIONS_ENUM.ROLE_READ,
      PERMISSIONS_ENUM.ROLE_UPDATE,
      PERMISSIONS_ENUM.ROLE_UPDATE_STATUS,
    ],
  },
  organization: {
    label: 'Organization',
    permissions: [
      PERMISSIONS_ENUM.ORGANIZATION_READ,
      PERMISSIONS_ENUM.ORGANIZATION_UPDATE,
      PERMISSIONS_ENUM.ORGANIZATION_SETTINGS,
    ],
  },
  audit: {
    label: 'Audit Logs',
    permissions: [
      PERMISSIONS_ENUM.AUDIT_LIST_READ,
      PERMISSIONS_ENUM.AUDIT_READ,
    ],
  },
  integrations: {
    label: 'Integrations',
    permissions: [
      PERMISSIONS_ENUM.INTEGRATION_LIST_READ,
      PERMISSIONS_ENUM.INTEGRATION_CONNECT,
      PERMISSIONS_ENUM.INTEGRATION_DISCONNECT,
    ],
  },
  teams: {
    label: 'Team Hierarchy',
    permissions: [PERMISSIONS_ENUM.TEAM_MANAGE],
  },
  notifications: {
    label: 'Notifications',
    permissions: [
      PERMISSIONS_ENUM.NOTIFICATION_SEND,
      PERMISSIONS_ENUM.NOTIFICATION_LIST_READ,
    ],
  },
  notificationsDailyDigest: {
    label: 'Daily Digest Email',
    permissions: [
      PERMISSIONS_ENUM.NOTIFICATION_DAILY_DIGEST_SCOPE_ASSIGNED,
      PERMISSIONS_ENUM.NOTIFICATION_DAILY_DIGEST_SCOPE_ALL,
      PERMISSIONS_ENUM.NOTIFICATION_DAILY_DIGEST_SLOT_MORNING,
      PERMISSIONS_ENUM.NOTIFICATION_DAILY_DIGEST_SLOT_AFTERNOON,
      PERMISSIONS_ENUM.NOTIFICATION_DAILY_DIGEST_SLOT_EVENING,
    ],
  },
};
