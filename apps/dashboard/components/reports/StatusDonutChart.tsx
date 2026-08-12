'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { STATUS_COLORS, STATUS_LABELS } from '../../lib/report-colors';
import type { ConversationBucket } from '../../hooks/useReports';

interface StatusSlice { status: ConversationBucket; label: string; count: number }

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const slice = payload[0];
  return (
    <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2 shadow-lg">
      <p className="font-black">{slice.name}</p>
      <p className="text-gray-300">{slice.value} conversaciones ({slice.payload.pct.toFixed(1)}%)</p>
    </div>
  );
}

export function StatusDonutChart({ data, loading }: { data: StatusSlice[]; loading: boolean }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const chartData = data.map(d => ({ ...d, pct: total > 0 ? (d.count / total) * 100 : 0 }));

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-gray-900">Estado de conversaciones</h3>
      <p className="text-xs text-gray-400 mt-0.5">Distribución del total en el período seleccionado.</p>

      {loading ? (
        <div className="h-56 bg-gray-50 rounded-xl animate-pulse mt-4" />
      ) : total === 0 ? (
        <div className="h-56 flex items-center justify-center text-xs font-bold text-gray-400">Sin conversaciones en este período</div>
      ) : (
        <div className="flex items-center gap-4 mt-2">
          <div className="relative w-40 h-40 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                  strokeWidth={2}
                  stroke="#fcfcfb"
                >
                  {chartData.map((d) => (
                    <Cell key={d.status} fill={STATUS_COLORS[d.status].light} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-gray-900">{total}</span>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total</span>
            </div>
          </div>

          <div className="flex-1 space-y-2 min-w-0">
            {chartData.map((d) => (
              <div key={d.status} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1.5 text-gray-600 font-bold truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[d.status].light }} />
                  {STATUS_LABELS[d.status]}
                </span>
                <span className="text-gray-900 font-black flex-shrink-0">{d.count} <span className="text-gray-400 font-medium">({d.pct.toFixed(0)}%)</span></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
