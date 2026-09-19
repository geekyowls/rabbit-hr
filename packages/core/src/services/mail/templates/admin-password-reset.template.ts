import {
  buildCTAButton,
  buildEmailFooter,
  buildEmailHeader,
  buildEmailWrapper,
  buildFallbackLink,
  buildIconCircle,
  escapeHtml,
  FONT_STACK,
  SERIF_STACK,
} from './utils';

export interface AdminPasswordResetEmailVariables {
  userName: string;
  organizationName: string;
  email: string;
  password: string;
  loginUrl?: string;
}

export function adminPasswordResetEmailSubject(
  vars: AdminPasswordResetEmailVariables,
): string {
  return `Your password has been reset - ${vars.organizationName}`;
}

export function adminPasswordResetEmailTemplate(
  vars: AdminPasswordResetEmailVariables,
): string {
  return `
Hi ${vars.userName},

Your password on ${vars.organizationName} has been reset by an administrator.

Here are your updated login credentials:

Email: ${vars.email}
New Password: ${vars.password}

${vars.loginUrl ? `You can log in at: ${vars.loginUrl}` : 'You can now log in to your account.'}

Please change your password after logging in.

If you did not expect this change, please contact your administrator immediately.
  `.trim();
}

export function adminPasswordResetEmailHtml(
  vars: AdminPasswordResetEmailVariables,
): string {
  const safeUserName = escapeHtml(vars.userName);
  const safeOrgName = escapeHtml(vars.organizationName);
  const safeEmail = escapeHtml(vars.email);
  const safePassword = escapeHtml(vars.password);

  const body = `
${buildEmailHeader()}
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:44px 40px 0;text-align:center;">
      ${buildIconCircle('&#128274;', '#fff6f0', '#f0d4c4', '#c0533a')}
      <h1 style="font-family:${SERIF_STACK};font-size:24px;color:#1a2a1e;margin:20px 0 10px;line-height:1.3;font-weight:normal;">Your password has been reset</h1>
      <p style="font-family:${FONT_STACK};font-size:14px;color:#5a7060;line-height:1.6;max-width:380px;margin:0 auto 28px;">
        Hi <strong style="color:#1a2a1e;">${safeUserName}</strong>, your password on <strong style="color:#1a2a1e;">${safeOrgName}</strong> has been reset by an administrator.
      </p>
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:0 40px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f1;border:1px solid #e4ede0;border-radius:8px;">
        <tr>
          <td style="padding:18px 22px;">
            <p style="margin:0 0 10px;font-family:${FONT_STACK};font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8a9e90;">Updated login credentials</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:7px 0;font-family:${FONT_STACK};font-size:13px;font-weight:700;color:#5a7060;width:110px;" width="110">Email</td>
                <td style="padding:7px 0;font-family:${FONT_STACK};font-size:13px;color:#1a2a1e;">${safeEmail}</td>
              </tr>
              <tr>
                <td style="padding:7px 0;border-top:1px solid #e4ede0;font-family:${FONT_STACK};font-size:13px;font-weight:700;color:#5a7060;width:110px;" width="110">New Password</td>
                <td style="padding:7px 0;border-top:1px solid #e4ede0;font-family:${FONT_STACK};font-size:13px;color:#1a2a1e;">${safePassword}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

${
  vars.loginUrl
    ? `<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:0 40px 14px;text-align:center;">
      ${buildCTAButton('Log In to Your Account &rarr;', vars.loginUrl)}
    </td>
  </tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:0 40px 20px;">
      ${buildFallbackLink(vars.loginUrl)}
    </td>
  </tr>
</table>`
    : ''
}

<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:8px 40px 28px;">
      <p style="font-family:${FONT_STACK};font-size:12px;color:#c0533a;font-weight:700;margin:0 0 10px;">Please change your password after logging in.</p>
      <p style="font-family:${FONT_STACK};font-size:13px;color:#8a9e90;line-height:1.6;margin:0;">
        If you did not expect this change, please contact your administrator immediately.
      </p>
    </td>
  </tr>
</table>
${buildEmailFooter()}`;

  return buildEmailWrapper(body);
}

export function buildAdminPasswordResetEmail(
  vars: AdminPasswordResetEmailVariables,
) {
  return {
    subject: adminPasswordResetEmailSubject(vars),
    text: adminPasswordResetEmailTemplate(vars),
    html: adminPasswordResetEmailHtml(vars),
  };
}
