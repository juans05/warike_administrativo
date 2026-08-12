'use client';

import React, { useMemo, useState } from 'react';
import { STATUS_COLORS, STATUS_LABELS } from '../../lib/report-colors';
import type { ConversationBucket } from '../../hooks/useReports';

interface PhoneRow {
  phone: string;
  contactName: string | null;
  conversations: number;
  lastConversationAt: string;
  status: ConversationBucket;
}

type SortKey = 'phone' | 'contactName' | 'conversations' | 'lastConversationAt';

function StatusBadge({ status }: { status: ConversationBucket }) {
  const c = STATUS_COLORS[status];
  return (
    <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wide ${c.bg} ${c.text}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function SortHeader({ label, sortKey, active, dir, onClick, align = 'left' }: {
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

export function ConversationsByPhoneTable({ data, loading }: { data: PhoneRow[]; loading: boolean }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('conversations');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let filtered = data;
    if (q) {
      filtered = data.filter(r => r.phone.toLowerCase().includes(q) || (r.contactName || '').toLowerCase().includes(q));
    }
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'conversations') cmp = a.conversations - b.conversations;
      else if (sortKey === 'lastConversationAt') cmp = new Date(a.lastConversationAt).getTime() - new Date(b.lastConversationAt).getTime();
      else cmp = String(a[sortKey] || '').localeCompare(String(b[sortKey] || ''));
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
          <h3 className="text-sm font-black text-gray-900">Conversaciones por teléfono</h3>
          <p className="text-xs text-gray-400 mt-0.5">Ranking de clientes por cantidad de conversaciones.</p>
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por teléfono o nombre..."
          className="px-3 py-2 border border-gray-200 rounded-xl text-xs w-full sm:w-64 focus:ring-2 focus:ring-orange-400 outline-none"
        />
      </div>

      {loading ? (
        <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
      ) : rows.length === 0 ? (
        <p className="text-xs font-bold text-gray-400 text-center py-10">Sin resultados.</p>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-gray-100">
                <SortHeader label="Teléfono" sortKey="phone" active={sortKey === 'phone'} dir={sortDir} onClick={toggleSort} />
                <SortHeader label="Contacto" sortKey="contactName" active={sortKey === 'contactName'} dir={sortDir} onClick={toggleSort} />
                <SortHeader label="Conversaciones" sortKey="conversations" active={sortKey === 'conversations'} dir={sortDir} onClick={toggleSort} align="right" />
                <SortHeader label="Última conversación" sortKey="lastConversationAt" active={sortKey === 'lastConversationAt'} dir={sortDir} onClick={toggleSort} />
                <th className="px-4 py-2.5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.phone} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-xs font-bold text-gray-800">{r.phone}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{r.contactName || '—'}</td>
                  <td className="px-4 py-3 text-xs font-black text-gray-900 text-right">{r.conversations}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(r.lastConversationAt).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
