import { formatPhone } from '@boilerplate/shared';
import {
  buildEmailFooter,
  buildEmailHeader,
  buildEmailWrapper,
  buildIconCircle,
  escapeHtml,
  FONT_STACK,
  SERIF_STACK,
} from './utils';

export interface SignupWaitlistVariables {
  email: string;
  firstName: string;
  lastName?: string | null;
  phone: string | null;
  phoneCountryCode: string | null;
  organizationName: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  submittedAt: Date;
}

function displayPhone(vars: SignupWaitlistVariables): string {
  return vars.phone
    ? formatPhone(vars.phoneCountryCode ?? 'GB', vars.phone)
    : 'Not provided';
}

export function signupWaitlistSubject(vars: SignupWaitlistVariables): string {
  return `[RabbitHR] New signup lead: ${vars.firstName} (${vars.organizationName})`;
}

export function signupWaitlistText(vars: SignupWaitlistVariables): string {
  const fullName = [vars.firstName, vars.lastName].filter(Boolean).join(' ');
  const phoneDisplay = displayPhone(vars);
  return `
A new signup attempt was received while waitlist mode is active.

Name: ${fullName}
Email: ${vars.email}
Phone: ${phoneDisplay}
Organization: ${vars.organizationName}
Submitted: ${vars.submittedAt.toISOString()}
IP: ${vars.ipAddress || 'unknown'}
User Agent: ${vars.userAgent || 'unknown'}

Reach out to onboard them manually.
  `.trim();
}

export function signupWaitlistHtml(vars: SignupWaitlistVariables): string {
  const fullName = [vars.firstName, vars.lastName].filter(Boolean).join(' ');
  const phoneDisplay = displayPhone(vars);
  const phoneTel = phoneDisplay.replace(/[^\d+]/g, '');
  const rows: Array<[string, string]> = [
    ['Name', escapeHtml(fullName)],
    [
      'Email',
      `<a href="mailto:${escapeHtml(vars.email)}" style="color:#3a6b49;text-decoration:none;">${escapeHtml(vars.email)}</a>`,
    ],
    [
      'Phone',
      `<a href="tel:${escapeHtml(phoneTel)}" style="color:#3a6b49;text-decoration:none;">${escapeHtml(phoneDisplay)}</a>`,
    ],
    ['Organization', escapeHtml(vars.organizationName)],
    ['Submitted', escapeHtml(vars.submittedAt.toISOString())],
    ['IP', escapeHtml(vars.ipAddress || 'unknown')],
    ['User Agent', escapeHtml(vars.userAgent || 'unknown')],
  ];

  const tableRows = rows
    .map(
      ([label, value], i) => `
              <tr>
                <td style="padding:8px 0;${i > 0 ? 'border-top:1px solid #e4ede0;' : ''}font-family:${FONT_STACK};font-size:13px;font-weight:700;color:#5a7060;width:100px;vertical-align:top;" width="100">${label}</td>
                <td style="padding:8px 0;${i > 0 ? 'border-top:1px solid #e4ede0;' : ''}font-family:${FONT_STACK};font-size:13px;color:#1a2a1e;word-break:break-word;">${value}</td>
              </tr>`,
    )
    .join('');

  const body = `
${buildEmailHeader()}
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:44px 40px 0;text-align:center;">
      ${buildIconCircle('&#9993;', '#eef4ea', '#cddfc6', '#1d3d28')}
      <h1 style="font-family:${SERIF_STACK};font-size:24px;color:#1a2a1e;margin:20px 0 10px;line-height:1.3;font-weight:normal;">New signup lead</h1>
      <p style="font-family:${FONT_STACK};font-size:14px;color:#5a7060;line-height:1.6;max-width:380px;margin:0 auto 28px;">
        A new signup attempt was received while waitlist mode is active. Reach out to onboard them manually.
      </p>
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:0 40px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f1;border:1px solid #e4ede0;border-radius:8px;">
        <tr>
          <td style="padding:18px 22px;">
            <p style="margin:0 0 10px;font-family:${FONT_STACK};font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8a9e90;">Lead details</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">${tableRows}</table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
${buildEmailFooter()}`;

  return buildEmailWrapper(body);
}

export function buildSignupWaitlistEmail(vars: SignupWaitlistVariables) {
  return {
    subject: signupWaitlistSubject(vars),
    text: signupWaitlistText(vars),
    html: signupWaitlistHtml(vars),
  };
}
