import {
  BillingAccess,
  OrgSubscriptionStatus,
  PAST_DUE_GRACE_DAYS,
  daysUntil,
} from '@boilerplate/shared';
import type { PillTone } from '@/components/patterns/data-table/status-pill';
import { formatDate } from '@/lib/utils';
import type { BillingSummary } from '@/types/billing.type';

export const SUBSCRIPTION_STATUS_LABELS: Record<OrgSubscriptionStatus, string> =
  {
    [OrgSubscriptionStatus.TRIAL]: 'Trial',
    [OrgSubscriptionStatus.ACTIVE]: 'Active',
    [OrgSubscriptionStatus.PAST_DUE]: 'Past due',
    [OrgSubscriptionStatus.GRACE]: 'Grace period',
    [OrgSubscriptionStatus.CANCELLED]: 'Canceled',
    [OrgSubscriptionStatus.EXPIRED]: 'Expired',
  };

export const SUBSCRIPTION_STATUS_TONES: Record<
  OrgSubscriptionStatus,
  PillTone
> = {
  [OrgSubscriptionStatus.TRIAL]: 'info',
  [OrgSubscriptionStatus.ACTIVE]: 'success',
  [OrgSubscriptionStatus.PAST_DUE]: 'warning',
  [OrgSubscriptionStatus.GRACE]: 'warning',
  [OrgSubscriptionStatus.CANCELLED]: 'neutral',
  [OrgSubscriptionStatus.EXPIRED]: 'danger',
};

const DAY_MS = 24 * 60 * 60 * 1000;

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

export function describeBillingPeriod(summary: BillingSummary): string | null {
  if (summary.access === BillingAccess.READ_ONLY) {
    return 'Read only until you renew';
  }
  switch (summary.status) {
    case OrgSubscriptionStatus.TRIAL: {
      const days = daysUntil(summary.trialEndsAt);
      return days === null
        ? null
        : `Trial ends in ${plural(days, 'day')} on ${formatDate(summary.trialEndsAt)}`;
    }
    case OrgSubscriptionStatus.PAST_DUE: {
      const graceEnd = summary.pastDueSince
        ? new Date(
            new Date(summary.pastDueSince).getTime() +
              PAST_DUE_GRACE_DAYS * DAY_MS,
          )
        : null;
      return graceEnd
        ? `Payment failed, update your card by ${formatDate(graceEnd)}`
        : 'Payment failed, update your card';
    }
    case OrgSubscriptionStatus.CANCELLED:
      return summary.currentPeriodEnd
        ? `Access ends on ${formatDate(summary.currentPeriodEnd)}`
        : null;
    default:
      if (!summary.currentPeriodEnd) return null;
      return summary.cancelAtPeriodEnd
        ? `Cancels on ${formatDate(summary.currentPeriodEnd)}`
        : `Renews on ${formatDate(summary.currentPeriodEnd)}`;
  }
}
