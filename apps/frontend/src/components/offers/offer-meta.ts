import type { PillTone } from '@/components/patterns';
import type { Formatters } from '@/lib/format';
import { personName } from '@/components/applications/application-meta';
import type { Offer, OfferApprover, OfferStatus } from '@/types/offer.type';

export const OFFER_STATUSES: OfferStatus[] = [
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'sent',
  'accepted',
  'declined',
  'withdrawn',
  'expired',
];

export const OFFER_STATUS_LABEL: Record<OfferStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending approval',
  approved: 'Approved',
  rejected: 'Rejected',
  sent: 'Sent',
  accepted: 'Accepted',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
  expired: 'Expired',
};

export const OFFER_STATUS_TONE: Record<OfferStatus, PillTone> = {
  draft: 'neutral',
  pending_approval: 'warning',
  approved: 'info',
  rejected: 'danger',
  sent: 'purple',
  accepted: 'success',
  declined: 'danger',
  withdrawn: 'neutral',
  expired: 'neutral',
};

export const EDITABLE_STATUSES: OfferStatus[] = ['draft', 'rejected'];
export const WITHDRAWABLE_STATUSES: OfferStatus[] = [
  'draft',
  'pending_approval',
  'approved',
  'sent',
  'rejected',
];
export const DELETABLE_STATUSES: OfferStatus[] = [
  'draft',
  'rejected',
  'withdrawn',
  'expired',
];
export const CLOSED_STATUSES: OfferStatus[] = [
  'accepted',
  'declined',
  'withdrawn',
  'expired',
];

export function candidateName(offer: Pick<Offer, 'candidate'>) {
  return (
    personName(offer.candidate) || offer.candidate.email || 'Unknown candidate'
  );
}

export function approverName(approver: OfferApprover) {
  return personName(approver) || approver.email;
}

export function offerSalary(offer: Offer, fmt: Formatters) {
  if (offer.salaryAmount === null || offer.salaryAmount === undefined) {
    return 'Not set';
  }
  return fmt.payRate(
    Number(offer.salaryAmount),
    offer.salaryPeriod,
    offer.currency,
  );
}

export function approvalSummary(offer: Offer) {
  const approved = offer.approvers.filter(
    (a) => a.decision === 'approved',
  ).length;
  return `${approved} / ${offer.approvers.length}`;
}

export function isPendingApprover(offer: Offer, userId: string | undefined) {
  if (!userId || offer.status !== 'pending_approval') return false;
  return offer.approvers.some((a) => a.id === userId && a.decision === null);
}
