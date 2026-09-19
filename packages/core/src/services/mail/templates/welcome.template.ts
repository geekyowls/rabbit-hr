import {
  buildCTAButton,
  buildEmailFooter,
  buildEmailWrapper,
  BRAND_NAME,
  escapeHtml,
  FONT_STACK,
  SERIF_STACK,
  SUPPORT_EMAIL,
} from './utils';

export interface WelcomeEmailVariables {
  userName: string;
  organizationName: string;
  loginUrl?: string;
}

export function welcomeEmailSubject(vars: WelcomeEmailVariables): string {
  return `Welcome to ${vars.organizationName} on ${BRAND_NAME}`;
}

export function welcomeEmailTemplate(vars: WelcomeEmailVariables): string {
  return `
Hi ${vars.userName},

Welcome to ${vars.organizationName}!

Your account has been created successfully. ${
    vars.loginUrl
      ? `You can now log in to your account at:\n${vars.loginUrl}`
      : 'You can now log in to your account.'
  }

If you have any questions, feel free to reach out to our support team.
  `.trim();
}

export function welcomeEmailHtml(vars: WelcomeEmailVariables): string {
  const safeUserName = escapeHtml(vars.userName);
  const safeOrgName = escapeHtml(vars.organizationName);
  const loginUrl = vars.loginUrl || 'https://app.rabbithr.co';

  const steps = [
    {
      title: 'Add your first lead or client',
      desc: 'Import from a spreadsheet or add manually. Their health profile, vitals, and timeline will be ready instantly.',
    },
    {
      title: 'Create a 7-day diet plan',
      desc: 'Use the interactive grid, pick from templates, and share a link with your client.',
    },
    {
      title: 'Invite your team',
      desc: 'Add dietitians and clinic staff with custom roles and permissions. Everyone stays in sync.',
    },
  ];

  const stepRows = steps
    .map(
      (step, i) => `
      <tr>
        <td style="padding:12px 0;${i < steps.length - 1 ? 'border-bottom:1px solid #e4ede0;' : ''}">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="width:24px;height:24px;background-color:#1d3d28;border-radius:50%;text-align:center;vertical-align:middle;font-family:${FONT_STACK};font-size:11px;font-weight:700;color:#ffffff;line-height:24px;" width="24" height="24">
                ${i + 1}
              </td>
              <td style="padding-left:14px;">
                <p style="margin:0 0 2px;font-family:${FONT_STACK};font-size:13px;font-weight:700;color:#1a2a1e;">${step.title}</p>
                <p style="margin:0;font-family:${FONT_STACK};font-size:12px;color:#6a8272;line-height:1.5;">${step.desc}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`,
    )
    .join('');

  const body = `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1d3d28;">
  <tr>
    <td style="padding:28px 40px 32px;text-align:center;">
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
        <tr>
          <td style="width:28px;height:28px;" width="28" height="28">
            <img src="https://rabbithr.co/images/logo-email.png" width="28" height="28" alt="RabbitHR" style="display:block;border-radius:50%;border:0;" />
          </td>
          <td style="padding-left:10px;font-family:${FONT_STACK};font-weight:700;font-size:15px;color:#ffffff;letter-spacing:0.02em;">
            ${BRAND_NAME}
          </td>
        </tr>
      </table>
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 16px;">
        <tr>
          <td style="width:56px;height:56px;background-color:#2a4f36;border-radius:50%;text-align:center;vertical-align:middle;font-size:28px;line-height:56px;" width="56" height="56">
            &#11088;
          </td>
        </tr>
      </table>
      <h1 style="font-family:${SERIF_STACK};font-size:28px;color:#ffffff;line-height:1.2;margin:0 0 8px;font-weight:normal;">Welcome to <em style="font-style:italic;color:#90c898;">${BRAND_NAME}!</em></h1>
      <p style="font-family:${FONT_STACK};font-size:13px;color:#a3b8a8;line-height:1.6;margin:0;">Your 14-day free trial is active and ready to go.</p>
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:32px 40px 0;">
      <p style="font-family:${FONT_STACK};font-size:14px;color:#3a4e3e;line-height:1.7;margin:0;">
        Hi <strong style="color:#1a2a1e;">${safeUserName}</strong>,<br><br>
        You're all set. Your RabbitHR account for <strong style="color:#1a2a1e;">${safeOrgName}</strong> is live. Here's everything you need to hit the ground running.
      </p>
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
                <td style="width:32px;height:32px;background-color:#1d3d28;border-radius:6px;text-align:center;vertical-align:middle;font-size:14px;line-height:32px;color:#90c898;" width="32" height="32">
                  &#128197;
                </td>
                <td style="padding-left:12px;">
                  <p style="margin:0 0 1px;font-family:${FONT_STACK};font-size:13px;font-weight:700;color:#1d3d28;">14-day free trial &mdash; no credit card required</p>
                  <p style="margin:0;font-family:${FONT_STACK};font-size:12px;color:#5a7060;line-height:1.5;">Upgrade anytime to keep your data and unlock all features.</p>
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
    <td style="padding:28px 40px 8px;">
      <h2 style="font-family:${SERIF_STACK};font-size:17px;color:#1a2a1e;margin:0 0 16px;font-weight:normal;">Get started in 3 steps</h2>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${stepRows}
      </table>
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:28px 40px 32px;text-align:center;">
      ${buildCTAButton('Open RabbitHR &rarr;', loginUrl)}
      <p style="font-family:${FONT_STACK};font-size:11px;color:#8a9e90;margin:10px 0 0;">
        Questions? Reply to this email or write to <a href="mailto:${SUPPORT_EMAIL}" style="color:#3a6b49;text-decoration:none;">${SUPPORT_EMAIL}</a>
      </p>
    </td>
  </tr>
</table>

${buildEmailFooter()}`;

  return buildEmailWrapper(body);
}

export function buildWelcomeEmail(vars: WelcomeEmailVariables) {
  return {
    subject: welcomeEmailSubject(vars),
    text: welcomeEmailTemplate(vars),
    html: welcomeEmailHtml(vars),
  };
}
