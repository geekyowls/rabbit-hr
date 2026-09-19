import {
  buildCTAButton,
  buildEmailFooter,
  buildEmailHeader,
  buildEmailWrapper,
  buildIconCircle,
  escapeHtml,
  FONT_STACK,
  SERIF_STACK,
} from './utils';

export interface FormSubmissionNotificationVariables {
  formName: string;
  submitterName?: string;
  submitterEmail?: string;
  submitterPhone?: string;
  dashboardUrl: string;
  leadId?: string;
}

export function formSubmissionNotificationSubject(
  vars: FormSubmissionNotificationVariables,
): string {
  const name = vars.submitterName || 'Someone';
  return `New lead from ${vars.formName}: ${name}`;
}

export function formSubmissionNotificationTemplate(
  vars: FormSubmissionNotificationVariables,
): string {
  const contactInfo = [];
  if (vars.submitterName) contactInfo.push(`Name: ${vars.submitterName}`);
  if (vars.submitterEmail) contactInfo.push(`Email: ${vars.submitterEmail}`);
  if (vars.submitterPhone) contactInfo.push(`Phone: ${vars.submitterPhone}`);

  const contactDetails =
    contactInfo.length > 0
      ? contactInfo.join('\n')
      : 'No contact information provided';

  const body = `
A new submission was received on your form "${vars.formName}".

${contactDetails}

View the submission in your dashboard:
${vars.dashboardUrl}
  `.trim();

  return body;
}

export function formSubmissionNotificationHtml(
  vars: FormSubmissionNotificationVariables,
): string {
  const safeFormName = escapeHtml(vars.formName);
  const safeName = vars.submitterName ? escapeHtml(vars.submitterName) : null;
  const safeEmail = vars.submitterEmail
    ? escapeHtml(vars.submitterEmail)
    : null;
  const safePhone = vars.submitterPhone
    ? escapeHtml(vars.submitterPhone)
    : null;

  const contactRows = [];
  if (safeName) {
    contactRows.push(`
              <tr>
                <td style="padding:8px 0;font-family:${FONT_STACK};font-size:13px;font-weight:700;color:#5a7060;width:70px;vertical-align:top;" width="70">Name</td>
                <td style="padding:8px 0;font-family:${FONT_STACK};font-size:13px;color:#1a2a1e;">${safeName}</td>
              </tr>`);
  }
  if (safeEmail) {
    contactRows.push(`
              <tr>
                <td style="padding:8px 0;border-top:1px solid #e4ede0;font-family:${FONT_STACK};font-size:13px;font-weight:700;color:#5a7060;width:70px;vertical-align:top;" width="70">Email</td>
                <td style="padding:8px 0;border-top:1px solid #e4ede0;font-family:${FONT_STACK};font-size:13px;color:#1a2a1e;">
                  <a href="mailto:${safeEmail}" style="color:#3a6b49;text-decoration:none;">${safeEmail}</a>
                </td>
              </tr>`);
  }
  if (safePhone) {
    contactRows.push(`
              <tr>
                <td style="padding:8px 0;border-top:1px solid #e4ede0;font-family:${FONT_STACK};font-size:13px;font-weight:700;color:#5a7060;width:70px;vertical-align:top;" width="70">Phone</td>
                <td style="padding:8px 0;border-top:1px solid #e4ede0;font-family:${FONT_STACK};font-size:13px;color:#1a2a1e;">
                  <a href="tel:${safePhone}" style="color:#3a6b49;text-decoration:none;">${safePhone}</a>
                </td>
              </tr>`);
  }

  const contactTable =
    contactRows.length > 0
      ? `<table width="100%" cellpadding="0" cellspacing="0" border="0">${contactRows.join('')}</table>`
      : `<p style="font-family:${FONT_STACK};font-size:13px;color:#8a9e90;margin:0;">No contact information provided</p>`;

  const body = `
${buildEmailHeader()}
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:44px 40px 0;text-align:center;">
      ${buildIconCircle('&#128276;', '#eef4ea', '#cddfc6', '#1d3d28')}
      <h1 style="font-family:${SERIF_STACK};font-size:24px;color:#1a2a1e;margin:20px 0 10px;line-height:1.3;font-weight:normal;">New lead received</h1>
      <p style="font-family:${FONT_STACK};font-size:14px;color:#5a7060;line-height:1.6;max-width:380px;margin:0 auto 28px;">
        A new submission was received on your form <strong style="color:#1a2a1e;">&ldquo;${safeFormName}&rdquo;</strong>.
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
            <p style="margin:0 0 10px;font-family:${FONT_STACK};font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8a9e90;">Contact details</p>
            ${contactTable}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:0 40px 32px;text-align:center;">
      ${buildCTAButton('View in Dashboard &rarr;', vars.dashboardUrl)}
    </td>
  </tr>
</table>
${buildEmailFooter()}`;

  return buildEmailWrapper(body);
}

export function buildFormSubmissionNotificationEmail(
  vars: FormSubmissionNotificationVariables,
) {
  return {
    subject: formSubmissionNotificationSubject(vars),
    text: formSubmissionNotificationTemplate(vars),
    html: formSubmissionNotificationHtml(vars),
  };
}
