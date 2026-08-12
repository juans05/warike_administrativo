'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { EmptyChart } from './ConversationsByDayChart';

interface HourPoint { hour: number; count: number }

const BAR_COLOR = '#2a78d6';
const PEAK_COLOR = '#F26122';

function formatHour(h: number) {
  return `${String(h).padStart(2, '0')}:00`;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const row: HourPoint = payload[0]?.payload;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2 shadow-lg">
      <p className="font-black">{formatHour(row.hour)}</p>
      <p className="text-gray-300">{row.count} conversación{row.count === 1 ? '' : 'es'}</p>
    </div>
  );
}

export function ConversationsByHourChart({ data, loading }: { data: HourPoint[]; loading: boolean }) {
  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const withCount = data.filter(d => d.count > 0);
    if (withCount.length === 0) return { peak: null, min: null, avg: 0 };
    const peak = withCount.reduce((a, b) => (b.count > a.count ? b : a));
    const min = withCount.reduce((a, b) => (b.count < a.count ? b : a));
    const avg = data.reduce((sum, d) => sum + d.count, 0) / data.length;
    return { peak, min, avg };
  }, [data]);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div>
        <h3 className="text-sm font-black text-gray-900">Inicio de conversaciones por hora</h3>
        <p className="text-xs text-gray-400 mt-0.5">Identifica los horarios con mayor demanda de atención.</p>
      </div>

      {loading ? (
        <div className="h-64 bg-gray-50 rounded-xl animate-pulse mt-4" />
      ) : !stats || (data.every(d => d.count === 0)) ? (
        <EmptyChart label="Sin conversaciones en este período" />
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mt-3 mb-1">
            {stats.peak && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-orange-50 text-[#F26122]">
                🔺 Pico: {formatHour(stats.peak.hour)} — {stats.peak.count} conversaciones
              </span>
            )}
            {stats.min && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500">
                🔻 Mínimo: {formatHour(stats.min.hour)} — {stats.min.count} conversaciones
              </span>
            )}
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500">
              Promedio: {stats.avg.toFixed(1)} por hora
            </span>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 16, right: 8, left: -16, bottom: 0 }} barCategoryGap={2}>
              <CartesianGrid vertical={false} stroke="#e1e0d9" />
              <XAxis
                dataKey="hour"
                tickFormatter={formatHour}
                tick={{ fontSize: 10, fill: '#898781' }}
                axisLine={{ stroke: '#c3c2b7' }}
                tickLine={false}
                interval={1}
              />
              <YAxis tick={{ fontSize: 11, fill: '#898781' }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9f9f7' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={24}>
                {data.map((d) => (
                  <Cell key={d.hour} fill={stats.peak && d.hour === stats.peak.hour ? PEAK_COLOR : BAR_COLOR} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}
