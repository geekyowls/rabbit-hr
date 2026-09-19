import {
  buildCTAButton,
  buildEmailFooter,
  buildEmailHeader,
  buildEmailWrapper,
  BRAND_NAME,
  escapeHtml,
  FONT_STACK,
  SERIF_STACK,
} from './utils';

export interface UserInviteEmailVariables {
  userName: string;
  inviterName: string;
  organizationName: string;
  inviteLink: string;
  email: string;
  expiryHours: number;
}

export function userInviteEmailSubject(vars: UserInviteEmailVariables): string {
  return `You've been invited to join ${vars.organizationName}`;
}

export function userInviteEmailTemplate(
  vars: UserInviteEmailVariables,
): string {
  const body = `
Hi ${vars.userName},

${vars.inviterName} has invited you to join ${vars.organizationName}.

To accept this invitation and set up your account, please click the link below:
${vars.inviteLink}

You'll be able to create your password and complete your profile.

This invitation will expire in ${vars.expiryHours} hour(s).

If you didn't expect this invitation, you can safely ignore this email.
  `.trim();
  return body;
}

export function userInviteEmailHtml(vars: UserInviteEmailVariables): string {
  const safeUserName = escapeHtml(vars.userName);
  const safeInviterName = escapeHtml(vars.inviterName);
  const safeOrgName = escapeHtml(vars.organizationName);
  const inviterInitial = vars.inviterName.charAt(0).toUpperCase();

  const perks = [
    'Manage leads and clients assigned to you',
    'Create and publish 7-day diet plans for your clients',
    'Track vitals, record consultations, and view activity timelines',
    'Collaborate with your team in one shared workspace',
  ];

  const perkRows = perks
    .map(
      (perk) => `
      <tr>
        <td style="width:20px;vertical-align:top;padding:0 10px 10px 0;" width="20">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="width:20px;height:20px;background-color:#eef4ea;border-radius:50%;border:1px solid #cddfc6;text-align:center;vertical-align:middle;font-size:11px;line-height:20px;color:#3a6b49;" width="20" height="20">
                &#10003;
              </td>
            </tr>
          </table>
        </td>
        <td style="font-family:${FONT_STACK};font-size:13px;color:#4a5e50;line-height:1.5;padding:0 0 10px;vertical-align:top;">
          ${perk}
        </td>
      </tr>`,
    )
    .join('');

  const body = `
${buildEmailHeader()}
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f1;border-bottom:1px solid #e4ede0;">
  <tr>
    <td style="padding:36px 40px 32px;text-align:center;">
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 20px;">
        <tr>
          <td style="width:48px;height:48px;background-color:#1d3d28;border-radius:50%;border:3px solid #ffffff;text-align:center;vertical-align:middle;font-family:${SERIF_STACK};font-size:18px;color:#90c898;line-height:48px;" width="48" height="48">
            ${inviterInitial}
          </td>
          <td style="padding:0 6px;font-size:16px;color:#3a6b49;vertical-align:middle;">
            &rarr;
          </td>
          <td style="width:48px;height:48px;background-color:#eef4ea;border-radius:50%;border:3px solid #ffffff;text-align:center;vertical-align:middle;font-size:20px;line-height:48px;color:#3a6b49;" width="48" height="48">
            &#128100;
          </td>
        </tr>
      </table>
      <h1 style="font-family:${SERIF_STACK};font-size:24px;color:#1a2a1e;margin:0 0 8px;line-height:1.3;font-weight:normal;">You've been invited to<br><em style="font-style:italic;color:#3a8a50;">${safeOrgName}</em></h1>
      <p style="font-family:${FONT_STACK};font-size:14px;color:#5a7060;line-height:1.6;max-width:340px;margin:0 auto;">${safeInviterName} has invited you to join their team on ${BRAND_NAME}.</p>
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:24px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef4ea;border:1px solid #cddfc6;border-radius:8px;">
        <tr>
          <td style="padding:16px 20px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width:36px;height:36px;background-color:#1d3d28;border-radius:8px;text-align:center;vertical-align:middle;font-size:16px;line-height:36px;color:#90c898;" width="36" height="36">
                  &#127968;
                </td>
                <td style="padding-left:14px;">
                  <p style="margin:0 0 2px;font-family:${FONT_STACK};font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8a9e90;">Organization</p>
                  <p style="margin:0;font-family:${FONT_STACK};font-size:14px;font-weight:700;color:#1a2a1e;">${safeOrgName}</p>
                </td>
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
    <td style="padding:24px 40px 8px;">
      <p style="font-family:${FONT_STACK};font-size:14px;color:#3a4e3e;line-height:1.7;margin:0;">
        Hi <strong style="color:#1a2a1e;">${safeUserName}</strong>,<br><br>
        You'll be joining the ${BRAND_NAME} workspace for <strong style="color:#1a2a1e;">${safeOrgName}</strong>. Once you accept, you'll have access to the platform based on the permissions set for your role.
      </p>
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:16px 40px 8px;">
      <p style="margin:0 0 12px;font-family:${FONT_STACK};font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8a9e90;">What you'll have access to</p>
      <table cellpadding="0" cellspacing="0" border="0">
        ${perkRows}
      </table>
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:24px 40px 32px;text-align:center;">
      ${buildCTAButton('Accept Invitation &rarr;', vars.inviteLink)}
      <p style="font-family:${FONT_STACK};font-size:12px;color:#8a9e90;margin:12px 0 0;">This invitation expires in <strong style="color:#c0533a;">${vars.expiryHours} hours</strong></p>
    </td>
  </tr>
</table>

${buildEmailFooter()}`;

  return buildEmailWrapper(body);
}

export function buildUserInviteEmail(vars: UserInviteEmailVariables) {
  return {
    subject: userInviteEmailSubject(vars),
    text: userInviteEmailTemplate(vars),
    html: userInviteEmailHtml(vars),
  };
}
