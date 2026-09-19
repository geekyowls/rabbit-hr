'use client';

import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/session-context';

interface BrandLockupProps {
  variant?: 'onLight' | 'onDark';
  className?: string;
}

function NutriCrmMark({ variant }: { variant: 'onLight' | 'onDark' }) {
  const innerColor = variant === 'onDark' ? '#1d3129' : 'white';
  return (
    <div className="flex items-center gap-2">
      <svg
        className={cn(
          'h-7 w-7 shrink-0',
          variant === 'onDark' ? 'text-white' : 'text-[#0e5c3e]',
        )}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="RabbitHR logo"
        role="img"
      >
        <circle cx="16" cy="16" r="14" fill="currentColor" />
        <path
          d="M10 16c0-3.314 2.686-6 6-6s6 2.686 6 6-2.686 6-6 6"
          stroke={innerColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="16" cy="16" r="2" fill={innerColor} />
      </svg>
      <span
        className={cn(
          'text-sm font-semibold',
          variant === 'onDark'
            ? 'text-white'
            : 'text-gray-900 dark:text-gray-100',
        )}
      >
        RabbitHR
      </span>
    </div>
  );
}

export function BrandLockup({
  variant = 'onLight',
  className,
}: BrandLockupProps) {
  const { organization } = useSession();

  const partnerLogo =
    organization?.coBrandingEnabled && organization.logo
      ? organization.logo
      : null;
  const order = organization?.coBrandingOrder ?? 'rabbithr-first';

  const partnerMark = partnerLogo ? (
    <img
      src={partnerLogo}
      alt={organization?.name ?? 'Partner logo'}
      className="h-7 w-auto max-w-[130px] object-contain"
    />
  ) : null;

  if (partnerMark && order === 'partner-only') {
    return (
      <div className={cn('flex items-center', className)}>{partnerMark}</div>
    );
  }

  const nutriMark = <NutriCrmMark variant={variant} />;

  if (!partnerMark) {
    return (
      <div className={cn('flex items-center', className)}>{nutriMark}</div>
    );
  }

  const divider = (
    <span
      className={cn(
        'text-base font-light',
        variant === 'onDark' ? 'text-white/50' : 'text-muted-foreground',
      )}
      aria-hidden="true"
    >
      ×
    </span>
  );

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {order === 'partner-first' ? (
        <>
          {partnerMark}
          {divider}
          {nutriMark}
        </>
      ) : (
        <>
          {nutriMark}
          {divider}
          {partnerMark}
        </>
      )}
    </div>
  );
}
