'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Sparkline } from '../charts/charts';
import { DeltaBadge } from '../charts/delta-badge';

export function TrendStat({
  label,
  value,
  unit,
  delta,
  invertDelta,
  points,
  color = '#3F6650',
  className,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  delta?: number;
  invertDelta?: boolean;
  points?: number[];
  color?: string;
  className?: string;
}) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {delta !== undefined && (
          <DeltaBadge value={delta} invertColors={invertDelta} />
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {points && points.length > 1 && (
        <div className="mt-3">
          <Sparkline points={points} color={color} height={36} />
        </div>
      )}
    </Card>
  );
}
