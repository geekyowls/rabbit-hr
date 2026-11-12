import { createHash, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { OfferEntity } from '@db/entities';
import { OfferStatus } from '@db/enums';

const SIGN_LINK_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export type OfferSignStatus =
  | 'not_sent'
  | 'pending'
  | 'signed'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'closed';

export function generateSignToken(): string {
  return randomBytes(32).toString('hex');
}

export function signTokenExpiry(offer: OfferEntity, sentAt: Date): Date {
  const linkExpiry = new Date(sentAt.getTime() + SIGN_LINK_DAYS * DAY_MS);
  if (!offer.expiresAt) return linkExpiry;
  const offerExpiry = new Date(`${offer.expiresAt}T23:59:59.999Z`);
  return offerExpiry > sentAt && offerExpiry < linkExpiry
    ? offerExpiry
    : linkExpiry;
}

export function hashLetter(letter: string): string {
  return createHash('sha256').update(letter, 'utf8').digest('hex');
}

export function signUrl(config: ConfigService, token: string): string {
  const base = (
    config.get<string>('FRONTEND_URL') || 'http://localhost:3000'
  ).replace(/\/+$/, '');
  return `${base}/offer/sign?token=${encodeURIComponent(token)}`;
}

export function offerSignStatus(
  offer: Pick<
    OfferEntity,
    'status' | 'signedAt' | 'signTokenExpiresAt' | 'sentAt'
  >,
): OfferSignStatus {
  if (offer.signedAt) return 'signed';
  if (offer.status === OfferStatus.ACCEPTED) return 'accepted';
  if (offer.status === OfferStatus.DECLINED) return 'declined';
  if (offer.status === OfferStatus.EXPIRED) return 'expired';
  if (offer.status !== OfferStatus.SENT) {
    return offer.sentAt ? 'closed' : 'not_sent';
  }
  if (!offer.signTokenExpiresAt) return 'not_sent';
  if (offer.signTokenExpiresAt < new Date()) {
    return 'expired';
  }
  return 'pending';
}

export function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .replace(/[\s'-]+/g, ' ')
    .trim();
}

export function nameMatches(
  typed: string,
  firstName: string,
  lastName: string,
): boolean {
  const name = normalizeName(typed);
  const first = normalizeName(firstName);
  const last = normalizeName(lastName);
  if (!name || !first || !last) return false;
  if (name === `${first} ${last}`) return true;
  const words = new Set(name.split(' '));
  const hasAll = (part: string) => part.split(' ').every((w) => words.has(w));
  return hasAll(first) && hasAll(last);
}
