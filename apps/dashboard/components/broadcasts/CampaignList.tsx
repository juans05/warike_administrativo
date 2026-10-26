'use client';

import React from 'react';
import { Eye, Megaphone, Pause, Pencil, Play, Plus } from 'lucide-react';
import { Broadcast, BroadcastStatus, formatOffset } from '../../hooks/useBroadcasts';
import { Badge, Button, Card, EmptyState } from '../ui';

const STATUS_TONE: Record<BroadcastStatus, 'neutral' | 'primary' | 'warning' | 'success' | 'danger'> = {
  DRAFT: 'neutral',
  SCHEDULED: 'primary',
  SENDING: 'warning',
  COMPLETED: 'success',
  FAILED: 'danger',
};
const STATUS_LABEL: Record<BroadcastStatus, string> = {
  DRAFT: 'Borrador', SCHEDULED: 'Programado', SENDING: 'Enviando',
  COMPLETED: 'Completado', FAILED: 'Fallido',
};

interface CampaignListProps {
  broadcasts: Broadcast[];
  /** Etiqueta del rubro en plural y minúsculas. */
  customers: string;
  onSend: (id: string) => void;
  onNew: () => void;
  onView: (b: Broadcast) => void;
  onEdit: (b: Broadcast) => void;
  onPause: (id: string) => void;
}

// Una masiva se edita mientras no salió; un recordatorio, siempre.
const editable = (b: Broadcast) => b.kind === 'reminder' || b.status === 'DRAFT' || b.status === 'SCHEDULED';

export function CampaignList({ broadcasts, customers, onSend, onNew, onView, onEdit, onPause }: CampaignListProps) {
  if (broadcasts.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Megaphone}
          title="No hay campañas de WhatsApp aún"
          description={`Crea tu primera campaña masiva para llegar a tus ${customers}.`}
          action={<Button variant="secondary" icon={Plus} onClick={onNew}>Nueva campaña</Button>}
        />
      </Card>
    );
  }

  return (
    <Card padding="sm" className="px-0 py-0">
      <ul className="divide-y divide-border">
        {broadcasts.map(b => {
          const reminder = b.kind === 'reminder';
          const active = reminder && b.status === 'SCHEDULED';
          return (
          <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-text">{b.campaignName}</h3>
                {reminder
                  ? <Badge tone={active ? 'success' : 'neutral'}>{active ? 'Activa' : 'Pausada'}</Badge>
                  : <Badge tone={STATUS_TONE[b.status]}>{STATUS_LABEL[b.status]}</Badge>}
                {reminder && <Badge>Recordatorio · {formatOffset(b.reminderOffsetMin)} antes</Badge>}
              </div>
              <p className="truncate text-sm text-text-muted">{b.templateBody}</p>
              <p className="flex flex-wrap items-center gap-x-2 text-xs tabular-nums text-text-muted">
                <span>{b.messagesSent}{b.totalRecipients ? ` de ${b.totalRecipients}` : ''} enviados</span>
                {!!b.messagesFailed && <span className="text-danger">· {b.messagesFailed} fallidos</span>}
                {b.whatsappNumber && <span>· {b.whatsappNumber.phoneNumber}</span>}
                <span>· {new Date(b.createdAt).toLocaleDateString('es-PE')}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" icon={Eye} onClick={() => onView(b)}>Ver</Button>
              {editable(b) && <Button size="sm" variant="secondary" icon={Pencil} onClick={() => onEdit(b)}>Editar</Button>}
              {active && <Button size="sm" variant="secondary" icon={Pause} onClick={() => onPause(b.id)}>Pausar</Button>}
              {b.status === 'DRAFT' && (
                <Button size="sm" variant="secondary" icon={Play} onClick={() => onSend(b.id)}>{reminder ? 'Activar' : 'Enviar'}</Button>
              )}
            </div>
          </li>
          );
        })}
      </ul>
    </Card>
  );
}
