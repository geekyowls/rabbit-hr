import {
  buildDivider,
  buildEmailFooter,
  buildEmailHeader,
  buildEmailWrapper,
  buildIconCircle,
  BRAND_NAME,
  FONT_STACK,
  SERIF_STACK,
  SUPPORT_EMAIL,
} from './utils';

export interface SignupOtpEmailVariables {
  otp: string;
  expiresInMinutes: number;
}

export function signupOtpEmailSubject(): string {
  return `Your ${BRAND_NAME} Verification Code`;
}

export function signupOtpEmailTemplate(vars: SignupOtpEmailVariables): string {
  return `
Your verification code is: ${vars.otp}

This code expires in ${vars.expiresInMinutes} minutes.

If you did not request this code, you can safely ignore this email.

Do not share this code with anyone.
  `.trim();
}

export function signupOtpEmailHtml(vars: SignupOtpEmailVariables): string {
  const body = `
${buildEmailHeader()}
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:44px 40px 36px;text-align:center;">
      ${buildIconCircle('&#9993;', '#eef4ea', '#cddfc6', '#1d3d28')}
      <h1 style="font-family:${SERIF_STACK};font-size:24px;color:#1a2a1e;margin:20px 0 10px;line-height:1.3;font-weight:normal;">Verify your email address</h1>
      <p style="font-family:${FONT_STACK};font-size:14px;color:#5a7060;line-height:1.6;max-width:360px;margin:0 auto 28px;">Use the code below to complete your sign-in. Don't share this with anyone.</p>

      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 24px;">
        <tr>
          <td style="background-color:#f4f6f1;border:1.5px dashed #90c898;border-radius:10px;padding:20px 32px;text-align:center;">
            <p style="margin:0 0 6px;font-family:${FONT_STACK};font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8a9e90;">Your verification code</p>
            <p style="margin:0;font-family:${FONT_STACK};font-size:36px;font-weight:700;letter-spacing:0.22em;color:#1d3d28;line-height:1;">${vars.otp}</p>
          </td>
        </tr>
      </table>

      <p style="font-family:${FONT_STACK};font-size:12px;color:#8a9e90;margin:0 0 28px;">This code expires in <strong style="color:#c0533a;">${vars.expiresInMinutes} minutes</strong></p>

      ${buildDivider()}

      <p style="font-family:${FONT_STACK};font-size:13px;color:#8a9e90;line-height:1.6;margin:24px 0 0;">
        Didn't request this? You can safely ignore this email.<br>
        Need help? <a href="mailto:${SUPPORT_EMAIL}" style="color:#3a6b49;text-decoration:none;">${SUPPORT_EMAIL}</a>
      </p>
    </td>
  </tr>
</table>
${buildEmailFooter()}`;

  return buildEmailWrapper(body);
}

export function buildSignupOtpEmail(vars: SignupOtpEmailVariables) {
  return {
    subject: signupOtpEmailSubject(),
    text: signupOtpEmailTemplate(vars),
    html: signupOtpEmailHtml(vars),
  };
}
