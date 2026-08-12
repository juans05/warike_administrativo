'use client';

import React, { useMemo, useState } from 'react';
import { formatSeconds } from '../../lib/date-range';

interface AgentRow {
  userId: string;
  fullName: string;
  conversations: number;
  attended: number;
  resolved: number;
  pending: number;
  avgResponseSeconds: number | null;
  avgResolutionSeconds: number | null;
}

type SortKey = 'fullName' | 'conversations' | 'attended' | 'resolved' | 'pending' | 'avgResponseSeconds' | 'avgResolutionSeconds';

function avatarLetter(name: string) {
  return (name || '?').trim()[0]?.toUpperCase() || '?';
}

function SortHeader({ label, sortKey, active, dir, onClick, align = 'right' }: {
  label: string; sortKey: SortKey; active: boolean; dir: 'asc' | 'desc'; onClick: (k: SortKey) => void; align?: 'left' | 'right';
}) {
  return (
    <th
      onClick={() => onClick(sortKey)}
      className={`px-4 py-2.5 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer select-none hover:text-gray-600 ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      {label} {active && (dir === 'asc' ? '↑' : '↓')}
    </th>
  );
}

export function AgentRankingTable({ data, loading }: { data: AgentRow[]; loading: boolean }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('conversations');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let filtered = data;
    if (q) filtered = data.filter(r => r.fullName?.toLowerCase().includes(q));
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'fullName') cmp = (a.fullName || '').localeCompare(b.fullName || '');
      else cmp = (a[sortKey] ?? -1) - (b[sortKey] ?? -1);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [data, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h3 className="text-sm font-black text-gray-900">Rendimiento por agente</h3>
          <p className="text-xs text-gray-400 mt-0.5">Identifica quién tiene mayor carga de trabajo.</p>
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar agente..."
          className="px-3 py-2 border border-gray-200 rounded-xl text-xs w-full sm:w-64 focus:ring-2 focus:ring-orange-400 outline-none"
        />
      </div>

      {loading ? (
        <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
      ) : rows.length === 0 ? (
        <p className="text-xs font-bold text-gray-400 text-center py-10">Todavía no hay agentes en el equipo de esta sede.</p>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-100">
                <SortHeader label="Agente" sortKey="fullName" active={sortKey === 'fullName'} dir={sortDir} onClick={toggleSort} align="left" />
                <SortHeader label="Conversaciones" sortKey="conversations" active={sortKey === 'conversations'} dir={sortDir} onClick={toggleSort} />
                <SortHeader label="Atendidas" sortKey="attended" active={sortKey === 'attended'} dir={sortDir} onClick={toggleSort} />
                <SortHeader label="Resueltas" sortKey="resolved" active={sortKey === 'resolved'} dir={sortDir} onClick={toggleSort} />
                <SortHeader label="Pendientes" sortKey="pending" active={sortKey === 'pending'} dir={sortDir} onClick={toggleSort} />
                <SortHeader label="T. respuesta" sortKey="avgResponseSeconds" active={sortKey === 'avgResponseSeconds'} dir={sortDir} onClick={toggleSort} />
                <SortHeader label="T. resolución" sortKey="avgResolutionSeconds" active={sortKey === 'avgResolutionSeconds'} dir={sortDir} onClick={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.userId} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-[11px] font-black text-white flex-shrink-0">
                        {avatarLetter(r.fullName)}
                      </div>
                      <span className="text-xs font-bold text-gray-800 truncate">{r.fullName || 'Sin nombre'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-black text-gray-900 text-right">{r.conversations}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 text-right">{r.attended}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 text-right">{r.resolved}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 text-right">{r.pending}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 text-right">{r.avgResponseSeconds != null ? formatSeconds(r.avgResponseSeconds) : '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 text-right">{r.avgResolutionSeconds != null ? formatSeconds(r.avgResolutionSeconds) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
