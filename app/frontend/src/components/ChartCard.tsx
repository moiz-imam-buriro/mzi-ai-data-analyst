import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, LineChart as LineIcon } from 'lucide-react';
import type { AskResponse } from '@/types';
import {
  formatAxisNumber,
  formatTooltip,
  truncate,
} from '@/lib/format';

interface Props {
  answer: AskResponse;
}

export function ChartCard({ answer }: Props) {
  const chart = answer.chart;
  const [kind, setKind] = useState<'bar' | 'line'>(
    chart?.type === 'line' ? 'line' : 'bar'
  );

  const data = useMemo(() => {
    if (!answer.columns || !answer.rows || !chart) return [];
    const xi = answer.columns.indexOf(chart.x);
    const yi = answer.columns.indexOf(chart.y);
    if (xi < 0 || yi < 0) return [];
    return answer.rows.map((row) => ({
      name: String(row[xi] ?? ''),
      value: Number(row[yi]) || 0,
    }));
  }, [answer, chart]);

  if (!chart || (chart.type !== 'bar' && chart.type !== 'line')) return null;
  if (!data.length) return null;

  const longLabels = data.length > 8 || data.some((d) => d.name.length > 14);
  const horizontal = kind === 'bar' && longLabels;
  const lineType = kind === 'line' ? 'line' : 'bar';

  const tooltipCard = (props: {
    active?: boolean;
    payload?: { value?: number; payload?: { name?: string } }[];
  }) => {
    if (!props.active || !props.payload?.length) return null;
    const p = props.payload[0];
    return (
      <div className="rounded-lg border border-border-strong bg-card px-3 py-2 text-[13px] shadow-none">
        <p className="text-muted mb-0.5 break-words max-w-[280px]">
          {p.payload?.name}
        </p>
        <p className="text-text tnum font-medium">
          {formatTooltip(Number(p.value ?? 0))}
        </p>
      </div>
    );
  };

  const axisStyle = {
    fontSize: 12,
    fill: 'var(--c-muted)',
  } as const;

  const gridProps = {
    stroke: 'var(--c-border)',
    strokeDasharray: '2 4',
    vertical: false as const,
  };

  const isLine = lineType === 'line';
  const tickLimit = isLine ? Math.min(6, data.length) : 0;

  return (
    <section
      className="fade-up rounded-[14px] border border-border bg-card p-6 hover:border-border-strong transition-colors"
      aria-label="Chart"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-text">
          {chart.y} by {chart.x}
        </h3>
        <div
          className="inline-flex items-center rounded-md border border-border overflow-hidden"
          role="group"
          aria-label="Chart type"
        >
          <button
            type="button"
            onClick={() => setKind('bar')}
            aria-pressed={kind === 'bar'}
            className={`h-8 px-2.5 inline-flex items-center gap-1.5 text-[12px] transition-colors ${
              kind === 'bar'
                ? 'bg-accent-wash text-text'
                : 'text-muted hover:text-text hover:bg-raised'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" aria-hidden />
            Bar
          </button>
          <button
            type="button"
            onClick={() => setKind('line')}
            aria-pressed={kind === 'line'}
            className={`h-8 px-2.5 inline-flex items-center gap-1.5 text-[12px] transition-colors ${
              kind === 'line'
                ? 'bg-accent-wash text-text'
                : 'text-muted hover:text-text hover:bg-raised'
            }`}
          >
            <LineIcon className="w-3.5 h-3.5" aria-hidden />
            Line
          </button>
        </div>
      </div>
      <div style={{ width: '100%', height: horizontal ? 360 : 320 }}>
        <ResponsiveContainer>
          {isLine ? (
            <LineChart
              data={data}
              margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
            >
              <CartesianGrid {...gridProps} />
              <XAxis
                dataKey="name"
                tick={axisStyle}
                tickLine={false}
                axisLine={{ stroke: 'var(--c-border)' }}
                interval={Math.max(0, Math.ceil(data.length / tickLimit) - 1)}
                height={40}
              />
              <YAxis
                tick={axisStyle}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatAxisNumber}
                width={56}
              />
              <Tooltip
                content={tooltipCard}
                cursor={{ stroke: 'var(--c-border-strong)' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--c-chart)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'var(--c-chart)' }}
                isAnimationActive
                animationDuration={500}
              />
            </LineChart>
          ) : horizontal ? (
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
            >
              <CartesianGrid {...gridProps} horizontal={false} vertical={true} />
              <XAxis
                type="number"
                tick={axisStyle}
                tickLine={false}
                axisLine={{ stroke: 'var(--c-border)' }}
                tickFormatter={formatAxisNumber}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={axisStyle}
                tickLine={false}
                axisLine={false}
                width={120}
                tickFormatter={(v: string) => truncate(String(v), 16)}
              />
              <Tooltip
                content={tooltipCard}
                cursor={{ fill: 'var(--c-accent-wash)' }}
              />
              <Bar
                dataKey="value"
                fill="var(--c-chart)"
                radius={[0, 4, 4, 0]}
                isAnimationActive
                animationDuration={500}
              />
            </BarChart>
          ) : (
            <BarChart
              data={data}
              margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
            >
              <CartesianGrid {...gridProps} />
              <XAxis
                dataKey="name"
                tick={axisStyle}
                tickLine={false}
                axisLine={{ stroke: 'var(--c-border)' }}
                height={40}
                tickFormatter={(v: string) => truncate(String(v), 16)}
              />
              <YAxis
                tick={axisStyle}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatAxisNumber}
                width={56}
              />
              <Tooltip
                content={tooltipCard}
                cursor={{ fill: 'var(--c-accent-wash)' }}
              />
              <Bar
                dataKey="value"
                fill="var(--c-chart)"
                radius={[4, 4, 0, 0]}
                isAnimationActive
                animationDuration={500}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
}
