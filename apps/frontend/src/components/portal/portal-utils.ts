import type { PillTone } from '@/components/patterns';
import {
  PAY_UNIT_LABEL,
  browserLocale,
  formatDateLong,
  formatMoney,
} from '@/lib/format';
import type {
  PortalOffer,
  PortalOfferSignStatus,
  PortalStatus,
} from '@/types/portal.type';
import type { DocumentVerificationStatus } from '@/types/document.type';

export const DEFAULT_PORTAL_BRAND = '#3F6650';

export const PORTAL_STATUS_TONE: Record<PortalStatus, PillTone> = {
  applied: 'neutral',
  screening: 'info',
  interview: 'purple',
  offer: 'warning',
  hired: 'success',
  rejected: 'neutral',
  withdrawn: 'neutral',
};

export const OFFER_STATUS_META: Record<
  PortalOfferSignStatus,
  { label: string; tone: PillTone }
> = {
  not_sent: { label: 'Not sent', tone: 'neutral' },
  pending: { label: 'Waiting for you', tone: 'warning' },
  signed: { label: 'Signed', tone: 'success' },
  accepted: { label: 'Accepted', tone: 'success' },
  declined: { label: 'Declined', tone: 'neutral' },
  expired: { label: 'Expired', tone: 'neutral' },
  closed: { label: 'Closed', tone: 'neutral' },
};

export const DOCUMENT_STATUS_META: Record<
  DocumentVerificationStatus,
  { label: string; tone: PillTone }
> = {
  pending: { label: 'Under review', tone: 'info' },
  verified: { label: 'Verified', tone: 'success' },
  rejected: { label: 'Not accepted', tone: 'danger' },
};

const locale = () => browserLocale();

export function portalDate(value: string | null | undefined) {
  if (!value) return '';
  return formatDateLong(value, { locale: locale() });
}

export function portalDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat(locale(), {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(new Date(value));
  } catch {
    return portalDate(value);
  }
}

export function portalDay(value: string) {
  const date = new Date(value);
  return {
    day: new Intl.DateTimeFormat(locale(), { day: 'numeric' }).format(date),
    month: new Intl.DateTimeFormat(locale(), { month: 'short' }).format(date),
  };
}

export function offerPay(offer: PortalOffer) {
  if (offer.salaryAmount === null) return null;
  return `${formatMoney(offer.salaryAmount, offer.currency, locale())} ${PAY_UNIT_LABEL[offer.salaryPeriod]}`;
}

export function applicationHref(id: string) {
  return `/portal/applications?id=${encodeURIComponent(id)}`;
}

export function offerHref(id: string) {
  return `/portal/offers?id=${encodeURIComponent(id)}`;
}

export function bookingHref(token: string) {
  return `/book?token=${encodeURIComponent(token)}`;
}

export function portalLoginHref(orgSlug: string | null) {
  return orgSlug
    ? `/portal/login?org=${encodeURIComponent(orgSlug)}`
    : '/portal/login';
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
