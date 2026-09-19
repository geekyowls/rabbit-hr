import { buildEmailFooter, BRAND_NAME, escapeHtml } from './utils';

export type DailyDigestSlot = 'morning' | 'afternoon' | 'evening';

export interface DailySummaryReportVariables {
  userName: string;
  reportDate: string;
  counsellingCount: number;
  dietStatusCounts: {
    green: number;
    yellow: number;
    red: number;
    black: number;
  };
  totalActiveClients: number;
}

const SLOT_SUBJECTS: Record<DailyDigestSlot, string> = {
  morning: 'Morning digest — your day at a glance',
  afternoon: 'Afternoon update — pending diets for today',
  evening: 'Evening summary — wrap-up for today',
};

export function dailySummaryReportSubject(
  vars: DailySummaryReportVariables,
  slot?: DailyDigestSlot,
): string {
  if (slot) return SLOT_SUBJECTS[slot];
  return `Daily Summary - ${vars.reportDate}`;
}

export function dailySummaryReportTemplate(
  vars: DailySummaryReportVariables,
): string {
  return `
Hi ${vars.userName},

Here's your summary for today:

Counselling Sessions Today: ${vars.counsellingCount}

Diet Plan Status:
- Green (3 days ready): ${vars.dietStatusCounts.green} clients
- Yellow (2 days ready): ${vars.dietStatusCounts.yellow} clients
- Red (only today ready): ${vars.dietStatusCounts.red} clients
- Black (no plan today): ${vars.dietStatusCounts.black} clients

Total Active Clients: ${vars.totalActiveClients}

---
${BRAND_NAME}
  `.trim();
}

export function dailySummaryReportHtml(
  vars: DailySummaryReportVariables,
): string {
  const safeUserName = escapeHtml(vars.userName);

  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hi ${safeUserName},</p>

  <p>Here's your summary for today:</p>

  <table style="border-collapse: collapse; margin: 20px 0;">
    <tr>
      <td style="padding: 8px 16px 8px 0; font-weight: bold;">Counselling Sessions Today:</td>
      <td style="padding: 8px 0;">${vars.counsellingCount}</td>
    </tr>
  </table>

  <h3 style="margin: 20px 0 10px; font-size: 16px;">Diet Plan Status:</h3>
  <table style="border-collapse: collapse; width: 100%; max-width: 400px;">
    <tr>
      <td style="padding: 8px; background: #22c55e; color: white; border-radius: 4px 0 0 0;">Green (3 days ready)</td>
      <td style="padding: 8px; text-align: right; background: #f0fdf4; border-radius: 0 4px 0 0;">${vars.dietStatusCounts.green} clients</td>
    </tr>
    <tr>
      <td style="padding: 8px; background: #eab308; color: white;">Yellow (2 days ready)</td>
      <td style="padding: 8px; text-align: right; background: #fefce8;">${vars.dietStatusCounts.yellow} clients</td>
    </tr>
    <tr>
      <td style="padding: 8px; background: #ef4444; color: white;">Red (only today ready)</td>
      <td style="padding: 8px; text-align: right; background: #fef2f2;">${vars.dietStatusCounts.red} clients</td>
    </tr>
    <tr>
      <td style="padding: 8px; background: #1f2937; color: white; border-radius: 0 0 0 4px;">Black (no plan today)</td>
      <td style="padding: 8px; text-align: right; background: #f3f4f6; border-radius: 0 0 4px 0;">${vars.dietStatusCounts.black} clients</td>
    </tr>
  </table>

  <p style="margin-top: 20px; font-size: 18px;"><strong>Total Active Clients: ${vars.totalActiveClients}</strong></p>

  ${buildEmailFooter()}
</body>
</html>
  `.trim();
}

export function buildDailySummaryReportEmail(
  vars: DailySummaryReportVariables,
  slot?: DailyDigestSlot,
) {
  return {
    subject: dailySummaryReportSubject(vars, slot),
    text: dailySummaryReportTemplate(vars),
    html: dailySummaryReportHtml(vars),
  };
}
