'use client';

import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { STATUS_COLORS } from '../../lib/report-colors';
import { formatDateLabel } from '../../lib/date-range';

interface DayPoint { date: string; total: number; attended: number; pending: number; resolved: number }

const SERIES: { key: keyof Omit<DayPoint, 'date'>; label: string; color: string }[] = [
  { key: 'total', label: 'Total', color: '#F26122' },
  { key: 'attended', label: 'Atendidas', color: STATUS_COLORS.attended.light },
  { key: 'pending', label: 'Pendientes', color: STATUS_COLORS.pending.light },
  { key: 'resolved', label: 'Resueltas', color: STATUS_COLORS.resolved.light },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const row: DayPoint = payload[0]?.payload;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-xl p-3 shadow-lg min-w-[160px]">
      <p className="font-black mb-1.5">{formatDateLabel(new Date(label))}</p>
      {SERIES.map(s => (
        <div key={s.key} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-gray-300">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
          <span className="font-bold">{row[s.key]}</span>
        </div>
      ))}
    </div>
  );
}

export function ConversationsByDayChart({ data, loading }: { data: DayPoint[]; loading: boolean }) {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => setHidden(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <div>
          <h3 className="text-sm font-black text-gray-900">Conversaciones por día</h3>
          <p className="text-xs text-gray-400 mt-0.5">Evolución del volumen de conversaciones en el período seleccionado.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {SERIES.map(s => (
            <button
              key={s.key}
              type="button"
              onClick={() => toggle(s.key)}
              className={`flex items-center gap-1.5 text-[11px] font-bold transition-opacity ${hidden[s.key] ? 'opacity-35' : 'opacity-100'}`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-gray-600">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-80 bg-gray-50 rounded-xl animate-pulse mt-4" />
      ) : data.length === 0 ? (
        <EmptyChart label="Sin conversaciones en este período" />
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e1e0d9" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => formatDateLabel(new Date(v))}
              tick={{ fontSize: 11, fill: '#898781' }}
              axisLine={{ stroke: '#c3c2b7' }}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis tick={{ fontSize: 11, fill: '#898781' }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
            <Tooltip content={<CustomTooltip />} />
            {SERIES.map(s => (
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
                activeDot={{ r: 4, strokeWidth: 2, stroke: '#fcfcfb' }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-64 flex flex-col items-center justify-center text-center gap-2 mt-4">
      <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14" />
      </svg>
      <p className="text-xs font-bold text-gray-400">{label}</p>
    </div>
  );
}
