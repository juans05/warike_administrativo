'use client';

import { useState } from 'react';
import { Check, ChevronDown, Filter, X } from 'lucide-react';
import { STATUS_LABELS, STATUS_TONE } from '../../lib/report-colors';
import type { ConversationBucket } from '../../hooks/useReports';
import { Badge, Card, Select, cn } from '../ui';

const ALL_STATUSES: ConversationBucket[] = ['attended', 'unassigned', 'pending', 'resolved'];

interface FiltersPanelProps {
  statusFilter: ConversationBucket[];
  onChangeStatusFilter: (statuses: ConversationBucket[]) => void;
  agentFilter: string | null;
  onChangeAgentFilter: (agentId: string | null) => void;
  agents: { userId: string; fullName: string }[];
  onClear: () => void;
}

export function FiltersPanel({ statusFilter, onChangeStatusFilter, agentFilter, onChangeAgentFilter, agents, onClear }: FiltersPanelProps) {
  const [open, setOpen] = useState(false);

  const toggleStatus = (status: ConversationBucket) => {
    onChangeStatusFilter(
      statusFilter.includes(status) ? statusFilter.filter((s) => s !== status) : [...statusFilter, status],
    );
  };

  const hasActiveFilters = statusFilter.length > 0 || !!agentFilter;
  const activeCount = statusFilter.length + (agentFilter ? 1 : 0);
  const agentName = agentFilter ? agents.find((a) => a.userId === agentFilter)?.fullName : null;

  return (
    <Card padding="sm" className="p-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-card px-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-text">
          <Filter size={16} aria-hidden className="text-text-muted" />
          Filtros
          {hasActiveFilters && <Badge tone="primary">{activeCount} activos</Badge>}
        </span>
        <ChevronDown size={16} aria-hidden className={cn('text-text-muted transition-transform duration-200 motion-reduce:transition-none', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-border px-5 pb-4 pt-4">
          <div>
            <p className="mb-1 text-sm font-medium text-text">Estado de conversación</p>
            <div className="flex flex-wrap gap-x-2">
              {ALL_STATUSES.map((status) => {
                const active = statusFilter.includes(status);
                return (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleStatus(status)}
                    className="flex min-h-11 items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <Badge tone={active ? STATUS_TONE[status] : 'neutral'}>
                      {active && <Check size={16} aria-hidden />}
                      {STATUS_LABELS[status]}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {agents.length > 0 && (
            <div className="sm:w-64">
              <Select label="Agente" value={agentFilter || ''} onChange={(e) => onChangeAgentFilter(e.target.value || null)}>
                <option value="">Todos los agentes</option>
                {agents.map((a) => (
                  <option key={a.userId} value={a.userId}>{a.fullName}</option>
                ))}
              </Select>
            </div>
          )}

          <p className="text-xs text-text-muted">
            Filtra los gráficos, tablas y tiempos de abajo. Las tarjetas de arriba siempre muestran el desglose completo del período.
          </p>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <span className="text-xs text-text-muted">Filtros activos:</span>
              {statusFilter.map((s) => (
                <button key={s} type="button" onClick={() => toggleStatus(s)} aria-label={`Quitar filtro ${STATUS_LABELS[s]}`} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                  <Badge>{STATUS_LABELS[s]}<X size={16} aria-hidden /></Badge>
                </button>
              ))}
              {agentName && (
                <button type="button" onClick={() => onChangeAgentFilter(null)} aria-label={`Quitar filtro ${agentName}`} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                  <Badge>{agentName}<X size={16} aria-hidden /></Badge>
                </button>
              )}
              <button type="button" onClick={onClear} className="ml-auto min-h-11 rounded-control px-2 text-sm font-medium text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
