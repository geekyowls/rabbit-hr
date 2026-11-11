'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { NotIntegratedBadge, SectionCard } from '@/components/patterns';
import type { ReportSummary, ReportSummaryRequest } from '@/types/report.type';

export interface LiveReportProps {
  data: ReportSummary;
  previous?: ReportSummary;
  filters: ReportSummaryRequest;
}

export const BRAND = '#3F6650';
export const BRAND_LIGHT = '#8FBFA1';
export const BLUE = '#4C6EF5';
export const AMBER = '#E0A458';
export const RED = '#E06B6B';
export const VIOLET = '#8B7DD8';
export const TEAL = '#3FB6A8';
export const GRAY = '#a1a1aa';

export const MONTHS = [
  'Nov',
  'Dec',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
];

export function KpiGrid({
  children,
  cols = 4,
}: {
  children: React.ReactNode;
  cols?: 3 | 4 | 5;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3',
        cols === 3 && 'lg:grid-cols-3',
        cols === 4 && 'lg:grid-cols-4',
        cols === 5 && 'lg:grid-cols-5',
      )}
    >
      {children}
    </div>
  );
}

export function changePct(
  current: number | null | undefined,
  previous: number | null | undefined,
): number | undefined {
  if (current == null || previous == null || previous === 0) return undefined;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function pointsChange(
  current: number | null | undefined,
  previous: number | null | undefined,
): number | undefined {
  if (current == null || previous == null) return undefined;
  return Math.round((current - previous) * 10) / 10;
}

export function rateLabel(value: number | null | undefined) {
  return value == null ? '-' : `${value}%`;
}

export function daysLabel(value: number | null | undefined) {
  return value == null ? '-' : `${value} d`;
}

export function ratio(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : null;
}

export function PreviewCard({
  title,
  subtitle,
  className,
  bodyClassName,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <SectionCard
      title={title}
      subtitle={subtitle}
      className={className}
      bodyClassName={bodyClassName}
      actions={<NotIntegratedBadge />}
    >
      {children}
    </SectionCard>
  );
}

export function EmptyReport({ text }: { text: string }) {
  return (
    <p className="px-4 py-8 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}

export function Grid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid gap-4 xl:grid-cols-3', className)}>{children}</div>
  );
}

export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'right';
  render: (row: T) => React.ReactNode;
  className?: string;
}

export function ReportTable<T>({
  columns,
  rows,
  getKey,
  footer,
}: {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  'whitespace-nowrap px-4 py-2 font-medium',
                  c.align === 'right' && 'text-right',
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={getKey(r)} className="hover:bg-muted/40">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    'whitespace-nowrap px-4 py-2.5',
                    c.align === 'right' && 'text-right tabular-nums',
                    c.className,
                  )}
                >
                  {c.render(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot>
            <tr className="border-t border-border bg-muted/40 text-xs font-medium">
              {footer}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export function MiniBar({
  value,
  max = 100,
  color = BRAND,
  width = 'w-20',
}: {
  value: number;
  max?: number;
  color?: string;
  width?: string;
}) {
  return (
    <span
      className={cn(
        'inline-block h-1.5 overflow-hidden rounded-sm bg-muted align-middle',
        width,
      )}
    >
      <span
        className="block h-full rounded-sm"
        style={{
          width: `${Math.min((value / max) * 100, 100)}%`,
          backgroundColor: color,
        }}
      />
    </span>
  );
}

export function BarWithValue({
  value,
  max = 100,
  suffix = '%',
  color,
}: {
  value: number;
  max?: number;
  suffix?: string;
  color?: string;
}) {
  return (
    <span className="inline-flex items-center justify-end gap-2">
      <MiniBar value={value} max={max} color={color} />
      <span className="w-12 text-right tabular-nums">
        {value}
        {suffix}
      </span>
    </span>
  );
}

export function thresholdColor(
  value: number,
  good: number,
  warn: number,
  higherIsBetter = true,
) {
  const ok = higherIsBetter ? value >= good : value <= good;
  const mid = higherIsBetter ? value >= warn : value <= warn;
  return ok ? BRAND : mid ? AMBER : RED;
}

export function toneText(
  value: number,
  good: number,
  warn: number,
  higherIsBetter = true,
) {
  const ok = higherIsBetter ? value >= good : value <= good;
  const mid = higherIsBetter ? value >= warn : value <= warn;
  return ok
    ? 'text-foreground'
    : mid
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-600 dark:text-red-400';
}

export function SplitBar({
  parts,
}: {
  parts: { value: number; color: string; label: string }[];
}) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-sm bg-muted">
      {parts.map((p) => (
        <div
          key={p.label}
          className="h-full"
          title={`${p.label}: ${p.value}`}
          style={{
            width: `${(p.value / total) * 100}%`,
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

export function fmt(n: number) {
  return Math.round(n).toLocaleString('en-US');
}

export function money(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k`;
  return `$${Math.round(n)}`;
}

export function flowFunnel(data: ReportSummary) {
  return data.funnel
    .filter((s) => s.category !== 'rejected' && s.category !== 'withdrawn')
    .map((s) => ({ label: s.name, value: s.reached }));
}
