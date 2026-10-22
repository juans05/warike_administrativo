'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { chartColors } from '../../lib/chartColors';
import { STATUS_COLORS, STATUS_LABELS } from '../../lib/report-colors';
import type { ConversationBucket } from '../../hooks/useReports';
import { ChartCard, ChartSkeleton, EmptyChart, TooltipBox } from './ChartCard';

interface StatusSlice { status: ConversationBucket; label: string; count: number }

function SliceTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const slice = payload[0];
  return (
    <TooltipBox>
      <p className="font-semibold">{slice.name}</p>
      <p>{slice.value} conversaciones ({slice.payload.pct.toFixed(1)}%)</p>
    </TooltipBox>
  );
}

export function StatusDonutChart({ data, loading }: { data: StatusSlice[]; loading: boolean }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const chartData = data.map((d) => ({ ...d, pct: total > 0 ? (d.count / total) * 100 : 0 }));

  return (
    <ChartCard title="Estado de conversaciones" description="Distribución del total en el período seleccionado.">
      {loading ? (
        <ChartSkeleton className="h-56" />
      ) : total === 0 ? (
        <EmptyChart />
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative h-40 w-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="count" nameKey="label" innerRadius={48} outerRadius={72} paddingAngle={2} strokeWidth={2} stroke={chartColors.surface}>
                  {chartData.map((d) => (
                    <Cell key={d.status} fill={STATUS_COLORS[d.status]} />
                  ))}
                </Pie>
                <Tooltip content={<SliceTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-semibold tabular-nums text-text">{total}</span>
              <span className="text-xs text-text-muted">Total</span>
            </div>
          </div>

          <ul className="min-w-0 flex-1 space-y-2">
            {chartData.map((d) => (
              <li key={d.status} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-1.5 text-text">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLORS[d.status] }} />
                  <span className="truncate">{STATUS_LABELS[d.status]}</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-text">
                  {d.count} <span className="font-normal text-text-muted">({d.pct.toFixed(0)}%)</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}
