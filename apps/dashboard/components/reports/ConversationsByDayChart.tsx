'use client';

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartColors } from '../../lib/chartColors';
import { STATUS_COLORS } from '../../lib/report-colors';
import { formatDateLabel } from '../../lib/date-range';
import { cn } from '../ui';
import { ChartCard, ChartSkeleton, EmptyChart, TooltipBox } from './ChartCard';

interface DayPoint { date: string; total: number; attended: number; pending: number; resolved: number }

const SERIES: { key: keyof Omit<DayPoint, 'date'>; label: string; color: string }[] = [
  { key: 'total', label: 'Total', color: chartColors.text },
  { key: 'attended', label: 'Atendidas', color: STATUS_COLORS.attended },
  { key: 'pending', label: 'Pendientes', color: STATUS_COLORS.pending },
  { key: 'resolved', label: 'Resueltas', color: STATUS_COLORS.resolved },
];

function DayTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const row: DayPoint = payload[0]?.payload;
  return (
    <TooltipBox>
      <p className="mb-1.5 font-semibold">{formatDateLabel(new Date(label))}</p>
      {SERIES.map((s) => (
        <div key={s.key} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
          <span className="font-semibold tabular-nums">{row[s.key]}</span>
        </div>
      ))}
    </TooltipBox>
  );
}

export function ConversationsByDayChart({ data, loading }: { data: DayPoint[]; loading: boolean }) {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setHidden((prev) => ({ ...prev, [key]: !prev[key] }));

  const legend = (
    <div className="flex flex-wrap items-center gap-x-1">
      {SERIES.map((s) => (
        <button
          key={s.key}
          type="button"
          aria-pressed={!hidden[s.key]}
          onClick={() => toggle(s.key)}
          className={cn(
            'flex min-h-11 items-center gap-1.5 rounded-control px-2 text-xs font-medium text-text transition-opacity',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            hidden[s.key] && 'opacity-40',
          )}
        >
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
          {s.label}
        </button>
      ))}
    </div>
  );

  return (
    <ChartCard title="Conversaciones por día" description="Evolución del volumen de conversaciones en el período seleccionado." aside={legend}>
      {loading ? (
        <ChartSkeleton className="h-80" />
      ) : data.length === 0 ? (
        <EmptyChart />
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={chartColors.border} />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => formatDateLabel(new Date(v))}
              tick={{ fontSize: 12, fill: chartColors.textMuted }}
              axisLine={{ stroke: chartColors.border }}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis tick={{ fontSize: 12, fill: chartColors.textMuted }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
            <Tooltip content={<DayTooltip />} />
            {SERIES.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                fill={s.color}
                fillOpacity={hidden[s.key] ? 0 : 0.1}
                hide={hidden[s.key]}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: chartColors.surface }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
