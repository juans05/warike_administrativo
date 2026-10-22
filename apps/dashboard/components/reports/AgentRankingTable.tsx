'use client';

import { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { formatSeconds } from '../../lib/date-range';
import { EmptyState, Input } from '../ui';
import { ChartCard, ChartSkeleton } from './ChartCard';
import { SortTh, useSort } from './SortTh';

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

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'conversations', label: 'Conversaciones' },
  { key: 'attended', label: 'Atendidas' },
  { key: 'resolved', label: 'Resueltas' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'avgResponseSeconds', label: 'T. respuesta' },
  { key: 'avgResolutionSeconds', label: 'T. resolución' },
];

export function AgentRankingTable({ data, loading }: { data: AgentRow[]; loading: boolean }) {
  const [search, setSearch] = useState('');
  const { sortKey, sortDir, toggleSort } = useSort<SortKey>('conversations');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q ? data.filter((r) => r.fullName?.toLowerCase().includes(q)) : data;
    return [...filtered].sort((a, b) => {
      const cmp = sortKey === 'fullName'
        ? (a.fullName || '').localeCompare(b.fullName || '')
        : (a[sortKey] ?? -1) - (b[sortKey] ?? -1);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, search, sortKey, sortDir]);

  return (
    <ChartCard
      title="Rendimiento por agente"
      description="Identifica quién tiene mayor carga de trabajo."
      aside={
        <div className="w-full sm:w-64">
          <Input label="Buscar agente" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nombre del agente" />
        </div>
      }
    >
      {loading ? (
        <ChartSkeleton className="h-48" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'Sin resultados' : 'Todavía no hay agentes'}
          description={search ? 'Prueba con otro nombre.' : 'Cuando sumes personas a tu equipo, verás cuánto atiende cada una.'}
          headingLevel="h4"
        />
      ) : (
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-border">
                <SortTh label="Agente" sortKey="fullName" active={sortKey === 'fullName'} dir={sortDir} onSort={toggleSort} />
                {COLUMNS.map((c) => (
                  <SortTh key={c.key} label={c.label} sortKey={c.key} active={sortKey === c.key} dir={sortDir} onSort={toggleSort} align="right" />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm tabular-nums">
              {rows.map((r) => (
                <tr key={r.userId}>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary-hover">
                        {avatarLetter(r.fullName)}
                      </div>
                      <span className="truncate font-medium text-text">{r.fullName || 'Sin nombre'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-text">{r.conversations}</td>
                  <td className="px-3 py-3 text-right text-text-muted">{r.attended}</td>
                  <td className="px-3 py-3 text-right text-text-muted">{r.resolved}</td>
                  <td className="px-3 py-3 text-right text-text-muted">{r.pending}</td>
                  <td className="px-3 py-3 text-right text-text-muted">{r.avgResponseSeconds != null ? formatSeconds(r.avgResponseSeconds) : '—'}</td>
                  <td className="px-3 py-3 text-right text-text-muted">{r.avgResolutionSeconds != null ? formatSeconds(r.avgResolutionSeconds) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ChartCard>
  );
}
