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
    CAPABILITIES: '/integrations/capabilities',
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
  CLIENTS: {
    LIST: '/clients/list',
    CREATE: '/clients',
    GET: (id: string) => `/clients/${id}` as const,
    UPDATE: (id: string) => `/clients/${id}` as const,
    DELETE: (id: string) => `/clients/${id}` as const,
    CREATE_CONTACT: (id: string) => `/clients/${id}/contacts` as const,
    UPDATE_CONTACT: (id: string, contactId: string) =>
      `/clients/${id}/contacts/${contactId}` as const,
    DELETE_CONTACT: (id: string, contactId: string) =>
      `/clients/${id}/contacts/${contactId}` as const,
  },
  JOBS: {
    LIST: '/jobs/list',
    CREATE: '/jobs',
    GET: (id: string) => `/jobs/${id}` as const,
    UPDATE: (id: string) => `/jobs/${id}` as const,
    UPDATE_STATUS: (id: string) => `/jobs/${id}/status` as const,
    DELETE: (id: string) => `/jobs/${id}` as const,
  },
  CANDIDATES: {
    LIST: '/candidates/list',
    CREATE: '/candidates',
    GET: (id: string) => `/candidates/${id}` as const,
    UPDATE: (id: string) => `/candidates/${id}` as const,
    DELETE: (id: string) => `/candidates/${id}` as const,
    DOCUMENTS: (id: string) => `/candidates/${id}/documents` as const,
    CREATE_DOCUMENT: (id: string) => `/candidates/${id}/documents` as const,
  },
  APPLICATIONS: {
    LIST: '/applications/list',
    BOARD: '/applications/board',
    CREATE: '/applications',
    GET: (id: string) => `/applications/${id}` as const,
    UPDATE: (id: string) => `/applications/${id}` as const,
    UPDATE_STAGE: (id: string) => `/applications/${id}/stage` as const,
    DELETE: (id: string) => `/applications/${id}` as const,
    SEND_EMAIL: (id: string) => `/applications/${id}/email` as const,
  },
  ACTIVITIES: {
    LIST: '/activities/list',
    CREATE: '/activities',
  },
  TASKS: {
    LIST: '/tasks/list',
    CREATE: '/tasks',
    UPDATE: (id: string) => `/tasks/${id}` as const,
    COMPLETE: (id: string) => `/tasks/${id}/complete` as const,
    DELETE: (id: string) => `/tasks/${id}` as const,
  },
  INTERVIEWS: {
    LIST: '/interviews/list',
    CREATE: '/interviews',
    GET: (id: string) => `/interviews/${id}` as const,
    UPDATE: (id: string) => `/interviews/${id}` as const,
    UPDATE_STATUS: (id: string) => `/interviews/${id}/status` as const,
    DELETE: (id: string) => `/interviews/${id}` as const,
    SUBMIT_SCORECARD: (id: string) => `/interviews/${id}/scorecards` as const,
    BY_APPLICATION: (applicationId: string) =>
      `/applications/${applicationId}/interviews` as const,
  },
  AVAILABILITY: {
    ME: '/me/availability',
    TIME_OFF: (query?: string) =>
      query ? (`/me/time-off?${query}` as const) : ('/me/time-off' as const),
    TIME_OFF_ITEM: (id: string) => `/me/time-off/${id}` as const,
  },
  INTERVIEW_BOOKING_LINKS: {
    LIST: (query?: string) =>
      query
        ? (`/interview-booking-links?${query}` as const)
        : ('/interview-booking-links' as const),
    CREATE: '/interview-booking-links',
    CANCEL: (id: string) => `/interview-booking-links/${id}/cancel` as const,
  },
  PUBLIC_INTERVIEW_BOOKING: {
    DETAILS: (token: string) =>
      `/public/interview-booking/${encodeURIComponent(token)}` as const,
    SLOTS: (token: string, query: string) =>
      `/public/interview-booking/${encodeURIComponent(token)}/slots?${query}` as const,
    BOOK: (token: string) =>
      `/public/interview-booking/${encodeURIComponent(token)}/book` as const,
    CANCEL: (token: string) =>
      `/public/interview-booking/${encodeURIComponent(token)}/cancel` as const,
  },
  OFFERS: {
    LIST: '/offers/list',
    CREATE: '/offers',
    GET: (id: string) => `/offers/${id}` as const,
    UPDATE: (id: string) => `/offers/${id}` as const,
    SUBMIT: (id: string) => `/offers/${id}/submit` as const,
    APPROVE: (id: string) => `/offers/${id}/approve` as const,
    REJECT: (id: string) => `/offers/${id}/reject` as const,
    SEND: (id: string) => `/offers/${id}/send` as const,
    RESPOND: (id: string) => `/offers/${id}/respond` as const,
    WITHDRAW: (id: string) => `/offers/${id}/withdraw` as const,
    DELETE: (id: string) => `/offers/${id}` as const,
  },
  REPORTS: {
    SUMMARY: (query?: string) =>
      query
        ? (`/reports/summary?${query}` as const)
        : ('/reports/summary' as const),
  },
  DOCUMENTS: {
    VERIFY: (id: string) => `/documents/${id}/verify` as const,
    DOWNLOAD_URL: (id: string) => `/documents/${id}/download-url` as const,
    DELETE: (id: string) => `/documents/${id}` as const,
  },
  EMAIL_TEMPLATES: {
    LIST: (category?: string) =>
      category
        ? (`/email-templates?category=${encodeURIComponent(category)}` as const)
        : ('/email-templates' as const),
    CREATE: '/email-templates',
    UPDATE: (id: string) => `/email-templates/${id}` as const,
    DELETE: (id: string) => `/email-templates/${id}` as const,
  },
  ATS: {
    DASHBOARD: '/ats/dashboard',
  },
  ATS_SETTINGS: {
    GET: '/ats-settings',
    UPDATE: '/ats-settings',
  },
  PIPELINE_STAGES: {
    LIST: '/pipeline-stages',
    REPLACE: '/pipeline-stages',
  },
  CUSTOM_FIELDS: {
    LIST: (query?: string) =>
      query
        ? (`/custom-fields?${query}` as const)
        : ('/custom-fields' as const),
    CREATE: '/custom-fields',
    UPDATE: (id: string) => `/custom-fields/${id}` as const,
    DELETE: (id: string) => `/custom-fields/${id}` as const,
    REORDER: '/custom-fields/reorder',
  },
  CALLS: {
    LIST: (candidateId: string, query?: string) =>
      query
        ? (`/candidates/${candidateId}/calls?${query}` as const)
        : (`/candidates/${candidateId}/calls` as const),
    INITIATE: (candidateId: string) =>
      `/candidates/${candidateId}/calls/initiate` as const,
    UPDATE: (id: string) => `/calls/${id}` as const,
  },
  WHATSAPP: {
    PLACEHOLDERS: '/whatsapp/placeholders',
    TEMPLATES: '/whatsapp/templates',
    SYNC_TEMPLATES: '/whatsapp/templates/sync',
    DELETE_TEMPLATE: (id: string) => `/whatsapp/templates/${id}` as const,
    TEMPLATE_MAPPING: (id: string) =>
      `/whatsapp/templates/${id}/mapping` as const,
    PREVIEW: '/whatsapp/messages/preview',
    SEND: '/whatsapp/messages/send',
    CANDIDATE_MESSAGES: (candidateId: string, query?: string) =>
      query
        ? (`/candidates/${candidateId}/whatsapp-messages?${query}` as const)
        : (`/candidates/${candidateId}/whatsapp-messages` as const),
  },
  JOB_FEED: {
    SETTINGS: '/job-feed/settings',
  },
  PUBLIC_OFFER_SIGN: {
    GET: (token: string) => `/public/offers/sign/${token}` as const,
    ACCEPT: (token: string) => `/public/offers/sign/${token}/accept` as const,
    DECLINE: (token: string) => `/public/offers/sign/${token}/decline` as const,
  },
  MAILBOXES: {
    LIST: '/mailboxes',
    CONNECT: (provider: string) => `/mailboxes/connect/${provider}` as const,
    DISCONNECT: (id: string) => `/mailboxes/${id}` as const,
    SYNC: (id: string) => `/mailboxes/${id}/sync` as const,
  },
  INBOX: {
    THREADS: '/inbox/threads/list',
    THREAD: (id: string) => `/inbox/threads/${id}` as const,
    UPDATE_THREAD: (id: string) => `/inbox/threads/${id}` as const,
    SEND: '/inbox/messages/send',
    STATS: (query?: string) =>
      query ? (`/inbox/stats?${query}` as const) : ('/inbox/stats' as const),
  },
  PUBLIC_CAREERS: {
    ORGANIZATION: (orgSlug: string) => `/public/careers/${orgSlug}` as const,
    JOBS: (orgSlug: string, query?: string) =>
      query
        ? (`/public/careers/${orgSlug}/jobs?${query}` as const)
        : (`/public/careers/${orgSlug}/jobs` as const),
    JOB: (orgSlug: string, jobId: string) =>
      `/public/careers/${orgSlug}/jobs/${jobId}` as const,
    APPLY: (orgSlug: string, jobId: string) =>
      `/public/careers/${orgSlug}/jobs/${jobId}/apply` as const,
    UPLOAD_URL: (orgSlug: string) =>
      `/public/careers/${orgSlug}/upload-url` as const,
  },
  PORTAL: {
    BRANDING: (orgSlug: string) => `/portal/auth/${orgSlug}` as const,
    REQUEST_OTP: (orgSlug: string) =>
      `/portal/auth/${orgSlug}/otp/request` as const,
    VERIFY_OTP: (orgSlug: string) =>
      `/portal/auth/${orgSlug}/otp/verify` as const,
    REFRESH: '/portal/auth/refresh',
    LOGOUT: '/portal/auth/logout',
    ME: '/portal/me',
    OVERVIEW: '/portal/overview',
    APPLICATIONS: '/portal/applications',
    APPLICATION: (id: string) => `/portal/applications/${id}` as const,
    WITHDRAW: (id: string) => `/portal/applications/${id}/withdraw` as const,
    INTERVIEWS: '/portal/interviews',
    OFFERS: '/portal/offers',
    DOCUMENTS: '/portal/documents',
    UPLOAD_URL: '/portal/documents/upload-url',
    DOCUMENT_DOWNLOAD: (id: string) =>
      `/portal/documents/${id}/download-url` as const,
    PROFILE: '/portal/profile',
    INVITE: (candidateId: string) =>
      `/candidates/${candidateId}/portal-invite` as const,
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
