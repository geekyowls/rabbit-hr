import {
  buildEmailFooter,
  buildEmailHeader,
  buildEmailWrapper,
  buildIconCircle,
  escapeHtml,
  FONT_STACK,
  SERIF_STACK,
  SUPPORT_EMAIL,
} from './utils';

export interface InvoiceEmailVariables {
  invoiceNumber: string;
  organizationName: string;
  totalAmount: number;
  currency: string;
  dueDate?: string;
}

export function invoiceEmailSubject(vars: InvoiceEmailVariables): string {
  return `Invoice ${vars.invoiceNumber} from ${vars.organizationName}`;
}

export function invoiceEmailTemplate(vars: InvoiceEmailVariables): string {
  const dueLine = vars.dueDate ? `\nDue Date: ${vars.dueDate}` : '';

  return `
Please find attached invoice ${vars.invoiceNumber} from ${vars.organizationName}.

Amount: ${vars.currency} ${vars.totalAmount.toFixed(2)}${dueLine}

If you have any questions about this invoice, please contact us.
  `.trim();
}

export function invoiceEmailHtml(vars: InvoiceEmailVariables): string {
  const safeOrgName = escapeHtml(vars.organizationName);
  const safeInvoiceNumber = escapeHtml(vars.invoiceNumber);

  const body = `
${buildEmailHeader()}
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:44px 40px 0;text-align:center;">
      ${buildIconCircle('&#128196;', '#eef4ea', '#cddfc6', '#1d3d28')}
      <h1 style="font-family:${SERIF_STACK};font-size:24px;color:#1a2a1e;margin:20px 0 10px;line-height:1.3;font-weight:normal;">Invoice ${safeInvoiceNumber}</h1>
      <p style="font-family:${FONT_STACK};font-size:14px;color:#5a7060;line-height:1.6;max-width:380px;margin:0 auto 28px;">
        Please find your invoice from <strong style="color:#1a2a1e;">${safeOrgName}</strong>.
      </p>
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:0 40px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f1;border-left:4px solid #1d3d28;border-radius:0 8px 8px 0;">
        <tr>
          <td style="padding:18px 22px;">
            <p style="margin:0 0 4px;font-family:${FONT_STACK};font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8a9e90;">Amount Due</p>
            <p style="margin:0;font-family:${SERIF_STACK};font-size:26px;color:#1d3d28;line-height:1.2;">
              ${escapeHtml(vars.currency)} ${vars.totalAmount.toFixed(2)}
            </p>
            ${vars.dueDate ? `<p style="margin:6px 0 0;font-family:${FONT_STACK};font-size:13px;color:#5a7060;">Due Date: <strong style="color:#1a2a1e;">${escapeHtml(vars.dueDate)}</strong></p>` : ''}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:0 40px 32px;">
      <p style="font-family:${FONT_STACK};font-size:13px;color:#8a9e90;line-height:1.6;margin:0;">
        If you have any questions about this invoice, please contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color:#3a6b49;text-decoration:none;">${SUPPORT_EMAIL}</a>
      </p>
    </td>
  </tr>
</table>
${buildEmailFooter()}`;

  return buildEmailWrapper(body);
}

export function buildInvoiceEmailTemplate(vars: InvoiceEmailVariables) {
  return {
    subject: invoiceEmailSubject(vars),
    text: invoiceEmailTemplate(vars),
    html: invoiceEmailHtml(vars),
  };
}
