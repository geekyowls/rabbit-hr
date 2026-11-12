'use client';

import type { PillTone } from '@/components/patterns';
import { getInitials, cn } from '@/lib/utils';
import type { ClientAddress, ClientStatus } from '@/types/client.type';

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  active: 'Active',
  retired: 'Retired',
};

export const CLIENT_STATUS_TONE: Record<ClientStatus, PillTone> = {
  active: 'success',
  retired: 'neutral',
};

export function formatAddress(address: ClientAddress | null | undefined) {
  if (!address) return '';
  return [
    address.street,
    address.city,
    address.county,
    address.postcode,
    address.country,
  ]
    .filter(Boolean)
    .join(', ');
}

export function ClientLogo({
  name,
  logoUrl,
  brandColor,
  className,
}: {
  name: string;
  logoUrl?: string | null;
  brandColor?: string | null;
  className?: string;
}) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className={cn(
          'h-7 w-7 shrink-0 rounded-md border border-border object-contain',
          className,
        )}
      />
    );
  }
  return (
    <span
      className={cn(
        'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-muted-foreground',
        brandColor && 'text-white',
        className,
      )}
      style={brandColor ? { backgroundColor: brandColor } : undefined}
    >
      {getInitials(name)}
    </span>
  );
}
