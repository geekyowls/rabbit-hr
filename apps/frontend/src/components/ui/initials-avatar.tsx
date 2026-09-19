import React from 'react';
import { generateAvatarColors, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface InitialsAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  className?: string;
}

export function InitialsAvatar({
  name,
  className,
  ...props
}: InitialsAvatarProps) {
  const { background, color } = generateAvatarColors(name);
  const initials = getInitials(name);

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-full',
        className,
      )}
      style={{ backgroundColor: background }}
      {...props}
    >
      <span className="font-medium leading-none" style={{ color }}>
        {initials}
      </span>
    </div>
  );
}
