'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export const CHART_COLORS = [
  '#3F6650',
  '#8FBFA1',
  '#4C6EF5',
  '#E0A458',
  '#E06B6B',
  '#8B7DD8',
  '#3FB6A8',
  '#C2410C',
] as const;

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--background)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontSize: '12px',
  padding: '6px 10px',
} as const;

const AXIS_TICK = { fontSize: 11, fill: 'currentColor' } as const;

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
}

interface AreaLineChartProps<T> {
  data: T[];
  xKey: keyof T & string;
  series: ChartSeries[];
  height?: number;
  yFormatter?: (v: number) => string;
  xFormatter?: (v: unknown) => string;
}

export function AreaSeriesChart<T extends object>({
  data,
  xKey,
  series,
  height = 260,
  yFormatter,
  xFormatter,
}: AreaLineChartProps<T>) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
        >
          <defs>
            {series.map((s) => (
              <linearGradient
                key={s.key}
                id={`grad-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            vertical={false}
            className="stroke-zinc-100 dark:stroke-zinc-800"
          />
          <XAxis
            dataKey={xKey as string}
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            className="text-zinc-500 dark:text-zinc-400"
            minTickGap={24}
            tickFormatter={xFormatter}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tick={AXIS_TICK}
            className="text-zinc-500 dark:text-zinc-400"
            tickFormatter={yFormatter}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ stroke: '#a1a1aa', strokeDasharray: '3 3' }}
            formatter={(value: unknown) =>
              yFormatter ? yFormatter(Number(value)) : String(value)
            }
          />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
              dot={false}
              isAnimationActive={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--background)' }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface BarChartProps<T> {
  data: T[];
  xKey: keyof T & string;
  series: ChartSeries[];
  height?: number;
  yFormatter?: (v: number) => string;
  stacked?: boolean;
  showLegend?: boolean;
  horizontal?: boolean;
}

export function BarSeriesChart<T extends object>({
  data,
  xKey,
  series,
  height = 260,
  yFormatter,
  stacked,
  showLegend,
  horizontal,
}: BarChartProps<T>) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            vertical={horizontal}
            horizontal={!horizontal}
            className="stroke-zinc-100 dark:stroke-zinc-800"
          />
          {horizontal ? (
            <>
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={AXIS_TICK}
                className="text-zinc-500 dark:text-zinc-400"
                tickFormatter={yFormatter}
              />
              <YAxis
                dataKey={xKey as string}
                type="category"
                tickLine={false}
                axisLine={false}
                width={110}
                tick={AXIS_TICK}
                className="text-zinc-500 dark:text-zinc-400"
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xKey as string}
                tickLine={false}
                axisLine={false}
                tick={AXIS_TICK}
                className="text-zinc-500 dark:text-zinc-400"
                minTickGap={16}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={48}
                tick={AXIS_TICK}
                className="text-zinc-500 dark:text-zinc-400"
                tickFormatter={yFormatter}
              />
            </>
          )}
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: 'rgba(161,161,170,0.08)' }}
            formatter={(value: unknown) =>
              yFormatter ? yFormatter(Number(value)) : String(value)
            }
          />
          {showLegend && (
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
          )}
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color}
              radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              stackId={stacked ? 'stack' : undefined}
              maxBarSize={horizontal ? 18 : 32}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface LineChartProps<T> {
  data: T[];
  xKey: keyof T & string;
  series: ChartSeries[];
  height?: number;
  yFormatter?: (v: number) => string;
  xFormatter?: (v: unknown) => string;
  showLegend?: boolean;
}

export function LineSeriesChart<T extends object>({
  data,
  xKey,
  series,
  height = 260,
  yFormatter,
  xFormatter,
  showLegend,
}: LineChartProps<T>) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            className="stroke-zinc-100 dark:stroke-zinc-800"
          />
          <XAxis
            dataKey={xKey as string}
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            className="text-zinc-500 dark:text-zinc-400"
            minTickGap={24}
            tickFormatter={xFormatter}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tick={AXIS_TICK}
            className="text-zinc-500 dark:text-zinc-400"
            tickFormatter={yFormatter}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ stroke: '#a1a1aa', strokeDasharray: '3 3' }}
            formatter={(value: unknown) =>
              yFormatter ? yFormatter(Number(value)) : String(value)
            }
          />
          {showLegend && (
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
          )}
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  data,
  size = 180,
  centerLabel,
  centerValue,
}: {
  data: DonutSlice[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={size * 0.32}
            outerRadius={size * 0.48}
            paddingAngle={2}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((s) => (
              <Cell key={s.key} fill={s.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
        </PieChart>
      </ResponsiveContainer>
      {(centerValue || centerLabel) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && (
            <div className="text-xl font-semibold tabular-nums">
              {centerValue}
            </div>
          )}
          {centerLabel && (
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {centerLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function LegendDots({
  items,
}: {
  items: { color: string; label: string; value?: string }[];
}) {
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li
          key={it.label}
          className="flex items-center justify-between gap-3 text-xs"
        >
          <span className="flex items-center gap-2 text-muted-foreground">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: it.color }}
            />
            {it.label}
          </span>
          {it.value && (
            <span className="font-medium tabular-nums">{it.value}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function Sparkline({
  points,
  color = '#3F6650',
  height = 40,
  fillOpacity = 0.35,
}: {
  points: number[];
  color?: string;
  height?: number;
  fillOpacity?: number;
}) {
  const data = points.map((v, i) => ({ i, v }));
  const gradientId = `spark-${color.replace('#', '')}-${points.length}`;
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
