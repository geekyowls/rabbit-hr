'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RatingStars({
  value,
  max = 5,
  size = 16,
  onChange,
  className,
}: {
  value: number;
  max?: number;
  size?: number;
  onChange?: (value: number) => void;
  className?: string;
}) {
  const interactive = Boolean(onChange);

  return (
    <div className={cn('inline-flex items-center gap-0.5', className)}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.round(value);
        const star = (
          <Star
            style={{ width: size, height: size }}
            className={cn(
              filled
                ? 'fill-amber-400 text-amber-400'
                : 'fill-transparent text-muted-foreground/40',
            )}
          />
        );
        if (!interactive) return <span key={i}>{star}</span>;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange?.(i + 1)}
            className="transition-transform hover:scale-110"
            aria-label={`Rate ${i + 1}`}
          >
            {star}
          </button>
        );
      })}
    </div>
  );
}
