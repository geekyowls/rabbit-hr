export const CACHE_TTL = {
  LOGIN_LOCKOUT: 1800,
  OTP_LOCKOUT_COUNT: 3600,
  WEBHOOK_DEDUP: 86400,
  OAUTH_NONCE: 600,
  DIET_SHARE: 300,
  DIET_SHARE_OTP: 600,
  DIET_SHARE_OTP_RATE: 900,
  DIET_SHARE_OTP_ATTEMPTS: 600,
  TEAM_DESCENDANTS: 300,
  COVERAGE_COVERED: 300,
  INTEGRATION_CAPABILITIES: 60,
  PORTAL_OTP: 600,
  PORTAL_OTP_RATE: 900,
  BILLING_STATE: 60,
  ONBOARDING_CHECKLIST: 30,
} as const;

export const CACHE_KEYS = {
  loginAttempts: (email: string) => `login_attempts:${email}`,
  otpLockout: (email: string) => `otp_lockout:${email}`,
  otpLockoutCount: (email: string) => `otp_lockout_count:${email}`,
  webhookDodo: (webhookId: string) => `webhook:dodo:${webhookId}`,
  webhookRazorpay: (webhookId: string) => `webhook:razorpay:${webhookId}`,
  oauthNonce: (nonce: string) => `oauth_nonce:${nonce}`,
  integrationCapabilities: (organizationId: string) =>
    `${organizationId}:integration:capabilities`,
  billingState: (organizationId: string) => `${organizationId}:billing:state`,
  onboardingChecklist: (organizationId: string) =>
    `${organizationId}:onboarding:checklist`,
  mailboxOauthNonce: (organizationId: string, nonce: string) =>
    `${organizationId}:mailbox-oauth-nonce:${nonce}`,
  dietShare: (organizationId: string, token: string) =>
    `${organizationId}:diet-share:${token}`,
  dietShareOtp: (token: string) => `diet-share-otp:${token}`,
  dietShareOtpRate: (token: string) => `diet-share-otp-rate:${token}`,
  dietShareOtpAttempts: (token: string) => `diet-share-otp-attempts:${token}`,
  teamDescendants: (organizationId: string, userId: string) =>
    `${organizationId}:team:descendants:${userId}`,
  teamOrgKeys: (organizationId: string) => `${organizationId}:team:org_keys`,
  coverageCovered: (organizationId: string, userId: string) =>
    `${organizationId}:coverage:covered:${userId}`,
  portalOtp: (organizationId: string, emailHash: string) =>
    `${organizationId}:portal:otp:${emailHash}`,
  portalOtpRate: (organizationId: string, emailHash: string) =>
    `${organizationId}:portal:otp-rate:${emailHash}`,
} as const;
