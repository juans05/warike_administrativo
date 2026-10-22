'use client';

import { useMemo } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { chartColors } from '../../lib/chartColors';
import { Badge } from '../ui';
import { ChartCard, ChartSkeleton, EmptyChart, TooltipBox } from './ChartCard';

interface HourPoint { hour: number; count: number }

function formatHour(h: number) {
  return `${String(h).padStart(2, '0')}:00`;
}

function HourTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const row: HourPoint = payload[0]?.payload;
  return (
    <TooltipBox>
      <p className="font-semibold">{formatHour(row.hour)}</p>
      <p>{row.count} conversación{row.count === 1 ? '' : 'es'}</p>
    </TooltipBox>
  );
}

export function ConversationsByHourChart({ data, loading }: { data: HourPoint[]; loading: boolean }) {
  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const withCount = data.filter((d) => d.count > 0);
    if (withCount.length === 0) return { peak: null, min: null, avg: 0 };
    const peak = withCount.reduce((a, b) => (b.count > a.count ? b : a));
    const min = withCount.reduce((a, b) => (b.count < a.count ? b : a));
    const avg = data.reduce((sum, d) => sum + d.count, 0) / data.length;
    return { peak, min, avg };
  }, [data]);

  return (
    <ChartCard title="Inicio de conversaciones por hora" description="Identifica los horarios con mayor demanda de atención.">
      {loading ? (
        <ChartSkeleton />
      ) : !stats || data.every((d) => d.count === 0) ? (
        <EmptyChart />
      ) : (
        <>
          <div className="mb-2 flex flex-wrap gap-2">
            {stats.peak && (
              <Badge tone="primary"><ArrowUp size={16} aria-hidden />Pico: {formatHour(stats.peak.hour)} · {stats.peak.count} conversaciones</Badge>
            )}
            {stats.min && (
              <Badge><ArrowDown size={16} aria-hidden />Mínimo: {formatHour(stats.min.hour)} · {stats.min.count} conversaciones</Badge>
            )}
            <Badge>Promedio: {stats.avg.toFixed(1)} por hora</Badge>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 16, right: 8, left: -16, bottom: 0 }} barCategoryGap={2}>
              <CartesianGrid vertical={false} stroke={chartColors.border} />
              <XAxis
                dataKey="hour"
                tickFormatter={formatHour}
                tick={{ fontSize: 12, fill: chartColors.textMuted }}
                axisLine={{ stroke: chartColors.border }}
                tickLine={false}
                interval={1}
              />
              <YAxis tick={{ fontSize: 12, fill: chartColors.textMuted }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
              <Tooltip content={<HourTooltip />} cursor={{ fill: chartColors.border, fillOpacity: 0.4 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={24}>
                {data.map((d) => (
                  <Cell key={d.hour} fill={stats.peak && d.hour === stats.peak.hour ? chartColors.primary : chartColors.textMuted} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </ChartCard>
  );
}
