'use client';

import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/session-context';

interface BrandLockupProps {
  variant?: 'onLight' | 'onDark';
  className?: string;
}

function RabbitHrMark({ variant }: { variant: 'onLight' | 'onDark' }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
          variant === 'onDark' ? 'bg-white/15' : 'bg-[#EDF1EE]',
        )}
      >
        <img
          src="/logo-r-64.png"
          alt="RabbitHR logo"
          className={cn(
            'h-5 w-5 object-contain',
            variant === 'onDark' && 'brightness-0 invert',
          )}
        />
      </span>
      <span
        className={cn(
          'text-sm font-semibold tracking-tight',
          variant === 'onDark'
            ? 'text-white'
            : 'text-[#16201A] dark:text-white',
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

  const nutriMark = <RabbitHrMark variant={variant} />;

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
