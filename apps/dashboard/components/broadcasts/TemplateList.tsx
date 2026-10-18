'use client';

import React from 'react';
import { FileText, Plus, Power, RefreshCw, RotateCw, Search, Trash2 } from 'lucide-react';
import { Template, TemplateStatus } from '../../hooks/useTemplates';
import { Badge, Button, Card, EmptyState, Input } from '../ui';

const STATUS_CONFIG: Record<TemplateStatus, { label: string; tone: 'neutral' | 'primary' | 'success' | 'danger' | 'warning' }> = {
  PENDING:   { label: 'Pendiente',   tone: 'neutral' },
  SUBMITTED: { label: 'En revisión', tone: 'primary' },
  APPROVED:  { label: 'Aprobada',    tone: 'success' },
  REJECTED:  { label: 'Rechazada',   tone: 'danger' },
  FAILED:    { label: 'Error envío', tone: 'warning' },
};

interface TemplateListProps {
  templates: Template[];
  search: string;
  onSearch: (s: string) => void;
  syncing: boolean;
  onSync: () => void;
  onNew: () => void;
  resendingId: string | null;
  deletingId: string | null;
  togglingId: string | null;
  onResend: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

export function TemplateList({
  templates, search, onSearch, syncing, onSync, onNew,
  resendingId, deletingId, togglingId, onResend, onDelete, onToggle,
}: TemplateListProps) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1">
          <Input label="Buscar plantillas" type="search" value={search} onChange={e => onSearch(e.target.value)} placeholder="Nombre de la plantilla" />
        </div>
        <Button variant="secondary" icon={RefreshCw} loading={syncing} onClick={onSync}>Sincronizar</Button>
        <Button variant="secondary" icon={Plus} onClick={onNew}>Agregar plantilla</Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <EmptyState
            icon={search ? Search : FileText}
            title={search ? 'Sin resultados' : 'Sin plantillas aún'}
            description={search ? 'Prueba con otro nombre.' : 'Crea una plantilla: se guarda y se envía a Meta para su aprobación.'}
            headingLevel="h3"
            action={search ? undefined : <Button variant="secondary" icon={Plus} onClick={onNew}>Agregar plantilla</Button>}
          />
        </Card>
      ) : (
        <Card padding="sm" className="px-0 py-0">
          <ul className="divide-y divide-border">
            {templates.map(t => {
              const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.PENDING;
              const isResendable = t.status === 'FAILED' || t.status === 'REJECTED' || t.status === 'SUBMITTED';
              return (
                <li key={t.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-text">{t.name}</p>
                      <Badge>{t.category}</Badge>
                      <Badge tone={cfg.tone}>{cfg.label}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {t.languageCode?.toUpperCase()} · {new Date(t.createdAt).toLocaleDateString('es-PE')}
                    </p>
                    {t.errorMessage && (
                      <p className="mt-1 rounded-control bg-danger/10 px-2 py-1 text-xs text-danger">{t.errorMessage}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {isResendable && (
                      <Button size="sm" variant="secondary" icon={RotateCw} loading={resendingId === t.id} onClick={() => onResend(t.id)}>Reenviar</Button>
                    )}
                    {t.status === 'APPROVED' && (
                      <Button size="sm" variant="secondary" icon={Power} loading={togglingId === t.id} onClick={() => onToggle(t.id)} title="Activar / Desactivar en PlazBot">
                        Activar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Trash2}
                      loading={deletingId === t.id}
                      onClick={() => onDelete(t.id)}
                      aria-label={`Eliminar plantilla ${t.name}`}
                      title="Eliminar plantilla"
                      className="w-9 px-0"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </section>
  );
}
