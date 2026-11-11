'use client';

import { cn } from '@/lib/utils';

export interface FunnelStage {
  label: string;
  value: number;
  color?: string;
}

export function FunnelChart({
  stages,
  className,
}: {
  stages: FunnelStage[];
  className?: string;
}) {
  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className={cn('space-y-2', className)}>
      {stages.map((stage, i) => {
        const widthPct = Math.max((stage.value / max) * 100, 7);
        const prev = i > 0 ? stages[i - 1].value : null;
        const conversion =
          prev && prev > 0 ? Math.round((stage.value / prev) * 100) : null;
        const color = stage.color ?? '#3F6650';

        return (
          <div key={stage.label} className="flex items-center gap-3">
            <div className="w-28 shrink-0 text-sm text-muted-foreground">
              {stage.label}
            </div>
            <div className="relative h-9 flex-1 overflow-hidden rounded-md bg-muted">
              <div
                className="flex h-full items-center rounded-md px-3 text-sm font-medium text-white transition-all"
                style={{ width: `${widthPct}%`, backgroundColor: color }}
              >
                {stage.value.toLocaleString()}
              </div>
            </div>
            <div className="w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {conversion !== null ? `${conversion}%` : ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}
