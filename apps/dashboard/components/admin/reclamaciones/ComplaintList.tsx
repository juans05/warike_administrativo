'use client';

import { BookOpen, PartyPopper } from 'lucide-react';
import { Badge, DataList, EmptyState, Tabs, cn } from '../../ui';
import { formatDate, type Complaint } from './types';

export type ComplaintTab = 'pending' | 'resolved';

export function ComplaintTypeBadge({ type }: { type: Complaint['type'] }) {
  return <Badge tone={type === 'reclamo' ? 'danger' : 'warning'}>{type === 'reclamo' ? 'Reclamo' : 'Queja'}</Badge>;
}

export function ComplaintList({ complaints, pendingCount, resolvedCount, tab, onTab, loading, selectedId, onSelect }: {
  complaints: Complaint[];
  pendingCount: number;
  resolvedCount: number;
  tab: ComplaintTab;
  onTab(tab: ComplaintTab): void;
  loading: boolean;
  selectedId: string | null;
  onSelect(id: string): void;
}) {
  const tabs = [
    { key: 'pending', label: 'Pendientes', badge: pendingCount },
    { key: 'resolved', label: 'Resueltos', badge: resolvedCount },
  ];

  return (
    <>
      <div className="sticky top-0 z-10 bg-surface px-2">
        <Tabs tabs={tabs} value={tab} onChange={(key) => onTab(key as ComplaintTab)} aria-label="Estado de los reclamos" />
      </div>
      <DataList
        items={complaints}
        loading={loading}
        empty={
          tab === 'pending' ? (
            <EmptyState icon={PartyPopper} headingLevel="h3" title="No hay reclamos pendientes" description="Todo lo recibido ya tiene respuesta." />
          ) : (
            <EmptyState icon={BookOpen} headingLevel="h3" title="Todavía no hay resueltos" description="Los que respondas aparecerán aquí." />
          )
        }
        renderItem={(c) => (
          <button
            type="button"
            onClick={() => onSelect(c.id)}
            aria-current={c.id === selectedId || undefined}
            className={cn(
              'flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors duration-200 motion-reduce:transition-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
              c.id === selectedId ? 'bg-primary-soft' : 'hover:bg-background',
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-medium text-text">{c.folio}</span>
              <span className="shrink-0 text-xs text-text-muted">{formatDate(c.createdAt)}</span>
            </span>
            <span className="truncate text-sm text-text">{c.consumerFullName}</span>
            <span className="truncate text-xs text-text-muted">{c.consumerEmail}</span>
            <span className="pt-0.5"><ComplaintTypeBadge type={c.type} /></span>
          </button>
        )}
      />
    </>
  );
}
