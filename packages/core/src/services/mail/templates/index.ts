export function buildEmailWithFooter(
  text: string,
  organizationName?: string,
): string {
  const footer = organizationName
    ? `\n\n---\nBest regards,\n${organizationName} Team`
    : '';

  return text.trim() + footer;
}

export * from './utils';
export * from './welcome.template';
export * from './password-reset.template';
export * from './user-invite.template';
export * from './signup-otp.template';
export * from './signup-waitlist.template';
export * from './daily-summary-report.template';
export * from './re-engagement.template';
export * from './form-submission-notification.template';
export * from './invoice-email.template';
export * from './org-welcome.template';
export * from './user-credentials.template';
export * from './admin-password-reset.template';
