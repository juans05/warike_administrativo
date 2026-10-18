'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { STATUS_LABELS, STATUS_TONE } from '../../lib/report-colors';
import type { ConversationBucket } from '../../hooks/useReports';
import { Badge, EmptyState, Input } from '../ui';
import { ChartCard, ChartSkeleton } from './ChartCard';
import { SortTh, useSort } from './SortTh';
import { useCustomerLabels } from '../../hooks/useCustomerLabels';

interface PhoneRow {
  phone: string;
  contactName: string | null;
  conversations: number;
  lastConversationAt: string;
  status: ConversationBucket;
}

type SortKey = 'phone' | 'contactName' | 'conversations' | 'lastConversationAt';

export function ConversationsByPhoneTable({ data, loading }: { data: PhoneRow[]; loading: boolean }) {
  const [search, setSearch] = useState('');
  const { customers } = useCustomerLabels();
  const { sortKey, sortDir, toggleSort } = useSort<SortKey>('conversations');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? data.filter((r) => r.phone.toLowerCase().includes(q) || (r.contactName || '').toLowerCase().includes(q))
      : data;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'conversations') cmp = a.conversations - b.conversations;
      else if (sortKey === 'lastConversationAt') cmp = new Date(a.lastConversationAt).getTime() - new Date(b.lastConversationAt).getTime();
      else cmp = String(a[sortKey] || '').localeCompare(String(b[sortKey] || ''));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, search, sortKey, sortDir]);

  return (
    <ChartCard
      title="Conversaciones por teléfono"
      description={`Ranking de ${customers} por cantidad de conversaciones.`}
      aside={
        <div className="w-full sm:w-64">
          <Input label="Buscar" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Teléfono o nombre" />
        </div>
      }
    >
      {loading ? (
        <ChartSkeleton className="h-48" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Sin resultados"
          description={search ? 'Prueba con otro teléfono o nombre.' : `Cuando tus ${customers} escriban, aparecerán aquí.`}
          headingLevel="h4"
        />
      ) : (
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-border">
                <SortTh label="Teléfono" sortKey="phone" active={sortKey === 'phone'} dir={sortDir} onSort={toggleSort} />
                <SortTh label="Contacto" sortKey="contactName" active={sortKey === 'contactName'} dir={sortDir} onSort={toggleSort} />
                <SortTh label="Conversaciones" sortKey="conversations" active={sortKey === 'conversations'} dir={sortDir} onSort={toggleSort} align="right" />
                <SortTh label="Última conversación" sortKey="lastConversationAt" active={sortKey === 'lastConversationAt'} dir={sortDir} onSort={toggleSort} />
                <th scope="col" className="px-3 text-left text-xs font-medium text-text-muted">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {rows.map((r) => (
                <tr key={r.phone}>
                  <td className="px-3 py-3 font-medium tabular-nums text-text">{r.phone}</td>
                  <td className="px-3 py-3 text-text-muted">{r.contactName || '—'}</td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums text-text">{r.conversations}</td>
                  <td className="px-3 py-3 text-text-muted">{new Date(r.lastConversationAt).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  <td className="px-3 py-3"><Badge tone={STATUS_TONE[r.status]}>{STATUS_LABELS[r.status]}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ChartCard>
  );
}
