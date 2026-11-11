'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RatingStars } from '../rating/rating-stars';

export function StageProgress({
  stages,
  currentIndex,
  className,
}: {
  stages: { label: string; count?: number }[];
  currentIndex: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-stretch overflow-hidden rounded-md border border-border',
        className,
      )}
    >
      {stages.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div
            key={s.label}
            className={cn(
              'flex flex-1 items-center gap-2 border-r border-border px-3 py-2 last:border-r-0',
              done && 'bg-[#EDF1EE] dark:bg-[#3F6650]/20',
              active && 'bg-[#3F6650] text-white',
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                active
                  ? 'bg-white text-[#3F6650]'
                  : done
                    ? 'bg-[#3F6650] text-white'
                    : 'border border-border text-muted-foreground',
              )}
            >
              {done ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <div className="min-w-0">
              <div
                className={cn(
                  'truncate text-[13px] font-medium',
                  !active && !done && 'text-muted-foreground',
                )}
              >
                {s.label}
              </div>
              {s.count !== undefined && (
                <div
                  className={cn(
                    'text-xs',
                    active ? 'text-white/80' : 'text-muted-foreground',
                  )}
                >
                  {s.count}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MetricRing({
  value,
  max = 100,
  size = 120,
  thickness = 10,
  label,
  valueLabel,
  color = '#3F6650',
  trackColor,
}: {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  label?: string;
  valueLabel?: string;
  color?: string;
  trackColor?: string;
}) {
  const pct = Math.max(0, Math.min(value / max, 1));
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * pct;

  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={thickness}
          className={cn(!trackColor && 'stroke-muted')}
          stroke={trackColor}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tabular-nums">
          {valueLabel ?? `${Math.round(pct * 100)}%`}
        </span>
        {label && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

export function HeatmapGrid({
  columns,
  rows,
  color = '#3F6650',
  max,
  className,
}: {
  columns: string[];
  rows: { label: string; values: number[] }[];
  color?: string;
  max?: number;
  className?: string;
}) {
  const peak = max ?? Math.max(...rows.flatMap((r) => r.values), 1);

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="p-1" />
            {columns.map((c) => (
              <th
                key={c}
                className="px-1.5 pb-1 text-[11px] font-medium text-muted-foreground"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="pr-2 text-right text-[11px] font-medium text-muted-foreground">
                {row.label}
              </td>
              {row.values.map((v, i) => {
                const intensity = v / peak;
                return (
                  <td key={i} className="p-0.5">
                    <div
                      className="flex h-7 w-9 items-center justify-center rounded-sm text-[11px] font-medium"
                      style={{
                        backgroundColor: color,
                        opacity: 0.12 + intensity * 0.88,
                        color: intensity > 0.5 ? 'white' : 'var(--foreground)',
                      }}
                      title={`${row.label} · ${columns[i]}: ${v}`}
                    >
                      {v}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RankedBarList({
  items,
  formatValue,
  className,
}: {
  items: { label: string; value: number; color?: string }[];
  formatValue?: (v: number) => string;
  className?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className={cn('space-y-2.5', className)}>
      {items.map((item, i) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {i + 1}
              </span>
              <span className="font-medium">{item.label}</span>
            </span>
            <span className="tabular-nums text-muted-foreground">
              {formatValue ? formatValue(item.value) : item.value}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-sm bg-muted">
            <div
              className="h-full rounded-sm"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color ?? '#3F6650',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Scorecard({
  criteria,
  max = 5,
  className,
}: {
  criteria: { label: string; rating: number }[];
  max?: number;
  className?: string;
}) {
  const avg =
    criteria.reduce((sum, c) => sum + c.rating, 0) / (criteria.length || 1);
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
        <span className="text-sm font-medium">Overall</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tabular-nums">
            {avg.toFixed(1)}
          </span>
          <RatingStars value={avg} max={max} size={14} />
        </div>
      </div>
      <div className="space-y-2">
        {criteria.map((c) => (
          <div
            key={c.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">{c.label}</span>
            <RatingStars value={c.rating} max={max} size={13} />
          </div>
        ))}
      </div>
    </div>
  );
}
