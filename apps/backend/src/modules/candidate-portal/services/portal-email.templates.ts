import { escapeHtml } from '@shared/helpers/html-escape';
import type { PortalBranding } from '../usecases/portal-query';

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const DEFAULT_BRAND = '#3F6650';

export interface PortalEmail {
  subject: string;
  text: string;
  html: string;
}

function brand(branding: PortalBranding): string {
  return branding.brandColor || DEFAULT_BRAND;
}

function header(branding: PortalBranding): string {
  const name = escapeHtml(branding.name);
  const logo = branding.logo
    ? `<img src="${escapeHtml(branding.logo)}" alt="${name}" width="40" height="40" style="display:block;border-radius:8px;object-fit:contain;margin:0 auto 12px;">`
    : '';
  return `<tr><td style="padding:28px 32px 0;text-align:center;">${logo}<p style="margin:0;font-family:${FONT};font-size:15px;font-weight:600;color:#16201a;">${name}</p></td></tr>`;
}

function wrap(branding: PortalBranding, inner: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f5f3;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f5f3;padding:32px 12px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background:#ffffff;border-radius:12px;border:1px solid #e4e7e3;border-top:4px solid ${brand(branding)};">${header(branding)}${inner}<tr><td style="padding:0 32px 28px;text-align:center;font-family:${FONT};font-size:12px;color:#8a9490;">Sent by ${escapeHtml(branding.name)} via RabbitHR</td></tr></table></td></tr></table></body></html>`;
}

export function buildPortalOtpEmail(input: {
  branding: PortalBranding;
  firstName: string;
  code: string;
  expiresInMinutes: number;
}): PortalEmail {
  const { branding, code, expiresInMinutes } = input;
  const firstName = escapeHtml(input.firstName);
  const inner = `<tr><td style="padding:24px 32px 28px;text-align:center;font-family:${FONT};">
<p style="margin:0 0 6px;font-size:18px;font-weight:600;color:#16201a;">Your sign in code</p>
<p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#5b6660;">Hi ${firstName}, use this code to sign in to your candidate portal.</p>
<p style="margin:0 auto 18px;display:inline-block;padding:14px 26px;border-radius:10px;background:#f4f5f3;font-size:30px;font-weight:700;letter-spacing:8px;color:#16201a;">${escapeHtml(code)}</p>
<p style="margin:0;font-size:12px;line-height:1.6;color:#8a9490;">The code expires in ${expiresInMinutes} minutes. If you did not ask for it, you can ignore this email.</p>
</td></tr>`;
  return {
    subject: `${code} is your ${branding.name} sign in code`,
    text: `Hi ${input.firstName},\n\nYour ${branding.name} candidate portal sign in code is ${code}.\n\nThe code expires in ${expiresInMinutes} minutes. If you did not ask for it, you can ignore this email.`,
    html: wrap(branding, inner),
  };
}

export function buildPortalInviteEmail(input: {
  branding: PortalBranding;
  firstName: string;
  loginUrl: string;
  recruiterName: string | null;
}): PortalEmail {
  const { branding, loginUrl } = input;
  const firstName = escapeHtml(input.firstName);
  const from = input.recruiterName
    ? `${escapeHtml(input.recruiterName)} from ${escapeHtml(branding.name)}`
    : escapeHtml(branding.name);
  const welcome = branding.welcomeMessage
    ? `<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#5b6660;">${escapeHtml(branding.welcomeMessage)}</p>`
    : '';
  const inner = `<tr><td style="padding:24px 32px 28px;text-align:center;font-family:${FONT};">
<p style="margin:0 0 6px;font-size:18px;font-weight:600;color:#16201a;">You are invited to your candidate portal</p>
<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#5b6660;">Hi ${firstName}, ${from} has invited you to track your applications, interviews, offers and documents in one place.</p>
${welcome}
<a href="${escapeHtml(loginUrl)}" style="display:inline-block;padding:12px 22px;border-radius:8px;background:${brand(branding)};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Open my portal</a>
<p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#8a9490;">No password needed, we will email you a one time code when you sign in.</p>
</td></tr>`;
  return {
    subject: `Your ${branding.name} candidate portal`,
    text: `Hi ${input.firstName},\n\n${input.recruiterName ? `${input.recruiterName} from ${branding.name}` : branding.name} has invited you to your candidate portal to track your applications, interviews, offers and documents.\n\n${branding.welcomeMessage ? `${branding.welcomeMessage}\n\n` : ''}Open your portal: ${loginUrl}\n\nNo password needed, we will email you a one time code when you sign in.`,
    html: wrap(branding, inner),
  };
}
