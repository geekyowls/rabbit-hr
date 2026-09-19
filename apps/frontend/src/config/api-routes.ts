const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const API_PREFIX = '/api/v1';

export const API_URL = `${API_BASE}${API_PREFIX}`;

export const API_ROUTES = {
  VERSION: '/version',
  HEALTH: '/health',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/reset/request',
    RESET_PASSWORD: '/auth/reset',
    UPDATE_PASSWORD: '/auth/update-password',
    GOOGLE: '/auth/google',
    IMPERSONATE: '/auth/impersonate',
    SEND_SIGNUP_OTP: '/auth/signup/send-otp',
    VERIFY_SIGNUP_OTP: '/auth/signup/verify-otp',
    ONBOARDING_CONTEXT: '/auth/onboarding-context',
  },
  USERS: {
    ME: '/users/me',
    PROFILE: '/users/profile',
    LIST: '/users/list',
    NAMES: (teamOnly?: boolean) =>
      teamOnly ? '/users/names?teamOnly=true' : '/users/names',
    INVITE: '/users/invite',
    CREATE: '/users/create',
    ACCEPT_INVITE: '/users/accept-invite',
    RESEND_INVITE: '/users/resend-invite',
    COMPLETE_TOUR: '/users/tour-complete',
    UPDATE: (id: string) => `/users/${id}` as const,
    BLOCK: (id: string) => `/users/${id}/block` as const,
    UNBLOCK: (id: string) => `/users/${id}/unblock` as const,
    HIERARCHY: '/users/hierarchy',
    SET_MANAGER: (id: string) => `/users/${id}/set-manager` as const,
    DESCENDANTS: (id: string) => `/users/${id}/descendants` as const,
    RESET_PASSWORD: (id: string) => `/users/${id}/reset-password` as const,
    PAGE_PREFERENCES: '/users/me/page-preferences',
  },
  ROLES: {
    LIST: '/roles',
    LIST_FULL: '/roles/list',
    CREATE: '/roles',
    GET: (id: string) => `/roles/${id}` as const,
    UPDATE: (id: string) => `/roles/${id}` as const,
    DELETE: (id: string) => `/roles/${id}` as const,
  },
  AUDIT: {
    LIST: '/audit/list',
    GET: (id: string) => `/audit/${id}` as const,
  },
  SESSIONS: {
    LIST: '/sessions',
    REVOKE: (id: string) => `/sessions/${id}/revoke` as const,
  },
  NOTIFICATION_FEED: {
    FEED: '/me/notifications',
    MARK_READ: (id: string) => `/me/notifications/${id}/read` as const,
    READ_ALL: '/me/notifications/read-all',
    WEB_PUSH_PUBLIC_KEY: '/me/notifications/web-push/public-key',
    WEB_PUSH_SUBSCRIBE: '/me/notifications/web-push/subscribe',
    WEB_PUSH_UNSUBSCRIBE: '/me/notifications/web-push/unsubscribe',
    TEST: '/me/notifications/dev/test',
  },
  INTEGRATIONS: {
    LIST: '/integrations',
    CONNECT: (provider: string) => `/integrations/${provider}/connect` as const,
    DISCONNECT: (provider: string) => `/integrations/${provider}` as const,
    CREDENTIALS: (provider: string) =>
      `/integrations/${provider}/credentials` as const,
    HEALTH_CHECK: (provider: string) =>
      `/integrations/${provider}/health-check` as const,
    RAZORPAY_WEBHOOK_TOKEN: '/integrations/razorpay/webhook-token',
    RAZORPAY_WEBHOOK: (token: string) =>
      `/integrations/razorpay/webhook/${token}` as const,
  },
  ORGANIZATION: {
    GET: '/organization',
    UPDATE: '/organization',
  },
  ORGANIZATION_CONFIG: {
    CREATE: '/organization-config',
  },
  STORAGE: {
    UPLOAD_URL: '/storage/upload-url',
  },
  SYSTEM_ADMIN: {
    ORGANIZATIONS: {
      LIST: '/system-admin/organizations/list',
      CREATE: '/system-admin/organizations',
      UPDATE_STATUS: (id: string) =>
        `/system-admin/organizations/${id}/status` as const,
      ACCESS: (id: string) =>
        `/system-admin/organizations/${id}/access` as const,
    },
    RESET_LOGIN_LOCKOUT: '/system-admin/reset-login-lockout',
    SYNC_PERMISSIONS: '/system-admin/sync-permissions',
  },
} as const;

export function buildApiUrl(route: string): string {
  return `${API_URL}${route}`;
}
