import {
  buildCTAButton,
  buildEmailFooter,
  buildEmailHeader,
  buildEmailWrapper,
  buildFallbackLink,
  buildIconCircle,
  BRAND_NAME,
  escapeHtml,
  FONT_STACK,
  SERIF_STACK,
} from './utils';

export interface OrgWelcomeEmailVariables {
  adminName: string;
  organizationName: string;
  email: string;
  password: string;
  loginLink: string;
}

export function orgWelcomeEmailSubject(vars: OrgWelcomeEmailVariables): string {
  return `Your organization ${vars.organizationName} is ready on ${BRAND_NAME}`;
}

export function orgWelcomeEmailTemplate(
  vars: OrgWelcomeEmailVariables,
): string {
  return `
Hi ${vars.adminName},

Your organization ${vars.organizationName} has been created on ${BRAND_NAME}. You've been set up as the administrator.

Here are your login credentials:

Email: ${vars.email}
Password: ${vars.password}

Log in here: ${vars.loginLink}

As the admin, you can:
- Manage your team and invite other users
- Set up client profiles and diet plans
- Track counselling sessions and follow-ups
- Configure roles and permissions

We recommend changing your password after your first login.

If you didn't expect this, please contact support.
  `.trim();
}

export function orgWelcomeEmailHtml(vars: OrgWelcomeEmailVariables): string {
  const safeName = escapeHtml(vars.adminName);
  const safeOrgName = escapeHtml(vars.organizationName);
  const safeEmail = escapeHtml(vars.email);
  const safePassword = escapeHtml(vars.password);

  const perks = [
    'Manage your team and invite other users',
    'Set up client profiles and diet plans',
    'Track counselling sessions and follow-ups',
    'Configure roles and permissions',
  ];

  const perkRows = perks
    .map(
      (perk) => `
      <tr>
        <td style="width:20px;vertical-align:top;padding:0 10px 8px 0;" width="20">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="width:20px;height:20px;background-color:#eef4ea;border-radius:50%;border:1px solid #cddfc6;text-align:center;vertical-align:middle;font-size:11px;line-height:20px;color:#3a6b49;" width="20" height="20">
                &#10003;
              </td>
            </tr>
          </table>
        </td>
        <td style="font-family:${FONT_STACK};font-size:13px;color:#4a5e50;line-height:1.5;padding:0 0 8px;vertical-align:top;">
          ${perk}
        </td>
      </tr>`,
    )
    .join('');

  const body = `
${buildEmailHeader()}
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:44px 40px 0;text-align:center;">
      ${buildIconCircle('&#127968;', '#eef4ea', '#cddfc6', '#1d3d28')}
      <h1 style="font-family:${SERIF_STACK};font-size:24px;color:#1a2a1e;margin:20px 0 10px;line-height:1.3;font-weight:normal;">Your organization is ready</h1>
      <p style="font-family:${FONT_STACK};font-size:14px;color:#5a7060;line-height:1.6;max-width:380px;margin:0 auto 28px;">
        Hi <strong style="color:#1a2a1e;">${safeName}</strong>, your organization <strong style="color:#1a2a1e;">${safeOrgName}</strong> has been created on ${BRAND_NAME}.
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
            <p style="margin:0 0 10px;font-family:${FONT_STACK};font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8a9e90;">Your login credentials</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:7px 0;font-family:${FONT_STACK};font-size:13px;font-weight:700;color:#5a7060;width:80px;" width="80">Email</td>
                <td style="padding:7px 0;font-family:${FONT_STACK};font-size:13px;color:#1a2a1e;">${safeEmail}</td>
              </tr>
              <tr>
                <td style="padding:7px 0;border-top:1px solid #e4ede0;font-family:${FONT_STACK};font-size:13px;font-weight:700;color:#5a7060;width:80px;" width="80">Password</td>
                <td style="padding:7px 0;border-top:1px solid #e4ede0;font-family:${FONT_STACK};font-size:13px;color:#1a2a1e;">${safePassword}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:0 40px 14px;text-align:center;">
      ${buildCTAButton('Log In to Your Account &rarr;', vars.loginLink)}
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:0 40px 8px;">
      ${buildFallbackLink(vars.loginLink)}
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:18px 40px 8px;">
      <p style="margin:0 0 12px;font-family:${FONT_STACK};font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8a9e90;">As admin, you can</p>
      <table cellpadding="0" cellspacing="0" border="0">
        ${perkRows}
      </table>
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:14px 40px 28px;">
      <p style="font-family:${FONT_STACK};font-size:12px;color:#c0533a;font-weight:700;margin:0;">We recommend changing your password after your first login.</p>
    </td>
  </tr>
</table>
${buildEmailFooter()}`;

  return buildEmailWrapper(body);
}

export function buildOrgWelcomeEmail(vars: OrgWelcomeEmailVariables) {
  return {
    subject: orgWelcomeEmailSubject(vars),
    text: orgWelcomeEmailTemplate(vars),
    html: orgWelcomeEmailHtml(vars),
  };
}
