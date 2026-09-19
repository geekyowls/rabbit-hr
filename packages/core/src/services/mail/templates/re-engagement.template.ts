import {
  BRAND_NAME,
  FONT_STACK,
  buildCTAButton,
  buildEmailFooter,
  buildEmailHeader,
  buildEmailWrapper,
  escapeHtml,
} from './utils';
import type { DailySummaryReportVariables } from './daily-summary-report.template';

export interface ReEngagementEmailContext {
  dashboardUrl: string;
  isTrial?: boolean;
  trialEndsAt?: string | null;
}

export function reEngagementSubject(): string {
  return 'Your RabbitHR dashboard is waiting';
}

export function reEngagementTextBody(
  vars: DailySummaryReportVariables,
  ctx: ReEngagementEmailContext,
): string {
  const trialLine =
    ctx.isTrial && ctx.trialEndsAt
      ? `\n\nYour trial ends on ${ctx.trialEndsAt}. Upgrade to keep going: ${ctx.dashboardUrl}`
      : '';

  return `Hi ${vars.userName},

You haven't checked in for a couple of days. Here's what's queued for you:

- ${vars.dietStatusCounts.black} clients with no diet plan for today
- ${vars.totalActiveClients} active clients
- ${vars.counsellingCount} counselling sessions scheduled today

Open dashboard: ${ctx.dashboardUrl}${trialLine}

---
${BRAND_NAME}
Org admin: turn off these reminders in Settings → Organization.
`.trim();
}

export function reEngagementHtmlBody(
  vars: DailySummaryReportVariables,
  ctx: ReEngagementEmailContext,
): string {
  const safeName = escapeHtml(vars.userName);
  const trialFooter =
    ctx.isTrial && ctx.trialEndsAt
      ? `<p style="margin:16px 0 0;font-family:${FONT_STACK};font-size:13px;color:#8a4a1d;text-align:center;">
            Your trial ends on <strong>${escapeHtml(ctx.trialEndsAt)}</strong>.
            <a href="${ctx.dashboardUrl}" style="color:#1d3d28;">Upgrade to keep going →</a>
          </p>`
      : '';

  const content = `${buildEmailHeader()}
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:32px 40px;font-family:${FONT_STACK};color:#1a2a1e;line-height:1.6;">
      <p style="margin:0 0 16px;font-size:16px;">Hi ${safeName},</p>
      <p style="margin:0 0 20px;font-size:14px;color:#3d4a3f;">
        You haven't checked in for a couple of days. Here's what's queued for you:
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background-color:#f4f6f1;border-radius:6px;">
        <tr>
          <td style="padding:14px 18px;font-family:${FONT_STACK};font-size:14px;color:#1a2a1e;">
            <strong>${vars.dietStatusCounts.black}</strong> clients with no diet plan for today
          </td>
        </tr>
        <tr>
          <td style="padding:14px 18px;border-top:1px solid #e4ede0;font-family:${FONT_STACK};font-size:14px;color:#1a2a1e;">
            <strong>${vars.totalActiveClients}</strong> active clients
          </td>
        </tr>
        <tr>
          <td style="padding:14px 18px;border-top:1px solid #e4ede0;font-family:${FONT_STACK};font-size:14px;color:#1a2a1e;">
            <strong>${vars.counsellingCount}</strong> counselling sessions scheduled today
          </td>
        </tr>
      </table>

      <div style="text-align:center;margin:24px 0;">
        ${buildCTAButton('Open dashboard', ctx.dashboardUrl)}
      </div>

      ${trialFooter}

      <p style="margin:32px 0 0;font-family:${FONT_STACK};font-size:11px;color:#8a9e90;text-align:center;line-height:1.6;">
        Org admin: turn off these reminders in Settings → Organization.
      </p>
    </td>
  </tr>
</table>
${buildEmailFooter()}`;

  return buildEmailWrapper(content);
}

export function buildReEngagementEmail(
  vars: DailySummaryReportVariables,
  ctx: ReEngagementEmailContext,
) {
  return {
    subject: reEngagementSubject(),
    text: reEngagementTextBody(vars, ctx),
    html: reEngagementHtmlBody(vars, ctx),
  };
}
