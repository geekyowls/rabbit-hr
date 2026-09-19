import {
  buildCTAButton,
  buildDivider,
  buildEmailFooter,
  buildEmailHeader,
  buildEmailWrapper,
  buildFallbackLink,
  buildIconCircle,
  escapeHtml,
  FONT_STACK,
  SERIF_STACK,
  SUPPORT_EMAIL,
} from './utils';

export interface PasswordResetEmailVariables {
  userName: string;
  organizationName: string;
  resetLink: string;
  expiryHours: number;
}

export function passwordResetEmailSubject(
  _vars: PasswordResetEmailVariables,
): string {
  return 'Reset Your Password';
}

export function passwordResetEmailTemplate(
  vars: PasswordResetEmailVariables,
): string {
  return `
Hi ${vars.userName},

We received a request to reset your password for ${vars.organizationName}.

To reset your password, please click the link below:
${vars.resetLink}

This link will expire in ${vars.expiryHours} hour(s).

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

For security reasons, please do not share this link with anyone.
  `.trim();
}

export function passwordResetEmailHtml(
  vars: PasswordResetEmailVariables,
): string {
  const safeUserName = escapeHtml(vars.userName);

  const body = `
${buildEmailHeader()}
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:44px 40px 36px;text-align:center;">
      ${buildIconCircle('&#128274;', '#fff6f0', '#f0d4c4', '#c0533a')}
      <h1 style="font-family:${SERIF_STACK};font-size:24px;color:#1a2a1e;margin:20px 0 10px;line-height:1.3;font-weight:normal;">Reset your password</h1>
      <p style="font-family:${FONT_STACK};font-size:14px;color:#5a7060;line-height:1.6;max-width:360px;margin:0 auto 28px;">We received a request to reset the password for <strong style="color:#1a2a1e;">${safeUserName}</strong>. Click the button below to choose a new one.</p>

      ${buildCTAButton('Reset Password &rarr;', vars.resetLink)}

      <p style="font-family:${FONT_STACK};font-size:12px;color:#8a9e90;margin:14px 0 28px;">This link expires in <strong style="color:#c0533a;">${vars.expiryHours} hour(s)</strong></p>

      ${buildDivider()}

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
        <tr><td>${buildFallbackLink(vars.resetLink)}</td></tr>
      </table>

      <p style="font-family:${FONT_STACK};font-size:12px;color:#8a9e90;line-height:1.6;margin:0;">
        Didn't request a password reset? Your account is safe &mdash; ignore this email.<br>
        Still having trouble? <a href="mailto:${SUPPORT_EMAIL}" style="color:#3a6b49;text-decoration:none;">${SUPPORT_EMAIL}</a>
      </p>
    </td>
  </tr>
</table>
${buildEmailFooter()}`;

  return buildEmailWrapper(body);
}

export function buildPasswordResetEmail(vars: PasswordResetEmailVariables) {
  return {
    subject: passwordResetEmailSubject(vars),
    text: passwordResetEmailTemplate(vars),
    html: passwordResetEmailHtml(vars),
  };
}
