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

  CLIENT_LIST_READ = 'client:list:read',
  CLIENT_READ = 'client:read',
  CLIENT_CREATE = 'client:create',
  CLIENT_UPDATE = 'client:update',
  CLIENT_DELETE = 'client:delete',

  JOB_LIST_READ = 'job:list:read',
  JOB_READ = 'job:read',
  JOB_CREATE = 'job:create',
  JOB_UPDATE = 'job:update',
  JOB_DELETE = 'job:delete',

  CANDIDATE_LIST_READ = 'candidate:list:read',
  CANDIDATE_READ = 'candidate:read',
  CANDIDATE_CREATE = 'candidate:create',
  CANDIDATE_UPDATE = 'candidate:update',
  CANDIDATE_DELETE = 'candidate:delete',

  APPLICATION_LIST_READ = 'application:list:read',
  APPLICATION_READ = 'application:read',
  APPLICATION_CREATE = 'application:create',
  APPLICATION_UPDATE = 'application:update',
  APPLICATION_DELETE = 'application:delete',

  TASK_LIST_READ = 'task:list:read',
  TASK_READ = 'task:read',
  TASK_CREATE = 'task:create',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',

  DOCUMENT_READ = 'document:read',
  DOCUMENT_CREATE = 'document:create',
  DOCUMENT_VERIFY = 'document:verify',
  DOCUMENT_DELETE = 'document:delete',

  EMAIL_TEMPLATE_READ = 'email-template:read',
  EMAIL_TEMPLATE_MANAGE = 'email-template:manage',
  EMAIL_TEMPLATE_SEND = 'email-template:send',

  INTERVIEW_LIST_READ = 'interview:list:read',
  INTERVIEW_READ = 'interview:read',
  INTERVIEW_CREATE = 'interview:create',
  INTERVIEW_UPDATE = 'interview:update',
  INTERVIEW_DELETE = 'interview:delete',
  INTERVIEW_SCORECARD_SUBMIT = 'interview:scorecard:submit',
  INTERVIEW_MANAGE = 'interview:manage',

  OFFER_LIST_READ = 'offer:list:read',
  OFFER_READ = 'offer:read',
  OFFER_CREATE = 'offer:create',
  OFFER_UPDATE = 'offer:update',
  OFFER_APPROVE = 'offer:approve',
  OFFER_SEND = 'offer:send',
  OFFER_DELETE = 'offer:delete',

  REPORT_READ = 'report:read',

  INBOX_READ = 'inbox:read',
  INBOX_SEND = 'inbox:send',
  MAILBOX_SHARED_MANAGE = 'mailbox:shared:manage',

  ATS_DASHBOARD_READ = 'ats-dashboard:read',

  ATS_SETTINGS_MANAGE = 'ats-settings:manage',
  PIPELINE_STAGE_MANAGE = 'pipeline-stage:manage',
  CUSTOM_FIELD_MANAGE = 'custom-field:manage',

  CALL_CREATE = 'call:create',

  WHATSAPP_SEND = 'whatsapp:send',
  WHATSAPP_TEMPLATE_MANAGE = 'whatsapp:template:manage',

  JOB_FEED_MANAGE = 'job-feed:manage',

  BILLING_MANAGE = 'billing:manage',
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
  clients: {
    label: 'Clients',
    permissions: [
      PERMISSIONS_ENUM.CLIENT_LIST_READ,
      PERMISSIONS_ENUM.CLIENT_READ,
      PERMISSIONS_ENUM.CLIENT_CREATE,
      PERMISSIONS_ENUM.CLIENT_UPDATE,
      PERMISSIONS_ENUM.CLIENT_DELETE,
    ],
  },
  jobs: {
    label: 'Jobs',
    permissions: [
      PERMISSIONS_ENUM.JOB_LIST_READ,
      PERMISSIONS_ENUM.JOB_READ,
      PERMISSIONS_ENUM.JOB_CREATE,
      PERMISSIONS_ENUM.JOB_UPDATE,
      PERMISSIONS_ENUM.JOB_DELETE,
    ],
  },
  candidates: {
    label: 'Candidates',
    permissions: [
      PERMISSIONS_ENUM.CANDIDATE_LIST_READ,
      PERMISSIONS_ENUM.CANDIDATE_READ,
      PERMISSIONS_ENUM.CANDIDATE_CREATE,
      PERMISSIONS_ENUM.CANDIDATE_UPDATE,
      PERMISSIONS_ENUM.CANDIDATE_DELETE,
    ],
  },
  applications: {
    label: 'Applications',
    permissions: [
      PERMISSIONS_ENUM.APPLICATION_LIST_READ,
      PERMISSIONS_ENUM.APPLICATION_READ,
      PERMISSIONS_ENUM.APPLICATION_CREATE,
      PERMISSIONS_ENUM.APPLICATION_UPDATE,
      PERMISSIONS_ENUM.APPLICATION_DELETE,
    ],
  },
  tasks: {
    label: 'Tasks',
    permissions: [
      PERMISSIONS_ENUM.TASK_LIST_READ,
      PERMISSIONS_ENUM.TASK_READ,
      PERMISSIONS_ENUM.TASK_CREATE,
      PERMISSIONS_ENUM.TASK_UPDATE,
      PERMISSIONS_ENUM.TASK_DELETE,
    ],
  },
  documents: {
    label: 'Documents',
    permissions: [
      PERMISSIONS_ENUM.DOCUMENT_READ,
      PERMISSIONS_ENUM.DOCUMENT_CREATE,
      PERMISSIONS_ENUM.DOCUMENT_VERIFY,
      PERMISSIONS_ENUM.DOCUMENT_DELETE,
    ],
  },
  emailTemplates: {
    label: 'Email Templates',
    permissions: [
      PERMISSIONS_ENUM.EMAIL_TEMPLATE_READ,
      PERMISSIONS_ENUM.EMAIL_TEMPLATE_MANAGE,
      PERMISSIONS_ENUM.EMAIL_TEMPLATE_SEND,
    ],
  },
  interviews: {
    label: 'Interviews',
    permissions: [
      PERMISSIONS_ENUM.INTERVIEW_LIST_READ,
      PERMISSIONS_ENUM.INTERVIEW_READ,
      PERMISSIONS_ENUM.INTERVIEW_CREATE,
      PERMISSIONS_ENUM.INTERVIEW_UPDATE,
      PERMISSIONS_ENUM.INTERVIEW_DELETE,
      PERMISSIONS_ENUM.INTERVIEW_SCORECARD_SUBMIT,
      PERMISSIONS_ENUM.INTERVIEW_MANAGE,
    ],
  },
  offers: {
    label: 'Offers',
    permissions: [
      PERMISSIONS_ENUM.OFFER_LIST_READ,
      PERMISSIONS_ENUM.OFFER_READ,
      PERMISSIONS_ENUM.OFFER_CREATE,
      PERMISSIONS_ENUM.OFFER_UPDATE,
      PERMISSIONS_ENUM.OFFER_APPROVE,
      PERMISSIONS_ENUM.OFFER_SEND,
      PERMISSIONS_ENUM.OFFER_DELETE,
    ],
  },
  reports: {
    label: 'Reports',
    permissions: [PERMISSIONS_ENUM.REPORT_READ],
  },
  inbox: {
    label: 'Inbox',
    permissions: [
      PERMISSIONS_ENUM.INBOX_READ,
      PERMISSIONS_ENUM.INBOX_SEND,
      PERMISSIONS_ENUM.MAILBOX_SHARED_MANAGE,
    ],
  },
  atsDashboard: {
    label: 'ATS Dashboard',
    permissions: [PERMISSIONS_ENUM.ATS_DASHBOARD_READ],
  },
  atsConfiguration: {
    label: 'ATS Configuration',
    permissions: [
      PERMISSIONS_ENUM.ATS_SETTINGS_MANAGE,
      PERMISSIONS_ENUM.PIPELINE_STAGE_MANAGE,
      PERMISSIONS_ENUM.CUSTOM_FIELD_MANAGE,
    ],
  },
  calls: {
    label: 'Calls',
    permissions: [PERMISSIONS_ENUM.CALL_CREATE],
  },
  whatsapp: {
    label: 'WhatsApp',
    permissions: [
      PERMISSIONS_ENUM.WHATSAPP_SEND,
      PERMISSIONS_ENUM.WHATSAPP_TEMPLATE_MANAGE,
    ],
  },
  jobFeed: {
    label: 'Job Board Feed',
    permissions: [PERMISSIONS_ENUM.JOB_FEED_MANAGE],
  },
  billing: {
    label: 'Billing',
    permissions: [PERMISSIONS_ENUM.BILLING_MANAGE],
  },
};
