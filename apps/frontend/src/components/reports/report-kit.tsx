'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type ReportRange = '30d' | '90d' | '12m';

export interface ReportProps {
  range: ReportRange;
}

export const RANGE_FACTOR: Record<ReportRange, number> = {
  '30d': 1,
  '90d': 2.9,
  '12m': 11.4,
};

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

export interface KpiRecord {
  label: string;
  value: string;
  unit?: string;
  delta?: number;
}

export interface ReportScope {
  rangeFactor: number;
  filterFactor: number;
  rateNudge: number;
  kpis: React.MutableRefObject<KpiRecord[]>;
}

export const ReportScopeContext = React.createContext<ReportScope | null>(null);

const STOCK_WORDS = [
  'open',
  'active',
  'reqs',
  'requisition',
  'at risk',
  'pending',
  'in offer',
  'headcount',
];

const RATE_UNITS = ['%', 'days', 'day', 'hours', 'h', 'd', 'x', 'years'];
const RATE_WORDS = [
  'per',
  'avg',
  'average',
  'rate',
  'time',
  'median',
  'ratio',
  'score',
  'nps',
  'satisfaction',
  'retention',
  'acceptance',
  'coverage',
  'response',
];

function isRateMetric(label: string, unit: string | undefined, raw: string) {
  const l = label.toLowerCase();
  return (
    (unit !== undefined && RATE_UNITS.includes(unit.split(' ')[0])) ||
    RATE_WORDS.some((w) => l.includes(w)) ||
    /[%x]$/.test(raw.trim())
  );
}

function scaleValue(raw: string, factor: number): string {
  const match = raw.match(/^([^\d-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/);
  if (!match) return raw;
  const [, prefix, num, suffix] = match;
  const decimals = num.includes('.') ? num.split('.')[1].length : 0;
  const scaled = parseFloat(num.replace(/,/g, '')) * factor;
  const formatted =
    decimals > 0
      ? scaled.toFixed(decimals)
      : Math.max(Math.round(scaled), 0).toLocaleString('en-US');
  return `${prefix}${formatted}${suffix}`;
}

type KpiChildProps = {
  label?: string;
  value?: React.ReactNode;
  unit?: string;
  delta?: number;
  points?: number[];
};

export function KpiGrid({
  children,
  cols = 4,
  rangeAware,
}: {
  children: React.ReactNode;
  cols?: 3 | 4 | 5;
  rangeAware?: boolean;
}) {
  const scope = React.useContext(ReportScopeContext);
  const records: KpiRecord[] = [];
  const items = React.Children.map(children, (child) => {
    if (!React.isValidElement<KpiChildProps>(child)) return child;
    const { label = '', value, unit, delta } = child.props;
    if (typeof value !== 'string' && typeof value !== 'number') return child;
    const raw = String(value);
    if (!scope) {
      records.push({ label, value: raw, unit, delta });
      return child;
    }
    const rate = isRateMetric(label, unit, raw);
    const stock = STOCK_WORDS.some((w) => label.toLowerCase().includes(w));
    const volume =
      (rangeAware || stock ? 1 : scope.rangeFactor) * scope.filterFactor;
    const factor = rate ? scope.rateNudge : volume;
    const next = factor === 1 ? raw : scaleValue(raw, factor);
    const nextDelta =
      delta === undefined || factor === 1
        ? delta
        : Math.round((delta + (scope.rateNudge - 1) * 40) * 10) / 10;
    records.push({ label, value: next, unit, delta: nextDelta });
    return React.cloneElement(child, { value: next, delta: nextDelta });
  });

  React.useEffect(() => {
    if (scope) scope.kpis.current = records;
  });

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3',
        cols === 3 && 'lg:grid-cols-3',
        cols === 4 && 'lg:grid-cols-4',
        cols === 5 && 'lg:grid-cols-5',
      )}
    >
      {items}
    </div>
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
