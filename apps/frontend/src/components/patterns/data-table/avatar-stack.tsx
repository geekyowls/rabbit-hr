'use client';

import { cn, generateAvatarColors } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface StackedAvatar {
  name: string;
  src?: string;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function AvatarStack({
  items,
  max = 4,
  size = 28,
  className,
}: {
  items: StackedAvatar[];
  max?: number;
  size?: number;
  className?: string;
}) {
  const visible = items.slice(0, max);
  const overflow = items.length - visible.length;
  const dimension = { width: size, height: size };

  return (
    <div className={cn('flex items-center', className)}>
      {visible.map((item, i) => (
        <Avatar
          key={`${item.name}-${i}`}
          style={dimension}
          className="border-2 border-background -ml-2 first:ml-0"
        >
          {item.src && <AvatarImage src={item.src} alt={item.name} />}
          <AvatarFallback
            className="text-[10px] font-medium"
            style={{
              backgroundColor: generateAvatarColors(item.name).background,
              color: generateAvatarColors(item.name).color,
            }}
          >
            {initials(item.name)}
          </AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 && (
        <div
          style={dimension}
          className="-ml-2 flex items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground"
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
